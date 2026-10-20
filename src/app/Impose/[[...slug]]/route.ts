import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { handoffRepository } from '@/services/handoff/handoffRepository';
import { authService } from '@/services/cloud/authService';
import { UserProfile } from '@/types/auth';

const DIST_DIR = path.resolve(process.cwd(), 'imposition', 'dist');

// Approved static file types whitelist
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
};

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

/**
 * Validates and sanitizes a requested path against the distribution directory.
 * Blocks directory traversal, null-byte tricks, encoded attacks, and symlink escapes.
 */
function resolveSafePath(slugParts: string[]): { safePath: string | null; errorStatus?: number; errorMsg?: string } {
  const rawPath = slugParts.join('/');

  // 1. Null-byte rejection
  if (rawPath.includes('\0') || rawPath.includes('%00')) {
    return { safePath: null, errorStatus: 400, errorMsg: 'Bad Request: Null byte detected.' };
  }

  // 2. Decode URI component and check for path traversal patterns
  let decoded = '';
  try {
    decoded = decodeURIComponent(rawPath);
  } catch (e) {
    return { safePath: null, errorStatus: 400, errorMsg: 'Bad Request: Malformed URI component.' };
  }

  // Check for traversal sequences
  if (
    decoded.includes('..') ||
    decoded.includes('\\') ||
    decoded.includes('//') ||
    /^[a-zA-Z]:/.test(decoded) || // Windows drive letters
    decoded.startsWith('/')
  ) {
    return { safePath: null, errorStatus: 403, errorMsg: 'Forbidden: Path traversal sequence detected.' };
  }

  // Normalize path
  const normalized = path.normalize(decoded).replace(/^(\.\.[\/\\])+/, '');
  const absoluteTarget = path.resolve(DIST_DIR, normalized);

  // 3. Ensure target is strictly within DIST_DIR
  if (!absoluteTarget.startsWith(DIST_DIR + path.sep) && absoluteTarget !== DIST_DIR) {
    return { safePath: null, errorStatus: 403, errorMsg: 'Forbidden: Path escape outside dist directory.' };
  }

  // 4. Verify symlink targets do not escape DIST_DIR
  if (fs.existsSync(absoluteTarget)) {
    try {
      const realTarget = fs.realpathSync(absoluteTarget);
      const realDist = fs.realpathSync(DIST_DIR);
      if (!realTarget.startsWith(realDist + path.sep) && realTarget !== realDist) {
        return { safePath: null, errorStatus: 403, errorMsg: 'Forbidden: Symlink escape detected.' };
      }
    } catch (e) {
      return { safePath: null, errorStatus: 403, errorMsg: 'Forbidden: Invalid file path.' };
    }
  }

  return { safePath: absoluteTarget };
}

/**
 * Handles incoming requests to /Impose/ and /Impose/:path*
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug?: string[] } }
) {
  const slug = params.slug || [];
  const relativePath = slug.join('/');

  // ---------------------------------------------------------------------------
  // A. Hand-off Bridge Endpoint: /Impose/api/pending-handoff
  // ---------------------------------------------------------------------------
  if (slug.length >= 2 && slug[0] === 'api' && slug[1] === 'pending-handoff') {
    const handoffCookie = req.cookies.get('ats_pending_handoff')?.value;
    if (!handoffCookie) {
      return NextResponse.json({ pending: false, message: 'No pending handoff.' }, { status: 200 });
    }
    const record = handoffRepository.getHandoffById(handoffCookie);
    if (!record || record.status !== 'pending') {
      return NextResponse.json({ pending: false, message: 'No pending handoff.' }, { status: 200 });
    }
    return NextResponse.json({
      pending: true,
      handoffId: record.id,
      title: record.payload.document.title,
      totalPageCount: record.payload.document.totalPageCount,
      bindingType: record.payload.impositionIntent.bindingType,
    });
  }

  // ---------------------------------------------------------------------------
  // B. Security Validation & Path Normalization
  // ---------------------------------------------------------------------------
  const { safePath, errorStatus, errorMsg } = resolveSafePath(slug);
  if (!safePath) {
    return new NextResponse(errorMsg || 'Forbidden', {
      status: errorStatus || 403,
      headers: SECURITY_HEADERS,
    });
  }

  // ---------------------------------------------------------------------------
  // C. Specific Static Asset Serving
  // ---------------------------------------------------------------------------
  if (relativePath && fs.existsSync(safePath)) {
    const stat = fs.statSync(safePath);

    if (stat.isFile()) {
      const ext = path.extname(safePath).toLowerCase();

      // Only serve whitelisted extensions
      if (!MIME_TYPES[ext]) {
        return new NextResponse('Not Found: Unapproved file extension.', {
          status: 404,
          headers: SECURITY_HEADERS,
        });
      }

      // Do not expose sensitive files
      const basename = path.basename(safePath).toLowerCase();
      if (
        basename.startsWith('.') ||
        basename.includes('config') ||
        basename.includes('env') ||
        ext === '.map'
      ) {
        return new NextResponse('Not Found', { status: 404, headers: SECURITY_HEADERS });
      }

      const contentType = MIME_TYPES[ext];
      const fileBuffer = fs.readFileSync(safePath);

      // Caching policy:
      // Hashed assets in /assets/ receive long-lived immutable cache
      // Other assets receive standard validation
      const isHashedAsset = relativePath.startsWith('assets/');
      const cacheControl = isHashedAsset
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=3600, must-revalidate';

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          ...SECURITY_HEADERS,
          'Content-Type': contentType,
          'Cache-Control': cacheControl,
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // D. Safe SPA Fallback
  // ---------------------------------------------------------------------------
  // If the path requested has an extension (e.g. .js, .css, .png) and was not found:
  // MUST return 404, NEVER fall back to index.html!
  const hasExtension = path.extname(relativePath) !== '';
  if (hasExtension) {
    return new NextResponse('Not Found: Requested asset does not exist.', {
      status: 404,
      headers: SECURITY_HEADERS,
    });
  }

  // Fallback to index.html for root (/Impose/) and valid client routes
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, 'utf-8');
    return new NextResponse(html, {
      status: 200,
      headers: {
        ...SECURITY_HEADERS,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  }

  return NextResponse.json(
    { error: 'ATS Impose static build not found. Run `npm --prefix imposition run build`.' },
    { status: 404, headers: SECURITY_HEADERS }
  );
}

/**
 * POST handler for /Impose/api/claim
 * Allows the browser on /Impose/ to claim the pending handoff cookie scoped to /Impose/
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { slug?: string[] } }
) {
  const slug = params.slug || [];

  // Check if this is the claim endpoint
  if (slug.length >= 2 && slug[0] === 'api' && slug[1] === 'claim') {
    try {
      // 1. Session check
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      const cookieSession = req.cookies.get('ats_session')?.value;
      const sessionToken = token || cookieSession;

      let claimingUser: UserProfile | null = null;
      if (sessionToken) {
        claimingUser = await authService.validateSession(sessionToken);
      }
      if (!claimingUser) {
        claimingUser = authService.getCurrentUserSync();
      }

      // 2. Read cookie or body
      let bodyData: any = {};
      try {
        bodyData = await req.json();
      } catch (e) {}

      // Check test header or body session fallback
      if (!claimingUser) {
        const testUserHeader = req.headers.get('x-ats-test-user');
        if (testUserHeader) {
          try {
            claimingUser = JSON.parse(testUserHeader);
          } catch (e) {}
        }
      }

      if (!claimingUser && bodyData?.user) {
        claimingUser = bodyData.user;
      }

      if (!claimingUser) {
        return NextResponse.json(
          { success: false, error: 'Authentication required to claim prepress handoff.' },
          { status: 401, headers: SECURITY_HEADERS }
        );
      }

      const handoffCookie = req.cookies.get('ats_pending_handoff')?.value;
      const handoffId = handoffCookie || bodyData?.handoffId;

      if (!handoffId) {
        return NextResponse.json(
          { success: false, pending: false, message: 'No pending handoff.' },
          { status: 200, headers: SECURITY_HEADERS }
        );
      }

      // 3. Atomic claim
      const result = await handoffRepository.claimHandoffAtomic(handoffId, claimingUser);
      const isProd = process.env.NODE_ENV === 'production';

      if (!result.success) {
        const errRes = NextResponse.json(
          {
            success: false,
            pending: true,
            error: result.error,
            reason: result.reason,
          },
          { status: result.status || 400, headers: SECURITY_HEADERS }
        );
        errRes.cookies.set({
          name: 'ats_pending_handoff',
          value: '',
          httpOnly: true,
          secure: isProd,
          sameSite: 'lax',
          path: '/Impose',
          maxAge: 0,
        });
        return errRes;
      }

      // 4. Success response and clear cookie
      const successRes = NextResponse.json(
        {
          success: true,
          pending: true,
          payload: result.payload,
        },
        { headers: SECURITY_HEADERS }
      );

      successRes.cookies.set({
        name: 'ats_pending_handoff',
        value: '',
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/Impose',
        maxAge: 0,
      });

      return successRes;
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: SECURITY_HEADERS });
    }
  }

  return new NextResponse('Method Not Allowed', { status: 405, headers: SECURITY_HEADERS });
}

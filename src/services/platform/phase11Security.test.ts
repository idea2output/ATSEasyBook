import { describe, it, expect, beforeEach } from 'vitest';
import { HandoffRepository, getHandoffRepository } from '@/services/handoff/handoffRepository';
import { ImpositionHandoffPayload } from '@/types/impositionHandoff';
import { UserProfile } from '@/types/auth';
import { NextRequest } from 'next/server';
import { GET as imposeGetHandler, POST as imposePostHandler } from '@/app/Impose/[[...slug]]/route';
import { POST as handoffCreateHandler } from '@/app/api/handoff/route';
import { POST as handoffClaimHandler } from '@/app/api/handoff/claim/route';
import nextConfig from '../../../next.config.mjs';

describe('Phase 11.1: Unified Platform Security, Route Hardening & Secure Handoff', () => {
  let repo: HandoffRepository;

  const publisherUser: UserProfile = {
    id: 'usr-pub-100',
    email: 'production@penguinrandom.com',
    displayName: 'Lead Prepress Operator',
    role: 'editor',
    organizationName: 'Penguin Press Group',
    preferredColorProfile: 'FOGRA39',
    preferredLanguage: 'en',
    timezone: 'UTC',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const crossOrgUser: UserProfile = {
    id: 'usr-attacker-200',
    email: 'operator@competitorprint.com',
    displayName: 'Competitor Operator',
    role: 'editor',
    organizationName: 'Rival Commercial Print',
    preferredColorProfile: 'FOGRA51',
    preferredLanguage: 'en',
    timezone: 'UTC',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const viewerUser: UserProfile = {
    id: 'usr-viewer-300',
    email: 'client-reviewer@penguinrandom.com',
    displayName: 'Client Reviewer',
    role: 'viewer',
    organizationName: 'Penguin Press Group',
    preferredColorProfile: 'FOGRA39',
    preferredLanguage: 'en',
    timezone: 'UTC',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const validPayload: ImpositionHandoffPayload = {
    schemaVersion: '1.0',
    handoffId: 'hnd-sec-test-01',
    sourceApp: 'ATS Preflight',
    timestamp: new Date().toISOString(),
    document: {
      title: 'Architectural Digest Spring 2026',
      pdfFileName: 'ad_spring_2026.pdf',
      pdfChecksumSha256: 'sha256-abcdef9876543210',
      totalPageCount: 32,
      trimWidthInches: 8.5,
      trimHeightInches: 11.0,
      trimWidthPt: 612,
      trimHeightPt: 792,
      bleedInches: { top: 0.125, bottom: 0.125, left: 0.125, right: 0.125 },
      orientation: 'portrait',
    },
    prepress: {
      colorSpace: 'CMYK',
      outputIntentProfile: 'FOGRA39',
      preflightStatus: 'passed',
      preflightComplianceScore: 100,
      hasSpotColors: false,
      isPure100KBlackText: true,
    },
    impositionIntent: {
      bindingType: 'perfect-bound',
      pagesPerSignature: 16,
      targetSheetSize: 'A1',
      targetSheetWidthInches: 23.4,
      targetSheetHeightInches: 33.1,
      creepCompensationNeeded: false,
      estimatedSignaturesCount: 2,
      blankPagesBalanceNeeded: 0,
    },
  };

  beforeEach(() => {
    repo = getHandoffRepository();
    repo.clear();
  });

  // ---------------------------------------------------------------------------
  // 1. Token-Free Handoff Navigation & Scoped HttpOnly Cookie
  // ---------------------------------------------------------------------------
  it('creates handoff and returns clean navigationUrl without tokens, setting HttpOnly cookie', async () => {
    const req = new NextRequest('http://localhost:3008/api/handoff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ats-test-user': JSON.stringify(publisherUser),
      },
      body: JSON.stringify({ payload: validPayload }),
    });

    const res = await handoffCreateHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    // Explicitly verify clean navigation URL with NO tokens
    expect(json.navigationUrl).toBe('/Impose/');
    expect(json.navigationUrl).not.toContain('handoffId');
    expect(json.navigationUrl).not.toContain('#');

    // Verify cookie attributes
    const cookie = res.cookies.get('ats_pending_handoff');
    expect(cookie).toBeDefined();
    expect(cookie?.value).toBe(json.handoffId);
    expect(cookie?.path).toBe('/Impose');
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('lax');
    expect(cookie?.maxAge).toBe(15 * 60);
  });

  // ---------------------------------------------------------------------------
  // 2. Successful Cookie-Based Claim & Atomic Cookie Deletion
  // ---------------------------------------------------------------------------
  it('successfully claims handoff via cookie and clears the cookie atomically', async () => {
    const record = repo.createHandoff(validPayload, publisherUser, publisherUser.organizationName);

    const claimReq = new NextRequest('http://localhost:3008/Impose/api/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ats-test-user': JSON.stringify(publisherUser),
        Cookie: `ats_pending_handoff=${record.id}`,
      },
      body: JSON.stringify({}),
    });

    const claimRes = await imposePostHandler(claimReq, { params: { slug: ['api', 'claim'] } });
    expect(claimRes.status).toBe(200);

    const claimJson = await claimRes.json();
    expect(claimJson.success).toBe(true);
    expect(claimJson.pending).toBe(true);
    expect(claimJson.payload.document.title).toBe('Architectural Digest Spring 2026');

    // Cookie must be deleted/cleared in the response
    const cookieHeader = claimRes.headers.get('set-cookie');
    expect(cookieHeader).toContain('ats_pending_handoff=;');
    expect(cookieHeader).toContain('Max-Age=0');
  });

  // ---------------------------------------------------------------------------
  // 3. Explicit "No Pending Handoff" State
  // ---------------------------------------------------------------------------
  it('returns explicit "No pending handoff" state when no cookie or ID is provided', async () => {
    const req = new NextRequest('http://localhost:3008/Impose/api/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ats-test-user': JSON.stringify(publisherUser),
      },
      body: JSON.stringify({}),
    });

    const res = await imposePostHandler(req, { params: { slug: ['api', 'claim'] } });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.pending).toBe(false);
    expect(json.message).toContain('No pending handoff');
  });

  // ---------------------------------------------------------------------------
  // 4. Replay Prevention & Single-Use Enforcement
  // ---------------------------------------------------------------------------
  it('rejects replay attempts on already claimed handoffs with 409 Conflict', async () => {
    const record = repo.createHandoff(validPayload, publisherUser, publisherUser.organizationName);

    // First claim: Success
    const firstClaim = await repo.claimHandoffAtomic(record.id, publisherUser);
    expect(firstClaim.success).toBe(true);

    // Second claim: Replay rejection
    const secondReq = new NextRequest('http://localhost:3008/Impose/api/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ats-test-user': JSON.stringify(publisherUser),
        Cookie: `ats_pending_handoff=${record.id}`,
      },
      body: JSON.stringify({}),
    });

    const secondRes = await imposePostHandler(secondReq, { params: { slug: ['api', 'claim'] } });
    expect(secondRes.status).toBe(409);
    const json = await secondRes.json();
    expect(json.error).toContain('already claimed');
    expect(json.reason).toBe('already_claimed');
  });

  // ---------------------------------------------------------------------------
  // 5. Expiration Enforcement (15-Minute TTL)
  // ---------------------------------------------------------------------------
  it('rejects expired handoffs with 410 Gone', async () => {
    const record = repo.createHandoff(validPayload, publisherUser, publisherUser.organizationName);

    // Manually set expiration to the past
    record.expiresAt = new Date(Date.now() - 60 * 1000).toISOString();

    const claimReq = new NextRequest('http://localhost:3008/Impose/api/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ats-test-user': JSON.stringify(publisherUser),
        Cookie: `ats_pending_handoff=${record.id}`,
      },
      body: JSON.stringify({}),
    });

    const res = await imposePostHandler(claimReq, { params: { slug: ['api', 'claim'] } });
    expect(res.status).toBe(410);
    const json = await res.json();
    expect(json.error).toContain('expired');
  });

  // ---------------------------------------------------------------------------
  // 6. Cross-Organization Boundary Denial
  // ---------------------------------------------------------------------------
  it('denies cross-organization claims with 403 Forbidden', async () => {
    const record = repo.createHandoff(validPayload, publisherUser, 'Penguin Press Group');

    // Rival company operator attempts to claim
    const claimReq = new NextRequest('http://localhost:3008/Impose/api/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ats-test-user': JSON.stringify(crossOrgUser),
        Cookie: `ats_pending_handoff=${record.id}`,
      },
      body: JSON.stringify({}),
    });

    const res = await imposePostHandler(claimReq, { params: { slug: ['api', 'claim'] } });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('Cross-organization handoff claim denied');
  });

  // ---------------------------------------------------------------------------
  // 7. Role-Based Entitlement Denial (Viewer Role)
  // ---------------------------------------------------------------------------
  it('denies Viewer role from claiming handoffs with 403 Forbidden', async () => {
    const record = repo.createHandoff(validPayload, publisherUser, publisherUser.organizationName);

    const claimReq = new NextRequest('http://localhost:3008/Impose/api/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ats-test-user': JSON.stringify(viewerUser),
        Cookie: `ats_pending_handoff=${record.id}`,
      },
      body: JSON.stringify({}),
    });

    const res = await imposePostHandler(claimReq, { params: { slug: ['api', 'claim'] } });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('Viewer role has read-only access');
  });

  // ---------------------------------------------------------------------------
  // 8. Concurrent Claim Protection
  // ---------------------------------------------------------------------------
  it('safely isolates concurrent claim requests under contention', async () => {
    const record = repo.createHandoff(validPayload, publisherUser, publisherUser.organizationName);

    // Fire two claim requests simultaneously
    const [res1, res2] = await Promise.all([
      repo.claimHandoffAtomic(record.id, publisherUser),
      repo.claimHandoffAtomic(record.id, publisherUser),
    ]);

    const successes = [res1, res2].filter((r) => r.success);
    const failures = [res1, res2].filter((r) => !r.success);

    // Exactly one must succeed, and the other must be rejected
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
    expect([409, 400]).toContain(failures[0].status);
  });

  // ---------------------------------------------------------------------------
  // 9. Route Hardening: Path Traversal & Malicious Inputs
  // ---------------------------------------------------------------------------
  it('blocks path traversal attacks with 403 Forbidden', async () => {
    const traversalReq = new NextRequest('http://localhost:3008/Impose/../../package.json');
    const res = await imposeGetHandler(traversalReq, { params: { slug: ['..', '..', 'package.json'] } });
    expect([400, 403]).toContain(res.status);
  });

  it('blocks null-byte injection with 400 Bad Request', async () => {
    const nullByteReq = new NextRequest('http://localhost:3008/Impose/index.html%00.js');
    const res = await imposeGetHandler(nullByteReq, { params: { slug: ['index.html\0.js'] } });
    expect([400, 403]).toContain(res.status);
  });

  it('rejects unapproved static extensions with 404 Not Found', async () => {
    const unapprovedReq = new NextRequest('http://localhost:3008/Impose/server.env');
    const res = await imposeGetHandler(unapprovedReq, { params: { slug: ['server.env'] } });
    expect(res.status).toBe(404);
  });

  // ---------------------------------------------------------------------------
  // 10. Route Hardening: Safe Fallback & Asset Handling
  // ---------------------------------------------------------------------------
  it('returns 404 for missing static assets with extensions instead of returning HTML shell', async () => {
    const missingAssetReq = new NextRequest('http://localhost:3008/Impose/assets/nonexistent_script.js');
    const res = await imposeGetHandler(missingAssetReq, { params: { slug: ['assets', 'nonexistent_script.js'] } });
    expect(res.status).toBe(404);
  });

  it('serves index.html with no-cache headers for valid SPA root navigation', async () => {
    const spaReq = new NextRequest('http://localhost:3008/Impose/');
    const res = await imposeGetHandler(spaReq, { params: { slug: [] } });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(res.headers.get('cache-control')).toContain('no-cache');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });

  // ---------------------------------------------------------------------------
  // 11. Route Standardizing & Safe Redirect from /imposition/
  // ---------------------------------------------------------------------------
  it('defines safe redirects from legacy /imposition/ to /Impose/', async () => {
    const redirects = await (nextConfig as any).redirects();
    expect(redirects).toBeDefined();
    const impositionRedirect = redirects.find((r: any) => r.source === '/imposition');
    expect(impositionRedirect).toBeDefined();
    expect(impositionRedirect.destination).toBe('/Impose/');
    expect(impositionRedirect.permanent).toBe(true);
  });
});

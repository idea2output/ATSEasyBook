import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/cloud/authService';
import { UserProfile, UserRole } from '@/types/auth';

export async function GET(req: NextRequest) {
  // Check auth header or cookie
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const cookieSession = req.cookies.get('ats_session')?.value;

  // Mock server session check (supports header token, cookie, or local mock)
  const sessionToken = token || cookieSession;

  // If token is provided, verify against DB
  if (sessionToken) {
    const user = await authService.validateSession(sessionToken);
    if (user) {
      return NextResponse.json({
        authenticated: true,
        user,
        organization: {
          id: user.organizationName || 'org-default',
          name: user.organizationName || 'Default Publishing House',
        },
        entitlements: {
          easybook: true,
          preflight: true,
          impose: (user.role as string)?.toLowerCase() !== 'viewer',
        },
        credits: {
          balance: 1000,
          status: 'demo-preview',
          isDemo: true,
          label: '1,000 Demo Credits',
          notice: 'Billing and credit deduction are not active yet.',
        },
      });
    }
  }

  // Default guest / unauthenticated response
  return NextResponse.json({
    authenticated: false,
    entitlements: {
      easybook: false,
      preflight: false,
      impose: false,
    },
    credits: {
      balance: 0,
      status: 'coming-soon',
    },
  });
}

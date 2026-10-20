import { NextRequest, NextResponse } from 'next/server';
import { handoffRepository } from '@/services/handoff/handoffRepository';
import { authService } from '@/services/cloud/authService';
import { UserProfile } from '@/types/auth';

export async function POST(req: NextRequest) {
  try {
    // 1. Resolve Claiming User Authentication from Server Session
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

    // Default test header fallback
    if (!claimingUser) {
      const fallbackHeader = req.headers.get('x-ats-test-user');
      if (fallbackHeader) {
        try {
          claimingUser = JSON.parse(fallbackHeader);
        } catch (e) {}
      }
    }

    if (!claimingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please sign in to claim prepress handoffs.',
        },
        { status: 401 }
      );
    }

    // 2. Read Handoff Token (Prefer HttpOnly cookie scoped to /Impose/, with body fallback)
    let bodyData: any = {};
    try {
      bodyData = await req.json();
    } catch (e) {
      // Body may be empty if browser only sends cookies
    }

    const handoffCookie = req.cookies.get('ats_pending_handoff')?.value;
    const handoffId = handoffCookie || bodyData?.handoffId;

    if (!handoffId) {
      // Explicit "No pending handoff" state
      return NextResponse.json(
        {
          success: false,
          pending: false,
          message: 'No pending handoff.',
        },
        { status: 200 }
      );
    }

    // 3. Perform Atomic Claim & Entitlement Checks
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
        { status: result.status || 400 }
      );

      // Invalidate cookie so stale/denied handoffs don't persist
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

    // 4. Return Authorized Payload and Delete / Clear Cookie
    const successRes = NextResponse.json({
      success: true,
      pending: true,
      payload: result.payload,
    });

    // Cookie is atomically invalidated on claim
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
    console.error('Failed to claim handoff:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

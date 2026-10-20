import { NextRequest, NextResponse } from 'next/server';
import { handoffRepository } from '@/services/handoff/handoffRepository';
import { UserProfile } from '@/types/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { handoffId, user } = body as {
      handoffId: string;
      user?: UserProfile;
    };

    if (!handoffId) {
      return NextResponse.json(
        { success: false, error: 'Missing handoffId in claim request.' },
        { status: 400 }
      );
    }

    const claimingUser: UserProfile = user || {
      id: 'usr-impose-operator',
      email: 'impose-operator@atstech.com',
      displayName: 'Imposition Operator',
      role: 'editor',
      organizationName: 'ATS Default Org',
      preferredColorProfile: 'FOGRA39',
      preferredLanguage: 'en',
      timezone: 'UTC',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = handoffRepository.claimHandoff(handoffId, claimingUser);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      payload: result.payload,
    });
  } catch (err: any) {
    console.error('Failed to claim handoff:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

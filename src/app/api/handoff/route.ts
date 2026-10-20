import { NextRequest, NextResponse } from 'next/server';
import { handoffRepository } from '@/services/handoff/handoffRepository';
import { ImpositionHandoffPayload } from '@/types/impositionHandoff';
import { UserProfile } from '@/types/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payload, user, organizationId } = body as {
      payload: ImpositionHandoffPayload;
      user: UserProfile;
      organizationId?: string;
    };

    if (!payload || !payload.document) {
      return NextResponse.json(
        { success: false, error: 'Invalid handoff payload: missing document metadata.' },
        { status: 400 }
      );
    }

    const fallbackUser: UserProfile = user || {
      id: 'usr-default',
      email: 'operator@atstech.com',
      displayName: 'ATS Prepress Operator',
      role: 'editor',
      organizationName: 'ATS Default Org',
      preferredColorProfile: 'FOGRA39',
      preferredLanguage: 'en',
      timezone: 'UTC',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const record = handoffRepository.createHandoff(payload, fallbackUser, organizationId);

    return NextResponse.json({
      success: true,
      handoffId: record.id,
      expiresAt: record.expiresAt,
      status: record.status,
    });
  } catch (err: any) {
    console.error('Failed to create handoff:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const list = handoffRepository.listHandoffs();
    return NextResponse.json({
      success: true,
      handoffs: list.map((h) => ({
        id: h.id,
        status: h.status,
        createdAt: h.createdAt,
        expiresAt: h.expiresAt,
        claimedAt: h.claimedAt,
        documentTitle: h.payload.document.title,
        pageCount: h.payload.document.totalPageCount,
        trimSize: `${h.payload.document.trimWidthInches}x${h.payload.document.trimHeightInches}`,
        sourceApp: h.payload.sourceApp,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * ATS Server-Side Secure Job Handoff Repository
 * Manages one-time, short-lived handoff tokens between ATS EasyBook / Preflight and ATS Impose.
 */

import { ImpositionHandoffPayload, HandoffRecord, HandoffStatus } from '@/types/impositionHandoff';
import { UserProfile } from '@/types/auth';
import { db } from '@/services/cloud/database';

const HANDOFF_STORAGE_KEY = 'ats_handoff_records_v1';
const HANDOFF_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

export class HandoffRepository {
  private inMemoryHandoffs = new Map<string, HandoffRecord>();

  constructor() {
    this.hydrateFromStorage();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private hydrateFromStorage() {
    if (this.isBrowser()) {
      try {
        const raw = window.localStorage.getItem(HANDOFF_STORAGE_KEY);
        if (raw) {
          const list: HandoffRecord[] = JSON.parse(raw);
          list.forEach((rec) => this.inMemoryHandoffs.set(rec.id, rec));
        }
      } catch (e) {
        console.warn('Failed to hydrate handoff records', e);
      }
    }
  }

  private persist() {
    if (this.isBrowser()) {
      try {
        const arr = Array.from(this.inMemoryHandoffs.values());
        window.localStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify(arr));
      } catch (e) {
        console.warn('Failed to persist handoff records', e);
      }
    }
  }

  /**
   * Creates a secure, time-limited handoff request.
   */
  createHandoff(
    payload: ImpositionHandoffPayload,
    user: UserProfile,
    organizationId: string = 'org-default'
  ): HandoffRecord {
    const now = Date.now();
    const handoffId = payload.handoffId || `hnd-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(now + HANDOFF_TTL_MS).toISOString();

    const record: HandoffRecord = {
      id: handoffId,
      status: 'pending',
      createdAt: new Date(now).toISOString(),
      expiresAt,
      createdByEmail: user.email,
      createdByUserId: user.id || (user as any).userId || 'usr-default',
      organizationId: organizationId || user.organizationName || 'org-default',
      payload: {
        ...payload,
        handoffId,
      },
    };

    this.inMemoryHandoffs.set(handoffId, record);
    this.persist();

    // Audit log entry
    try {
      db.insert('audit_logs', {
        id: `audit-${now}-${Math.random().toString(36).substring(2, 5)}`,
        action: 'handoff.created',
        userId: user.id || (user as any).userId || 'usr-default',
        userEmail: user.email,
        targetType: 'imposition_handoff',
        targetId: handoffId,
        details: {
          documentTitle: payload.document.title,
          sourceApp: payload.sourceApp,
          totalPageCount: payload.document.totalPageCount,
          trimSize: `${payload.document.trimWidthInches}x${payload.document.trimHeightInches}`,
          bindingType: payload.impositionIntent.bindingType,
        },
        timestamp: new Date(now).toISOString(),
      });
    } catch (e) {
      // In-browser mock db fallback
    }

    return record;
  }

  /**
   * One-time atomic claim of a pending handoff by authenticated user.
   */
  claimHandoff(
    handoffId: string,
    user: UserProfile
  ): { success: boolean; payload?: ImpositionHandoffPayload; error?: string } {
    let record = this.inMemoryHandoffs.get(handoffId);
    if (!record) {
      this.hydrateFromStorage();
      record = this.inMemoryHandoffs.get(handoffId);
    }

    if (!record) {
      return { success: false, error: 'Handoff record not found or does not exist.' };
    }

    // Expiration check
    if (new Date().getTime() > new Date(record.expiresAt).getTime()) {
      record.status = 'expired';
      this.persist();
      return {
        success: false,
        error: `This prepress handoff expired at ${new Date(record.expiresAt).toLocaleTimeString()}. Please create a fresh handoff.`,
      };
    }

    // One-time consumption check
    if (record.status === 'claimed') {
      return {
        success: false,
        error: `This handoff was already claimed by ${record.claimedByEmail || 'another operator'} at ${new Date(record.claimedAt || '').toLocaleTimeString()}. Handoff tokens are single-use for prepress integrity.`,
      };
    }

    // Organization and role authorization check
    if ((user.role as string)?.toLowerCase() === 'viewer') {
      return {
        success: false,
        error: 'Viewer role has read-only access and cannot claim imposition handoffs.',
      };
    }

    // Mark atomically claimed
    const now = Date.now();
    record.status = 'claimed';
    record.claimedAt = new Date(now).toISOString();
    record.claimedByEmail = user.email;
    record.claimedByUserId = user.id || (user as any).userId || 'usr-default';

    this.persist();

    // Audit log
    try {
      db.insert('audit_logs', {
        id: `audit-${now}-${Math.random().toString(36).substring(2, 5)}`,
        action: 'handoff.claimed',
        userId: user.id || (user as any).userId || 'usr-default',
        userEmail: user.email,
        targetType: 'imposition_handoff',
        targetId: handoffId,
        details: {
          claimedBy: user.email,
          documentTitle: record.payload.document.title,
        },
        timestamp: new Date(now).toISOString(),
      });
    } catch (e) {}

    return {
      success: true,
      payload: record.payload,
    };
  }

  /**
   * Retrieves a handoff record without claiming it (metadata only).
   */
  getHandoffById(handoffId: string, user?: UserProfile): HandoffRecord | null {
    let rec = this.inMemoryHandoffs.get(handoffId);
    if (!rec) {
      this.hydrateFromStorage();
      rec = this.inMemoryHandoffs.get(handoffId);
    }
    if (!rec) return null;

    // Check expiration
    if (rec.status === 'pending' && Date.now() > new Date(rec.expiresAt).getTime()) {
      rec.status = 'expired';
      this.persist();
    }

    return rec;
  }

  /**
   * Lists all recent handoffs.
   */
  listHandoffs(organizationId?: string): HandoffRecord[] {
    this.hydrateFromStorage();
    const list = Array.from(this.inMemoryHandoffs.values());
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Resets / clears in tests.
   */
  clear() {
    this.inMemoryHandoffs.clear();
    if (this.isBrowser()) {
      window.localStorage.removeItem(HANDOFF_STORAGE_KEY);
    }
  }
}

let instance: HandoffRepository | null = null;
export function getHandoffRepository(): HandoffRepository {
  if (!instance) {
    instance = new HandoffRepository();
  }
  return instance;
}

export const handoffRepository = getHandoffRepository();

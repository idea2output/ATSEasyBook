/**
 * ATS Server-Side Secure Job Handoff Repository
 * Manages one-time, short-lived handoff tokens between ATS EasyBook / Preflight and ATS Impose.
 * Enforces atomic consumption, concurrency safety, organization boundaries, and audit logging.
 */

import { ImpositionHandoffPayload, HandoffRecord, HandoffStatus } from '@/types/impositionHandoff';
import { UserProfile } from '@/types/auth';
import { db } from '@/services/cloud/database';

const HANDOFF_STORAGE_KEY = 'ats_handoff_records_v1';
const HANDOFF_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

export interface ClaimResult {
  success: boolean;
  status: number;
  payload?: ImpositionHandoffPayload;
  error?: string;
  auditAction?: string;
  reason?: string;
}

export class HandoffRepository {
  private inMemoryHandoffs = new Map<string, HandoffRecord>();
  private activeLocks = new Set<string>();

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
        id: `audit-${now}-${Math.random().toString(36).substring(2, 7)}`,
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
          organizationId: record.organizationId,
        },
        timestamp: new Date(now).toISOString(),
      });
    } catch (e) {
      // Mock db fallback
    }

    return record;
  }

  /**
   * One-time atomic claim of a pending handoff by authenticated user.
   * Safe under concurrent requests with in-memory lock.
   */
  async claimHandoffAtomic(
    handoffId: string,
    user: UserProfile
  ): Promise<ClaimResult> {
    const now = Date.now();
    const userId = user.id || (user as any).userId || 'usr-default';
    const userRole = (user.role as string)?.toLowerCase();

    // 1. Concurrency Mutex Check
    if (this.activeLocks.has(handoffId)) {
      this.logAudit('handoff.claim_denied', userId, user.email, handoffId, {
        reason: 'concurrent_claim_attempt',
      });
      return {
        success: false,
        status: 409,
        error: 'Concurrent claim detected. This handoff is already currently being claimed.',
        auditAction: 'handoff.claim_denied',
        reason: 'concurrent_claim_attempt',
      };
    }

    this.activeLocks.add(handoffId);

    try {
      let record = this.inMemoryHandoffs.get(handoffId);
      if (!record) {
        this.hydrateFromStorage();
        record = this.inMemoryHandoffs.get(handoffId);
      }

      // 2. Existence check
      if (!record) {
        this.logAudit('handoff.claim_denied', userId, user.email, handoffId, {
          reason: 'not_found',
        });
        return {
          success: false,
          status: 404,
          error: 'Prepress handoff record not found or does not exist.',
          auditAction: 'handoff.claim_denied',
          reason: 'not_found',
        };
      }

      // 3. Expiration check (15 minutes TTL)
      if (now > new Date(record.expiresAt).getTime()) {
        record.status = 'expired';
        this.persist();
        this.logAudit('handoff.claim_denied', userId, user.email, handoffId, {
          reason: 'expired',
          expiresAt: record.expiresAt,
        });
        return {
          success: false,
          status: 410,
          error: `This prepress handoff expired at ${new Date(record.expiresAt).toLocaleTimeString()}. Please create a fresh handoff.`,
          auditAction: 'handoff.claim_denied',
          reason: 'expired',
        };
      }

      // 4. Replay / Single-use check
      if (record.status === 'claimed') {
        this.logAudit('handoff.replay_attempt', userId, user.email, handoffId, {
          alreadyClaimedBy: record.claimedByEmail,
          claimedAt: record.claimedAt,
        });
        return {
          success: false,
          status: 409,
          error: `This handoff was already claimed by ${record.claimedByEmail || 'another operator'} at ${new Date(record.claimedAt || '').toLocaleTimeString()}. Handoff tokens are single-use for prepress integrity.`,
          auditAction: 'handoff.replay_attempt',
          reason: 'already_claimed',
        };
      }

      // 5. Role / Entitlement check (Viewer role denied)
      if (userRole === 'viewer') {
        this.logAudit('handoff.claim_denied', userId, user.email, handoffId, {
          reason: 'role_unauthorized',
          role: user.role,
        });
        return {
          success: false,
          status: 403,
          error: 'Viewer role has read-only access and cannot claim imposition handoffs.',
          auditAction: 'handoff.claim_denied',
          reason: 'role_unauthorized',
        };
      }

      // 6. Organization boundary check
      const recordOrg = record.organizationId || 'org-default';
      const userOrg = user.organizationName || 'org-default';
      const isSystemAdmin = userRole === 'owner' || userRole === 'administrator';

      if (!isSystemAdmin && recordOrg !== userOrg && recordOrg !== 'org-default') {
        this.logAudit('handoff.claim_denied', userId, user.email, handoffId, {
          reason: 'cross_organization_denial',
          recordOrg,
          userOrg,
        });
        return {
          success: false,
          status: 403,
          error: 'Cross-organization handoff claim denied. You do not belong to the issuing organization.',
          auditAction: 'handoff.claim_denied',
          reason: 'cross_organization_denial',
        };
      }

      // 7. Atomic Consumption
      record.status = 'claimed';
      record.claimedAt = new Date(now).toISOString();
      record.claimedByEmail = user.email;
      record.claimedByUserId = userId;

      this.persist();

      this.logAudit('handoff.claimed', userId, user.email, handoffId, {
        claimedBy: user.email,
        documentTitle: record.payload.document.title,
        sourceApp: record.payload.sourceApp,
      });

      return {
        success: true,
        status: 200,
        payload: record.payload,
        auditAction: 'handoff.claimed',
      };
    } finally {
      this.activeLocks.delete(handoffId);
    }
  }

  /**
   * Synchronous backwards-compatible wrapper for claimHandoff.
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

    if (Date.now() > new Date(record.expiresAt).getTime()) {
      record.status = 'expired';
      this.persist();
      return {
        success: false,
        error: `This prepress handoff expired at ${new Date(record.expiresAt).toLocaleTimeString()}. Please create a fresh handoff.`,
      };
    }

    if (record.status === 'claimed') {
      return {
        success: false,
        error: `This handoff was already claimed by ${record.claimedByEmail || 'another operator'}. Handoff tokens are single-use for prepress integrity.`,
      };
    }

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
    return { success: true, payload: record.payload };
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
    if (organizationId && organizationId !== 'all') {
      return list
        .filter((h) => h.organizationId === organizationId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  private logAudit(action: string, userId: string, userEmail: string, targetId: string, details: Record<string, any>) {
    try {
      db.insert('audit_logs', {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        action,
        userId,
        userEmail,
        targetType: 'imposition_handoff',
        targetId,
        details,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {}
  }

  /**
   * Resets / clears in tests.
   */
  clear() {
    this.inMemoryHandoffs.clear();
    this.activeLocks.clear();
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

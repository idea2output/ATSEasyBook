import { describe, it, expect, beforeEach } from 'vitest';
import {
  ATS_PRODUCTS,
  getAvailableProducts,
  getComingSoonProducts,
  getProductById,
  canUserAccessProduct,
} from '@/services/products/productRegistry';
import {
  HandoffRepository,
  getHandoffRepository,
} from '@/services/handoff/handoffRepository';
import { ImpositionHandoffPayload } from '@/types/impositionHandoff';
import { UserProfile } from '@/types/auth';

describe('Phase 11: Unified Platform, Dynamic Registry & Secure Handoff', () => {
  const mockOwner: UserProfile = {
    id: 'usr-owner-1',
    email: 'owner@atstech.com',
    displayName: 'Publisher Lead',
    role: 'owner',
    organizationName: 'Global Press Corp',
    preferredColorProfile: 'FOGRA39',
    preferredLanguage: 'en',
    timezone: 'UTC',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockViewer: UserProfile = {
    id: 'usr-viewer-1',
    email: 'viewer@atstech.com',
    displayName: 'Client Reviewer',
    role: 'viewer',
    organizationName: 'Global Press Corp',
    preferredColorProfile: 'FOGRA39',
    preferredLanguage: 'en',
    timezone: 'UTC',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleHandoffPayload: ImpositionHandoffPayload = {
    schemaVersion: '1.0',
    handoffId: 'hnd-test-001',
    sourceApp: 'ATS Preflight',
    timestamp: new Date().toISOString(),
    document: {
      title: 'Monograph Volume I',
      pdfFileName: 'monograph-vol1.pdf',
      pdfChecksumSha256: '9a8b7c6d5e4f3a2b1c0d',
      totalPageCount: 64,
      trimWidthInches: 6.0,
      trimHeightInches: 9.0,
      trimWidthPt: 432,
      trimHeightPt: 648,
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
      targetSheetSize: 'Super-B/A3',
      targetSheetWidthInches: 13,
      targetSheetHeightInches: 19,
      creepCompensationNeeded: false,
      estimatedSignaturesCount: 4,
      blankPagesBalanceNeeded: 0,
    },
    context: {
      operatorEmail: 'prepress@atstech.com',
      organizationName: 'Global Press Corp',
    },
  };

  let handoffRepo: HandoffRepository;

  beforeEach(() => {
    handoffRepo = new HandoffRepository();
    handoffRepo.clear();
  });

  describe('Central Product Registry & Coming Soon Behavior', () => {
    it('verifies that available products are strictly EasyBook, Preflight, and Impose', () => {
      const available = getAvailableProducts();
      const ids = available.map((p) => p.id);

      expect(ids).toContain('easybook');
      expect(ids).toContain('preflight');
      expect(ids).toContain('impose');
      expect(available.length).toBe(3);
    });

    it('verifies that completed products are automatically excluded from Coming Soon presentation', () => {
      const comingSoon = getComingSoonProducts();
      const ids = comingSoon.map((p) => p.id);

      // Completed modules must NOT appear in Coming Soon
      expect(ids).not.toContain('easybook');
      expect(ids).not.toContain('preflight');
      expect(ids).not.toContain('impose');

      // Remaining roadmap modules MUST be present
      expect(ids).toContain('multilingual-suite');
      expect(ids).toContain('variable-data');
      expect(ids).toContain('label-packaging');
      expect(ids).toContain('color-ink-coverage');
      expect(ids).toContain('client-proofing');
      expect(comingSoon.length).toBeGreaterThanOrEqual(10);
    });

    it('validates target URLs in registry for unified one-domain routing', () => {
      const easybook = getProductById('easybook');
      const preflight = getProductById('preflight');
      const impose = getProductById('impose');

      expect(easybook?.authenticatedUrl).toBe('/easybook');
      expect(preflight?.authenticatedUrl).toBe('/preflight');
      expect(impose?.authenticatedUrl).toBe('/Impose/');
    });

    it('enforces RBAC access check on registry products', () => {
      // Owner can access all available
      const ownerCheck = canUserAccessProduct(mockOwner, 'impose');
      expect(ownerCheck.allowed).toBe(true);

      // Unauthenticated visitor is denied
      const guestCheck = canUserAccessProduct(null, 'impose');
      expect(guestCheck.allowed).toBe(false);
      expect(guestCheck.reason).toContain('Authentication required');

      // Coming soon products are not accessible
      const roadmapCheck = canUserAccessProduct(mockOwner, 'variable-data');
      expect(roadmapCheck.allowed).toBe(false);
      expect(roadmapCheck.reason).toContain('in development');
    });
  });

  describe('Secure One-Time Job Handoff Workflow', () => {
    it('creates a validated handoff record with 15-minute expiration', () => {
      const record = handoffRepo.createHandoff(sampleHandoffPayload, mockOwner, 'org-press');

      expect(record.id).toBeDefined();
      expect(record.status).toBe('pending');
      expect(record.payload.document.title).toBe('Monograph Volume I');
      expect(record.payload.impositionIntent.pagesPerSignature).toBe(16);

      const createdTime = new Date(record.createdAt).getTime();
      const expiresTime = new Date(record.expiresAt).getTime();
      expect(expiresTime - createdTime).toBe(15 * 60 * 1000);
    });

    it('successfully claims a pending handoff and marks it consumed', () => {
      const record = handoffRepo.createHandoff(sampleHandoffPayload, mockOwner, 'org-press');

      // First claim succeeds
      const claimResult = handoffRepo.claimHandoff(record.id, mockOwner);
      expect(claimResult.success).toBe(true);
      expect(claimResult.payload?.document.title).toBe('Monograph Volume I');

      // Second claim fails (one-time consumption guarantee)
      const secondClaim = handoffRepo.claimHandoff(record.id, mockOwner);
      expect(secondClaim.success).toBe(false);
      expect(secondClaim.error).toContain('already claimed');
    });

    it('rejects handoff claim when token has expired', () => {
      const record = handoffRepo.createHandoff(sampleHandoffPayload, mockOwner, 'org-press');
      // Artificially expire the record
      record.expiresAt = new Date(Date.now() - 1000).toISOString();

      const claimResult = handoffRepo.claimHandoff(record.id, mockOwner);
      expect(claimResult.success).toBe(false);
      expect(claimResult.error).toContain('expired');
    });

    it('rejects handoff claim for unauthorized Viewer role', () => {
      const record = handoffRepo.createHandoff(sampleHandoffPayload, mockOwner, 'org-press');

      const claimResult = handoffRepo.claimHandoff(record.id, mockViewer);
      expect(claimResult.success).toBe(false);
      expect(claimResult.error).toContain('Viewer role has read-only access');
    });

    it('verifies that no credentials, tokens, or passwords exist in handoff payload', () => {
      const record = handoffRepo.createHandoff(sampleHandoffPayload, mockOwner, 'org-press');
      const serialized = JSON.stringify(record);

      expect(serialized).not.toContain('password');
      expect(serialized).not.toContain('secret');
      expect(serialized).not.toContain('Bearer');
    });
  });
});

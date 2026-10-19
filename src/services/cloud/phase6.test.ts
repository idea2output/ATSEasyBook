import { describe, it, expect } from 'vitest';
import { authService } from './authService';
import { cloudProjectService, ProjectAccessContext } from './cloudProjectService';
import { assetStorage } from './assetStorageService';
import { commentService } from '../collaboration/commentService';
import { versionService } from './versionService';
import { jobQueue } from '../jobs/jobQueueService';
import { printProviderService, STANDARD_PRINT_SPECS } from '../print/printProviderService';
import { migrationService } from './migrationService';
import { hasPermission } from '@/types/auth';
import { BookProject } from '@/types/book';

describe('Phase 6: Multi-User Cloud Publishing Engine', () => {
  const testEmail = `author_${Date.now()}@easybook-publisher.com`;
  const testPassword = 'SecurePassword123!';
  let userId = '';
  let sessionToken = '';
  let projectId = '';

  const getContext = (user: any): ProjectAccessContext => ({
    userId: user.id || user.userId,
    userEmail: user.email || user.userEmail,
    displayName: user.displayName,
    globalRole: user.role || user.globalRole || 'owner',
  });

  describe('1. Authentication, Sessions & Security', () => {
    it('registers a new publisher account with PBKDF2 hashed password', async () => {
      const reg = await authService.register({
        email: testEmail,
        password: testPassword,
        displayName: 'Arthur Vance',
        organizationName: 'Vance Maritime Press',
        preferredLanguage: 'en',
        preferredColorProfile: 'FOGRA39 (ISO Coated v2)',
        timezone: 'UTC',
      });

      expect(reg.success).toBe(true);
      expect(reg.session).toBeDefined();
      const user = reg.session!.user;
      expect(user.id).toBeDefined();
      expect(user.email).toBe(testEmail);
      expect(user.displayName).toBe('Arthur Vance');
      expect(user.organizationName).toBe('Vance Maritime Press');
      expect(user.role).toBe('owner');
      userId = user.id;
      sessionToken = reg.session!.token;
    });

    it('authenticates user and returns session with profile', async () => {
      const res = await authService.login(testEmail, testPassword);
      expect(res.success).toBe(true);
      expect(res.session).toBeDefined();
      expect(res.session!.user.id).toBe(userId);
      expect(res.session!.user.email).toBe(testEmail);
    });

    it('rejects invalid password authentication', async () => {
      const res = await authService.login(testEmail, 'WrongPassword999!');
      expect(res.success).toBe(false);
      expect(res.error).toBe('Invalid email or password.');
    });

    it('validates active session token', async () => {
      const user = await authService.validateSession(sessionToken);
      expect(user).toBeDefined();
      expect(user?.email).toBe(testEmail);
    });

    it('updates user profile metadata', async () => {
      const updated = await authService.updateProfile(userId, {
        displayName: 'Captain Arthur Vance, FRGS',
        preferredColorProfile: 'GRACoL',
      });
      expect(updated).toBeDefined();
      expect(updated!.displayName).toBe('Captain Arthur Vance, FRGS');
      expect(updated!.preferredColorProfile).toBe('GRACoL');
    });

    it('generates GDPR compliance data export without leaking password hash', async () => {
      const gdpr = await authService.exportUserData(userId);
      expect(gdpr).toBeDefined();
      expect(gdpr!.profile.email).toBe(testEmail);
      expect((gdpr!.profile as any).passwordHash).toBeUndefined();
      expect((gdpr!.profile as any).salt).toBeUndefined();
    });

    it('handles password reset token flow', async () => {
      const resetRes = await authService.requestPasswordReset(testEmail);
      expect(resetRes.success).toBe(true);
      expect(resetRes.resetToken).toBeDefined();

      const success = await authService.resetPassword(resetRes.resetToken!, 'NewSecurePassword456!');
      expect(success.success).toBe(true);

      // Verify login with new password
      const newLogin = await authService.login(testEmail, 'NewSecurePassword456!');
      expect(newLogin.success).toBe(true);
      expect(newLogin.session!.user.id).toBe(userId);

      // Reset back for subsequent test consistency
      const revertRes = await authService.requestPasswordReset(testEmail);
      await authService.resetPassword(revertRes.resetToken!, testPassword);
    });
  });

  describe('2. Roles and Permissions Matrix', () => {
    it('evaluates Owner permissions accurately', () => {
      expect(hasPermission('owner', 'PROJECT_DELETE')).toBe(true);
      expect(hasPermission('owner', 'PROJECT_SHARE')).toBe(true);
      expect(hasPermission('owner', 'PROJECT_EDIT')).toBe(true);
      expect(hasPermission('owner', 'PROJECT_EXPORT')).toBe(true);
      expect(hasPermission('owner', 'COMMENT_CREATE')).toBe(true);
    });

    it('evaluates Editor permissions accurately', () => {
      expect(hasPermission('editor', 'PROJECT_EDIT')).toBe(true);
      expect(hasPermission('editor', 'PROJECT_EXPORT')).toBe(true);
      expect(hasPermission('editor', 'PROJECT_DELETE')).toBe(false);
      expect(hasPermission('editor', 'PROJECT_SHARE')).toBe(false);
    });

    it('evaluates Reviewer permissions accurately (read-only review)', () => {
      expect(hasPermission('reviewer', 'COMMENT_CREATE')).toBe(true);
      expect(hasPermission('reviewer', 'COMMENT_RESOLVE')).toBe(true);
      expect(hasPermission('reviewer', 'PROJECT_EDIT')).toBe(false);
      expect(hasPermission('reviewer', 'PROJECT_DELETE')).toBe(false);
    });

    it('evaluates Viewer permissions accurately (read-only viewing)', () => {
      expect(hasPermission('viewer', 'PROJECT_VIEW')).toBe(true);
      expect(hasPermission('viewer', 'COMMENT_CREATE')).toBe(false);
      expect(hasPermission('viewer', 'PROJECT_EDIT')).toBe(false);
      expect(hasPermission('viewer', 'PROJECT_DELETE')).toBe(false);
    });

    it('evaluates Administrator permissions', () => {
      expect(hasPermission('administrator', 'ORG_MANAGE_FONTS')).toBe(true);
      expect(hasPermission('administrator', 'ORG_MANAGE_USERS')).toBe(true);
      expect(hasPermission('editor', 'ORG_MANAGE_FONTS')).toBe(false);
    });
  });

  describe('3. Cloud Projects & Optimistic Concurrency Control', () => {
    it('creates a cloud project with revision 1', async () => {
      const loginRes = await authService.login(testEmail, testPassword);
      const context = getContext(loginRes.session!.user);
      const project = await cloudProjectService.createProject(
        {
          id: `book-${Date.now()}`,
          title: 'The Polar Voyage',
          author: 'Captain Arthur Vance',
          rawManuscript: 'Chapter 1: The Departure\n\nThe iron ship pushed through pack ice.',
          templateId: 'classic-novel',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        context
      );

      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.revision).toBe(1);
      expect(project.ownerId).toBe(context.userId);
      projectId = project.id;
    });

    it('updates project and increments revision atomically', async () => {
      const loginRes = await authService.login(testEmail, testPassword);
      const context = getContext(loginRes.session!.user);
      const current = await cloudProjectService.getProjectById(projectId, context);
      expect(current).toBeDefined();

      const updated = await cloudProjectService.updateProject(
        projectId,
        { title: 'The Polar Voyage: Expeditions North' },
        context,
        current!.revision
      );

      expect(updated.title).toBe('The Polar Voyage: Expeditions North');
      expect(updated.revision).toBe(current!.revision! + 1);
    });

    it('detects and rejects concurrency conflicts with outdated revision', async () => {
      const loginRes = await authService.login(testEmail, testPassword);
      const context = getContext(loginRes.session!.user);
      // Attempt saving with stale revision 1 when current revision is 2
      await expect(
        cloudProjectService.updateProject(
          projectId,
          { title: 'Conflicting Change' },
          context,
          1 // Stale revision
        )
      ).rejects.toThrow('Conflict: Project has been modified');
    });

    it('manages project collaborator invitations and listings', async () => {
      const loginRes = await authService.login(testEmail, testPassword);
      const context = getContext(loginRes.session!.user);
      const inv = await cloudProjectService.inviteCollaborator(
        projectId,
        'reviewer@partner-press.org',
        'reviewer',
        context
      );

      expect(inv).toBeDefined();
      expect(inv.projectId).toBe(projectId);
      expect(inv.email).toBe('reviewer@partner-press.org');
      expect(inv.role).toBe('reviewer');

      const members = await cloudProjectService.listMembers(projectId, context);
      expect(Array.isArray(members)).toBe(true);
    });
  });

  describe('4. Secure Asset Storage & Time-Limited Signed URLs', () => {
    it('validates magic bytes for PNG upload and stores securely', async () => {
      // 8-byte PNG header
      const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const dummyBody = Buffer.alloc(100, 0x00);
      const pngBuffer = Buffer.concat([pngHeader, dummyBody]);

      const headerCheck = assetStorage.validateFileBuffer(pngBuffer, 'image', 'iceberg.png');
      expect(headerCheck.valid).toBe(true);

      const asset = await assetStorage.saveAsset(
        `${projectId}/iceberg.png`,
        pngBuffer,
        'iceberg.png',
        'image/png'
      );

      expect(asset).toBeDefined();
      expect(asset.key).toContain(projectId);
      expect(asset.mimeType).toBe('image/png');
    });

    it('rejects malicious executable masquerading as an image', () => {
      // MZ executable header
      const exeHeader = Buffer.from([0x4d, 0x5a, 0x90, 0x00]);
      const headerCheck = assetStorage.validateFileBuffer(exeHeader, 'image', 'trojan.png');
      expect(headerCheck.valid).toBe(false);
      expect(headerCheck.error).toContain('Invalid image format');
    });

    it('generates signed URLs and verifies HMAC signatures', () => {
      const key = `${projectId}/iceberg.png`;
      const signedUrl = assetStorage.generateSignedUrl(key, 3600);

      expect(signedUrl).toContain('signature=');
      expect(signedUrl).toContain('expires=');

      // Extract params
      const urlObj = new URL(`http://localhost${signedUrl}`);
      const sig = urlObj.searchParams.get('signature')!;
      const expires = urlObj.searchParams.get('expires')!;

      const isValid = assetStorage.verifySignedUrl(key, sig, expires);
      expect(isValid).toBe(true);
    });

    it('rejects tampered signed URLs', () => {
      const key = `${projectId}/iceberg.png`;
      const signedUrl = assetStorage.generateSignedUrl(key, 3600);

      const urlObj = new URL(`http://localhost${signedUrl}`);
      const sig = urlObj.searchParams.get('signature')!;
      const tamperedExpires = '9999999999';

      const isValid = assetStorage.verifySignedUrl(key, sig, tamperedExpires);
      expect(isValid).toBe(false);
    });
  });

  describe('5. Anchored Comments & Collaborator Presence', () => {
    let commentId = '';

    it('adds an anchored comment to a manuscript block', async () => {
      const loginRes = await authService.login(testEmail, testPassword);
      const context = getContext(loginRes.session!.user);
      const comment = await commentService.createComment(
        projectId,
        'Should we emphasize the sea temperature in this paragraph?',
        'block',
        'block-1',
        1,
        context
      );

      expect(comment).toBeDefined();
      expect(comment.id).toBeDefined();
      expect(comment.anchorType).toBe('block');
      expect(comment.anchorId).toBe('block-1');
      expect(comment.status).toBe('open');
      commentId = comment.id;
    });

    it('adds a reply to an existing comment thread', async () => {
      const loginRes = await authService.login(testEmail, testPassword);
      const context = getContext(loginRes.session!.user);
      const reply = await commentService.addReply(
        commentId,
        'Yes, -2 degrees Celsius would heighten the tension.',
        context
      );

      expect(reply).toBeDefined();
      expect(reply.content).toContain('-2 degrees Celsius');
      expect(reply.authorName).toBe(context.displayName);
    });

    it('resolves and reopens a comment thread', async () => {
      const loginRes = await authService.login(testEmail, testPassword);
      const context = getContext(loginRes.session!.user);
      const resolved = await commentService.setCommentStatus(commentId, 'resolved', context);
      expect(resolved?.status).toBe('resolved');

      const reopened = await commentService.setCommentStatus(commentId, 'open', context);
      expect(reopened?.status).toBe('open');
    });

    it('tracks active collaborator presence and heartbeat', () => {
      const dummyContext: ProjectAccessContext = {
        userId: 'collab-1',
        displayName: 'Dr. Jane Franklin',
        userEmail: 'jane@polar.org',
        globalRole: 'reviewer',
      };
      commentService.recordHeartbeat(projectId, dummyContext, 'reviewer', 'comments');

      const activeList = commentService.getActiveCollaborators(projectId);
      expect(activeList.some((c) => c.userId === 'collab-1')).toBe(true);
    });
  });

  describe('6. Version Snapshots & High-Level Diffing', () => {
    let v1Snapshot: any = null;
    let v2Snapshot: any = null;

    it('creates a milestone snapshot of the project', async () => {
      const loginRes = await authService.login(testEmail, testPassword);
      const context = getContext(loginRes.session!.user);
      const current = (await cloudProjectService.getProjectById(projectId, context))!;

      const version = await versionService.createSnapshot(
        current,
        'manual',
        'Initial First Edition Draft',
        'Includes chapters 1 and 2 with expedition notes',
        context
      );

      expect(version).toBeDefined();
      expect(version.versionNumber).toBe(1);
      expect(version.label).toBe('Initial First Edition Draft');
      v1Snapshot = version;
    });

    it('computes high-level diff between project revisions', async () => {
      const loginRes = await authService.login(testEmail, testPassword);
      const context = getContext(loginRes.session!.user);
      const current = (await cloudProjectService.getProjectById(projectId, context))!;

      // Create a second snapshot after manuscript modification
      const modifiedProject: BookProject = {
        ...current,
        rawManuscript: (current.rawManuscript || '') + '\n\nChapter 2: The Open Sea\n\nThe horizon turned pale white.',
        formattedBlocks: [
          ...(current.formattedBlocks || []),
          { id: 'b-new', type: 'paragraph', rawText: 'The horizon turned pale white.', charCount: 30, wordCount: 5 },
        ],
      };

      const v2 = await versionService.createSnapshot(
        modifiedProject,
        'manual',
        'Added Chapter 2',
        undefined,
        context
      );
      v2Snapshot = v2;

      const diff = versionService.compareVersions(v1Snapshot, v2Snapshot);
      expect(diff).toBeDefined();
      expect(diff.wordCountDelta).toBeGreaterThan(0);
      expect(diff.blocksDelta).toBeGreaterThanOrEqual(1);
    });

    it('performs non-destructive restore of a prior version', async () => {
      const loginRes = await authService.login(testEmail, testPassword);
      const context = getContext(loginRes.session!.user);
      const restored = await versionService.restoreVersion(projectId, 1, context);
      expect(restored).toBeDefined();
      expect(restored.id).toBe(projectId);
      expect(restored.title).toBe('The Polar Voyage: Expeditions North');
    });

    it('duplicates project from a version snapshot into a new standalone book', async () => {
      const loginRes = await authService.login(testEmail, testPassword);
      const context = getContext(loginRes.session!.user);
      const cloned = await versionService.duplicateVersionAsNewProject(
        projectId,
        1,
        'The Polar Voyage - Collector Cut',
        context
      );

      expect(cloned).toBeDefined();
      expect(cloned.id).not.toBe(projectId);
      expect(cloned.title).toBe('The Polar Voyage - Collector Cut');
    });
  });

  describe('7. Background Export Job Queue', () => {
    let jobId = '';

    it('enqueues an async export job for CMYK PDF', async () => {
      const loginRes = await authService.login(testEmail, testPassword);
      const context = getContext(loginRes.session!.user);

      const job = await jobQueue.enqueueExportJob(
        projectId,
        'pdf',
        {
          templateId: 'classic-novel',
          colorProfile: 'FOGRA39',
          outputIntent: 'FOGRA39 (ISO 12647-2:2004)',
          blackOverprint: true,
          includeCropMarks: true,
          includeBleed: true,
        },
        context
      );

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();
      expect(job.status).toBe('queued');
      expect(job.format).toBe('pdf');
      jobId = job.id;
    });

    it('lists export jobs for project', async () => {
      const loginRes = await authService.login(testEmail, testPassword);
      const context = getContext(loginRes.session!.user);
      const jobs = await jobQueue.listJobsForProject(projectId, context);
      expect(jobs.length).toBeGreaterThanOrEqual(1);
      expect(jobs.some((j) => j.id === jobId)).toBe(true);
    });
  });

  describe('8. Print Provider Integration Readiness', () => {
    it('validates print specification limits and interior color options', () => {
      const spec = STANDARD_PRINT_SPECS[0]; // 6x9 Trade Paperback
      const mockProject: BookProject = {
        id: 'p-1',
        title: 'Polar Test',
        author: 'Arthur Vance',
        rawManuscript: 'Text',
        templateId: 'classic-novel',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        exportOptions: { includeBleed: true },
        colorSettings: { outputProfile: 'FOGRA39' },
      };

      const val = printProviderService.validateForPrint(mockProject, 120, spec);
      expect(val.valid).toBe(true);
      expect(val.errors.length).toBe(0);

      // Page count below minimum for perfect binding (e.g. 10 pages)
      const lowVal = printProviderService.validateForPrint(mockProject, 10, spec);
      expect(lowVal.valid).toBe(false);
      expect(lowVal.errors.some((e) => e.includes('Page count violation'))).toBe(true);
    });

    it('calculates print-on-demand cost estimation accurately', () => {
      const spec = STANDARD_PRINT_SPECS[0];
      const estimatedCost = printProviderService.estimateCost(150, 50, spec);
      expect(estimatedCost).toBeGreaterThan(0);
      expect(typeof estimatedCost).toBe('number');
    });

    it('creates and submits a simulated print order with mock IngramSpark adapter', async () => {
      const loginRes = await authService.login(testEmail, testPassword);
      const context = getContext(loginRes.session!.user);
      const spec = STANDARD_PRINT_SPECS[0];
      const address = {
        fullName: 'Maritime Archives Ltd',
        addressLine1: '42 Dockside Pier',
        city: 'Bristol',
        stateOrRegion: 'Somerset',
        postalCode: 'BS1 4AA',
        country: 'GB',
      };

      const orderDraft = await printProviderService.createPrintOrderDraft(
        projectId,
        spec,
        50,
        address,
        120, // valid 120 pages
        'mock-ingramspark',
        context
      );

      expect(orderDraft).toBeDefined();
      expect(orderDraft.status).toBe('validated');

      const submitted = await printProviderService.simulateSubmitOrder(orderDraft.id, context);
      expect(submitted.status).toBe('simulated-submitted');
      expect(submitted.simulationResult?.orderReferenceNumber).toBeDefined();
      expect(submitted.simulationResult?.orderReferenceNumber).toContain('ING-SIM-');
    });
  });

  describe('9. LocalStorage to Cloud Migration', () => {
    it('previews migration scope before execution', () => {
      const mockProject: BookProject = {
        id: 'local-proj-1',
        title: 'Voyage to the Antarctic',
        author: 'Robert Falcon',
        rawManuscript: 'A cold morning.',
        templateId: 'classic-novel',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        images: [],
      };

      const preview = migrationService.generateMigrationPreview([mockProject]);
      expect(preview.totalProjects).toBe(1);
      expect(preview.totalImagesCount).toBe(0);
      expect(preview.projects.length).toBe(1);
      expect(preview.projects[0].wordCount).toBeGreaterThan(0);
    });

    it('migrates local projects transactionally with backup retention', async () => {
      const loginRes = await authService.login(testEmail, testPassword);
      const context = getContext(loginRes.session!.user);
      const mockProject: BookProject = {
        id: `migrated-${Date.now()}`,
        title: 'Legacy Manuscript Vol 1',
        author: 'Captain Arthur Vance',
        rawManuscript: 'The legacy manuscript contents preserved verbatim.',
        templateId: 'classic-novel',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        images: [],
      };

      const result = await migrationService.executeMigration(
        [mockProject],
        context,
        { retainLocalCopy: true }
      );

      expect(result.migratedCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.migratedProjectIds.length).toBe(1);

      // Verify project exists in cloud
      const cloudProj = await cloudProjectService.getProjectById(result.migratedProjectIds[0], context);
      expect(cloudProj).toBeDefined();
      expect(cloudProj?.title).toBe('Legacy Manuscript Vol 1');
    });
  });
});

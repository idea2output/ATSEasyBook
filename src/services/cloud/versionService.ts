import crypto from 'crypto';
import { db } from './database';
import { BookProject } from '@/types/book';
import { ProjectVersionSnapshot, VersionTrigger, VersionDiff, VersionSummary } from '@/types/version';
import { ProjectAccessContext, cloudProjectService } from './cloudProjectService';
import { authService } from './authService';

export class VersionService {
  /**
   * Computes high-level metadata summary of a book project.
   */
  public computeSummary(project: BookProject): VersionSummary {
    const raw = project.rawManuscript || '';
    const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
    const blocks = project.formattedBlocks || [];
    const headings = blocks.filter((b) => b.type === 'chapter-heading').length;

    return {
      wordCount: words,
      blockCount: blocks.length,
      templateId: project.templateId || 'classic-novel-6x9',
      templateName: project.templateId || 'Standard',
      customFontsCount: (project.customFonts || []).length,
      imagesCount: (project.images || []).length,
      headingsCount: headings,
    };
  }

  /**
   * Creates a snapshot of the current project state.
   */
  public async createSnapshot(
    project: BookProject,
    trigger: VersionTrigger,
    label?: string,
    description?: string,
    user?: ProjectAccessContext
  ): Promise<ProjectVersionSnapshot> {
    const projectId = project.id;
    const existingVersions = db.find('versions', (v) => v.projectId === projectId);
    const nextVersionNumber = existingVersions.length + 1;

    const summary = this.computeSummary(project);
    const now = new Date().toISOString();
    const versionId = `ver-${projectId}-${nextVersionNumber}-${Date.now()}`;

    const defaultLabel =
      label ||
      (trigger === 'auto-pre-export'
        ? `Pre-export snapshot (v${nextVersionNumber})`
        : trigger === 'auto-pre-template'
        ? `Pre-template change (v${nextVersionNumber})`
        : trigger === 'auto-pre-font'
        ? `Pre-font change (v${nextVersionNumber})`
        : trigger === 'restore'
        ? `Pre-restore snapshot (v${nextVersionNumber})`
        : `Manual snapshot (v${nextVersionNumber})`);

    const snapshot: ProjectVersionSnapshot = {
      id: versionId,
      projectId,
      versionNumber: nextVersionNumber,
      label: defaultLabel,
      description,
      trigger,
      createdBy: {
        userId: user?.userId || project.ownerId || 'system',
        displayName: user?.displayName || 'System Snapshot',
        email: user?.userEmail || 'system@easybook.local',
      },
      createdAt: now,
      summary,
      snapshotData: JSON.parse(JSON.stringify(project)),
    };

    db.insert('versions', snapshot);

    if (user) {
      authService.logAudit('version.snapshot_create', user.userId, user.userEmail, {
        projectId,
        versionNumber: nextVersionNumber,
        trigger,
        label: defaultLabel,
      }, projectId);
    }

    return snapshot;
  }

  /**
   * Lists all version snapshots for a project.
   */
  public async listVersions(projectId: string, user: ProjectAccessContext): Promise<ProjectVersionSnapshot[]> {
    cloudProjectService.assertPermission(projectId, user, 'PROJECT_VIEW');
    const versions = db.find<ProjectVersionSnapshot>('versions', (v) => v.projectId === projectId);
    return versions.sort((a, b) => b.versionNumber - a.versionNumber);
  }

  /**
   * Retrieves a specific version snapshot.
   */
  public async getVersionById(
    projectId: string,
    versionNumber: number,
    user: ProjectAccessContext
  ): Promise<ProjectVersionSnapshot | null> {
    cloudProjectService.assertPermission(projectId, user, 'PROJECT_VIEW');
    const version = db.findOne<ProjectVersionSnapshot>('versions', (v) => v.projectId === projectId && v.versionNumber === versionNumber);
    return version || null;
  }

  /**
   * Compares two versions and returns high-level deltas.
   */
  public compareVersions(v1: ProjectVersionSnapshot, v2: ProjectVersionSnapshot): VersionDiff {
    const s1 = v1.summary;
    const s2 = v2.summary;
    const p1 = v1.snapshotData;
    const p2 = v2.snapshotData;

    const summary: string[] = [];

    const titleChanged = p1.title !== p2.title;
    if (titleChanged) summary.push(`Title changed from "${p1.title}" to "${p2.title}"`);

    const authorChanged = (p1.author || '') !== (p2.author || '');
    if (authorChanged) summary.push(`Author changed from "${p1.author || 'None'}" to "${p2.author || 'None'}"`);

    const templateChanged = s1.templateId !== s2.templateId;
    if (templateChanged) summary.push(`Template changed from "${s1.templateId}" to "${s2.templateId}"`);

    const wordDelta = s2.wordCount - s1.wordCount;
    if (wordDelta !== 0) {
      summary.push(`Word count changed by ${wordDelta > 0 ? `+${wordDelta}` : wordDelta} words (${s1.wordCount} -> ${s2.wordCount})`);
    }

    const blockDelta = s2.blockCount - s1.blockCount;
    if (blockDelta !== 0) {
      summary.push(`Block count changed by ${blockDelta > 0 ? `+${blockDelta}` : blockDelta} blocks`);
    }

    const imgDelta = s2.imagesCount - s1.imagesCount;
    if (imgDelta !== 0) {
      summary.push(`Images count changed by ${imgDelta > 0 ? `+${imgDelta}` : imgDelta}`);
    }

    const fontDelta = s2.customFontsCount - s1.customFontsCount;
    if (fontDelta !== 0) {
      summary.push(`Custom fonts count changed by ${fontDelta > 0 ? `+${fontDelta}` : fontDelta}`);
    }

    if (summary.length === 0) {
      summary.push('No major structural changes detected between versions.');
    }

    return {
      baseVersion: v1.versionNumber,
      targetVersion: v2.versionNumber,
      titleChanged,
      authorChanged,
      templateChanged,
      wordCountDelta: wordDelta,
      blocksDelta: blockDelta,
      imagesDelta: imgDelta,
      fontsDelta: fontDelta,
      summary,
    };
  }

  /**
   * Restores a project to a previous snapshot non-destructively.
   */
  public async restoreVersion(
    projectId: string,
    targetVersionNumber: number,
    user: ProjectAccessContext
  ): Promise<BookProject> {
    cloudProjectService.assertPermission(projectId, user, 'PROJECT_RESTORE_VERSION');

    const targetVersion = db.findOne<ProjectVersionSnapshot>('versions', (v) => v.projectId === projectId && v.versionNumber === targetVersionNumber);
    if (!targetVersion) {
      throw new Error(`Version snapshot ${targetVersionNumber} not found.`);
    }

    const currentProject = await cloudProjectService.getProjectById(projectId, user);
    if (!currentProject) throw new Error('Current project not found');

    // 1. Take safety snapshot of current state before restoring
    await this.createSnapshot(
      currentProject,
      'restore',
      `Auto-snapshot before restoring v${targetVersionNumber}`,
      `Safety backup created automatically before restoring snapshot version ${targetVersionNumber}`,
      user
    );

    // 2. Prepare restored project data, maintaining ID, owners, and next revision
    const restoredData: BookProject = {
      ...targetVersion.snapshotData,
      id: projectId,
      ownerId: currentProject.ownerId,
      organizationId: currentProject.organizationId,
      revision: (currentProject.revision || 1) + 1,
      storageBackend: 'cloud',
      updatedAt: new Date().toISOString(),
      lastEditedBy: {
        userId: user.userId,
        displayName: user.displayName,
        email: user.userEmail,
      },
    };

    db.update('projects', projectId, {
      revision: restoredData.revision,
      data: restoredData,
      updatedAt: restoredData.updatedAt,
    });

    authService.logAudit('version.restore', user.userId, user.userEmail, {
      projectId,
      restoredVersionNumber: targetVersionNumber,
      newRevision: restoredData.revision,
    }, projectId);

    return { ...restoredData, currentUserRole: 'owner' };
  }

  /**
   * Duplicates a historical snapshot into a new standalone project.
   */
  public async duplicateVersionAsNewProject(
    projectId: string,
    versionNumber: number,
    newTitle: string,
    user: ProjectAccessContext
  ): Promise<BookProject> {
    cloudProjectService.assertPermission(projectId, user, 'PROJECT_VIEW');

    const version = db.findOne<ProjectVersionSnapshot>('versions', (v) => v.projectId === projectId && v.versionNumber === versionNumber);
    if (!version) throw new Error(`Version snapshot ${versionNumber} not found.`);

    const clonedData: BookProject = {
      ...JSON.parse(JSON.stringify(version.snapshotData)),
      id: `book-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      title: newTitle || `${version.snapshotData.title} (from v${versionNumber})`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      revision: 1,
    };

    const created = await cloudProjectService.createProject(clonedData, user);

    authService.logAudit('version.duplicate_to_new_project', user.userId, user.userEmail, {
      sourceProjectId: projectId,
      sourceVersionNumber: versionNumber,
      newProjectId: created.id,
      newTitle: created.title,
    }, created.id);

    return created;
  }
}

export const versionService = new VersionService();

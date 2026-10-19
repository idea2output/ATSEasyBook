import { BookProject } from '@/types/book';
import { MigrationPreview, MigrationResult, MigrationScopeProject } from '@/types/cloud';
import { ProjectAccessContext, cloudProjectService } from './cloudProjectService';
import { authService } from './authService';

const STORAGE_KEY = 'ats_easybook_projects_v1';

export class MigrationService {
  /**
   * Generates a pre-migration scope preview of all local projects.
   */
  public generateMigrationPreview(localProjects: BookProject[]): MigrationPreview {
    let totalImages = 0;
    let totalFonts = 0;
    let totalEstimatedBytes = 0;

    const projects: MigrationScopeProject[] = localProjects.map((p) => {
      const words = (p.rawManuscript || '').trim() ? p.rawManuscript.trim().split(/\s+/).length : 0;
      const imagesCount = (p.images || []).length;
      const fontsCount = (p.customFonts || []).length;
      const approxBytes = JSON.stringify(p).length;

      totalImages += imagesCount;
      totalFonts += fontsCount;
      totalEstimatedBytes += approxBytes;

      return {
        id: p.id,
        title: p.title || 'Untitled Book',
        author: p.author || 'Anonymous',
        wordCount: words,
        imagesCount,
        fontsCount,
        templateId: p.templateId || 'classic-novel-6x9',
        lastModified: p.updatedAt || p.createdAt || new Date().toISOString(),
      };
    });

    return {
      totalProjects: localProjects.length,
      projects,
      totalImagesCount: totalImages,
      totalFontsCount: totalFonts,
      estimatedSizeKB: Math.round(totalEstimatedBytes / 1024),
    };
  }

  /**
   * Executes the migration of local projects to the cloud database.
   * Safety rule: Local data is NOT removed until all projects are confirmed persisted in the cloud.
   */
  public async executeMigration(
    localProjects: BookProject[],
    user: ProjectAccessContext,
    options: { retainLocalCopy?: boolean } = {}
  ): Promise<MigrationResult> {
    const errors: string[] = [];
    const migratedProjectIds: string[] = [];

    for (const project of localProjects) {
      try {
        const cloudBook = await cloudProjectService.createProject(project, user);
        migratedProjectIds.push(cloudBook.id);
      } catch (err: any) {
        errors.push(`Failed to migrate "${project.title || project.id}": ${err.message}`);
      }
    }

    const success = errors.length === 0 && migratedProjectIds.length === localProjects.length;

    // Only clear localStorage if migration succeeded 100% and user opted not to retain local copy
    let localDataRetained = true;
    if (success && !options.retainLocalCopy && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
        localDataRetained = false;
      } catch (err) {
        console.warn('Could not clear local storage after migration:', err);
      }
    }

    authService.logAudit('migration.executed', user.userId, user.userEmail, {
      totalLocal: localProjects.length,
      migratedCount: migratedProjectIds.length,
      failedCount: errors.length,
      localDataRetained,
    });

    return {
      success,
      migratedCount: migratedProjectIds.length,
      failedCount: errors.length,
      errors,
      migratedProjectIds,
      localDataRetained,
    };
  }
}

export const migrationService = new MigrationService();

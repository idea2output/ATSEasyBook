import crypto from 'crypto';
import { db } from '../cloud/database';
import { ExportJob, JobStatus, JobType, ExportJobSettingsSnapshot } from '@/types/jobs';
import { BookProject, BookTemplate } from '@/types/book';
import { ProjectAccessContext, cloudProjectService } from '../cloud/cloudProjectService';
import { assetStorage } from '../cloud/assetStorageService';
import { versionService } from '../cloud/versionService';
import { authService } from '../cloud/authService';
import { getTemplateById } from '../templates/templateRegistry';
import { parseManuscript } from '../formatting/manuscriptParser';
import { defaultPaginationEngine } from '../pagination/paginationEngine';
import { generatePrintPdf } from '../pdf/pdfExportService';
import { generateEpub } from '../epub/epubExportService';

export class JobQueueService {
  /**
   * Enqueues an export job for a project and triggers background processing.
   */
  public async enqueueExportJob(
    projectId: string,
    format: 'pdf' | 'epub',
    settingsSnapshot: ExportJobSettingsSnapshot,
    user: ProjectAccessContext
  ): Promise<ExportJob> {
    cloudProjectService.assertPermission(projectId, user, 'PROJECT_EXPORT');

    const project = await cloudProjectService.getProjectById(projectId, user);
    if (!project) throw new Error('Project not found');

    // Automatically create a pre-export snapshot
    await versionService.createSnapshot(
      project,
      'auto-pre-export',
      `Auto-snapshot before ${format.toUpperCase()} export`,
      `Snapshot captured before generating ${format.toUpperCase()} with template ${settingsSnapshot.templateId}`,
      user
    );

    const jobId = `job-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const job: ExportJob = {
      id: jobId,
      projectId,
      projectTitle: project.title,
      requestedBy: {
        userId: user.userId,
        displayName: user.displayName,
        email: user.userEmail,
      },
      type: format === 'pdf' ? 'export-pdf' : 'export-epub',
      format,
      status: 'queued',
      progress: 0,
      statusMessage: 'Queued for generation...',
      queuedAt: now,
      retryCount: 0,
      settingsSnapshot,
    };

    db.insert('export_jobs', job);

    authService.logAudit('export.job_queued', user.userId, user.userEmail, {
      jobId,
      projectId,
      format,
      templateId: settingsSnapshot.templateId,
    }, projectId);

    // Trigger asynchronous execution (non-blocking)
    setTimeout(() => {
      this.processJob(jobId, project).catch((err) => {
        console.error(`[JobQueue] Fatal error executing job ${jobId}:`, err);
      });
    }, 50);

    return job;
  }

  /**
   * Background execution runner for export jobs.
   */
  private async processJob(jobId: string, project: BookProject): Promise<void> {
    const job = db.findById<ExportJob>('export_jobs', jobId);
    if (!job) return;

    db.update('export_jobs', jobId, {
      status: 'processing' as JobStatus,
      startedAt: new Date().toISOString(),
      progress: 10,
      statusMessage: 'Preparing manuscript layout and typography...',
    });

    try {
      const template: BookTemplate = getTemplateById(job.settingsSnapshot.templateId);
      const blocks = project.formattedBlocks && project.formattedBlocks.length > 0
        ? project.formattedBlocks
        : parseManuscript(project.rawManuscript || '');

      if (job.format === 'pdf') {
        // Step 1: Paginate
        db.update('export_jobs', jobId, { progress: 30, statusMessage: 'Paginating pages and anchor flows...' });
        const pages = defaultPaginationEngine.paginate(blocks, template, {
          bookTitle: project.title,
          authorName: project.author,
          images: project.images,
          placements: project.placements,
          typography: project.typography,
        });

        // Step 2: Render PDF with CMYK output intent and overprint
        db.update('export_jobs', jobId, { progress: 60, statusMessage: 'Rendering CMYK PDF with ICC Output Intent...' });
        const pdfDoc = await generatePrintPdf(project, template, pages, {
          includeBleed: job.settingsSnapshot.includeBleed || false,
          includeCropMarks: job.settingsSnapshot.includeCropMarks || false,
          acknowledgedWarnings: true,
          colorManagement: {
            outputProfileId: (job.settingsSnapshot.outputIntent || project.colorSettings?.outputProfileId || 'fogra39') as any,
            blackHandling: 'standard-text',
            overprintBlackText: job.settingsSnapshot.enableOverprint !== false,
            overprintBlackRules: job.settingsSnapshot.enableOverprint !== false,
          },
        });

        const pdfBytes = Buffer.from(pdfDoc.output('arraybuffer'));
        const filename = `${project.title.toLowerCase().replace(/[^a-z0-9_\-]+/g, '_') || 'book'}-print.pdf`;
        const storageKey = `exports/${project.id}/${jobId}/${filename}`;

        // Step 3: Save to private storage
        db.update('export_jobs', jobId, { progress: 85, statusMessage: 'Saving artifact to secure storage...' });
        const storedAsset = await assetStorage.saveAsset(storageKey, pdfBytes, filename, 'application/pdf');

        // Step 4: Generate time-limited signed download URL (24 hours valid)
        const signedUrl = assetStorage.generateSignedUrl(storageKey, 24 * 3600);
        const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

        db.update('export_jobs', jobId, {
          status: 'completed' as JobStatus,
          progress: 100,
          statusMessage: 'Print-ready PDF export generated successfully.',
          completedAt: new Date().toISOString(),
          signedDownloadUrl: signedUrl,
          downloadFilename: filename,
          fileSizeBytes: storedAsset.sizeBytes,
          expiresAt,
        });

        authService.logAudit('export.job_completed', job.requestedBy.userId, job.requestedBy.email, {
          jobId,
          projectId: project.id,
          format: 'pdf',
          fileSize: storedAsset.sizeBytes,
        }, project.id);

      } else {
        // EPUB export
        db.update('export_jobs', jobId, { progress: 40, statusMessage: 'Building reflowable XHTML5 chapters...' });
        const epubResult = await generateEpub(project, template, {
          language: job.settingsSnapshot.language,
          direction: job.settingsSnapshot.direction as any,
        });

        const epubBytes = Buffer.from(epubResult.arrayBuffer);
        const filename = epubResult.filename;
        const storageKey = `exports/${project.id}/${jobId}/${filename}`;

        db.update('export_jobs', jobId, { progress: 85, statusMessage: 'Saving EPUB container...' });
        const storedAsset = await assetStorage.saveAsset(storageKey, epubBytes, filename, 'application/epub+zip');
        const signedUrl = assetStorage.generateSignedUrl(storageKey, 24 * 3600);
        const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

        db.update('export_jobs', jobId, {
          status: 'completed' as JobStatus,
          progress: 100,
          statusMessage: 'Reflowable EPUB 3 export generated successfully.',
          completedAt: new Date().toISOString(),
          signedDownloadUrl: signedUrl,
          downloadFilename: filename,
          fileSizeBytes: storedAsset.sizeBytes,
          expiresAt,
        });

        authService.logAudit('export.job_completed', job.requestedBy.userId, job.requestedBy.email, {
          jobId,
          projectId: project.id,
          format: 'epub',
          fileSize: storedAsset.sizeBytes,
        }, project.id);
      }
    } catch (err: any) {
      console.error(`[JobQueue] Export job ${jobId} failed:`, err);
      db.update('export_jobs', jobId, {
        status: 'failed' as JobStatus,
        progress: 100,
        statusMessage: 'Export generation failed.',
        errorMessage: err.message || 'Unknown export generation error.',
        completedAt: new Date().toISOString(),
      });

      authService.logAudit('export.job_failed', job.requestedBy.userId, job.requestedBy.email, {
        jobId,
        projectId: project.id,
        error: err.message,
      }, project.id);
    }
  }

  /**
   * Retrieves the status of a specific export job.
   */
  public async getJobStatus(jobId: string, user: ProjectAccessContext): Promise<ExportJob | null> {
    const job = db.findById<ExportJob>('export_jobs', jobId);
    if (!job) return null;

    cloudProjectService.assertPermission(job.projectId, user, 'PROJECT_VIEW');
    return job;
  }

  /**
   * Lists all export jobs for a project.
   */
  public async listJobsForProject(projectId: string, user: ProjectAccessContext): Promise<ExportJob[]> {
    cloudProjectService.assertPermission(projectId, user, 'PROJECT_VIEW');
    const jobs = db.find<ExportJob>('export_jobs', (j) => j.projectId === projectId);
    return jobs.sort((a, b) => new Date(b.queuedAt).getTime() - new Date(a.queuedAt).getTime());
  }
}

export const jobQueue = new JobQueueService();

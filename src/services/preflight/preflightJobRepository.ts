import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  PreflightJob,
  PreflightReport,
  PreflightRepairActionType,
  IssueResolutionStatus,
  ImpositionJobMetadata,
  PreflightComment,
} from '@/types/preflight';
import { inspectPdfDocument } from './pdfInspectionEngine';
import { executePdfRepair } from './pdfRepairEngine';
import { generatePreflightPdfReport, generatePreflightJsonReport } from './pdfReportGenerator';
import { db } from '../cloud/database';
import { assetStorageService } from '../cloud/assetStorageService';

const LOCAL_STORAGE_JOBS_KEY = 'ats_preflight_jobs_v1';
const MASTER_SIGNING_SECRET = process.env.STORAGE_SIGNING_SECRET || 'ats_easybook_master_signing_key_secret_2026';

export class PreflightJobRepository {
  private memoryBuffers: Map<string, Uint8Array> = new Map();

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private getStorageDir(): string {
    if (typeof window === 'undefined' && path && path.join) {
      const dir = path.join(process.cwd(), 'data', 'storage', 'preflight');
      if (fs && fs.existsSync && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      return dir;
    }
    return '';
  }

  public getFileBytes(key: string): Uint8Array | null {
    return this.readFileFromDisk(key);
  }

  private saveFileToDisk(jobId: string, filename: string, buffer: Uint8Array): string {
    const key = `preflight/${jobId}/${filename}`;
    this.memoryBuffers.set(key, buffer);
    const storageDir = this.getStorageDir();
    if (storageDir) {
      try {
        const jobDir = path.join(storageDir, jobId);
        if (!fs.existsSync(jobDir)) fs.mkdirSync(jobDir, { recursive: true });
        const filePath = path.join(jobDir, filename);
        fs.writeFileSync(filePath, Buffer.from(buffer));
      } catch (err) {
        console.warn('Could not write preflight file to disk, cached in memory:', err);
      }
      return key;
    }
    return key;
  }

  private readFileFromDisk(key: string): Uint8Array | null {
    if (this.memoryBuffers.has(key)) {
      return this.memoryBuffers.get(key)!;
    }
    if (typeof window === 'undefined' && path && path.join) {
      try {
        const filePath = path.join(process.cwd(), 'data', 'storage', key);
        if (fs.existsSync(filePath)) {
          const buf = fs.readFileSync(filePath);
          const u8 = new Uint8Array(buf);
          this.memoryBuffers.set(key, u8);
          return u8;
        }
      } catch (err) {
        console.warn('Could not read preflight file from disk:', err);
      }
    }
    return null;
  }

  /**
   * Creates a new Preflight Job from an uploaded PDF.
   */
  async createJob(
    fileBuffer: Uint8Array,
    filename: string,
    profileId: string = 'ats-standard-print',
    user: { userId: string; displayName: string; email: string },
    organizationId?: string,
    sourceEasyBookExportJobId?: string
  ): Promise<PreflightJob> {
    // 1. Validate file buffer
    const validation = assetStorageService.validateFileBuffer(
      Buffer.from(fileBuffer),
      'pdf',
      filename
    );
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid PDF buffer.');
    }

    const jobId = `job-pf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const originalAssetKey = this.saveFileToDisk(jobId, 'original.pdf', fileBuffer);

    // 2. Perform deep inspection
    const report = await inspectPdfDocument(fileBuffer, profileId);
    report.jobId = jobId;

    // 3. Compute Imposition Readiness
    let impositionMeta: ImpositionJobMetadata | undefined = undefined;
    if (report.isCompliant && report.pages.length > 0) {
      const firstPage = report.pages[0];
      const trimW = firstPage.pageBoxes.trimBox?.widthInches || firstPage.pageBoxes.mediaBox.widthInches;
      const trimH = firstPage.pageBoxes.trimBox?.heightInches || firstPage.pageBoxes.mediaBox.heightInches;
      impositionMeta = {
        jobId,
        trimWidthInches: trimW,
        trimHeightInches: trimH,
        bleedInches: Math.max(0.125, firstPage.pageBoxes.bleedAmountInches.top),
        pageCount: report.totalPageCount,
        colorSpace: report.colorSummary.cmykCompliant ? 'cmyk' : 'gray',
        outputProfile: report.outputIntent?.conditionId || 'fogra39',
        bindingType: report.totalPageCount >= 48 ? 'perfect-bound' : 'saddle-stitch',
        status: 'ready-for-imposition',
      };
    }

    const newJob: PreflightJob = {
      id: jobId,
      title: filename.replace(/\.pdf$/i, ''),
      originalFilename: filename,
      fileSizeBytes: fileBuffer.length,
      pageCount: report.totalPageCount,
      status: 'completed',
      uploadedBy: user,
      organizationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profileId,
      originalAssetKey,
      latestReport: report,
      repairHistory: [],
      comments: [],
      sourceEasyBookExportJobId,
      impositionReadyMetadata: impositionMeta,
    };

    // Save job record
    this.saveJobRecord(newJob);

    // Audit log
    db.insert('audit_logs', {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      action: 'preflight.upload',
      userId: user.userId,
      userEmail: user.email,
      targetType: 'preflight_job',
      targetId: jobId,
      details: { filename, profileId, pageCount: report.totalPageCount, isCompliant: report.isCompliant },
      timestamp: new Date().toISOString(),
    });

    return newJob;
  }

  /**
   * Retrieves a job by ID.
   */
  async getJobById(jobId: string): Promise<PreflightJob | null> {
    if (!this.isBrowser()) {
      const record = db.findById('preflight_jobs', jobId);
      if (record) return record.data as PreflightJob;
    }

    if (this.isBrowser()) {
      try {
        const stored = window.localStorage.getItem(LOCAL_STORAGE_JOBS_KEY);
        if (stored) {
          const list: PreflightJob[] = JSON.parse(stored);
          const found = list.find((j) => j.id === jobId);
          if (found) return found;
        }
      } catch {
        // fallback
      }
    }

    return null;
  }

  /**
   * Lists all preflight jobs accessible by the user.
   */
  async listJobs(userId?: string, organizationId?: string): Promise<PreflightJob[]> {
    return this.listJobsForUser(userId, organizationId);
  }

  async listJobsForUser(userId?: string, organizationId?: string): Promise<PreflightJob[]> {
    const results: PreflightJob[] = [];

    if (!this.isBrowser()) {
      const records = db.find('preflight_jobs', () => true);
      for (const rec of records) {
        const job = rec.data as PreflightJob;
        if (!userId || job.uploadedBy.userId === userId || (organizationId && job.organizationId === organizationId)) {
          results.push(job);
        }
      }
    }

    if (this.isBrowser()) {
      try {
        const stored = window.localStorage.getItem(LOCAL_STORAGE_JOBS_KEY);
        if (stored) {
          const list: PreflightJob[] = JSON.parse(stored);
          for (const job of list) {
            if (!results.some((r) => r.id === job.id)) {
              results.push(job);
            }
          }
        }
      } catch {
        // fallback
      }
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Executes a transparent repair plan for a job.
   */
  async executeRepair(
    jobId: string,
    actions: PreflightRepairActionType[],
    user: { userId: string; displayName: string; email: string }
  ): Promise<PreflightJob> {
    const job = await this.getJobById(jobId);
    if (!job) throw new Error(`Preflight job ${jobId} not found.`);

    const originalBytes = this.readFileFromDisk(job.originalAssetKey);
    if (!originalBytes) {
      throw new Error(`Original PDF file for job ${jobId} not found on disk.`);
    }

    // Run transparent repair pipeline
    const { repairedPdfBytes, repairedReport } = await executePdfRepair(
      originalBytes,
      actions,
      job.profileId
    );
    repairedReport.jobId = jobId;

    // Save repaired file to storage
    const repairedKey = this.saveFileToDisk(jobId, 'repaired-v1.pdf', repairedPdfBytes);

    // Update job state
    job.repairedAssetKey = repairedKey;
    job.repairedReport = repairedReport;
    job.repairHistory.push({
      timestamp: new Date().toISOString(),
      appliedActions: actions,
      user: user.displayName,
      reportId: repairedReport.id,
    });
    job.updatedAt = new Date().toISOString();

    // Check if repaired PDF is now imposition-ready
    if (repairedReport.isCompliant && repairedReport.pages.length > 0) {
      const firstPage = repairedReport.pages[0];
      const trimW = firstPage.pageBoxes.trimBox?.widthInches || firstPage.pageBoxes.mediaBox.widthInches;
      const trimH = firstPage.pageBoxes.trimBox?.heightInches || firstPage.pageBoxes.mediaBox.heightInches;
      job.impositionReadyMetadata = {
        jobId,
        trimWidthInches: trimW,
        trimHeightInches: trimH,
        bleedInches: Math.max(0.125, firstPage.pageBoxes.bleedAmountInches.top),
        pageCount: repairedReport.totalPageCount,
        colorSpace: repairedReport.colorSummary.cmykCompliant ? 'cmyk' : 'gray',
        outputProfile: repairedReport.outputIntent?.conditionId || 'fogra39',
        bindingType: repairedReport.totalPageCount >= 48 ? 'perfect-bound' : 'saddle-stitch',
        status: 'ready-for-imposition',
      };
    }

    this.saveJobRecord(job);

    // Audit log
    db.insert('audit_logs', {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      action: 'preflight.repair',
      userId: user.userId,
      userEmail: user.email,
      targetType: 'preflight_job',
      targetId: jobId,
      details: { appliedActions: actions, isNowCompliant: repairedReport.isCompliant },
      timestamp: new Date().toISOString(),
    });

    return job;
  }

  /**
   * Adds an issue or page comment.
   */
  async addComment(
    jobId: string,
    commentOrUser: { pageNumber?: number; issueId?: string; content: string } | { userId: string; displayName: string; role?: string; email?: string },
    userOrContent?: { userId: string; displayName: string; role?: string } | string,
    pageNumber?: number
  ): Promise<PreflightJob> {
    const job = await this.getJobById(jobId);
    if (!job) throw new Error(`Preflight job ${jobId} not found.`);

    let author: { userId: string; displayName: string; role: string };
    let content = '';
    let pageNum = pageNumber;
    let issueId: string | undefined = undefined;

    if (typeof userOrContent === 'string') {
      // Called as (jobId, user, content, pageNumber)
      const u = commentOrUser as any;
      author = {
        userId: u.userId || 'user',
        displayName: u.displayName || 'Prepress Operator',
        role: u.role || 'editor',
      };
      content = userOrContent;
    } else {
      // Called as (jobId, commentData, user)
      const c = commentOrUser as any;
      content = c.content || '';
      pageNum = c.pageNumber;
      issueId = c.issueId;
      const u = (userOrContent as any) || {};
      author = {
        userId: u.userId || 'user',
        displayName: u.displayName || 'Prepress Operator',
        role: u.role || 'editor',
      };
    }

    const newComment: PreflightComment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      pageNumber: pageNum,
      issueId,
      author,
      authorName: author.displayName,
      content,
      createdAt: new Date().toISOString(),
    };

    job.comments.push(newComment);
    job.updatedAt = new Date().toISOString();
    this.saveJobRecord(job);
    return job;
  }

  /**
   * Updates resolution status of a preflight issue.
   */
  async updateIssueStatus(
    jobId: string,
    issueId: string,
    status: IssueResolutionStatus,
    note?: string
  ): Promise<PreflightJob> {
    const job = await this.getJobById(jobId);
    if (!job) throw new Error(`Preflight job ${jobId} not found.`);

    const issue = job.latestReport?.issues.find((i) => i.id === issueId);
    if (issue) {
      issue.status = status;
      if (note) issue.resolutionNote = note;
    }

    if (job.repairedReport) {
      const rIssue = job.repairedReport.issues.find((i) => i.id === issueId);
      if (rIssue) {
        rIssue.status = status;
        if (note) rIssue.resolutionNote = note;
      }
    }

    job.updatedAt = new Date().toISOString();
    this.saveJobRecord(job);
    return job;
  }

  /**
   * Generates a signed, expiring URL for asset download.
   */
  async getSignedDownloadUrl(
    jobId: string,
    type: 'original' | 'repaired' | 'report-pdf' | 'report-json'
  ): Promise<{ downloadUrl: string; filename: string; expiresAt: string }> {
    const job = await this.getJobById(jobId);
    if (!job) throw new Error(`Preflight job ${jobId} not found.`);

    let filename = `${job.title}-original.pdf`;
    if (type === 'repaired') filename = `${job.title}-repaired-master.pdf`;
    else if (type === 'report-pdf') filename = `${job.title}-preflight-certificate.pdf`;
    else if (type === 'report-json') filename = `${job.title}-preflight-report.json`;

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours
    const payload = `${jobId}:${type}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', MASTER_SIGNING_SECRET).update(payload).digest('hex');

    const downloadUrl = `/api/preflight/jobs/${jobId}/download?type=${type}&expires=${encodeURIComponent(
      expiresAt
    )}&sig=${signature}`;

    return {
      downloadUrl,
      filename,
      expiresAt,
    };
  }

  async generateSignedDownloadUrl(
    jobId: string,
    type: 'original' | 'repaired' | 'report-pdf' | 'report-json'
  ): Promise<{ downloadUrl: string; filename: string; expiresAt: string }> {
    return this.getSignedDownloadUrl(jobId, type);
  }

  /**
   * Safely deletes a job record and assets if permitted.
   */
  async deleteJob(jobId: string, user: { userId: string; role?: string }): Promise<boolean> {
    const job = await this.getJobById(jobId);
    if (!job) return false;

    const canDelete =
      job.uploadedBy.userId === user.userId ||
      user.role === 'administrator' ||
      user.role === 'owner';

    if (!canDelete) {
      throw new Error('You do not have permission to delete this preflight job.');
    }

    if (!this.isBrowser()) {
      db.delete('preflight_jobs', jobId);
      const storageDir = this.getStorageDir();
      const jobDir = path.join(storageDir, jobId);
      if (fs.existsSync(jobDir)) {
        fs.rmSync(jobDir, { recursive: true, force: true });
      }
    }

    if (this.isBrowser()) {
      try {
        const stored = window.localStorage.getItem(LOCAL_STORAGE_JOBS_KEY);
        if (stored) {
          const list: PreflightJob[] = JSON.parse(stored);
          const filtered = list.filter((j) => j.id !== jobId);
          window.localStorage.setItem(LOCAL_STORAGE_JOBS_KEY, JSON.stringify(filtered));
        }
      } catch {
        // fallback
      }
    }

    return true;
  }

  private saveJobRecord(job: PreflightJob): void {
    if (!this.isBrowser()) {
      const existing = db.findById('preflight_jobs', job.id);
      if (existing) {
        db.update('preflight_jobs', job.id, { data: job });
      } else {
        db.insert('preflight_jobs', { id: job.id, data: job });
      }
    }

    if (this.isBrowser()) {
      try {
        const stored = window.localStorage.getItem(LOCAL_STORAGE_JOBS_KEY);
        let list: PreflightJob[] = stored ? JSON.parse(stored) : [];
        const idx = list.findIndex((j) => j.id === job.id);
        if (idx >= 0) list[idx] = job;
        else list.unshift(job);
        window.localStorage.setItem(LOCAL_STORAGE_JOBS_KEY, JSON.stringify(list));
      } catch {
        // fallback
      }
    }
  }
}

export const preflightJobRepository = new PreflightJobRepository();

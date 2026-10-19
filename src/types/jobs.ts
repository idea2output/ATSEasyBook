export type JobType = 'export-pdf' | 'export-epub' | 'preflight-check';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'retrying';

export interface ExportJobSettingsSnapshot {
  templateId: string;
  outputIntent?: string;
  enableOverprint?: boolean;
  pureBlackText?: boolean;
  language?: string;
  direction?: string;
  includeBleed?: boolean;
  includeCropMarks?: boolean;
}

export interface ExportJob {
  id: string;
  projectId: string;
  projectTitle: string;
  requestedBy: {
    userId: string;
    displayName: string;
    email: string;
  };
  type: JobType;
  format: 'pdf' | 'epub';
  status: JobStatus;
  progress: number; // 0 to 100
  statusMessage: string;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  retryCount: number;
  settingsSnapshot: ExportJobSettingsSnapshot;
  signedDownloadUrl?: string;
  downloadFilename?: string;
  fileSizeBytes?: number;
  expiresAt?: string;
}

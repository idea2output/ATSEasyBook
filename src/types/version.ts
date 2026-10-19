import { BookProject } from './book';

export type VersionTrigger =
  | 'manual'
  | 'auto-pre-export'
  | 'auto-pre-template'
  | 'auto-pre-font'
  | 'auto-pre-design'
  | 'restore';

export interface VersionSummary {
  wordCount: number;
  blockCount: number;
  templateId: string;
  templateName: string;
  customFontsCount: number;
  imagesCount: number;
  headingsCount: number;
}

export interface ProjectVersionSnapshot {
  id: string;
  projectId: string;
  versionNumber: number;
  label: string;
  description?: string;
  trigger: VersionTrigger;
  createdBy: {
    userId: string;
    displayName: string;
    email: string;
  };
  createdAt: string;
  summary: VersionSummary;
  snapshotData: BookProject;
}

export interface VersionDiff {
  baseVersion: number;
  targetVersion: number;
  titleChanged: boolean;
  authorChanged: boolean;
  templateChanged: boolean;
  wordCountDelta: number;
  blocksDelta: number;
  imagesDelta: number;
  fontsDelta: number;
  summary: string[];
}

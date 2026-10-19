import { UserRole } from './auth';

export interface CloudProjectMetadata {
  id: string;
  ownerId: string;
  organizationId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  lastEditedBy?: {
    userId: string;
    displayName: string;
    email: string;
  };
  collaboratorCount: number;
  storageBackend: 'local' | 'cloud';
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  joinedAt: string;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  projectTitle: string;
  inviterId: string;
  inviterName: string;
  email: string;
  role: UserRole;
  token: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  projectId?: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
}

export interface MigrationScopeProject {
  id: string;
  title: string;
  author: string;
  wordCount: number;
  imagesCount: number;
  fontsCount: number;
  templateId: string;
  lastModified: string;
}

export interface MigrationPreview {
  totalProjects: number;
  projects: MigrationScopeProject[];
  totalImagesCount: number;
  totalFontsCount: number;
  estimatedSizeKB: number;
}

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: string[];
  migratedProjectIds: string[];
  localDataRetained: boolean;
}

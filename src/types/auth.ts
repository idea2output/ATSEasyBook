export type UserRole = 'owner' | 'editor' | 'reviewer' | 'viewer' | 'administrator';

export type Permission =
  | 'PROJECT_VIEW'
  | 'PROJECT_EDIT'
  | 'PROJECT_DELETE'
  | 'PROJECT_EXPORT'
  | 'PROJECT_SHARE'
  | 'PROJECT_RESTORE_VERSION'
  | 'COMMENT_VIEW'
  | 'COMMENT_CREATE'
  | 'COMMENT_RESOLVE'
  | 'ORG_MANAGE_FONTS'
  | 'ORG_MANAGE_TEMPLATES'
  | 'ORG_MANAGE_USERS'
  | 'PRINT_ORDER_VIEW'
  | 'PRINT_ORDER_CONFIGURE';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'PROJECT_VIEW',
    'PROJECT_EDIT',
    'PROJECT_DELETE',
    'PROJECT_EXPORT',
    'PROJECT_SHARE',
    'PROJECT_RESTORE_VERSION',
    'COMMENT_VIEW',
    'COMMENT_CREATE',
    'COMMENT_RESOLVE',
    'ORG_MANAGE_FONTS',
    'ORG_MANAGE_TEMPLATES',
    'ORG_MANAGE_USERS',
    'PRINT_ORDER_VIEW',
    'PRINT_ORDER_CONFIGURE',
  ],
  editor: [
    'PROJECT_VIEW',
    'PROJECT_EDIT',
    'PROJECT_EXPORT',
    'PROJECT_RESTORE_VERSION',
    'COMMENT_VIEW',
    'COMMENT_CREATE',
    'COMMENT_RESOLVE',
    'PRINT_ORDER_VIEW',
  ],
  reviewer: [
    'PROJECT_VIEW',
    'COMMENT_VIEW',
    'COMMENT_CREATE',
    'COMMENT_RESOLVE',
    'PRINT_ORDER_VIEW',
  ],
  viewer: [
    'PROJECT_VIEW',
    'COMMENT_VIEW',
  ],
  administrator: [
    'PROJECT_VIEW',
    'PROJECT_EDIT',
    'PROJECT_DELETE',
    'PROJECT_EXPORT',
    'PROJECT_SHARE',
    'PROJECT_RESTORE_VERSION',
    'COMMENT_VIEW',
    'COMMENT_CREATE',
    'COMMENT_RESOLVE',
    'ORG_MANAGE_FONTS',
    'ORG_MANAGE_TEMPLATES',
    'ORG_MANAGE_USERS',
    'PRINT_ORDER_VIEW',
    'PRINT_ORDER_CONFIGURE',
  ],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  organizationName: string;
  preferredLanguage: string;
  preferredColorProfile: string;
  timezone: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  oauthProvider?: 'google' | 'github';
  oauthId?: string;
}

export interface AuthSession {
  user: UserProfile;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface LoginResponse {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  organizationName?: string;
  preferredLanguage?: string;
  preferredColorProfile?: string;
  timezone?: string;
}

export interface PasswordResetRecord {
  id: string;
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: string;
  usedAt?: string;
}

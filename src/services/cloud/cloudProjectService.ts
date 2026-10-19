import crypto from 'crypto';
import { db } from './database';
import { BookProject } from '@/types/book';
import { UserRole, Permission, hasPermission } from '@/types/auth';
import { ProjectMember, ProjectInvitation } from '@/types/cloud';
import { authService } from './authService';

export interface ProjectAccessContext {
  userId: string;
  userEmail: string;
  displayName: string;
  globalRole: UserRole;
}

export class CloudProjectService {
  /**
   * Resolves the effective role for a user on a specific project.
   */
  public getEffectiveRole(projectId: string, user: ProjectAccessContext): UserRole | null {
    if (user.globalRole === 'administrator') {
      return 'administrator';
    }

    const projectRecord = db.findById('projects', projectId);
    if (!projectRecord) return null;

    if (projectRecord.ownerId === user.userId) {
      return 'owner';
    }

    const membership = db.findOne('project_members', (m) => m.projectId === projectId && m.userId === user.userId);
    if (membership) {
      return membership.role as UserRole;
    }

    return null;
  }

  /**
   * Asserts that a user has a specific permission on a project.
   */
  public assertPermission(projectId: string, user: ProjectAccessContext, permission: Permission): UserRole {
    const role = this.getEffectiveRole(projectId, user);
    if (!role || !hasPermission(role, permission)) {
      throw new Error(`Unauthorized: Role "${role || 'none'}" does not have permission "${permission}" on project ${projectId}.`);
    }
    return role;
  }

  /**
   * Creates a new cloud book project.
   */
  public async createProject(
    bookData: BookProject,
    owner: ProjectAccessContext,
    organizationId: string = 'org-default'
  ): Promise<BookProject> {
    const now = new Date().toISOString();
    const projectId = bookData.id || `book-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const projectPayload: BookProject = {
      ...bookData,
      id: projectId,
      ownerId: owner.userId,
      organizationId,
      revision: 1,
      storageBackend: 'cloud',
      lastEditedBy: {
        userId: owner.userId,
        displayName: owner.displayName,
        email: owner.userEmail,
      },
      createdAt: now,
      updatedAt: now,
    };

    const record = {
      id: projectId,
      ownerId: owner.userId,
      organizationId,
      revision: 1,
      data: projectPayload,
      createdAt: now,
      updatedAt: now,
    };

    db.insert('projects', record);

    authService.logAudit('project.create', owner.userId, owner.userEmail, {
      projectId,
      title: projectPayload.title,
    }, projectId);

    return { ...projectPayload, currentUserRole: 'owner' };
  }

  /**
   * Retrieves a cloud project by ID with permission check.
   */
  public async getProjectById(projectId: string, user: ProjectAccessContext): Promise<BookProject | null> {
    const record = db.findById('projects', projectId);
    if (!record) return null;

    const role = this.getEffectiveRole(projectId, user);
    if (!role) {
      throw new Error(`Forbidden: You do not have permission to view project ${projectId}.`);
    }

    const projectData: BookProject = JSON.parse(JSON.stringify(record.data));
    return {
      ...projectData,
      currentUserRole: role,
    };
  }

  /**
   * Lists all projects accessible by a user.
   */
  public async listProjectsForUser(user: ProjectAccessContext): Promise<BookProject[]> {
    const allProjects = db.find('projects', () => true);

    const accessibleProjects: BookProject[] = [];

    for (const record of allProjects) {
      const role = this.getEffectiveRole(record.id, user);
      if (role) {
        accessibleProjects.push({
          ...record.data,
          currentUserRole: role,
        });
      }
    }

    return accessibleProjects.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Updates an existing cloud project with optimistic concurrency conflict detection.
   */
  public async updateProject(
    projectId: string,
    updates: Partial<BookProject>,
    user: ProjectAccessContext,
    expectedRevision?: number
  ): Promise<BookProject> {
    this.assertPermission(projectId, user, 'PROJECT_EDIT');

    const record = db.findById('projects', projectId);
    if (!record) {
      throw new Error(`Project ${projectId} not found.`);
    }

    // Check optimistic concurrency conflict
    if (expectedRevision !== undefined && record.revision !== expectedRevision) {
      const err: any = new Error(
        `Conflict: Project has been modified by ${record.data.lastEditedBy?.displayName || 'another user'} (revision ${record.revision}). Please refresh before saving.`
      );
      err.code = 'REVISION_CONFLICT';
      err.currentRevision = record.revision;
      err.currentProject = record.data;
      throw err;
    }

    const now = new Date().toISOString();
    const nextRevision = (record.revision || 1) + 1;

    const updatedData: BookProject = {
      ...record.data,
      ...updates,
      id: projectId,
      revision: nextRevision,
      storageBackend: 'cloud',
      updatedAt: now,
      lastEditedBy: {
        userId: user.userId,
        displayName: user.displayName,
        email: user.userEmail,
      },
    };

    db.update('projects', projectId, {
      revision: nextRevision,
      data: updatedData,
      updatedAt: now,
    });

    authService.logAudit('project.update', user.userId, user.userEmail, {
      projectId,
      newRevision: nextRevision,
    }, projectId);

    const role = this.getEffectiveRole(projectId, user)!;
    return { ...updatedData, currentUserRole: role };
  }

  /**
   * Deletes a project.
   */
  public async deleteProject(projectId: string, user: ProjectAccessContext): Promise<boolean> {
    this.assertPermission(projectId, user, 'PROJECT_DELETE');

    const record = db.findById('projects', projectId);
    if (!record) return false;

    // Delete members, invitations, comments, versions
    const members = db.find('project_members', (m) => m.projectId === projectId);
    for (const m of members) db.delete('project_members', m.id);

    const invs = db.find('project_invitations', (i) => i.projectId === projectId);
    for (const i of invs) db.delete('project_invitations', i.id);

    const comments = db.find('comments', (c) => c.projectId === projectId);
    for (const c of comments) db.delete('comments', c.id);

    const versions = db.find('versions', (v) => v.projectId === projectId);
    for (const v of versions) db.delete('versions', v.id);

    db.delete('projects', projectId);

    authService.logAudit('project.delete', user.userId, user.userEmail, {
      projectId,
      title: record.data.title,
    }, projectId);

    return true;
  }

  /**
   * Invites a collaborator by email with a designated role.
   */
  public async inviteCollaborator(
    projectId: string,
    emailInput: string,
    role: UserRole,
    inviter: ProjectAccessContext
  ): Promise<ProjectInvitation> {
    this.assertPermission(projectId, inviter, 'PROJECT_SHARE');

    const project = db.findById('projects', projectId);
    if (!project) throw new Error('Project not found');

    const email = emailInput.trim().toLowerCase();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    const invitation: ProjectInvitation = {
      id: `inv-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      projectId,
      projectTitle: project.data.title,
      inviterId: inviter.userId,
      inviterName: inviter.displayName,
      email,
      role,
      token,
      expiresAt,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    db.insert('project_invitations', invitation);

    authService.logAudit('project.invite_collaborator', inviter.userId, inviter.userEmail, {
      projectId,
      invitedEmail: email,
      role,
    }, projectId);

    return invitation;
  }

  /**
   * Accepts an invitation using its unique token.
   */
  public async acceptInvitation(token: string, user: ProjectAccessContext): Promise<ProjectMember> {
    const inv = db.findOne('project_invitations', (i) => i.token === token && i.status === 'pending');
    if (!inv) throw new Error('Invitation is invalid, expired, or already used.');

    if (new Date(inv.expiresAt).getTime() < Date.now()) {
      db.update('project_invitations', inv.id, { status: 'revoked' });
      throw new Error('Invitation has expired.');
    }

    // Check if already a member
    let member = db.findOne('project_members', (m) => m.projectId === inv.projectId && m.userId === user.userId);
    if (!member) {
      member = {
        id: `mem-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        projectId: inv.projectId,
        userId: user.userId,
        email: user.userEmail,
        displayName: user.displayName,
        role: inv.role,
        joinedAt: new Date().toISOString(),
      };
      db.insert('project_members', member);
    } else {
      member = db.update('project_members', member.id, { role: inv.role })!;
    }

    db.update('project_invitations', inv.id, { status: 'accepted' });

    authService.logAudit('project.accept_invitation', user.userId, user.userEmail, {
      projectId: inv.projectId,
      role: inv.role,
    }, inv.projectId);

    return member as ProjectMember;
  }

  /**
   * Lists all members of a project.
   */
  public async listMembers(projectId: string, user: ProjectAccessContext): Promise<ProjectMember[]> {
    this.assertPermission(projectId, user, 'PROJECT_VIEW');
    return db.find('project_members', (m) => m.projectId === projectId) as ProjectMember[];
  }

  /**
   * Updates a collaborator's role or removes them from a project.
   */
  public async updateMemberRole(
    projectId: string,
    targetUserId: string,
    newRole: UserRole,
    actor: ProjectAccessContext
  ): Promise<ProjectMember | null> {
    this.assertPermission(projectId, actor, 'PROJECT_SHARE');

    const member = db.findOne('project_members', (m) => m.projectId === projectId && m.userId === targetUserId);
    if (!member) return null;

    const updated = db.update('project_members', member.id, { role: newRole });

    authService.logAudit('project.role_change', actor.userId, actor.userEmail, {
      projectId,
      targetUserId,
      newRole,
    }, projectId);

    return updated as ProjectMember | null;
  }

  public async removeMember(projectId: string, targetUserId: string, actor: ProjectAccessContext): Promise<boolean> {
    this.assertPermission(projectId, actor, 'PROJECT_SHARE');

    const member = db.findOne('project_members', (m) => m.projectId === projectId && m.userId === targetUserId);
    if (!member) return false;

    db.delete('project_members', member.id);

    authService.logAudit('project.remove_member', actor.userId, actor.userEmail, {
      projectId,
      targetUserId,
    }, projectId);

    return true;
  }
}

export const cloudProjectService = new CloudProjectService();

import crypto from 'crypto';
import { db } from '../cloud/database';
import { ProjectComment, CommentReply, CommentAnchorType, CollaboratorPresence } from '@/types/collaboration';
import { ProjectAccessContext, cloudProjectService } from '../cloud/cloudProjectService';
import { authService } from '../cloud/authService';

// In-memory collaborator presence cache: projectId -> Map<userId, CollaboratorPresence>
const presenceCache: Map<string, Map<string, CollaboratorPresence>> = new Map();

export class CommentService {
  /**
   * Records presence heartbeat for a user on a project.
   */
  public recordHeartbeat(
    projectId: string,
    user: ProjectAccessContext,
    role: string,
    activeTab?: string
  ): CollaboratorPresence {
    if (!presenceCache.has(projectId)) {
      presenceCache.set(projectId, new Map());
    }

    const projectPresence = presenceCache.get(projectId)!;
    const presence: CollaboratorPresence = {
      userId: user.userId,
      displayName: user.displayName,
      email: user.userEmail,
      role,
      activeTab,
      lastHeartbeat: new Date().toISOString(),
    };

    projectPresence.set(user.userId, presence);
    return presence;
  }

  /**
   * Retrieves active collaborators on a project (heartbeat within last 60 seconds).
   */
  public getActiveCollaborators(projectId: string): CollaboratorPresence[] {
    const projectPresence = presenceCache.get(projectId);
    if (!projectPresence) return [];

    const now = Date.now();
    const active: CollaboratorPresence[] = [];

    projectPresence.forEach((pres, userId) => {
      const elapsed = now - new Date(pres.lastHeartbeat).getTime();
      if (elapsed < 60 * 1000) {
        active.push(pres);
      } else {
        projectPresence.delete(userId);
      }
    });

    return active;
  }

  /**
   * Lists all comments on a project.
   */
  public async getComments(projectId: string, user: ProjectAccessContext): Promise<ProjectComment[]> {
    cloudProjectService.assertPermission(projectId, user, 'COMMENT_VIEW');
    const comments = db.find<ProjectComment>('comments', (c) => c.projectId === projectId);
    return comments.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  /**
   * Adds a new comment anchored to a block, page, or image.
   */
  public async createComment(
    projectId: string,
    content: string,
    anchorType: CommentAnchorType,
    anchorId?: string,
    pageNumber?: number,
    user?: ProjectAccessContext
  ): Promise<ProjectComment> {
    if (!user) throw new Error('User context is required to comment.');
    cloudProjectService.assertPermission(projectId, user, 'COMMENT_CREATE');

    if (!content || !content.trim()) {
      throw new Error('Comment content cannot be empty.');
    }

    const commentId = `cmt-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const comment: ProjectComment = {
      id: commentId,
      projectId,
      authorId: user.userId,
      authorName: user.displayName,
      authorEmail: user.userEmail,
      anchorType,
      anchorId,
      pageNumber,
      content: content.trim(),
      createdAt: now,
      updatedAt: now,
      status: 'open',
      replies: [],
    };

    db.insert('comments', comment);

    authService.logAudit('comment.create', user.userId, user.userEmail, {
      projectId,
      commentId,
      anchorType,
    }, projectId);

    return comment;
  }

  /**
   * Adds a reply to an existing comment thread.
   */
  public async addReply(
    commentId: string,
    content: string,
    user: ProjectAccessContext
  ): Promise<CommentReply> {
    const comment = db.findById('comments', commentId);
    if (!comment) throw new Error('Comment not found');

    cloudProjectService.assertPermission(comment.projectId, user, 'COMMENT_CREATE');

    if (!content || !content.trim()) {
      throw new Error('Reply content cannot be empty.');
    }

    const reply: CommentReply = {
      id: `rep-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      authorId: user.userId,
      authorName: user.displayName,
      authorEmail: user.userEmail,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedReplies = [...(comment.replies || []), reply];
    db.update('comments', commentId, {
      replies: updatedReplies,
      updatedAt: new Date().toISOString(),
    });

    return reply;
  }

  /**
   * Resolves or reopens a comment.
   */
  public async setCommentStatus(
    commentId: string,
    status: 'open' | 'resolved',
    user: ProjectAccessContext
  ): Promise<ProjectComment | null> {
    const comment = db.findById('comments', commentId);
    if (!comment) return null;

    cloudProjectService.assertPermission(comment.projectId, user, 'COMMENT_RESOLVE');

    const now = new Date().toISOString();
    const updates: Partial<ProjectComment> = {
      status,
      updatedAt: now,
      resolvedBy: status === 'resolved' ? { userId: user.userId, displayName: user.displayName } : undefined,
      resolvedAt: status === 'resolved' ? now : undefined,
    };

    const updated = db.update('comments', commentId, updates);

    authService.logAudit('comment.status_change', user.userId, user.userEmail, {
      projectId: comment.projectId,
      commentId,
      newStatus: status,
    }, comment.projectId);

    return updated as ProjectComment;
  }

  /**
   * Deletes a comment (author, owner, or administrator only).
   */
  public async deleteComment(commentId: string, user: ProjectAccessContext): Promise<boolean> {
    const comment = db.findById('comments', commentId);
    if (!comment) return false;

    const role = cloudProjectService.getEffectiveRole(comment.projectId, user);
    if (comment.authorId !== user.userId && role !== 'owner' && role !== 'administrator') {
      throw new Error('Forbidden: You can only delete your own comments unless you are a project Owner or Administrator.');
    }

    db.delete('comments', commentId);

    authService.logAudit('comment.delete', user.userId, user.userEmail, {
      projectId: comment.projectId,
      commentId,
    }, comment.projectId);

    return true;
  }
}

export const commentService = new CommentService();

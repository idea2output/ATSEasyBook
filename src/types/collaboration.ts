export type CommentAnchorType = 'block' | 'page' | 'image' | 'general';

export interface CommentReply {
  id: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: string;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  anchorType: CommentAnchorType;
  anchorId?: string; // blockId or imageId
  pageNumber?: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  status: 'open' | 'resolved';
  resolvedBy?: {
    userId: string;
    displayName: string;
  };
  resolvedAt?: string;
  replies: CommentReply[];
}

export interface CollaboratorPresence {
  userId: string;
  displayName: string;
  email: string;
  role: string;
  activeTab?: string;
  lastHeartbeat: string;
}

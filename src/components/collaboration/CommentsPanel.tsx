'use client';

import React, { useState, useEffect } from 'react';
import { ProjectComment, CommentAnchorType, CollaboratorPresence } from '@/types/collaboration';
import { commentService } from '@/services/collaboration/commentService';
import { ManuscriptBlock, BookImage } from '@/types/book';
import { bookRepository } from '@/services/storage/bookRepository';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Users,
  CornerDownRight,
  Filter,
  Bookmark,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

interface CommentsPanelProps {
  projectId: string;
  blocks: ManuscriptBlock[];
  images: BookImage[];
  selectedBlockId?: string | null;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  projectId,
  blocks,
  images,
  selectedBlockId,
}) => {
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [presence, setPresence] = useState<CollaboratorPresence[]>([]);
  const [newContent, setNewContent] = useState('');
  const [anchorType, setAnchorType] = useState<CommentAnchorType>('block');
  const [anchorId, setAnchorId] = useState<string>(selectedBlockId || (blocks[0]?.id || ''));
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const activeUser = bookRepository.getActiveUser();

  const loadComments = async () => {
    if (!activeUser) return;
    try {
      const list = await commentService.getComments(projectId, activeUser);
      setComments(list);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const updatePresence = () => {
    if (!activeUser) return;
    commentService.recordHeartbeat(projectId, activeUser, activeUser.globalRole, 'comments');
    const active = commentService.getActiveCollaborators(projectId);
    setPresence(active);
  };

  useEffect(() => {
    loadComments();
    updatePresence();
    const interval = setInterval(() => {
      loadComments();
      updatePresence();
    }, 4000);
    return () => clearInterval(interval);
  }, [projectId]);

  useEffect(() => {
    if (selectedBlockId) {
      setAnchorType('block');
      setAnchorId(selectedBlockId);
    }
  }, [selectedBlockId]);

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || !activeUser) return;

    try {
      await commentService.createComment(
        projectId,
        newContent,
        anchorType,
        anchorType === 'block' || anchorType === 'image' ? anchorId : undefined,
        anchorType === 'page' ? pageNumber : undefined,
        activeUser
      );
      setNewContent('');
      await loadComments();
    } catch (err: any) {
      alert(err.message || 'Error posting comment.');
    }
  };

  const handleAddReply = async (commentId: string) => {
    const text = replyInputs[commentId];
    if (!text || !text.trim() || !activeUser) return;

    try {
      await commentService.addReply(commentId, text, activeUser);
      setReplyInputs({ ...replyInputs, [commentId]: '' });
      setActiveReplyId(null);
      await loadComments();
    } catch (err: any) {
      alert(err.message || 'Error posting reply.');
    }
  };

  const handleToggleStatus = async (comment: ProjectComment) => {
    if (!activeUser) return;
    const newStatus = comment.status === 'open' ? 'resolved' : 'open';
    try {
      await commentService.setCommentStatus(comment.id, newStatus, activeUser);
      await loadComments();
    } catch (err: any) {
      alert(err.message || 'Error toggling comment status.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!activeUser) return;
    try {
      await commentService.deleteComment(commentId, activeUser);
      await loadComments();
    } catch (err: any) {
      alert(err.message || 'Error deleting comment.');
    }
  };

  const filteredComments = comments.filter((c) => {
    if (filter === 'open') return c.status === 'open';
    if (filter === 'resolved') return c.status === 'resolved';
    return true;
  });

  return (
    <div className="space-y-4 text-slate-800">
      {/* Collaborator Presence Bar */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-900">Active Collaborators</span>
        </div>
        <div className="flex items-center space-x-1.5">
          {presence.length > 0 ? (
            presence.map((p) => (
              <span
                key={p.userId}
                title={`${p.displayName} (${p.email}) - ${p.role}`}
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{p.displayName}</span>
              </span>
            ))
          ) : (
            <span className="text-[11px] text-slate-400">Viewing locally</span>
          )}
        </div>
      </div>

      {/* New Comment Box */}
      <form onSubmit={handleCreateComment} className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center space-x-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Add Comment / Review Note</span>
          </span>

          <div className="flex items-center space-x-2 text-[11px]">
            <label className="text-slate-500">Anchor:</label>
            <select
              value={anchorType}
              onChange={(e) => setAnchorType(e.target.value as CommentAnchorType)}
              className="px-2 py-0.5 border border-slate-200 rounded bg-white text-xs font-medium"
            >
              <option value="block">Block</option>
              <option value="page">Page</option>
              <option value="image">Image</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        {anchorType === 'block' && blocks.length > 0 && (
          <div className="text-[11px] text-slate-500">
            <label className="block mb-0.5">Target Manuscript Block:</label>
            <select
              value={anchorId}
              onChange={(e) => setAnchorId(e.target.value)}
              className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50 truncate"
            >
              {blocks.map((b, idx) => (
                <option key={b.id} value={b.id}>
                  #{idx + 1} [{b.type}] {b.text.substring(0, 50)}...
                </option>
              ))}
            </select>
          </div>
        )}

        {anchorType === 'image' && images.length > 0 && (
          <div className="text-[11px] text-slate-500">
            <label className="block mb-0.5">Target Image:</label>
            <select
              value={anchorId}
              onChange={(e) => setAnchorId(e.target.value)}
              className="w-full px-2 py-1 border border-slate-200 rounded text-xs bg-slate-50 truncate"
            >
              {images.map((img) => (
                <option key={img.id} value={img.id}>
                  {img.filename}
                </option>
              ))}
            </select>
          </div>
        )}

        {anchorType === 'page' && (
          <div className="text-[11px] text-slate-500 flex items-center space-x-2">
            <label>Target Page Number:</label>
            <input
              type="number"
              min={1}
              value={pageNumber}
              onChange={(e) => setPageNumber(parseInt(e.target.value, 10) || 1)}
              className="w-16 px-2 py-1 border border-slate-200 rounded text-xs"
            />
          </div>
        )}

        <textarea
          id="new-comment-textarea"
          rows={2}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Leave editorial feedback or formatting questions..."
          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="flex justify-end">
          <button
            id="post-comment-btn"
            type="submit"
            disabled={!newContent.trim()}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            <span>Post Comment</span>
          </button>
        </div>
      </form>

      {/* Filter and Comments Thread List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">
            Comments & Review ({filteredComments.length})
          </span>
          <div className="flex items-center space-x-1 text-[11px]">
            {(['all', 'open', 'resolved'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilter(mode)}
                className={`px-2 py-0.5 rounded capitalize font-medium transition-colors ${
                  filter === mode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {filteredComments.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs text-slate-500">No {filter !== 'all' ? filter : ''} comments found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredComments.map((comment) => (
              <div
                key={comment.id}
                className={`p-3.5 border rounded-xl space-y-2.5 transition-all ${
                  comment.status === 'resolved'
                    ? 'bg-slate-50/80 border-slate-200 opacity-75'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{comment.authorName}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {comment.anchorType === 'block' && `Block #${comment.anchorId?.slice(-4)}`}
                      {comment.anchorType === 'page' && `Page ${comment.pageNumber}`}
                      {comment.anchorType === 'image' && `Image`}
                      {comment.anchorType === 'general' && `General`}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(comment)}
                      title={comment.status === 'open' ? 'Resolve comment' : 'Reopen comment'}
                      className={`p-1 rounded text-xs font-semibold flex items-center space-x-1 ${
                        comment.status === 'open'
                          ? 'text-slate-400 hover:text-emerald-600'
                          : 'text-emerald-600 bg-emerald-50'
                      }`}
                    >
                      {comment.status === 'open' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Resolved</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      title="Delete comment"
                      className="p-1 text-slate-300 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="pl-3 border-l-2 border-indigo-100 space-y-2 pt-1">
                    {comment.replies.map((rep) => (
                      <div key={rep.id} className="text-xs space-y-0.5">
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-800">{rep.authorName}</span>
                          <span>•</span>
                          <span>{new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{rep.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {activeReplyId === comment.id ? (
                  <div className="pt-2 flex items-center space-x-2">
                    <input
                      type="text"
                      value={replyInputs[comment.id] || ''}
                      onChange={(e) =>
                        setReplyInputs({ ...replyInputs, [comment.id]: e.target.value })
                      }
                      placeholder="Write a reply..."
                      className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddReply(comment.id)}
                      className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                    >
                      Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveReplyId(null)}
                      className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveReplyId(comment.id)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 pt-1"
                  >
                    <CornerDownRight className="w-3 h-3" />
                    <span>Reply</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

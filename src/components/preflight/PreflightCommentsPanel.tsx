'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  User,
  Clock,
  CheckCircle2,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { PreflightJob, PreflightComment } from '@/types/preflight';
import { preflightJobRepository } from '@/services/preflight/preflightJobRepository';
import { bookRepository } from '@/services/storage/bookRepository';

interface PreflightCommentsPanelProps {
  job: PreflightJob;
  onJobUpdated: (updatedJob: PreflightJob) => void;
  selectedPageNumber?: number;
}

export const PreflightCommentsPanel: React.FC<PreflightCommentsPanelProps> = ({
  job,
  onJobUpdated,
  selectedPageNumber,
}) => {
  const [commentText, setCommentText] = useState('');
  const [targetScope, setTargetScope] = useState<'document' | 'page'>('document');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const comments = job.comments || [];
  const filteredComments = comments.filter((c) => {
    if (targetScope === 'page' && selectedPageNumber !== undefined) {
      return c.pageNumber === selectedPageNumber;
    }
    return true;
  });

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const activeUser = bookRepository.getActiveUser();
      const user = activeUser
        ? {
            userId: activeUser.userId,
            displayName: activeUser.displayName,
            email: activeUser.userEmail,
          }
        : {
            userId: 'guest-publisher',
            displayName: 'Guest Publisher',
            email: 'publisher@ats.local',
          };

      const updatedJob = await preflightJobRepository.addComment(
        job.id,
        user,
        commentText.trim(),
        targetScope === 'page' ? selectedPageNumber : undefined
      );

      setCommentText('');
      onJobUpdated(updatedJob);
    } catch (err) {
      console.error('Failed to add preflight comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col h-full text-xs">
      {/* Panel Header */}
      <div className="px-4 py-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-rose-500" />
          <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
            Prepress Notes & Collaboration
          </h4>
        </div>

        {/* Scope Filter */}
        <div className="flex items-center bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
          <button
            type="button"
            onClick={() => setTargetScope('document')}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
              targetScope === 'document'
                ? 'bg-rose-600 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Notes ({comments.length})
          </button>
          {selectedPageNumber !== undefined && (
            <button
              type="button"
              onClick={() => setTargetScope('page')}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                targetScope === 'page'
                  ? 'bg-rose-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Page {selectedPageNumber}
            </button>
          )}
        </div>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px] max-h-[340px]">
        {filteredComments.length === 0 ? (
          <div className="py-8 text-center text-neutral-500">
            <p>No anchored notes yet.</p>
            <p className="text-[10px] text-neutral-600 mt-0.5">
              Leave instructions for designers, prepress operators, or print shops.
            </p>
          </div>
        ) : (
          filteredComments.map((c) => (
            <div
              key={c.id}
              className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1.5"
            >
              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                <div className="flex items-center space-x-1.5 font-bold text-neutral-300">
                  <div className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px]">
                    {(c.authorName || c.author?.displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span>{c.authorName || c.author?.displayName || 'Prepress Operator'}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {c.pageNumber && (
                    <span className="px-1.5 py-0.2 bg-neutral-800 text-neutral-300 rounded font-mono">
                      Pg {c.pageNumber}
                    </span>
                  )}
                  <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <p className="text-neutral-200 text-xs leading-relaxed">{c.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleAddComment} className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center space-x-2">
        <input
          type="text"
          id="preflight-comment-input"
          value={commentText}
          disabled={isSubmitting}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={
            targetScope === 'page' && selectedPageNumber !== undefined
              ? `Add note for Page ${selectedPageNumber}...`
              : 'Add document note for prepress or team...'
          }
          className="flex-1 bg-neutral-900 border border-neutral-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-rose-500 transition-colors"
        />
        <button
          type="submit"
          id="send-preflight-comment-btn"
          disabled={!commentText.trim() || isSubmitting}
          className="p-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-lg transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

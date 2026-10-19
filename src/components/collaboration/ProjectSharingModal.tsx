'use client';

import React, { useState, useEffect } from 'react';
import { ProjectMember, ProjectInvitation } from '@/types/cloud';
import { UserRole } from '@/types/auth';
import { cloudProjectService } from '@/services/cloud/cloudProjectService';
import { bookRepository } from '@/services/storage/bookRepository';
import {
  X,
  Share2,
  Mail,
  UserPlus,
  Shield,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';

interface ProjectSharingModalProps {
  isOpen: boolean;
  projectId: string;
  projectTitle: string;
  onClose: () => void;
}

export const ProjectSharingModal: React.FC<ProjectSharingModalProps> = ({
  isOpen,
  projectId,
  projectTitle,
  onClose,
}) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('editor');
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeUser = bookRepository.getActiveUser();

  const loadMembers = async () => {
    if (!activeUser) return;
    try {
      const list = await cloudProjectService.listMembers(projectId, activeUser);
      setMembers(list);
    } catch (err) {
      console.error('Error loading members:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      loadMembers().finally(() => setIsLoading(false));
      setInvitationLink(null);
      setError(null);
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeUser) return;

    setIsInviting(true);
    setError(null);

    try {
      const inv = await cloudProjectService.inviteCollaborator(
        projectId,
        inviteEmail,
        inviteRole,
        activeUser
      );
      const link = `${window.location.origin}/invite?token=${inv.token}`;
      setInvitationLink(link);
      setInviteEmail('');
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Error sending invitation.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, userId: string, newRole: UserRole) => {
    if (!activeUser) return;
    try {
      await cloudProjectService.updateMemberRole(projectId, userId, newRole, activeUser);
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Error updating collaborator role.');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeUser) return;
    if (!confirm('Are you sure you want to remove this collaborator from the project?')) return;
    try {
      await cloudProjectService.removeMember(projectId, userId, activeUser);
      await loadMembers();
    } catch (err: any) {
      setError(err.message || 'Error removing collaborator.');
    }
  };

  const handleCopyLink = () => {
    if (!invitationLink) return;
    navigator.clipboard.writeText(invitationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="share-modal-title" className="text-base font-bold text-slate-900">
                Project Collaborators & Sharing
              </h2>
              <p className="text-xs text-slate-500">
                {projectTitle} • Role-based access control and team review
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-sharing-modal-btn"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-800">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Invite Form */}
          <form onSubmit={handleSendInvite} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="font-bold text-slate-800 flex items-center space-x-1.5">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <span>Invite New Collaborator</span>
            </span>

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-7">
                <input
                  id="invite-email-input"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="collaborator@publisher.com"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="col-span-3">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full text-xs px-2 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="editor">Editor</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="viewer">Viewer</option>
                  <option value="owner">Co-Owner</option>
                </select>
              </div>

              <div className="col-span-2">
                <button
                  id="send-invitation-btn"
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs flex items-center justify-center disabled:opacity-50"
                >
                  {isInviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Invite</span>}
                </button>
              </div>
            </div>

            {/* Role Descriptions */}
            <div className="text-[10px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-100 space-y-0.5">
              <p><strong>Editor:</strong> Edit manuscript, modify design, manage images, export.</p>
              <p><strong>Reviewer:</strong> View manuscript, post & resolve review comments, read-only layout.</p>
              <p><strong>Viewer:</strong> Read-only book spread preview.</p>
            </div>
          </form>

          {/* Invitation Link Banner */}
          {invitationLink && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                <span>Invitation Dispatched & Ready</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] flex items-center space-x-1"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
              <p className="text-[10px] text-emerald-800 font-mono break-all bg-white p-2 rounded border border-emerald-100">
                {invitationLink}
              </p>
            </div>
          )}

          {/* Active Members List */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800">
              Active Collaborators ({members.length})
            </span>

            {isLoading ? (
              <div className="py-6 text-center text-slate-400">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                No external collaborators invited yet. Use the invite form above to add editors and reviewers.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {members.map((member) => (
                  <div key={member.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{member.displayName}</p>
                      <p className="text-[11px] text-slate-500">{member.email}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, member.userId, e.target.value as UserRole)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-700"
                      >
                        <option value="owner">Owner</option>
                        <option value="editor">Editor</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="viewer">Viewer</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.userId)}
                        title="Remove collaborator"
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

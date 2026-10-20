'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookProject } from '@/types/book';
import { PreflightJob } from '@/types/preflight';
import { bookRepository } from '@/services/storage/bookRepository';
import { preflightJobRepository } from '@/services/preflight/preflightJobRepository';
import { getHandoffRepository } from '@/services/handoff/handoffRepository';
import { HandoffRecord } from '@/types/impositionHandoff';
import { UserProfile } from '@/types/auth';
import {
  BookOpen,
  ShieldCheck,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export type ActivityModule = 'all' | 'easybook' | 'preflight' | 'impose' | 'handoff';

export interface UnifiedActivityItem {
  id: string;
  module: 'easybook' | 'preflight' | 'impose' | 'handoff';
  title: string;
  subtitle: string;
  status: 'draft' | 'passed' | 'warning' | 'error' | 'repaired' | 'claimed' | 'pending' | 'completed';
  statusLabel: string;
  ownerEmail: string;
  date: string;
  actionUrl: string;
  actionLabel: string;
  details?: Record<string, any>;
}

export const UnifiedActivityFeed: React.FC = () => {
  const [items, setItems] = useState<UnifiedActivityItem[]>([]);
  const [filterModule, setFilterModule] = useState<ActivityModule>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    setIsLoading(true);
    try {
      const feed: UnifiedActivityItem[] = [];

      // 1. EasyBook Projects
      try {
        const books = await bookRepository.getAllBooks();
        books.forEach((b) => {
          const isRtl = b.languageSettings?.direction === 'rtl' || b.languageSettings?.language === 'ar' || b.languageSettings?.language === 'ur';
          feed.push({
            id: `easybook-${b.id}`,
            module: 'easybook',
            title: b.title,
            subtitle: `${(b as any).pageCount || b.formattedBlocks?.length || 1} pages • ${(b as any).trimSize || (b as any).exportOptions?.paperSize || '6x9'} • ${isRtl ? 'RTL' : 'LTR'}`,
            status: 'draft',
            statusLabel: 'Draft / Layout',
            ownerEmail: b.author || 'local-author',
            date: b.updatedAt || b.createdAt || new Date().toISOString(),
            actionUrl: `/books/${b.id}`,
            actionLabel: 'Open Book',
          });
        });
      } catch (e) {
        console.warn('Failed to load books for activity feed', e);
      }

      // 2. Preflight Jobs
      try {
        const preflightJobs = await preflightJobRepository.listJobs();
        preflightJobs.forEach((j) => {
          const isCompliant = j.latestReport?.isCompliant || j.repairedReport?.isCompliant;
          feed.push({
            id: `preflight-${j.id}`,
            module: 'preflight',
            title: j.title || j.originalFilename,
            subtitle: `${j.pageCount} pages • Profile: ${j.profileId} • Score: ${j.latestReport?.score ?? 'N/A'}/100`,
            status: isCompliant ? (j.repairedReport ? 'repaired' : 'passed') : 'warning',
            statusLabel: isCompliant ? (j.repairedReport ? 'Repaired PDF' : 'Print Ready') : 'Needs Review',
            ownerEmail: j.uploadedBy?.email || 'prepress-team',
            date: j.updatedAt || j.createdAt || new Date().toISOString(),
            actionUrl: `/preflight/${j.id}`,
            actionLabel: 'View Report',
          });
        });
      } catch (e) {
        console.warn('Failed to load preflight jobs for activity feed', e);
      }

      // 3. Impose Handoffs
      try {
        const handoffRepo = getHandoffRepository();
        const handoffs = handoffRepo.listHandoffs();
        handoffs.forEach((h) => {
          feed.push({
            id: `handoff-${h.id}`,
            module: 'handoff',
            title: `${h.payload.document.title} (Prepress Handoff)`,
            subtitle: `${h.payload.document.totalPageCount}p • ${h.payload.impositionIntent.bindingType} • ${h.payload.impositionIntent.estimatedSignaturesCount} signatures`,
            status: h.status === 'claimed' ? 'completed' : h.status === 'expired' ? 'error' : 'pending',
            statusLabel: h.status === 'claimed' ? 'Claimed in Impose' : h.status === 'expired' ? 'Expired' : 'Awaiting Claim',
            ownerEmail: h.createdByEmail,
            date: h.createdAt,
            actionUrl: `/Impose/?handoffId=${h.id}`,
            actionLabel: h.status === 'claimed' ? 'Open in Impose' : 'Claim in Impose',
          });
        });
      } catch (e) {
        console.warn('Failed to load handoffs for activity feed', e);
      }

      // Sort chronological descending
      feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setItems(feed);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesModule = filterModule === 'all' || item.module === filterModule;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ownerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesSearch;
  });

  const getModuleBadge = (mod: UnifiedActivityItem['module']) => {
    switch (mod) {
      case 'easybook':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-mono font-bold uppercase">
            <BookOpen className="w-3 h-3" />
            <span>EasyBook</span>
          </span>
        );
      case 'preflight':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
            <ShieldCheck className="w-3 h-3" />
            <span>Preflight</span>
          </span>
        );
      case 'handoff':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold uppercase">
            <Layers className="w-3 h-3" />
            <span>Handoff</span>
          </span>
        );
      case 'impose':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold uppercase">
            <Layers className="w-3 h-3" />
            <span>Impose</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: UnifiedActivityItem['status'], label: string) => {
    switch (status) {
      case 'passed':
      case 'completed':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{label}</span>
          </span>
        );
      case 'repaired':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{label}</span>
          </span>
        );
      case 'warning':
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 text-[10px] font-bold">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>{label}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800 text-[10px] font-bold">
            <span>{label}</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-6">
      {/* Activity Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Unified Platform Activity</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-600/20 text-rose-400 text-xs font-mono font-bold">
              {filteredItems.length}
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Cross-module timeline for EasyBook manuscripts, Preflight inspections, and Impose press handoffs.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-900 rounded-lg border border-neutral-800 text-xs font-semibold">
          {(['all', 'easybook', 'preflight', 'handoff'] as ActivityModule[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFilterModule(m)}
              className={`px-3 py-1 rounded-md transition-colors ${
                filterModule === m
                  ? 'bg-rose-600 text-white font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter activity by title, specification, or operator..."
          className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-rose-500 transition-colors"
        />
      </div>

      {/* Activity Table */}
      {isLoading ? (
        <div className="py-12 text-center text-xs font-mono text-neutral-500">
          Loading platform activity...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-12 text-center text-xs text-neutral-400 space-y-1">
          <p className="font-semibold text-neutral-300">No activity matching criteria.</p>
          <p>Create a book project or inspect a PDF to populate the platform activity log.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900/80 text-neutral-400 text-[10px] font-mono uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Project / Asset</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Operator</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-900/40 transition-colors group">
                  <td className="py-3 px-3">{getModuleBadge(item.module)}</td>
                  <td className="py-3 px-3 max-w-xs">
                    <span className="font-bold text-white block truncate">{item.title}</span>
                    <span className="text-[11px] text-neutral-400 block truncate">{item.subtitle}</span>
                  </td>
                  <td className="py-3 px-3">{getStatusBadge(item.status, item.statusLabel)}</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-neutral-400 truncate max-w-[120px]">
                    {item.ownerEmail}
                  </td>
                  <td className="py-3 px-3 text-neutral-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      href={item.actionUrl}
                      className="inline-flex items-center space-x-1 px-3 py-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white rounded-md text-[11px] font-semibold transition-colors border border-neutral-800"
                    >
                      <span>{item.actionLabel}</span>
                      <ChevronRight className="w-3 h-3 text-neutral-500 group-hover:text-rose-400 transition-colors" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

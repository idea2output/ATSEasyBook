import React from 'react';
import Link from 'next/link';
import { BookProject } from '@/types/book';
import { getTemplateById } from '@/services/templates/templateRegistry';
import { BookOpen, Calendar, Trash2, Edit3, ArrowRight } from 'lucide-react';

interface BookCardProps {
  book: BookProject;
  onDelete: (id: string, title: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onDelete }) => {
  const template = getTemplateById(book.templateId);
  const wordsCount = book.rawManuscript
    ? book.rawManuscript.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const formattedDate = new Date(book.updatedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {template.name}
              </span>
              <div className="flex items-center space-x-1.5 mt-1">
                {book.storageBackend === 'cloud' ? (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Cloud {book.currentUserRole ? `• ${book.currentUserRole}` : ''}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                    Local-only
                  </span>
                )}
                {book.revision ? (
                  <span className="text-[10px] font-mono text-slate-400">r{book.revision}</span>
                ) : null}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onDelete(book.id, book.title);
            }}
            aria-label={`Delete book ${book.title}`}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <h3 className="mt-4 font-semibold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {book.title || 'Untitled Book'}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Last edited: {formattedDate}</span>
          </div>
          <div>
            <span>•</span>
            <span className="ml-2 font-medium text-slate-700">{wordsCount.toLocaleString()} words</span>
          </div>
          <div>
            <span>•</span>
            <span className="ml-2 text-slate-500">{book.formattedBlocks?.length || 0} blocks</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Format: {template.pageWidthInches}&quot; × {template.pageHeightInches}&quot; Trade
        </span>

        <Link
          href={`/books/${book.id}`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 group/btn"
        >
          <span>Open Studio</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
};

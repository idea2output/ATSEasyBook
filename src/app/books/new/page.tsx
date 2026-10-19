'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/common/Navbar';
import { templateRepository } from '@/services/templates/templateRepository';
import { bookRepository } from '@/services/storage/bookRepository';
import { BookTemplate, EditorMode } from '@/types/book';
import { CUSTOM_PAGE_DEFAULT } from '@/services/templates/templateRegistry';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Sliders,
  PenTool,
  Check,
  Columns,
  Maximize2,
  Bookmark,
  Layers,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

export default function CreateBookPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('classic-novel-6x9');
  const [selectedMode, setSelectedMode] = useState<EditorMode>('beginner');
  const [templates, setTemplates] = useState<BookTemplate[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const list = templateRepository.getAllTemplatesSync();
    // In Expert mode, include Custom Page option
    const combined = [...list];
    if (!combined.some((t) => t.id === 'custom-page-template')) {
      combined.push(CUSTOM_PAGE_DEFAULT);
    }
    setTemplates(combined);
    if (combined.length > 0 && !combined.find((t) => t.id === selectedTemplateId)) {
      setSelectedTemplateId(combined[0].id);
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const bookTitle = title.trim() || 'Untitled Manuscript';
      const bookAuthor = author.trim() || 'Anonymous';
      const created = await bookRepository.createBook(
        bookTitle,
        bookAuthor,
        selectedTemplateId,
        selectedMode
      );
      router.push(`/books/${created.id}`);
    } catch (err) {
      console.error('Failed to create book project:', err);
      setIsSubmitting(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Back Link */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Dashboard
          </button>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-3 border border-indigo-100">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Template-First Project Setup</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Create a New Book
          </h1>
          <p className="mt-1.5 text-base text-slate-600 max-w-2xl">
            Choose an industry-standard publishing template and workflow mode to format your manuscript with professional typography and print geometry.
          </p>
        </div>

        <form onSubmit={handleCreate} className="space-y-10">
          {/* Metadata Section */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <PenTool className="w-5 h-5 text-indigo-600" />
              <span>Project Information</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="book-title"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2"
                >
                  Book Title
                </label>
                <input
                  id="book-title"
                  type="text"
                  placeholder="e.g. The Secrets of the Archipelago"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="book-author"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2"
                >
                  Author Name
                </label>
                <input
                  id="book-author"
                  type="text"
                  placeholder="e.g. Dr. Eleanor Vance"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50/70 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <span>Select Workflow Mode</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                You can switch between modes at any time inside the editor without losing any settings.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Beginner Mode Card */}
              <div
                onClick={() => setSelectedMode('beginner')}
                className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                  selectedMode === 'beginner'
                    ? 'border-indigo-600 bg-indigo-50/30 shadow-md ring-2 ring-indigo-600/10'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        selectedMode === 'beginner'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                        <span>Beginner Mode</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Recommended
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">Content-focused studio</p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      selectedMode === 'beginner'
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {selectedMode === 'beginner' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <ul className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Distraction-free manuscript editor with autosave</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Curated typography & standard page templates</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Real-time preflight checks & print-ready PDF export</span>
                  </li>
                </ul>
              </div>

              {/* Expert Mode Card */}
              <div
                onClick={() => setSelectedMode('expert')}
                className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                  selectedMode === 'expert'
                    ? 'border-purple-600 bg-purple-50/30 shadow-md ring-2 ring-purple-600/10'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        selectedMode === 'expert'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                        <span>Expert Mode</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                          Full Control
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">Advanced styling & layout engine</p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      selectedMode === 'expert'
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {selectedMode === 'expert' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <ul className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <span>Custom background colors, textures & inset borders</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <span>Upload custom TTF, OTF, WOFF & WOFF2 web fonts</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <span>Save customized designs as reusable project templates</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Template Gallery */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span>Choose Starting Template</span>
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Select a trim size and layout structure tailored to your publication type.
                </p>
              </div>
              {selectedTemplate && (
                <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg self-start sm:self-auto">
                  Selected: <span className="font-bold">{selectedTemplate.name}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {templates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId;
                const isCustom = tpl.isCustom;
                const isTwoCol = tpl.columns.count === 2;

                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`group relative flex flex-col justify-between rounded-2xl border-2 p-5 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-600/10'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white'
                    }`}
                  >
                    <div>
                      {/* Visual Layout Thumbnail */}
                      <div className="h-32 mb-4 bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-center p-3 relative overflow-hidden group-hover:bg-slate-50 transition-colors">
                        {/* Miniature Page preview */}
                        <div
                          className="bg-white shadow-sm rounded-sm border border-slate-300 flex flex-col justify-between p-2"
                          style={{
                            width: `${Math.round((tpl.pageWidthInches / 8.5) * 80)}px`,
                            height: '100px',
                            backgroundColor: tpl.design?.backgroundColor || '#ffffff',
                          }}
                        >
                          {/* Mini Header */}
                          <div className="w-full flex items-center justify-between pb-1 border-b border-slate-200/60 text-[6px] text-slate-400">
                            <span className="w-4 h-0.5 bg-slate-300 rounded"></span>
                            <span className="w-2 h-0.5 bg-slate-300 rounded"></span>
                          </div>

                          {/* Mini Content Columns */}
                          <div className={`flex-1 pt-1.5 flex ${isTwoCol ? 'space-x-1.5' : 'flex-col space-y-1'}`}>
                            {isTwoCol ? (
                              <>
                                <div className="flex-1 flex flex-col space-y-0.5">
                                  <div className="w-full h-0.5 bg-slate-300 rounded"></div>
                                  <div className="w-4/5 h-0.5 bg-slate-300 rounded"></div>
                                  <div className="w-full h-0.5 bg-slate-200 rounded"></div>
                                </div>
                                <div className="flex-1 flex flex-col space-y-0.5">
                                  <div className="w-full h-0.5 bg-slate-300 rounded"></div>
                                  <div className="w-3/4 h-0.5 bg-slate-300 rounded"></div>
                                  <div className="w-full h-0.5 bg-slate-200 rounded"></div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="w-2/3 h-1 bg-slate-700 rounded-sm mb-1"></div>
                                <div className="w-full h-0.5 bg-slate-300 rounded"></div>
                                <div className="w-11/12 h-0.5 bg-slate-300 rounded"></div>
                                <div className="w-4/5 h-0.5 bg-slate-300 rounded"></div>
                                <div className="w-full h-0.5 bg-slate-200 rounded"></div>
                              </>
                            )}
                          </div>

                          {/* Mini Footer / Page Number */}
                          <div className="w-full flex justify-center pt-1 border-t border-slate-100 text-[6px]">
                            <div className="w-2 h-0.5 bg-slate-400 rounded-full"></div>
                          </div>
                        </div>

                        {/* Badges on thumbnail */}
                        <div className="absolute top-2.5 right-2.5 flex items-center space-x-1">
                          {isCustom && (
                            <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-full shadow-sm">
                              Custom
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-slate-800 text-white text-[10px] font-semibold rounded-md opacity-90">
                            {tpl.pageWidthInches}″ × {tpl.pageHeightInches}″
                          </span>
                        </div>
                      </div>

                      {/* Title & Trim */}
                      <div className="flex items-start justify-between mb-1.5">
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {tpl.name}
                        </h3>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center border flex-shrink-0 ml-2 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-500 mb-2">
                        <span className="flex items-center space-x-1">
                          <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tpl.pageWidthInches} × {tpl.pageHeightInches} in</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Columns className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tpl.columns.count === 2 ? 'Two Columns' : 'Single Column'}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {tpl.description}
                      </p>
                    </div>

                    {/* Suitability Tags */}
                    {(() => {
                      const tags = Array.isArray(tpl.suitability)
                        ? tpl.suitability
                        : typeof tpl.suitability === 'string'
                        ? tpl.suitability.split(',').map((s) => s.trim()).filter(Boolean)
                        : [];
                      if (tags.length === 0) return null;
                      return (
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center space-x-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Studio...</span>
                </>
              ) : (
                <>
                  <span>Create Project</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import { BookOpen, Layers, BookText } from 'lucide-react';

interface NavbarProps {
  currentBookTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentBookTitle }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="flex items-center space-x-2.5 text-indigo-700 hover:text-indigo-800 transition-colors font-semibold text-lg"
          >
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-bold tracking-tight text-slate-900">
              ATS <span className="text-indigo-600">EasyBook</span>
            </span>
          </Link>

          {currentBookTitle && (
            <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-500 pl-3 border-l border-slate-200">
              <BookText className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-slate-800 truncate max-w-xs md:max-w-md">
                {currentBookTitle}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-200">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Professional Publishing Suite</span>
          </div>

          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100"
          >
            All Books
          </Link>
        </div>
      </div>
    </header>
  );
};

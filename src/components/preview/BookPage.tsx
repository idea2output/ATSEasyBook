import React from 'react';
import { PagePreviewData, BookTemplate } from '@/types/book';

interface BookPageProps {
  page?: PagePreviewData;
  template: BookTemplate;
  isPlaceholder?: boolean;
}

export const BookPage: React.FC<BookPageProps> = ({ page, template, isPlaceholder = false }) => {
  if (isPlaceholder || !page) {
    return (
      <div
        className="book-page-container bg-slate-100 border border-dashed border-slate-300 rounded-sm flex items-center justify-center select-none"
        style={{ width: `${template.pageWidthInches}in`, height: `${template.pageHeightInches}in` }}
      >
        <span className="text-xs text-slate-400 font-sans tracking-wide">
          (Blank Endpaper)
        </span>
      </div>
    );
  }

  const isVerso = page.isLeft; // Even = Verso (Left), Odd = Recto (Right)
  const isOpeningChapterPage = page.blocks.some((b) => b.type === 'chapter-heading');

  // Asymmetric book margins: binding inside edge has greater gutter
  const paddingLeft = isVerso ? template.margins.outside : template.margins.inside;
  const paddingRight = isVerso ? template.margins.inside : template.margins.outside;
  const paddingTop = template.margins.top;
  const paddingBottom = template.margins.bottom;

  return (
    <div
      data-testid={`book-page-${page.pageNumber}`}
      className={`book-page-container border border-slate-200 select-text ${
        isVerso ? 'book-page-shadow-left' : 'book-page-shadow-right'
      }`}
      style={{
        width: `${template.pageWidthInches}in`,
        height: `${template.pageHeightInches}in`,
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
        fontFamily: template.typography.fontFamily,
      }}
    >
      {/* Spine crease shadow effect */}
      <div className={`book-spine-crease ${isVerso ? 'book-spine-left' : 'book-spine-right'}`} />

      {/* Running Top Header */}
      <div
        className={`h-6 text-[9pt] uppercase tracking-widest text-slate-500 font-sans flex items-center border-b border-slate-100/70 mb-3 select-none ${
          isOpeningChapterPage || page.pageNumber === 1 ? 'invisible' : 'visible'
        } ${isVerso ? 'justify-start' : 'justify-end'}`}
      >
        <span className="truncate max-w-[85%]">{page.headerText || ''}</span>
      </div>

      {/* Main Page Flow Content */}
      <div className="flex-1 overflow-hidden flex flex-col justify-start">
        {page.blocks.map((block, idx) => {
          if (block.type === 'chapter-heading') {
            return (
              <div key={`${block.blockId}-${idx}`} className="pt-6 pb-4 text-center">
                <h2
                  className="font-bold tracking-tight text-slate-900 leading-snug"
                  style={{
                    fontSize: `${template.typography.chapterHeadingFontSizePt}pt`,
                    lineHeight: template.typography.chapterHeadingLineHeight,
                  }}
                >
                  {block.text}
                </h2>
                <div className="w-12 h-0.5 bg-slate-300 mx-auto mt-3 mb-2" />
              </div>
            );
          }

          // Paragraph styling: classic book indentation
          const isAfterHeading = idx > 0 && page.blocks[idx - 1].type === 'chapter-heading';
          const isContinuation = block.isContinuation;
          const shouldIndent = !isAfterHeading && !isContinuation;

          return (
            <p
              key={`${block.blockId}-${idx}`}
              className={`text-slate-800 text-justify hyphens-auto mb-2 ${
                shouldIndent ? 'indent-6' : 'indent-0'
              }`}
              style={{
                fontSize: `${template.typography.bodyFontSizePt}pt`,
                lineHeight: template.typography.bodyLineHeight,
              }}
            >
              {block.text}
            </p>
          );
        })}
      </div>

      {/* Running Bottom Page Number */}
      <div
        className={`h-6 text-[9pt] text-slate-500 font-sans flex items-center select-none pt-2 ${
          isVerso ? 'justify-start' : 'justify-end'
        }`}
      >
        <span className="font-medium tracking-wider">{page.pageNumber}</span>
      </div>
    </div>
  );
};

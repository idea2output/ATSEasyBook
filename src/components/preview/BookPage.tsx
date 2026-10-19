import React from 'react';
import {
  PagePreviewData,
  BookTemplate,
  PageBlock,
  PageDesignSettings,
  TypographySettings,
  LanguageSettings,
} from '@/types/book';
import { getEffectiveAspectRatio } from '@/services/images/imageService';
import { getEffectiveTypography } from '@/services/templates/templateRegistry';
import { formatNumerals } from '@/services/rtl/bidiService';

interface BookPageProps {
  page?: PagePreviewData;
  template: BookTemplate;
  authorName?: string;
  typographyOverrides?: Partial<TypographySettings>;
  design?: Partial<PageDesignSettings>;
  isPlaceholder?: boolean;
  selectedPlacementId?: string | null;
  onSelectPlacement?: (placementId: string) => void;
  languageSettings?: LanguageSettings;
}

export const BookPage: React.FC<BookPageProps> = ({
  page,
  template,
  authorName = '',
  typographyOverrides,
  design,
  isPlaceholder = false,
  selectedPlacementId = null,
  onSelectPlacement,
  languageSettings,
}) => {
  const effectiveTypo = getEffectiveTypography(template, typographyOverrides, authorName);
  const isRtl = languageSettings?.direction === 'rtl';
  const numSystem = languageSettings?.numeralSystem || 'western';

  if (isPlaceholder || !page) {
    return (
      <div
        className="book-page-container bg-slate-100 border border-dashed border-slate-300 rounded-sm flex items-center justify-center select-none"
        style={{
          width: `${template.pageWidthInches}in`,
          height: `${template.pageHeightInches}in`,
        }}
      >
        <span className="text-xs text-slate-400 font-sans tracking-wide">
          (Blank Endpaper)
        </span>
      </div>
    );
  }

  const isVerso = page.isLeft; // Even = Verso (Left), Odd = Recto (Right)
  const isOpeningChapterPage = page.blocks.some((b) => b.type === 'chapter-heading');

  // Asymmetric book margins: binding inside edge has greater gutter.
  // In RTL books (spine on right):
  // Verso (left page): inside edge is on the left, outside edge is on the right!
  // Recto (right page): inside edge is on the right, outside edge is on the left!
  let paddingLeft = isVerso ? template.margins.outside : template.margins.inside;
  let paddingRight = isVerso ? template.margins.inside : template.margins.outside;
  if (isRtl) {
    paddingLeft = isVerso ? template.margins.inside : template.margins.outside;
    paddingRight = isVerso ? template.margins.outside : template.margins.inside;
  }

  const paddingTop = template.margins.top;
  const paddingBottom = template.margins.bottom;

  // Render a block helper
  const renderBlock = (block: PageBlock, idx: number, colBlocks: PageBlock[]) => {
    const blockDir = block.direction || (isRtl ? 'rtl' : 'ltr');

    if (block.type === 'chapter-heading') {
      return (
        <div key={`${block.blockId}-${idx}`} dir={blockDir} className="pt-6 pb-4 text-center">
          <h2
            className="font-bold tracking-tight leading-snug"
            style={{
              fontFamily: effectiveTypo.headingFontFamily,
              fontSize: `${effectiveTypo.headingFontSizePt}pt`,
              lineHeight: template.typography.chapterHeadingLineHeight,
              color: design?.headingColor || '#0f172a',
            }}
          >
            {block.text}
          </h2>
          <div className="w-12 h-0.5 bg-slate-300 mx-auto mt-3 mb-2" />
        </div>
      );
    }

    if (block.type === 'quote') {
      return (
        <blockquote
          key={`${block.blockId}-${idx}`}
          dir={blockDir}
          className={`my-3 px-4 italic border-${isRtl ? 'r-4' : 'l-4'} border-slate-300 text-slate-700 leading-relaxed`}
          style={{
            fontFamily: effectiveTypo.bodyFontFamily,
            fontSize: `${effectiveTypo.bodyFontSizePt}pt`,
          }}
        >
          {block.text}
        </blockquote>
      );
    }

    if (block.type === 'image' && block.placement && block.image) {
      const placement = block.placement;
      const image = block.image;
      const crop = placement.crop || { x: 0, y: 0, width: 1, height: 1 };
      const effectiveAspectRatio = getEffectiveAspectRatio(image, crop);
      const isSelected = selectedPlacementId === placement.id;

      let figureClass = 'group relative transition-all rounded ';
      let figureStyle: React.CSSProperties = {};

      if (placement.mode === 'float-right') {
        // In RTL: float-right sits on the right margin (the start of the RTL reading flow)
        figureClass += 'float-right ml-4 mb-2.5 clear-right ';
        figureStyle = {
          width: `${placement.widthPercent || 45}%`,
        };
      } else if (placement.mode === 'full-width') {
        figureClass += 'w-full my-3 clear-both ';
      } else {
        // inline mode
        figureClass += 'my-2.5 clear-both mx-auto ';
        figureStyle = {
          width: `${placement.widthPercent || 100}%`,
        };
      }

      return (
        <figure
          key={`${block.blockId}-img-${placement.id}-${idx}`}
          data-testid={`placed-image-${placement.id}`}
          data-placement-id={placement.id}
          tabIndex={0}
          role="button"
          aria-label={`Placed image: ${image.filename}. Mode: ${placement.mode}. Click to edit.`}
          onClick={() => onSelectPlacement && onSelectPlacement(placement.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectPlacement && onSelectPlacement(placement.id);
            }
          }}
          className={`${figureClass} ${
            isSelected
              ? 'ring-2 ring-indigo-600 ring-offset-2'
              : 'hover:ring-1 hover:ring-indigo-300 cursor-pointer'
          }`}
          style={figureStyle}
        >
          {/* Cropped Image Box */}
          <div
            className="relative w-full overflow-hidden bg-slate-100 rounded-xs shadow-xs"
            style={{ aspectRatio: `${effectiveAspectRatio}` }}
          >
            <img
              src={image.dataUrl}
              alt={placement.altText || image.altText || image.filename}
              className="select-none"
              style={{
                position: 'absolute',
                width: `${(1 / Math.max(0.01, crop.width)) * 100}%`,
                height: `${(1 / Math.max(0.01, crop.height)) * 100}%`,
                left: `${(-crop.x / Math.max(0.01, crop.width)) * 100}%`,
                top: `${(-crop.y / Math.max(0.01, crop.height)) * 100}%`,
                maxWidth: 'none',
                maxHeight: 'none',
                objectFit: 'fill',
              }}
            />
          </div>

          {/* Caption */}
          {placement.caption && placement.caption.trim() && (
            <figcaption
              dir={blockDir}
              className="mt-1 text-[8.5pt] italic text-slate-700 text-center font-serif leading-tight"
            >
              {placement.caption}
            </figcaption>
          )}
        </figure>
      );
    }

    // Paragraph styling: classic book indentation & spacing
    const isAfterHeading = idx > 0 && colBlocks[idx - 1].type === 'chapter-heading';
    const isContinuation = block.isContinuation;
    const shouldIndent = !isAfterHeading && !isContinuation && effectiveTypo.paragraphIndentInches > 0;

    return (
      <p
        key={`${block.blockId}-${idx}`}
        dir={blockDir}
        className={`hyphens-auto ${
          blockDir === 'rtl'
            ? 'text-right'
            : effectiveTypo.textAlign === 'justify'
            ? 'text-justify'
            : 'text-left'
        }`}
        style={{
          fontFamily: effectiveTypo.bodyFontFamily,
          fontSize: `${effectiveTypo.bodyFontSizePt}pt`,
          lineHeight: effectiveTypo.bodyLineHeight,
          color: design?.textColor || '#1e293b',
          textIndent: shouldIndent ? `${effectiveTypo.paragraphIndentInches}in` : '0in',
          marginBottom: effectiveTypo.paragraphSpacingPt > 0 ? `${effectiveTypo.paragraphSpacingPt}pt` : '0.5rem',
        }}
      >
        {block.text}
      </p>
    );
  };

  const isTwoCol = template.columns.count === 2;
  const formattedPageNum = formatNumerals(String(page.pageNumber), numSystem);

  return (
    <div
      data-testid={`book-page-${page.pageNumber}`}
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`book-page-container relative border border-slate-200 select-text ${
        isVerso ? 'book-page-shadow-left' : 'book-page-shadow-right'
      }`}
      style={{
        width: `${template.pageWidthInches}in`,
        height: `${template.pageHeightInches}in`,
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
        fontFamily: effectiveTypo.bodyFontFamily,
        backgroundColor: design?.backgroundColor || '#ffffff',
        backgroundImage: (design?.backgroundImage || design?.backgroundImageUrl)
          ? `url(${design.backgroundImage || design.backgroundImageUrl})`
          : undefined,
        backgroundSize:
          design?.backgroundImageSize === 'tile'
            ? 'auto'
            : design?.backgroundImageSize || 'cover',
        backgroundRepeat: design?.backgroundImageSize === 'tile' ? 'repeat' : 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      {/* Decorative Inset Border Layer */}
      {design?.borderEnabled && (
        <div
          data-testid="page-decorative-border"
          className="absolute pointer-events-none"
          style={{
            top: `${design.borderInsetInches ?? 0.35}in`,
            bottom: `${design.borderInsetInches ?? 0.35}in`,
            left: `${design.borderInsetInches ?? 0.35}in`,
            right: `${design.borderInsetInches ?? 0.35}in`,
            borderWidth: `${design.borderWidthPt ?? 1}pt`,
            borderColor: design.borderColor || '#cbd5e1',
            borderStyle: design.borderStyle || 'solid',
            borderRadius: `${design.borderRadiusPt ?? 0}pt`,
          }}
        />
      )}

      {/* Template Fixed Design Layers (Governed Admin & Custom Layers) */}
      {template.layers && template.layers.length > 0 && template.layers.map((layer) => {
        if (layer.visible === false || layer.nonPrintingGuide) return null;
        const effectiveX = (layer.mirrorOnVerso && isVerso)
          ? template.pageWidthInches - (layer.xInches + layer.widthInches)
          : layer.xInches;

        return (
          <div
            key={layer.id}
            data-testid={`template-layer-${layer.id}`}
            className="absolute pointer-events-none overflow-hidden"
            style={{
              left: `${effectiveX}in`,
              top: `${layer.yInches}in`,
              width: `${layer.widthInches}in`,
              height: `${layer.heightInches}in`,
              zIndex: layer.zIndex ?? 1,
              opacity: layer.opacity ?? 1,
              transform: layer.rotationDeg ? `rotate(${layer.rotationDeg}deg)` : undefined,
              backgroundColor: layer.fillColor || (layer.type === 'solid' ? '#e2e8f0' : undefined),
              borderColor: layer.strokeColor,
              borderWidth: layer.strokeWidthPt ? `${layer.strokeWidthPt}pt` : undefined,
              borderStyle: layer.strokeStyle || 'solid',
              borderRadius: layer.borderRadiusPt ? `${layer.borderRadiusPt}pt` : (layer.type === 'shape' ? '9999px' : undefined),
            }}
          >
            {layer.type === 'image' && layer.imageDataUrl && (
              <img
                src={layer.imageDataUrl}
                alt={layer.name || 'Template Asset'}
                className="w-full h-full"
                style={{ objectFit: layer.imageFit === 'cover' ? 'cover' : 'contain' }}
              />
            )}
            {layer.type === 'text' && layer.text && (
              <div
                className="w-full h-full flex items-center"
                style={{
                  fontFamily: layer.fontFamily || effectiveTypo.bodyFontFamily,
                  fontSize: `${layer.fontSizePt || 10}pt`,
                  color: layer.textColor || '#0f172a',
                  justifyContent: layer.textAlign === 'center' ? 'center' : layer.textAlign === 'right' ? 'flex-end' : 'flex-start',
                }}
              >
                {layer.text}
              </div>
            )}
            {layer.type === 'page-number' && (
              <div
                className="w-full h-full flex items-center justify-center font-mono text-xs font-semibold"
                style={{ color: layer.textColor || '#64748b' }}
              >
                {formattedPageNum}
              </div>
            )}
            {layer.type === 'line' && (
              <div
                className="w-full h-full"
                style={{
                  backgroundColor: layer.strokeColor || '#94a3b8',
                  height: layer.strokeWidthPt ? `${layer.strokeWidthPt}pt` : '1px',
                }}
              />
            )}
          </div>
        );
      })}

      {/* Spine crease shadow effect */}
      <div
        className={`book-spine-crease ${
          isRtl
            ? isVerso
              ? 'book-spine-right'
              : 'book-spine-left'
            : isVerso
            ? 'book-spine-left'
            : 'book-spine-right'
        }`}
      />

      {/* Running Top Header */}
      <div
        className={`h-6 text-[9pt] uppercase tracking-widest font-sans flex items-center justify-between border-b border-slate-100/70 mb-3 select-none ${
          isOpeningChapterPage || page.pageNumber === 1 || page.isBlankPage ? 'invisible' : 'visible'
        }`}
        style={{ color: design?.headerFooterColor || '#64748b' }}
      >
        {/* Top-outside page number */}
        {effectiveTypo.pageNumberPosition === 'top-outside' && (isRtl ? !isVerso : isVerso) && (
          <span className="font-mono text-xs font-bold">{formattedPageNum}</span>
        )}

        <span className={`truncate max-w-[85%] ${isRtl ? 'text-right mr-auto' : isVerso ? 'text-left' : 'text-right ml-auto'}`}>
          {page.headerText || ''}
        </span>

        {effectiveTypo.pageNumberPosition === 'top-outside' && (isRtl ? isVerso : !isVerso) && (
          <span className="font-mono text-xs font-bold">{formattedPageNum}</span>
        )}
      </div>

      {/* Main Page Flow Content */}
      <div className="flex-1 overflow-hidden flex flex-col justify-start">
        {page.isBlankPage ? (
          <div className="h-full flex items-center justify-center text-slate-400 italic text-xs font-serif select-none">
            [This page intentionally left blank]
          </div>
        ) : isTwoCol && page.columns && page.columns.length === 2 ? (
          /* Two-Column Grid */
          <div
            className={`grid grid-cols-2 h-full gap-x-4 overflow-hidden ${isRtl ? 'direction-rtl' : ''}`}
            style={{ columnGap: template.columns.gap }}
          >
            <div className="flex flex-col justify-start overflow-hidden">
              {page.columns[isRtl ? 1 : 0].map((block, idx) => renderBlock(block, idx, page.columns![isRtl ? 1 : 0]))}
            </div>
            <div className="flex flex-col justify-start overflow-hidden">
              {page.columns[isRtl ? 0 : 1].map((block, idx) => renderBlock(block, idx, page.columns![isRtl ? 0 : 1]))}
            </div>
          </div>
        ) : (
          /* Single Column Flow */
          page.blocks.map((block, idx) => renderBlock(block, idx, page.blocks))
        )}
      </div>

      {/* Running Bottom Page Number */}
      <div
        className={`h-6 text-[9pt] font-sans flex items-center select-none pt-2 ${
          effectiveTypo.pageNumberPosition === 'bottom-center'
            ? 'justify-center'
            : isRtl
            ? isVerso
              ? 'justify-end'
              : 'justify-start'
            : isVerso
            ? 'justify-start'
            : 'justify-end'
        } ${effectiveTypo.pageNumberPosition === 'top-outside' || page.isBlankPage ? 'invisible' : 'visible'}`}
        style={{ color: design?.headerFooterColor || '#64748b' }}
      >
        <span className="font-medium tracking-wider">{formattedPageNum}</span>
      </div>
    </div>
  );
};

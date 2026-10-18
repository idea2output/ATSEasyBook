import {
  PagePreviewData,
  BookTemplate,
  PageBlock,
  PageDesignSettings,
  TypographySettings,
} from '@/types/book';
import { getEffectiveAspectRatio } from '@/services/images/imageService';
import { getEffectiveTypography } from '@/services/templates/templateRegistry';

interface BookPageProps {
  page?: PagePreviewData;
  template: BookTemplate;
  authorName?: string;
  typographyOverrides?: Partial<TypographySettings>;
  design?: Partial<PageDesignSettings>;
  isPlaceholder?: boolean;
  selectedPlacementId?: string | null;
  onSelectPlacement?: (placementId: string) => void;
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
}) => {
  const effectiveTypo = getEffectiveTypography(template, typographyOverrides, authorName);

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

  // Asymmetric book margins: binding inside edge has greater gutter
  const paddingLeft = isVerso ? template.margins.outside : template.margins.inside;
  const paddingRight = isVerso ? template.margins.inside : template.margins.outside;
  const paddingTop = template.margins.top;
  const paddingBottom = template.margins.bottom;

  // Render a block helper
  const renderBlock = (block: PageBlock, idx: number, colBlocks: PageBlock[]) => {
    if (block.type === 'chapter-heading') {
      return (
        <div key={`${block.blockId}-${idx}`} className="pt-6 pb-4 text-center">
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

    if (block.type === 'image' && block.placement && block.image) {
      const placement = block.placement;
      const image = block.image;
      const crop = placement.crop || { x: 0, y: 0, width: 1, height: 1 };
      const effectiveAspectRatio = getEffectiveAspectRatio(image, crop);
      const isSelected = selectedPlacementId === placement.id;

      let figureClass = 'group relative transition-all rounded ';
      let figureStyle: React.CSSProperties = {};

      if (placement.mode === 'float-right') {
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

          {/* Caption in classic novel style */}
          {placement.caption && placement.caption.trim() && (
            <figcaption className="mt-1 text-[8.5pt] italic text-slate-700 text-center font-serif leading-tight">
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
        className={`hyphens-auto ${
          effectiveTypo.textAlign === 'justify' ? 'text-justify' : 'text-left'
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

  return (
    <div
      data-testid={`book-page-${page.pageNumber}`}
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
      {/* Decorative Inset Border Layer (if enabled in Expert Design settings) */}
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

      {/* Spine crease shadow effect */}
      <div className={`book-spine-crease ${isVerso ? 'book-spine-left' : 'book-spine-right'}`} />

      {/* Running Top Header */}
      <div
        className={`h-6 text-[9pt] uppercase tracking-widest font-sans flex items-center justify-between border-b border-slate-100/70 mb-3 select-none ${
          isOpeningChapterPage || page.pageNumber === 1 || page.isBlankPage ? 'invisible' : 'visible'
        }`}
        style={{ color: design?.headerFooterColor || '#64748b' }}
      >
        {/* Top-outside page number */}
        {effectiveTypo.pageNumberPosition === 'top-outside' && isVerso && (
          <span className="font-mono text-xs font-bold">{page.pageNumber}</span>
        )}

        <span className={`truncate max-w-[85%] ${isVerso ? 'text-left' : 'text-right ml-auto'}`}>
          {page.headerText || ''}
        </span>

        {effectiveTypo.pageNumberPosition === 'top-outside' && !isVerso && (
          <span className="font-mono text-xs font-bold">{page.pageNumber}</span>
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
            className="grid grid-cols-2 h-full gap-x-4 overflow-hidden"
            style={{ columnGap: template.columns.gap }}
          >
            <div className="flex flex-col justify-start overflow-hidden">
              {page.columns[0].map((block, idx) => renderBlock(block, idx, page.columns![0]))}
            </div>
            <div className="flex flex-col justify-start overflow-hidden">
              {page.columns[1].map((block, idx) => renderBlock(block, idx, page.columns![1]))}
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
            : isVerso
            ? 'justify-start'
            : 'justify-end'
        } ${effectiveTypo.pageNumberPosition === 'top-outside' || page.isBlankPage ? 'invisible' : 'visible'}`}
        style={{ color: design?.headerFooterColor || '#64748b' }}
      >
        <span className="font-medium tracking-wider">{page.pageNumber}</span>
      </div>
    </div>
  );
};

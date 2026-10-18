export type BlockType = 'chapter-heading' | 'paragraph' | 'image';

export type PlacementMode = 'inline' | 'full-width' | 'float-right';

export interface NormalizedCrop {
  x: number; // 0 to 1 (left offset fraction)
  y: number; // 0 to 1 (top offset fraction)
  width: number; // 0 to 1 (width fraction)
  height: number; // 0 to 1 (height fraction)
}

export interface BookImage {
  id: string;
  filename: string;
  mimeType: string;
  width: number;
  height: number;
  fileSize: number; // bytes
  createdAt: string; // ISO 8601
  dataUrl: string; // base64 preview/source
  altText: string;
  caption?: string;
}

export interface ImagePlacement {
  id: string;
  imageId: string;
  blockId: string; // Anchored after this manuscript block ID
  mode: PlacementMode; // 'inline' | 'full-width' | 'float-right'
  widthPercent: number; // Relative to usable text content area width (e.g. 100% or 45%)
  heightPercent?: number; // Optional height override
  aspectRatioLocked: boolean;
  crop: NormalizedCrop;
  caption?: string;
  altText?: string;
}

export interface ManuscriptBlock {
  id: string;
  type: BlockType;
  text: string;
  chapterNumber?: number;
}

export interface PageBlock {
  blockId: string;
  type: BlockType;
  text?: string;
  isContinuation?: boolean;
  placement?: ImagePlacement;
  image?: BookImage;
}

export interface PagePreviewData {
  pageNumber: number;
  isLeft: boolean; // Even pages are left (verso), odd pages are right (recto)
  blocks: PageBlock[];
  headerText?: string;
}

export interface BookTemplate {
  id: string;
  name: string;
  description: string;
  pageWidthInches: number;
  pageHeightInches: number;
  margins: {
    top: string;
    bottom: string;
    inside: string; // binding edge (left on recto, right on verso)
    outside: string; // outer edge
  };
  typography: {
    fontFamily: string;
    bodyFontSizePt: number;
    bodyLineHeight: number;
    chapterHeadingFontSizePt: number;
    chapterHeadingLineHeight: number;
  };
  // Budget parameters for pagination estimation
  linesPerPage: number;
  charsPerLine: number;
}

export interface BookProject {
  id: string;
  title: string;
  rawManuscript: string;
  templateId: string;
  formattedBlocks: ManuscriptBlock[];
  images: BookImage[];
  placements: ImagePlacement[];
  isSample?: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

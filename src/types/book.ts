export type BlockType = 'chapter-heading' | 'paragraph';

export interface ManuscriptBlock {
  id: string;
  type: BlockType;
  text: string;
  chapterNumber?: number;
}

export interface PageBlock {
  blockId: string;
  type: BlockType;
  text: string;
  isContinuation?: boolean;
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
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

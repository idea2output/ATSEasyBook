import { BookTemplate } from '@/types/book';

export const CLASSIC_NOVEL_6X9: BookTemplate = {
  id: 'classic-novel-6x9',
  name: 'Classic Novel, 6 × 9 inches',
  description: 'Traditional standard trade paperback format (6 × 9 in) with elegant serif typography, generous margins, and mirrored spreads.',
  pageWidthInches: 6,
  pageHeightInches: 9,
  margins: {
    top: '0.85in',
    bottom: '0.85in',
    inside: '0.85in',
    outside: '0.65in',
  },
  typography: {
    fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
    bodyFontSizePt: 10.5,
    bodyLineHeight: 1.45,
    chapterHeadingFontSizePt: 19,
    chapterHeadingLineHeight: 1.25,
  },
  linesPerPage: 32,
  charsPerLine: 64,
};

export const AVAILABLE_TEMPLATES: BookTemplate[] = [
  CLASSIC_NOVEL_6X9,
];

export function getTemplateById(id: string): BookTemplate {
  const template = AVAILABLE_TEMPLATES.find((t) => t.id === id);
  return template || CLASSIC_NOVEL_6X9;
}

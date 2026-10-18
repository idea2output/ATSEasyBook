# ATS EasyBook (Phases 1, 2, & 3)

A template-driven web application for authors, editors, and publishers to format manuscripts into trade paperback and magazine book layouts with live paginated previews, image management, visual cropping, resizing, automatic text reflow, professional typography controls, preflight validation, and print-ready vector PDF export.

---

## Features

### Core Book & Manuscript Studio (Phase 1)
- **Project Dashboard:**
  - Create new book projects or load a pre-formatted sample novel (*The Eldridge Voyage*).
  - View all saved books with title, template, word count, structured block count, and last-edited timestamps.
  - Delete unwanted projects with confirmation modal.
- **Manuscript Studio & Editor:**
  - Editable book title and full manuscript textarea.
  - Real-time word, character, placement, and chapter counters.
  - Template selector supporting 6 publishing formats.
  - 5-tab studio: **Manuscript Editor** (raw text), **Structured Blocks** (classified blocks & anchor points), **Image Library**, **Typography**, and **Preflight**.
  - Debounced autosave (600ms) with visual status indicators (Unsaved edits, Saving..., Saved at HH:MM), plus explicit Save shortcut.
  - Explicit **"Format manuscript"** action to parse headings and paragraphs.
- **Formatting Rules Engine:**
  - Splits paragraphs at blank lines.
  - Detects chapter headings when lines begin with `Chapter <number>` (e.g. `Chapter 1`, `CHAPTER 12: THE DEPARTURE`) or are short uppercase strings (`< 80` characters, e.g. `PROLOGUE`).
  - Preserves original manuscript text verbatim.
- **Paginated Book Preview:**
  - True-to-scale CSS print dimensions with asymmetric binding margins and gutter.
  - Realistic two-page spread view (Verso/Left & Recto/Right) with simulated spine depth.
  - Page numbers, chapter breaks, and alternating running headers.
  - Interactive controls: spread navigation (first, prev, next, last), single/spread view toggle, and zoom controls (45%–120%).
  - Informative empty states when no manuscript has been provided.

### Image Management & Automatic Reflow (Phase 2)
- **Image Library Panel:**
  - Upload PNG, JPEG/JPG, and WebP images with validation (file size <= 10 MB).
  - Displays thumbnail previews, metadata (filename, pixel dimensions, file size, MIME type), and active in-use counts.
  - Editable image alt text (for accessibility & preflight compliance) and default caption fields.
  - Safe deletion: warns when an image is in active use and cleans up placements without corrupting text.
- **Structured Image Placement Model:**
  - Manuscript remains the absolute source of truth; images are anchored to block IDs (`blockId`).
  - 3 placement modes:
    1. **Inline:** Image occupies its own content position between manuscript blocks and spans the full column width.
    2. **Full-width:** Image spans the usable page width inside margins and forces surrounding text above and below it.
    3. **Float Right:** Image floats on the right side while surrounding paragraphs wrap around it on the left.
- **Placed Image Inspector:**
  - Visual selection outline (`ring-2 ring-indigo-600`) in preview.
  - Width resize slider (15% to 100% of usable text width) with quick 35%, 50%, and 100% presets.
  - Non-destructive visual crop tool: normalized coordinates (`0..1` for x, y, width, height) with quick presets (*Center Square 1:1*, *Cinematic 16:9*, *Portrait 3:4*) and 100% Reset.
  - Editable figure captions rendered in italics beneath images.
- **Automatic Text Reflow Engine:**
  - Dynamically recalculates page budgets when images are added, resized, cropped, or switched between modes.
  - Float-right images dynamically adjust characters-per-line for wrapping text and return to full width once image vertical span ends.

### Professional Typography, 6 Templates, Preflight, & Print PDF Export (Phase 3)
- **6 Structured Book Templates:**
  1. **Classic Novel** (6 × 9 inches, single column, Georgia serif typography, trade margins)
  2. **Digest Novel** (5.5 × 8.5 inches, single column, compact trade novel)
  3. **Standard Paperback** (6 × 9 inches, single column, Garamond typography, 0.25in indent)
  4. **Nonfiction** (6 × 9 inches, single column, clean headings, block paragraph spacing)
  5. **Illustrated Book** (8 × 10 inches, single column, generous image area and margins)
  6. **Magazine/Report** (A4 / 210 × 297 mm, two columns with 0.25in column gap)
- **Advanced Typography Controls:**
  - Body font family selection (Georgia, Garamond, Times New Roman, Merriweather, Palatino, Inter).
  - Body font size (9pt to 14pt) and line height (1.15 to 1.8).
  - Paragraph first-line indent (0 to 0.5 in) and space after paragraph (0 to 12 pt).
  - Text alignment: Left-aligned or Justified.
  - Chapter opening behavior: Always start on fresh page, or **Recto-only** (inserts intentional blank verso leaf so chapters always begin on right-hand pages).
  - Running header configuration: suppress headers on chapter opening pages, alternating author/title running headers.
  - Widow and orphan prevention (minimum 2 lines on split paragraphs, chapter heading push when < 3 lines remain).
- **Print Preflight Validation Engine:**
  - Automatic inspection of print readiness:
    - **Errors (blocking):** Empty manuscript, unplaced images, missing source data, unsupported MIME type, invalid margins/geometry.
    - **Warnings (non-blocking with acknowledgement):** Effective image resolution < 300 DPI, missing image alt text, element in bleed/safe area, typewriter system fallback font, blank pages, high storage footprint.
  - Interactive issue list with direct jump actions (*Inspect Image*, *Open Typography*, *Open Library*).
  - Mandatory warning acknowledgement checkbox gates PDF export when warnings exist.
- **Print-Ready Vector PDF Export:**
  - Direct vector PDF generation using `jspdf` and `pdf-lib`.
  - True-to-scale page trim dimensions (e.g. 6 × 9 in = 432 × 648 pt; A4 = 595.28 × 841.89 pt).
  - Optional standard bleed (+0.125 in / 9 pt) and corner crop/trim registration marks.
  - Renders vector running headers, page numbers, multi-column text flows, and embedded cropped images with captions.
  - Progress feedback modal with download status.

---

## Architecture Overview

```
src/
├── app/
│   ├── layout.tsx                     # Root layout, typography, metadata
│   ├── page.tsx                       # Dashboard: book listing, create & sample actions
│   ├── globals.css                    # Tailwind CSS, book page styles & shadows
│   └── books/
│       └── [id]/
│           └── page.tsx               # Studio: split/editor/preview layout, modals
├── components/
│   ├── common/
│   │   └── Navbar.tsx                 # Navigation bar and header branding
│   ├── dashboard/
│   │   └── BookCard.tsx               # Project cards with metadata and actions
│   ├── editor/
│   │   └── ManuscriptEditor.tsx       # 5-tab editor: Textarea, Blocks, Images, Typography, Preflight
│   ├── export/
│   │   └── PdfExportModal.tsx         # Print PDF export options modal (bleed, crop marks, progress)
│   ├── images/
│   │   ├── ImageLibrary.tsx           # Upload dropzone, image cards, insert/delete modals
│   │   └── ImageInspector.tsx         # Resize slider, crop canvas, mode switcher, caption
│   ├── preflight/
│   │   └── PreflightPanel.tsx         # Preflight checklist, error/warning filters, acknowledge toggle
│   ├── preview/
│   │   ├── BookPage.tsx               # Page renderer with margins, 2-column support, typography, images
│   │   └── BookSpreadPreview.tsx      # Spread navigator, zoom controls, 2-page canvas
│   └── typography/
│       └── TypographyPanel.tsx        # Typography settings (font, size, line-height, indent, recto rule)
├── services/
│   ├── formatting/
│   │   ├── manuscriptParser.ts        # Chapter detection & paragraph chunking rules
│   │   └── manuscriptParser.test.ts   # Unit tests for manuscript parsing
│   ├── images/
│   │   ├── imageService.ts            # Image validation (PNG/JPEG/WebP <= 10MB), crop helpers
│   │   └── imageService.test.ts       # Unit tests for image service
│   ├── pagination/
│   │   ├── paginationEngine.ts        # Pluggable line-budget pagination engine (1-col & 2-col, widow/orphan)
│   │   └── paginationEngine.test.ts   # Unit tests for multi-page flow, image budget & reflow
│   ├── pdf/
│   │   ├── pdfExportService.ts        # Print-ready vector PDF generation with bleed and crop marks
│   │   ├── pdfExportService.test.ts   # Unit tests for PDF export dimensions and filenames
│   │   └── generateSamplePdfs.test.ts # Vitest suite generating and verifying 3 sample print PDFs
│   ├── preflight/
│   │   ├── preflightService.ts        # Print preflight check engine (errors & warnings)
│   │   └── preflightService.test.ts   # Unit tests for preflight checks
│   ├── storage/
│   │   └── bookRepository.ts          # Storage abstraction layer (localStorage + migration)
│   └── templates/
│       ├── templateRegistry.ts        # 6 templates definition and typography helpers
│       └── templateRegistry.test.ts   # Unit tests for template registry
└── types/
    └── book.ts                        # TypeScript interfaces (BookProject, BookTemplate, PreflightSummary, etc.)
```

---

## Getting Started

### Prerequisites

- Node.js 18+ (tested on Node v24)
- npm 9+

### Installation

```bash
npm install
```

### Development Server

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Unit Tests

Run the Vitest test suite (49 unit tests across 6 suites):

```bash
npm test
```

### Running Browser Acceptance Tests

Run the automated Puppeteer acceptance suite in headless Chrome:

```bash
node test-acceptance-phase3.mjs
```

### Production Build

Create an optimized production build:

```bash
npm run build
npm start
```

---

## Known Limitations & Future Roadmap

1. **Approximate Pagination & Text Wrapping:**
   - Text wrapping for float-right uses an approximate characters-per-line calculation. While accurate for standard serif text flow, it does not measure dynamic browser DOM canvas glyph metrics. Future phases can integrate a DOM measurement canvas or CSS Paged Media polyfill (e.g. Paged.js).
2. **Storage Capacity:**
   - In Phases 1–3, images are stored in browser `localStorage` as base64 DataURLs. Browsers generally impose a 5–10 MB quota per origin. For larger book projects with many high-resolution photos, IndexedDB or server-side media storage should be introduced in a future phase.
3. **Rich Text Editing:**
   - Bold, italics, and inline markup within manuscript text will be introduced in future rich-text phases.

# ATS EasyBook (Phase 1 & Phase 2)

A template-driven web application for authors, editors, and publishers to format manuscripts into elegant 6 × 9-inch trade paperback book layouts with live paginated previews, image management, visual cropping, resizing, and automatic text reflow.

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
  - Template selector with initial template: *Classic Novel, 6 × 9 inches*.
  - Three-tab studio: **Manuscript Editor** (raw text), **Structured Blocks** (classified blocks & anchor points), and **Image Library**.
  - Debounced autosave (600ms) with visual status indicators (Unsaved edits, Saving..., Saved at HH:MM), plus explicit Save shortcut.
  - Explicit **"Format manuscript"** action to parse headings and paragraphs.
- **Formatting Rules Engine:**
  - Splits paragraphs at blank lines.
  - Detects chapter headings when lines begin with `Chapter <number>` (e.g. `Chapter 1`, `CHAPTER 12: THE DEPARTURE`) or are short uppercase strings (`< 80` characters, e.g. `PROLOGUE`).
  - Preserves original manuscript text verbatim.
- **6 × 9-Inch Paginated Book Preview:**
  - True-to-scale CSS print dimensions (`6in × 9in`) with classic book margins (gutter binding margins: 0.85in inside, 0.65in outside, 0.85in top/bottom).
  - Elegant serif typography (`Georgia`, classic novel proportions).
  - Realistic two-page spread view (Verso/Left & Recto/Right) with simulated spine depth.
  - Page numbers, chapter breaks, and alternating running headers.
  - Interactive controls: spread navigation (first, prev, next, last), single/spread view toggle, and zoom controls (45%–120%).
  - Informative empty states when no manuscript has been provided.

### Image Management & Automatic Reflow (Phase 2)
- **Image Library Panel:**
  - Upload PNG, JPEG/JPG, and WebP images.
  - Validation against unsupported MIME types and configurable file size limit (10 MB).
  - Displays thumbnail previews, metadata (filename, pixel dimensions, file size, MIME type), and active in-use counts.
  - Editable image alt text (for accessibility) and default caption fields.
  - Safe deletion: warns when an image is in active use and cleans up all placements without corrupting manuscript text or leaving broken placeholders.
- **Structured Image Placement Model:**
  - Manuscript remains the absolute source of truth.
  - Images are anchored to manuscript block IDs (`blockId`), not static canvas page numbers.
  - Supports three distinct placement modes:
    1. **Inline:** Image occupies its own content position between manuscript blocks and spans the full text-column width.
    2. **Full-width:** Image spans the usable page width inside margins and forces surrounding text above and below it.
    3. **Float Right:** Image floats on the right side of the text area while surrounding paragraphs wrap around it on the left with reduced line capacity.
- **Placed Image Inspector:**
  - Click any placed image directly in the paginated preview or click "Inspect" in the Structured Blocks tab to open.
  - Visual selection outline (`ring-2 ring-indigo-600`) in preview.
  - Width resize slider (15% to 100% of usable text width) with quick 35%, 50%, and 100% presets.
  - Aspect ratio lock toggle (locked by default, unlockable for custom proportions).
  - Non-destructive visual crop tool: normalized coordinates (`0..1` for x, y, width, height) with quick presets (*Center Square 1:1*, *Cinematic 16:9*, *Portrait 3:4*) and 100% Reset.
  - Replace source image while retaining placement anchor and crop settings.
  - Editable figure captions rendered in classic novel italics beneath the image.
  - Remove placement button (removes from book layout while keeping the source image in the library).
- **Automatic Text Reflow Engine:**
  - Dynamically recalculates page budgets when images are added, resized, cropped, or switched between modes.
  - If vertical page height is insufficient, images cleanly roll onto the next page.
  - Float-right images dynamically adjust characters-per-line for wrapping text and return to full width once the image vertical span ends.

---

## Architecture Overview

```
src/
├── app/
│   ├── layout.tsx                     # Root layout, typography, metadata
│   ├── page.tsx                       # Dashboard: book listing, create & sample actions
│   ├── globals.css                    # Tailwind CSS, 6x9 book page styles & shadows
│   └── books/
│       └── [id]/
│           └── page.tsx               # Studio: split/editor/preview layout, inspector modals
├── components/
│   ├── common/
│   │   └── Navbar.tsx                 # Navigation bar and header branding
│   ├── dashboard/
│   │   └── BookCard.tsx               # Project cards with metadata and actions
│   ├── editor/
│   │   └── ManuscriptEditor.tsx       # Textarea, block inspector, image library tab
│   ├── images/
│   │   ├── ImageLibrary.tsx           # Upload dropzone, image cards, insert/delete modals
│   │   └── ImageInspector.tsx         # Resize slider, crop canvas, mode switcher, caption
│   └── preview/
│       ├── BookPage.tsx               # 6x9 page renderer with margins, text flow, and placed images
│       └── BookSpreadPreview.tsx      # Spread navigator, zoom controls, 2-page canvas
├── services/
│   ├── formatting/
│   │   ├── manuscriptParser.ts        # Chapter detection & paragraph chunking rules
│   │   └── manuscriptParser.test.ts   # Unit tests for manuscript parsing
│   ├── images/
│   │   ├── imageService.ts            # Image validation (PNG/JPEG/WebP <= 10MB), crop helpers
│   │   └── imageService.test.ts       # Unit tests for image service
│   ├── pagination/
│   │   ├── paginationEngine.ts        # Pluggable line-budget pagination engine with reflow
│   │   └── paginationEngine.test.ts   # Unit tests for multi-page flow, image budget & reflow
│   ├── storage/
│   │   └── bookRepository.ts          # Storage abstraction layer (localStorage + migration)
│   └── templates/
│       └── templateRegistry.ts        # 6x9 Classic Novel template definition
└── types/
    └── book.ts                        # TypeScript interfaces (BookProject, BookImage, ImagePlacement, etc.)
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

Open [http://localhost:3000](http://localhost:3000) (or specified port) in your browser.

### Running Unit Tests

Run the Vitest test suite:

```bash
npm test
```

### Running Browser Acceptance Tests

Run the automated Puppeteer acceptance suite in headless Chrome:

```bash
node test-acceptance-phase2.mjs
```

### Production Build

Create an optimized production build:

```bash
npm run build
npm start
```

---

## Known Limitations & Future Roadmap (Post-Phase 2)

1. **Approximate Pagination & Text Wrapping:**
   - Text wrapping for float-right uses an approximate characters-per-line calculation. While accurate for standard serif text flow, it does not measure dynamic browser DOM canvas glyph metrics. Future phases can integrate a DOM measurement canvas or CSS Paged Media polyfill (e.g. Paged.js).
2. **Storage Capacity:**
   - In Phase 2, images are stored in browser `localStorage` as base64 DataURLs. Browsers generally impose a 5–10 MB quota per origin. For larger book projects with many high-resolution photos, IndexedDB or server-side media storage should be introduced in a future phase.
3. **Export Formats:**
   - PDF/EPUB export and print-ready prepress files are planned for Phase 3.
4. **Rich Text Editing:**
   - Bold, italics, and inline markup within manuscript text will be introduced in future rich-text phases.

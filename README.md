# ATS EasyBook (Phase 1)

A template-driven web application for authors, editors, and publishers to format manuscripts into elegant 6 × 9-inch trade paperback book layouts with live paginated previews.

---

## Features

- **Project Dashboard:**
  - Create new book projects or load a pre-formatted sample novel.
  - View all saved books with title, template, word count, structured block count, and last-edited timestamps.
  - Delete unwanted projects with confirmation modal.
- **Manuscript Studio & Editor:**
  - Editable book title and full manuscript textarea.
  - Real-time word, character, and chapter counters.
  - Template selector with initial template: *Classic Novel, 6 × 9 inches*.
  - Dual-mode view: Raw manuscript editor or Structured block inspector.
  - Autosave with visual indicator and manual save shortcut.
  - Explicit **"Format manuscript"** action to parse headings and paragraphs.
- **Formatting Rules Engine:**
  - Splits paragraphs at blank lines.
  - Detects chapter headings when lines begin with `Chapter <number>` (e.g. `Chapter 1`, `CHAPTER 12: THE DEPARTURE`) or are short uppercase strings (`< 80` characters, e.g. `PROLOGUE`).
  - Preserves original manuscript text verbatim.
- **6 × 9-Inch Paginated Book Preview:**
  - True-to-scale CSS print dimensions (`6in × 9in`) with classic book margins (gutter binding margins).
  - Elegant serif typography (`Georgia`, classic novel proportions).
  - Realistic two-page spread view (Verso/Left & Recto/Right) with simulated spine depth.
  - Page numbers, chapter breaks, and alternating running headers.
  - Interactive controls: spread navigation (first, prev, next, last), single/spread view toggle, and zoom controls (45%–120%).
  - Informative empty states when no manuscript has been provided.
- **Repository Architecture:**
  - Decoupled `IBookRepository` interface currently backed by browser `localStorage`, ready for API or database backing.
  - Pluggable `IPaginationEngine` interface ready for advanced layout engines.

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
│           └── page.tsx               # Studio: split-view editor and paginated preview
├── components/
│   ├── common/
│   │   └── Navbar.tsx                 # Navigation bar and header branding
│   ├── dashboard/
│   │   └── BookCard.tsx               # Project cards with metadata and actions
│   ├── editor/
│   │   └── ManuscriptEditor.tsx       # Textarea, formatting action, autosave status
│   └── preview/
│       ├── BookPage.tsx               # 6x9 physical page renderer with margins & headers
│       └── BookSpreadPreview.tsx      # Spread navigator, zoom controls, 2-page canvas
├── services/
│   ├── formatting/
│   │   ├── manuscriptParser.ts        # Chapter detection & paragraph chunking rules
│   │   └── manuscriptParser.test.ts   # Unit tests for manuscript parsing
│   ├── pagination/
│   │   ├── paginationEngine.ts        # Approximate line-budget pagination engine
│   │   └── paginationEngine.test.ts   # Unit tests for multi-page flow & spreads
│   ├── storage/
│   │   └── bookRepository.ts          # Storage abstraction layer (localStorage)
│   └── templates/
│       └── templateRegistry.ts        # 6x9 Classic Novel template definition
└── types/
    └── book.ts                        # TypeScript interfaces (BookProject, BookTemplate, etc.)
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

Run the Vitest test suite:

```bash
npm test
```

### Production Build

Create an optimized production build:

```bash
npm run build
npm start
```

---

## Known Limitations & Future Roadmap (Post-Phase 1)

1. **Approximate Pagination:**
   - In Phase 1, pagination uses an approximate line/word budget model. While accurate for standard serif text flow, it does not measure dynamic browser DOM font metrics or hyphenation dictionaries. Future phases can integrate a DOM measurement canvas or CSS Paged Media polyfill (e.g. Paged.js).
2. **Persistence Scope:**
   - Data is stored in browser `localStorage`. Clearing browser data will reset projects. A backend API/database can implement `IBookRepository` without modifying UI components.
3. **Typography & Assets:**
   - Font choices rely on system serif fonts (`Georgia`, `Cambria`). Custom embedded fonts, drop caps, and image placement are deferred to future phases.
4. **Export Formats:**
   - PDF/EPUB export and print-ready prepress files are planned for Phase 2.

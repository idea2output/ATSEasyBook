# ATS Tech: Complete User Manual, Step-by-Step Guide & Production Hosting Specifications

---

## Document Control & Executive Summary
- **Product Suite:** ATS Tech Publishing & Prepress Platform
- **Integrated Modules:** 
  1. **ATS EasyBook** (Manuscript Authoring, Typography & Dynamic Pagination Studio)
  2. **ATS Preflight** (ISO 12647-2 & FOGRA39 CMYK Prepress Certification Engine)
  3. **ATS Impose** (Commercial Press Signature Imposition & CTP Plate Generator)
- **Architecture:** Local-First Hybrid (IndexedDB Dexie.js + Cloud Synchronization + Vector PDF/X-4 & EPUB 3 Generators)
- **Target Audience:** Authors, Book Designers, Production Editors, Prepress Operators, Offset & Digital Print Service Providers, System Administrators.

---

# Table of Contents
1. [Part I: Platform Architecture & Core Concepts](#part-i-platform-architecture--core-concepts)
2. [Part II: ATS EasyBook — Complete User Manual](#part-ii-ats-easybook--complete-user-manual)
3. [Part III: ATS Preflight — Quality & Standards Manual](#part-iii-ats-preflight--quality--standards-manual)
4. [Part IV: ATS Impose — Commercial Imposition Manual](#part-iv-ats-impose--commercial-imposition-manual)
5. [Part V: Platform Administration, Cloud Sync & Collaboration](#part-v-platform-administration-cloud-sync--collaboration)
6. [Part VI: Step-by-Step Practical Publishing Workflows](#part-vi-step-by-step-practical-publishing-workflows)
7. [Part VII: Production Hosting & Infrastructure Requirements](#part-vii-production-hosting--infrastructure-requirements)
8. [Part VIII: Production Deployment Guide (Docker & Bare Metal)](#part-viii-production-deployment-guide-docker--bare-metal)
9. [Part IX: Troubleshooting, Maintenance & Operations](#part-ix-troubleshooting-maintenance--operations)

---

# Part I: Platform Architecture & Core Concepts

ATS Tech is an end-to-end commercial printing and digital publishing system designed to eliminate errors between initial author manuscript drafting and physical press cylinder execution.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ATS TECH UNIFIED PLATFORM                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│   ATS EasyBook   │ ───────> │  ATS Preflight   │ ───────> │    ATS Impose    │
│ Manuscript, Text │          │ 15 Quality Checks│          │ Press Signatures,│
│ Reflow, Styling, │          │ CMYK Validation, │          │ Creep, Folding,  │
│ Spreads, EPUB 3  │          │ FOGRA39 Profiling│          │ CTP Plate Output │
└──────────────────┘          └──────────────────┘          └──────────────────┘
         │                             │                             │
         └─────────────────────────────┼─────────────────────────────┘
                                       ▼
                       ┌──────────────────────────────┐
                       │  Local-First Dexie Storage   │
                       │  + End-to-End Vector Engine  │
                       │  + Zero Data Lock-In (.ats)  │
                       └──────────────────────────────┘
```

### The Three Operational Pillars
1. **Local-First Reliability:** All authoring, layout calculation, and imposition mathematics execute in the browser memory using IndexedDB via Dexie.js. If an internet connection drops, you never lose work.
2. **Certified Prepress Color Accuracy:** Automatic enforcement of 100% Vector Black (`0C 0M 0Y 100K`), overprint stroke rules, FOGRA39/SWOP CMYK profile conversions, and `/Separation /All` registration printer's marks.
3. **Seamless Digital-to-Press Pipeline:** A book designed in EasyBook can be sent to Preflight for automated inspection with one click, or forwarded to ATS Impose for multi-up signature folding schemes.

---

# Part II: ATS EasyBook — Complete User Manual

ATS EasyBook is a distraction-free, template-driven manuscript design studio that formats raw text into standard publishing book spreads in real time.

## 1. Project Management & Dashboard
- **Accessing the Studio:** Navigate to `/books/new` to initiate a blank project, or click **"Try Sample Novel"** on the homepage to load *The Eldridge Voyage* sample project.
- **Project Metadata:**
  - **Book Title:** Click into the top title field to rename your project.
  - **Author Name:** Specify author attribution displayed on half-title pages and alternating running headers.
  - **Autosave Engine:** Debounced to 600ms. A status indicator displays `Saving...` or `Saved at HH:MM`. Manual save can be triggered via `Ctrl+S` / `Cmd+S` or the **Save** button.

## 2. Built-in Publishing Templates
Select a preset from the Template dropdown to automatically configure trim dimensions, margins, and column layouts:
1. **Classic Novel (6 × 9 inches):** Single column, Georgia serif typography, trade margins with spine gutter.
2. **Digest Novel (5.5 × 8.5 inches):** Compact trade fiction, optimized for economical paper yield.
3. **Standard Paperback (6 × 9 inches):** 0.25-inch paragraph indentation, Garamond typography, balanced leading.
4. **Nonfiction / Academic (6 × 9 inches):** Block paragraph spacing, sub-heading hierarchies, bibliography formatting.
5. **Illustrated Book (8 × 10 inches):** Generous margins, dynamic float image budgets, high-resolution caption frames.
6. **Magazine / Report (A4 / 210 × 297 mm):** Two-column reflow, 0.25-inch column gutter, corporate header bars.
7. **Custom Geometry Editor:** Set custom trim width, trim height, top/bottom margins, and inside/outside gutter margins.

## 3. Left Card Workspace: Streamlined Tabs & Tools Menu
To maximize focus while writing, the Left Card displays only the **`Manuscript Editor`** tab permanently on the left, with all secondary modules housed in the **`Tools ▾`** Hamburger menu on the right.

### The Primary Tab: Manuscript Editor
- **Distraction-Free Textarea:** Paste or write your manuscript in plain text or Markdown.
- **Headings & Chapters:** 
  - Standard Markdown headings (`# Heading 1`, `## Heading 2`).
  - Automatic chapter recognition: Any line starting with `Chapter <number>`, Arabic `الفصل <number>`, or Urdu `باب <number>` automatically initiates a new chapter leaf.
  - Short all-caps lines (`< 80` characters, e.g., `PROLOGUE`) are automatically formatted as display titles.
- **"Format manuscript" Action:** Click the green **Format manuscript** button to re-parse the raw text into structured pagination blocks.

### The Tools Hamburger Menu (`Tools ▾`)
Clicking the `Tools ▾` button opens a popover organized into four functional groups:

#### Group A: Content & Structure
1. **Blocks (`ListTree`):** Inspect each classified paragraph, heading, and break block with its unique ID. Manually override block types (Heading 1, Heading 2, Body, Blockquote, Page Break).
2. **Comments (`MessageSquare`):** Team editorial collaboration. Leave contextual review comments anchored to manuscript sections.
3. **Versions (`History`):** Snapshot timeline. Create manual restore points or revert to earlier drafts.

#### Group B: Language & Typography
1. **Language (`Globe`):** 
   - Set document language (`en`, `ar`, `ur`, `hi`, etc.).
   - Set text direction: **LTR** (Left-to-Right) or **RTL** (Right-to-Left).
   - When RTL is enabled, bidirectional Unicode bidi algorithm applies mirrored gutter margins (inside margin on the right, outside margin on the left).
2. **Hindi Publishing (`Keyboard`):** 
   - Specialized Devanagari text-shaping engine.
   - Enforces correct Virama, Halant, Matra, and Nuqta glyph ligatures without orphan character splits.
3. **Typography (`Type`):** 
   - Body typeface selection (Georgia, Garamond, Times New Roman, Merriweather, Palatino, Inter).
   - Body font size (9pt to 14pt) and line height (1.15 to 1.8).
   - Paragraph first-line indent (0 to 0.5 in) and space after paragraph (0 to 12 pt).
   - Text alignment: Left-aligned or Fully Justified.
   - Chapter opening behavior: Always start on fresh page, or **Recto-only** (inserts intentional blank verso leaf so chapters always begin on right-hand pages).
   - Running header configuration: suppress headers on chapter opening pages.
4. **Custom Fonts (`Type`):** Upload TrueType (`.ttf`) or OpenType (`.otf`) fonts for custom corporate brand identities.

#### Group C: Media & Image Management
1. **Images (`ImageIcon`):**
   - Upload PNG, JPEG, and WebP graphics (up to 10 MB per asset).
   - Set image alt text and default figure captions.
   - 3 Placement Modes:
     - **Inline:** Sits naturally between paragraphs across the column width.
     - **Full-Width:** Expands across margins to the page edge.
     - **Float Right:** Paragraph text flows smoothly around the left side of the graphic.
   - Visual cropping tool with quick presets (1:1 Square, 16:9 Landscape, 3:4 Portrait).

#### Group D: Prepress & Print
1. **Preflight (`FileCheck`):** Live quality audit with real-time error/warning badges.
2. **Color (CMYK) (`Printer`):** Simulates device gamut compression under ISO Coated v2 / FOGRA39.
3. **Design (`Palette`):** Grid overlays, column guidelines, and safe-area margins.
4. **Print Specs (`Package`):** Spine thickness calculator based on page count and paper bulk factor (e.g. 50lb offset vs 70lb coated).

### Active Sub-Tool Breadcrumb
When any tool is selected from the menu:
- A breadcrumb chip appears: `[📄 Manuscript Editor] / [🔤 Typography ✕]`
- Clicking **`[Manuscript Editor]`** or the **`✕`** icon immediately returns you to the raw text editor.

---

# Part III: ATS Preflight — Quality & Standards Manual

ATS Preflight inspects your book layout against 15 strict physical prepress rules to prevent costly press rejects.

```
                      PREFLIGHT AUDIT PIPELINE
┌────────────────────┐     ┌──────────────────────┐     ┌───────────────────┐
│ Page Geometry &    │ ──> │ CMYK & Overprint     │ ──> │ Image Resolution  │
│ Safe Margin Limits │     │ Color Space Analysis │     │ (>= 300 Effective │
└────────────────────┘     └──────────────────────┘     │ DPI Check)        │
                                                        └─────────┬─────────┘
┌────────────────────┐     ┌──────────────────────┐               │
│ Output Gate:       │ <── │ Warning Acknowledg-  │ <─────────────┘
│ PDF/X-4 Certified  │     │ ment Verification    │
└────────────────────┘     └──────────────────────┘
```

## The 15 Preflight Quality Checks

| Check Code | Rule Description | Severity | Trigger Condition |
| :--- | :--- | :--- | :--- |
| **PRF-01** | Empty Manuscript | **Error** | Manuscript contains 0 words or blocks. |
| **PRF-02** | Unplaced Library Images | **Warning** | Images exist in library but are never anchored into text. |
| **PRF-03** | Missing Image Data | **Error** | Image reference has corrupted data URI or broken storage link. |
| **PRF-04** | Unsupported File Format | **Error** | File is not PNG, JPEG, or WebP. |
| **PRF-05** | Negative / Zero Margins | **Error** | Top, bottom, inside, or outside margin `< 0.25 inches`. |
| **PRF-06** | Low Image DPI | **Warning** | Rendered DPI `< 300 DPI` on physical print spread. |
| **PRF-07** | Missing Alt Text | **Warning** | Image lacks accessibility tag for digital EPUB 3 export. |
| **PRF-08** | Bleed Intrusion | **Warning** | Critical text placed within `0.125 in` (9 pt) of trim edge. |
| **PRF-09** | System Fallback Font | **Warning** | Font relies on non-embedded typewriter or generic fallback. |
| **PRF-10** | Accidental Blank Pages | **Warning** | More than two consecutive blank pages generated. |
| **PRF-11** | High Storage Footprint | **Warning** | Project assets exceed `50 MB` browser IndexedDB quota. |
| **PRF-12** | RGB Object in Print Stream | **Error** | DeviceRGB color operators detected in export PDF. |
| **PRF-13** | Non-Overprinted 100K Text | **Warning** | Black text does not have overprint flag set. |
| **PRF-14** | Widow / Orphan Violation | **Warning** | Single trailing line stranded at top/bottom of column. |
| **PRF-15** | Spine Gutter Insufficiency | **Error** | Page count `> 200` with inside gutter `< 0.75 inches`. |

### The Preflight Acknowledgement Gate
If any **Errors** exist, PDF Export is strictly disabled. If **Warnings** exist, the user must review the issues and check:
`[✓] I have reviewed all warnings and confirm this document is approved for print.`

---

# Part IV: ATS Impose — Commercial Imposition Manual

ATS Impose transforms individual pages into multi-up printer press sheets folded into signatures for commercial offset and digital presses.

```
                  16-PAGE SIGNATURE FOLDING SCHEME
┌───────────────────────┬───────────────────────┬───────────────────────┬───────────────────────┐
│ Page 5 [Head-to-Head] │ Page 12 [Head-to-Head]│ Page 9 [Head-to-Head] │ Page 8 [Head-to-Head] │
├───────────────────────┼───────────────────────┼───────────────────────┼───────────────────────┤
│ Page 4 [Foot-to-Foot] │ Page 13 [Foot-to-Foot]│ Page 16 [Foot-to-Foot]│ Page 1 [Cover / Face] │
└───────────────────────┴───────────────────────┴───────────────────────┴───────────────────────┘
  ◄────────────────────────── Gripper Edge: 0.50 in ────────────────────────────────────────►
```

## 1. Key Terminology
- **Sheet:** The large physical raw paper stock running through the press (e.g. 28 × 40 in, B1, SRA3).
- **Signature (Form):** A group of pages printed on both sides of a sheet that, when folded, forms a sequence of consecutive pages.
- **Creep (Shingling):** The gradual pushing out of inner pages in a folded signature caused by paper thickness.
- **Gripper Margin:** The mechanical strip of paper (usually 0.375–0.5 in) gripped by press cylinders that cannot receive ink.
- **Head-to-Head:** Rotation of top-row pages by 180° so heads meet in the fold.

## 2. Supported Binding Methods
1. **Saddle Stitch (Nested Signatures):**
   - Signatures are inserted inside one another and stapled through the center spine fold.
   - Ideal for booklets, magazines, and publications under 64 pages.
   - Automated creep compensation narrows inner page margins outward to prevent edge trimming loss.
2. **Perfect Bound (Stacked Signatures):**
   - Individual 8-page or 16-page folded forms are stacked on top of one another and glued at the spine.
   - Used for novels, textbooks, and catalogs over 64 pages.
   - Remainder forms (e.g. a 4-page remainder at the end of a 132-page book) are automatically handled without corrupting page sequence.

## 3. Commercial Printer's Marks Engine
ATS Impose embeds vector prepress calibration marks into the slug area:
- **Trim & Crop Marks:** Show exact guillotine cutter blade paths.
- **Fold Marks:** Dashed lines indicating knife and buckle fold locations.
- **Registration Targets:** Crosshair bullseyes on all four edges for 4-color plate alignment.
- **CMYK Calibration Gradients:** Density verification patches for spectrophotometer press calibration.
- **Job Slug Line:** Form number, sheet side (Side A / Side B), job title, date, and color separation name.
- **Color Separation Operator:** All marks are written using `/Separation /All` so they appear on every press plate without ink contamination.

---

# Part V: Platform Administration, Cloud Sync & Collaboration

## 1. User Roles & Access Matrix
ATS Tech implements role-based security across all projects:

| Capability | Owner | Editor | Reviewer | Viewer |
| :--- | :---: | :---: | :---: | :---: |
| Edit Manuscript Text & Headings | ✓ | ✓ | — | — |
| Change Layout, Fonts & Templates | ✓ | ✓ | — | — |
| Upload & Crop Images | ✓ | ✓ | — | — |
| Leave & Resolve Comments | ✓ | ✓ | ✓ | — |
| Trigger Preflight Inspection | ✓ | ✓ | ✓ | ✓ |
| Export Proof / Watermarked PDF | ✓ | ✓ | ✓ | ✓ |
| Export Certified Print PDF / EPUB 3 | ✓ | ✓ | — | — |
| Delete Project / Manage Permissions | ✓ | — | — | — |

## 2. Cloud Handoff & Synchronization
- Projects can be shared via one-time secure handoff tokens generated through `/api/handoff`.
- When an author finishes a book in EasyBook, they click **"Send to Impose"** or **"Send to Preflight"**. The engine packages the vector PDF, page geometry, and trim settings into an ATS handoff payload.

---

# Part VI: Step-by-Step Practical Publishing Workflows

## Workflow 1: Publishing a Trade Paperback Novel (6 × 9 in)
1. **Launch Project:** Navigate to `/books/new`. Enter Title and Author.
2. **Paste Text:** Paste your chapters into the **Manuscript Editor**.
3. **Select Template:** Choose **"Classic Novel, 6 × 9 inches"**.
4. **Format Structure:** Click **"Format manuscript"**. Inspect the right preview pane to confirm chapters begin on fresh pages.
5. **Adjust Typography:** Open `Tools ▾ -> Typography`. Select **Georgia**, Font Size `10.5 pt`, Line Height `1.45`, First-Line Indent `0.25 in`, Alignment `Justified`. Set Chapter Opening to **Recto-Only**.
6. **Preflight Audit:** Open `Tools ▾ -> Preflight`. Confirm 0 blocking errors.
7. **Export:** Click **"Export PDF"** for the print interior or **"Export EPUB 3"** for Amazon Kindle / Apple Books distribution.

## Workflow 2: Imposing a 64-Page Booklet for Offset Print
1. **Open ATS Impose:** Click the top navbar link **"Impose"** (`/Impose`).
2. **Load Document:** Select your 64-page PDF output from EasyBook.
3. **Configure Press Sheet:** Select Sheet Size `28 × 40 in` and Layout `8-Up (4 × 2)`.
4. **Set Binding:** Choose **Saddle Stitch**.
5. **Paper Creep:** Input caliper (e.g. `0.0035 in / sheet`). The creep engine automatically shifts inner spreads by `+0.012 in`.
6. **Enable Printer's Marks:** Check *Crop Marks*, *Fold Marks*, *Registration Targets*, and *Color Bars*.
7. **Generate Plates:** Click **"Export Press PDF"** to produce vector press plates ready for Computer-to-Plate (CTP) imaging.

---

# Part VII: Production Hosting & Infrastructure Requirements

ATS Tech is designed to be deployed on high-performance cloud environments or on-premise private infrastructure.

```
                      PRODUCTION HOSTING ARCHITECTURE
┌─────────────────────────────────────────────────────────────────────────────┐
│                       INTERNET / CLOUD CUSTOMERS                            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS (Port 443)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NGINX REVERSE PROXY / SSL TERMINATION                    │
│   • Let's Encrypt / Custom TLS 1.3        • Brotli & Gzip Compression        │
│   • Client Max Body Size: 100M            • Security Headers & CSP          │
└──────────────────┬──────────────────────────────────────┬───────────────────┘
                   │                                      │
                   ▼ (Port 3008)                          ▼ (Port 3008/Impose)
┌──────────────────────────────────────┐   ┌──────────────────────────────────┐
│        Next.js App Server            │   │      Imposition Subsystem        │
│   • Node.js v20+ LTS Cluster         │   │   • Vite Production Assets       │
│   • Server Components & REST API     │   │   • Client-Side Vector Engine    │
│   • In-Memory / Redis Session Cache  │   │   • PDF-Lib Prepress Processing  │
└──────────────────────────────────────┘   └──────────────────────────────────┘
```

## 1. Hardware Specifications

| Resource | Minimum (Staging / Small Team) | Recommended (Production / Commercial) | High-Volume Enterprise |
| :--- | :--- | :--- | :--- |
| **CPU** | 2 vCPU (x86_64 or ARM64) | 4 vCPU (e.g. Intel Xeon / AWS c6i) | 8–16 vCPU |
| **RAM** | 4 GB | 8 GB | 16–32 GB |
| **Storage** | 40 GB SSD (NVMe preferred) | 100 GB NVMe SSD | 500 GB+ NVMe SSD |
| **Bandwidth** | 100 Mbps port | 1 Gbps port | 10 Gbps redundant |
| **Network** | Dedicated IPv4 + SSL | Dedicated IPv4 + CDN | Load-balanced cluster |

> [!NOTE]
> PDF parsing and vector plate generation run on client-side Web Workers, which keeps server CPU usage low. Server RAM is primarily utilized for concurrent SSR rendering, asset serving, and cross-module handoff caching.

## 2. Operating System & Software Dependencies
- **Supported OS:**
  - Ubuntu 22.04 LTS / 24.04 LTS (Recommended)
  - Debian 12 (Bookworm)
  - Red Hat Enterprise Linux 9 / Rocky Linux 9
  - Alpine Linux (Docker image base)
- **Runtime Dependencies:**
  - **Node.js:** v20.x or v22.x LTS (Node v20.18.0+ recommended)
  - **NPM:** v10.x+
  - **Process Manager:** PM2 v5.x+ (for bare metal) or systemd
  - **Web Server:** Nginx v1.22+ with HTTP/2 and SSL modules

## 3. Environment Variables Reference (`.env.production`)

```env
# Application Core
NODE_ENV=production
PORT=3008
NEXT_PUBLIC_APP_URL=https://easybook.yourdomain.com

# Storage & Quotas
MAX_IMAGE_UPLOAD_BYTES=10485760
MAX_MANUSCRIPT_BYTES=52428800

# Security & Sessions
SESSION_SECRET=e7b4c91038f4a6d2891b01c38e74f6a190b2345d6e7f8a9012c3456789abcdef
CORS_ALLOWED_ORIGINS=https://easybook.yourdomain.com

# Prepress PDF Defaults
DEFAULT_COLOR_PROFILE=FOGRA39
DEFAULT_OUTPUT_INTENT=PDF/X-4
```

---

# Part VIII: Production Deployment Guide (Docker & Bare Metal)

## Method A: Standard Ubuntu VPS Deployment (Nginx + PM2)

### Step 1: System Provisioning & Node.js Installation
```bash
# 1. Update OS packages
sudo apt update && sudo apt upgrade -y

# 2. Install essential build tools
sudo apt install -y curl wget git build-essential nginx certbot python3-certbot-nginx

# 3. Install Node.js v20 LTS via Nodesource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Install PM2 globally
sudo npm install -g pm2
```

### Step 2: Clone & Build the Application
```bash
# 1. Clone repository into production directory
cd /var/www
sudo git clone https://github.com/idea2output/ATSEasyBook.git ats-easybook
cd ats-easybook

# 2. Set file permissions
sudo chown -R $USER:$USER /var/www/ats-easybook

# 3. Install dependencies across root and imposition modules
npm ci
npm --prefix imposition ci

# 4. Compile production bundles (Imposition Vite + Next.js SSR)
npm run build
```

### Step 3: Configure PM2 Process Manager
Create `/var/www/ats-easybook/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'ats-easybook',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3008',
      cwd: '/var/www/ats-easybook',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3008,
      },
    },
  ],
};
```

Launch the cluster:
```bash
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
```

### Step 4: Configure Nginx Reverse Proxy
Create `/etc/nginx/sites-available/ats-easybook`:
```nginx
server {
    listen 80;
    server_name easybook.yourdomain.com;

    # Maximum upload for large high-resolution images
    client_max_body_size 100M;

    # Gzip Compression
    gzip on;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:3008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }

    # Static Asset Caching
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3008;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Enable configuration and issue SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/ats-easybook /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Issue Let's Encrypt SSL Certificate
sudo certbot --nginx -d easybook.yourdomain.com
```

---

## Method B: Docker & Docker Compose Deployment

Create `Dockerfile` in the project root:
```dockerfile
# Stage 1: Build dependencies
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY imposition/package*.json ./imposition/
RUN npm ci && npm --prefix imposition ci

COPY . .
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3008

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/imposition/dist ./imposition/dist

EXPOSE 3008
CMD ["npm", "run", "start", "--", "-p", "3008"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  ats-easybook:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ats_tech_platform
    restart: always
    ports:
      - "3008:3008"
    environment:
      - NODE_ENV=production
      - PORT=3008
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 4096M
        reservations:
          cpus: '1.0'
          memory: 1024M
```

Launch container:
```bash
docker compose up -d --build
```

---

# Part IX: Troubleshooting, Maintenance & Operations

### 1. Verification & Health Monitoring
- Verify backend health:
  ```bash
  curl -I http://localhost:3008
  # Expected: HTTP/1.1 200 OK
  ```
- Check PM2 application cluster logs:
  ```bash
  pm2 logs ats-easybook --lines 50
  ```

### 2. Routine Updates & Zero-Downtime Redeployment
```bash
cd /var/www/ats-easybook
git pull origin main
npm ci
npm --prefix imposition ci
npm run build
pm2 reload ats-easybook
```

### 3. Browser Storage Quotas & Backup
- EasyBook utilizes browser IndexedDB. While browsers typically allocate up to 60% of total free disk space to IndexedDB, users should be encouraged to periodically download project archives (`.ats` or exported `.json` backups) using the **Share / Jobs** panel to ensure local device redundancy.

---
*ATS Tech Documentation • Enterprise Publishing & Prepress Edition*

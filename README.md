# DigitalBook: Interactive English Textbook Library & Classroom Presentation Platform

A production-grade, content-agnostic, multi-book digital textbook and classroom presentation platform inspired by the workflow of modern educational tools like Oxford Learner’s Bookshelf and Classroom Presentation Tools (CPT).

Built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Vite**, backed by a Python/SQLite server and automated end-to-end testing with Playwright.

---

## 🌟 Platform Highlights

### 1. Universal Multi-Book Bookshelf
- **Curated Multi-Curriculum Catalog**:
  - **MoEYS English Grade 7** (Ministry of Education, Youth and Sport Cambodia - Lower Secondary)
  - **MoEYS English Grade 8** (Ministry of Education, Youth and Sport Cambodia - Lower Secondary)
  - **MoEYS English Grade 9** (Ministry of Education, Youth and Sport Cambodia - Lower Secondary)
  - **English File 4th Edition Pre-Intermediate** (Oxford University Press - Adult / Young Adult)
- **Bookshelf Management**:
  - Live search across titles, authors, publishers, and curriculum levels.
  - Category filtering: *All Books*, *MoEYS Cambodia*, *Self-Study*, *Grade 7*, *Grade 8*, *Grade 9*.
  - Sorting: *Recently Read*, *Title (A-Z)*, *Progress Percentage*.
  - "Continue Reading" quick-launch resuming from the exact last-opened page.
  - Per-book overflow menu: *Detailed Curriculum Info*, *Export Progress JSON*, *Start Over / Reset*.
  - Data backup & restore: Export/import student study data across browsers.

### 2. Content-Agnostic Reader Engine
- **Purely Manifest-Driven**: The reader shell, canvas, audio dock, image lightbox, and activity window are 100% agnostic of book titles or curriculum hardcoding. Every book is configured via a declarative `BookManifest`.
- **High-Fidelity Textbook Canvas**:
  - High-resolution textbook page rendering extracted from official curriculum sources.
  - Smooth zoom controls: 50% to 250%, Fit-to-Width, Fit-to-Height, 1:1, and Fullscreen.
  - Single-page view and Two-page facing spread mode (`📖`).
  - Scale-invariant percentage hotspot coordinates `(xPercent, yPercent)` that remain anchored regardless of zoom level or display viewport.
  - Nearby page preloading (`PageService.preloadNearbyPages`) for seamless reading.
- **Table of Contents (TOC)**:
  - Collapsible, manifest-driven hierarchical chapter and lesson navigation.
  - Live unit/lesson filter search by keyword, grammar topic, or vocabulary focus.
  - Page jumper with bounds checking and keyboard shortcuts (Left/Right arrows, Esc).

### 3. Universal Audio Dock & Transcript Panel
- **Fixed Bottom Dock**: Non-intrusive floating dock with waveform timeline, seek bar, time display, and volume control with mute toggle.
- **Playback Controls**:
  - Preset speed options: `0.75x`, `0.8x`, `1.0x`, `1.2x`, `1.5x`.
  - Skip forward/backward 10 seconds (`↺ 10s`, `↻ 10s`).
  - **A/B Looping Engine**: Set loop start point `[A]`, loop end point `[B]`, loop region highlight, and `Clear Loop` for targeted listening drills.
- **Authentic Listening & Honest Fallback**:
  - Seamlessly plays genuine course MP3 recordings when present.
  - Displays honest course audio status badges. When audio files are missing on disk, it clearly states *"Course audio unavailable"* and provides Web Speech API device pronunciation rather than misleading the user.
- **Projector-Ready Listening Scripts**:
  - Expandable transcript drawer displaying listening scripts and speaker dialogue.
  - Classroom Projector mode ("Large Text") for legible front-of-class projection.
  - Custom audio upload support via IndexedDB (`mediaDB`).

### 4. Interactive Image Region & Focus Lightbox Viewer
- **Textbook Artwork & Diagram Focus**:
  - Scale-invariant clickable image hotspots and transparent hitboxes on textbook illustrations (e.g., Vermeer's *The Milkmaid*, Cambodian classroom equipment, community dialogues).
- **Fullscreen Lightbox Experience**:
  - Dedicated focus viewer with backdrop blur and high-resolution zoom controls (`+`, `-`, `Reset`).
  - Panning and keyboard shortcuts (Escape to dismiss, Arrow keys for next/prev).
  - Projector Presentation mode (`"Present Image"`) for focused teacher lectures.
  - Vocabulary annotations: target word, phonetic transcription (IPA), part of speech, curriculum definition, and example sentence with device audio pronunciation.

### 5. Universal Exercise Architecture & ExerciseRenderer
- **16 Supported Pedagogical Activity Paradigms**:
  1. **Multiple Choice** (`multiple-choice`): Single-select questions with radio cards and immediate visual feedback.
  2. **Single Choice** (`single-choice`): Standard single option selection.
  3. **Multiple Selection** (`multiple-selection`): Multi-select checkboxes for "select all that apply" questions.
  4. **Gap-Fill** (`gap-fill`): Inline blanks with keyboard input and optional word bank chips.
  5. **Text Input** (`text-input`): Targeted single/short-answer text entry fields.
  6. **Word Bank** (`word-bank`): Fill blanks by tapping vocabulary chips (with optional multiple-use toggle).
  7. **Matching** (`matching`): Two-column relationship association dropdowns with pair verification.
  8. **Dropdown** (`dropdown`): Inline select dropdowns integrated inside sentences or paragraphs.
  9. **True/False** (`true-false`): Rapid binary fact checking cards with instant evaluation.
  10. **Ordering / Sequencing** (`ordering`): Reorder sentences, steps, or chronology via Move Up / Move Down buttons.
  11. **Table Completion** (`table-completion`): Fill structured tabular cells (grammar paradigms, verb conjugations).
  12. **Table Fill** (`table-fill`): Extended tabular fill-in matrices.
  13. **Open Response** (`open-response`): Free-form communicative writing with suggested model responses.
  14. **Listening Comprehension** (`listening`): Direct audio player integration with question items.
  15. **Speaking & Pronunciation** (`speaking`): Oral practice with model audio text and device speech playback.
  16. **Self-Check / Teacher-Led** (`self-check`, `teacher-led`): Reflective checklists and classroom teacher drills.
- **Pedagogical Evaluation**:
  - Strict, non-destructive answer checking (`ExerciseService.isAnswerCorrect`).
  - Handles contractions (`don't` / `do not`), punctuation normalization, and slash-separated answer alternatives (`center / centre`, `above / over`).
  - **Show Answers**: Non-destructive toggle displaying the answer key in gold badges without overwriting student answers.
  - Dynamic score calculation and completion badges (emerald checkmarks on page hotspots).

### 6. Deep Linking & Reader Routing
- **Supported URL Formats**:
  - `#/books/:bookId/page/:pageNum` (e.g. `#/books/moeys-english-grade-8/page/10`)
  - `#/books/:bookId?page=:pageNum`
  - `#/reader?book=:bookId&page=:pageNum`
  - `?book=:bookId&page=:pageNum` (search query parameters)
  - `#page=11` (legacy page routing)
- **Book Aliases**: Resolves colloquial or short identifiers (e.g. `english-grade-8`, `grade-8`, `g8` -> `moeys-english-grade-8`).
- **Browser History**: Supports forward/back browser buttons and synchronizes active page and book state in real time.

### 7. Automated PDF Ingestion Utility
- CLI script in `scripts/ingest_pdf.py` renders high-resolution page scans, generates thumbnails, and outputs starter `manifest.json`:
  ```bash
  python scripts/ingest_pdf.py input.pdf public/my_pages/ --manifest-id my-book-1 --dpi 150
  ```

### 8. Classroom Presentation Mode
- **Teacher Presentation Toolbar**:
  - Clean textbook canvas hiding non-essential student tools for screen sharing.
  - **Master Answer Key Toggle** (`"Show Answer Key"` / `"Answer Key: ON"`): Instantly reveals answer keys across the entire page for group review.
  - Centered floating activity modals optimized for projector readability.

### 9. Scoped Persistence & Anti-Corruption Data Isolation
- State is strictly isolated per book under the key pattern:
  ```
  digital_book_progress_<bookId>
  ```
- Cross-book data bleed is prevented: import operations validate backup `bookId` against active textbook, rejecting mismatched files to prevent corrupting student progress.

---

## 📁 Repository Structure

```
DigitalTextbook/
├── public/                       # Static public assets & symlinks
│   ├── audio/                    # Course audio tracks (.mp3)
│   ├── book_pages/               # English File textbook page scans
│   ├── moeys_pages/              # MoEYS Grade 7, 8, 9 page scans
│   ├── images/                   # High-res image region crops (Vermeer, etc.)
│   └── book_thumbnails/          # Bookshelf cover thumbnails
├── scripts/
│   └── validate-content.mjs      # Manifest and content validation script
├── src/
│   ├── types/index.ts            # Universal contracts (BookManifest, PageDefinition, etc.)
│   ├── data/
│   │   ├── books/                # Declarative book manifests
│   │   │   ├── englishFilePreIntermediate.ts
│   │   │   ├── englishGrade7.ts
│   │   │   ├── englishGrade8.ts
│   │   │   ├── englishGrade9.ts
│   │   │   └── index.ts
│   │   └── booksRegistry.ts      # Universal registry and backward compatibility layer
│   ├── services/
│   │   ├── bookService.ts        # Manifest lookup, filtering, search
│   │   ├── pageService.ts        # Page resolution and preloading
│   │   ├── audioService.ts       # Audio track URL resolution
│   │   ├── exerciseService.ts    # Answer normalization and grading
│   │   └── progressService.ts    # Scoped localStorage persistence
│   ├── components/
│   │   ├── bookshelf/            # Bookshelf view, filters, cards, info modals
│   │   ├── layout/               # TopBar, SidebarTOC, ReaderShell
│   │   ├── viewer/               # PageView, PageOverlay, ActivityHotspotBadge
│   │   ├── audio/                # AudioPlayer, A/B looping, Transcript
│   │   ├── image-viewer/         # ImageViewer lightbox, zoom, vocabulary
│   │   └── activity/             # ActivityWindow, ExerciseRenderer, WordBank
│   ├── hooks/                    # useAudioPlayer, useBookProgress
│   └── App.tsx                   # Hash routing and platform coordinator
├── tests/
│   └── e2e/                      # Tier 1-4 comprehensive regression test suite
├── test_multibook_e2e.py         # Multi-book end-to-end integration test
├── test_comprehensive_platform_e2e.py # 7-step comprehensive browser E2E test
├── server.py                     # Python HTTP server and REST backend
└── package.json                  # Scripts and dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Python**: 3.10+ (for backend server and Playwright test suite)
- **Microsoft Edge / Chromium**: For browser-based E2E tests

### Installation

1. Clone or navigate to the repository directory:
   ```bash
   cd D:\DigitalTextbook
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. (Optional) Install Python test dependencies if running Playwright tests:
   ```bash
   pip install playwright pillow
   playwright install msedge chromium
   ```

---

## 💻 Running the Platform

### Option 1: Full Production Server (Recommended)
Start the Python HTTP server (serves the built application at `/DigitalBook/` on port 8000):
```bash
python server.py
```
Open your browser and navigate to:
```
http://localhost:8000/DigitalBook/
```

### Option 2: Vite Development Server
Run Vite with hot-module replacement for active development:
```bash
npm run dev
```

---

## 🛠 Build & Content Validation

### 1. Build Production Bundle
Compiles TypeScript and bundles via Vite with 0 errors:
```bash
npm run build
```

### 2. Validate Content Manifests
Validates all book manifests, confirms image files exist on disk, verifies audio tracks, checks exercise answer keys, and validates image region bounding boxes:
```bash
npm run validate-content
```

---

## 🧪 Test Execution

The platform is covered by multiple testing layers:

### 1. Content & Schema Validation
```bash
npm run validate-content
```
- Validates metadata, navigation hierarchy, coordinates `[0..100]`, answer keys, audio mappings, and disk assets for all 4 books.

### 2. Multi-Book Integration Tests
```bash
python test_multibook_e2e.py
```
- Verifies Bookshelf filtering, Grade 8 reader, Presentation mode, Answer Key toggle, and English File activity drawers.

### 3. Comprehensive 7-Step End-to-End Test
```bash
python test_comprehensive_platform_e2e.py
```
- Covers:
  1. Bookshelf search, filtering, and info modal
  2. Grade 8 reader navigation and Table of Contents
  3. Universal Audio Dock, A/B looping, speed presets, listening scripts, and projector text
  4. Fullscreen Lightbox Image Viewer, zoom controls, and vocabulary definitions
  5. Gap-fill exercise grading, word bank chips, and Show Answers toggle
  6. Classroom Presentation Mode and scoped persistence validation
  7. English File Vermeer Milkmaid lightbox and complete data isolation verification

### 4. Full Regression Suite (88 Tests across 4 Tiers)
```bash
python tests/e2e/run_all_e2e.py
```
- Tier 1: Feature Coverage (44 tests)
- Tier 2: Boundary & Corner Cases (29 tests)
- Tier 3: Cross-Feature Combinations (11 tests)
- Tier 4: Real-World Student & Teacher Scenarios (4 tests)

---

## 📖 Authoring New Books

To add a new textbook or curriculum package to the platform without modifying application code, refer to the detailed [Book Authoring Guide](BOOK_AUTHORING_GUIDE.md).

---

## 📄 License
Educational use and curriculum development. Course materials copyright Ministry of Education, Youth and Sport (MoEYS) Cambodia and Oxford University Press. Platform engine copyright 2026.

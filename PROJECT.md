# Project: English File 4th Edition Pre-Intermediate Digital Workbook Redesign

## Architecture
- **Framework & Runtime**: React 18, Vite 6, TypeScript 5, Tailwind CSS 3.
- **Visual Design Standard**: Oxford Learner's Bookshelf (`oxfordlearnersbookshelf.com`).
- **Core Modules & Data Flow**:
  - `ReaderShell.tsx`: Central coordinator managing active page, view mode, zoom, active activity, and audio player state.
  - `TopBar.tsx`: Sticky Oxford top navigation bar with page jumper (`Page [ 11 ] of 168`), zoom tools (Fit-Width, Fit-Page, 100%), spread toggle, and fullscreen.
  - `PageView.tsx` & `PageOverlay.tsx`: Pristine canvas rendering `book_pages/page_X.jpg` without any raw inputs, rendering only discrete `ActivityHotspotBadge` elements.
  - `ActivityWindow.tsx`: Interactive activity card supporting dual layout modes (Docked right-hand split drawer or centered floating modal) with `WordBankChips` (click-to-insert), `GapFillCard`, and `MultipleChoiceCard` (radio buttons).
  - `AudioPlayer.tsx`: Persistent docked bottom audio bar with track info, 10s skip, scrubber with elapsed & remaining time, speed selector `[0.8x, 1.0x, 1.2x]`, volume slider, and automated TTS fallback.
  - `useBookProgress.ts` & `storage.ts`: Client-side persistence with scoped schema `{ [unitId_pageId_exerciseId]: { answers, score, isCompleted } }` and URL hash deep linking (`#page=11`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | TOC Drawer Toggle | Opens/closes Table of Contents drawer | M2 | Survey R1 |
| 2 | TOC Navigation | Units 1-12, Reference Banks (Grammar, Vocab, Sound) | M2 | Survey R1 |
| 3 | Book Title Header | "English File Pre-Intermediate" header with book page subtitle | M2 | Survey R1 |
| 4 | Previous Page Button | `◀` Decrements page, updates canvas and URL hash | M2 | Survey R1 |
| 5 | Page Jumper Input | `Page [ 11 ] of 168` input with Enter/blur submit and clamping | M2 | Survey R1 |
| 6 | Next Page Button | `▶` Increments page, updates canvas and URL hash | M2 | Survey R1 |
| 7 | Zoom Controls | `+`, `-`, 100% reset with clamp bounds [50%, 250%] | M2 | Survey R1 |
| 8 | Fit-to-Width Zoom | Scales canvas dynamically to fit viewport width | M2 | Survey R1 |
| 9 | Fit-to-Page Zoom | Scales canvas dynamically to fit viewport height and width | M2 | Survey R1 |
| 10 | Two-Page Spread Toggle | `📖` Toggles between single page and two-page spread | M2 | Survey R1 |
| 11 | Fullscreen Toggle | HTML5 Fullscreen API toggle with Esc listener | M2 | Survey R1 |
| 12 | Pristine Book Canvas | Canvas 100% free of raw input boxes, borders, or textareas | M3 | Survey R2 |
| 13 | Audio Hotspot Badge | Circular badge `🎧 1.28` triggering docked audio player | M3 | Survey R2 |
| 14 | Activity Hotspot Badge | Circular badge `📝 Ex 4`, `📝 Ex 5a` triggering activity drawer/modal | M3 | Survey R2 |
| 15 | Hotspot Completion Badge | Subtle emerald checkmark `✓` indicating exercise completion | M3 | Survey R2 |
| 16 | Hotspot Scale Invariance | Percentage positioning (`x%`, `y%`) stable at all zooms (50%-200%) | M3 | Survey R2 |
| 17 | Docked Right Drawer Mode | Activity Window docks to right as split drawer with book canvas | M5 | Survey R3 |
| 18 | Centered Floating Modal Mode | Activity Window renders centered with backdrop blur | M5 | Survey R3 |
| 19 | Dock / Float Toggle | Header button toggling between drawer and modal layouts | M5 | Survey R3 |
| 20 | Activity Window Header | Exercise title, instructions, audio trigger, close button | M5 | Survey R3 |
| 21 | Interactive Word Bank Chip Bar | Clickable chip bar (*above, behind, between...*) above blanks | M5 | Survey R3 |
| 22 | Click-to-Insert Chip Insertion | Clicking chip inserts text into active focused blank | M5 | Survey R3 |
| 23 | Gap-Fill Underlined Blanks | Ex 5a sentences 1-10 with clean underlined input blanks | M5 | Survey R3 |
| 24 | Multiple-Choice Radio Options | Ex 4 questions 1-6 with custom accessible radio buttons (a, b, c) | M5 | Survey R3 |
| 25 | Check Answers Action | Non-destructive grading: emerald for correct, amber for incorrect | M5 | Survey R3 |
| 26 | Show Answers Action | Self-study toggle revealing answer keys without overwriting user input | M5 | Survey R3 |
| 27 | Reset Exercise Action | Clears inputs and score with confirmation prompt | M5 | Survey R3 |
| 28 | Save & Close Action | Persists answers to localStorage and returns focus to book | M5 | Survey R3 |
| 29 | Docked Bottom Audio Bar | Persistent bottom bar triggered by audio hotspots | M4 | Survey R4 |
| 30 | Track Title & Source Badge | "Track 1.28 - Listening Ex 4" with MP3 / TTS badge | M4 | Survey R4 |
| 31 | Audio Play / Pause | Play/pause toggle with state synchronization | M4 | Survey R4 |
| 32 | 10s Rewind & Fast-Forward | `⏪ 10s` and `⏩ 10s` skip buttons | M4 | Survey R4 |
| 33 | Elapsed & Remaining Scrubber | Interactive scrubber with elapsed (`0:42`) and remaining (`-1:23`) | M4 | Survey R4 |
| 34 | Audio Speed Selector | Speed presets: `0.8x`, `1.0x`, `1.2x` | M4 | Survey R4 |
| 35 | Volume Slider & Mute | Draggable volume range input with mute toggle | M4 | Survey R4 |
| 36 | Audio Player Dismiss | Closes dock and pauses playback | M4 | Survey R4 |
| 37 | Automated Web Speech TTS Fallback | Catches audio 404/errors and plays speech synthesis automatically | M4 | Survey R4 |
| 38 | Centralized `useBookProgress` | Hook managing scoped answers, scores, and evaluations | M1 | Survey R5 |
| 39 | Scoped Storage Schema | `localStorage` key `[unitId_pageId_exerciseId]` format | M1 | Survey R5 |
| 40 | URL Hash Deep Linking | `#page=11` deep linking with browser history sync | M1 | Survey R5 |
| 41 | Multi-User Client Isolation | 100% client-side storage, zero server data leakage | M1 | Survey R5 |
| 42 | Unit 1C Page 11 Reference Wire-Up | Full interactive wiring of Page 11 (`page_12.jpg` Book p.11) | M5 | Survey R6 |
| 43 | 100% E2E Test Suite Pass | Verification against all user acceptance criteria and test tiers | M6 | Survey R1-R6 |
| 44 | Adversarial Coverage Hardening | Tier 5 white-box stress testing and bug discovery | M6 | Survey R1-R6 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | State, Storage & Data Contracts | `types/index.ts`, `storage.ts`, `useBookProgress.ts`, `dataService.ts`, URL hash `#page=11` sync | none | PLANNED |
| M2 | Top Reader Navigation & Utility Bar | `TopBar.tsx`, Page Jumper `Page [ 11 ] of 168`, Fit-Width/Fit-Page, 100% reset, Spread toggle, Fullscreen | M1 | PLANNED |
| M3 | Pristine Canvas & Activity Hotspots | `PageView.tsx`, `PageOverlay.tsx`, `ActivityHotspotBadge.tsx`, clean canvas, audio & exercise badges | M1 | PLANNED |
| M4 | Docked Bottom Audio Bar | `AudioPlayer.tsx`, `useAudioPlayer.ts`, 0.8x/1.0x/1.2x speeds, volume slider, remaining time, TTS fallback | M1 | PLANNED |
| M5 | Oxford Interactive Activity Window & Page 11 Wire-Up | `ActivityWindow.tsx`, `WordBankChips.tsx`, `GapFillCard.tsx`, `MultipleChoiceCard.tsx`, `ReaderShell.tsx` | M1, M3, M4 | PLANNED |
| M6 | Final Milestone: E2E Verification & Hardening | 100% E2E test pass across Tiers 1-4, then Tier 5 adversarial coverage hardening | M2, M3, M4, M5, TEST_READY | PLANNED |

## Interface Contracts

### M1 ↔ M2, M3, M4, M5 (State & Storage Contracts)
- `ScopedActivityState`:
  ```ts
  export interface ScopedActivityState {
    answers: Record<string, string>;
    score?: number;
    isCompleted: boolean;
    lastUpdated: number;
  }
  ```
- Storage Key Convention: `oxford_activity_progress_v1` in `localStorage`, mapping key `${unitId}_page${pageId}_${exerciseId}` (e.g. `1C_page11_ex4`, `1C_page11_ex5a`).
- `ActivityHotspot`:
  ```ts
  export interface ActivityHotspot {
    id: string;
    type: 'activity' | 'audio';
    label: string;
    title: string;
    x: number; // percentage [0..100]
    y: number; // percentage [0..100]
    activityId?: string;
    audioTrackId?: string;
    exerciseIds?: string[];
  }
  ```
- URL Hash: `#page=11` (or `#page=12`). Clamped between `1` and `169`.

### M3 ↔ M5 (Canvas & Activity Window Interaction)
- Clicking `ActivityHotspotBadge` calls `onOpenActivity(activityId: string)`.
- Active activity state held in `ReaderShell.tsx` as `activeActivityId: string | null`.
- When an exercise is completed, `useBookProgress` sets `isCompleted: true`, which triggers the emerald checkmark badge (`✓`) in `ActivityHotspotBadge`.

### M3, M5 ↔ M4 (Audio Dock Integration)
- Audio hotspots or in-activity audio buttons invoke `onPlayAudio(trackId: string, trackTitle?: string)`.
- Docked audio player renders at viewport bottom (`fixed bottom-0 left-0 right-0 z-40`).

## Code Layout
```
src/
├── types/
│   └── index.ts                 # Extended with ActivityHotspot, ScopedActivityState, ActivityDefinition
├── services/
│   ├── storage.ts               # LocalStorage scoped activity persistence & migration
│   └── dataService.ts           # Data loading, answerKey parser fix, hotspot lookup
├── hooks/
│   ├── useBookProgress.ts       # Scoped activity state, non-destructive grading, answer checks
│   └── useAudioPlayer.ts        # Playback, 0.8x/1.0x/1.2x speeds, remaining time, TTS fallback
├── components/
│   ├── layout/
│   │   ├── ReaderShell.tsx      # Main reader shell coordinating layout, active drawer, bottom audio
│   │   ├── TopBar.tsx           # Sticky top bar with page jumper, zoom tools, view modes
│   │   └── SidebarTOC.tsx       # Table of contents drawer
│   ├── viewer/
│   │   ├── PageView.tsx         # Viewport canvas, zoom scaling, spread view
│   │   ├── PageOverlay.tsx      # Pristine canvas renderer: renders ONLY ActivityHotspotBadges
│   │   └── ActivityHotspotBadge.tsx # High-contrast circular badges with completion checkmarks
│   ├── activity/
│   │   ├── ActivityWindow.tsx   # Dual-mode drawer / floating modal container
│   │   ├── WordBankChips.tsx    # Clickable chip bar with insert-to-focused-blank
│   │   ├── GapFillCard.tsx      # Underlined sentence blanks for Ex 5a
│   │   └── MultipleChoiceCard.tsx # Custom radio buttons for Ex 4 Vermeer listening
│   └── audio/
│       └── AudioPlayer.tsx      # Bottom docked audio bar with controls, scrubber, volume slider
```

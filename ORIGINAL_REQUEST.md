# Original User Request

## 2026-09-22T14:27:43Z

Redesign the English File 4th Edition Pre-Intermediate Digital Workbook to match the high-standard ergonomics and visual layout of Oxford Learner's Bookshelf (oxfordlearnersbookshelf.com), replacing on-page text input overlays with discrete activity hotspots and an interactive slide-out/dockable activity drawer.

Working directory: d:\DigitalTextbook
Integrity mode: development

## Requirements

### R1. Top Reader Navigation & Utility Bar
- Build a sticky top bar matching modern e-reader interfaces:
  - Left: Table of Contents drawer button (Units 1-12, Grammar Bank, Vocabulary Bank, Sound Bank) and Book Title ("English File Pre-Intermediate").
  - Center: Precise page navigation with Previous Page (`◀`), interactive Page Jumper input (`Page [ 11 ] of 168`), and Next Page (`▶`).
  - Right: View tools including Zoom controls (+, -, Fit-to-Width, Fit-to-Page, 100% reset), Single Page vs. Two-Page Spread toggle (`📖`), and Fullscreen toggle.

### R2. Pristine Book Canvas with Activity Hotspots
- Keep the textbook canvas 100% clean and unobstructed: zero raw input boxes or textareas rendered over printed book text.
- Render discrete, high-contrast hotspot badges positioned beside exercise headers:
  - Audio Hotspot: Circular headphone badge with track ID (e.g., `🎧 1.28`). Clicking opens the docked player and plays the track.
  - Activity Hotspot: Circular pencil/clipboard badge with exercise ID (e.g., `📝 Ex 5a`). Clicking opens the interactive Activity Window.
  - Completion State: Displays a subtle green checkmark badge once an activity has been completed.

### R3. Oxford-Style Interactive Activity Window (Split Drawer & Modal)
- When clicking an Activity Hotspot, display a high-contrast Activity Card that can dock as a right-hand drawer (split view with the book) or display as a centered modal with a "Dock to Right / Float" toggle.
- Header: Exercise title, instructions, and close button.
- Gap-Fill Activities (e.g., Unit 1C Ex 5a Prepositions of Place):
  - Clean underlined sentence blanks.
  - Interactive top Word Bank chip bar (e.g., *above, behind, between, in front of, in the middle, next to, on, under*).
  - Clicking any word chip automatically inserts it into the currently focused blank.
- Multiple-Choice & Listening Activities (e.g., Unit 1C Ex 4 Vermeer):
  - Structured questions 1 to 6 with radio buttons (a, b, c) and clear typography.
- Action Bar:
  - "Check Answers": Non-destructive grading comparing input with answer keys, highlighting correct answers in emerald and incorrect in amber with hints.
  - "Show Answers": Toggles official answers for self-study.
  - "Reset": Clears exercise inputs with confirmation.
  - "Save & Close": Persists answers to localStorage and returns focus to the book.

### R4. Docked Oxford-Style Audio Bar
- Persistent bottom audio dock triggered by audio hotspots:
  - Track title & badge (e.g., "Track 1.28 - Listening Ex 4").
  - Play/Pause, 10s Rewind (`⏪ 10s`), 10s Fast-Forward (`⏩ 10s`).
  - Scrub bar with current elapsed and remaining time.
  - Speed selector (0.8x, 1.0x, 1.2x).
  - Volume slider and dismiss button.

### R5. Client-Side State Persistence & Deep Linking
- Centralize all answers in `useBookProgress` using `localStorage` scoped by `{ [unitId_pageId_exerciseId]: { answers: Record<string, string>, score?: number, isCompleted: boolean } }`.
- Deep linking via URL hash (e.g., `#page=11`) preserving page jumps across sessions.
- Preserve multi-user isolation (100% client-side storage, zero server data leakage).

### R6. Reference Implementation on Unit 1C (Page 11)
- Fully wire up Page 11 (Unit 1C "One dark October evening") containing:
  - Exercise 4 (Listening - The Milkmaid by Johannes Vermeer, Questions 1-6 multiple-choice with Audio Track 1.28).
  - Exercise 5a (Vocabulary - Prepositions of place, Sentences 1-10 with Word Bank chips).

## Acceptance Criteria

### Visual & Canvas Clarity
- [ ] No input fields, borders, or text boxes obscure the printed textbook image.
- [ ] Hotspot badges render cleanly next to exercise titles and remain accurately positioned at all zoom levels (50% - 200%).

### Activity Window & Interaction
- [ ] Clicking an Activity Hotspot opens the Activity Drawer/Modal without reloading the page.
- [ ] In Ex 5a, clicking word bank chips (*behind, between, under*, etc.) inserts the text into the focused blank.
- [ ] In Ex 4, radio options (a, b, c) are selectable for each question.
- [ ] Clicking "Check Answers" displays non-destructive score feedback and highlights mistakes without clearing text.
- [ ] Answers persist in `localStorage` upon page reload.

### Audio Integration
- [ ] Clicking audio hotspot `🎧 1.28` launches the bottom docked player and begins playback (or falls back to TTS if MP3 is missing).
- [ ] Audio controls (10s skip, speed adjustment, scrubber) operate smoothly.

### Build & Deployment
- [ ] `npm run build` succeeds cleanly with zero TypeScript or Vite errors.
- [ ] GitHub Pages automated deployment workflow (`.github/workflows/deploy.yml`) and base path remain intact.

export interface PageMeta {
  pdfPage: number;
  bookPage: number;
  title: string;
  type?: string;
  unit?: number | null;
  lesson?: string | null;
  grammar?: string | null;
  vocabulary?: string | null;
  pronunciation?: string | null;
  audioTracks?: string[];
}

export type ExerciseFieldType = 
  | 'text'
  | 'textarea'
  | 'single_choice'
  | 'multi_choice'
  | 'dropdown'
  | 'matching'
  | 'table'
  | 'self_check'
  | 'speaking'
  | 'listening';

export interface ExerciseItem {
  id: string;
  pageNum: number;
  bookPage: number;
  label: string;
  fieldType: ExerciseFieldType;
  x: number;
  y: number;
  width: number;
  height: number;
  placeholder?: string;
  hint?: string;
  explanation?: string;
  unitRef?: string;
  gradingType?: 'exact' | 'normalized' | 'self_check' | 'multiple_choice';
  acceptedAnswers?: string[];
  options?: string[];
  matchingPairs?: { left: string; right: string }[];
  tableHeaders?: string[];
  tableRows?: string[][];
  audioTrack?: string;
}

export interface ExerciseAnswer {
  unitId: string;
  pageId: number;
  exerciseId: string;
  value: string | string[];
  answer: string | string[]; // alias for value
  isCompleted: boolean;
  completed: boolean; // alias for isCompleted
  lastUpdated: number;
}

export interface AnswerEvaluation {
  exerciseId: string;
  isCorrect: boolean;
  isSelfCheck: boolean;
  userValue: string | string[];
  acceptedAnswers: string[];
  explanation?: string;
  hint?: string;
}

export interface Lesson {
  id: string;
  title: string;
  page: number;
  bookPage: number;
  grammar?: string;
  vocabulary?: string;
  pronunciation?: string;
}

export interface Unit {
  id: string;
  unitNumber: number;
  title: string;
  lessons: Lesson[];
  practical?: {
    id: string;
    title: string;
    page: number;
    bookPage: number;
    focus?: string;
    pronunciation?: string;
  } | null;
  review?: {
    id: string;
    title: string;
    page: number;
    bookPage: number;
  } | null;
}

export interface ReferenceSection {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
  startBookPage: number;
  endBookPage: number;
}

export interface AudioTrackMeta {
  id: string;
  trackId?: string;
  title: string;
  unit?: string;
  lesson?: string;
  page: number;
  bookPage?: number;
  filename: string;
  script?: string;
  transcript?: string;
}

export interface UserBookmark {
  pageNum: number;
  label: string;
  createdAt: number;
}

export interface UserNote {
  pageNum: number;
  content: string;
  updatedAt: number;
}

export type ThemeMode = 'dark' | 'light' | 'paper';
export type ViewMode = 'single' | 'spread';

// ============================================================================
// Milestone 1: Oxford Learner's Bookshelf State & Hotspot Contracts
// ============================================================================

/**
 * Scoped Activity State representing the persisted user interaction data
 * for a specific interactive activity (e.g., Ex 4 Vermeer listening, Ex 5a Prepositions).
 * Stored in localStorage under key 'oxford_activity_progress_v1'.
 */
export interface ScopedActivityState {
  answers: Record<string, string>;
  score?: number;
  isCompleted: boolean;
  lastUpdated: number;
}

/**
 * Top-level persistent store holding all activity progress across the workbook,
 * keyed by scoped activity identifier `${unitId}_page${pageId}_${exerciseId}`
 * (e.g., '1C_page11_ex4', '1C_page11_ex5a').
 */
export type BookProgressStore = Record<string, ScopedActivityState>;

/**
 * Hotspot type: either an interactive activity or an audio track trigger.
 */
export type HotspotType = 'activity' | 'audio';

/**
 * Discrete hotspot badge positioned over the pristine book canvas.
 * Percentage coordinates (x, y) ensure scale invariance across 50%-250% zoom levels.
 */
export interface ActivityHotspot {
  id: string;
  type: HotspotType;
  label: string;
  title: string;
  x: number; // percentage [0..100]
  y: number; // percentage [0..100]
  activityId?: string;
  audioTrackId?: string;
  exerciseIds?: string[];
}

/**
 * Supported interactive activity paradigms for Oxford Learner's Bookshelf.
 */
export type ActivityType = 
  | 'gap_fill'
  | 'multiple_choice'
  | 'single_choice'
  | 'dropdown'
  | 'matching'
  | 'free_text';

/**
 * Option definition for multiple-choice questions.
 */
export interface ActivityOption {
  value: string;
  label: string;
}

/**
 * Individual question or gap-fill sentence within an interactive activity.
 */
export interface ActivityItem {
  id: string;
  label?: string;
  prompt: string;
  prefix?: string;
  suffix?: string;
  options?: ActivityOption[] | string[];
  acceptedAnswers: string[];
  hint?: string;
  explanation?: string;
  audioTrackId?: string;
}

/**
 * Complete metadata and question specification for an Oxford interactive activity.
 */
export interface ActivityDefinition {
  id: string;
  unitId: string;
  pageId: number;
  exerciseId: string;
  title: string;
  instruction: string;
  type: ActivityType;
  wordBank?: string[];
  audioTrackId?: string;
  audioTitle?: string;
  items: ActivityItem[];
}

/**
 * Result structure returned by checkScopedAnswers evaluation.
 */
export interface ScopedCheckResult {
  score: number;
  results: Record<string, boolean>;
  hints: Record<string, string>;
}

export interface OxfordQuestion {
  num: number;
  id: string;
  question?: string;
  correct: string;
  label?: string;
  options?: { value: string; label: string }[];
}

export interface OxfordBlank {
  id: string;
  accepted: string[];
  hint?: string;
  label?: string;
}

export interface OxfordActivity {
  id: string;
  legacyId?: string;
  unitId: string;
  pageId: number;
  bookPage: number;
  title: string;
  instructions: string;
  type: 'multiple-choice' | 'gap-fill' | 'matching';
  audioTrack?: string;
  hotspot: { x: number; y: number };
  audioHotspot?: { x: number; y: number };
  wordBank?: string[];
  questions?: OxfordQuestion[];
  blanks?: Record<string, OxfordBlank>;
  sentences?: { num: number; text: string; blankIds: string[] }[];
}

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
export type HotspotType = 'activity' | 'audio' | 'exercise' | 'image' | 'video' | 'glossary' | 'teacher-note' | 'resource';

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
  exerciseId?: string;
  audioTrackId?: string;
  imageRegionId?: string;
  targetId?: string;
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

// ============================================================================
// Universal Multi-Book Content-Driven Architecture Types
// ============================================================================

export type BookId = string;
export type PageId = number | string;
export type ExerciseId = string;
export type AudioTrackId = string;
export type HotspotId = string;
export type ImageRegionId = string;

export interface VocabularyMetadata {
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  definition?: string;
  translation?: string;
  exampleSentence?: string;
  audioPronunciation?: string;
}

export interface ImageRegionDefinition {
  id: ImageRegionId;
  x: number; // percentage [0..100]
  y: number; // percentage [0..100]
  width: number; // percentage [0..100]
  height: number; // percentage [0..100]
  imageSource: string;
  title: string;
  caption?: string;
  vocabularyTag?: string;
  enabled: boolean;
  zoom?: number;
  audio?: string;
  explanation?: string;
  vocabulary?: VocabularyMetadata;
}

export interface AudioTrackDefinition {
  id: AudioTrackId;
  title: string;
  source: string;
  bookId: BookId;
  pageId?: number;
  duration?: number;
  transcript?: string;
  language?: string;
  speaker?: string;
  type?: 'dialogue' | 'monologue' | 'pronunciation' | 'song' | 'instruction';
  sections?: Array<{ time: number; label: string }>;
  loopPoints?: { a: number; b: number };
}

export interface ExerciseQuestionDefinition {
  id: string;
  num?: number;
  prompt?: string;
  instruction?: string;
  options?: Array<string | { value: string; label: string }>;
  correctAnswer?: string | string[];
  acceptedAnswers?: string[];
  hint?: string;
  explanation?: string;
  audioTrack?: string;
  matchingPairs?: Array<{ left: string; right: string; leftId?: string; rightId?: string }>;
  tableHeaders?: string[];
  tableRows?: string[][];
  suggestedAnswer?: string;
  modelAudioText?: string;
  items?: string[];
}

export type GenericExerciseType =
  | 'multiple-choice'
  | 'single-choice'
  | 'multiple-selection'
  | 'gap-fill'
  | 'text-input'
  | 'word-bank'
  | 'matching'
  | 'dropdown'
  | 'true-false'
  | 'ordering'
  | 'table-completion'
  | 'table-fill'
  | 'open-response'
  | 'listening'
  | 'speaking'
  | 'self-check'
  | 'teacher-led';

export interface ExerciseDefinition {
  id: ExerciseId;
  title: string;
  instructions: string;
  type: GenericExerciseType;
  audioTrack?: string;
  wordBank?: string[];
  wordBankConfig?: {
    allowMultipleUse?: boolean;
  };
  questions: ExerciseQuestionDefinition[];
  scoring?: {
    maxScore?: number;
    passScore?: number;
  };
  hints?: string[];
  teacherNotes?: string;
  requiresSelfGrading?: boolean;
}

export type GenericHotspotType =
  | 'audio'
  | 'exercise'
  | 'activity'
  | 'image'
  | 'video'
  | 'glossary'
  | 'teacher-note'
  | 'resource';

export interface GenericHotspot {
  id: HotspotId;
  type: GenericHotspotType;
  xPercent: number; // [0..100]
  yPercent: number; // [0..100]
  badgeLabel: string;
  title?: string;
  targetId?: string;
  exerciseId?: string;
  audioTrack?: string;
  imageRegionId?: string;
  width?: number;
  height?: number;
}

export interface PageDefinition {
  internalPageId: number; // 1-indexed internal page sequence
  pdfPageNumber: number; // PDF physical page
  printedPageNumber: number; // Human-visible printed textbook page number
  image: string; // URL / path to page image
  // Backward compatibility aliases
  pageNumber?: number;
  imageSrc?: string;
  unitName?: string;
  lessonName?: string;
  chapter?: string;
  unit?: string;
  lesson?: string;
  title: string;
  pageType?: 'cover' | 'syllabus' | 'lesson' | 'review' | 'reference' | 'blank';
  hotspots: GenericHotspot[];
  imageRegions?: ImageRegionDefinition[];
  exercises: ExerciseDefinition[];
  audioTracks?: AudioTrackDefinition[];
  notes?: string;
  metadata?: Record<string, any>;
}

export interface TOCNavigationLesson {
  id: string;
  title: string;
  pageNumber: number;
  badge?: string;
  grammar?: string;
  vocabulary?: string;
}

export interface TOCNavigationSection {
  id: string;
  title: string;
  startPage: number;
  endPage?: number;
  lessons: TOCNavigationLesson[];
}

export interface BookManifest {
  id: BookId;
  title: string;
  subtitle: string;
  author: string;
  publisher: string;
  category: 'cambodia-secondary' | 'self-study' | 'oxford-series' | 'moeys-secondary' | 'general';
  grade: string;
  gradeLabel: string;
  cefrLevel?: string;
  coverImage: string;
  totalPages: number;
  physicalTotalPages?: number;
  language: string;
  description: string;
  version: string;
  contentBasePath: string;
  pageImagePattern?: string;
  initialPage?: number;
  aliases?: string[];
  navigation: TOCNavigationSection[];
  features?: {
    audio?: boolean;
    exercises?: boolean;
    imageRegions?: boolean;
    presentationMode?: boolean;
  };
  metadata?: Record<string, any>;
  pages: Record<number, PageDefinition>;
}

export interface BookValidationIssue {
  type: 'error' | 'warning';
  bookId: string;
  pageId?: number;
  field?: string;
  message: string;
}

export interface BookValidationReport {
  timestamp: string;
  totalBooks: number;
  validBooks: number;
  issues: BookValidationIssue[];
  summary: string;
}


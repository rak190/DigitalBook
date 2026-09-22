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

import { BookManifest } from '../../types';
import { englishFilePreIntermediate } from './englishFilePreIntermediate';
import { englishGrade7 } from './englishGrade7';
import { englishGrade8 } from './englishGrade8';
import { englishGrade9 } from './englishGrade9';

export {
  englishFilePreIntermediate,
  englishGrade7,
  englishGrade8,
  englishGrade9,
};

export const INITIAL_BOOKS: BookManifest[] = [
  englishGrade7,
  englishGrade8,
  englishGrade9,
  englishFilePreIntermediate,
];

export const BOOKS_MAP: Record<string, BookManifest> = {
  [englishGrade7.id]: englishGrade7,
  [englishGrade8.id]: englishGrade8,
  [englishGrade9.id]: englishGrade9,
  [englishFilePreIntermediate.id]: englishFilePreIntermediate,
};

import { BookManifest as GenericBookManifest, PageDefinition, ExerciseDefinition } from '../types';
import { BOOKS_MAP, INITIAL_BOOKS } from './books';

export type BookManifest = GenericBookManifest;
export type PageData = PageDefinition;
export type Exercise = ExerciseDefinition;

export const BOOKS_REGISTRY: Record<string, BookManifest> = BOOKS_MAP;
export const DEFAULT_BOOK_ID = 'english-file-pre-int';

export function getAllBooks(): BookManifest[] {
  return INITIAL_BOOKS;
}

import { BookService } from '../services/bookService';

export function getBookManifest(id: string): BookManifest | undefined {
  return BookService.getBook(id);
}

export function generateStaticParams(): { bookId: string }[] {
  return Object.keys(BOOKS_MAP).map((bookId) => ({ bookId }));
}

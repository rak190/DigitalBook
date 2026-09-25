import { BookManifest, BookId } from '../types';
import { BOOKS_MAP, INITIAL_BOOKS } from '../data/books';

export class BookService {
  private static books: Map<BookId, BookManifest> = new Map(
    Object.entries(BOOKS_MAP)
  );

  public static registerBook(book: BookManifest): void {
    this.books.set(book.id, book);
  }

  public static getAllBooks(): BookManifest[] {
    return Array.from(this.books.values());
  }

  public static getBook(id: BookId): BookManifest | undefined {
    if (this.books.has(id)) return this.books.get(id);
    for (const book of this.books.values()) {
      if (book.aliases && book.aliases.includes(id)) {
        return book;
      }
    }
    // Also check normalized id
    const norm = id.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const book of this.books.values()) {
      const bNorm = book.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (bNorm === norm) return book;
      if (book.aliases?.some((a) => a.toLowerCase().replace(/[^a-z0-9]/g, '') === norm)) {
        return book;
      }
    }
    return undefined;
  }

  public static getDefaultBookId(): BookId {
    return 'english-file-pre-int';
  }

  public static getCategories(): string[] {
    const cats = new Set<string>();
    this.books.forEach((b) => {
      if (b.category) cats.add(b.category);
    });
    return Array.from(cats);
  }

  public static searchBooks(query: string, category?: string, grade?: string): BookManifest[] {
    const q = query.trim().toLowerCase();
    return this.getAllBooks().filter((book) => {
      if (category && category !== 'all' && book.category !== category) return false;
      if (grade && grade !== 'all' && book.grade !== grade && book.gradeLabel !== grade) return false;
      if (!q) return true;
      return (
        book.title.toLowerCase().includes(q) ||
        book.subtitle.toLowerCase().includes(q) ||
        book.gradeLabel.toLowerCase().includes(q) ||
        book.id.toLowerCase().includes(q) ||
        book.description.toLowerCase().includes(q)
      );
    });
  }
}

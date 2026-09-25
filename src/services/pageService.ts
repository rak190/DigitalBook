import { PageDefinition, BookId } from '../types';
import { BookService } from './bookService';

const BASE = import.meta.env.BASE_URL || '/';

export class PageService {
  public static getPage(bookId: BookId, pageNum: number): PageDefinition | undefined {
    const book = BookService.getBook(bookId);
    if (!book) return undefined;
    return book.pages[pageNum];
  }

  public static getPageCount(bookId: BookId): number {
    const book = BookService.getBook(bookId);
    return book?.totalPages || 1;
  }

  public static resolvePageImageSrc(bookId: BookId, pageNum: number): string {
    const page = this.getPage(bookId, pageNum);
    if (page?.image) return page.image;

    const book = BookService.getBook(bookId);
    if (!book) return `${BASE}book_pages/page_${pageNum}.jpg`;

    // Generic manifest-driven pattern resolution: zero hard-coded book IDs!
    if (book.pageImagePattern) {
      return `${BASE}${book.pageImagePattern.replace('{page}', String(pageNum))}`;
    }

    return `${book.contentBasePath || BASE}pages/page-${String(pageNum).padStart(3, '0')}.webp`;
  }

  public static getNearbyPages(bookId: BookId, currentPage: number, radius = 2): number[] {
    const total = this.getPageCount(bookId);
    const pages: number[] = [];
    for (let p = currentPage - radius; p <= currentPage + radius; p++) {
      if (p >= 1 && p <= total) {
        pages.push(p);
      }
    }
    return pages;
  }

  public static preloadNearbyPages(bookId: BookId, currentPage: number): void {
    if (typeof window === 'undefined') return;
    const nearby = this.getNearbyPages(bookId, currentPage, 1);
    nearby.forEach((p) => {
      const src = this.resolvePageImageSrc(bookId, p);
      const img = new Image();
      img.src = src;
    });
  }
}

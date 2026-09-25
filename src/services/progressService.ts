import { BookId } from '../types';
import { StorageService } from './storage';
import { BookService } from './bookService';

export interface BookProgressOverview {
  bookId: BookId;
  title: string;
  lastOpenedPage: number;
  totalPages: number;
  progressPercent: number;
  completedActivitiesCount: number;
  totalActivitiesCount: number;
  bookmarksCount: number;
  notesCount: number;
  lastUpdated: number;
}

export class ProgressService {
  public static getBookProgress(bookId: BookId): BookProgressOverview {
    const book = BookService.getBook(bookId);
    const data = StorageService.getBookData(bookId);

    // Calculate total interactive activities in book
    let totalActivities = 0;
    if (book) {
      Object.values(book.pages).forEach((page) => {
        totalActivities += (page.exercises || []).length;
      });
    }

    const effectiveTotal = Math.max(1, totalActivities || 10);
    const progressPercent = StorageService.getBookProgressPercent(bookId, effectiveTotal);

    const completedCount = Object.values(data.completedActivities || {}).filter(Boolean).length;

    return {
      bookId,
      title: book?.title || bookId,
      lastOpenedPage: data.lastPage || 1,
      totalPages: book?.totalPages || 1,
      progressPercent,
      completedActivitiesCount: completedCount,
      totalActivitiesCount: totalActivities,
      bookmarksCount: (data.bookmarks || []).length,
      notesCount: (data.notes || []).length,
      lastUpdated: Date.now(),
    };
  }

  public static resetBookProgress(bookId: BookId): void {
    StorageService.clearBookData(bookId);
  }

  public static exportProgress(bookId: BookId): string {
    return StorageService.exportBookData(bookId);
  }

  public static importProgress(bookId: BookId, jsonString: string): { success: boolean; message: string } {
    return StorageService.importBookData(bookId, jsonString);
  }
}

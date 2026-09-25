import { AudioTrackDefinition, BookId } from '../types';
import { BookService } from './bookService';
import { mediaDB } from './storage';

const BASE = import.meta.env.BASE_URL || '/';

export class AudioService {
  public static async resolveTrackUrl(trackId: string, customFilename?: string): Promise<string> {
    // 1. Check IndexedDB custom upload first
    const customBlob = await mediaDB.getCustomAudio(trackId);
    if (customBlob) {
      return URL.createObjectURL(customBlob);
    }

    const cleanFilename = (customFilename || trackId).trim();
    const finalFilename = cleanFilename.endsWith('.mp3') ? cleanFilename : `${cleanFilename}.mp3`;
    return `${BASE}audio/${finalFilename}`;
  }

  public static getTrack(bookId: BookId, trackId: string): AudioTrackDefinition | undefined {
    const book = BookService.getBook(bookId);
    if (!book) return undefined;

    // Search through book pages
    for (const page of Object.values(book.pages)) {
      if (page.audioTracks) {
        const found = page.audioTracks.find((t) => t.id === trackId || t.title === trackId);
        if (found) return found;
      }
    }

    // Default fallback definition
    return {
      id: trackId,
      title: `Track ${trackId}`,
      source: `${BASE}audio/${trackId.endsWith('.mp3') ? trackId : `${trackId}.mp3`}`,
      bookId,
    };
  }

  public static getTracksForPage(bookId: BookId, pageNum: number): AudioTrackDefinition[] {
    const book = BookService.getBook(bookId);
    const page = book?.pages[pageNum];
    return page?.audioTracks || [];
  }
}

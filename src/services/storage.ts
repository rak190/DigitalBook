import { ExerciseAnswer, UserBookmark, UserNote, ThemeMode, ScopedActivityState, BookProgressStore } from '../types';

export const STORAGE_KEYS = {
  SCOPED_PROGRESS: 'oxford_activity_progress_v1',
  OXFORD_ACTIVITIES: 'oxford_activity_progress_v1',
  ANSWERS: 'digital_textbook_answers_v2',
  BOOKMARKS: 'digital_textbook_bookmarks_v2',
  NOTES: 'digital_textbook_notes_v2',
  LAST_PAGE: 'digital_textbook_last_page_v2',
  THEME: 'digital_textbook_theme_v2',
  ZOOM: 'digital_textbook_zoom_v2',
};

export interface BookScopedStorage {
  answers: Record<string, ExerciseAnswer>;
  completedActivities: Record<string, boolean>;
  activityProgress: Record<string, ScopedActivityState>;
  bookmarks: UserBookmark[];
  notes: UserNote[];
  lastPage: number;
}

const isBrowser = typeof window !== 'undefined';
const hasLocalStorage = isBrowser && typeof window.localStorage !== 'undefined';
const hasIndexedDB = isBrowser && typeof window.indexedDB !== 'undefined';

// IndexedDB Helper for audio and voice practice
class MediaStorageDB {
  private dbName = 'digital_textbook_media_db';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (!hasIndexedDB) {
      return Promise.reject(new Error('IndexedDB not supported in current environment'));
    }
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, this.version);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('recordings')) {
          db.createObjectStore('recordings', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('customAudio')) {
          db.createObjectStore('customAudio', { keyPath: 'trackId' });
        }
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve(this.db);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveRecording(pageNum: number, audioBlob: Blob, durationMs: number): Promise<number> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('recordings', 'readwrite');
      const store = tx.objectStore('recordings');
      const item = { pageNum, blob: audioBlob, durationMs, createdAt: Date.now() };
      const req = store.add(item);
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  }

  async getRecordingsForPage(pageNum: number): Promise<Array<{ id: number; pageNum: number; blob: Blob; durationMs: number; createdAt: number }>> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('recordings', 'readonly');
      const store = tx.objectStore('recordings');
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result || []).filter((item: any) => item.pageNum === pageNum);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteRecording(id: number): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('recordings', 'readwrite');
      const store = tx.objectStore('recordings');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async saveCustomAudio(trackId: string, audioBlob: Blob): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('customAudio', 'readwrite');
      const store = tx.objectStore('customAudio');
      const req = store.put({ trackId, blob: audioBlob, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getCustomAudio(trackId: string): Promise<Blob | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('customAudio', 'readonly');
      const store = tx.objectStore('customAudio');
      const req = store.get(trackId);
      req.onsuccess = () => resolve(req.result?.blob || null);
      req.onerror = () => reject(req.error);
    });
  }
}

export const mediaDB = new MediaStorageDB();

export class StorageService {
  // Scoped Book Key
  static getScopedKey(bookId: string): string {
    return `digital_book_progress_${bookId}`;
  }

  // Scoped Book Data Operations
  static getBookData(bookId: string): BookScopedStorage {
    if (!hasLocalStorage) {
      return { answers: {}, completedActivities: {}, activityProgress: {}, bookmarks: [], notes: [], lastPage: 1 };
    }
    try {
      const key = this.getScopedKey(bookId);
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          answers: parsed.answers || {},
          completedActivities: parsed.completedActivities || {},
          activityProgress: parsed.activityProgress || {},
          bookmarks: parsed.bookmarks || [],
          notes: parsed.notes || [],
          lastPage: parsed.lastPage || (bookId === 'english-file-pre-int' ? 7 : 1),
        };
      }

      // Seed / migrate existing data for English File Pre-Intermediate
      if (bookId === 'english-file-pre-int') {
        const legacyAnswers = this.getAnswers();
        const legacyActivities = this.getAllActivityProgress();
        const legacyBookmarks = this.getBookmarks();
        const legacyNotes = this.getNotes();
        const legacyLastPage = this.getLastPage();

        const completedMap: Record<string, boolean> = {};
        Object.entries(legacyActivities).forEach(([actKey, val]) => {
          if (val.isCompleted) {
            const parts = actKey.split('_');
            const actId = parts.slice(2).join('_');
            if (actId) completedMap[actId] = true;
            completedMap[actKey] = true;
          }
        });

        const initial: BookScopedStorage = {
          answers: legacyAnswers,
          completedActivities: completedMap,
          activityProgress: legacyActivities,
          bookmarks: legacyBookmarks,
          notes: legacyNotes,
          lastPage: legacyLastPage,
        };
        this.saveBookData(bookId, initial);
        return initial;
      }

      return { answers: {}, completedActivities: {}, activityProgress: {}, bookmarks: [], notes: [], lastPage: 1 };
    } catch (e) {
      console.warn(`Failed to read book progress for ${bookId}:`, e);
      return { answers: {}, completedActivities: {}, activityProgress: {}, bookmarks: [], notes: [], lastPage: 1 };
    }
  }

  static saveBookData(bookId: string, partial: Partial<BookScopedStorage>): void {
    if (!hasLocalStorage) return;
    try {
      const current = this.getBookData(bookId);
      const merged: BookScopedStorage = {
        answers: partial.answers !== undefined ? partial.answers : current.answers,
        completedActivities: partial.completedActivities !== undefined ? partial.completedActivities : current.completedActivities,
        activityProgress: partial.activityProgress !== undefined ? partial.activityProgress : current.activityProgress,
        bookmarks: partial.bookmarks !== undefined ? partial.bookmarks : current.bookmarks,
        notes: partial.notes !== undefined ? partial.notes : current.notes,
        lastPage: partial.lastPage !== undefined ? partial.lastPage : current.lastPage,
      };
      const key = this.getScopedKey(bookId);
      localStorage.setItem(key, JSON.stringify(merged));

      // Synchronize legacy keys for english-file-pre-int backward-compatibility
      if (bookId === 'english-file-pre-int') {
        if (partial.answers) this.saveAnswers(merged.answers);
        if (partial.bookmarks) this.saveBookmarks(merged.bookmarks);
        if (partial.notes) this.saveNotes(merged.notes);
        if (partial.lastPage) this.saveLastPage(merged.lastPage);
        if (partial.activityProgress) {
          try {
            localStorage.setItem(STORAGE_KEYS.OXFORD_ACTIVITIES, JSON.stringify(merged.activityProgress));
          } catch {}
        }
      }
    } catch (e) {
      console.warn(`Failed to save book progress for ${bookId}:`, e);
    }
  }

  static clearBookData(bookId: string): void {
    if (!hasLocalStorage) return;
    const key = this.getScopedKey(bookId);
    localStorage.removeItem(key);
    if (bookId === 'english-file-pre-int') {
      this.clearAllData();
    }
  }

  static exportBookData(bookId: string): string {
    const data = this.getBookData(bookId);
    const payload = {
      bookId,
      version: 3,
      exportedAt: new Date().toISOString(),
      ...data,
    };
    return JSON.stringify(payload, null, 2);
  }

  static importBookData(bookId: string, jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid JSON file format.' };
      }
      const answers = data.answers || {};
      const completedActivities = data.completedActivities || {};
      const activityProgress = data.activityProgress || {};
      const bookmarks = Array.isArray(data.bookmarks) ? data.bookmarks : [];
      const notes = Array.isArray(data.notes) ? data.notes : [];
      const lastPage = typeof data.lastPage === 'number' ? data.lastPage : 1;

      this.saveBookData(bookId, {
        answers,
        completedActivities,
        activityProgress,
        bookmarks,
        notes,
        lastPage,
      });
      return { success: true, message: `Progress for ${bookId} successfully imported!` };
    } catch (e: any) {
      return { success: false, message: `Import error: ${e.message}` };
    }
  }

  static getBookProgressPercent(bookId: string, totalActivities = 10): number {
    const data = this.getBookData(bookId);
    const actCompleted = Object.values(data.completedActivities || {}).filter(Boolean).length;
    const ansCompleted = Object.values(data.answers || {}).filter(a => a.isCompleted).length;
    const count = Math.max(actCompleted, ansCompleted);
    return Math.min(100, Math.round((count / Math.max(1, totalActivities)) * 100));
  }

  // Legacy Answers methods
  static getAnswers(): Record<string, ExerciseAnswer> {
    if (!hasLocalStorage) return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ANSWERS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  static saveAnswers(answers: Record<string, ExerciseAnswer>): void {
    if (!hasLocalStorage) return;
    try {
      localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(answers));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // Oxford Activity Progress
  static getAllActivityProgress(): Record<string, ScopedActivityState> {
    if (!hasLocalStorage) return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.OXFORD_ACTIVITIES);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  static getActivityProgress(activityKey: string): ScopedActivityState | null {
    const all = this.getAllActivityProgress();
    return all[activityKey] || null;
  }

  static saveActivityProgress(activityKey: string, state: ScopedActivityState): void {
    if (!hasLocalStorage) return;
    try {
      const all = this.getAllActivityProgress();
      all[activityKey] = state;
      localStorage.setItem(STORAGE_KEYS.OXFORD_ACTIVITIES, JSON.stringify(all));
    } catch (e) {
      console.warn('Failed to save activity progress:', e);
    }
  }

  // Bookmarks
  static getBookmarks(): UserBookmark[] {
    if (!hasLocalStorage) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static saveBookmarks(bookmarks: UserBookmark[]): void {
    if (!hasLocalStorage) return;
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // Notes
  static getNotes(): UserNote[] {
    if (!hasLocalStorage) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.NOTES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static saveNotes(notes: UserNote[]): void {
    if (!hasLocalStorage) return;
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // Last Page
  static getLastPage(): number {
    if (!hasLocalStorage) return 7;
    try {
      const val = localStorage.getItem(STORAGE_KEYS.LAST_PAGE);
      return val ? parseInt(val, 10) : 7; // Default to Unit 1A page 7
    } catch {
      return 7;
    }
  }

  static saveLastPage(pageNum: number): void {
    if (!hasLocalStorage) return;
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_PAGE, pageNum.toString());
    } catch {}
  }

  // Theme
  static getTheme(): ThemeMode {
    if (!hasLocalStorage) return 'dark';
    try {
      return (localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode) || 'dark';
    } catch {
      return 'dark';
    }
  }

  static saveTheme(theme: ThemeMode): void {
    if (!hasLocalStorage) return;
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {}
  }

  // Zoom
  static getZoom(): number {
    if (!hasLocalStorage) return 100;
    try {
      const val = localStorage.getItem(STORAGE_KEYS.ZOOM);
      return val ? parseFloat(val) : 100;
    } catch {
      return 100;
    }
  }

  static saveZoom(zoom: number): void {
    if (!hasLocalStorage) return;
    try {
      localStorage.setItem(STORAGE_KEYS.ZOOM, zoom.toString());
    } catch {}
  }

  // Full Export/Import
  static exportData(): string {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      answers: this.getAnswers(),
      bookmarks: this.getBookmarks(),
      notes: this.getNotes(),
      lastPage: this.getLastPage(),
      theme: this.getTheme(),
    };
    return JSON.stringify(payload, null, 2);
  }

  static importData(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid JSON file format.' };
      }
      if (data.answers && typeof data.answers === 'object') {
        this.saveAnswers(data.answers);
      }
      if (Array.isArray(data.bookmarks)) {
        this.saveBookmarks(data.bookmarks);
      }
      if (Array.isArray(data.notes)) {
        this.saveNotes(data.notes);
      }
      if (typeof data.lastPage === 'number') {
        this.saveLastPage(data.lastPage);
      }
      return { success: true, message: 'Study data successfully imported!' };
    } catch (e: any) {
      return { success: false, message: `Import error: ${e.message}` };
    }
  }

  static clearAllData(): void {
    if (!hasLocalStorage) return;
    localStorage.removeItem(STORAGE_KEYS.ANSWERS);
    localStorage.removeItem(STORAGE_KEYS.BOOKMARKS);
    localStorage.removeItem(STORAGE_KEYS.NOTES);
    localStorage.removeItem(STORAGE_KEYS.OXFORD_ACTIVITIES);
  }
}

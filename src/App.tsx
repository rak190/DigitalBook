import React, { useState, useEffect, useCallback } from 'react';
import { BookshelfView } from './components/bookshelf/BookshelfView';
import { ReaderShell } from './components/layout/ReaderShell';
import { DEFAULT_BOOK_ID, getBookManifest } from './data/booksRegistry';
import { StorageService } from './services/storage';

export function App() {
  const [currentView, setCurrentView] = useState<'bookshelf' | 'reader'>('bookshelf');
  const [activeBookId, setActiveBookId] = useState<string>(DEFAULT_BOOK_ID);
  const [activePage, setActivePage] = useState<number | undefined>(undefined);

  // Parse location hash and search params
  const resolveRoute = useCallback(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const pathname = window.location.pathname || '';

    // Check search query parameters first (e.g. ?book=english-grade-8&page=10)
    const searchParams = new URLSearchParams(search);
    if (searchParams.has('book')) {
      const bId = searchParams.get('book')!;
      const manifest = getBookManifest(bId);
      if (manifest) {
        setActiveBookId(manifest.id);
        const p = searchParams.get('page');
        setActivePage(p ? parseInt(p, 10) : undefined);
        setCurrentView('reader');
        return;
      }
    }

    // Check hash-based #/books/:bookId/page/:pageNum or #/books/:bookId?page=:pageNum or #/books/:bookId
    const hashBooksMatch = hash.match(/^#\/?books\/([^/?#]+)(?:\/page\/(\d+))?(?:\?page=(\d+))?/i);
    if (hashBooksMatch) {
      const rawBookId = hashBooksMatch[1];
      const pageStr = hashBooksMatch[2] || hashBooksMatch[3];
      const manifest = getBookManifest(rawBookId);
      if (manifest) {
        setActiveBookId(manifest.id);
        setActivePage(pageStr ? parseInt(pageStr, 10) : undefined);
        setCurrentView('reader');
        return;
      }
    }

    // Check hash-based #/reader?book=:bookId&page=:pageNum
    if (hash.startsWith('#/reader') || hash.startsWith('#reader')) {
      const queryIdx = hash.indexOf('?');
      const hashQuery = queryIdx >= 0 ? hash.slice(queryIdx + 1) : '';
      const params = new URLSearchParams(hashQuery);
      const rawBookId = params.get('book') || DEFAULT_BOOK_ID;
      const pageStr = params.get('page');
      const manifest = getBookManifest(rawBookId);
      if (manifest) {
        setActiveBookId(manifest.id);
        setActivePage(pageStr ? parseInt(pageStr, 10) : undefined);
        setCurrentView('reader');
        return;
      }
    }

    // Check legacy hash format: #page=11
    const legacyHashMatch = hash.match(/^#page=(\d+)/i);
    if (legacyHashMatch) {
      setActiveBookId(DEFAULT_BOOK_ID);
      setActivePage(parseInt(legacyHashMatch[1], 10));
      setCurrentView('reader');
      return;
    }

    // Check direct pathname routing: /books/:bookId/page/:pageNum or /DigitalBook/books/:bookId/page/:pageNum
    const pathBooksMatch = pathname.match(/(?:^|\/)books\/([^/?#]+)(?:\/page\/(\d+))?/i);
    if (pathBooksMatch) {
      const rawBookId = pathBooksMatch[1];
      const pageStr = pathBooksMatch[2] || searchParams.get('page');
      const manifest = getBookManifest(rawBookId);
      if (manifest) {
        setActiveBookId(manifest.id);
        setActivePage(pageStr ? parseInt(pageStr, 10) : undefined);
        setCurrentView('reader');
        return;
      }
    }

    // Check direct /reader pathname (e.g. /reader or /DigitalBook/reader)
    if (/(?:^|\/)reader\/?$/i.test(pathname)) {
      const rawBookId = searchParams.get('book') || DEFAULT_BOOK_ID;
      const pageStr = searchParams.get('page');
      const manifest = getBookManifest(rawBookId);
      if (manifest) {
        setActiveBookId(manifest.id);
        setActivePage(pageStr ? parseInt(pageStr, 10) : undefined);
        setCurrentView('reader');
        return;
      }
    }

    // Default to Bookshelf dashboard
    setCurrentView('bookshelf');
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).StorageService = StorageService;
    }
    resolveRoute();
    window.addEventListener('hashchange', resolveRoute);
    window.addEventListener('popstate', resolveRoute);
    return () => {
      window.removeEventListener('hashchange', resolveRoute);
      window.removeEventListener('popstate', resolveRoute);
    };
  }, [resolveRoute]);

  const handleOpenBook = (bookId: string, pageNumber?: number) => {
    setActiveBookId(bookId);
    setActivePage(pageNumber);
    setCurrentView('reader');
    const targetHash = pageNumber
      ? `#/reader?book=${bookId}&page=${pageNumber}`
      : `#/reader?book=${bookId}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  };

  const handleBackToBookshelf = () => {
    setCurrentView('bookshelf');
    if (window.location.hash !== '#/' && window.location.hash !== '') {
      window.location.hash = '#/';
    }
  };

  if (currentView === 'reader') {
    return (
      <ReaderShell
        bookId={activeBookId}
        initialPage={activePage}
        onBackToBookshelf={handleBackToBookshelf}
      />
    );
  }

  return <BookshelfView onOpenBook={handleOpenBook} />;
}

export default App;

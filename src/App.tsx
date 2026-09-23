import React, { useState, useEffect, useCallback } from 'react';
import { BookshelfView } from './components/bookshelf/BookshelfView';
import { ReaderShell } from './components/layout/ReaderShell';
import { DEFAULT_BOOK_ID, getBookManifest } from './data/booksRegistry';

export function App() {
  const [currentView, setCurrentView] = useState<'bookshelf' | 'reader'>('bookshelf');
  const [activeBookId, setActiveBookId] = useState<string>(DEFAULT_BOOK_ID);
  const [activePage, setActivePage] = useState<number | undefined>(undefined);

  // Parse location hash and search params
  const resolveRoute = useCallback(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash || '';
    const search = window.location.search || '';

    // Check search query parameters first (e.g. ?book=moeys-english-grade-7&page=10)
    const searchParams = new URLSearchParams(search);
    if (searchParams.has('book')) {
      const bId = searchParams.get('book')!;
      if (getBookManifest(bId)) {
        setActiveBookId(bId);
        const p = searchParams.get('page');
        setActivePage(p ? parseInt(p, 10) : undefined);
        setCurrentView('reader');
        return;
      }
    }

    // Check direct pathname routing (e.g. /books/[bookId] or /DigitalBook/books/[bookId])
    const pathname = window.location.pathname || '';
    const booksMatch = pathname.match(/(?:^|\/)books\/([a-zA-Z0-9_-]+)/);
    if (booksMatch && booksMatch[1]) {
      const bId = booksMatch[1];
      if (getBookManifest(bId)) {
        setActiveBookId(bId);
        const p = searchParams.get('page');
        setActivePage(p ? parseInt(p, 10) : undefined);
        setCurrentView('reader');
        return;
      }
    }

    // Check direct /reader pathname (e.g. /reader or /DigitalBook/reader)
    if (/(?:^|\/)reader\/?$/.test(pathname)) {
      const bId = searchParams.get('book') || DEFAULT_BOOK_ID;
      setActiveBookId(bId);
      const p = searchParams.get('page');
      setActivePage(p ? parseInt(p, 10) : undefined);
      setCurrentView('reader');
      return;
    }

    // Check hash-based routing
    if (hash.startsWith('#/reader') || hash.startsWith('#reader')) {
      const queryIdx = hash.indexOf('?');
      const hashQuery = queryIdx >= 0 ? hash.slice(queryIdx + 1) : '';
      const params = new URLSearchParams(hashQuery);
      const bId = params.get('book') || DEFAULT_BOOK_ID;
      const p = params.get('page');

      setActiveBookId(bId);
      setActivePage(p ? parseInt(p, 10) : undefined);
      setCurrentView('reader');
      return;
    }

    if (hash.startsWith('#/books/')) {
      const sub = hash.replace(/^#\/books\//, '');
      const [bId, queryPart] = sub.split('?');
      const params = new URLSearchParams(queryPart || '');
      const p = params.get('page');

      setActiveBookId(bId || DEFAULT_BOOK_ID);
      setActivePage(p ? parseInt(p, 10) : undefined);
      setCurrentView('reader');
      return;
    }

    // Default to Bookshelf dashboard
    setCurrentView('bookshelf');
  }, []);

  useEffect(() => {
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

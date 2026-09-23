import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Library,
  Download,
  RotateCcw,
  GraduationCap,
  Sparkles,
  MoreVertical,
  CheckCircle2,
  BookMarked,
  Info,
  X,
  FileDown,
} from 'lucide-react';
import { getAllBooks, BookManifest } from '../../data/booksRegistry';
import { StorageService } from '../../services/storage';

interface BookshelfViewProps {
  onOpenBook: (bookId: string, pageNumber?: number) => void;
}

type FilterTab = 'all' | 'moeys' | 'self-study';

export const BookshelfView: React.FC<BookshelfViewProps> = ({ onOpenBook }) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpenBookId, setMenuOpenBookId] = useState<string | null>(null);
  const [bookToReset, setBookToReset] = useState<BookManifest | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const allBooks = useMemo(() => getAllBooks(), []);

  // Filter books based on active tab and search query
  const filteredBooks = useMemo(() => {
    return allBooks.filter((book) => {
      // Tab filter
      if (activeTab === 'moeys' && book.category !== 'moeys-secondary') return false;
      if (activeTab === 'self-study' && book.category !== 'oxford-series') return false;

      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        book.title.toLowerCase().includes(q) ||
        book.subtitle.toLowerCase().includes(q) ||
        book.gradeLabel.toLowerCase().includes(q) ||
        book.id.toLowerCase().includes(q)
      );
    });
  }, [allBooks, activeTab, searchQuery]);

  // Compute progress stats for a book
  const getBookProgress = (book: BookManifest) => {
    // Total interactive activities across starter pages
    let activityCount = 0;
    Object.values(book.pages).forEach((p) => {
      activityCount += p.exercises.length;
    });
    const effectiveTotal = Math.max(1, activityCount || 10);
    return StorageService.getBookProgressPercent(book.id, effectiveTotal);
  };

  // Handle Download Progress Backup
  const handleDownloadBackup = (book: BookManifest) => {
    const jsonStr = StorageService.exportBookData(book.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${book.id}_progress_backup.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMenuOpenBookId(null);
  };

  // Confirm Reset Answers
  const handleConfirmReset = () => {
    if (bookToReset) {
      StorageService.clearBookData(bookToReset.id);
      setBookToReset(null);
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-slateDark-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Top Header matching Oxford Learner's Bookshelf */}
      <header className="sticky top-0 z-40 bg-slateDark-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-600/20">
              <Library className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                  Digital Bookshelf
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full">
                  Library
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Oxford & MoEYS Cambodia Interactive Textbooks
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md relative hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books, grades, curricula..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-800/90 text-white placeholder-slate-400 border border-slate-700/80 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Header Badge */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-850 border border-slate-800 text-xs text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline Ready &bull; GitHub Pages</span>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search books..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-slate-800 text-white placeholder-slate-400 border border-slate-700 outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60 flex items-center justify-between overflow-x-auto no-scrollbar py-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              All Books ({allBooks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('moeys')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'moeys'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>MoEYS Cambodia (Grades 7-9)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('self-study')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'self-study'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Self-Study (Oxford English File)</span>
            </button>
          </div>

          <div className="hidden md:block text-xs text-slate-400 font-medium">
            Showing <strong className="text-white">{filteredBooks.length}</strong> of {allBooks.length} books
          </div>
        </div>
      </header>

      {/* Main Bookshelf Library View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome / Classroom Presentation Banner */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 p-6 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Universal Digital Textbook Engine
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              Select a book to start interactive learning
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Featuring Oxford English File 4th Edition and Cambodia Ministry of Education, Youth and Sport (MoEYS) Grade 7, 8, and 9 curriculum. Complete with gap-fills, listening badges, and presentation mode.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none hidden md:block" />
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
            <Library className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No books found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              We couldn't find any books matching "{searchQuery}". Try searching for Grade 7, Grade 8, Grade 9, or English File.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="px-4 py-2 rounded-lg bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            key={refreshTrigger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredBooks.map((book) => {
              const progressPercent = getBookProgress(book);
              const isMenuOpen = menuOpenBookId === book.id;

              return (
                <div
                  key={book.id}
                  className="group bg-slateDark-900/90 hover:bg-slateDark-900 rounded-2xl border border-slate-800 hover:border-sky-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-sky-500/10 flex flex-col overflow-hidden relative"
                >
                  {/* Book Cover Area with 3D Bookshelf Appearance */}
                  <div
                    onClick={() => onOpenBook(book.id)}
                    className="relative w-full aspect-[3/4] bg-slate-950 overflow-hidden cursor-pointer flex items-center justify-center p-4 group-hover:scale-[1.01] transition-transform duration-300"
                  >
                    {/* Realistic Book Spine Shadow / 3D Edge */}
                    <div className="relative w-full h-full max-w-[210px] rounded-r-md rounded-l-sm shadow-2xl overflow-hidden border-r-2 border-b-2 border-slate-900/40 transform group-hover:-translate-y-1 transition-transform duration-300">
                      {/* Spine Crease Highlight */}
                      <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent z-10 pointer-events-none" />

                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover block"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback styled card if cover fails
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />

                      {/* Interactive Badge on Cover */}
                      <div className="absolute top-2.5 right-2.5 z-20">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-950/80 text-white backdrop-blur-md border border-white/20 shadow-md">
                          {book.gradeLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Book Meta & Progress */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Pills: Category & Curriculum */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            book.category === 'moeys-secondary'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {book.category === 'moeys-secondary' ? 'MoEYS Cambodia' : 'Oxford Series'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                          {book.totalPages} pp.
                        </span>
                      </div>

                      {/* Book Title & Subtitle */}
                      <h3
                        onClick={() => onOpenBook(book.id)}
                        className="text-base font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-1 cursor-pointer mb-1"
                        title={book.title}
                      >
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4" title={book.subtitle}>
                        {book.subtitle}
                      </p>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div>
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                          <span className="text-slate-400 text-[11px] flex items-center gap-1">
                            {progressPercent === 100 && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            Activity Progress
                          </span>
                          <span
                            className={`text-xs font-mono font-bold ${
                              progressPercent > 0 ? 'text-sky-400' : 'text-slate-500'
                            }`}
                          >
                            {progressPercent}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden shadow-inner">
                          <div
                            style={{ width: `${progressPercent}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              progressPercent === 100
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-r from-sky-500 to-indigo-500'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Primary Button & Quick Action Dropdown */}
                      <div className="flex items-center gap-2 relative">
                        <button
                          type="button"
                          onClick={() => onOpenBook(book.id)}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 hover:shadow-sky-600/30 transition-all cursor-pointer active:scale-98"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Open Book</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setMenuOpenBookId((prev) => (prev === book.id ? null : book.id))
                          }
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                          title="More options"
                          aria-label={`Options for ${book.title}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Quick Actions Dropdown Menu */}
                        {isMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setMenuOpenBookId(null)}
                            />
                            <div className="absolute right-0 bottom-12 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                              <button
                                type="button"
                                onClick={() => handleDownloadBackup(book)}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg flex items-center gap-2.5 transition-colors"
                              >
                                <FileDown className="w-4 h-4 text-sky-400" />
                                <span>Download Progress Backup</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpenBookId(null);
                                  setBookToReset(book);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 rounded-lg flex items-center gap-2.5 transition-colors mt-0.5"
                              >
                                <RotateCcw className="w-4 h-4 text-rose-400" />
                                <span>Reset All Answers</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Confirmation Modal for Reset All Answers */}
      {bookToReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slateDark-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              Reset answers for {bookToReset.title}?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              This will clear all typed answers, gap-fills, and completed activity badges for{' '}
              <strong className="text-white">{bookToReset.title}</strong>. This action cannot be undone. Progress in other books will remain completely untouched.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBookToReset(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-colors"
              >
                Yes, Reset Answers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

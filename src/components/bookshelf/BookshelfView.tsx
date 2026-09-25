import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Library,
  RotateCcw,
  GraduationCap,
  Sparkles,
  MoreVertical,
  CheckCircle2,
  BookMarked,
  Info,
  X,
  FileDown,
  Play,
  Settings,
  HelpCircle,
  SlidersHorizontal,
  Clock,
  Layers,
} from 'lucide-react';
import { getAllBooks, BookManifest } from '../../data/booksRegistry';
import { StorageService } from '../../services/storage';

interface BookshelfViewProps {
  onOpenBook: (bookId: string, pageNumber?: number) => void;
}

type CategoryFilter = 'all' | 'moeys' | 'grade-7' | 'grade-8' | 'grade-9' | 'self-study';
type SortOption = 'recent' | 'title' | 'progress';

export const BookshelfView: React.FC<BookshelfViewProps> = ({ onOpenBook }) => {
  const [activeTab, setActiveTab] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [menuOpenBookId, setMenuOpenBookId] = useState<string | null>(null);
  const [bookToReset, setBookToReset] = useState<BookManifest | null>(null);
  const [infoModalBook, setInfoModalBook] = useState<BookManifest | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const allBooks = useMemo(() => getAllBooks(), []);

  // Compute progress and last opened page for each book from storage
  const bookStats = useMemo(() => {
    const stats: Record<string, { percent: number; lastPage: number }> = {};
    allBooks.forEach((book) => {
      const data = StorageService.getBookData(book.id);
      let activityCount = 0;
      Object.values(book.pages).forEach((p) => {
        activityCount += (p.exercises || []).length;
      });
      const effectiveTotal = Math.max(1, activityCount || 10);
      const percent = StorageService.getBookProgressPercent(book.id, effectiveTotal);
      stats[book.id] = {
        percent,
        lastPage: data.lastPage || 1,
      };
    });
    return stats;
  }, [allBooks, refreshTrigger]);

  // Filter books based on active category and search query
  const filteredBooks = useMemo(() => {
    return allBooks
      .filter((book) => {
        // Category filter
        if (activeTab === 'moeys') {
          if (book.category !== 'moeys-secondary' && book.category !== 'cambodia-secondary')
            return false;
        } else if (activeTab === 'self-study') {
          if (book.category !== 'self-study' && book.category !== 'oxford-series') return false;
        } else if (activeTab === 'grade-7') {
          if (!book.id.includes('7') && book.gradeLabel !== 'Grade 7') return false;
        } else if (activeTab === 'grade-8') {
          if (!book.id.includes('8') && book.gradeLabel !== 'Grade 8') return false;
        } else if (activeTab === 'grade-9') {
          if (!book.id.includes('9') && book.gradeLabel !== 'Grade 9') return false;
        }

        // Search filter
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          book.title.toLowerCase().includes(q) ||
          book.subtitle.toLowerCase().includes(q) ||
          book.gradeLabel.toLowerCase().includes(q) ||
          book.id.toLowerCase().includes(q) ||
          book.description.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'progress') {
          return (bookStats[b.id]?.percent || 0) - (bookStats[a.id]?.percent || 0);
        }
        // 'recent': prioritize books with saved activity / highest lastPage
        const aLast = bookStats[a.id]?.lastPage || 1;
        const bLast = bookStats[b.id]?.lastPage || 1;
        return bLast - aLast;
      });
  }, [allBooks, activeTab, searchQuery, sortBy, bookStats]);

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
      {/* Top Header */}
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
                  DigitalBook OS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Interactive English Textbook Library
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
              placeholder="Search books, grades, curricula, lessons..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-800/90 text-white placeholder-slate-400 border border-slate-700 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action buttons (Settings & Help) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Help & Shortcuts"
              aria-label="Help and shortcuts"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Settings & System"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs and Sorting */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 py-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'moeys'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>MoEYS Cambodia</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('grade-7')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'grade-7'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Grade 7
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('grade-8')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'grade-8'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Grade 8
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('grade-9')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'grade-9'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Grade 9
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('self-study')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'self-study'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Self-Study</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs text-slate-400 ml-auto">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-slate-850 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="recent">Recently Opened</option>
              <option value="title">Title (A-Z)</option>
              <option value="progress">Progress (%)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Your Interactive English Library
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              Teach & study directly from interactive digital textbooks
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Equipped with high-resolution textbook pages, authentic listening audio docks, clickable image regions for vocabulary teaching, interactive gap-fills and multiple-choice activities, and classroom projector presentation mode.
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
              We couldn't find any books matching "{searchQuery}".
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
              className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-500 transition-colors"
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
              const stats = bookStats[book.id] || { percent: 0, lastPage: 1 };
              const progressPercent = stats.percent;
              const lastOpenedPage = stats.lastPage;
              const isMenuOpen = menuOpenBookId === book.id;

              return (
                <div
                  key={book.id}
                  className="group bg-slateDark-900/90 hover:bg-slateDark-900 rounded-2xl border border-slate-800 hover:border-sky-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-sky-500/10 flex flex-col overflow-hidden relative"
                >
                  {/* Book Cover Area */}
                  <div
                    onClick={() => onOpenBook(book.id, lastOpenedPage)}
                    className="relative w-full aspect-[3/4] bg-slate-950 overflow-hidden cursor-pointer flex items-center justify-center p-4 group-hover:scale-[1.01] transition-transform duration-300"
                  >
                    <div className="relative w-full h-full max-w-[210px] rounded-r-md rounded-l-sm shadow-2xl overflow-hidden border-r-2 border-b-2 border-slate-900/40 transform group-hover:-translate-y-1 transition-transform duration-300">
                      <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent z-10 pointer-events-none" />

                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover block"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />

                      <div className="absolute top-2.5 right-2.5 z-20">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-950/80 text-white backdrop-blur-md border border-white/20 shadow-md">
                          {book.gradeLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Book Metadata & Progress */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Category & Pages Badge */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            book.category === 'moeys-secondary' ||
                            book.category === 'cambodia-secondary'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {book.category === 'moeys-secondary' ||
                          book.category === 'cambodia-secondary'
                            ? 'MoEYS Cambodia'
                            : 'Oxford Series'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                          {book.totalPages} pp.
                        </span>
                      </div>

                      {/* Title & Subtitle */}
                      <h3
                        onClick={() => onOpenBook(book.id, lastOpenedPage)}
                        className="text-base font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-1 cursor-pointer mb-1"
                        title={book.title}
                      >
                        {book.title}
                      </h3>
                      <p
                        className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4"
                        title={book.subtitle}
                      >
                        {book.subtitle}
                      </p>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div>
                      {/* Activity Progress */}
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
                        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Last opened: Page {lastOpenedPage}</span>
                          </span>
                        </div>
                      </div>

                      {/* Buttons: Continue, Open, More Menu */}
                      <div className="flex items-center gap-2 relative">
                        {lastOpenedPage > 1 ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onOpenBook(book.id, lastOpenedPage)}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-sky-600/20 hover:shadow-sky-600/30 transition-all cursor-pointer"
                              title={`Resume from Page ${lastOpenedPage}`}
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Continue (p.{lastOpenedPage})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenBook(book.id, 1)}
                              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                              title="Start from beginning (Page 1)"
                              aria-label={`Start ${book.title} from beginning`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenBook(book.id, 1)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-sky-600/20 hover:shadow-sky-600/30 transition-all cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Open Book</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setMenuOpenBookId((prev) => (prev === book.id ? null : book.id))
                          }
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                          title="More options"
                          aria-label={`Options for ${book.title}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Overflow Context Menu */}
                        {isMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setMenuOpenBookId(null)}
                            />
                            <div className="absolute right-0 bottom-12 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpenBookId(null);
                                  onOpenBook(book.id, lastOpenedPage);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg flex items-center gap-2.5 transition-colors"
                              >
                                <Play className="w-3.5 h-3.5 text-sky-400" />
                                <span>Continue Reading (p.{lastOpenedPage})</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpenBookId(null);
                                  onOpenBook(book.id, 1);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg flex items-center gap-2.5 transition-colors"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                                <span>Start from Beginning</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpenBookId(null);
                                  setInfoModalBook(book);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg flex items-center gap-2.5 transition-colors"
                              >
                                <Info className="w-3.5 h-3.5 text-sky-400" />
                                <span>Book Information</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadBackup(book)}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg flex items-center gap-2.5 transition-colors"
                              >
                                <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Export Progress Backup</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuOpenBookId(null);
                                  setBookToReset(book);
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 rounded-lg flex items-center gap-2.5 transition-colors mt-0.5"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                                <span>Reset Progress</span>
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

      {/* Book Information Modal */}
      {infoModalBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slateDark-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setInfoModalBook(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">
                  {infoModalBook.title}
                </h3>
                <p className="text-xs text-slate-400">{infoModalBook.subtitle}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 mb-6">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Author:</span>
                <span className="font-semibold text-white text-right max-w-xs">{infoModalBook.author}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Publisher:</span>
                <span className="font-semibold text-white text-right max-w-xs">{infoModalBook.publisher}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">CEFR Level:</span>
                <span className="font-semibold text-white">{infoModalBook.cefrLevel || 'A1-B1'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Total Pages:</span>
                <span className="font-semibold text-white">{infoModalBook.totalPages} pages</span>
              </div>
              <div className="pt-2">
                <span className="text-slate-400 block mb-1">Description:</span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-850 p-3 rounded-xl border border-slate-800">
                  {infoModalBook.description}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setInfoModalBook(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const b = infoModalBook;
                  setInfoModalBook(null);
                  onOpenBook(b.id);
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30"
              >
                Open Book
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Reset Answers */}
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

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slateDark-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">DigitalBook Settings</h3>
                <p className="text-xs text-slate-400">Library & Reader Preferences</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-300 mb-6">
              <div>
                <span className="font-bold text-white block mb-1">Architecture</span>
                <p className="text-[11px] text-slate-400">
                  Universal multi-book content-driven engine. Bookshelf and Reader are generic and content-agnostic.
                </p>
              </div>
              <div>
                <span className="font-bold text-white block mb-1">Storage Status</span>
                <p className="text-[11px] text-slate-400">
                  Local-first scoped storage in browser localStorage & IndexedDB. No backend required.
                </p>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-[11px] text-emerald-400 font-semibold block mb-0.5">
                  Static Deployment:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Base Path: {import.meta.env.BASE_URL} (GitHub Pages compatible)
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slateDark-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">Reader Shortcuts & Tips</h3>
                <p className="text-xs text-slate-400">Classroom & Self-Study Guide</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-300 mb-6 max-h-60 overflow-y-auto">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-850">
                <span className="font-mono text-sky-400 font-bold">Left / Right Arrows</span>
                <span>Previous / Next Page</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-850">
                <span className="font-mono text-sky-400 font-bold">Ctrl + B / Cmd + B</span>
                <span>Bookmark current page</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-850">
                <span className="font-mono text-sky-400 font-bold">Escape</span>
                <span>Close modal, audio player, or presentation</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-850">
                <span className="font-mono text-sky-400 font-bold">Click on textbook images</span>
                <span>Opens full-screen Image Viewer / Lightbox</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-850">
                <span className="font-mono text-sky-400 font-bold">Classroom Presentation Mode</span>
                <span>Maximizes textbook & provides large projector controls</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

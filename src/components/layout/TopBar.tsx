import React, { useState, useEffect } from 'react';
import { PageMeta, ThemeMode, ViewMode } from '../../types';
import { BookManifest } from '../../data/booksRegistry';
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Bookmark,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Coffee,
  Download,
  BookMarked,
  SidebarClose,
  SidebarOpen,
  Check,
  Loader2,
  ArrowLeft,
  Presentation,
  KeyRound,
  X,
} from 'lucide-react';

interface TopBarProps {
  pageMeta: PageMeta;
  currentPage: number;
  totalPages: number;
  saveStatus?: 'saved' | 'saving';
  onPageChange: (page: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  isCleanMode: boolean;
  onToggleCleanMode: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
  onOpenBackupModal: () => void;
  onBackToBookshelf?: () => void;
  bookManifest?: BookManifest;
  isPresentationMode?: boolean;
  onTogglePresentationMode?: () => void;
  showTeacherKey?: boolean;
  onToggleTeacherKey?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  pageMeta,
  currentPage,
  totalPages,
  saveStatus = 'saved',
  onPageChange,
  zoom,
  onZoomChange,
  viewMode,
  onToggleViewMode,
  theme,
  onThemeChange,
  isBookmarked,
  onToggleBookmark,
  isCleanMode,
  onToggleCleanMode,
  isSidebarOpen,
  onToggleSidebar,
  isPanelOpen,
  onTogglePanel,
  onOpenBackupModal,
  onBackToBookshelf,
  bookManifest,
  isPresentationMode = false,
  onTogglePresentationMode,
  showTeacherKey = false,
  onToggleTeacherKey,
}) => {
  const [pageInput, setPageInput] = useState(currentPage.toString());

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(pageInput, 10);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      onPageChange(num);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const cycleTheme = () => {
    if (theme === 'dark') onThemeChange('paper');
    else if (theme === 'paper') onThemeChange('light');
    else onThemeChange('dark');
  };

  const bookTitle = bookManifest?.title || 'English File Pre-Intermediate';
  const gradeLabel = bookManifest?.gradeLabel || 'Student';

  // If in Presentation Mode, render a streamlined Whiteboard / Projection Header
  if (isPresentationMode) {
    return (
      <header className="h-14 bg-slateDark-950 border-b border-amber-500/40 px-3 md:px-6 flex items-center justify-between z-40 select-none shadow-2xl animate-in slide-in-from-top duration-200">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md">
            <Presentation className="w-4 h-4" />
            Classroom Presentation
          </span>
          <span className="text-sm font-bold text-white truncate max-w-xs md:max-w-md">
            {bookTitle} &bull; Page {currentPage}
          </span>
        </div>

        {/* Center Presentation Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-mono text-sm font-bold text-slate-200 px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right Presentation Toggles */}
        <div className="flex items-center gap-2">
          {/* Teacher Answer Key Toggle */}
          {onToggleTeacherKey && (
            <button
              type="button"
              onClick={onToggleTeacherKey}
              className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
                showTeacherKey
                  ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/50'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Show Teacher Answer Key on Projector"
            >
              <KeyRound className="w-4 h-4" />
              <span>{showTeacherKey ? 'Answer Key: ON' : 'Show Answer Key'}</span>
            </button>
          )}

          {/* Exit Presentation Mode */}
          {onTogglePresentationMode && (
            <button
              type="button"
              onClick={onTogglePresentationMode}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Exit Presentation Mode"
            >
              <X className="w-4 h-4" />
              <span>Exit</span>
            </button>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="h-14 bg-slateDark-900 border-b border-slate-800 px-3 md:px-4 flex items-center justify-between z-30 select-none shadow-md">
      {/* Left: Back to Bookshelf & TOC Sidebar Toggle & Title */}
      <div className="flex items-center gap-2 md:gap-3">
        {onBackToBookshelf && (
          <button
            type="button"
            onClick={onBackToBookshelf}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-sky-600/30 text-slate-300 hover:text-white border border-slate-700 hover:border-sky-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            title="Return to Bookshelf Library"
          >
            <ArrowLeft className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Bookshelf</span>
          </button>
        )}

        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
            isSidebarOpen
              ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800 border-transparent'
          }`}
          title="Toggle Table of Contents"
          aria-label="Table of Contents"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 max-w-[170px] sm:max-w-[280px] lg:max-w-[380px]">
          <span
            className="hidden sm:inline-block px-2 py-0.5 text-xs font-bold bg-sky-600 text-white rounded shadow-sm flex-shrink-0 truncate max-w-[140px]"
            title={bookTitle}
          >
            {gradeLabel}
          </span>
          <span
            className="text-xs md:text-sm font-semibold text-slate-200 truncate"
            title={pageMeta.title}
          >
            {pageMeta.title}
          </span>
          <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 ml-1">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                <span className="text-amber-400">Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Saved</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Center: Page Navigation Controls */}
      <div className="flex items-center gap-1 md:gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Previous Page (Left Arrow)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <form
          onSubmit={handlePageSubmit}
          className="flex items-center gap-1.5 text-xs text-slate-300 font-medium select-none"
        >
          <span>Page</span>
          <input
            type="text"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={() => setPageInput(currentPage.toString())}
            className="w-12 py-1 text-center font-mono font-bold bg-slate-800 border border-slate-700 rounded-md text-white outline-none focus:border-sky-500 shadow-inner"
            aria-label="Current Page Number"
          />
          <span className="text-slate-400">of {totalPages}</span>
        </form>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Next Page (Right Arrow)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Right: Tools, Presentation Mode & Toggles */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Presentation Mode Button */}
        {onTogglePresentationMode && (
          <button
            type="button"
            onClick={onTogglePresentationMode}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Classroom Presentation Mode (Whiteboard Projection)"
          >
            <Presentation className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">Presentation</span>
          </button>
        )}

        {/* Zoom controls with presets: 100%, 150%, Fit Width, Fit Page */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
          <button
            onClick={() => onZoomChange(Math.max(50, zoom - 15))}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-300 w-10 text-center">{zoom}%</span>
          <button
            onClick={() => onZoomChange(Math.min(300, zoom + 15))}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => onZoomChange(100)}
            className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
              zoom === 100
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Set Zoom to 100%"
          >
            100%
          </button>
          <button
            onClick={() => onZoomChange(150)}
            className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
              zoom === 150
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Set Zoom to 150%"
          >
            150%
          </button>
          <button
            onClick={() => onZoomChange(140)}
            className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
              zoom === 140
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Fit to Width (140%)"
          >
            Fit Width
          </button>
          <button
            onClick={() => onZoomChange(90)}
            className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
              zoom === 90
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Fit to Page (90%)"
          >
            Fit Page
          </button>
        </div>

        {/* View Mode (Spread vs Single) */}
        <button
          onClick={onToggleViewMode}
          className={`hidden sm:flex p-2 rounded-lg border transition-colors text-xs font-semibold items-center gap-1.5 cursor-pointer ${
            viewMode === 'spread'
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
              : 'text-slate-400 hover:text-white border-transparent'
          }`}
          title="Toggle 2-Page Book Spread"
        >
          <BookMarked className="w-4 h-4" />
          <span className="hidden xl:inline">{viewMode === 'spread' ? '2 Pages' : '1 Page'}</span>
        </button>

        {/* Fullscreen Toggle */}
        <button
          type="button"
          onClick={() => {
            if (typeof document === 'undefined') return;
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Toggle Fullscreen Mode"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Clean Mode */}
        <button
          onClick={onToggleCleanMode}
          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
            isCleanMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'text-slate-400 hover:text-white border-transparent'
          }`}
          title="Clean Mode (Hide typed answers for screen sharing)"
        >
          {isCleanMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {/* Bookmark */}
        <button
          onClick={onToggleBookmark}
          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
            isBookmarked
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              : 'text-slate-400 hover:text-white border-transparent'
          }`}
          title={isBookmarked ? 'Page Bookmarked' : 'Bookmark this page'}
        >
          <Bookmark className="w-4 h-4" />
        </button>

        {/* Theme Cycle */}
        <button
          onClick={cycleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
        >
          {theme === 'dark' && <Moon className="w-4 h-4 text-sky-400" />}
          {theme === 'paper' && <Coffee className="w-4 h-4 text-amber-400" />}
          {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
        </button>

        {/* Backup / Export */}
        <button
          onClick={onOpenBackupModal}
          className="hidden sm:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Backup & Restore Study Progress"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Exercise Panel Toggle */}
        <button
          onClick={onTogglePanel}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
            isPanelOpen
              ? 'bg-sky-600 text-white border-sky-500 shadow-sky-600/20'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700'
          }`}
          title="Toggle Contextual Exercise Panel"
        >
          {isPanelOpen ? (
            <SidebarClose className="w-4 h-4" />
          ) : (
            <SidebarOpen className="w-4 h-4" />
          )}
          <span className="hidden md:inline">Exercises</span>
        </button>
      </div>
    </header>
  );
};

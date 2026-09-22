import React, { useState } from 'react';
import { PageMeta, ThemeMode, ViewMode } from '../../types';
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
} from 'lucide-react';

interface TopBarProps {
  pageMeta: PageMeta;
  currentPage: number;
  totalPages: number;
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
}

export const TopBar: React.FC<TopBarProps> = ({
  pageMeta,
  currentPage,
  totalPages,
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
}) => {
  const [pageInput, setPageInput] = useState(currentPage.toString());

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

  return (
    <header className="h-14 bg-slateDark-900 border-b border-slate-800 px-3 md:px-4 flex items-center justify-between z-30 select-none shadow-md">
      {/* Left: TOC Sidebar Toggle & Title */}
      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg border transition-colors ${
            isSidebarOpen
              ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800 border-transparent'
          }`}
          title="Toggle Table of Contents"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 max-w-[200px] sm:max-w-[320px] lg:max-w-[420px]">
          <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-bold bg-sky-600 text-white rounded shadow-sm">
            English File
          </span>
          <span className="text-xs md:text-sm font-semibold text-slate-200 truncate" title={pageMeta.title}>
            {pageMeta.title}
          </span>
          <span className="hidden md:inline-block text-xs font-mono text-slate-400 flex-shrink-0">
            (Book p.{pageMeta.bookPage})
          </span>
        </div>
      </div>

      {/* Center: Page Navigation Controls */}
      <div className="flex items-center gap-1 md:gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Previous Page (Left Arrow)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <form onSubmit={handlePageSubmit} className="flex items-center gap-1 text-xs">
          <input
            type="text"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={() => setPageInput(currentPage.toString())}
            className="w-11 py-1 text-center font-mono font-bold bg-slate-800 border border-slate-700 rounded text-white outline-none focus:border-sky-500"
          />
          <span className="text-slate-400 font-mono">/ {totalPages}</span>
        </form>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Next Page (Right Arrow)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Right: Tools & Toggles */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Zoom controls */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
          <button
            onClick={() => onZoomChange(Math.max(50, zoom - 15))}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-300 w-10 text-center">
            {zoom}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(250, zoom + 15))}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => onZoomChange(100)}
            className="px-1.5 py-0.5 text-[10px] font-bold text-slate-400 hover:text-white rounded hover:bg-slate-700"
            title="Reset Zoom to 100%"
          >
            1:1
          </button>
        </div>

        {/* View Mode (Spread vs Single) */}
        <button
          onClick={onToggleViewMode}
          className={`hidden sm:flex p-2 rounded-lg border transition-colors text-xs font-semibold items-center gap-1.5 ${
            viewMode === 'spread'
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
              : 'text-slate-400 hover:text-white border-transparent'
          }`}
          title="Toggle 2-Page Book Spread"
        >
          <BookMarked className="w-4 h-4" />
          <span className="hidden xl:inline">{viewMode === 'spread' ? '2 Pages' : '1 Page'}</span>
        </button>

        {/* Clean Mode (Screen Share / Hide Answers) */}
        <button
          onClick={onToggleCleanMode}
          className={`p-2 rounded-lg border transition-colors ${
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
          className={`p-2 rounded-lg border transition-colors ${
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
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
        >
          {theme === 'dark' && <Moon className="w-4 h-4 text-sky-400" />}
          {theme === 'paper' && <Coffee className="w-4 h-4 text-amber-400" />}
          {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
        </button>

        {/* Backup / Export */}
        <button
          onClick={onOpenBackupModal}
          className="hidden sm:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Backup & Restore Study Progress"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Exercise Panel Toggle */}
        <button
          onClick={onTogglePanel}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
            isPanelOpen
              ? 'bg-sky-600 text-white border-sky-500 shadow-sky-600/20'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700'
          }`}
          title="Toggle Contextual Exercise Panel"
        >
          {isPanelOpen ? <SidebarClose className="w-4 h-4" /> : <SidebarOpen className="w-4 h-4" />}
          <span className="hidden md:inline">Exercises</span>
        </button>
      </div>
    </header>
  );
};

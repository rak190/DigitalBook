import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BookOpen, FileEdit } from 'lucide-react';
import { TopBar } from './TopBar';
import { SidebarTOC } from './SidebarTOC';
import { PageView } from '../viewer/PageView';
import { ExercisePanel } from '../panel/ExercisePanel';
import { ActivityWindow } from '../activity/ActivityWindow';
import { AudioPlayer } from '../audio/AudioPlayer';
import { AudioUploadModal } from '../audio/AudioUploadModal';
import { BackupModal } from '../tools/BackupModal';
import { ImageViewer } from '../image-viewer/ImageViewer';
import { useBookProgress } from '../../hooks/useBookProgress';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { dataService } from '../../services/dataService';
import { ThemeMode, ViewMode, ExerciseItem, ImageRegionDefinition } from '../../types';
import { StorageService } from '../../services/storage';
import { getBookManifest, DEFAULT_BOOK_ID } from '../../data/booksRegistry';

interface ReaderShellProps {
  bookId?: string;
  initialPage?: number;
  onBackToBookshelf?: () => void;
}

export const ReaderShell: React.FC<ReaderShellProps> = ({
  bookId: propBookId = DEFAULT_BOOK_ID,
  initialPage,
  onBackToBookshelf,
}) => {
  const activeManifest = useMemo(() => {
    return getBookManifest(propBookId) || getBookManifest(DEFAULT_BOOK_ID)!;
  }, [propBookId]);

  const bookId = activeManifest.id;
  const totalPages = activeManifest.totalPages;

  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (initialPage && initialPage >= 1 && initialPage <= totalPages) {
      return initialPage;
    }
    const saved = StorageService.getBookData(bookId).lastPage;
    if (saved && saved >= 1 && saved <= totalPages) {
      return saved;
    }
    return activeManifest?.initialPage || 1;
  });

  const [zoom, setZoom] = useState<number>(() => StorageService.getZoom());
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [theme, setTheme] = useState<ThemeMode>(() => StorageService.getTheme());
  const [isCleanMode, setIsCleanMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeExerciseId, setActiveExerciseId] = useState<string | undefined>();
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [isActivityDocked, setIsActivityDocked] = useState<boolean>(true);
  const [mobileView, setMobileView] = useState<'book' | 'exercise'>('exercise');
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Full-screen Image Viewer (Lightbox) state
  const [activeImageRegion, setActiveImageRegion] = useState<ImageRegionDefinition | null>(null);

  // Classroom Presentation Mode State
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [showTeacherKey, setShowTeacherKey] = useState(false);

  // Scoped Book Progress State
  const {
    answers,
    completedActivities,
    completeActivity,
    evaluations,
    saveStatus,
    setAnswerValue,
    checkAnswers,
    retryMistakes,
    resetPageAnswers,
    resetAllProgress,
    isBookmarked,
    toggleBookmark,
    reloadFromStorage,
  } = useBookProgress(bookId);

  const audioPlayer = useAudioPlayer();

  // Reset page when bookId changes or initialPage changes
  useEffect(() => {
    const validTarget =
      initialPage && initialPage >= 1 && initialPage <= totalPages
        ? initialPage
        : StorageService.getBookData(bookId).lastPage || activeManifest?.initialPage || 1;
    setCurrentPage(validTarget);
    setActiveActivityId(null);
    setActiveExerciseId(undefined);
    setActiveImageRegion(null);
  }, [bookId, initialPage, totalPages]);

  // Deep linking sync (e.g. #/reader?book=...&page=7)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const parseHash = () => {
      const hash = window.location.hash;
      const pageMatch = hash.match(/(?:page=)(\d+)\b/);
      if (pageMatch && pageMatch[1]) {
        const p = parseInt(pageMatch[1], 10);
        if (p >= 1 && p <= totalPages) {
          setCurrentPage(p);
        }
      }
    };
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, [totalPages]);

  // Handle page changes
  const handlePageChange = useCallback(
    (pageNum: number) => {
      const validPage = Math.max(1, Math.min(pageNum, totalPages));
      setCurrentPage(validPage);
      StorageService.saveBookData(bookId, { lastPage: validPage });
      setActiveExerciseId(undefined);
      if (typeof window !== 'undefined') {
        const newHash = `#/reader?book=${bookId}&page=${validPage}`;
        if (window.location.hash !== newHash) {
          window.history.replaceState(null, '', newHash);
        }
      }
    },
    [bookId, totalPages]
  );

  // Handle zoom changes
  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
    StorageService.saveZoom(newZoom);
  }, []);

  // Handle theme changes
  const handleThemeChange = useCallback((newTheme: ThemeMode) => {
    setTheme(newTheme);
    StorageService.saveTheme(newTheme);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePageChange(currentPage - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handlePageChange(currentPage + 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        handlePageChange(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        handlePageChange(totalPages);
      } else if (e.key === 'Escape') {
        if (activeImageRegion) {
          setActiveImageRegion(null);
        } else if (isPresentationMode) {
          setIsPresentationMode(false);
        } else {
          setIsSidebarOpen(false);
          setActiveActivityId(null);
          audioPlayer.closePlayer();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleBookmark(currentPage);
      } else if (e.key === 'F11') {
        e.preventDefault();
        setIsPresentationMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentPage,
    handlePageChange,
    toggleBookmark,
    audioPlayer,
    isPresentationMode,
    activeImageRegion,
    totalPages,
  ]);

  // Theme application on body
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'paper', 'light');
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.className =
        'bg-slateDark-900 text-slate-100 antialiased selection:bg-sky-500 selection:text-white font-sans overflow-hidden';
    } else if (theme === 'paper') {
      root.classList.add('paper');
      document.body.className =
        'bg-paper-100 text-paper-900 antialiased selection:bg-amber-500 selection:text-white font-sans overflow-hidden';
    } else {
      root.classList.add('light');
      document.body.className =
        'bg-slate-100 text-slate-900 antialiased selection:bg-sky-500 selection:text-white font-sans overflow-hidden';
    }
  }, [theme]);

  // Resolve page meta: from manifest if available, else dataService
  const activePageData = activeManifest.pages[currentPage];
  const pageMeta = useMemo(() => {
    if (activePageData) {
      const uTitle =
        activePageData.unit || activePageData.chapter || activePageData.unitName || 'Unit';
      const lTitle =
        activePageData.lesson ||
        activePageData.lessonName ||
        activePageData.title ||
        `Page ${currentPage}`;
      return {
        pdfPage: currentPage,
        bookPage: activePageData.printedPageNumber || currentPage,
        title: `${uTitle} - ${lTitle}`.replace(/^ - |- $/g, ''),
        unit: null,
        lesson: lTitle,
      };
    }
    return dataService.getPageMeta(currentPage);
  }, [activePageData, currentPage]);

  // Resolve page exercises for contextual panel
  const pageExercises: ExerciseItem[] = useMemo(() => {
    if (activePageData && activePageData.exercises.length > 0) {
      const items: ExerciseItem[] = [];
      activePageData.exercises.forEach((ex) => {
        ex.questions.forEach((q, idx) => {
          const isMc = ex.type === 'multiple-choice';
          items.push({
            id: q.id,
            pageNum: currentPage,
            bookPage: activePageData.printedPageNumber || currentPage,
            label: `${ex.title} (Q${idx + 1})`,
            fieldType: isMc ? 'single_choice' : ex.type === 'open-response' ? 'textarea' : 'text',
            x: 10,
            y: 10 + idx * 8,
            width: 80,
            height: 6,
            placeholder: ex.instructions,
            hint: q.prompt,
            explanation: Array.isArray(q.correctAnswer)
              ? q.correctAnswer.join(', ')
              : q.correctAnswer,
            unitRef: ex.title,
            gradingType: isMc ? 'multiple_choice' : 'normalized',
            acceptedAnswers: Array.isArray(q.correctAnswer)
              ? q.correctAnswer
              : q.correctAnswer
              ? [q.correctAnswer]
              : [],
            options: q.options?.map((opt) => (typeof opt === 'string' ? opt : opt.label)),
            audioTrack: ex.audioTrack,
          });
        });
      });
      return items;
    }
    if (bookId === 'english-file-pre-int') {
      return dataService.getExercisesForPage(currentPage);
    }
    return [];
  }, [activePageData, currentPage, bookId]);

  // Resolve active interactive activity object
  const activeActivity = useMemo(() => {
    if (!activeActivityId) return null;

    // Check page exercises in manifest
    if (activePageData) {
      const found = activePageData.exercises.find((e) => e.id === activeActivityId);
      if (found) return found;
    }

    // Check all pages in manifest
    for (const p of Object.values(activeManifest.pages)) {
      const found = p.exercises.find((e) => e.id === activeActivityId);
      if (found) return found;
    }

    // Fallback to Oxford Activity from dataService
    return dataService.getActivity(activeActivityId);
  }, [activeActivityId, activePageData, activeManifest]);

  // Handle opening an interactive image region
  const handleOpenImage = useCallback(
    (regionId: string) => {
      if (activePageData?.imageRegions) {
        const found = activePageData.imageRegions.find((r) => r.id === regionId);
        if (found) {
          setActiveImageRegion(found);
          return;
        }
      }

      for (const p of Object.values(activeManifest.pages)) {
        if (p.imageRegions) {
          const found = p.imageRegions.find((r) => r.id === regionId);
          if (found) {
            setActiveImageRegion(found);
            return;
          }
        }
      }
    },
    [activePageData, activeManifest]
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Top Navigation Bar */}
      <TopBar
        pageMeta={pageMeta}
        currentPage={currentPage}
        totalPages={totalPages}
        saveStatus={saveStatus}
        onPageChange={handlePageChange}
        zoom={zoom}
        onZoomChange={handleZoomChange}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(viewMode === 'single' ? 'spread' : 'single')}
        theme={theme}
        onThemeChange={handleThemeChange}
        isBookmarked={isBookmarked(currentPage)}
        onToggleBookmark={() => toggleBookmark(currentPage)}
        isCleanMode={isCleanMode}
        onToggleCleanMode={() => setIsCleanMode(!isCleanMode)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isPanelOpen={isPanelOpen}
        onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
        onOpenBackupModal={() => setShowBackupModal(true)}
        onBackToBookshelf={onBackToBookshelf}
        bookManifest={activeManifest}
        isPresentationMode={isPresentationMode}
        onTogglePresentationMode={() => {
          setIsPresentationMode((prev) => !prev);
          if (!isPresentationMode) {
            setIsSidebarOpen(false);
            setIsPanelOpen(false);
          }
        }}
        showTeacherKey={showTeacherKey}
        onToggleTeacherKey={() => setShowTeacherKey((prev) => !prev)}
      />

      {/* Main Content Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Table of Contents Sidebar */}
        {isSidebarOpen && !isPresentationMode && (
          <SidebarTOC
            currentPage={currentPage}
            bookManifest={activeManifest}
            onSelectPage={(pageNum) => {
              handlePageChange(pageNum);
              if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setIsSidebarOpen(false);
              }
            }}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Central Reading Viewport */}
        <div
          className={`flex-1 h-full overflow-hidden transition-all duration-300 flex flex-col ${
            activeActivity && isActivityDocked && !isPresentationMode ? 'lg:mr-[520px]' : ''
          }`}
        >
          <PageView
            currentPage={currentPage}
            viewMode={viewMode}
            zoom={zoom}
            answers={answers}
            completedActivities={completedActivities}
            bookManifest={activeManifest}
            isPresentationMode={isPresentationMode}
            showTeacherKey={showTeacherKey}
            onAnswerChange={(exId, pageId, val) => {
              const exItem = pageExercises.find((e) => e.id === exId);
              setAnswerValue(exId, pageId, exItem?.unitRef || 'Unit', val);
            }}
            onSelectExercise={(id) => {
              setActiveExerciseId(id);
              if (!isPanelOpen) setIsPanelOpen(true);
            }}
            onOpenActivity={(actId) => {
              setActiveActivityId(actId);
              setMobileView('exercise');
              setIsPanelOpen(false);
            }}
            onPlayAudioTrack={(trackId, title) => {
              audioPlayer.playTrack({
                trackId,
                title,
                filename: trackId,
                page: currentPage,
              });
            }}
            onOpenImage={handleOpenImage}
            activeExerciseId={activeExerciseId}
            isCleanMode={isCleanMode}
          />
        </div>

        {/* Oxford / MoEYS Interactive Activity Window */}
        {activeActivity && (
          <ActivityWindow
            activity={activeActivity}
            isOpen={!!activeActivity}
            onClose={() => setActiveActivityId(null)}
            isDocked={isActivityDocked && !isPresentationMode}
            onToggleDocked={() => setIsActivityDocked((prev) => !prev)}
            mobileView={mobileView}
            bookId={bookId}
            currentPage={currentPage}
            isPresentationMode={isPresentationMode}
            showTeacherKey={showTeacherKey}
            onPlayAudioTrack={(trackId, title) => {
              audioPlayer.playTrack({
                trackId,
                title,
                filename: trackId,
                page: currentPage,
              });
            }}
            onCompleteActivity={(actId, progress) => {
              completeActivity(actId, progress);
            }}
          />
        )}

        {/* Contextual Side Exercise Panel */}
        {isPanelOpen && !isPresentationMode && (
          <ExercisePanel
            pageMeta={pageMeta}
            exercises={pageExercises}
            answers={answers}
            evaluations={evaluations}
            onAnswerChange={(exId, val) => {
              const exItem = pageExercises.find((e) => e.id === exId);
              setAnswerValue(exId, currentPage, exItem?.unitRef || 'Unit', val);
            }}
            onCheckAnswers={() => checkAnswers(pageExercises)}
            onRetryMistakes={() => retryMistakes(pageExercises)}
            onResetPage={() => resetPageAnswers(pageExercises)}
            onPlayAudioTrack={(trackId, title) => {
              audioPlayer.playTrack({
                trackId,
                title,
                filename: trackId,
                page: currentPage,
              });
            }}
            onClose={() => setIsPanelOpen(false)}
            activeExerciseId={activeExerciseId}
            onSelectExercise={(id) => setActiveExerciseId(id)}
          />
        )}
      </div>

      {/* Floating Mobile/Tablet Toggle Pill between Book View and Exercise View */}
      {activeActivity && !isPresentationMode && (
        <div
          role="navigation"
          aria-label="Mobile View Switcher"
          className={`lg:hidden fixed left-1/2 -translate-x-1/2 z-50 flex items-center bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-full shadow-2xl p-1 gap-1 transition-all duration-200 ${
            audioPlayer.activeTrack ? 'bottom-24' : 'bottom-6'
          }`}
        >
          <button
            type="button"
            onClick={() => setMobileView('book')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              mobileView === 'book'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Book View</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView('exercise')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              mobileView === 'exercise'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Exercise View</span>
          </button>
        </div>
      )}

      {/* Persistent Docked Audio Player */}
      {audioPlayer.activeTrack && (
        <AudioPlayer
          track={audioPlayer.activeTrack}
          isPlaying={audioPlayer.isPlaying}
          currentTime={audioPlayer.currentTime}
          duration={audioPlayer.duration}
          playbackRate={audioPlayer.playbackRate}
          volume={audioPlayer.volume}
          isMuted={audioPlayer.isMuted}
          onTogglePlay={audioPlayer.togglePlay}
          onSeek={audioPlayer.seek}
          onSkipTime={audioPlayer.skipTime}
          onChangePlaybackRate={audioPlayer.changePlaybackRate}
          onSetVolume={audioPlayer.setVolume}
          onToggleMute={audioPlayer.toggleMute}
          onClose={audioPlayer.closePlayer}
          onOpenUpload={() => audioPlayer.setShowUploadModal(true)}
          onPlaySpeechSynthesis={() =>
            audioPlayer.activeTrack &&
            audioPlayer.playSpeechSynthesis(audioPlayer.activeTrack)
          }
          loopA={audioPlayer.loopA}
          loopB={audioPlayer.loopB}
          isLoopActive={audioPlayer.isLoopActive}
          onSetLoopA={audioPlayer.setLoopPointA}
          onSetLoopB={audioPlayer.setLoopPointB}
          onClearLoop={audioPlayer.clearLoop}
        />
      )}

      {/* Full-Screen Image Viewer (Lightbox) */}
      {activeImageRegion && (
        <ImageViewer
          imageRegion={activeImageRegion}
          allPageRegions={activePageData?.imageRegions || [activeImageRegion]}
          isOpen={!!activeImageRegion}
          onClose={() => setActiveImageRegion(null)}
          onSelectRegion={(reg) => setActiveImageRegion(reg)}
          initialPresentationMode={isPresentationMode}
        />
      )}

      {/* Audio Upload Modal */}
      {audioPlayer.showUploadModal && (
        <AudioUploadModal
          currentTrackId={audioPlayer.activeTrack?.trackId || ''}
          onClose={() => audioPlayer.setShowUploadModal(false)}
          onUploadSuccess={(trkId) => {
            if (audioPlayer.activeTrack) {
              audioPlayer.playTrack({
                ...audioPlayer.activeTrack,
                trackId: trkId,
                filename: trkId,
              });
            }
          }}
        />
      )}

      {/* Backup & Progress Modal */}
      {showBackupModal && (
        <BackupModal
          onClose={() => setShowBackupModal(false)}
          onDataImported={() => reloadFromStorage()}
          onDataReset={() => resetAllProgress()}
        />
      )}
    </div>
  );
};

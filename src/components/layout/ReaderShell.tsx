import React, { useState, useEffect, useCallback } from 'react';
import { TopBar } from './TopBar';
import { SidebarTOC } from './SidebarTOC';
import { PageView } from '../viewer/PageView';
import { ExercisePanel } from '../panel/ExercisePanel';
import { ActivityWindow } from '../activity/ActivityWindow';
import { AudioPlayer } from '../audio/AudioPlayer';
import { AudioUploadModal } from '../audio/AudioUploadModal';
import { BackupModal } from '../tools/BackupModal';
import { useBookProgress } from '../../hooks/useBookProgress';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { dataService } from '../../services/dataService';
import { ThemeMode, ViewMode } from '../../types';
import { StorageService } from '../../services/storage';

export const ReaderShell: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<number>(() => StorageService.getLastPage());
  const [zoom, setZoom] = useState<number>(() => StorageService.getZoom());
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [theme, setTheme] = useState<ThemeMode>(() => StorageService.getTheme());
  const [isCleanMode, setIsCleanMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeExerciseId, setActiveExerciseId] = useState<string | undefined>();
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [completedActivities, setCompletedActivities] = useState<Record<string, boolean>>(() => {
    const all = StorageService.getAllActivityProgress();
    const map: Record<string, boolean> = {};
    Object.entries(all).forEach(([key, val]) => {
      if (val.isCompleted) {
        const parts = key.split('_');
        const actId = parts.slice(2).join('_');
        if (actId) map[actId] = true;
      }
    });
    return map;
  });
  const [showBackupModal, setShowBackupModal] = useState(false);

  const {
    answers,
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
  } = useBookProgress();

  const audioPlayer = useAudioPlayer();

  const pageMeta = dataService.getPageMeta(currentPage);
  const pageExercises = dataService.getExercisesForPage(currentPage);
  const totalPages = 169;

  // Sync URL hash for deep linking (e.g. #page=7)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const parseHash = () => {
      const match = window.location.hash.match(/(?:page=|\b)(\d+)\b/);
      if (match && match[1]) {
        const p = parseInt(match[1], 10);
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
  const handlePageChange = useCallback((pageNum: number) => {
    const validPage = Math.max(1, Math.min(pageNum, totalPages));
    setCurrentPage(validPage);
    StorageService.saveLastPage(validPage);
    setActiveExerciseId(undefined);
    if (typeof window !== 'undefined' && window.location.hash !== `#page=${validPage}`) {
      window.history.replaceState(null, '', `#page=${validPage}`);
    }
  }, [totalPages]);

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
      // Ignore if user is currently typing in an input or textarea
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
      } else if (e.key === 'Escape') {
        setIsSidebarOpen(false);
        audioPlayer.closePlayer();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleBookmark(currentPage);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, handlePageChange, toggleBookmark, audioPlayer]);

  // Theme application on body
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'paper', 'light');
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.className = 'bg-slateDark-900 text-slate-100 antialiased selection:bg-sky-500 selection:text-white font-sans overflow-hidden';
    } else if (theme === 'paper') {
      root.classList.add('paper');
      document.body.className = 'bg-paper-100 text-paper-900 antialiased selection:bg-amber-500 selection:text-white font-sans overflow-hidden';
    } else {
      root.classList.add('light');
      document.body.className = 'bg-slate-100 text-slate-900 antialiased selection:bg-sky-500 selection:text-white font-sans overflow-hidden';
    }
  }, [theme]);

  const activeActivity = activeActivityId ? dataService.getActivity(activeActivityId) : null;

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
      />

      {/* Main Content Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Table of Contents Sidebar */}
        {isSidebarOpen && (
          <SidebarTOC
            units={dataService.getUnits()}
            referenceSections={dataService.getReferenceSections()}
            currentPage={currentPage}
            onSelectPage={(pageNum) => {
              handlePageChange(pageNum);
              // Auto-close on mobile
              if (typeof window !== 'undefined' && window.innerWidth < 768) setIsSidebarOpen(false);
            }}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Central Reading Viewport */}
        <PageView
          currentPage={currentPage}
          viewMode={viewMode}
          zoom={zoom}
          answers={answers}
          completedActivities={completedActivities}
          onAnswerChange={(exId, pageId, val) => {
            const exItem = pageExercises.find(e => e.id === exId);
            setAnswerValue(exId, pageId, exItem?.unitRef || 'Unit', val);
          }}
          onSelectExercise={(id) => {
            setActiveExerciseId(id);
            if (!isPanelOpen) setIsPanelOpen(true);
          }}
          onOpenActivity={(actId) => {
            setActiveActivityId(actId);
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
          activeExerciseId={activeExerciseId}
          isCleanMode={isCleanMode}
        />

        {/* Oxford-Style Interactive Activity Window (Split Drawer or Floating Modal) */}
        {activeActivity && (
          <ActivityWindow
            activity={activeActivity}
            isOpen={!!activeActivity}
            onClose={() => setActiveActivityId(null)}
            onPlayAudioTrack={(trackId, title) => {
              audioPlayer.playTrack({
                trackId,
                title,
                filename: trackId,
                page: currentPage,
              });
            }}
            onCompleteActivity={(actId) => {
              setCompletedActivities(prev => ({ ...prev, [actId]: true }));
            }}
          />
        )}

        {/* Contextual Side Exercise Panel */}
        {isPanelOpen && (
          <ExercisePanel
            pageMeta={pageMeta}
            exercises={pageExercises}
            answers={answers}
            evaluations={evaluations}
            onAnswerChange={(exId, val) => {
              const exItem = pageExercises.find(e => e.id === exId);
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

      {/* Persistent Docked Audio Player */}
      {audioPlayer.activeTrack && (
        <AudioPlayer
          track={audioPlayer.activeTrack}
          isPlaying={audioPlayer.isPlaying}
          currentTime={audioPlayer.currentTime}
          duration={audioPlayer.duration}
          playbackRate={audioPlayer.playbackRate}
          onTogglePlay={audioPlayer.togglePlay}
          onSeek={audioPlayer.seek}
          onSkipTime={audioPlayer.skipTime}
          onChangePlaybackRate={audioPlayer.changePlaybackRate}
          onClose={audioPlayer.closePlayer}
          onOpenUpload={() => audioPlayer.setShowUploadModal(true)}
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

import React, { useRef, useState, useEffect } from 'react';
import { PageOverlay } from './PageOverlay';
import { ExerciseItem, ExerciseAnswer, ViewMode, ActivityHotspot } from '../../types';
import { dataService } from '../../services/dataService';
import { PageService } from '../../services/pageService';
import { BookManifest, PageData } from '../../data/booksRegistry';
import { BookOpen, AlertCircle } from 'lucide-react';

interface PageViewProps {
  currentPage: number;
  viewMode: ViewMode;
  zoom: number;
  answers: Record<string, ExerciseAnswer>;
  completedActivities?: Record<string, boolean>;
  onAnswerChange: (exerciseId: string, pageId: number, value: string) => void;
  onSelectExercise?: (exerciseId: string) => void;
  onOpenActivity?: (activityId: string) => void;
  onPlayAudioTrack?: (trackId: string, title: string) => void;
  onOpenImage?: (regionId: string) => void;
  activeExerciseId?: string;
  isCleanMode?: boolean;
  bookManifest?: BookManifest;
  isPresentationMode?: boolean;
  showTeacherKey?: boolean;
}

export const PageView: React.FC<PageViewProps> = ({
  currentPage,
  viewMode,
  zoom,
  answers,
  completedActivities = {},
  onAnswerChange,
  onSelectExercise,
  onOpenActivity,
  onPlayAudioTrack,
  onOpenImage,
  activeExerciseId,
  isCleanMode = false,
  bookManifest,
  isPresentationMode = false,
  showTeacherKey = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const activeBookId = bookManifest?.id || 'english-file-pre-int';

  // Preload adjacent pages whenever current page changes
  useEffect(() => {
    PageService.preloadNearbyPages(activeBookId, currentPage);
  }, [activeBookId, currentPage]);

  const handleImageError = (pageNum: number) => {
    setImageErrors((prev) => ({ ...prev, [pageNum]: true }));
  };

  const leftPageNum =
    viewMode === 'spread' && currentPage % 2 === 0 ? currentPage - 1 : currentPage;
  const rightPageNum = viewMode === 'spread' ? leftPageNum + 1 : null;

  // Resolve page data from manifest if present
  const getPageData = (pageNum: number): PageData | undefined => {
    return bookManifest?.pages?.[pageNum];
  };

  const leftPageData = getPageData(leftPageNum);
  const rightPageData = rightPageNum ? getPageData(rightPageNum) : undefined;

  const leftPageMeta = dataService.getPageMeta(leftPageNum);
  const rightPageMeta = rightPageNum ? dataService.getPageMeta(rightPageNum) : null;

  // Build hotspots for a page
  const resolveHotspots = (pageNum: number, pData?: PageData): ActivityHotspot[] => {
    if (pData && pData.hotspots && pData.hotspots.length > 0) {
      return pData.hotspots.map((h) => ({
        id: h.id,
        type: (h.type === 'exercise' ? 'activity' : h.type) as any,
        label: h.badgeLabel,
        title:
          h.title ||
          `${h.badgeLabel}: ${
            h.type === 'audio'
              ? `Audio Track ${h.audioTrack}`
              : h.type === 'image'
              ? 'View Image'
              : 'Interactive Activity'
          }`,
        x: h.xPercent,
        y: h.yPercent,
        activityId: h.exerciseId || h.targetId,
        audioTrackId: h.audioTrack || h.targetId,
        imageRegionId: h.imageRegionId || h.targetId,
      }));
    }
    // Fallback to legacy dataService if bookManifest is undefined
    if (!bookManifest) {
      return dataService.getHotspotsForPage(pageNum);
    }
    return [];
  };

  // Build teacher answers map for whiteboard display
  const resolveTeacherAnswers = (pData?: PageData, pageNum?: number): Record<string, string> => {
    const map: Record<string, string> = {};
    if (pData && pData.exercises) {
      pData.exercises.forEach((ex) => {
        const answersList = ex.questions
          .map((q) => (Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer))
          .filter(Boolean);
        if (answersList.length > 0) {
          map[ex.id] = answersList.slice(0, 3).join(', ') + (answersList.length > 3 ? '...' : '');
        }
      });
    }
    // Also resolve from dataService if manifest is not provided
    if (!bookManifest && pageNum) {
      const pageExs = dataService.getExercisesForPage(pageNum);
      pageExs.forEach((ex) => {
        const accepted = dataService.getAcceptedAnswers(ex.id);
        if (accepted.length > 0 && !map[ex.id]) {
          map[ex.id] = accepted.slice(0, 2).join(', ');
        }
      });
      const hotspots = dataService.getHotspotsForPage(pageNum);
      hotspots.forEach((h) => {
        if (h.activityId && !map[h.activityId]) {
          const act = dataService.getActivity(h.activityId);
          if (act) {
            if (act.type === 'multiple-choice' && act.questions) {
              const answers = act.questions.map((q) => q.correct).slice(0, 3).join(', ');
              if (answers) map[h.activityId] = answers;
            } else if (act.type === 'gap-fill' && act.blanks) {
              const answers = Object.values(act.blanks).map((b) => b.accepted[0]).slice(0, 3).join(', ');
              if (answers) map[h.activityId] = answers;
            }
          }
        }
      });
    }
    return map;
  };

  const resolveImageSrc = (pageNum: number, pData?: PageData): string => {
    if (pData?.image) return pData.image;
    if (pData?.imageSrc) return pData.imageSrc;
    return PageService.resolvePageImageSrc(activeBookId, pageNum);
  };

  const renderPageContent = (
    pageNum: number,
    pData?: PageData
  ) => {
    const isError = imageErrors[pageNum];
    const imageSrc = resolveImageSrc(pageNum, pData);
    const hotspots = resolveHotspots(pageNum, pData);
    const teacherAnswers = resolveTeacherAnswers(pData, pageNum);

    const titleText = pData
      ? `${pData.unit || pData.unitName || ''} - ${pData.lesson || pData.lessonName || pData.title || ''}`.replace(/^ - |- $/g, '')
      : `Page ${pageNum}`;

    return (
      <div
        className="relative bg-white shadow-2xl rounded-sm overflow-hidden select-none transition-all duration-200"
        style={{
          width: '100%',
          maxWidth: viewMode === 'spread' ? '700px' : '950px',
        }}
      >
        {isError ? (
          <div className="w-full aspect-[1/1.4] bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-8 text-center">
            {!pData ? (
              <>
                <BookOpen className="w-14 h-14 text-slate-600 mb-4" />
                <h3 className="text-base font-semibold text-slate-300 mb-2">Page Not Yet Digitized</h3>
                <p className="text-sm text-slate-500 max-w-xs">
                  Page {pageNum} has not been added to the digital edition yet. Please refer to your physical textbook for this page.
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
                <h3 className="text-sm font-bold text-white mb-1">Page Image Unavailable</h3>
                <p className="text-xs text-slate-400 max-w-xs mb-3">
                  Unable to load the image for {titleText}.
                </p>
                <span className="text-[10px] font-mono text-slate-600">
                  {imageSrc}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="relative w-full">
            <img
              src={imageSrc}
              alt={titleText}
              onError={() => handleImageError(pageNum)}
              className="w-full h-auto block select-none pointer-events-none"
              loading="eager"
            />

            {/* Hotspots & Clickable Image Regions Overlay */}
            {!isCleanMode && (
              <PageOverlay
                pageNum={pageNum}
                hotspots={hotspots}
                imageRegions={pData?.imageRegions}
                completedActivities={completedActivities}
                onOpenActivity={onOpenActivity}
                onPlayAudioTrack={onPlayAudioTrack}
                onOpenImage={onOpenImage}
                isPresentationMode={isPresentationMode}
                showTeacherKey={showTeacherKey}
                teacherAnswers={teacherAnswers}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Textbook Page Canvas"
      className="flex-1 w-full h-full overflow-auto bg-slateDark-950 p-4 md:p-8 flex items-start justify-center relative select-none"
    >
      <div
        className="transition-transform duration-150 origin-top flex items-start justify-center gap-4"
        style={{
          transform: `scale(${zoom / 100})`,
          width: viewMode === 'spread' ? '100%' : 'auto',
          maxWidth: viewMode === 'spread' ? '1500px' : '980px',
        }}
      >
        {/* Left Page (or Single Page) */}
        <div className="flex-1 flex justify-center">
          {renderPageContent(leftPageNum, leftPageData)}
        </div>

        {/* Right Page (Spread View Mode) */}
        {viewMode === 'spread' && rightPageNum && rightPageNum <= (bookManifest?.totalPages || 250) && (
          <div className="flex-1 flex justify-center">
            {renderPageContent(rightPageNum, rightPageData)}
          </div>
        )}
      </div>
    </div>
  );
};

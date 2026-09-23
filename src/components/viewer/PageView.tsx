import React, { useRef, useState } from 'react';
import { PageOverlay } from './PageOverlay';
import { PageMeta, ExerciseItem, ExerciseAnswer, ViewMode, ActivityHotspot } from '../../types';
import { dataService } from '../../services/dataService';
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
  activeExerciseId,
  isCleanMode = false,
  bookManifest,
  isPresentationMode = false,
  showTeacherKey = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

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

  const leftExercises = dataService.getExercisesForPage(leftPageNum);
  const rightExercises = rightPageNum ? dataService.getExercisesForPage(rightPageNum) : [];

  const leftPageMeta = dataService.getPageMeta(leftPageNum);
  const rightPageMeta = rightPageNum ? dataService.getPageMeta(rightPageNum) : null;

  // Build hotspots for a page
  const resolveHotspots = (pageNum: number, pData?: PageData): ActivityHotspot[] => {
    if (pData && pData.hotspots && pData.hotspots.length > 0) {
      return pData.hotspots.map((h) => ({
        id: h.id,
        type: h.type,
        label: h.badgeLabel,
        title: `${h.badgeLabel}: ${
          h.type === 'audio' ? `Audio Track ${h.audioTrack}` : 'Interactive Activity'
        }`,
        x: h.xPercent,
        y: h.yPercent,
        activityId: h.exerciseId,
        audioTrackId: h.audioTrack,
      }));
    }
    // Fallback to dataService if english-file
    if (!bookManifest || bookManifest.id === 'english-file-pre-int') {
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
    // Also resolve from dataService if english-file
    if ((!bookManifest || bookManifest.id === 'english-file-pre-int') && pageNum) {
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
    if (pData?.imageSrc) return pData.imageSrc;

    const base = import.meta.env.BASE_URL || '/';

    // If English File, default to book_pages/page_${pageNum}.jpg
    if (!bookManifest || bookManifest.id === 'english-file-pre-int') {
      return `${base}book_pages/page_${pageNum}.jpg`;
    }

    // MoEYS grade check
    let grade = 7;
    if (bookManifest.id.includes('8')) grade = 8;
    else if (bookManifest.id.includes('9')) grade = 9;

    return `${base}moeys_pages/g${grade}_p${pageNum}.jpg`;
  };

  const renderPageContent = (
    pageNum: number,
    pageMeta: PageMeta | null,
    exercises: ExerciseItem[],
    pData?: PageData
  ) => {
    const isError = imageErrors[pageNum];
    const imageSrc = resolveImageSrc(pageNum, pData);
    const hotspots = resolveHotspots(pageNum, pData);
    const teacherAnswers = resolveTeacherAnswers(pData, pageNum);

    const titleText = pData
      ? `${pData.unitName} - ${pData.lessonName}`
      : pageMeta?.title || `Page ${pageNum}`;

    return (
      <div className="relative shadow-2xl rounded-sm bg-white flex-shrink-0 select-none border border-slate-700/30 min-w-[320px]">
        {isError ? (
          <div className="w-[580px] h-[820px] bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 p-8 flex flex-col justify-between select-text relative border border-slate-200">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                <div className="flex items-center gap-2 text-sky-700 font-bold text-sm tracking-wide uppercase">
                  <BookOpen className="w-5 h-5 text-sky-600" />
                  <span>{bookManifest?.title || 'Interactive Textbook'}</span>
                </div>
                <span className="px-2.5 py-1 bg-sky-600 text-white rounded text-xs font-bold font-mono">
                  Page {pageNum}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">{titleText}</h2>

              {pData?.unitName && (
                <p className="text-sm font-semibold text-sky-600 mb-4">{pData.lessonName}</p>
              )}

              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-6 text-sm text-sky-900">
                <div className="font-semibold flex items-center gap-1.5 mb-1 text-sky-800">
                  <AlertCircle className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <span>Digital Classroom Activity View</span>
                </div>
                <p className="text-xs text-sky-700 leading-relaxed">
                  Interactive self-check exercises and listening badges are configured for this page. Use the interactive badges or open the side drawer to answer questions.
                </p>
              </div>

              {pData && pData.exercises.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Available Page Activities ({pData.exercises.length})
                  </h3>
                  <div className="space-y-2">
                    {pData.exercises.map((ex) => (
                      <div
                        key={ex.id}
                        onClick={() => onOpenActivity && onOpenActivity(ex.id)}
                        className="cursor-pointer p-3 rounded-lg bg-white border border-slate-200 hover:border-sky-400 hover:shadow-sm transition-all flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-slate-800">{ex.title}</span>
                        <span className="text-[10px] uppercase font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {ex.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center text-[11px] text-slate-400 pt-4 border-t border-slate-200">
              {bookManifest?.subtitle || 'Digital Library Platform'} &bull; Interactive Edition
            </div>
          </div>
        ) : (
          <img
            src={imageSrc}
            alt={titleText}
            className={`w-auto h-auto object-contain block pointer-events-none ${
              isPresentationMode ? 'max-h-[92vh] max-w-[95vw]' : 'max-h-[85vh] max-w-[85vw]'
            }`}
            loading="eager"
            onError={() => handleImageError(pageNum)}
          />
        )}

        <PageOverlay
          pageNum={pageNum}
          hotspots={hotspots}
          completedActivities={completedActivities}
          onOpenActivity={onOpenActivity}
          onPlayAudioTrack={onPlayAudioTrack}
          isPresentationMode={isPresentationMode}
          showTeacherKey={showTeacherKey}
          teacherAnswers={teacherAnswers}
        />
      </div>
    );
  };

  const totalPages = bookManifest?.totalPages || 168;

  return (
    <div
      ref={containerRef}
      className={`flex-1 h-full overflow-auto flex items-start justify-center relative ${
        isPresentationMode ? 'p-2 md:p-4 bg-black/90' : 'p-4 md:p-8 bg-slateDark-950/80'
      }`}
    >
      <div
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
          transition: 'transform 0.15s ease-out',
        }}
        className="flex items-start justify-center gap-4 max-w-full my-auto"
      >
        {/* Left Page (or Single Page) */}
        {renderPageContent(leftPageNum, leftPageMeta, leftExercises, leftPageData)}

        {/* Right Page (Only in Spread Mode) */}
        {rightPageNum && rightPageNum <= totalPages && (
          renderPageContent(rightPageNum, rightPageMeta, rightExercises, rightPageData)
        )}
      </div>
    </div>
  );
};

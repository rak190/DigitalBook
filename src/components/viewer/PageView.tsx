import React, { useRef, useState } from 'react';
import { PageOverlay } from './PageOverlay';
import { PageMeta, ExerciseItem, ExerciseAnswer, ViewMode } from '../../types';
import { dataService } from '../../services/dataService';
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
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  const handleImageError = (pageNum: number) => {
    setImageErrors(prev => ({ ...prev, [pageNum]: true }));
  };

  const leftPageNum = viewMode === 'spread' && currentPage % 2 === 0 ? currentPage - 1 : currentPage;
  const rightPageNum = viewMode === 'spread' ? leftPageNum + 1 : null;

  const leftExercises = dataService.getExercisesForPage(leftPageNum);
  const rightExercises = rightPageNum ? dataService.getExercisesForPage(rightPageNum) : [];

  const leftPageMeta = dataService.getPageMeta(leftPageNum);
  const rightPageMeta = rightPageNum ? dataService.getPageMeta(rightPageNum) : null;

  const renderPageContent = (
    pageNum: number,
    pageMeta: PageMeta | null,
    exercises: ExerciseItem[]
  ) => {
    const isError = imageErrors[pageNum];

    return (
      <div className="relative shadow-2xl rounded-sm bg-white overflow-hidden flex-shrink-0 select-none border border-slate-700/30 min-w-[320px]">
        {isError ? (
          <div className="w-[580px] h-[820px] bg-gradient-to-b from-slate-50 to-slate-100 text-slate-800 p-8 flex flex-col justify-between select-text relative border border-slate-200">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                <div className="flex items-center gap-2 text-oxfordBlue-700 font-bold text-sm tracking-wide uppercase">
                  <BookOpen className="w-5 h-5 text-oxfordBlue-600" />
                  <span>English File 4th Edition &bull; Pre-Intermediate</span>
                </div>
                <span className="px-2.5 py-1 bg-oxfordBlue-600 text-white rounded text-xs font-bold">
                  Page {pageNum}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {pageMeta?.title || `Page ${pageNum}`}
              </h2>
              {pageMeta?.unit && (
                <p className="text-sm font-semibold text-oxfordBlue-600 mb-4">
                  {pageMeta.unit} {pageMeta.lesson ? `&bull; ${pageMeta.lesson}` : ''}
                </p>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-900">
                <div className="font-semibold flex items-center gap-1.5 mb-1 text-blue-800">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Interactive Self-Study Page</span>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Interactive exercises and listening badges are available for this page. Use the interactive overlays or click any exercise in the right workbook panel to answer questions.
                </p>
              </div>

              {exercises.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Available Page Exercises ({exercises.length})
                  </h3>
                  <div className="space-y-2">
                    {exercises.slice(0, 5).map(ex => (
                      <div
                        key={ex.id}
                        onClick={() => onSelectExercise && onSelectExercise(ex.id)}
                        className="cursor-pointer p-3 rounded bg-white border border-slate-200 hover:border-oxfordBlue-400 hover:shadow-sm transition-all flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-slate-800">{ex.label || `Exercise ${ex.id}`}</span>
                        <span className="text-[10px] uppercase font-bold text-oxfordBlue-600 bg-oxfordBlue-50 px-2 py-0.5 rounded">
                          {ex.fieldType}
                        </span>
                      </div>
                    ))}
                    {exercises.length > 5 && (
                      <p className="text-xs text-slate-500 italic text-center pt-1">
                        + {exercises.length - 5} more in exercise panel
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center text-[11px] text-slate-400 pt-4 border-t border-slate-200">
              Oxford University Press &bull; Interactive Digital Workbook
            </div>
          </div>
        ) : (
          <img
            src={`${import.meta.env.BASE_URL}book_pages/page_${pageNum}.jpg`}
            alt={pageMeta?.title || `Page ${pageNum}`}
            className="w-auto h-auto max-h-[85vh] max-w-[85vw] object-contain block pointer-events-none"
            loading="eager"
            onError={() => handleImageError(pageNum)}
          />
        )}

        <PageOverlay
          pageNum={pageNum}
          completedActivities={completedActivities}
          onOpenActivity={onOpenActivity}
          onPlayAudioTrack={onPlayAudioTrack}
        />
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full overflow-auto flex items-start justify-center p-4 md:p-8 bg-slateDark-950/80 relative"
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
        {renderPageContent(leftPageNum, leftPageMeta, leftExercises)}

        {/* Right Page (Only in Spread Mode) */}
        {rightPageNum && rightPageNum <= 169 && (
          renderPageContent(rightPageNum, rightPageMeta, rightExercises)
        )}
      </div>
    </div>
  );
};

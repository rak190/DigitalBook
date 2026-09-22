import React, { useRef } from 'react';
import { PageOverlay } from './PageOverlay';
import { PageMeta, ExerciseItem, ExerciseAnswer, ViewMode } from '../../types';
import { dataService } from '../../services/dataService';

interface PageViewProps {
  currentPage: number;
  viewMode: ViewMode;
  zoom: number;
  answers: Record<string, ExerciseAnswer>;
  onAnswerChange: (exerciseId: string, pageId: number, value: string) => void;
  onSelectExercise?: (exerciseId: string) => void;
  activeExerciseId?: string;
  isCleanMode?: boolean;
}

export const PageView: React.FC<PageViewProps> = ({
  currentPage,
  viewMode,
  zoom,
  answers,
  onAnswerChange,
  onSelectExercise,
  activeExerciseId,
  isCleanMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const leftPageNum = viewMode === 'spread' && currentPage % 2 === 0 ? currentPage - 1 : currentPage;
  const rightPageNum = viewMode === 'spread' ? leftPageNum + 1 : null;

  const leftExercises = dataService.getExercisesForPage(leftPageNum);
  const rightExercises = rightPageNum ? dataService.getExercisesForPage(rightPageNum) : [];

  const leftPageMeta = dataService.getPageMeta(leftPageNum);
  const rightPageMeta = rightPageNum ? dataService.getPageMeta(rightPageNum) : null;

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
        <div className="relative shadow-2xl rounded-sm bg-white overflow-hidden flex-shrink-0 select-none border border-slate-700/30">
          <img
            src={`/book_pages/page_${leftPageNum}.jpg`}
            alt={leftPageMeta.title}
            className="w-auto h-auto max-h-[85vh] max-w-[85vw] object-contain block pointer-events-none"
            loading="eager"
          />
          <PageOverlay
            exercises={leftExercises}
            answers={answers}
            onAnswerChange={(exId, val) => onAnswerChange(exId, leftPageNum, val)}
            onSelectExercise={onSelectExercise}
            activeExerciseId={activeExerciseId}
            isCleanMode={isCleanMode}
          />
        </div>

        {/* Right Page (Only in Spread Mode) */}
        {rightPageNum && rightPageNum <= 169 && (
          <div className="relative shadow-2xl rounded-sm bg-white overflow-hidden flex-shrink-0 select-none border border-slate-700/30">
            <img
              src={`/book_pages/page_${rightPageNum}.jpg`}
              alt={rightPageMeta?.title || `Page ${rightPageNum}`}
              className="w-auto h-auto max-h-[85vh] max-w-[85vw] object-contain block pointer-events-none"
              loading="eager"
            />
            <PageOverlay
              exercises={rightExercises}
              answers={answers}
              onAnswerChange={(exId, val) => onAnswerChange(exId, rightPageNum, val)}
              onSelectExercise={onSelectExercise}
              activeExerciseId={activeExerciseId}
              isCleanMode={isCleanMode}
            />
          </div>
        )}
      </div>
    </div>
  );
};

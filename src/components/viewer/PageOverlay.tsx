import React from 'react';
import { ExerciseItem, ExerciseAnswer } from '../../types';

interface PageOverlayProps {
  exercises: ExerciseItem[];
  answers: Record<string, ExerciseAnswer>;
  onAnswerChange: (exerciseId: string, value: string) => void;
  onSelectExercise?: (exerciseId: string) => void;
  onPlayAudioTrack?: (trackId: string, title: string) => void;
  activeExerciseId?: string;
  isCleanMode?: boolean; // Screen sharing mode to hide answers
}

export const PageOverlay: React.FC<PageOverlayProps> = ({
  exercises,
  answers,
  onAnswerChange,
  onSelectExercise,
  onPlayAudioTrack,
  activeExerciseId,
  isCleanMode = false,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {exercises.map((ex) => {
        const userValue = answers[ex.id]?.value || '';
        const displayVal = typeof userValue === 'string' ? userValue : '';
        const isActive = activeExerciseId === ex.id;

        return (
          <div
            key={ex.id}
            style={{
              position: 'absolute',
              left: `${ex.x}%`,
              top: `${ex.y}%`,
              width: `${ex.width}%`,
              height: `${Math.max(ex.height, 2.2)}%`,
            }}
            className="pointer-events-auto group"
            onClick={() => onSelectExercise && onSelectExercise(ex.id)}
          >
            <input
              type="text"
              id={`overlay-input-${ex.id}`}
              value={isCleanMode ? '' : displayVal}
              onChange={(e) => onAnswerChange(ex.id, e.target.value)}
              placeholder={ex.placeholder || ''}
              autoComplete="off"
              spellCheck={false}
              className={`w-full h-full px-1 text-[13px] font-semibold text-sky-900 bg-sky-100/60 hover:bg-sky-100/90 border rounded transition-all duration-150 outline-none leading-none shadow-sm ${
                isActive
                  ? 'border-sky-500 ring-2 ring-sky-500/40 bg-white/95'
                  : 'border-sky-400/50 hover:border-sky-500'
              }`}
            />
            {/* Subtle label tooltip on hover */}
            <span className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-5 left-0 px-1.5 py-0.5 text-[10px] font-bold bg-slate-900/90 text-sky-300 rounded shadow transition-opacity duration-150 whitespace-nowrap z-20">
              {ex.label}
            </span>

            {/* Direct on-page audio trigger badge */}
            {ex.audioTrack && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayAudioTrack && onPlayAudioTrack(ex.audioTrack!, `Track ${ex.audioTrack}`);
                }}
                className="absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow transition-transform hover:scale-110 z-20 cursor-pointer"
                title={`Listen to Audio Track ${ex.audioTrack}`}
              >
                🎧
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

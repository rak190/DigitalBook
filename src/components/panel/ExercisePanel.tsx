import React, { useState } from 'react';
import { PageMeta, ExerciseItem, ExerciseAnswer, AnswerEvaluation } from '../../types';
import { GapFillInput } from '../exercises/GapFillInput';
import { SingleChoice } from '../exercises/SingleChoice';
import { FreeResponseArea } from '../exercises/FreeResponseArea';
import { MatchingExercise } from '../exercises/MatchingExercise';
import { CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, Volume2, Sparkles, X } from 'lucide-react';

interface ExercisePanelProps {
  pageMeta: PageMeta;
  exercises: ExerciseItem[];
  answers: Record<string, ExerciseAnswer>;
  evaluations: Record<string, AnswerEvaluation>;
  onAnswerChange: (exerciseId: string, value: string) => void;
  onCheckAnswers: () => void;
  onResetPage: () => void;
  onPlayAudioTrack?: (trackId: string, title: string) => void;
  onClose: () => void;
  activeExerciseId?: string;
  onSelectExercise: (id: string) => void;
}

export const ExercisePanel: React.FC<ExercisePanelProps> = ({
  pageMeta,
  exercises,
  answers,
  evaluations,
  onAnswerChange,
  onCheckAnswers,
  onResetPage,
  onPlayAudioTrack,
  onClose,
  activeExerciseId,
  onSelectExercise,
}) => {
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Group exercises by unitRef or section
  const hasEvaluations = Object.keys(evaluations).length > 0;
  const autoGradedEvals = Object.values(evaluations).filter(e => !e.isSelfCheck);
  const correctCount = autoGradedEvals.filter(e => e.isCorrect).length;
  const totalAutoGraded = autoGradedEvals.length;
  const scorePercent = totalAutoGraded > 0 ? Math.round((correctCount / totalAutoGraded) * 100) : null;

  return (
    <aside className="w-80 md:w-96 bg-slateDark-900 border-l border-slate-800 flex flex-col h-full shadow-2xl z-20 flex-shrink-0 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slateDark-950/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
              {pageMeta.unit ? `Unit ${pageMeta.unit}` : 'Reference'}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Book p.{pageMeta.bookPage}
            </span>
          </div>
          <h2 className="text-sm font-bold text-white mt-1 line-clamp-1">
            {pageMeta.title}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Focus Overview (Grammar / Vocabulary / Audio badges) */}
      {(pageMeta.grammar || pageMeta.vocabulary || (pageMeta.audioTracks && pageMeta.audioTracks.length > 0)) && (
        <div className="px-4 py-3 bg-slate-850/40 border-b border-slate-800/80 text-xs space-y-1.5">
          {pageMeta.grammar && (
            <div className="flex items-start gap-1.5 text-slate-300">
              <span className="font-semibold text-sky-400">Grammar:</span>
              <span>{pageMeta.grammar}</span>
            </div>
          )}
          {pageMeta.vocabulary && (
            <div className="flex items-start gap-1.5 text-slate-300">
              <span className="font-semibold text-amber-400">Vocab:</span>
              <span>{pageMeta.vocabulary}</span>
            </div>
          )}
          {pageMeta.audioTracks && pageMeta.audioTracks.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-slate-400 font-medium">Audio:</span>
              {pageMeta.audioTracks.map((trk, i) => (
                <button
                  key={i}
                  onClick={() => onPlayAudioTrack && onPlayAudioTrack(trk, `Track ${trk}`)}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 flex items-center gap-1"
                >
                  <Volume2 className="w-3 h-3" />
                  {trk}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Score Summary Card (Shown when checked) */}
      {hasEvaluations && (
        <div className="p-3 mx-4 my-3 rounded-xl border bg-slate-800/80 border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${
                scorePercent !== null && scorePercent >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white">Evaluation Result</span>
                <p className="text-[11px] text-slate-400">
                  {totalAutoGraded > 0 ? `${correctCount} of ${totalAutoGraded} correct (${scorePercent}%)` : 'Self-check activities reviewed'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAnswerKey(!showAnswerKey)}
              className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
            >
              {showAnswerKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showAnswerKey ? 'Hide Key' : 'Show Key'}
            </button>
          </div>
        </div>
      )}

      {/* Exercises List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {exercises.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-400 space-y-3">
            <p className="text-sm font-medium text-slate-300">Textbook Reading & Lesson Page</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              This page contains introductory text, vocabulary references, or listening passages. Use the top navigation or audio badges to study.
            </p>
          </div>
        ) : (
          exercises.map((ex) => {
            const userVal = answers[ex.id]?.value || '';
            const evaluation = evaluations[ex.id];
            const isSelected = activeExerciseId === ex.id;

            return (
              <div
                key={ex.id}
                onClick={() => onSelectExercise(ex.id)}
                className={`p-3.5 rounded-xl border transition-all duration-150 ${
                  isSelected
                    ? 'border-sky-500/80 bg-slate-800/90 ring-1 ring-sky-500/30'
                    : 'border-slate-800 bg-slate-850/60 hover:border-slate-700'
                }`}
              >
                {/* Exercise Item Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-700/80 text-sky-300 text-xs font-bold flex items-center justify-center">
                      {ex.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-300">
                      {ex.unitRef || 'Practice Task'}
                    </span>
                  </div>

                  {evaluation && (
                    <div className="flex items-center gap-1 text-xs font-medium">
                      {evaluation.isSelfCheck ? (
                        <span className="text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px]">
                          Self-Check
                        </span>
                      ) : evaluation.isCorrect ? (
                        <span className="text-emerald-400 flex items-center gap-0.5 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-0.5 text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" /> Revise
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Question / Explanation hint if available */}
                {ex.explanation && (
                  <p className="text-xs text-slate-400 mb-2.5 leading-snug">
                    {ex.explanation}
                  </p>
                )}

                {/* Input Renderers */}
                {ex.fieldType === 'text' && (
                  <GapFillInput
                    id={`panel-input-${ex.id}`}
                    value={typeof userVal === 'string' ? userVal : ''}
                    onChange={(val) => onAnswerChange(ex.id, val)}
                    placeholder={ex.placeholder}
                    evaluation={evaluation}
                    className="w-full"
                  />
                )}

                {ex.fieldType === 'single_choice' && ex.options && (
                  <SingleChoice
                    id={`panel-choice-${ex.id}`}
                    options={ex.options}
                    selected={typeof userVal === 'string' ? userVal : ''}
                    onSelect={(val) => onAnswerChange(ex.id, val)}
                    evaluation={evaluation}
                  />
                )}

                {ex.fieldType === 'textarea' && (
                  <FreeResponseArea
                    id={`panel-textarea-${ex.id}`}
                    value={typeof userVal === 'string' ? userVal : ''}
                    onChange={(val) => onAnswerChange(ex.id, val)}
                    placeholder={ex.placeholder}
                    evaluation={evaluation}
                  />
                )}

                {ex.fieldType === 'matching' && ex.matchingPairs && (
                  <MatchingExercise
                    id={`panel-match-${ex.id}`}
                    pairs={ex.matchingPairs}
                    currentAnswers={typeof userVal === 'object' && !Array.isArray(userVal) ? userVal : {}}
                    onMatch={(left, right) => {
                      const existing = typeof userVal === 'object' && !Array.isArray(userVal) ? userVal : {};
                      onAnswerChange(ex.id, JSON.stringify({ ...existing, [left]: right }));
                    }}
                    evaluation={evaluation}
                  />
                )}

                {/* Answer Key Reveal (When toggled) */}
                {showAnswerKey && ex.acceptedAnswers && ex.acceptedAnswers.length > 0 && (
                  <div className="mt-2.5 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs">
                    <span className="font-semibold text-amber-400">Answer Key: </span>
                    <span className="text-amber-200 font-mono">
                      {ex.acceptedAnswers.join(' / ')}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions (Check My Answers & Reset) */}
      {exercises.length > 0 && (
        <div className="p-4 border-t border-slate-800 bg-slateDark-950/80 space-y-2">
          <button
            onClick={onCheckAnswers}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs transition-all shadow-md shadow-sky-600/20 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Check My Answers
          </button>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-2 text-slate-400 hover:text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Page Exercises
            </button>
          ) : (
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 space-y-1.5 text-center">
              <p className="text-[11px] text-red-300 font-medium">Clear all answers on this page?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onResetPage();
                    setShowResetConfirm(false);
                  }}
                  className="flex-1 py-1 text-xs font-semibold rounded bg-red-600 hover:bg-red-500 text-white"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

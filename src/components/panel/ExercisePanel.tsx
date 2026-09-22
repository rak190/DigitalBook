import React, { useState } from 'react';
import { PageMeta, ExerciseItem, ExerciseAnswer, AnswerEvaluation } from '../../types';
import { GapFillInput } from '../exercises/GapFillInput';
import { SingleChoice } from '../exercises/SingleChoice';
import { MultiChoice } from '../exercises/MultiChoice';
import { DropdownChoice } from '../exercises/DropdownChoice';
import { FreeResponseArea } from '../exercises/FreeResponseArea';
import { MatchingExercise } from '../exercises/MatchingExercise';
import { FormTable } from '../exercises/FormTable';
import { CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, Volume2, Sparkles, X } from 'lucide-react';

interface ExercisePanelProps {
  pageMeta: PageMeta;
  exercises: ExerciseItem[];
  answers: Record<string, ExerciseAnswer>;
  evaluations: Record<string, AnswerEvaluation>;
  onAnswerChange: (exerciseId: string, value: string | string[]) => void;
  onCheckAnswers: () => void;
  onRetryMistakes?: () => void;
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
  onRetryMistakes,
  onResetPage,
  onPlayAudioTrack,
  onClose,
  activeExerciseId,
  onSelectExercise,
}) => {
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [filterMistakes, setFilterMistakes] = useState(false);
  const [expandedHints, setExpandedHints] = useState<Record<string, boolean>>({});

  const toggleHint = (key: string) => {
    setExpandedHints(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Group exercises by unitRef or section
  const hasEvaluations = Object.keys(evaluations).length > 0;
  const autoGradedEvals = Object.values(evaluations).filter(e => !e.isSelfCheck);
  const correctCount = autoGradedEvals.filter(e => e.isCorrect).length;
  const totalAutoGraded = autoGradedEvals.length;
  const scorePercent = totalAutoGraded > 0 ? Math.round((correctCount / totalAutoGraded) * 100) : null;
  const mistakeCount = totalAutoGraded - correctCount;

  const displayedExercises = filterMistakes
    ? exercises.filter(ex => evaluations[ex.id] && !evaluations[ex.id].isCorrect && !evaluations[ex.id].isSelfCheck)
    : exercises;

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
          {exercises.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      (exercises.filter((ex) => answers[ex.id]?.isCompleted).length / exercises.length) * 100
                    )}%`,
                  }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                {exercises.filter((ex) => answers[ex.id]?.isCompleted).length}/{exercises.length}
              </span>
            </div>
          )}
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
        <div className="p-3.5 mx-4 my-3 rounded-xl border bg-slate-800/90 border-slate-700 shadow-md space-y-2.5">
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
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 text-sky-300 flex items-center gap-1.5 transition-colors shadow-sm"
              title="Show or hide correct answer keys"
            >
              {showAnswerKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showAnswerKey ? 'Hide Key' : 'Show Key'}</span>
            </button>
          </div>

          {/* Review Mistakes & Try Again Actions */}
          {totalAutoGraded > 0 && mistakeCount > 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-700/60">
              <button
                onClick={() => setFilterMistakes(!filterMistakes)}
                className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                  filterMistakes
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-850 hover:bg-slate-750 text-slate-300 border-slate-700'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>{filterMistakes ? 'Show All Exercises' : `Review Mistakes (${mistakeCount})`}</span>
              </button>

              {onRetryMistakes && (
                <button
                  onClick={() => {
                    onRetryMistakes();
                    setFilterMistakes(false);
                  }}
                  className="flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg bg-sky-600/80 hover:bg-sky-600 text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  title="Clear incorrect answers to try again"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Exercises List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayedExercises.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-400 space-y-3">
            {filterMistakes ? (
              <>
                <p className="text-sm font-semibold text-emerald-400">No mistakes to review!</p>
                <button
                  onClick={() => setFilterMistakes(false)}
                  className="text-xs text-sky-400 underline hover:text-sky-300"
                >
                  Show all exercises
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-300">Textbook Reading & Lesson Page</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This page contains introductory text, vocabulary references, or listening passages. Use the top navigation or audio badges to study.
                </p>
              </>
            )}
          </div>
        ) : (
          displayedExercises.map((ex) => {
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
                    {ex.audioTrack && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayAudioTrack && onPlayAudioTrack(ex.audioTrack!, `Track ${ex.audioTrack}`);
                        }}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 flex items-center gap-1 transition-all ml-1 shadow-sm"
                        title={`Listen to Audio Track ${ex.audioTrack}`}
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{ex.audioTrack}</span>
                      </button>
                    )}
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
                  <p className="text-xs text-slate-400 mb-2 leading-snug">
                    {ex.explanation}
                  </p>
                )}

                {/* Optional Hint Toggle */}
                {ex.hint && (
                  <div className="mb-2.5">
                    <button
                      type="button"
                      onClick={() => toggleHint(`hint_${ex.id}`)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
                    >
                      <span>💡</span>
                      <span>{expandedHints[`hint_${ex.id}`] ? 'Hide Hint' : 'Show Hint'}</span>
                    </button>
                    {expandedHints[`hint_${ex.id}`] && (
                      <div className="mt-1 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 animate-in fade-in duration-100">
                        <span className="font-semibold text-amber-400">Hint: </span>
                        <span>{ex.hint}</span>
                      </div>
                    )}
                  </div>
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

                {ex.fieldType === 'multi_choice' && ex.options && (
                  <MultiChoice
                    id={`panel-multi-${ex.id}`}
                    options={ex.options}
                    selected={Array.isArray(userVal) ? userVal : (typeof userVal === 'string' && userVal ? [userVal] : [])}
                    onToggle={(opt) => {
                      const cur = Array.isArray(userVal) ? [...userVal] : (typeof userVal === 'string' && userVal ? [userVal] : []);
                      const next = cur.includes(opt) ? cur.filter(o => o !== opt) : [...cur, opt];
                      onAnswerChange(ex.id, next);
                    }}
                    evaluation={evaluation}
                  />
                )}

                {ex.fieldType === 'dropdown' && ex.options && (
                  <DropdownChoice
                    id={`panel-dropdown-${ex.id}`}
                    options={ex.options}
                    selected={typeof userVal === 'string' ? userVal : ''}
                    onChange={(val) => onAnswerChange(ex.id, val)}
                    evaluation={evaluation}
                    className="w-full"
                  />
                )}

                {ex.fieldType === 'table' && ex.tableHeaders && ex.tableRows && (
                  <FormTable
                    headers={ex.tableHeaders}
                    rows={ex.tableRows}
                    userValues={typeof userVal === 'string' ? (() => {
                      try { return JSON.parse(userVal); } catch { return {}; }
                    })() : {}}
                    onCellChange={(cellKey, val) => {
                      let curObj: Record<string, string> = {};
                      try { curObj = typeof userVal === 'string' ? JSON.parse(userVal) : {}; } catch {}
                      curObj[cellKey] = val;
                      onAnswerChange(ex.id, JSON.stringify(curObj));
                    }}
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
                {showAnswerKey && (
                  <div className="mt-2.5 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-1 animate-in fade-in duration-150">
                    <div className="font-bold text-amber-400 text-[11px] uppercase tracking-wider">
                      {ex.gradingType === 'self_check' || ex.fieldType === 'textarea' || ex.fieldType === 'speaking'
                        ? 'Possible Answer / Reference'
                        : 'Answer Key'}
                    </div>
                    {ex.acceptedAnswers && ex.acceptedAnswers.length > 0 ? (
                      <div className="text-amber-200 font-mono font-medium">
                        {ex.acceptedAnswers.join('  /  ')}
                      </div>
                    ) : (
                      <div className="text-slate-400 italic text-[11px]">
                        Self-check activity. Check lesson discussion or audio transcript.
                      </div>
                    )}
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

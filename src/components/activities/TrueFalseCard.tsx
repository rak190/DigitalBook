import React from 'react';
import { ExerciseQuestionDefinition } from '../../types';
import { Check, X, HelpCircle } from 'lucide-react';

interface TrueFalseCardProps {
  questions: ExerciseQuestionDefinition[];
  answers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  evaluations?: Record<string, { isCorrect: boolean; acceptedAnswers: string[]; hint?: string }>;
  showAnswers?: boolean;
}

export const TrueFalseCard: React.FC<TrueFalseCardProps> = ({
  questions,
  answers,
  onAnswerChange,
  evaluations = {},
  showAnswers = false,
}) => {
  return (
    <div className="space-y-4">
      {questions.map((q, idx) => {
        const qKey = q.id || `q_${idx}`;
        const evalInfo = evaluations[qKey];
        const currentVal = (answers[qKey] || '').toLowerCase();
        const accepted = (q.acceptedAnswers || []).map((a) => a.toLowerCase());

        return (
          <div
            key={qKey}
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-sky-600/30 text-sky-400 border border-sky-500/40 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {q.num || idx + 1}
                </span>
                <p className="text-sm font-semibold text-slate-100 leading-snug">
                  {q.prompt}
                </p>
              </div>

              {evalInfo && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {evalInfo.isCorrect ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5" /> Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <X className="w-3.5 h-3.5" /> Review
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="pl-8 flex flex-wrap items-center gap-3">
              {['True', 'False'].map((optionLabel) => {
                const optVal = optionLabel.toLowerCase();
                const isSelected = currentVal === optVal;
                const isKeyAnswer = showAnswers && accepted.includes(optVal);

                return (
                  <button
                    key={optionLabel}
                    type="button"
                    onClick={() => onAnswerChange(qKey, optVal)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? optVal === 'true'
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/20'
                          : 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/20'
                        : 'bg-slate-900/60 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                    }`}
                  >
                    <span>{optionLabel}</span>
                    {isKeyAnswer && (
                      <span className="text-[10px] bg-white/20 px-1 rounded">✓ Key</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Hint / Explanation */}
            {evalInfo && !evalInfo.isCorrect && evalInfo.hint && (
              <div className="mt-3 ml-8 p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Hint: {evalInfo.hint}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

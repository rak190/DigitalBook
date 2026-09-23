import React from 'react';
import { OxfordQuestion } from '../../types';
import { Check, X, HelpCircle } from 'lucide-react';

interface MultipleChoiceCardProps {
  questions: OxfordQuestion[];
  answers: Record<string, string>;
  onAnswerChange: (qId: string, val: string) => void;
  evaluations?: Record<string, { isCorrect: boolean; acceptedAnswers: string[]; hint?: string }>;
  showAnswers?: boolean;
}

export const MultipleChoiceCard: React.FC<MultipleChoiceCardProps> = ({
  questions,
  answers,
  onAnswerChange,
  evaluations = {},
  showAnswers = false,
}) => {
  return (
    <div className="space-y-4">
      {questions.map((q) => {
        const qKey = q.id || `q_${q.num}`;
        const selectedVal = answers[qKey] || '';
        const evalResult = evaluations[qKey];
        const isChecked = !!evalResult;

        return (
          <div
            key={qKey}
            className={`p-4 rounded-xl border transition-all duration-150 ${
              isChecked
                ? evalResult.isCorrect
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-amber-950/20 border-amber-500/40'
                : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {q.num}
                </span>
                <span className="text-sm font-semibold text-slate-100">
                  {q.question || `Question ${q.num}`}
                </span>
              </div>

              {isChecked && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {evalResult.isCorrect ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <Check className="w-3.5 h-3.5" /> Correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      <X className="w-3.5 h-3.5" /> Revise
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Radio Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(q.options || [
                { value: 'a', label: 'Option A' },
                { value: 'b', label: 'Option B' },
                { value: 'c', label: 'Option C' },
              ]).map((opt) => {
                const isSelected = selectedVal.toLowerCase() === opt.value.toLowerCase();
                const isOfficialCorrect = showAnswers && q.correct.toLowerCase() === opt.value.toLowerCase();

                return (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer text-xs font-medium transition-all select-none ${
                      isOfficialCorrect
                        ? 'bg-emerald-600/20 border-emerald-400 text-emerald-300 font-bold ring-1 ring-emerald-500'
                        : isSelected
                        ? isChecked
                          ? evalResult.isCorrect
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                            : 'bg-amber-500/20 border-amber-500 text-amber-200'
                          : 'bg-sky-600/20 border-sky-500 text-sky-200'
                        : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/40 hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question_${qKey}`}
                      value={opt.value}
                      checked={isSelected}
                      onChange={() => onAnswerChange(qKey, opt.value)}
                      className="accent-sky-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="uppercase font-mono font-bold text-[11px] text-slate-400">
                      {opt.value})
                    </span>
                    <span className="truncate">{opt.label}</span>
                  </label>
                );
              })}
            </div>

            {/* Show official answer banner if self-study toggled */}
            {showAnswers && (
              <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <HelpCircle className="w-3.5 h-3.5" /> Answer Key:
                </span>
                <span className="font-bold text-emerald-300 font-mono uppercase bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                  {q.correct}) {q.options?.find(o => o.value === q.correct)?.label || q.label || ''}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

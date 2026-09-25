import React from 'react';
import { ExerciseQuestionDefinition } from '../../types';
import { Check, X, HelpCircle } from 'lucide-react';

interface DropdownCardProps {
  questions: ExerciseQuestionDefinition[];
  answers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  evaluations?: Record<string, { isCorrect: boolean; acceptedAnswers: string[]; hint?: string }>;
  showAnswers?: boolean;
}

export const DropdownCard: React.FC<DropdownCardProps> = ({
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
        const val = answers[qKey] || '';
        const options = (q.options || []).map((opt) =>
          typeof opt === 'string' ? { value: opt, label: opt } : opt
        );

        return (
          <div
            key={qKey}
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2.5">
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

            <div className="pl-8 space-y-2">
              <select
                value={val}
                onChange={(e) => onAnswerChange(qKey, e.target.value)}
                className={`w-full p-2.5 rounded-lg border text-xs bg-slate-900/90 text-white outline-none font-medium cursor-pointer ${
                  evalInfo
                    ? evalInfo.isCorrect
                      ? 'border-emerald-500/70 text-emerald-300'
                      : 'border-amber-500/70 text-amber-300'
                    : 'border-slate-700 focus:border-sky-500'
                }`}
              >
                <option value="">-- Choose option --</option>
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {showAnswers && q.acceptedAnswers && q.acceptedAnswers.length > 0 && (
                <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-300 font-bold">
                  Correct Option: {q.acceptedAnswers.join(' / ')}
                </div>
              )}

              {evalInfo && !evalInfo.isCorrect && evalInfo.hint && (
                <div className="p-2 rounded bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Hint: {evalInfo.hint}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

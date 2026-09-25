import React from 'react';
import { ExerciseQuestionDefinition } from '../../types';
import { Check, X, HelpCircle, ArrowRightLeft } from 'lucide-react';

interface MatchingCardProps {
  questions: ExerciseQuestionDefinition[];
  answers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  evaluations?: Record<string, { isCorrect: boolean; acceptedAnswers: string[]; hint?: string }>;
  showAnswers?: boolean;
}

export const MatchingCard: React.FC<MatchingCardProps> = ({
  questions,
  answers,
  onAnswerChange,
  evaluations = {},
  showAnswers = false,
}) => {
  return (
    <div className="space-y-4">
      {questions.map((q, idx) => {
        const pairs = q.matchingPairs || [];
        const rightOptions = Array.from(new Set(pairs.map((p) => p.right)));

        return (
          <div
            key={q.id || `match_${idx}`}
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3"
          >
            {q.prompt && (
              <p className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-sky-400" />
                <span>{q.prompt}</span>
              </p>
            )}

            <div className="space-y-2.5">
              {pairs.map((pair, pIdx) => {
                const itemKey = pair.leftId || `${q.id || 'q'}_pair_${pIdx}`;
                const selectedRight = answers[itemKey] || '';
                const evalInfo = evaluations[itemKey];
                const isCorrect = evalInfo?.isCorrect;

                return (
                  <div
                    key={itemKey}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/80"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-bold flex items-center justify-center">
                        {pIdx + 1}
                      </span>
                      <span className="text-xs font-semibold text-white">{pair.left}</span>
                    </div>

                    <div className="flex items-center gap-2 sm:w-1/2">
                      <select
                        value={selectedRight}
                        onChange={(e) => onAnswerChange(itemKey, e.target.value)}
                        className={`w-full py-1.5 px-2.5 text-xs bg-slate-850 rounded-lg border outline-none font-medium cursor-pointer ${
                          evalInfo
                            ? isCorrect
                              ? 'border-emerald-500/70 text-emerald-300'
                              : 'border-amber-500/70 text-amber-300'
                            : 'border-slate-700 text-slate-200 focus:border-sky-500'
                        }`}
                      >
                        <option value="">-- Select matching pair --</option>
                        {rightOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>

                      {evalInfo && (
                        <div className="flex-shrink-0">
                          {isCorrect ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <X className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                      )}
                    </div>

                    {showAnswers && (
                      <div className="text-[10px] text-emerald-300 font-bold sm:w-full mt-1">
                        Answer: {pair.right}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

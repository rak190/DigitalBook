import React from 'react';
import { AnswerEvaluation } from '../../types';

interface MatchingExerciseProps {
  id: string;
  pairs: { left: string; right: string }[];
  currentAnswers: Record<string, string>;
  onMatch: (left: string, right: string) => void;
  evaluation?: AnswerEvaluation;
}

export const MatchingExercise: React.FC<MatchingExerciseProps> = ({
  pairs,
  currentAnswers,
  onMatch,
  evaluation,
}) => {
  const options = pairs.map(p => p.right);

  return (
    <div className="space-y-2 w-full">
      {pairs.map((p, idx) => {
        const selectedVal = currentAnswers[p.left] || '';
        const isMatchedCorrect = evaluation?.isCorrect && selectedVal === p.right;

        return (
          <div
            key={idx}
            className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-800/60 border border-slate-700/60"
          >
            <span className="text-sm font-medium text-slate-200">{p.left}</span>
            <select
              value={selectedVal}
              onChange={(e) => onMatch(p.left, e.target.value)}
              className={`px-2.5 py-1 text-xs rounded border bg-slate-850 text-white outline-none transition-all ${
                isMatchedCorrect
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-600 focus:border-sky-500'
              }`}
            >
              <option value="">-- Choose match --</option>
              {options.map((opt, oIdx) => (
                <option key={oIdx} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
};

import React from 'react';
import { ExerciseQuestionDefinition } from '../../types';
import { CheckSquare, Square, Star } from 'lucide-react';

interface SelfCheckCardProps {
  questions: ExerciseQuestionDefinition[];
  answers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  showAnswers?: boolean;
}

export const SelfCheckCard: React.FC<SelfCheckCardProps> = ({
  questions,
  answers,
  onAnswerChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300 flex items-center gap-2">
        <Star className="w-4 h-4 text-indigo-400 flex-shrink-0" />
        <span>Self-Assessment Checklist: Rate your understanding or check off what you have learned.</span>
      </div>

      {questions.map((q, idx) => {
        const qKey = q.id || `check_${idx}`;
        const isChecked = answers[qKey] === 'true';

        return (
          <div
            key={qKey}
            onClick={() => onAnswerChange(qKey, isChecked ? 'false' : 'true')}
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
              isChecked
                ? 'bg-sky-600/20 border-sky-500 text-white'
                : 'bg-slate-800/40 border-slate-700/80 text-slate-300 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              {isChecked ? (
                <CheckSquare className="w-5 h-5 text-sky-400 flex-shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-slate-500 flex-shrink-0" />
              )}
              <span className="text-xs font-semibold leading-relaxed">
                {q.prompt || `Goal ${idx + 1}`}
              </span>
            </div>

            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700 text-slate-400">
              {isChecked ? 'Achieved' : 'Click to Check'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

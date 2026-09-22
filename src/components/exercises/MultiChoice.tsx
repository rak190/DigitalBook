import React from 'react';
import { AnswerEvaluation } from '../../types';

interface MultiChoiceProps {
  id: string;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  evaluation?: AnswerEvaluation;
  className?: string;
}

export const MultiChoice: React.FC<MultiChoiceProps> = ({
  options,
  selected = [],
  onToggle,
  evaluation,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((opt, idx) => {
        const isChecked = selected.includes(opt);
        let optStyle = 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white';

        if (isChecked) {
          if (!evaluation) {
            optStyle = 'bg-sky-600/90 text-white border-sky-500 shadow-sm';
          } else if (evaluation.isCorrect) {
            optStyle = 'bg-emerald-600 text-white border-emerald-500 shadow-sm';
          } else {
            optStyle = 'bg-amber-600 text-white border-amber-500 shadow-sm';
          }
        }

        return (
          <button
            key={idx}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-150 flex items-center gap-2 ${optStyle}`}
          >
            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] font-bold ${
              isChecked ? 'border-white bg-white/20' : 'border-slate-500 bg-slate-900/50'
            }`}>
              {isChecked ? '✓' : ''}
            </span>
            <span>{opt}</span>
          </button>
        );
      })}
    </div>
  );
};

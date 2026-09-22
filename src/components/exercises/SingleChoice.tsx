import React from 'react';
import { AnswerEvaluation } from '../../types';

interface SingleChoiceProps {
  id: string;
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
  evaluation?: AnswerEvaluation;
  className?: string;
}

export const SingleChoice: React.FC<SingleChoiceProps> = ({
  id,
  options,
  selected,
  onSelect,
  evaluation,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((opt, idx) => {
        const isSelected = selected === opt;
        let optStyle = 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white';

        if (isSelected) {
          if (!evaluation) {
            optStyle = 'bg-sky-600 text-white border-sky-500 shadow-sm';
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
            onClick={() => onSelect(opt)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-150 flex items-center gap-1.5 ${optStyle}`}
          >
            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[10px] ${
              isSelected ? 'border-white bg-white/20' : 'border-slate-500'
            }`}>
              {isSelected ? '✓' : ''}
            </span>
            {opt}
          </button>
        );
      })}
    </div>
  );
};

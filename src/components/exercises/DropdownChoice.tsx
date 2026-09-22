import React from 'react';
import { AnswerEvaluation } from '../../types';

interface DropdownChoiceProps {
  id: string;
  options: string[];
  selected: string;
  onChange: (value: string) => void;
  evaluation?: AnswerEvaluation;
  placeholder?: string;
  className?: string;
}

export const DropdownChoice: React.FC<DropdownChoiceProps> = ({
  id,
  options,
  selected,
  onChange,
  evaluation,
  placeholder = 'Select answer...',
  className = '',
}) => {
  let borderStyle = 'border-slate-700 bg-slate-800 text-white focus:border-sky-500';

  if (evaluation) {
    if (evaluation.isCorrect) {
      borderStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-300';
    } else {
      borderStyle = 'border-amber-500 bg-amber-500/10 text-amber-300';
    }
  }

  return (
    <select
      id={id}
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border outline-none transition-all cursor-pointer ${borderStyle} ${className}`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((opt, idx) => (
        <option key={idx} value={opt} className="bg-slate-900 text-white">
          {opt}
        </option>
      ))}
    </select>
  );
};

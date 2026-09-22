import React from 'react';
import { AnswerEvaluation } from '../../types';

interface GapFillInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  evaluation?: AnswerEvaluation;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const GapFillInput: React.FC<GapFillInputProps> = ({
  id,
  value,
  onChange,
  evaluation,
  placeholder,
  className = '',
  autoFocus = false,
}) => {
  const getBorderColor = () => {
    if (!evaluation) {
      return 'border-sky-500/30 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20';
    }
    if (evaluation.isSelfCheck) {
      return 'border-indigo-400 bg-indigo-50/10 focus:border-indigo-500';
    }
    if (evaluation.isCorrect) {
      return 'border-emerald-500 bg-emerald-500/10 text-emerald-400 focus:border-emerald-500';
    }
    return 'border-amber-500 bg-amber-500/10 text-amber-300 focus:border-amber-500';
  };

  return (
    <div className="relative inline-flex items-center">
      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || '...'}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        className={`px-2.5 py-1 text-sm font-medium rounded border transition-all duration-150 outline-none bg-slate-800/80 text-white placeholder-slate-500 shadow-sm ${getBorderColor()} ${className}`}
      />
    </div>
  );
};

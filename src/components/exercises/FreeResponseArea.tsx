import React from 'react';
import { AnswerEvaluation } from '../../types';

interface FreeResponseAreaProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  evaluation?: AnswerEvaluation;
  placeholder?: string;
  rows?: number;
}

export const FreeResponseArea: React.FC<FreeResponseAreaProps> = ({
  id,
  value,
  onChange,
  evaluation,
  placeholder,
  rows = 3,
}) => {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder || 'Write your response or notes here...'}
        className={`w-full p-2.5 text-sm rounded-lg border bg-slate-800/90 text-white placeholder-slate-500 outline-none transition-all resize-y ${
          evaluation?.isCorrect
            ? 'border-emerald-500/80'
            : 'border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30'
        }`}
      />
      <div className="flex justify-between items-center text-[11px] text-slate-400 px-1">
        <span>Self-check / Open response</span>
        <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
      </div>
    </div>
  );
};

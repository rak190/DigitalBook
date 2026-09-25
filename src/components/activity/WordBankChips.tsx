import React from 'react';

interface WordBankChipsProps {
  words: string[];
  onSelectWord: (word: string) => void;
  usedWords?: string[];
  allowMultipleUse?: boolean;
}

export const WordBankChips: React.FC<WordBankChipsProps> = ({
  words,
  onSelectWord,
  usedWords = [],
  allowMultipleUse = false,
}) => {
  return (
    <div className="bg-sky-950/40 border border-sky-800/40 rounded-xl p-3 my-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-2 flex items-center justify-between">
        <span>Word Bank (Click to insert into focused blank)</span>
        <span className="text-[10px] text-slate-400 font-normal">
          {allowMultipleUse ? 'Words can be used multiple times' : 'Click word to insert'}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {words.map((word, idx) => {
          const isUsed = !allowMultipleUse && usedWords.includes(word.toLowerCase());
          return (
            <button
              key={`${word}_${idx}`}
              type="button"
              onClick={() => onSelectWord(word)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all duration-150 cursor-pointer select-none active:scale-95 ${
                isUsed
                  ? 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:bg-slate-700/80 hover:text-slate-200'
                  : 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400/30 hover:border-sky-300 shadow-sm'
              }`}
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
};

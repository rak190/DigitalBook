import React, { useRef } from 'react';
import { OxfordBlank } from '../../types';
import { WordBankChips } from './WordBankChips';
import { Check, X, HelpCircle } from 'lucide-react';

interface GapFillCardProps {
  sentences: { num: number; text: string; blankIds: string[] }[];
  blanks: Record<string, OxfordBlank>;
  answers: Record<string, string>;
  onAnswerChange: (blankKey: string, val: string) => void;
  evaluations?: Record<string, { isCorrect: boolean; acceptedAnswers: string[]; hint?: string }>;
  showAnswers?: boolean;
  wordBank?: string[];
  activeBlankId?: string;
  onFocusBlank?: (blankId: string) => void;
  onWordChipClick?: (word: string) => void;
}

export const GapFillCard: React.FC<GapFillCardProps> = ({
  sentences,
  blanks,
  answers,
  onAnswerChange,
  evaluations = {},
  showAnswers = false,
  wordBank,
  activeBlankId,
  onFocusBlank,
  onWordChipClick,
}) => {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Flatten all blank IDs in sentence order for auto-advance
  const orderedBlankIds: string[] = [];
  sentences.forEach((s) => {
    s.blankIds.forEach((bId) => orderedBlankIds.push(bId));
  });

  const handleChipInsert = (word: string) => {
    if (onWordChipClick) {
      onWordChipClick(word);
      return;
    }

    // Determine target blank: active or first empty
    let targetId = activeBlankId;
    if (!targetId || !blanks[targetId]) {
      targetId = orderedBlankIds.find((bId) => !answers[bId] || answers[bId].trim() === '');
    }
    if (!targetId && orderedBlankIds.length > 0) {
      targetId = orderedBlankIds[0];
    }

    if (targetId) {
      onAnswerChange(targetId, word);
      // Auto-advance to next blank in list
      const currentIndex = orderedBlankIds.indexOf(targetId);
      if (currentIndex >= 0 && currentIndex < orderedBlankIds.length - 1) {
        const nextId = orderedBlankIds[currentIndex + 1];
        if (onFocusBlank) onFocusBlank(nextId);
        inputRefs.current[nextId]?.focus();
      }
    }
  };

  // Collect words already typed by user
  const usedWords = Object.values(answers).map((v) => v.trim().toLowerCase());

  return (
    <div className="space-y-4">
      {/* Word Bank Chip Bar at Top */}
      {wordBank && wordBank.length > 0 && (
        <WordBankChips
          words={wordBank}
          onSelectWord={handleChipInsert}
          usedWords={usedWords}
        />
      )}

      {/* Sentences List */}
      <div className="space-y-3">
        {sentences.map((sent) => {
          const hasBlanks = sent.blankIds.length > 0;

          if (!hasBlanks) {
            return (
              <div
                key={`sent_${sent.num}`}
                className="p-3 rounded-lg bg-slate-800/20 border border-slate-800 text-xs text-slate-400 flex items-center gap-2 italic"
              >
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  {sent.num}
                </span>
                <span>{sent.text}</span>
              </div>
            );
          }

          // Split sentence by ______ blanks
          const parts = sent.text.split('______');

          return (
            <div
              key={`sent_${sent.num}`}
              className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-all text-xs text-slate-200"
            >
              <div className="flex items-baseline gap-2 flex-wrap leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  {sent.num}
                </span>

                {parts.map((part, index) => {
                  const blankId = sent.blankIds[index];
                  const val = blankId ? answers[blankId] || '' : '';
                  const evalResult = blankId ? evaluations[blankId] : undefined;
                  const isChecked = !!evalResult;
                  const isActive = activeBlankId === blankId;
                  const blankMeta = blankId ? blanks[blankId] : undefined;

                  return (
                    <React.Fragment key={index}>
                      <span>{part}</span>
                      {blankId && (
                        <span className="inline-flex flex-col mx-1 my-0.5">
                          <input
                            ref={(el) => {
                              inputRefs.current[blankId] = el;
                            }}
                            type="text"
                            value={val}
                            onFocus={() => onFocusBlank && onFocusBlank(blankId)}
                            onChange={(e) => onAnswerChange(blankId, e.target.value)}
                            placeholder={`(${blankId})`}
                            autoComplete="off"
                            spellCheck={false}
                            className={`min-w-[120px] max-w-[200px] px-2.5 py-1 text-center font-bold text-xs rounded border-b-2 transition-all outline-none ${
                              isChecked
                                ? evalResult.isCorrect
                                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-400 ring-1 ring-emerald-500/40'
                                  : 'bg-amber-950/40 text-amber-300 border-amber-400 ring-1 ring-amber-500/40'
                                : isActive
                                ? 'bg-sky-900/40 text-sky-200 border-sky-400 ring-2 ring-sky-400/30'
                                : 'bg-slate-900/80 text-white border-slate-600 hover:border-sky-500'
                            }`}
                          />

                          {/* Show Accepted Answer Key when toggled */}
                          {showAnswers && blankMeta && (
                            <span className="text-[10px] text-emerald-400 font-mono font-bold mt-1 text-center bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                              {blankMeta.accepted[0]}
                            </span>
                          )}

                          {/* Hint on mistake */}
                          {isChecked && !evalResult.isCorrect && evalResult.hint && (
                            <span className="text-[10px] text-amber-400 italic mt-0.5 max-w-[180px] truncate">
                              💡 {evalResult.hint}
                            </span>
                          )}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

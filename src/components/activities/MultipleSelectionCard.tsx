import React from 'react';
import { ExerciseQuestionDefinition } from '../../types';
import { Check, X, HelpCircle, CheckSquare, Square } from 'lucide-react';

interface MultipleSelectionCardProps {
  questions: ExerciseQuestionDefinition[];
  answers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  evaluations?: Record<string, { isCorrect: boolean; acceptedAnswers: string[]; hint?: string }>;
  showAnswers?: boolean;
}

export const MultipleSelectionCard: React.FC<MultipleSelectionCardProps> = ({
  questions,
  answers,
  onAnswerChange,
  evaluations = {},
  showAnswers = false,
}) => {
  const toggleOption = (qId: string, optVal: string) => {
    const raw = answers[qId] || '';
    let selected: string[] = [];
    try {
      selected = JSON.parse(raw);
      if (!Array.isArray(selected)) selected = [];
    } catch {
      selected = raw ? raw.split(',').map((s) => s.trim()) : [];
    }

    if (selected.includes(optVal)) {
      selected = selected.filter((item) => item !== optVal);
    } else {
      selected.push(optVal);
    }
    onAnswerChange(qId, JSON.stringify(selected));
  };

  const getSelected = (qId: string): string[] => {
    const raw = answers[qId] || '';
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return raw ? raw.split(',').map((s) => s.trim()) : [];
    }
  };

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => {
        const qKey = q.id || `q_${idx}`;
        const evalInfo = evaluations[qKey];
        const selected = getSelected(qKey);
        const options = (q.options || []).map((opt) =>
          typeof opt === 'string' ? { value: opt, label: opt } : opt
        );

        return (
          <div
            key={qKey}
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-sky-600/30 text-sky-400 border border-sky-500/40 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {q.num || idx + 1}
                </span>
                <p className="text-sm font-semibold text-slate-100 leading-snug">
                  {q.prompt || q.instruction || 'Select all that apply:'}
                </p>
              </div>

              {evalInfo && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {evalInfo.isCorrect ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5" /> Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <X className="w-3.5 h-3.5" /> Review
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Options grid */}
            <div className="space-y-2 pl-8">
              {options.map((opt) => {
                const isChecked = selected.includes(opt.value);
                const isKeyAnswer = showAnswers && q.acceptedAnswers?.includes(opt.value);

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleOption(qKey, opt.value)}
                    className={`w-full text-left p-3 rounded-lg border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-sky-600/25 border-sky-500 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:border-slate-600 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-sky-400 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      )}
                      <span>{opt.label}</span>
                    </div>

                    {isKeyAnswer && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40">
                        Official Answer
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Hint / Explanation */}
            {evalInfo && !evalInfo.isCorrect && evalInfo.hint && (
              <div className="mt-3 ml-8 p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Hint: {evalInfo.hint}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

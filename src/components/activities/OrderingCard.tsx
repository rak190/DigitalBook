import React from 'react';
import { ExerciseQuestionDefinition } from '../../types';
import { Check, X, ArrowUp, ArrowDown, HelpCircle, ListOrdered } from 'lucide-react';

interface OrderingCardProps {
  questions: ExerciseQuestionDefinition[];
  answers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  evaluations?: Record<string, { isCorrect: boolean; acceptedAnswers: string[]; hint?: string }>;
  showAnswers?: boolean;
}

export const OrderingCard: React.FC<OrderingCardProps> = ({
  questions,
  answers,
  onAnswerChange,
  evaluations = {},
  showAnswers = false,
}) => {
  return (
    <div className="space-y-4">
      {questions.map((q, idx) => {
        const qKey = q.id || `order_${idx}`;
        const evalInfo = evaluations[qKey];
        const defaultItems = q.items || (q.options ? q.options.map((o) => (typeof o === 'string' ? o : o.label)) : []);

        // Read current ordered items from answer state (JSON array or default)
        let currentOrder: string[] = [];
        try {
          if (answers[qKey]) {
            currentOrder = JSON.parse(answers[qKey]);
          }
        } catch {}
        if (!Array.isArray(currentOrder) || currentOrder.length === 0) {
          currentOrder = [...defaultItems];
        }

        const moveItem = (index: number, direction: 'up' | 'down') => {
          const target = direction === 'up' ? index - 1 : index + 1;
          if (target < 0 || target >= currentOrder.length) return;
          const updated = [...currentOrder];
          const temp = updated[index];
          updated[index] = updated[target];
          updated[target] = temp;
          onAnswerChange(qKey, JSON.stringify(updated));
        };

        return (
          <div
            key={qKey}
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-sky-400" />
                <span>{q.prompt || 'Arrange the items into the correct order:'}</span>
              </p>

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

            <div className="space-y-2">
              {currentOrder.map((item, itemIdx) => (
                <div
                  key={`${item}_${itemIdx}`}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900/70 border border-slate-700/80 text-xs text-white"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-sky-600/30 text-sky-400 text-[11px] font-bold flex items-center justify-center">
                      {itemIdx + 1}
                    </span>
                    <span>{item}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={itemIdx === 0}
                      onClick={() => moveItem(itemIdx, 'up')}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-slate-300 hover:text-white"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={itemIdx === currentOrder.length - 1}
                      onClick={() => moveItem(itemIdx, 'down')}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-20 text-slate-300 hover:text-white"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {showAnswers && q.correctAnswer && (
              <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300">
                <span className="font-bold">Correct Order: </span>
                <span>
                  {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(' → ') : q.correctAnswer}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

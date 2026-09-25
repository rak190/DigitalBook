import React from 'react';
import { ExerciseQuestionDefinition } from '../../types';
import { Table, Check, X } from 'lucide-react';

interface TableCompletionCardProps {
  questions: ExerciseQuestionDefinition[];
  answers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  evaluations?: Record<string, { isCorrect: boolean; acceptedAnswers: string[]; hint?: string }>;
  showAnswers?: boolean;
}

export const TableCompletionCard: React.FC<TableCompletionCardProps> = ({
  questions,
  answers,
  onAnswerChange,
  evaluations = {},
  showAnswers = false,
}) => {
  return (
    <div className="space-y-4">
      {questions.map((q, idx) => {
        const qKey = q.id || `table_${idx}`;
        const headers = q.tableHeaders || ['Item', 'Definition / Value'];
        const rows = q.tableRows || [];

        return (
          <div
            key={qKey}
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3"
          >
            {q.prompt && (
              <p className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Table className="w-4 h-4 text-sky-400" />
                <span>{q.prompt}</span>
              </p>
            )}

            <div className="overflow-x-auto rounded-lg border border-slate-700/80">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/90 text-slate-300 font-bold border-b border-slate-700">
                  <tr>
                    {headers.map((h, hIdx) => (
                      <th key={hIdx} className="p-2.5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-900/40">
                      {row.map((cell, cIdx) => {
                        const isBlank = cell === '______' || cell.startsWith('{{');
                        if (!isBlank) {
                          return (
                            <td key={cIdx} className="p-2.5 text-slate-300 font-medium">
                              {cell}
                            </td>
                          );
                        }

                        const cellKey = `${qKey}_r${rIdx}_c${cIdx}`;
                        const cellVal = answers[cellKey] || '';
                        const evalInfo = evaluations[cellKey];

                        return (
                          <td key={cIdx} className="p-2">
                            <input
                              type="text"
                              value={cellVal}
                              onChange={(e) => onAnswerChange(cellKey, e.target.value)}
                              placeholder="..."
                              className={`w-full p-1.5 text-xs rounded bg-slate-900 text-white border outline-none font-medium ${
                                evalInfo
                                  ? evalInfo.isCorrect
                                    ? 'border-emerald-500/70 text-emerald-300'
                                    : 'border-amber-500/70 text-amber-300'
                                  : 'border-slate-700 focus:border-sky-500'
                              }`}
                            />
                            {showAnswers && evalInfo?.acceptedAnswers && (
                              <div className="text-[10px] text-emerald-300 font-bold mt-0.5">
                                {evalInfo.acceptedAnswers[0]}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

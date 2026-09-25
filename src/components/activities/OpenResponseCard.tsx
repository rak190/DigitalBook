import React, { useState } from 'react';
import { ExerciseQuestionDefinition } from '../../types';
import { Save, CheckCircle, HelpCircle, Eye, AlertCircle } from 'lucide-react';

interface OpenResponseCardProps {
  questions: ExerciseQuestionDefinition[];
  answers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  showAnswers?: boolean;
}

export const OpenResponseCard: React.FC<OpenResponseCardProps> = ({
  questions,
  answers,
  onAnswerChange,
  showAnswers: initialShowAnswers = false,
}) => {
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});
  const [selfCheckedKeys, setSelfCheckedKeys] = useState<Record<string, boolean>>({});

  const toggleReveal = (qKey: string) => {
    setRevealedKeys((prev) => ({ ...prev, [qKey]: !prev[qKey] }));
  };

  const handleSave = (qKey: string) => {
    setSavedKeys((prev) => ({ ...prev, [qKey]: true }));
    setTimeout(() => {
      setSavedKeys((prev) => ({ ...prev, [qKey]: false }));
    }, 2000);
  };

  const toggleSelfCheck = (qKey: string) => {
    setSelfCheckedKeys((prev) => ({ ...prev, [qKey]: !prev[qKey] }));
  };

  return (
    <div className="space-y-4">
      {/* Notice header */}
      <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-800/40 text-xs text-sky-300 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-sky-400 flex-shrink-0" />
        <span>
          Open-response activity: Write your own thoughts or response below. Use Self Check and Suggested Answer to review your work.
        </span>
      </div>

      {questions.map((q, idx) => {
        const qKey = q.id || `open_${idx}`;
        const val = answers[qKey] || '';
        const isRevealed = initialShowAnswers || revealedKeys[qKey];
        const isSaved = savedKeys[qKey];
        const isSelfChecked = selfCheckedKeys[qKey];
        const hasSuggested = Boolean(q.suggestedAnswer || q.explanation || (q.acceptedAnswers && q.acceptedAnswers.length > 0));

        return (
          <div
            key={qKey}
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 hover:border-slate-600 transition-colors space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-full bg-sky-600/30 text-sky-400 border border-sky-500/40 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {q.num || idx + 1}
              </span>
              <p className="text-sm font-semibold text-slate-100 leading-snug">
                {q.prompt || 'Write your response:'}
              </p>
            </div>

            <div className="pl-8 space-y-3">
              <textarea
                value={val}
                onChange={(e) => onAnswerChange(qKey, e.target.value)}
                placeholder="Type your answer, essay, or dialogue here..."
                rows={4}
                className="w-full p-3 rounded-lg border border-slate-700 bg-slate-900/90 text-white text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-sans leading-relaxed"
              />

              {/* Action Toolbar: Save Response, Self Check, Show Suggested Answer */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave(qKey)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaved ? 'Saved!' : 'Save Response'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleSelfCheck(qKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelfChecked
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{isSelfChecked ? 'Self Checked ✓' : 'Self Check'}</span>
                </button>

                {hasSuggested ? (
                  <button
                    type="button"
                    onClick={() => toggleReveal(qKey)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isRevealed ? 'Hide Suggested Answer' : 'Show Suggested Answer'}</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500 italic py-1">
                    No automatic answer key is available for this activity.
                  </span>
                )}
              </div>

              {/* Suggested Answer Card */}
              {isRevealed && hasSuggested && (
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-200 space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <CheckCircle className="w-3.5 h-3.5" /> Suggested Model Answer
                  </div>
                  <p className="leading-relaxed">
                    {q.suggestedAnswer || q.explanation || (q.acceptedAnswers && q.acceptedAnswers.join(', '))}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

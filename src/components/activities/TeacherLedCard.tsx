import React from 'react';
import { ExerciseQuestionDefinition } from '../../types';
import { Users, Presentation, MessageSquare } from 'lucide-react';

interface TeacherLedCardProps {
  questions: ExerciseQuestionDefinition[];
  answers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  showAnswers?: boolean;
}

export const TeacherLedCard: React.FC<TeacherLedCardProps> = ({
  questions,
  answers,
  onAnswerChange,
}) => {
  return (
    <div className="space-y-4">
      <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-300 flex items-center gap-2">
        <Presentation className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span>Teacher-Led Classroom Activity: Instructions for pair work, class discussions, and teacher facilitation.</span>
      </div>

      {questions.map((q, idx) => {
        const qKey = q.id || `teacher_${idx}`;
        const val = answers[qKey] || '';

        return (
          <div
            key={qKey}
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-full bg-amber-600/30 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {q.num || idx + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-white leading-snug">
                  {q.prompt}
                </p>
                {q.instruction && (
                  <p className="text-xs text-slate-400 mt-1 italic">
                    {q.instruction}
                  </p>
                )}
              </div>
            </div>

            <div className="pl-8 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                <span>Class / Student Notes:</span>
              </div>
              <textarea
                value={val}
                onChange={(e) => onAnswerChange(qKey, e.target.value)}
                placeholder="Record class conclusions, student responses, or vocabulary notes..."
                rows={3}
                className="w-full p-2.5 text-xs bg-slate-900/90 text-white border border-slate-700 rounded-lg outline-none focus:border-amber-500 transition-all font-sans leading-relaxed"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React from 'react';
import { ExerciseDefinition, OxfordBlank } from '../../types';
import { ExerciseTypeRegistry, ExerciseComponentProps } from './ExerciseTypeRegistry';
import { AlertCircle } from 'lucide-react';

interface ExerciseRendererProps {
  exercise: ExerciseDefinition;
  answers: Record<string, string>;
  onAnswerChange: (key: string, value: string) => void;
  evaluations?: Record<string, { isCorrect: boolean; acceptedAnswers: string[]; hint?: string }>;
  showAnswers?: boolean;
  activeBlankId?: string;
  onFocusBlank?: (id: string) => void;
  onPlayAudioTrack?: (trackId: string, title?: string) => void;
  sentences?: Array<{ num: number; text: string; blankIds: string[] }>;
  blanks?: Record<string, OxfordBlank>;
}

export const ExerciseRenderer: React.FC<ExerciseRendererProps> = ({
  exercise,
  answers,
  onAnswerChange,
  evaluations = {},
  showAnswers = false,
  activeBlankId,
  onFocusBlank,
  onPlayAudioTrack,
  sentences,
  blanks,
}) => {
  const Component = ExerciseTypeRegistry.get(exercise.type);

  if (!Component) {
    return (
      <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-300 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Unsupported activity type: "{exercise.type}".</span>
          <p className="mt-1 text-slate-400">
            Please register a renderer component in ExerciseTypeRegistry for this type.
          </p>
        </div>
      </div>
    );
  }

  // Synthesize sentences and blanks for gap-fill if not pre-parsed
  let effectiveSentences = sentences;
  let effectiveBlanks = blanks;

  if (
    (!effectiveSentences || effectiveSentences.length === 0) &&
    (exercise.type === 'gap-fill' || exercise.type === 'word-bank') &&
    exercise.questions
  ) {
    const sList: Array<{ num: number; text: string; blankIds: string[] }> = [];
    const bMap: Record<string, OxfordBlank> = {};

    exercise.questions.forEach((q, idx) => {
      const bId = q.id || `blank_${idx + 1}`;
      sList.push({
        num: q.num || idx + 1,
        text: q.prompt || '______',
        blankIds: [bId],
      });
      bMap[bId] = {
        id: bId,
        accepted: q.acceptedAnswers || (q.correctAnswer ? (Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]) : []),
        hint: q.hint,
      };
    });

    effectiveSentences = sList;
    effectiveBlanks = bMap;
  }

  const props: ExerciseComponentProps = {
    questions: exercise.questions || [],
    answers,
    onAnswerChange,
    evaluations,
    showAnswers,
    wordBank: exercise.wordBank,
    allowMultipleUse: exercise.wordBankConfig?.allowMultipleUse,
    sentences: effectiveSentences,
    blanks: effectiveBlanks,
    activeBlankId,
    onFocusBlank,
    onPlayAudioTrack,
  };

  return <Component {...props} />;
};

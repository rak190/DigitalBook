import React from 'react';
import { GenericExerciseType, ExerciseQuestionDefinition, OxfordBlank } from '../../types';
import { MultipleChoiceCard } from '../activity/MultipleChoiceCard';
import { GapFillCard } from '../activity/GapFillCard';
import { MultipleSelectionCard } from './MultipleSelectionCard';
import { TextInputCard } from './TextInputCard';
import { MatchingCard } from './MatchingCard';
import { DropdownCard } from './DropdownCard';
import { TrueFalseCard } from './TrueFalseCard';
import { OrderingCard } from './OrderingCard';
import { TableCompletionCard } from './TableCompletionCard';
import { OpenResponseCard } from './OpenResponseCard';
import { SpeakingCard } from './SpeakingCard';
import { SelfCheckCard } from './SelfCheckCard';
import { TeacherLedCard } from './TeacherLedCard';

export interface ExerciseComponentProps {
  questions: ExerciseQuestionDefinition[];
  answers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  evaluations?: Record<string, { isCorrect: boolean; acceptedAnswers: string[]; hint?: string }>;
  showAnswers?: boolean;
  wordBank?: string[];
  allowMultipleUse?: boolean;
  sentences?: Array<{ num: number; text: string; blankIds: string[] }>;
  blanks?: Record<string, OxfordBlank>;
  activeBlankId?: string;
  onFocusBlank?: (id: string) => void;
  onPlayAudioTrack?: (trackId: string, title?: string) => void;
}

export type ExerciseComponent = React.FC<ExerciseComponentProps>;

export class ExerciseTypeRegistry {
  private static registry: Map<GenericExerciseType, ExerciseComponent> = new Map();

  public static register(type: GenericExerciseType, component: ExerciseComponent): void {
    this.registry.set(type, component);
  }

  public static get(type: GenericExerciseType): ExerciseComponent | undefined {
    return this.registry.get(type);
  }

  public static has(type: GenericExerciseType): boolean {
    return this.registry.has(type);
  }
}

// ----------------------------------------------------------------------------
// Adapter components to normalize props for each exercise renderer
// ----------------------------------------------------------------------------

const MultipleChoiceAdapter: React.FC<ExerciseComponentProps> = ({
  questions,
  answers,
  onAnswerChange,
  evaluations,
  showAnswers,
}) => {
  // Normalize questions to OxfordQuestion format
  const normQuestions = questions.map((q, idx) => ({
    num: q.num || idx + 1,
    id: q.id || `q_${idx + 1}`,
    question: q.prompt,
    prompt: q.prompt,
    correct: Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer || (q.acceptedAnswers ? q.acceptedAnswers[0] : 'a'),
    options: (q.options || []).map((opt) =>
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    ),
  }));

  return (
    <MultipleChoiceCard
      questions={normQuestions}
      answers={answers}
      onAnswerChange={onAnswerChange}
      evaluations={evaluations}
      showAnswers={showAnswers}
    />
  );
};

const GapFillAdapter: React.FC<ExerciseComponentProps> = ({
  sentences = [],
  blanks = {},
  answers,
  onAnswerChange,
  evaluations,
  showAnswers,
  wordBank,
  allowMultipleUse,
  activeBlankId,
  onFocusBlank,
}) => {
  return (
    <GapFillCard
      sentences={sentences}
      blanks={blanks}
      answers={answers}
      onAnswerChange={onAnswerChange}
      evaluations={evaluations}
      showAnswers={showAnswers}
      wordBank={wordBank}
      activeBlankId={activeBlankId}
      onFocusBlank={onFocusBlank}
    />
  );
};

// Register all 16 core exercise types
ExerciseTypeRegistry.register('multiple-choice', MultipleChoiceAdapter);
ExerciseTypeRegistry.register('single-choice', MultipleChoiceAdapter);
ExerciseTypeRegistry.register('listening', MultipleChoiceAdapter);
ExerciseTypeRegistry.register('gap-fill', GapFillAdapter);
ExerciseTypeRegistry.register('word-bank', GapFillAdapter);
ExerciseTypeRegistry.register('multiple-selection', MultipleSelectionCard);
ExerciseTypeRegistry.register('text-input', TextInputCard);
ExerciseTypeRegistry.register('matching', MatchingCard);
ExerciseTypeRegistry.register('dropdown', DropdownCard);
ExerciseTypeRegistry.register('true-false', TrueFalseCard);
ExerciseTypeRegistry.register('ordering', OrderingCard);
ExerciseTypeRegistry.register('table-completion', TableCompletionCard);
ExerciseTypeRegistry.register('table-fill', TableCompletionCard);
ExerciseTypeRegistry.register('open-response', OpenResponseCard);
ExerciseTypeRegistry.register('speaking', SpeakingCard);
ExerciseTypeRegistry.register('self-check', SelfCheckCard);
ExerciseTypeRegistry.register('teacher-led', TeacherLedCard);

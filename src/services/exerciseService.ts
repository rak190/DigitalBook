import { ExerciseDefinition, BookId } from '../types';
import { BookService } from './bookService';

export interface ExerciseEvaluationResult {
  score: number;
  total: number;
  percentage: number;
  isPassed: boolean;
  questionResults: Record<
    string,
    {
      isCorrect: boolean;
      isSelfCheck: boolean;
      userAnswer: string;
      acceptedAnswers: string[];
      hint?: string;
      explanation?: string;
    }
  >;
}

export class ExerciseService {
  public static getExercise(bookId: BookId, exerciseId: string): ExerciseDefinition | undefined {
    const book = BookService.getBook(bookId);
    if (!book) return undefined;

    for (const page of Object.values(book.pages)) {
      if (page.exercises) {
        const found = page.exercises.find((ex) => ex.id === exerciseId);
        if (found) return found;
      }
    }
    return undefined;
  }

  public static getExercisesForPage(bookId: BookId, pageNum: number): ExerciseDefinition[] {
    const book = BookService.getBook(bookId);
    const page = book?.pages[pageNum];
    return page?.exercises || [];
  }

  /**
   * Normalizes answers for resilient ESL comparison:
   * Trims whitespace, lowercases, strips trailing punctuation, expands contractions.
   */
  public static normalizeAnswer(input: string): string {
    if (!input) return '';
    let text = input.trim().toLowerCase();

    // Standard ESL contractions
    const contractions: Record<string, string> = {
      "don't": 'do not',
      "doesn't": 'does not',
      "didn't": 'did not',
      "isn't": 'is not',
      "aren't": 'are not',
      "wasn't": 'was not',
      "weren't": 'were not',
      "can't": 'cannot',
      "couldn't": 'could not',
      "won't": 'will not',
      "i'm": 'i am',
      "you're": 'you are',
      "he's": 'he is',
      "she's": 'she is',
      "it's": 'it is',
      "we're": 'we are',
      "they're": 'they are',
      "i've": 'i have',
      "you've": 'you have',
      "we've": 'we have',
      "they've": 'they have',
    };

    for (const [contraction, expansion] of Object.entries(contractions)) {
      text = text.replace(new RegExp(`\\b${contraction}\\b`, 'g'), expansion);
    }

    // Collapse multiple spaces and remove non-alphanumeric trailing punctuation
    text = text.replace(/\s+/g, ' ').replace(/[.,!?;:'"()]/g, '').trim();
    return text;
  }

  /**
   * Checks if a student's answer matches any accepted answer.
   * Avoids fragile substring matching.
   */
  public static isAnswerCorrect(userAnswer: string, acceptedAnswers: string[]): boolean {
    if (!userAnswer || !acceptedAnswers || acceptedAnswers.length === 0) {
      return false;
    }

    const normUser = this.normalizeAnswer(userAnswer);
    if (!normUser) return false;

    return acceptedAnswers.some((accepted) => {
      const normAccepted = this.normalizeAnswer(accepted);
      // Exact normalized match or slash alternative (e.g., "in front of / before")
      if (normAccepted === normUser) return true;

      if (accepted.includes('/')) {
        const parts = accepted.split('/').map((p) => this.normalizeAnswer(p));
        if (parts.includes(normUser)) return true;
      }

      return false;
    });
  }

  /**
   * Evaluates an entire exercise against user responses.
   */
  public static evaluateExercise(
    exercise: ExerciseDefinition,
    userAnswers: Record<string, string>
  ): ExerciseEvaluationResult {
    let correctCount = 0;
    let autoGradedTotal = 0;
    const questionResults: ExerciseEvaluationResult['questionResults'] = {};

    exercise.questions.forEach((q) => {
      const userVal = userAnswers[q.id] || '';
      const rawAccepted = q.acceptedAnswers || (q.correctAnswer ? (Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]) : []);

      const isSelfCheck =
        exercise.type === 'open-response' ||
        exercise.type === 'self-check' ||
        exercise.type === 'speaking' ||
        rawAccepted.length === 0;

      if (isSelfCheck) {
        questionResults[q.id] = {
          isCorrect: userVal.trim().length > 0,
          isSelfCheck: true,
          userAnswer: userVal,
          acceptedAnswers: rawAccepted,
          hint: q.hint,
          explanation: q.explanation || 'Self-check response.',
        };
      } else {
        autoGradedTotal++;
        const correct = this.isAnswerCorrect(userVal, rawAccepted);
        if (correct) correctCount++;

        questionResults[q.id] = {
          isCorrect: correct,
          isSelfCheck: false,
          userAnswer: userVal,
          acceptedAnswers: rawAccepted,
          hint: q.hint,
          explanation: q.explanation,
        };
      }
    });

    const total = autoGradedTotal || exercise.questions.length || 1;
    const score = correctCount;
    const percentage = autoGradedTotal > 0 ? Math.round((score / autoGradedTotal) * 100) : 100;
    const isPassed = percentage >= (exercise.scoring?.passScore || 70);

    return {
      score,
      total,
      percentage,
      isPassed,
      questionResults,
    };
  }
}

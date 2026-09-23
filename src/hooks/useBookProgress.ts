import { useState, useEffect, useRef, useCallback } from 'react';
import { ExerciseAnswer, AnswerEvaluation, ExerciseItem, UserBookmark, UserNote, ScopedActivityState } from '../types';
import { StorageService } from '../services/storage';
import { dataService } from '../services/dataService';

export function useBookProgress(bookId: string = 'english-file-pre-int') {
  const storageKey = `digital_book_progress_${bookId}`;

  // Initialize state from scoped book storage
  const [answers, setAnswers] = useState<Record<string, ExerciseAnswer>>(() => {
    return StorageService.getBookData(bookId).answers;
  });
  const [completedActivities, setCompletedActivities] = useState<Record<string, boolean>>(() => {
    return StorageService.getBookData(bookId).completedActivities;
  });
  const [evaluations, setEvaluations] = useState<Record<string, AnswerEvaluation>>({});
  const [bookmarks, setBookmarks] = useState<UserBookmark[]>(() => {
    return StorageService.getBookData(bookId).bookmarks;
  });
  const [notes, setNotes] = useState<UserNote[]>(() => {
    return StorageService.getBookData(bookId).notes;
  });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync state whenever bookId changes
  useEffect(() => {
    const bookData = StorageService.getBookData(bookId);
    setAnswers(bookData.answers);
    setCompletedActivities(bookData.completedActivities);
    setBookmarks(bookData.bookmarks);
    setNotes(bookData.notes);
    setEvaluations({});
  }, [bookId]);

  // Sync answers with debounce to scoped book storage
  const persistAnswers = useCallback(
    (newAnswers: Record<string, ExerciseAnswer>) => {
      setSaveStatus('saving');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        StorageService.saveBookData(bookId, { answers: newAnswers });
        setSaveStatus('saved');
      }, 300);
    },
    [bookId]
  );

  const setAnswerValue = useCallback(
    (exerciseId: string, pageId: number, unitId: string, value: string | string[]) => {
      setAnswers((prev) => {
        const isCompleted = Array.isArray(value) ? value.length > 0 : value.trim().length > 0;
        const updatedItem: ExerciseAnswer = {
          exerciseId,
          pageId,
          unitId,
          value,
          answer: value,
          isCompleted,
          completed: isCompleted,
          lastUpdated: Date.now(),
        };
        const next = { ...prev, [exerciseId]: updatedItem };
        persistAnswers(next);
        return next;
      });

      // Clear stale evaluation on edit
      setEvaluations((prev) => {
        if (!prev[exerciseId]) return prev;
        const next = { ...prev };
        delete next[exerciseId];
        return next;
      });
    },
    [persistAnswers]
  );

  // Mark an activity as completed (or incomplete) and persist to scoped book storage
  const completeActivity = useCallback(
    (activityId: string, progress?: ScopedActivityState) => {
      const isDone = progress ? progress.isCompleted : true;
      setCompletedActivities((prev) => {
        const next = { ...prev, [activityId]: isDone };
        const bookData = StorageService.getBookData(bookId);
        const nextProgress = {
          ...bookData.activityProgress,
          ...(progress ? { [activityId]: progress } : {}),
        };
        StorageService.saveBookData(bookId, {
          completedActivities: next,
          activityProgress: nextProgress,
        });
        return next;
      });
    },
    [bookId]
  );

  // Check answers for a list of exercises
  const checkAnswers = useCallback(
    (exercises: ExerciseItem[]): { total: number; correct: number; percentage: number } => {
      const nextEvals: Record<string, AnswerEvaluation> = {};
      let autoGradedCount = 0;
      let correctCount = 0;

      exercises.forEach((ex) => {
        const userAns = answers[ex.id]?.value || '';
        const accepted =
          ex.acceptedAnswers && ex.acceptedAnswers.length > 0
            ? ex.acceptedAnswers
            : dataService.getAcceptedAnswers(ex.id);

        const isSelfCheck =
          ex.gradingType === 'self_check' ||
          ex.fieldType === 'textarea' ||
          ex.fieldType === 'speaking' ||
          accepted.length === 0;

        if (isSelfCheck) {
          nextEvals[ex.id] = {
            exerciseId: ex.id,
            isCorrect: true,
            isSelfCheck: true,
            userValue: userAns,
            acceptedAnswers: accepted,
            explanation: ex.explanation || 'Self-check / discussion question.',
            hint: ex.hint,
          };
        } else {
          autoGradedCount++;
          const normalize = (s: string) => s.trim().toLowerCase().replace(/[.,!?;:'"()]/g, '');
          const userStr = typeof userAns === 'string' ? normalize(userAns) : '';
          const isMatch = accepted.some((acc) => normalize(acc) === userStr);

          if (isMatch) correctCount++;

          nextEvals[ex.id] = {
            exerciseId: ex.id,
            isCorrect: isMatch,
            isSelfCheck: false,
            userValue: userAns,
            acceptedAnswers: accepted,
            explanation: ex.explanation,
            hint: ex.hint,
          };
        }
      });

      setEvaluations((prev) => ({ ...prev, ...nextEvals }));

      const percentage = autoGradedCount > 0 ? Math.round((correctCount / autoGradedCount) * 100) : 100;
      return {
        total: autoGradedCount,
        correct: correctCount,
        percentage,
      };
    },
    [answers]
  );

  // Reset actions
  const resetExercise = useCallback(
    (exerciseId: string) => {
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[exerciseId];
        persistAnswers(next);
        return next;
      });
      setEvaluations((prev) => {
        const next = { ...prev };
        delete next[exerciseId];
        return next;
      });
    },
    [persistAnswers]
  );

  const retryMistakes = useCallback(
    (exercises: ExerciseItem[]) => {
      setAnswers((prev) => {
        const next = { ...prev };
        exercises.forEach((ex) => {
          if (evaluations[ex.id] && !evaluations[ex.id].isCorrect && !evaluations[ex.id].isSelfCheck) {
            delete next[ex.id];
          }
        });
        persistAnswers(next);
        return next;
      });
      setEvaluations((prev) => {
        const next = { ...prev };
        exercises.forEach((ex) => {
          if (evaluations[ex.id] && !evaluations[ex.id].isCorrect && !evaluations[ex.id].isSelfCheck) {
            delete next[ex.id];
          }
        });
        return next;
      });
    },
    [evaluations, persistAnswers]
  );

  const resetPageAnswers = useCallback(
    (exercises: ExerciseItem[]) => {
      setAnswers((prev) => {
        const next = { ...prev };
        exercises.forEach((ex) => delete next[ex.id]);
        persistAnswers(next);
        return next;
      });
      setEvaluations((prev) => {
        const next = { ...prev };
        exercises.forEach((ex) => delete next[ex.id]);
        return next;
      });
    },
    [persistAnswers]
  );

  const resetAllProgress = useCallback(() => {
    StorageService.clearBookData(bookId);
    setAnswers({});
    setCompletedActivities({});
    setEvaluations({});
    setBookmarks([]);
    setNotes([]);
  }, [bookId]);

  // Bookmarks
  const toggleBookmark = useCallback(
    (pageNum: number, label?: string) => {
      setBookmarks((prev) => {
        const exists = prev.some((b) => b.pageNum === pageNum);
        const next = exists
          ? prev.filter((b) => b.pageNum !== pageNum)
          : [...prev, { pageNum, label: label || `Page ${pageNum}`, createdAt: Date.now() }];
        StorageService.saveBookData(bookId, { bookmarks: next });
        return next;
      });
    },
    [bookId]
  );

  const isBookmarked = useCallback(
    (pageNum: number) => {
      return bookmarks.some((b) => b.pageNum === pageNum);
    },
    [bookmarks]
  );

  // Notes
  const savePageNote = useCallback(
    (pageNum: number, content: string) => {
      setNotes((prev) => {
        const filtered = prev.filter((n) => n.pageNum !== pageNum);
        const next = content.trim()
          ? [...filtered, { pageNum, content, updatedAt: Date.now() }]
          : filtered;
        StorageService.saveBookData(bookId, { notes: next });
        return next;
      });
    },
    [bookId]
  );

  const getPageNote = useCallback(
    (pageNum: number) => {
      return notes.find((n) => n.pageNum === pageNum)?.content || '';
    },
    [notes]
  );

  const getPageProgress = useCallback(
    (pageExercises: ExerciseItem[]) => {
      const total = pageExercises.length;
      if (total === 0) return { total: 0, completed: 0, percentage: 0 };
      const completed = pageExercises.filter((ex) => answers[ex.id]?.isCompleted).length;
      return {
        total,
        completed,
        percentage: Math.round((completed / total) * 100),
      };
    },
    [answers]
  );

  const getOverallStats = useCallback(() => {
    const allAnswerItems = Object.values(answers);
    const completedCount = allAnswerItems.filter((a) => a.isCompleted).length;
    const completedActsCount = Object.values(completedActivities).filter(Boolean).length;
    return {
      totalAnswered: allAnswerItems.length,
      completedCount,
      completedActivitiesCount: completedActsCount,
      bookmarksCount: bookmarks.length,
      notesCount: notes.length,
    };
  }, [answers, completedActivities, bookmarks, notes]);

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return {
    storageKey,
    answers,
    completedActivities,
    completeActivity,
    evaluations,
    saveStatus,
    setAnswerValue,
    checkAnswers,
    retryMistakes,
    resetExercise,
    resetPageAnswers,
    resetAllProgress,
    getPageProgress,
    getOverallStats,
    bookmarks,
    toggleBookmark,
    isBookmarked,
    notes,
    savePageNote,
    getPageNote,
    reloadFromStorage: () => {
      const bookData = StorageService.getBookData(bookId);
      setAnswers(bookData.answers);
      setCompletedActivities(bookData.completedActivities);
      setBookmarks(bookData.bookmarks);
      setNotes(bookData.notes);
    },
  };
}

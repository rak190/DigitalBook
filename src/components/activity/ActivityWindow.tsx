import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { OxfordActivity, ScopedActivityState, OxfordBlank, ExerciseDefinition, GenericExerciseType } from '../../types';
import { Exercise } from '../../data/booksRegistry';
import { StorageService } from '../../services/storage';
import { ExerciseService } from '../../services/exerciseService';
import { ExerciseRenderer } from '../activities/ExerciseRenderer';
import {
  X,
  PanelRightClose,
  PanelRightOpen,
  Headphones,
  CheckCircle,
  HelpCircle,
  RotateCcw,
  Save,
  Check,
  KeyRound,
} from 'lucide-react';

interface ActivityWindowProps {
  activity: OxfordActivity | Exercise;
  isOpen: boolean;
  onClose: () => void;
  onPlayAudioTrack?: (trackId: string, title: string) => void;
  onCompleteActivity?: (activityId: string, progress?: ScopedActivityState) => void;
  isDocked?: boolean;
  onToggleDocked?: () => void;
  mobileView?: 'book' | 'exercise';
  bookId?: string;
  currentPage?: number;
  isPresentationMode?: boolean;
  showTeacherKey?: boolean;
}

function normalizeActivity(
  act: OxfordActivity | Exercise,
  bookId: string,
  pageNum: number
): OxfordActivity & { rawExercise?: Exercise } {
  if ('unitId' in act && 'pageId' in act && (act.questions || act.blanks)) {
    return act as OxfordActivity;
  }

  const exercise = act as Exercise;
  const isMc =
    exercise.type === 'multiple-choice' ||
    exercise.type === 'single-choice' ||
    exercise.type === 'listening';

  if (isMc) {
    const questions = exercise.questions.map((q, idx) => {
      const opts = (q.options || []).map((opt) => {
        const val = typeof opt === 'string' ? opt : (opt as any).value;
        const lbl = typeof opt === 'string' ? opt : (opt as any).label;
        return { value: val, label: lbl };
      });
      const correctStr = Array.isArray(q.correctAnswer)
        ? q.correctAnswer[0]
        : q.correctAnswer || '';
      return {
        num: idx + 1,
        id: q.id,
        question: q.prompt,
        correct: correctStr,
        options: opts,
      };
    });

    return {
      id: exercise.id,
      unitId: bookId,
      pageId: pageNum,
      bookPage: pageNum,
      title: exercise.title,
      instructions: exercise.instructions,
      type: exercise.type as any,
      audioTrack: exercise.audioTrack,
      hotspot: { x: 88, y: 10 },
      questions,
      rawExercise: exercise,
    };
  }

  // Gap fill or generic activities
  const blanks: Record<string, OxfordBlank> = {};
  const sentences = exercise.questions.map((q, idx) => {
    const bId = q.id;
    const acceptedAnswers = Array.isArray(q.correctAnswer)
      ? q.correctAnswer
      : q.correctAnswer
      ? [q.correctAnswer]
      : (q.acceptedAnswers || ['']);

    blanks[bId] = {
      id: bId,
      accepted: acceptedAnswers,
      label: `Blank ${idx + 1}`,
      hint: q.prompt,
    };

    let text = q.prompt || `Question ${idx + 1}: ______`;
    if (!text.includes('______')) {
      text = `${text} ______`;
    }

    return {
      num: idx + 1,
      text,
      blankIds: [bId],
    };
  });

  return {
    id: exercise.id,
    unitId: bookId,
    pageId: pageNum,
    bookPage: pageNum,
    title: exercise.title,
    instructions: exercise.instructions,
    type: exercise.type as any,
    audioTrack: exercise.audioTrack,
    hotspot: { x: 88, y: 10 },
    wordBank: exercise.wordBank,
    blanks,
    sentences,
    rawExercise: exercise,
  };
}

export const ActivityWindow: React.FC<ActivityWindowProps> = ({
  activity,
  isOpen,
  onClose,
  onPlayAudioTrack,
  onCompleteActivity,
  isDocked: controlledDocked,
  onToggleDocked,
  mobileView = 'exercise',
  bookId = 'english-file-pre-int',
  currentPage = 7,
  isPresentationMode = false,
  showTeacherKey = false,
}) => {
  const [internalDocked, setInternalDocked] = useState<boolean>(true);
  const isDocked = controlledDocked !== undefined ? controlledDocked : internalDocked;
  const toggleDocked = onToggleDocked || (() => setInternalDocked((prev) => !prev));

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<
    Record<string, { isCorrect: boolean; acceptedAnswers: string[]; hint?: string }>
  >({});
  const [showAnswers, setShowAnswers] = useState<boolean>(false);
  const [activeBlankId, setActiveBlankId] = useState<string | undefined>();
  const [scoreBanner, setScoreBanner] = useState<{
    score: number;
    total: number;
    percentage: number;
  } | null>(null);

  const normalized = normalizeActivity(activity, bookId, currentPage);

  const effectiveExercise: ExerciseDefinition = useMemo(() => {
    if (normalized.rawExercise) {
      return normalized.rawExercise;
    }
    if (normalized.type === 'multiple-choice' && normalized.questions) {
      return {
        id: normalized.id,
        title: normalized.title,
        instructions: normalized.instructions || '',
        type: 'multiple-choice',
        audioTrack: normalized.audioTrack,
        questions: normalized.questions.map((q) => ({
          id: q.id || `q_${q.num}`,
          num: q.num,
          prompt: q.question,
          options: q.options,
          correctAnswer: q.correct,
          acceptedAnswers: [q.correct],
        })),
      };
    }
    return {
      id: normalized.id,
      title: normalized.title,
      instructions: normalized.instructions || '',
      type: (normalized.type as GenericExerciseType) || 'gap-fill',
      audioTrack: normalized.audioTrack,
      wordBank: normalized.wordBank,
      questions: Object.entries(normalized.blanks || {}).map(([bId, blank], idx) => ({
        id: bId,
        num: idx + 1,
        prompt: blank.hint,
        acceptedAnswers: blank.accepted,
        correctAnswer: blank.accepted[0],
      })),
    };
  }, [normalized]);

  // Sync teacher key visibility if presentation mode requested it
  useEffect(() => {
    if (showTeacherKey || isPresentationMode) {
      setShowAnswers(showTeacherKey);
    }
  }, [showTeacherKey, isPresentationMode]);

  // Load saved progress from scoped book storage on open
  useEffect(() => {
    if (!isOpen) return;

    const bookData = StorageService.getBookData(bookId);
    const saved = bookData.activityProgress?.[normalized.id];

    if (saved && saved.answers) {
      setAnswers(saved.answers);
      if (saved.score !== undefined && saved.isCompleted) {
        evaluateCurrentAnswers(saved.answers);
      }
    } else {
      setAnswers({});
      setEvaluations({});
      setScoreBanner(null);
      if (!showTeacherKey) {
        setShowAnswers(false);
      }
    }
  }, [isOpen, normalized.id, bookId, showTeacherKey]);

  const handleAnswerChange = (itemKey: string, val: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [itemKey]: val };
      const bookData = StorageService.getBookData(bookId);
      const isCompleted = scoreBanner ? scoreBanner.score === scoreBanner.total : false;
      const state: ScopedActivityState = {
        answers: next,
        score: scoreBanner?.score,
        isCompleted,
        lastUpdated: Date.now(),
      };
      StorageService.saveBookData(bookId, {
        activityProgress: {
          ...bookData.activityProgress,
          [normalized.id]: state,
        },
      });
      return next;
    });

    if (evaluations[itemKey] && !evaluations[itemKey].isCorrect) {
      setEvaluations((prev) => {
        const next = { ...prev };
        delete next[itemKey];
        return next;
      });
    }
  };

  const evaluateCurrentAnswers = useCallback(
    (currentAnswers: Record<string, string>) => {
      const newEvals: Record<string, { isCorrect: boolean; acceptedAnswers: string[]; hint?: string }> =
        {};
      let correctCount = 0;
      let totalCount = 0;

      if (normalized.type === 'multiple-choice' && normalized.questions) {
        totalCount = normalized.questions.length;
        normalized.questions.forEach((q) => {
          const qKey = q.id || `q_${q.num}`;
          const val = (currentAnswers[qKey] || '').trim().toLowerCase();
          const isCorrect =
            val === q.correct.toLowerCase() ||
            Boolean(
              q.options &&
                q.options.some(
                  (opt) =>
                    opt.value.toLowerCase() === val &&
                    opt.label.toLowerCase() === q.correct.toLowerCase()
                )
            );
          if (isCorrect) correctCount++;
          newEvals[qKey] = {
            isCorrect,
            acceptedAnswers: [q.correct],
            hint: isCorrect ? undefined : 'Review listening audio track or question text',
          };
        });
      } else if (normalized.type === 'gap-fill' && normalized.blanks) {
        const blankEntries = Object.entries(normalized.blanks);
        totalCount = blankEntries.length;
        blankEntries.forEach(([bKey, meta]) => {
          const rawVal = (currentAnswers[bKey] || '').trim();
          const isCorrect = ExerciseService.isAnswerCorrect(rawVal, meta.accepted);
          if (isCorrect) correctCount++;
          newEvals[bKey] = {
            isCorrect,
            acceptedAnswers: meta.accepted,
            hint: isCorrect ? undefined : meta.hint,
          };
        });
      } else if (effectiveExercise.questions && effectiveExercise.questions.length > 0) {
        effectiveExercise.questions.forEach((q, idx) => {
          if (effectiveExercise.type === 'matching' && q.matchingPairs) {
            totalCount += q.matchingPairs.length;
            q.matchingPairs.forEach((pair, pIdx) => {
              const itemKey = pair.leftId || `${q.id || 'q'}_pair_${pIdx}`;
              const userVal = (currentAnswers[itemKey] || '').trim();
              const isCorrect = ExerciseService.isAnswerCorrect(userVal, [pair.right]);
              if (isCorrect) correctCount++;
              newEvals[itemKey] = {
                isCorrect,
                acceptedAnswers: [pair.right],
                hint: isCorrect ? undefined : `Match for ${pair.left}`,
              };
            });
          } else {
            totalCount++;
            const qKey = q.id || `q_${idx + 1}`;
            const val = (currentAnswers[qKey] || '').trim();
            const accepted =
              q.acceptedAnswers ||
              (q.correctAnswer
                ? Array.isArray(q.correctAnswer)
                  ? q.correctAnswer
                  : [q.correctAnswer]
                : []);
            const isSelfCheck =
              effectiveExercise.type === 'open-response' ||
              effectiveExercise.type === 'speaking' ||
              effectiveExercise.type === 'self-check' ||
              effectiveExercise.type === 'teacher-led' ||
              accepted.length === 0;

            if (isSelfCheck) {
              const isFilled = val.length > 0;
              if (isFilled) correctCount++;
              newEvals[qKey] = {
                isCorrect: isFilled,
                acceptedAnswers: accepted,
                hint: q.hint,
              };
            } else {
              const isCorrect = ExerciseService.isAnswerCorrect(val, accepted);
              if (isCorrect) correctCount++;
              newEvals[qKey] = {
                isCorrect,
                acceptedAnswers: accepted,
                hint: isCorrect ? undefined : q.hint || 'Review instructions or question text',
              };
            }
          }
        });
      }

      setEvaluations(newEvals);
      const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
      const banner = { score: correctCount, total: totalCount, percentage };
      setScoreBanner(banner);

      const isCompleted = correctCount === totalCount;
      const state: ScopedActivityState = {
        answers: currentAnswers,
        score: correctCount,
        isCompleted,
        lastUpdated: Date.now(),
      };

      if (onCompleteActivity) {
        onCompleteActivity(normalized.id, state);
      } else {
        const bookData = StorageService.getBookData(bookId);
        StorageService.saveBookData(bookId, {
          completedActivities: {
            ...bookData.completedActivities,
            ...(isCompleted ? { [normalized.id]: true } : {}),
          },
          activityProgress: {
            ...bookData.activityProgress,
            [normalized.id]: state,
          },
        });
      }

      return banner;
    },
    [normalized, bookId, onCompleteActivity]
  );

  const handleCheckAnswers = () => {
    evaluateCurrentAnswers(answers);
  };

  const handleReset = () => {
    if (window.confirm('Reset all answers for this activity?')) {
      setAnswers({});
      setEvaluations({});
      setScoreBanner(null);
      setShowAnswers(false);
      const resetState: ScopedActivityState = {
        answers: {},
        score: 0,
        isCompleted: false,
        lastUpdated: Date.now(),
      };
      if (onCompleteActivity) {
        onCompleteActivity(normalized.id, resetState);
      } else {
        const bookData = StorageService.getBookData(bookId);
        StorageService.saveBookData(bookId, {
          activityProgress: {
            ...bookData.activityProgress,
            [normalized.id]: resetState,
          },
          completedActivities: {
            ...bookData.completedActivities,
            [normalized.id]: false,
          },
        });
      }
    }
  };

  const handleSaveAndClose = () => {
    const isCompleted = scoreBanner ? scoreBanner.score === scoreBanner.total : false;
    const state: ScopedActivityState = {
      answers,
      score: scoreBanner?.score,
      isCompleted,
      lastUpdated: Date.now(),
    };
    if (onCompleteActivity) {
      onCompleteActivity(normalized.id, state);
    } else {
      const bookData = StorageService.getBookData(bookId);
      StorageService.saveBookData(bookId, {
        activityProgress: {
          ...bookData.activityProgress,
          [normalized.id]: state,
        },
        completedActivities: {
          ...bookData.completedActivities,
          [normalized.id]: isCompleted,
        },
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Activity Window"
      className={
        isDocked
          ? `fixed top-14 right-0 bottom-0 w-full sm:w-[460px] lg:w-[520px] bg-slateDark-900 border-l border-slate-800 shadow-2xl flex flex-col z-50 animate-slide-in-right ${
              mobileView === 'book' ? 'hidden lg:flex' : 'flex'
            }`
          : `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in ${
              mobileView === 'book' ? 'hidden lg:flex' : 'flex'
            }`
      }
    >
      <div
        className={
          isDocked
            ? 'flex flex-col h-full w-full overflow-hidden'
            : 'w-full max-w-3xl max-h-[90vh] bg-slateDark-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up'
        }
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slateDark-900/90 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-sky-600/30 text-sky-400 border border-sky-500/30">
                {normalized.type.toUpperCase()}
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                {normalized.title}
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-md line-clamp-2">
              {normalized.instructions}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Audio shortcut in header */}
            {normalized.audioTrack && (
              <button
                type="button"
                onClick={() =>
                  onPlayAudioTrack &&
                  onPlayAudioTrack(normalized.audioTrack!, `Track ${normalized.audioTrack}`)
                }
                className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title={`Listen to Audio Track ${normalized.audioTrack}`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-mono">{normalized.audioTrack}</span>
              </button>
            )}

            {/* Toggle Dock / Float */}
            <button
              type="button"
              onClick={toggleDocked}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDocked ? 'Float as Centered Modal' : 'Dock to Right Drawer'}
            >
              {isDocked ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Activity"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Teacher Answer Key Banner (Presentation Mode) */}
          {(showTeacherKey || isPresentationMode) && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
              <div className="flex items-center gap-2 font-bold">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Classroom Presentation Mode: Teacher Answer Key</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAnswers(!showAnswers)}
                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-[11px] border border-amber-500/40"
              >
                {showAnswers ? 'Hide Answers' : 'Reveal Answers'}
              </button>
            </div>
          )}

          {/* Score Banner */}
          {scoreBanner && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                scoreBanner.percentage === 100
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-500/50 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>
                  {scoreBanner.score} of {scoreBanner.total} correct ({scoreBanner.percentage}%)
                </span>
              </div>
              {scoreBanner.percentage === 100 && (
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  Completed!
                </span>
              )}
            </div>
          )}

          <ExerciseRenderer
            exercise={effectiveExercise}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            evaluations={evaluations}
            showAnswers={showAnswers}
            activeBlankId={activeBlankId}
            onFocusBlank={setActiveBlankId}
            onPlayAudioTrack={
              onPlayAudioTrack
                ? (trackId, title) => onPlayAudioTrack(trackId, title || `Track ${trackId}`)
                : undefined
            }
            sentences={normalized.sentences}
            blanks={normalized.blanks}
          />
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 border-t border-slate-800 bg-slateDark-950/80 flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCheckAnswers}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Check Answers</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAnswers(!showAnswers)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                showAnswers
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>{showAnswers ? 'Hide Answers' : 'Show Answers'}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reset Exercise"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveAndClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save & Close</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

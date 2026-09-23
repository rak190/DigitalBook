import React, { useState, useEffect, useCallback } from 'react';
import { OxfordActivity, ScopedActivityState } from '../../types';
import { MultipleChoiceCard } from './MultipleChoiceCard';
import { GapFillCard } from './GapFillCard';
import { StorageService } from '../../services/storage';
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
} from 'lucide-react';

interface ActivityWindowProps {
  activity: OxfordActivity;
  isOpen: boolean;
  onClose: () => void;
  onPlayAudioTrack?: (trackId: string, title: string) => void;
  onCompleteActivity?: (activityId: string) => void;
  isDocked?: boolean;
  onToggleDocked?: () => void;
  mobileView?: 'book' | 'exercise';
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
}) => {
  const [internalDocked, setInternalDocked] = useState<boolean>(true);
  const isDocked = controlledDocked !== undefined ? controlledDocked : internalDocked;
  const toggleDocked = onToggleDocked || (() => setInternalDocked((prev) => !prev));

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluations, setEvaluations] = useState<Record<string, { isCorrect: boolean; acceptedAnswers: string[]; hint?: string }>>({});
  const [showAnswers, setShowAnswers] = useState<boolean>(false);
  const [activeBlankId, setActiveBlankId] = useState<string | undefined>();
  const [scoreBanner, setScoreBanner] = useState<{ score: number; total: number; percentage: number } | null>(null);

  const storageKey = `${activity.unitId}_page${activity.bookPage || activity.pageId}_${activity.id}`;

  // Load saved progress from localStorage on open
  useEffect(() => {
    if (!isOpen) return;

    const saved = StorageService.getActivityProgress(storageKey);
    if (saved && saved.answers) {
      setAnswers(saved.answers);
      if (saved.score !== undefined && saved.isCompleted) {
        // Re-evaluate to restore visuals
        evaluateCurrentAnswers(saved.answers);
      }
    } else {
      setAnswers({});
      setEvaluations({});
      setScoreBanner(null);
      setShowAnswers(false);
    }
  }, [isOpen, activity.id, storageKey]);

  const handleAnswerChange = (itemKey: string, val: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [itemKey]: val };
      // Auto-save debounce / instant save
      const state: ScopedActivityState = {
        answers: next,
        score: scoreBanner?.score,
        isCompleted: scoreBanner ? scoreBanner.score === scoreBanner.total : false,
        lastUpdated: Date.now(),
      };
      StorageService.saveActivityProgress(storageKey, state);
      return next;
    });

    // Clear mistake highlight on edit
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
      const newEvals: Record<string, { isCorrect: boolean; acceptedAnswers: string[]; hint?: string }> = {};
      let correctCount = 0;
      let totalCount = 0;

      if (activity.type === 'multiple-choice' && activity.questions) {
        totalCount = activity.questions.length;
        activity.questions.forEach((q) => {
          const qKey = q.id || `q_${q.num}`;
          const val = (currentAnswers[qKey] || '').trim().toLowerCase();
          const isCorrect = val === q.correct.toLowerCase();
          if (isCorrect) correctCount++;
          newEvals[qKey] = {
            isCorrect,
            acceptedAnswers: [q.correct],
            hint: isCorrect ? undefined : 'Review listening audio track',
          };
        });
      } else if (activity.type === 'gap-fill' && activity.blanks) {
        const blankEntries = Object.entries(activity.blanks);
        totalCount = blankEntries.length;
        blankEntries.forEach(([bKey, meta]) => {
          const rawVal = (currentAnswers[bKey] || '').trim();
          // Normalize string (strip punctuation, lowercase)
          const normalizedVal = rawVal.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
          const acceptedNorm = meta.accepted.map((a) =>
            a.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim()
          );

          const isCorrect = acceptedNorm.includes(normalizedVal);
          if (isCorrect) correctCount++;
          newEvals[bKey] = {
            isCorrect,
            acceptedAnswers: meta.accepted,
            hint: isCorrect ? undefined : meta.hint,
          };
        });
      }

      setEvaluations(newEvals);
      const percentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
      const banner = { score: correctCount, total: totalCount, percentage };
      setScoreBanner(banner);

      const isCompleted = correctCount === totalCount;
      if (isCompleted && onCompleteActivity) {
        onCompleteActivity(activity.id);
      }

      // Persist state
      const state: ScopedActivityState = {
        answers: currentAnswers,
        score: correctCount,
        isCompleted,
        lastUpdated: Date.now(),
      };
      StorageService.saveActivityProgress(storageKey, state);

      return banner;
    },
    [activity, storageKey, onCompleteActivity]
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
      StorageService.saveActivityProgress(storageKey, {
        answers: {},
        isCompleted: false,
        lastUpdated: Date.now(),
      });
    }
  };

  const handleSaveAndClose = () => {
    const state: ScopedActivityState = {
      answers,
      score: scoreBanner?.score,
      isCompleted: scoreBanner ? scoreBanner.score === scoreBanner.total : false,
      lastUpdated: Date.now(),
    };
    StorageService.saveActivityProgress(storageKey, state);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Activity Window"
      className={
        isDocked
          ? `fixed top-14 right-0 bottom-0 w-full sm:w-[460px] lg:w-[520px] bg-slateDark-900 border-l border-slate-800 shadow-2xl flex-col z-50 animate-slide-in-right ${
              mobileView === 'book' ? 'hidden lg:flex' : 'flex'
            }`
          : `fixed inset-0 z-50 items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in ${
              mobileView === 'book' ? 'hidden lg:flex' : 'flex'
            }`
      }
    >
      <div
        className={
          isDocked
            ? 'flex flex-col h-full overflow-hidden'
            : 'w-full max-w-3xl max-h-[90vh] bg-slateDark-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up'
        }
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slateDark-900/90 flex items-center justify-between flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-sky-600/30 text-sky-400 border border-sky-500/30">
                {activity.type.toUpperCase()}
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                {activity.title}
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-md line-clamp-2">
              {activity.instructions}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Audio shortcut in header */}
            {activity.audioTrack && (
              <button
                type="button"
                onClick={() =>
                  onPlayAudioTrack &&
                  onPlayAudioTrack(activity.audioTrack!, `Track ${activity.audioTrack}`)
                }
                className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1 text-xs font-semibold"
                title={`Listen to Audio Track ${activity.audioTrack}`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-mono">{activity.audioTrack}</span>
              </button>
            )}

            {/* Toggle Dock / Float */}
            <button
              type="button"
              onClick={toggleDocked}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Activity"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
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

          {activity.type === 'multiple-choice' && activity.questions && (
            <MultipleChoiceCard
              questions={activity.questions}
              answers={answers}
              onAnswerChange={handleAnswerChange}
              evaluations={evaluations}
              showAnswers={showAnswers}
            />
          )}

          {activity.type === 'gap-fill' && activity.blanks && (
            <GapFillCard
              sentences={activity.sentences || []}
              blanks={activity.blanks}
              answers={answers}
              onAnswerChange={handleAnswerChange}
              evaluations={evaluations}
              showAnswers={showAnswers}
              wordBank={activity.wordBank}
              activeBlankId={activeBlankId}
              onFocusBlank={setActiveBlankId}
            />
          )}
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
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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

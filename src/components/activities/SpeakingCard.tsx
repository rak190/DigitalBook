import React, { useState } from 'react';
import { ExerciseQuestionDefinition } from '../../types';
import { Mic, Volume2, CheckCircle, Sparkles } from 'lucide-react';

interface SpeakingCardProps {
  questions: ExerciseQuestionDefinition[];
  answers: Record<string, string>;
  onAnswerChange: (questionKey: string, value: string) => void;
  showAnswers?: boolean;
}

export const SpeakingCard: React.FC<SpeakingCardProps> = ({
  questions,
  answers,
  onAnswerChange,
}) => {
  const [isRecording, setIsRecording] = useState<Record<string, boolean>>({});

  const handleSpeakModel = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.includes('en-GB') || v.lang.includes('en-US'));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const toggleRecording = (qKey: string) => {
    const active = isRecording[qKey];
    if (active) {
      setIsRecording((prev) => ({ ...prev, [qKey]: false }));
      onAnswerChange(qKey, 'recorded');
    } else {
      setIsRecording((prev) => ({ ...prev, [qKey]: true }));
      // Simulate stopping recording after 4s
      setTimeout(() => {
        setIsRecording((prev) => ({ ...prev, [qKey]: false }));
        onAnswerChange(qKey, 'recorded');
      }, 4000);
    }
  };

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => {
        const qKey = q.id || `speak_${idx}`;
        const hasRecorded = answers[qKey] === 'recorded';
        const modelText = q.modelAudioText || q.prompt || '';

        return (
          <div
            key={qKey}
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-full bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {q.num || idx + 1}
              </span>
              <p className="text-sm font-semibold text-white leading-snug">
                {q.prompt || 'Pronounce the target word or phrase clearly:'}
              </p>
            </div>

            <div className="pl-8 space-y-3">
              {/* Target phrase card */}
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-between gap-3">
                <span className="text-sm font-serif italic text-sky-300 font-semibold">
                  "{modelText}"
                </span>
                <button
                  type="button"
                  onClick={() => handleSpeakModel(modelText)}
                  className="px-2.5 py-1.5 rounded-lg bg-sky-600/25 hover:bg-sky-600/40 text-sky-300 border border-sky-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Listen to Model Pronunciation"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Listen Model</span>
                </button>
              </div>

              {/* Record / Practice Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleRecording(qKey)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                    isRecording[qKey]
                      ? 'bg-rose-600 text-white border-rose-400 animate-pulse ring-2 ring-rose-500/50'
                      : hasRecorded
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>
                    {isRecording[qKey]
                      ? 'Recording... (Speaking)'
                      : hasRecorded
                      ? 'Practice Again'
                      : 'Record Speaking'}
                  </span>
                </button>

                {hasRecorded && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Practice Recorded!
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

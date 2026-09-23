import React, { useState } from 'react';
import { ActiveTrack } from '../../hooks/useAudioPlayer';
import { Play, Pause, RotateCcw, RotateCw, Volume2, X, Upload, Sparkles, FileText, ChevronUp, ChevronDown } from 'lucide-react';

interface AudioPlayerProps {
  track: ActiveTrack;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSkipTime: (delta: number) => void;
  onChangePlaybackRate: (rate: number) => void;
  onClose: () => void;
  onOpenUpload: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  onTogglePlay,
  onSeek,
  onSkipTime,
  onChangePlaybackRate,
  onClose,
  onOpenUpload,
}) => {
  const [showTranscript, setShowTranscript] = useState(false);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      role="region"
      aria-label="Audio Player"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-slateDark-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-3 md:p-4 text-white animate-in slide-in-from-bottom duration-200"
    >
      {/* Top track info bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 truncate pr-2">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-xs font-bold text-white block truncate">
              {track.title || `Track ${track.trackId}`}
            </span>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              {track.isTTS ? (
                <span className="px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> TTS Fallback
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold">Official Course MP3</span>
              )}
              {track.page && <span>Page {track.page}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {track.isTTS && (
            <button
              onClick={onOpenUpload}
              className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 flex items-center gap-1 transition-colors"
              title="Upload authentic MP3 audio file"
            >
              <Upload className="w-3 h-3" />
              <span>Upload MP3</span>
            </button>
          )}
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className={`px-2 py-1 text-[11px] font-semibold rounded-lg border flex items-center gap-1 transition-colors ${
              showTranscript
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle Listening Script / Transcript"
          >
            <FileText className="w-3 h-3" />
            <span className="hidden sm:inline">Script</span>
            {showTranscript ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Close player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Listening Script / Transcript Card */}
      {showTranscript && (
        <div className="mb-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 max-h-40 overflow-y-auto leading-relaxed shadow-inner">
          <div className="font-bold text-sky-400 text-[11px] mb-1 uppercase tracking-wider">
            Listening Script
          </div>
          {track.transcript ? (
            <div className="whitespace-pre-line font-sans text-slate-200">
              {track.transcript}
            </div>
          ) : (
            <p className="text-slate-500 italic">No listening script registered for this track.</p>
          )}
        </div>
      )}

      {/* Scrub Bar */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-mono text-slate-400 w-9 text-right">
          {formatTime(currentTime)}
        </span>
        <div
          className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            onSeek(pos * duration);
          }}
        >
          <div
            className="h-full bg-sky-500 rounded-full transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-[11px] font-mono text-slate-400 w-12 text-left">
          -{formatTime(Math.max(0, duration - currentTime))}
        </span>
      </div>

      {/* Player Controls */}
      <div className="flex items-center justify-between gap-2">
        {/* Playback speed presets: 0.8x, 1.0x, 1.2x */}
        <div className="flex items-center gap-1">
          {[0.8, 1.0, 1.2].map((rate) => (
            <button
              key={rate}
              onClick={() => onChangePlaybackRate(rate)}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                Math.abs(playbackRate - rate) < 0.05
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Play / Skip / Pause controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSkipTime(-10)}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 transition-transform active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={() => onSkipTime(10)}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Forward 10 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-1.5 w-24">
          <Volume2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            defaultValue="1"
            className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            title="Volume"
          />
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ActiveTrack } from '../../hooks/useAudioPlayer';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  X,
  Upload,
  FileText,
  ChevronUp,
  ChevronDown,
  Repeat,
  Sparkles,
  AlertTriangle,
  Type,
} from 'lucide-react';

interface AudioPlayerProps {
  track: ActiveTrack;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume?: number;
  isMuted?: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSkipTime: (delta: number) => void;
  onChangePlaybackRate: (rate: number) => void;
  onSetVolume?: (v: number) => void;
  onToggleMute?: () => void;
  onClose: () => void;
  onOpenUpload: () => void;
  onPlaySpeechSynthesis?: () => void;
  loopA?: number | null;
  loopB?: number | null;
  isLoopActive?: boolean;
  onSetLoopA?: () => void;
  onSetLoopB?: () => void;
  onClearLoop?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  volume = 1.0,
  isMuted = false,
  onTogglePlay,
  onSeek,
  onSkipTime,
  onChangePlaybackRate,
  onSetVolume,
  onToggleMute,
  onClose,
  onOpenUpload,
  onPlaySpeechSynthesis,
  loopA = null,
  loopB = null,
  isLoopActive = false,
  onSetLoopA,
  onSetLoopB,
  onClearLoop,
}) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const [isLargeScript, setIsLargeScript] = useState(false);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const loopAPercent = loopA !== null && duration > 0 ? (loopA / duration) * 100 : null;
  const loopBPercent = loopB !== null && duration > 0 ? (loopB / duration) * 100 : null;

  return (
    <div
      role="region"
      aria-label="Audio Player"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-3xl bg-slateDark-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-3 md:p-4 text-white animate-in slide-in-from-bottom duration-200"
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
              {track.audioUnavailable ? (
                <span className="px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-400" /> Course audio unavailable
                </span>
              ) : track.isTTS ? (
                <span className="px-1.5 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Device Speech Pronunciation
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold">Authentic Course Audio</span>
              )}
              {track.page && <span>&bull; Page {track.page}</span>}
            </div>
          </div>
        </div>

        {/* Action buttons on top right */}
        <div className="flex items-center gap-1.5">
          {track.audioUnavailable && onPlaySpeechSynthesis && (
            <button
              type="button"
              onClick={onPlaySpeechSynthesis}
              className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/40 flex items-center gap-1 transition-colors cursor-pointer"
              title="Play pronunciation using device speech synthesis"
            >
              <Sparkles className="w-3 h-3" />
              <span>Use Device Speech</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenUpload}
            className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 transition-colors"
            title="Upload MP3 file"
          >
            <Upload className="w-3 h-3" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTranscript(!showTranscript)}
            className={`px-2 py-1 text-[11px] font-semibold rounded-lg border flex items-center gap-1 transition-colors cursor-pointer ${
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
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close player"
            aria-label="Close audio player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Listening Script / Transcript Panel */}
      {showTranscript && (
        <div className="mb-3 p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-300 max-h-48 overflow-y-auto leading-relaxed shadow-inner">
          <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800/80">
            <span className="font-bold text-sky-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Listening Script / Transcript
            </span>
            <button
              type="button"
              onClick={() => setIsLargeScript(!isLargeScript)}
              className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700 flex items-center gap-1"
              title="Toggle Large Text for Projector"
            >
              <Type className="w-3 h-3" />
              <span>{isLargeScript ? 'Normal Text' : 'Large Text (Projector)'}</span>
            </button>
          </div>
          {track.transcript ? (
            <div
              className={`whitespace-pre-line font-sans text-slate-200 transition-all ${
                isLargeScript ? 'text-base sm:text-lg leading-loose font-medium' : 'text-xs'
              }`}
            >
              {track.transcript}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-2">
              No listening script is available for this track.
            </p>
          )}
        </div>
      )}

      {/* Timeline Scrub Bar with A/B Loop Markers */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-mono text-slate-400 w-9 text-right select-none">
          {formatTime(currentTime)}
        </span>
        <div
          className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden cursor-pointer relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            onSeek(pos * duration);
          }}
        >
          {/* Loop Region Highlight */}
          {loopAPercent !== null && loopBPercent !== null && (
            <div
              className="absolute top-0 bottom-0 bg-amber-500/30 z-0 border-x border-amber-400"
              style={{
                left: `${loopAPercent}%`,
                width: `${Math.max(0, loopBPercent - loopAPercent)}%`,
              }}
            />
          )}

          {/* Progress Bar */}
          <div
            className="h-full bg-sky-500 rounded-full transition-all duration-75 relative z-10"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-[11px] font-mono text-slate-400 w-12 text-left select-none">
          -{formatTime(Math.max(0, duration - currentTime))}
        </span>
      </div>

      {/* Bottom Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Playback speed presets: 0.75x, 0.8x, 1.0x, 1.2x, 1.5x */}
        <div className="flex items-center gap-1">
          {[0.75, 0.8, 1.0, 1.2, 1.5].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => onChangePlaybackRate(rate)}
              className={`px-1.5 sm:px-2 py-0.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
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
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onSkipTime(-10)}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Rewind 10 seconds"
            aria-label="Rewind 10 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 transition-transform active:scale-95 cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => onSkipTime(10)}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Forward 10 seconds"
            aria-label="Forward 10 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* A/B Loop and Volume Controls */}
        <div className="flex items-center gap-2">
          {/* A/B Loop Controls */}
          <div className="flex items-center gap-1 bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/80">
            <button
              type="button"
              onClick={onSetLoopA}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                loopA !== null ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title={loopA !== null ? `Loop A set at ${formatTime(loopA)}` : 'Set Loop Start (A)'}
              aria-label="Set Loop Point A"
            >
              A
            </button>
            <button
              type="button"
              onClick={onSetLoopB}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                loopB !== null ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title={loopB !== null ? `Loop B set at ${formatTime(loopB)}` : 'Set Loop End (B)'}
              aria-label="Set Loop Point B"
            >
              B
            </button>
            {isLoopActive && onClearLoop && (
              <button
                type="button"
                onClick={onClearLoop}
                className="px-1.5 py-0.5 text-[10px] font-semibold text-rose-300 hover:text-white bg-rose-950/60 rounded"
                title="Clear A/B Loop"
              >
                Clear
              </button>
            )}
          </div>

          {/* Volume & Mute */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleMute}
              className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onSetVolume && onSetVolume(parseFloat(e.target.value))}
              className="w-14 sm:w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              title="Volume"
              aria-label="Volume slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

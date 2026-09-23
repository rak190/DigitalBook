import React from 'react';
import { ActivityHotspot } from '../../types';
import { Headphones, Edit3, Check } from 'lucide-react';

interface ActivityHotspotBadgeProps {
  hotspot: ActivityHotspot;
  isCompleted?: boolean;
  onOpenActivity?: (activityId: string) => void;
  onPlayAudioTrack?: (trackId: string, title: string) => void;
}

export const ActivityHotspotBadge: React.FC<ActivityHotspotBadgeProps> = ({
  hotspot,
  isCompleted = false,
  onOpenActivity,
  onPlayAudioTrack,
}) => {
  const isAudio = hotspot.type === 'audio';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAudio) {
      if (hotspot.audioTrackId && onPlayAudioTrack) {
        onPlayAudioTrack(hotspot.audioTrackId, hotspot.title || `Track ${hotspot.audioTrackId}`);
      }
    } else {
      if (hotspot.activityId && onOpenActivity) {
        onOpenActivity(hotspot.activityId);
      }
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${hotspot.x}%`,
        top: `${hotspot.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      className="pointer-events-auto z-20 group"
    >
      <button
        type="button"
        onClick={handleClick}
        className={`relative flex items-center justify-center gap-1 px-2.5 py-1 rounded-full shadow-lg font-bold text-xs transition-all duration-200 cursor-pointer select-none hover:scale-110 active:scale-95 ${
          isAudio
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-white/80'
            : isCompleted
            ? 'bg-emerald-700 hover:bg-emerald-600 text-white ring-2 ring-emerald-400'
            : 'bg-sky-600 hover:bg-sky-500 text-white ring-2 ring-white/80'
        }`}
        title={hotspot.title}
        aria-label={hotspot.title}
      >
        {isAudio ? (
          <>
            <Headphones className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">{hotspot.label}</span>
          </>
        ) : (
          <>
            <Edit3 className="w-3.5 h-3.5" />
            <span>{hotspot.label}</span>
            {isCompleted && (
              <span className="w-3.5 h-3.5 rounded-full bg-white text-emerald-700 flex items-center justify-center ml-0.5 shadow-sm">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}
          </>
        )}
      </button>

      {/* Hover tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-0.5 rounded bg-slate-900/95 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md z-30 border border-slate-700">
        {hotspot.title}
      </div>
    </div>
  );
};

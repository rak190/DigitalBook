import React from 'react';
import { ActivityHotspot, ImageRegionDefinition } from '../../types';
import { ActivityHotspotBadge } from './ActivityHotspotBadge';
import { dataService } from '../../services/dataService';

interface PageOverlayProps {
  pageNum: number;
  hotspots?: ActivityHotspot[];
  imageRegions?: ImageRegionDefinition[];
  completedActivities?: Record<string, boolean>;
  onOpenActivity?: (activityId: string) => void;
  onPlayAudioTrack?: (trackId: string, title: string) => void;
  onOpenImage?: (regionId: string) => void;
  isPresentationMode?: boolean;
  showTeacherKey?: boolean;
  teacherAnswers?: Record<string, string>;
}

export const PageOverlay: React.FC<PageOverlayProps> = ({
  pageNum,
  hotspots,
  imageRegions = [],
  completedActivities = {},
  onOpenActivity,
  onPlayAudioTrack,
  onOpenImage,
  isPresentationMode = false,
  showTeacherKey = false,
  teacherAnswers = {},
}) => {
  const pageHotspots = hotspots || dataService.getHotspotsForPage(pageNum);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Interactive Clickable Image Regions (Transparent Hitboxes with subtle hover) */}
      {imageRegions.map((region) => (
        <div
          key={region.id}
          role="button"
          tabIndex={0}
          aria-label={`View Image: ${region.title}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenImage) onOpenImage(region.id);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (onOpenImage) onOpenImage(region.id);
            }
          }}
          style={{
            position: 'absolute',
            left: `${region.x}%`,
            top: `${region.y}%`,
            width: `${region.width}%`,
            height: `${region.height}%`,
          }}
          className="pointer-events-auto cursor-zoom-in rounded-xl border-2 border-transparent hover:border-sky-400/60 hover:bg-sky-400/10 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all duration-200 group"
          title={`Click to enlarge: ${region.title}`}
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none flex items-center gap-1 border border-slate-700">
            <span>🔍 Focus Image</span>
          </div>
        </div>
      ))}

      {/* Discrete Activity & Audio Hotspot Badges */}
      {pageHotspots.map((hotspot) => {
        const isCompleted = hotspot.activityId
          ? !!completedActivities[hotspot.activityId]
          : false;

        const answerText = hotspot.activityId ? teacherAnswers[hotspot.activityId] : undefined;

        return (
          <ActivityHotspotBadge
            key={hotspot.id}
            hotspot={hotspot}
            isCompleted={isCompleted}
            onOpenActivity={onOpenActivity}
            onPlayAudioTrack={onPlayAudioTrack}
            onOpenImage={onOpenImage}
            isPresentationMode={isPresentationMode}
            showTeacherKey={showTeacherKey}
            teacherAnswerText={answerText}
          />
        );
      })}
    </div>
  );
};

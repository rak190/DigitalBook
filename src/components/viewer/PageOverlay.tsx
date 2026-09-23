import React from 'react';
import { ActivityHotspot } from '../../types';
import { ActivityHotspotBadge } from './ActivityHotspotBadge';
import { dataService } from '../../services/dataService';

interface PageOverlayProps {
  pageNum: number;
  hotspots?: ActivityHotspot[];
  completedActivities?: Record<string, boolean>;
  onOpenActivity?: (activityId: string) => void;
  onPlayAudioTrack?: (trackId: string, title: string) => void;
  isPresentationMode?: boolean;
  showTeacherKey?: boolean;
  teacherAnswers?: Record<string, string>;
}

export const PageOverlay: React.FC<PageOverlayProps> = ({
  pageNum,
  hotspots,
  completedActivities = {},
  onOpenActivity,
  onPlayAudioTrack,
  isPresentationMode = false,
  showTeacherKey = false,
  teacherAnswers = {},
}) => {
  const pageHotspots = hotspots || dataService.getHotspotsForPage(pageNum);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
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
            isPresentationMode={isPresentationMode}
            showTeacherKey={showTeacherKey}
            teacherAnswerText={answerText}
          />
        );
      })}
    </div>
  );
};

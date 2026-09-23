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
}

export const PageOverlay: React.FC<PageOverlayProps> = ({
  pageNum,
  hotspots,
  completedActivities = {},
  onOpenActivity,
  onPlayAudioTrack,
}) => {
  const pageHotspots = hotspots || dataService.getHotspotsForPage(pageNum);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {pageHotspots.map((hotspot) => {
        const isCompleted = hotspot.activityId
          ? !!completedActivities[hotspot.activityId]
          : false;

        return (
          <ActivityHotspotBadge
            key={hotspot.id}
            hotspot={hotspot}
            isCompleted={isCompleted}
            onOpenActivity={onOpenActivity}
            onPlayAudioTrack={onPlayAudioTrack}
          />
        );
      })}
    </div>
  );
};

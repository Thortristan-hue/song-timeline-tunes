
import React from 'react';
import { MusicRemoteControl } from '@/components/MusicRemoteControl';

interface AudioPlayerProps {
  src: string | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  className?: string;
  disabled?: boolean;
  roomId: string;
  trackId?: string;
}

export function AudioPlayer({
  src,
  isPlaying,
  onPlayPause,
  className,
  disabled = false,
  roomId,
  trackId
}: AudioPlayerProps) {
  return (
    <MusicRemoteControl
      roomId={roomId}
      trackUrl={src}
      trackId={trackId}
      isPlaying={isPlaying}
      className={className}
      disabled={disabled}
    />
  );
}

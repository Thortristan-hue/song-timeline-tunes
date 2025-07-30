import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MysterySongControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  disabled?: boolean;
  className?: string;
}

export function MysterySongControls({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  disabled = false,
  className
}: MysterySongControlsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-4 p-4", className)}>
      <Button
        onClick={onPlay}
        disabled={disabled || isPlaying}
        size="lg"
        className="bg-green-600 hover:bg-green-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
      >
        <Play className="h-6 w-6 ml-1" />
      </Button>
      
      <Button
        onClick={onPause}
        disabled={disabled || !isPlaying}
        size="lg"
        className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
      >
        <Pause className="h-6 w-6" />
      </Button>
      
      <Button
        onClick={onStop}
        disabled={disabled}
        size="lg"
        className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
      >
        <Square className="h-6 w-6" />
      </Button>
    </div>
  );
}
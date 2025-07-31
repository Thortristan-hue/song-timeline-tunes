import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface MusicRemoteControlProps {
  roomId: string;
  trackUrl?: string | null;
  trackId?: string;
  isPlaying: boolean;
  className?: string;
  disabled?: boolean;
}

export function MusicRemoteControl({
  roomId,
  trackUrl,
  trackId,
  isPlaying,
  className,
  disabled = false
}: MusicRemoteControlProps) {
  const [isLoading, setIsLoading] = useState(false);

  const triggerMusicControl = async (action: 'play' | 'pause' | 'stop') => {
    if (isLoading || disabled) return;

    try {
      setIsLoading(true);
      console.log('[MusicRemoteControl] Triggering music action:', action);
      
      const { data, error } = await supabase.functions.invoke('trigger-music-control', {
        body: {
          roomId,
          action,
          trackId,
          trackUrl,
          position: 0 // Could be enhanced to remember position
        }
      });

      if (error) {
        console.error('[MusicRemoteControl] Error triggering music action:', error);
        throw error;
      }

      console.log('[MusicRemoteControl] Music action triggered successfully:', data);
      
    } catch (error) {
      console.error('[MusicRemoteControl] Failed to trigger music action:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    const action = isPlaying ? 'pause' : 'play';
    triggerMusicControl(action);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        onClick={handlePlayPause}
        size="sm"
        variant="outline"
        className="flex items-center gap-1"
        disabled={disabled || !trackUrl || isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
        {isLoading && <span className="text-xs">Loading...</span>}
        {disabled && !isLoading && <span className="text-xs">No Track</span>}
      </Button>
      <Volume2 className="h-3 w-3 text-muted-foreground" />
    </div>
  );
}
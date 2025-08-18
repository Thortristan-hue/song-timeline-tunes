import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface RemoteAudioPlayerProps {
  src: string | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  className?: string;
  disabled?: boolean;
  roomId: string;
  songData?: {
    id: string;
    deezer_title: string;
    deezer_artist: string;
  };
}

export function RemoteAudioPlayer({
  src,
  isPlaying,
  onPlayPause,
  className,
  disabled = false,
  roomId,
  songData
}: RemoteAudioPlayerProps) {

  const triggerAudioAction = async (action: 'play' | 'pause' | 'stop') => {
    try {
      console.log('[RemoteAudioPlayer] Triggering audio action:', action);
      
      const { data, error } = await supabase.functions.invoke('trigger-audio', {
        body: {
          roomId,
          action,
          songData: songData ? {
            id: songData.id,
            preview_url: src,
            deezer_title: songData.deezer_title,
            deezer_artist: songData.deezer_artist
          } : undefined
        }
      });

      if (error) {
        console.error('[RemoteAudioPlayer] Error triggering audio action:', error);
        throw error;
      }

      console.log('[RemoteAudioPlayer] Audio action triggered successfully:', data);
      
      // Call the local callback to update UI state
      onPlayPause();
      
    } catch (error) {
      console.error('[RemoteAudioPlayer] Failed to trigger audio action:', error);
    }
  };

  const handlePlayPause = () => {
    const action = isPlaying ? 'pause' : 'play';
    triggerAudioAction(action);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        onClick={handlePlayPause}
        size="sm"
        variant="outline"
        className="flex items-center gap-1"
        disabled={disabled || !src}
      >
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        {disabled && <span className="text-xs">Loading...</span>}
      </Button>
      <Volume2 className="h-3 w-3 text-muted-foreground" />
    </div>
  );
}

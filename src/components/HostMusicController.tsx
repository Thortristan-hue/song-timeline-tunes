import React, { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import { supabase } from '@/integrations/supabase/client';

interface HostMusicControllerProps {
  roomId: string;
  isHost: boolean;
}

interface MusicControlEvent {
  action: 'play' | 'pause' | 'stop';
  trackId?: string;
  trackUrl?: string;
  position?: number;
  timestamp: number;
}

export function HostMusicController({ roomId, isHost }: HostMusicControllerProps) {
  const musicRef = useRef<Howl | null>(null);
  const currentTrackRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isHost) return;

    console.log('[HostMusicController] Setting up music control for host in room:', roomId);

    // Subscribe to music control events
    const channel = supabase
      .channel(`room-${roomId}`)
      .on('broadcast', { event: 'music-control' }, (payload) => {
        console.log('[HostMusicController] Received music control event:', payload);
        handleMusicControl(payload.payload);
      })
      .subscribe();

    return () => {
      console.log('[HostMusicController] Cleaning up music controller');
      if (musicRef.current) {
        musicRef.current.unload();
        musicRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [roomId, isHost]);

  const handleMusicControl = async (event: MusicControlEvent) => {
    if (!isHost) return;

    console.log('[HostMusicController] Processing music control:', event);
    setIsLoading(true);

    try {
      switch (event.action) {
        case 'play':
          if (event.trackUrl) {
            // If new track, load it first
            if (currentTrackRef.current !== event.trackUrl) {
              // Unload previous track
              if (musicRef.current) {
                musicRef.current.unload();
                musicRef.current = null;
              }

              // Load new track
              musicRef.current = new Howl({
                src: [event.trackUrl],
                html5: true,
                volume: 0.6,
                preload: true,
                onload: () => {
                  console.log('[HostMusicController] Track loaded successfully');
                  setIsLoading(false);
                },
                onloaderror: (id, error) => {
                  console.error('[HostMusicController] Track load failed:', error);
                  setIsLoading(false);
                },
                onplay: () => {
                  console.log('[HostMusicController] Music playback started');
                },
                onpause: () => {
                  console.log('[HostMusicController] Music playback paused');
                },
                onend: () => {
                  console.log('[HostMusicController] Music playback ended');
                }
              });

              currentTrackRef.current = event.trackUrl;
            }

            // Stop any other playing audio first
            const allAudio = document.querySelectorAll('audio');
            allAudio.forEach(otherAudio => {
              if (!otherAudio.paused) {
                otherAudio.pause();
                otherAudio.currentTime = 0;
              }
            });

            // Play the music
            if (musicRef.current) {
              if (event.position) {
                musicRef.current.seek(event.position);
              }
              musicRef.current.play();
            }
          }
          break;

        case 'pause':
          if (musicRef.current) {
            musicRef.current.pause();
          }
          break;

        case 'stop':
          if (musicRef.current) {
            musicRef.current.stop();
          }
          break;

        default:
          console.warn('[HostMusicController] Unknown music action:', event.action);
      }
    } catch (error) {
      console.error('[HostMusicController] Error handling music control:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Only render for host, and it's invisible
  if (!isHost) return null;

  return (
    <div style={{ display: 'none' }} data-component="host-music-controller">
      {isLoading && <span>Loading music...</span>}
    </div>
  );
}
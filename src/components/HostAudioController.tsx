
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HostAudioControllerProps {
  roomId: string;
  isHost: boolean;
}

export function HostAudioController({ roomId, isHost }: HostAudioControllerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSourceRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isHost) return;

    console.log('[HostAudioController] Setting up audio control for host in room:', roomId);

    // Create audio element for host
    audioRef.current = new Audio();
    audioRef.current.crossOrigin = 'anonymous';
    audioRef.current.volume = 0.5;

    // Subscribe to audio control events
    const channel = supabase
      .channel(`room-audio-${roomId}`)
      .on('broadcast', { event: 'audio-control' }, (payload) => {
        console.log('[HostAudioController] Received audio control event:', payload);
        handleAudioControl(payload.payload);
      })
      .subscribe();

    return () => {
      console.log('[HostAudioController] Cleaning up audio controller');
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [roomId, isHost]);

  const handleAudioControl = async (event: any) => {
    const audio = audioRef.current;
    if (!audio) return;

    console.log('[HostAudioController] Processing audio control:', event);

    try {
      switch (event.action) {
        case 'play':
          if (event.songData?.preview_url) {
            // If new song, load it first
            if (currentSourceRef.current !== event.songData.preview_url) {
              audio.src = event.songData.preview_url;
              currentSourceRef.current = event.songData.preview_url;
              audio.load();
            }
            
            // Stop any other playing audio
            const allAudio = document.querySelectorAll('audio');
            allAudio.forEach(otherAudio => {
              if (otherAudio !== audio && !otherAudio.paused) {
                otherAudio.pause();
                otherAudio.currentTime = 0;
              }
            });

            const playPromise = audio.play();
            if (playPromise) {
              playPromise
                .then(() => {
                  console.log('[HostAudioController] Audio playback started successfully');
                })
                .catch(error => {
                  console.error('[HostAudioController] Audio play failed:', error);
                });
            }
          }
          break;

        case 'pause':
          audio.pause();
          console.log('[HostAudioController] Audio paused');
          break;

        case 'stop':
          audio.pause();
          audio.currentTime = 0;
          console.log('[HostAudioController] Audio stopped');
          break;

        default:
          console.warn('[HostAudioController] Unknown audio action:', event.action);
      }
    } catch (error) {
      console.error('[HostAudioController] Error handling audio control:', error);
    }
  };

  // Only render for host, and it's invisible
  if (!isHost) return null;

  return <div style={{ display: 'none' }} data-component="host-audio-controller" />;
}

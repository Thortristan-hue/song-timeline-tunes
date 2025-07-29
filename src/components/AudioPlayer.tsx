
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  className?: string;
  volume?: number;
  disabled?: boolean;
}

export const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(({
  src,
  isPlaying,
  onPlayPause,
  className,
  volume = 0.5,
  disabled = false
}, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Expose audio element via ref for external control
  useImperativeHandle(ref, () => audioRef.current!, []);

  // ENHANCED: Better audio handling with fresh URL validation and error recovery
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src || disabled) return;

    // Set volume and CORS
    audio.volume = volume;
    audio.crossOrigin = 'anonymous';
    
    if (isPlaying) {
      // Stop any other playing audio before starting
      const allAudio = document.querySelectorAll('audio');
      allAudio.forEach(otherAudio => {
        if (otherAudio !== audio && !otherAudio.paused) {
          otherAudio.pause();
          otherAudio.currentTime = 0;
        }
      });

      // Set source and attempt to play
      if (audio.src !== src) {
        audio.src = src;
        audio.load();
      }
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Audio playback started successfully');
          })
          .catch(error => {
            console.error('❌ Audio play failed:', error);
            // CRITICAL: Never block game logic - reset playing state but allow game to continue
            if (error.name === 'AbortError') {
              console.log('🔄 Audio aborted, likely due to source change - game continues normally');
            } else if (error.name === 'NotSupportedError') {
              console.log('🔄 Audio format not supported or MIME type issue - game continues normally');
            } else if (error.name === 'NotAllowedError') {
              console.log('🔄 Audio blocked by browser policy - game continues normally');
            } else {
              console.log('🔄 Audio error occurred - game continues normally:', error.message);
            }
            // Reset state on any error but don't prevent game flow
            onPlayPause(); // Reset state
          });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, volume, src, disabled, onPlayPause]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      console.log('🎵 Audio ended naturally');
      onPlayPause(); // This will set isPlaying to false
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      const error = target.error;
      console.error('❌ Audio error occurred:', {
        code: error?.code,
        message: error?.message,
        src: target.src
      });
      onPlayPause(); // Stop playing on error
    };

    const handleLoadError = () => {
      console.error('❌ Audio load error - invalid or expired URL');
      onPlayPause(); // Stop playing on load error
    };

    const handleCanPlay = () => {
      console.log('✅ Audio can play - ready for playback');
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('abort', handleLoadError);
    audio.addEventListener('canplay', handleCanPlay);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('abort', handleLoadError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [onPlayPause]);

  // Update src and reset audio when it changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Stop current audio when src changes
    audio.pause();
    audio.currentTime = 0;
    if (src && src !== audio.src) {
      console.log('🔄 Setting new audio source:', src);
      audio.src = src;
      audio.load();
    }
  }, [src]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <audio
        ref={audioRef}
        preload="metadata"
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />
      <Button
        onClick={onPlayPause}
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
});

AudioPlayer.displayName = 'AudioPlayer';

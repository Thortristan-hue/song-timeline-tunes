
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src || disabled) return;

    // Set volume
    audio.volume = volume;
    
    if (isPlaying) {
      // Stop any other playing audio before starting
      const allAudio = document.querySelectorAll('audio');
      allAudio.forEach(otherAudio => {
        if (otherAudio !== audio && !otherAudio.paused) {
          otherAudio.pause();
          otherAudio.currentTime = 0;
        }
      });

      // Test if the URL is valid before attempting to play
      audio.load();
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Audio play failed:', error);
          // Reset playing state if audio fails
          onPlayPause();
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, volume, src, disabled, onPlayPause]);

  // Handle audio ending and errors
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      onPlayPause(); // This will set isPlaying to false
    };

    const handleError = () => {
      console.error('Audio error occurred - resetting play state');
      onPlayPause(); // Stop playing on error
    };

    const handleLoadError = () => {
      console.error('Audio load error - invalid or expired URL');
      onPlayPause(); // Stop playing on load error
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('abort', handleLoadError);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('abort', handleLoadError);
    };
  }, [onPlayPause]);

  // Update src and reset audio when it changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Stop current audio when src changes
    audio.pause();
    audio.currentTime = 0;
    if (src) {
      audio.src = src;
      audio.load();
    }
  }, [src]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <audio
        ref={audioRef}
        src={src || undefined}
        preload="metadata"
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
      </Button>
      <Volume2 className="h-3 w-3 text-muted-foreground" />
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';

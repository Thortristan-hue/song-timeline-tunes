
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string;
  isPlaying: boolean;
  onPlayPause: () => void;
  className?: string;
  volume?: number;
}

export const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(({
  src,
  isPlaying,
  onPlayPause,
  className,
  volume = 0.5
}, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  // FIXED: Expose audio element via ref for external control
  useImperativeHandle(ref, () => audioRef.current!, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // FIXED: Set volume and ensure no overlapping audio
    audio.volume = volume;
    
    if (isPlaying) {
      // FIXED: Stop any other playing audio before starting
      const allAudio = document.querySelectorAll('audio');
      allAudio.forEach(otherAudio => {
        if (otherAudio !== audio && !otherAudio.paused) {
          otherAudio.pause();
          otherAudio.currentTime = 0;
        }
      });

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Audio play failed:', error);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, volume]);

  // FIXED: Handle audio ending to update state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      onPlayPause(); // This will set isPlaying to false
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [onPlayPause]);

  // FIXED: Update src and reset audio when it changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // FIXED: Stop current audio when src changes
    audio.pause();
    audio.currentTime = 0;
    audio.src = src;
    audio.load();
  }, [src]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        style={{ display: 'none' }}
      />
      <Button
        onClick={onPlayPause}
        size="sm"
        variant="outline"
        className="flex items-center gap-1"
      >
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </Button>
      <Volume2 className="h-3 w-3 text-muted-foreground" />
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';

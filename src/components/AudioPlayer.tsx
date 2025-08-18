
import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeezerAudioService } from '@/services/DeezerAudioService';

interface AudioPlayerProps {
  src: string | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  className?: string;
  volume?: number;
  disabled?: boolean;
  trackId?: string;
}

export const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(({
  src,
  isPlaying,
  onPlayPause,
  className,
  volume = 0.5,
  disabled = false,
  trackId
}, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [actualSrc, setActualSrc] = useState<string | null>(src);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useImperativeHandle(ref, () => audioRef.current!, []);

  // Fetch preview URL if needed
  useEffect(() => {
    const fetchPreview = async () => {
      if (!src && trackId && !isLoadingPreview && !actualSrc) {
        setIsLoadingPreview(true);
        setPreviewError(null);
        
        try {
          console.log('🎵 Fetching preview URL for track:', trackId);
          const previewUrl = await DeezerAudioService.getPreviewUrl(trackId);
          setActualSrc(previewUrl);
          console.log('✅ Preview URL fetched:', previewUrl);
        } catch (error) {
          console.error('❌ Failed to fetch preview URL:', error);
          setPreviewError('Preview not available');
          setActualSrc(null);
        } finally {
          setIsLoadingPreview(false);
        }
      } else if (src && src !== actualSrc) {
        setActualSrc(src);
        setPreviewError(null);
      }
    };

    fetchPreview();
  }, [src, trackId, isLoadingPreview, actualSrc]);

  // Audio playback handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !actualSrc || disabled || isLoadingPreview) return;

    audio.volume = volume;
    audio.crossOrigin = 'anonymous';
    
    if (isPlaying) {
      // Stop other audio elements
      const allAudio = document.querySelectorAll('audio');
      allAudio.forEach(otherAudio => {
        if (otherAudio !== audio && !otherAudio.paused) {
          otherAudio.pause();
          otherAudio.currentTime = 0;
        }
      });

      // Set source and play
      if (audio.src !== actualSrc) {
        console.log('🔄 Setting audio source:', actualSrc);
        audio.src = actualSrc;
        audio.load();
      }
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Audio playback started');
            setPreviewError(null);
          })
          .catch(error => {
            console.error('❌ Audio play failed:', error);
            setPreviewError('Playback failed');
            onPlayPause(); // Reset playing state
          });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, volume, actualSrc, disabled, onPlayPause, isLoadingPreview]);

  // Audio event handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      console.log('🎵 Audio ended');
      onPlayPause();
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      const error = target.error;
      console.error('❌ Audio error:', error);
      setPreviewError('Audio error');
      onPlayPause();
    };

    const handleCanPlay = () => {
      console.log('✅ Audio ready to play');
      setPreviewError(null);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [onPlayPause]);

  const isActuallyDisabled = disabled || (!actualSrc && !isLoadingPreview) || !!previewError;

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
        disabled={isActuallyDisabled}
      >
        {isLoadingPreview ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
        {isLoadingPreview && <span className="text-xs">Loading...</span>}
        {previewError && <span className="text-xs text-red-500">{previewError}</span>}
        {!isLoadingPreview && !previewError && !actualSrc && <span className="text-xs">No preview</span>}
      </Button>
      <Volume2 className="h-3 w-3 text-muted-foreground" />
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';

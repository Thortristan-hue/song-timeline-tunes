
import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeezerAudioService } from '@/services/DeezerAudioService';

interface AudioPlayerProps {
  src: string | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  className?: string;
  volume?: number;
  disabled?: boolean;
  trackId?: string; // Add trackId to fetch preview if src is not available
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

  // Expose audio element via ref for external control
  useImperativeHandle(ref, () => audioRef.current!, []);

  // Fetch preview URL if src is not available but trackId is provided
  useEffect(() => {
    const fetchPreview = async () => {
      if (!src && trackId && !isLoadingPreview) {
        setIsLoadingPreview(true);
        try {
          console.log('🎵 Fetching preview URL for track:', trackId);
          const previewUrl = await DeezerAudioService.getPreviewUrl(trackId);
          setActualSrc(previewUrl);
          console.log('✅ Preview URL fetched:', previewUrl);
        } catch (error) {
          console.error('❌ Failed to fetch preview URL:', error);
          setActualSrc(null);
        } finally {
          setIsLoadingPreview(false);
        }
      } else if (src) {
        setActualSrc(src);
      }
    };

    fetchPreview();
  }, [src, trackId, isLoadingPreview]);

  // Enhanced audio handling with proper preview URL validation
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !actualSrc || disabled || isLoadingPreview) return;

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
      if (audio.src !== actualSrc) {
        console.log('🔄 Setting audio source:', actualSrc);
        audio.src = actualSrc;
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
            // Reset playing state if audio fails
            if (error.name === 'AbortError') {
              console.log('🔄 Audio aborted, likely due to source change');
            } else if (error.name === 'NotSupportedError') {
              console.log('🔄 Audio format not supported or URL expired');
              onPlayPause(); // Reset state
            } else {
              console.log('🔄 Other audio error, resetting state');
              onPlayPause(); // Reset state
            }
          });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, volume, actualSrc, disabled, onPlayPause, isLoadingPreview]);

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
    if (actualSrc && actualSrc !== audio.src) {
      console.log('🔄 Setting new audio source:', actualSrc);
      audio.src = actualSrc;
      audio.load();
    }
  }, [actualSrc]);

  const isActuallyDisabled = disabled || !actualSrc || isLoadingPreview;

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
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        {isLoadingPreview && <span className="text-xs">Loading preview...</span>}
        {isActuallyDisabled && !isLoadingPreview && <span className="text-xs">No preview</span>}
      </Button>
      <Volume2 className="h-3 w-3 text-muted-foreground" />
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';


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

  // Enhanced preview fetching with better logic
  useEffect(() => {
    const fetchPreview = async () => {
      // Reset error state
      setPreviewError(null);
      
      // If we have a direct src, use it
      if (src) {
        console.log('🎵 AudioPlayer: Using direct src:', src);
        setActualSrc(src);
        return;
      }

      // If we have a trackId but no src, fetch preview
      if (trackId && !isLoadingPreview) {
        setIsLoadingPreview(true);
        console.log('🎵 AudioPlayer: Fetching preview for trackId:', trackId);
        
        try {
          const previewUrl = await DeezerAudioService.getPreviewUrl(trackId);
          console.log('✅ AudioPlayer: Preview URL fetched:', previewUrl);
          setActualSrc(previewUrl);
        } catch (error) {
          console.error('❌ AudioPlayer: Failed to fetch preview URL:', error);
          setPreviewError('Preview not available');
          setActualSrc(null);
        } finally {
          setIsLoadingPreview(false);
        }
      } else if (!src && !trackId) {
        console.log('⚠️ AudioPlayer: No src or trackId provided');
        setActualSrc(null);
      }
    };

    fetchPreview();
  }, [src, trackId]);

  // Enhanced audio playback handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isLoadingPreview) return;

    // Set volume
    audio.volume = volume;
    audio.crossOrigin = 'anonymous';
    
    if (isPlaying && actualSrc) {
      console.log('🎵 AudioPlayer: Starting playback with src:', actualSrc);
      
      // Stop other audio elements
      const allAudio = document.querySelectorAll('audio');
      allAudio.forEach(otherAudio => {
        if (otherAudio !== audio && !otherAudio.paused) {
          otherAudio.pause();
          otherAudio.currentTime = 0;
        }
      });

      // Set source if different
      if (audio.src !== actualSrc) {
        console.log('🔄 AudioPlayer: Setting new audio source');
        audio.src = actualSrc;
        audio.load();
      }
      
      // Play audio
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ AudioPlayer: Playback started successfully');
            setPreviewError(null);
          })
          .catch(error => {
            console.error('❌ AudioPlayer: Playback failed:', error);
            setPreviewError('Playback failed');
            onPlayPause(); // Reset playing state
          });
      }
    } else if (!isPlaying) {
      console.log('🎵 AudioPlayer: Pausing playback');
      audio.pause();
    }
  }, [isPlaying, volume, actualSrc, onPlayPause, isLoadingPreview]);

  // Audio event handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      console.log('🎵 AudioPlayer: Audio ended');
      onPlayPause();
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      const error = target.error;
      console.error('❌ AudioPlayer: Audio error:', error);
      setPreviewError('Audio error');
      onPlayPause();
    };

    const handleCanPlay = () => {
      console.log('✅ AudioPlayer: Audio ready to play');
      setPreviewError(null);
    };

    const handleLoadStart = () => {
      console.log('🔄 AudioPlayer: Loading started');
    };

    const handleLoadedData = () => {
      console.log('✅ AudioPlayer: Audio data loaded');
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
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
        {!isLoadingPreview && !previewError && !actualSrc && trackId && (
          <span className="text-xs">Fetching...</span>
        )}
      </Button>
      <Volume2 className="h-3 w-3 text-muted-foreground" />
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';

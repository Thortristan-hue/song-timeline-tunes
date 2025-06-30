import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, AlertTriangle, SkipForward } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { DeezerAudioService } from '@/services/DeezerAudioService';

interface AudioPlayerProps {
  src: string | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onError?: (error: string) => void;
  onSkip?: () => void;
  onUrlResolved?: (mp3Url: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Audio Player Component
 */
export function AudioPlayer({
  src,
  isPlaying,
  onPlayPause,
  onError,
  onSkip,
  onUrlResolved,
  disabled = false,
  className
}: AudioPlayerProps) {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioState, setAudioState] = useState({
    canPlay: false,
    needsUserInteraction: false,
    hasError: false,
    errorMessage: '',
    isLoading: false,
    isMuted: false,
    currentUrl: ''
  });

  // Resolve audio URL
  useEffect(() => {
    const resolveAudioUrl = async () => {
      if (!src) return;

      setAudioState(prev => ({ ...prev, isLoading: true, hasError: false }));

      try {
        // Check if it's a Deezer track URL
        const trackId = src.match(/track\/(\d+)/)?.[1];
        let playableUrl = src;

        if (trackId) {
          playableUrl = await DeezerAudioService.getPreviewUrl(trackId);
          onUrlResolved?.(playableUrl);
        }

        setAudioState(prev => ({
          ...prev,
          currentUrl: playableUrl,
          isLoading: false
        }));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to load audio';
        setAudioState(prev => ({
          ...prev,
          hasError: true,
          errorMessage: errorMsg,
          isLoading: false
        }));
        onError?.(errorMsg);
      }
    };

    resolveAudioUrl();
  }, [src, onError, onUrlResolved]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      setAudioState(prev => ({
        ...prev,
        canPlay: true,
        isLoading: false,
        hasError: false
      }));
    };

    const handleError = () => {
      const error = audio.error;
      let errorMessage = 'Audio playback failed';

      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio format not supported';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio source not supported';
            break;
        }
      }

      setAudioState(prev => ({
        ...prev,
        hasError: true,
        errorMessage,
        isLoading: false
      }));
      onError?.(errorMessage);
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [onError]);

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !audioState.currentUrl) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.currentTime = 0;
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          setAudioState(prev => ({ ...prev, needsUserInteraction: false }));
        }
      }
      onPlayPause();
    } catch (error) {
      if (error instanceof Error && error.name === 'NotAllowedError') {
        setAudioState(prev => ({
          ...prev,
          needsUserInteraction: true,
          hasError: true,
          errorMessage: 'Click to enable audio'
        }));
      } else {
        const errorMsg = 'Playback failed. Try again or skip.';
        setAudioState(prev => ({ ...prev, hasError: true, errorMessage: errorMsg }));
        onError?.(errorMsg);
      }
    }
  }, [isPlaying, onPlayPause, onError, audioState.currentUrl]);

  const handleMuteToggle = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setAudioState(prev => ({ ...prev, isMuted: audioRef.current?.muted ?? false }));
    }
  };

  const handleTryAgain = () => {
    setAudioState(prev => ({
      ...prev,
      hasError: false,
      errorMessage: '',
      needsUserInteraction: false
    }));
    audioRef.current?.load();
  };

  // Error state
  if (audioState.hasError && !audioState.needsUserInteraction) {
    return (
      <div className={cn("flex items-center gap-2 p-3 bg-red-500/20 rounded-lg", className)}>
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-200">{audioState.errorMessage}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleTryAgain} className="bg-red-600 hover:bg-red-700 text-xs">
            Try Again
          </Button>
          {onSkip && (
            <Button size="sm" onClick={onSkip} variant="outline" className="text-xs border-red-400">
              <SkipForward className="h-3 w-3 mr-1" />
              Skip
            </Button>
          )}
        </div>
      </div>
    );
  }

  // User interaction required
  if (audioState.needsUserInteraction) {
    return (
      <div className={cn("flex items-center gap-3 p-4 bg-amber-500/20 rounded-lg", className)}>
        <div className="text-2xl">🔊</div>
        <div className="flex-1">
          <p className="text-sm text-amber-200 mb-2">Click to enable audio</p>
          <Button onClick={handlePlayPause} className="bg-amber-600 hover:bg-amber-700" disabled={disabled}>
            <Play className="h-4 w-4 mr-2" />
            Enable Audio
          </Button>
        </div>
      </div>
    );
  }

  // Normal state
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {audioState.currentUrl && (
        <audio
          ref={audioRef}
          src={audioState.currentUrl}
          crossOrigin="anonymous"
          preload="metadata"
        />
      )}
      
      <Button
        onClick={handlePlayPause}
        size="sm"
        className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 h-9 w-9 p-0"
        disabled={disabled || !audioState.currentUrl || !audioState.canPlay || audioState.isLoading}
      >
        {audioState.isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      
      <Button
        onClick={handleMuteToggle}
        size="sm"
        variant="outline"
        className="rounded-xl h-9 w-9 p-0 border-slate-600/50 bg-slate-700/80 hover:bg-slate-600/80 text-slate-200"
        disabled={disabled || !audioState.currentUrl}
      >
        {audioState.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </Button>
      
      {onSkip && (
        <Button
          onClick={onSkip}
          size="sm"
          variant="outline"
          className="rounded-xl h-9 px-3 border-slate-600/50 bg-slate-700/80 hover:bg-slate-600/80 text-slate-200"
          disabled={disabled}
        >
          <SkipForward className="h-4 w-4 mr-1" />
          Skip
        </Button>
      )}
    </div>
  );
}

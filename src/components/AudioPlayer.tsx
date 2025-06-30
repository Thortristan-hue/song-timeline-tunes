
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, AlertTriangle, SkipForward } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onError?: (error: string) => void;
  onSkip?: () => void;
  disabled?: boolean;
  className?: string;
}

export function AudioPlayer({
  src,
  isPlaying,
  onPlayPause,
  onError,
  onSkip,
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
    isMuted: false
  });

  // Generate proxied URL using the correct proxy format
  const getProxiedUrl = useCallback((url: string | null): string | null => {
    if (!url) return null;
    
    // If it's already a proxied URL, return as is
    if (url.includes('timeliner-proxy.thortristanjd.workers.dev')) {
      return url;
    }
    
    // Only proxy valid HTTP(S) URLs that look like direct audio files
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        console.log(`🎵 Proxying audio URL: ${url}`);
        const proxiedUrl = `https://timeliner-proxy.thortristanjd.workers.dev/?url=${encodeURIComponent(url)}`;
        console.log(`🎵 Proxied URL: ${proxiedUrl}`);
        return proxiedUrl;
      } catch (error) {
        console.error('Failed to encode URL for proxy:', error);
        return null;
      }
    }
    
    // If it's a relative or other type of URL, return as is
    return url;
  }, []);

  // Reset audio state when src changes
  useEffect(() => {
    setAudioState(prev => ({
      ...prev,
      canPlay: false,
      hasError: false,
      errorMessage: '',
      isLoading: true,
      needsUserInteraction: false
    }));
  }, [src]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      console.log('🎵 Audio can play');
      setAudioState(prev => ({
        ...prev,
        canPlay: true,
        isLoading: false,
        hasError: false
      }));
    };

    const handleError = (event: Event) => {
      const audioElement = event.target as HTMLAudioElement;
      const error = audioElement.error;
      let errorMessage = 'Unable to load audio.';
      
      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error while loading audio.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio format not supported.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio source not supported.';
            break;
          default:
            errorMessage = 'Unknown audio error occurred.';
        }
      }
      
      console.error('🎵 Audio error:', error, 'URL:', audioElement.src);
      
      setAudioState(prev => ({
        ...prev,
        hasError: true,
        errorMessage,
        isLoading: false,
        canPlay: false
      }));
      
      onError?.(errorMessage);
    };

    const handleLoadStart = () => {
      setAudioState(prev => ({ ...prev, isLoading: true }));
    };

    const handleLoadedData = () => {
      setAudioState(prev => ({ ...prev, isLoading: false }));
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [onError]);

  // Handle play/pause with autoplay detection
  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !src) {
      const error = 'No audio available to play';
      toast({
        title: "Audio Error",
        description: error,
        variant: "destructive",
      });
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
        console.log('🎵 Audio paused');
      } else {
        // Reset to beginning and attempt to play
        audio.currentTime = 0;
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log('🎵 Audio playing');
          setAudioState(prev => ({ ...prev, needsUserInteraction: false }));
        }
      }
      onPlayPause();
    } catch (error) {
      console.error('🎵 Playback error:', error);
      
      // Handle autoplay restrictions
      if (error instanceof Error && error.name === 'NotAllowedError') {
        setAudioState(prev => ({
          ...prev,
          needsUserInteraction: true,
          hasError: true,
          errorMessage: 'Please click to enable audio playback'
        }));
        
        toast({
          title: "Audio Blocked",
          description: "Your browser requires user interaction to play audio. Click the play button to start.",
        });
      } else {
        const errorMsg = 'Unable to play audio. Check your internet connection or try skipping this song.';
        setAudioState(prev => ({
          ...prev,
          hasError: true,
          errorMessage: errorMsg
        }));
        
        toast({
          title: "Playback Error",
          description: errorMsg,
          variant: "destructive",
        });
        
        onError?.(errorMsg);
      }
    }
  }, [src, isPlaying, onPlayPause, onError, toast]);

  const handleMuteToggle = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !audio.muted;
      setAudioState(prev => ({ ...prev, isMuted: audio.muted }));
    }
  };

  const handleTryAgain = () => {
    setAudioState(prev => ({
      ...prev,
      hasError: false,
      errorMessage: '',
      needsUserInteraction: false
    }));
    
    if (audioRef.current) {
      audioRef.current.load();
    }
  };

  const proxiedSrc = getProxiedUrl(src);

  // Show error state with recovery options
  if (audioState.hasError && !audioState.needsUserInteraction) {
    return (
      <div className={cn("flex items-center gap-2 p-3 bg-red-500/20 border border-red-400/50 rounded-lg", className)}>
        <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-200">{audioState.errorMessage}</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleTryAgain}
            className="bg-red-600 hover:bg-red-700 text-xs"
          >
            Try Again
          </Button>
          {onSkip && (
            <Button
              size="sm"
              onClick={onSkip}
              variant="outline"
              className="text-xs border-red-400"
            >
              <SkipForward className="h-3 w-3 mr-1" />
              Skip
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Show user interaction required state
  if (audioState.needsUserInteraction) {
    return (
      <div className={cn("flex items-center gap-3 p-4 bg-amber-500/20 border border-amber-400/50 rounded-lg", className)}>
        <div className="text-2xl">🔊</div>
        <div className="flex-1">
          <p className="text-sm text-amber-200 mb-2">Click to enable audio playback</p>
          <Button
            onClick={handlePlayPause}
            className="bg-amber-600 hover:bg-amber-700"
            disabled={disabled}
          >
            <Play className="h-4 w-4 mr-2" />
            Enable Audio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {proxiedSrc && (
        <audio
          ref={audioRef}
          src={proxiedSrc}
          crossOrigin="anonymous"
          preload="metadata"
          onCanPlay={() => {
            console.log('🎵 Audio can play');
            setAudioState(prev => ({
              ...prev,
              canPlay: true,
              isLoading: false,
              hasError: false
            }));
          }}
          onError={(event) => {
            const audioElement = event.target as HTMLAudioElement;
            const error = audioElement.error;
            let errorMessage = 'Unable to load audio.';
            
            if (error) {
              switch (error.code) {
                case MediaError.MEDIA_ERR_NETWORK:
                  errorMessage = 'Network error while loading audio.';
                  break;
                case MediaError.MEDIA_ERR_DECODE:
                  errorMessage = 'Audio format not supported.';
                  break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                  errorMessage = 'Audio source not supported.';
                  break;
                default:
                  errorMessage = 'Unknown audio error occurred.';
              }
            }
            
            console.error('🎵 Audio error:', error, 'URL:', audioElement.src);
            
            setAudioState(prev => ({
              ...prev,
              hasError: true,
              errorMessage,
              isLoading: false,
              canPlay: false
            }));
            
            onError?.(errorMessage);
          }}
          onLoadStart={() => {
            setAudioState(prev => ({ ...prev, isLoading: true }));
          }}
          onLoadedData={() => {
            setAudioState(prev => ({ ...prev, isLoading: false }));
          }}
        />
      )}
      
      <Button
        onClick={handlePlayPause}
        size="sm"
        className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 h-9 w-9 p-0 shadow-md transform transition-all hover:scale-110"
        disabled={disabled || !proxiedSrc || !audioState.canPlay || audioState.isLoading}
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
        onClick={() => {
          const audio = audioRef.current;
          if (audio) {
            audio.muted = !audio.muted;
            setAudioState(prev => ({ ...prev, isMuted: audio.muted }));
          }
        }}
        size="sm"
        variant="outline"
        className="rounded-xl h-9 w-9 p-0 border-slate-600/50 bg-slate-700/80 hover:bg-slate-600/80 text-slate-200 transform transition-all hover:scale-110"
        disabled={disabled || !proxiedSrc}
      >
        {audioState.isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </Button>
      
      {onSkip && (
        <Button
          onClick={onSkip}
          size="sm"
          variant="outline"
          className="rounded-xl h-9 px-3 border-slate-600/50 bg-slate-700/80 hover:bg-slate-600/80 text-slate-200 transform transition-all hover:scale-110"
          disabled={disabled}
        >
          <SkipForward className="h-4 w-4 mr-1" />
          Skip
        </Button>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, AlertTriangle, Loader2 } from 'lucide-react';
import { Song } from '@/types/game';
import { enhancedAudioService } from '@/services/EnhancedAudioService';
import { performanceMonitor } from '@/services/PerformanceMonitor';
import { EnhancedErrorBoundary } from './EnhancedErrorBoundary';

interface AudioPlayerProps {
  song?: Song | null;
  onPlayStateChange?: (isPlaying: boolean) => void;
  className?: string;
  isHost?: boolean;
}

export function EnhancedAudioPlayer({ song, onPlayStateChange, className = '', isHost = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Performance monitoring
  useEffect(() => {
    performanceMonitor.recordMetric('renderTime', performance.now());
  });

  // Initialize audio service and load song
  useEffect(() => {
    if (!song) return;

    const loadSong = async () => {
      setIsLoading(true);
      setHasError(false);
      
      try {
        console.log(`🎵 EnhancedAudioPlayer: Loading song ${song.deezer_title}`);
        
        // Preload this song if not already loaded
        await enhancedAudioService.preloadSongs([song]);
        
        setDuration(enhancedAudioService.getDuration() || 30);
        console.log(`✅ EnhancedAudioPlayer: Song loaded successfully`);
      } catch (error) {
        console.error('❌ EnhancedAudioPlayer: Failed to load song:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadSong();
  }, [song]);

  // Update time tracking
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        const time = enhancedAudioService.getCurrentTime();
        const dur = enhancedAudioService.getDuration();
        setCurrentTime(time);
        setDuration(dur);
        
        // Auto-stop when song ends
        if (time >= dur) {
          handleStop();
        }
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying]);

  // Sync state with enhanced audio service
  useEffect(() => {
    const syncState = () => {
      const audioState = enhancedAudioService.getState();
      setIsPlaying(audioState.isPlaying);
      setFallbackActive(audioState.fallbackActive);
      setHasError(audioState.playbackFailed && !audioState.fallbackActive);
    };

    const interval = setInterval(syncState, 500);
    return () => clearInterval(interval);
  }, []);

  const handlePlayPause = async () => {
    if (!song) return;

    try {
      if (isPlaying) {
        await enhancedAudioService.pause();
        setIsPlaying(false);
        onPlayStateChange?.(false);
      } else {
        const success = await enhancedAudioService.playSong(song, {
          volume: isMuted ? 0 : volume,
          autoPlay: true
        });
        
        if (success) {
          setIsPlaying(true);
          onPlayStateChange?.(true);
          setHasError(false);
        } else {
          setHasError(true);
          onPlayStateChange?.(false);
        }
      }
    } catch (error) {
      console.error('❌ EnhancedAudioPlayer: Play/pause failed:', error);
      setHasError(true);
      onPlayStateChange?.(false);
    }
  };

  const handleStop = async () => {
    try {
      await enhancedAudioService.stop();
      setIsPlaying(false);
      setCurrentTime(0);
      onPlayStateChange?.(false);
    } catch (error) {
      console.error('❌ EnhancedAudioPlayer: Stop failed:', error);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    enhancedAudioService.setVolume(isMuted ? 0 : newVolume);
  };

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    enhancedAudioService.setVolume(newMuted ? 0 : volume);
  };

  if (!song) {
    return (
      <div className={`${className} opacity-50`}>
        <div className="text-center text-muted-foreground">No song selected</div>
      </div>
    );
  }

  return (
    <EnhancedErrorBoundary level="component" name="Enhanced Audio Player">
      <div className={`bg-card/50 backdrop-blur-xl rounded-2xl border border-border/50 p-6 ${className}`}>
        {/* Error state */}
        {hasError && !fallbackActive && (
          <div className="flex items-center gap-2 text-red-400 mb-4 p-3 bg-red-900/20 rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Audio unavailable - playing in silent mode</span>
          </div>
        )}
        
        {/* Fallback mode indicator */}
        {fallbackActive && (
          <div className="flex items-center gap-2 text-yellow-400 mb-4 p-3 bg-yellow-900/20 rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Audio fallback active - limited quality</span>
          </div>
        )}

        {/* Song Info */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-foreground mb-1">{song.deezer_title}</h3>
          <p className="text-muted-foreground">{song.deezer_artist}</p>
          <p className="text-sm text-muted-foreground">{song.deezer_album} • {song.release_year}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}</span>
            <span>{Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-100" 
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6">
          {/* Play/Pause Button */}
          <Button
            onClick={handlePlayPause}
            size="lg"
            variant={isPlaying ? "secondary" : "default"}
            className="w-16 h-16 rounded-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>

          {/* Volume Controls */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleMuteToggle}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 accent-primary"
            />
          </div>
        </div>
      </div>
    </EnhancedErrorBoundary>
  );
}
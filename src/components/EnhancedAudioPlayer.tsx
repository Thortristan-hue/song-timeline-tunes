
import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DeezerAudioService } from '@/services/DeezerAudioService';

// Import the specific assets
import assSpeaker from '@/assets/ass_speaker.png';
import assCassBg from '@/assets/ass_cass_bg.png';
import assPlay from '@/assets/ass_play.png';
import assPause from '@/assets/ass_pause.png';
import assStop from '@/assets/ass_stop.png';

interface EnhancedAudioPlayerProps {
  src: string | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  className?: string;
  volume?: number;
  disabled?: boolean;
  trackId?: string; // Add trackId to fetch preview if src is not available
}

export const EnhancedAudioPlayer = forwardRef<HTMLAudioElement, EnhancedAudioPlayerProps>(({
  src,
  isPlaying,
  onPlayPause,
  onStop,
  className,
  volume = 0.5,
  disabled = false,
  trackId
}, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playButtonFlipped, setPlayButtonFlipped] = useState(false);
  const [pauseButtonFlipped, setPauseButtonFlipped] = useState(false);
  const [stopButtonFlipped, setStopButtonFlipped] = useState(false);
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
          console.log('🎵 Enhanced player fetching preview URL for track:', trackId);
          const previewUrl = await DeezerAudioService.getPreviewUrl(trackId);
          setActualSrc(previewUrl);
          console.log('✅ Enhanced player preview URL fetched:', previewUrl);
        } catch (error) {
          console.error('❌ Enhanced player failed to fetch preview URL:', error);
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

  // Handle button flip states based on playback logic
  useEffect(() => {
    if (isPlaying) {
      // When playing: play stays flipped, pause goes upright
      setPlayButtonFlipped(true);
      setPauseButtonFlipped(false);
    } else {
      // When paused/stopped: play goes upright, pause stays flipped if it was the last action
      setPlayButtonFlipped(false);
    }
  }, [isPlaying]);

  // Enhanced audio handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !actualSrc || disabled || isLoadingPreview) return;

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

      if (audio.src !== actualSrc) {
        console.log('🔄 Enhanced player setting source:', actualSrc);
        audio.src = actualSrc;
        audio.load();
      }
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Enhanced player audio playback started successfully');
          })
          .catch(error => {
            console.error('❌ Enhanced player audio play failed:', error);
            onPlayPause();
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
      console.log('🎵 Enhanced player audio ended naturally');
      onPlayPause();
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      const error = target.error;
      console.error('❌ Enhanced player audio error occurred:', {
        code: error?.code,
        message: error?.message,
        src: target.src
      });
      onPlayPause();
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [onPlayPause]);

  // Update src when it changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    if (actualSrc && actualSrc !== audio.src) {
      console.log('🔄 Enhanced player setting new audio source:', actualSrc);
      audio.src = actualSrc;
      audio.load();
    }
  }, [actualSrc]);

  const handlePlayPauseClick = () => {
    if (isPlaying) {
      // Pause was clicked
      setPauseButtonFlipped(true);
      setPlayButtonFlipped(false);
    } else {
      // Play was clicked
      setPlayButtonFlipped(true);
      setPauseButtonFlipped(false);
    }
    onPlayPause();
  };

  const handleStopClick = () => {
    // Both play and pause go upright when stop is pressed
    setPlayButtonFlipped(false);
    setPauseButtonFlipped(false);
    setStopButtonFlipped(true);
    
    // Reset stop button after a short delay (key release simulation)
    setTimeout(() => {
      setStopButtonFlipped(false);
    }, 150);
    
    onStop();
  };

  const isActuallyDisabled = disabled || !actualSrc || isLoadingPreview;

  return (
    <div className={cn("flex items-center justify-center gap-8", className)}>
      <audio
        ref={audioRef}
        preload="metadata"
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />
      
      {/* Speaker - 4x larger */}
      <div className="flex justify-center">
        <img 
          src={assSpeaker} 
          alt="Speaker" 
          className="w-32 h-32 object-contain drop-shadow-lg"
          style={{ 
            borderRadius: '12px'
          }}
        />
      </div>

      {/* Cassette Player - 1.2x larger with controls moved higher for better background visibility */}
      <div className="relative flex justify-center">
        <img 
          src={assCassBg} 
          alt="Cassette Background" 
          className="w-72 h-48 object-contain drop-shadow-lg"
        />
        
        {/* Loading indicator */}
        {isLoadingPreview && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/80 text-white px-3 py-1 rounded text-sm">
              Loading preview...
            </div>
          </div>
        )}
        
        {/* Controls positioned higher on the cassette for background visibility */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex items-center gap-6">
          {/* Play Button */}
          <button
            onClick={handlePlayPauseClick}
            disabled={isActuallyDisabled}
            className="transition-transform duration-100 hover:scale-110 active:scale-95 disabled:opacity-50"
          >
            <img 
              src={assPlay} 
              alt="Play"
              className={`w-12 h-12 object-contain transition-transform duration-75 ${
                playButtonFlipped ? 'scale-y-[-1]' : 'scale-y-1'
              }`}
            />
          </button>

          {/* Pause Button */}
          <button
            onClick={handlePlayPauseClick}
            disabled={isActuallyDisabled}
            className="transition-transform duration-100 hover:scale-110 active:scale-95 disabled:opacity-50"
          >
            <img 
              src={assPause} 
              alt="Pause"
              className={`w-12 h-12 object-contain transition-transform duration-75 ${
                pauseButtonFlipped ? 'scale-y-[-1]' : 'scale-y-1'
              }`}
            />
          </button>

          {/* Stop Button */}
          <button
            onClick={handleStopClick}
            disabled={isActuallyDisabled}
            className="transition-transform duration-100 hover:scale-110 active:scale-95 disabled:opacity-50"
          >
            <img 
              src={assStop} 
              alt="Stop"
              className={`w-12 h-12 object-contain transition-transform duration-75 ${
                stopButtonFlipped ? 'scale-y-[-1]' : 'scale-y-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
});

EnhancedAudioPlayer.displayName = 'EnhancedAudioPlayer';

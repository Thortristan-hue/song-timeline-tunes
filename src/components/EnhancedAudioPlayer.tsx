import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
}

export const EnhancedAudioPlayer = forwardRef<HTMLAudioElement, EnhancedAudioPlayerProps>(({
  src,
  isPlaying,
  onPlayPause,
  onStop,
  className,
  volume = 0.5,
  disabled = false
}, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playButtonFlipped, setPlayButtonFlipped] = useState(false);
  const [pauseButtonFlipped, setPauseButtonFlipped] = useState(false);
  const [stopButtonFlipped, setStopButtonFlipped] = useState(false);

  // Expose audio element via ref for external control
  useImperativeHandle(ref, () => audioRef.current!, []);

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
    if (!audio || !src || disabled) return;

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
            // CRITICAL: Never block game logic - always allow game to continue
            if (error.name === 'NotAllowedError') {
              console.warn('🎵 Audio blocked by browser policy - game continues normally');
            } else if (error.name === 'NotSupportedError') {
              console.warn('🎵 Audio format not supported or MIME type issue - game continues normally');
            } else {
              console.warn('🎵 Audio error occurred - game continues normally:', error.message);
            }
            onPlayPause();
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
      onPlayPause();
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      const error = target.error;
      console.error('❌ Audio error occurred:', {
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
    if (src && src !== audio.src) {
      console.log('🔄 Setting new audio source:', src);
      audio.src = src;
      audio.load();
    }
  }, [src]);

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
            // Match corners with play screen styling
            borderRadius: '12px'
          }}
        />
      </div>

      {/* Cassette Player - 1.2x larger with controls moved lower */}
      <div className="relative flex justify-center">
        <img 
          src={assCassBg} 
          alt="Cassette Background" 
          className="w-72 h-48 object-contain drop-shadow-lg"
        />
        
        {/* Controls positioned lower on the cassette */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-6">
          {/* Play Button */}
          <button
            onClick={handlePlayPauseClick}
            disabled={disabled || !src}
            className="transition-transform duration-100 hover:scale-110 active:scale-95"
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
            disabled={disabled || !src}
            className="transition-transform duration-100 hover:scale-110 active:scale-95"
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
            disabled={disabled || !src}
            className="transition-transform duration-100 hover:scale-110 active:scale-95"
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
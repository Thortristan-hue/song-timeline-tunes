import React, { useState, useEffect, useRef } from 'react';
import { Song } from '@/types/game';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnimationSystem } from '@/lib/AnimationSystem';
import { useImagePreloader } from '@/hooks/useImagePreloader';

interface EnhancedMysteryCardProps {
  song: Song | null;
  isRevealed: boolean;
  isDestroyed?: boolean;
  className?: string;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  audioIntensity?: number; // 0-1 for spectrum analyzer reactivity
}

export function EnhancedMysteryCard({ 
  song, 
  isRevealed, 
  isDestroyed = false,
  className = "",
  isPlaying = false,
  onPlayPause,
  audioIntensity = 0.5
}: EnhancedMysteryCardProps) {
  const [showAudioVisualization, setShowAudioVisualization] = useState(false);
  const [spectrumBars, setSpectrumBars] = useState<number[]>([]);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [beatPulse, setBeatPulse] = useState(false);
  const vinylRef = useRef<HTMLImageElement>(null);
  const { animateElement, getCSSClass } = useAnimationSystem();
  
  // Preload vinyl image for instant loading
  const { isLoading: imagesLoading } = useImagePreloader({
    images: ['/Vinyl2_rythm.png'],
  });

  // Generate spectrum analyzer data
  useEffect(() => {
    if (isPlaying) {
      setShowAudioVisualization(true);
      
      // Generate spectrum bars (simulating frequency analysis)
      const barCount = 16;
      const newBars = Array.from({ length: barCount }, (_, i) => {
        const baseHeight = 20 + Math.random() * 40;
        const intensity = audioIntensity * 60;
        const frequency = Math.sin(Date.now() * 0.005 + i * 0.5) * intensity;
        return Math.max(10, baseHeight + frequency);
      });
      setSpectrumBars(newBars);
      
      // Generate waveform data
      const waveformCount = 32;
      const newWaveform = Array.from({ length: waveformCount }, (_, i) => {
        const wave = Math.sin(Date.now() * 0.01 + i * 0.3) * audioIntensity * 30;
        return wave;
      });
      setWaveformData(newWaveform);
      
      // Beat detection simulation
      const beatInterval = setInterval(() => {
        setBeatPulse(true);
        setTimeout(() => setBeatPulse(false), 100);
      }, 600); // Simulate 100 BPM
      
      // Update spectrum data periodically
      const spectrumInterval = setInterval(() => {
        const updatedBars = Array.from({ length: barCount }, (_, i) => {
          const baseHeight = 20 + Math.random() * 40;
          const intensity = audioIntensity * 60;
          const frequency = Math.sin(Date.now() * 0.005 + i * 0.5) * intensity;
          return Math.max(10, baseHeight + frequency);
        });
        setSpectrumBars(updatedBars);
        
        const updatedWaveform = Array.from({ length: waveformCount }, (_, i) => {
          const wave = Math.sin(Date.now() * 0.01 + i * 0.3) * audioIntensity * 30;
          return wave;
        });
        setWaveformData(updatedWaveform);
      }, 100);
      
      return () => {
        clearInterval(beatInterval);
        clearInterval(spectrumInterval);
      };
    } else {
      const timer = setTimeout(() => {
        setShowAudioVisualization(false);
        setSpectrumBars([]);
        setWaveformData([]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, audioIntensity]);

  // Beat-sync vinyl animation
  useEffect(() => {
    if (beatPulse && vinylRef.current) {
      animateElement(vinylRef, 'AUDIO_REACTIVE_PULSE');
    }
  }, [beatPulse, animateElement]);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={onPlayPause}
        disabled={!song?.preview_url || !onPlayPause}
        data-testid="mystery-card-button"
        className={cn(
          "cursor-pointer group relative transition-all duration-500 hover:scale-110 active:scale-95 mobile-touch-optimized",
          !song?.preview_url || !onPlayPause ? 'opacity-50 cursor-not-allowed' : ''
        )}
        title={song?.preview_url ? 'Play/Pause Mystery Song' : 'Audio preview not available'}
      >
        {/* Enhanced outer glow ring with beat sync */}
        <div className={cn(
          "absolute -inset-6 rounded-full transition-all duration-300",
          isPlaying 
            ? "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20" 
            : !isRevealed 
              ? "bg-gradient-to-r from-[#107793]/20 via-blue-500/15 to-purple-500/10" 
              : "bg-transparent",
          beatPulse && isPlaying ? getCSSClass('AUDIO_REACTIVE_PULSE') : ''
        )} />

        {/* Enhanced spectrum analyzer rings - concentric circles around vinyl */}
        {(isPlaying || showAudioVisualization) && spectrumBars.length > 0 && (
          <div className="absolute -inset-12 flex items-center justify-center">
            {/* Spectrum bars in circular arrangement */}
            {spectrumBars.map((height, i) => {
              const angle = (i / spectrumBars.length) * 360;
              const radius = 120 + height * 0.8;
              const x = Math.cos(angle * Math.PI / 180) * radius;
              const y = Math.sin(angle * Math.PI / 180) * radius;
              
              return (
                <div
                  key={i}
                  className="absolute w-1 bg-gradient-to-t from-blue-400 via-purple-400 to-pink-400 rounded-full transition-all duration-100"
                  style={{
                    height: `${height}px`,
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
                    opacity: audioIntensity * 0.8 + 0.2,
                    filter: `hue-rotate(${i * 20}deg)`
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Concentric pulse rings */}
        {(isPlaying || showAudioVisualization) && (
          <>
            <div 
              className="absolute -inset-2 border border-blue-400/30 rounded-full transition-all duration-100" 
              style={{
                animationDelay: '0s',
                transform: `scale(${1 + audioIntensity * 0.2})`,
                opacity: audioIntensity * 0.6 + 0.3
              }} 
            />
            <div 
              className="absolute -inset-6 border border-purple-400/20 rounded-full transition-all duration-100" 
              style={{
                animationDelay: '0.2s',
                transform: `scale(${1 + audioIntensity * 0.3})`,
                opacity: audioIntensity * 0.4 + 0.2
              }} 
            />
            <div 
              className="absolute -inset-10 border border-pink-400/10 rounded-full transition-all duration-100" 
              style={{
                animationDelay: '0.4s',
                transform: `scale(${1 + audioIntensity * 0.4})`,
                opacity: audioIntensity * 0.3 + 0.1
              }} 
            />
          </>
        )}
        
        {/* Main vinyl record with beat-sync effects */}
        <img 
          ref={vinylRef}
          src="/Vinyl2_rythm.png"
          alt="Mystery Song"
          className={cn(
            "w-64 h-64 object-contain transition-all duration-700 relative z-10",
            isDestroyed 
              ? 'opacity-0 scale-0 rotate-180' 
              : 'opacity-100 scale-100',
            isPlaying 
              ? 'animate-spin-slow' 
              : !isRevealed 
                ? 'animate-pulse-glow' 
                : 'animate-pulse hover:scale-105',
            beatPulse && isPlaying ? 'brightness-125 saturate-125' : ''
          )}
          style={{
            filter: !isRevealed 
              ? 'drop-shadow(0 0 25px rgba(16, 119, 147, 0.8)) drop-shadow(0 0 50px rgba(16, 119, 147, 0.4))' 
              : isPlaying
                ? `drop-shadow(0 8px 25px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 20px rgba(59, 130, 246, ${audioIntensity * 0.6 + 0.4}))`
                : 'drop-shadow(0 8px 25px rgba(0, 0, 0, 0.3))',
            transform: beatPulse && isPlaying ? `scale(${1.02 + audioIntensity * 0.03})` : undefined
          }}
        />
        
        {/* Enhanced Play/Pause overlay with audio-reactive shimmer */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className={cn(
            "bg-black/70 backdrop-blur-md rounded-full p-4 transition-all duration-500 border border-white/20",
            isPlaying 
              ? 'scale-100 opacity-100 shadow-lg shadow-blue-500/20' 
              : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100',
            beatPulse && isPlaying ? 'ring-2 ring-blue-400/50' : ''
          )}>
            {/* Audio-reactive shimmer effect */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-300",
              isPlaying && getCSSClass('CARD_SHIMMER')
            )} />
            
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white drop-shadow-lg relative z-10" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1 drop-shadow-lg relative z-10" />
            )}
          </div>
        </div>

        {/* Enhanced waveform visualization below vinyl */}
        {(isPlaying || showAudioVisualization) && waveformData.length > 0 && (
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex items-center space-x-1 z-10">
            {waveformData.map((amplitude, i) => (
              <div
                key={i}
                className="w-1 bg-gradient-to-t from-blue-400 via-purple-400 to-pink-400 rounded-full transition-all duration-100"
                style={{
                  height: `${Math.abs(amplitude) + 8}px`,
                  opacity: audioIntensity * 0.8 + 0.3,
                  transform: `translateY(${amplitude}px)`,
                  filter: `hue-rotate(${i * 10}deg)`
                }}
              />
            ))}
          </div>
        )}
      </button>
      
      {/* Audio indicator only - no song metadata on host */}
      {isPlaying && (
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex items-center justify-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
            <Volume2 className="w-4 h-4 text-blue-400" />
            <div className="flex items-center gap-0.5">
              {spectrumBars.slice(0, 8).map((height, i) => (
                <div
                  key={i}
                  className="w-0.5 bg-blue-400 rounded-full transition-all duration-100"
                  style={{
                    height: `${Math.max(3, height * 0.12)}px`,
                    opacity: audioIntensity * 0.8 + 0.2
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
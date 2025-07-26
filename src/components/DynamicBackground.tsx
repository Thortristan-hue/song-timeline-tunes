import React, { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAnimationSystem } from '@/lib/AnimationSystem';

interface DynamicBackgroundProps {
  isPlaying?: boolean;
  currentSong?: {
    release_year?: string;
    genre?: string;
    deezer_artist?: string;
  } | null;
  className?: string;
  audioIntensity?: number; // 0-1 for audio reactivity
  parallaxEnabled?: boolean;
}

interface ParticleData {
  id: number;
  x: number;
  y: number;
  delay: number;
  size: number;
  speed: number;
  type: 'note' | 'staff' | 'wave';
}

export function DynamicBackground({ 
  isPlaying = false, 
  currentSong, 
  className = "",
  audioIntensity = 0.5,
  parallaxEnabled = true
}: DynamicBackgroundProps) {
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [audioBars, setAudioBars] = useState<number[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const backgroundRef = useRef<HTMLDivElement>(null);
  const { getCSSClass } = useAnimationSystem();

  // Enhanced theme colors based on song decade and genre
  const getThemeColors = useCallback(() => {
    if (!currentSong?.release_year) {
      return {
        primary: 'from-slate-950',
        secondary: 'via-slate-900', 
        tertiary: 'to-slate-800',
        accent: 'rgba(16, 119, 147, 0.3)',
        particleColor: '#3b82f6',
        waveColor: '#06b6d4'
      };
    }

    const year = parseInt(currentSong.release_year);
    
    if (year >= 2010) {
      return {
        primary: 'from-indigo-950',
        secondary: 'via-purple-900',
        tertiary: 'to-pink-800',
        accent: 'rgba(99, 102, 241, 0.4)',
        particleColor: '#8b5cf6',
        waveColor: '#ec4899'
      };
    } else if (year >= 2000) {
      return {
        primary: 'from-blue-950',
        secondary: 'via-cyan-900',
        tertiary: 'to-teal-800',
        accent: 'rgba(6, 182, 212, 0.4)',
        particleColor: '#06b6d4',
        waveColor: '#10b981'
      };
    } else if (year >= 1990) {
      return {
        primary: 'from-emerald-950',
        secondary: 'via-green-900',
        tertiary: 'to-lime-800',
        accent: 'rgba(34, 197, 94, 0.4)',
        particleColor: '#22c55e',
        waveColor: '#84cc16'
      };
    } else if (year >= 1980) {
      return {
        primary: 'from-yellow-950',
        secondary: 'via-orange-900',
        tertiary: 'to-red-800',
        accent: 'rgba(251, 146, 60, 0.4)',
        particleColor: '#f59e0b',
        waveColor: '#ef4444'
      };
    } else if (year >= 1970) {
      return {
        primary: 'from-orange-950',
        secondary: 'via-red-900',
        tertiary: 'to-pink-800',
        accent: 'rgba(249, 115, 22, 0.4)',
        particleColor: '#f97316',
        waveColor: '#ec4899'
      };
    } else {
      return {
        primary: 'from-purple-950',
        secondary: 'via-violet-900',
        tertiary: 'to-fuchsia-800',
        accent: 'rgba(168, 85, 247, 0.4)',
        particleColor: '#a855f7',
        waveColor: '#d946ef'
      };
    }
  }, [currentSong?.release_year]);

  const themeColors = getThemeColors();

  // Generate enhanced floating musical elements with audio reactivity
  useEffect(() => {
    if (isPlaying) {
      const particleCount = Math.max(8, Math.min(20, Math.floor(12 + audioIntensity * 8)));
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3,
        size: 16 + Math.random() * 24 + audioIntensity * 16,
        speed: 3 + Math.random() * 2 + audioIntensity * 2,
        type: (['note', 'staff', 'wave'] as const)[Math.floor(Math.random() * 3)]
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [isPlaying, audioIntensity]);

  // Generate reactive audio bars
  useEffect(() => {
    if (isPlaying) {
      const barCount = 32;
      const newBars = Array.from({ length: barCount }, () => 
        Math.random() * 60 + 10 + audioIntensity * 40
      );
      setAudioBars(newBars);
      
      // Update bars periodically to simulate audio reactivity
      const interval = setInterval(() => {
        const updatedBars = Array.from({ length: barCount }, () => 
          Math.random() * 60 + 10 + audioIntensity * 40
        );
        setAudioBars(updatedBars);
      }, 150);
      
      return () => clearInterval(interval);
    } else {
      setAudioBars([]);
    }
  }, [isPlaying, audioIntensity]);

  // Mouse tracking for parallax effect
  useEffect(() => {
    if (!parallaxEnabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [parallaxEnabled]);

  return (
    <div 
      ref={backgroundRef}
      className={cn("fixed inset-0 -z-10 overflow-hidden", className)}
      style={{
        transform: parallaxEnabled 
          ? `translate3d(${mousePosition.x}px, ${mousePosition.y}px, 0)` 
          : undefined,
        transition: 'transform 0.1s ease-out'
      }}
    >
      {/* Enhanced base gradient background with smooth transitions */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-br transition-all duration-2000",
          themeColors.primary,
          themeColors.secondary,
          themeColors.tertiary
        )} 
      />

      {/* Multi-layer animated gradient overlays for audio reactivity */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-r transition-all duration-500",
          isPlaying 
            ? getCSSClass('AUDIO_REACTIVE_PULSE')
            : "opacity-20"
        )}
        style={{
          background: isPlaying 
            ? `linear-gradient(45deg, transparent, ${themeColors.accent}, transparent)`
            : undefined,
          opacity: isPlaying ? audioIntensity * 0.6 + 0.2 : 0.2
        }}
      />

      {/* Enhanced dynamic light orbs with parallax */}
      <div 
        className="absolute top-20 left-10 w-32 h-32 rounded-full blur-3xl animate-pulse transition-all duration-1000"
        style={{ 
          backgroundColor: themeColors.accent,
          transform: parallaxEnabled ? `translate3d(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px, 0)` : undefined
        }} 
      />
      <div 
        className="absolute bottom-32 right-16 w-48 h-48 rounded-full blur-2xl animate-pulse transition-all duration-1000"
        style={{ 
          backgroundColor: themeColors.accent,
          animationDelay: '2s',
          transform: parallaxEnabled ? `translate3d(${-mousePosition.x * 0.3}px, ${-mousePosition.y * 0.3}px, 0)` : undefined
        }} 
      />
      <div 
        className="absolute top-1/2 left-20 w-24 h-24 rounded-full blur-2xl animate-pulse transition-all duration-1000"
        style={{ 
          backgroundColor: themeColors.accent,
          animationDelay: '1s',
          transform: parallaxEnabled ? `translate3d(${mousePosition.x * 0.7}px, ${mousePosition.y * 0.7}px, 0)` : undefined
        }} 
      />

      {/* Enhanced floating musical elements with different types */}
      {isPlaying && particles.map((particle) => {
        const particleContent = particle.type === 'note' 
          ? ['♪', '♫', '♩', '♬'][particle.id % 4]
          : particle.type === 'staff'
          ? '—'
          : '~';
          
        return (
          <div
            key={particle.id}
            className={cn(
              "absolute text-white/20 animate-float pointer-events-none transition-all duration-500",
              getCSSClass('PARALLAX_FLOAT')
            )}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              fontSize: `${particle.size}px`,
              color: themeColors.particleColor,
              opacity: audioIntensity * 0.4 + 0.2,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.speed}s`,
              transform: parallaxEnabled 
                ? `translate3d(${mousePosition.x * (particle.id % 3 + 1) * 0.1}px, ${mousePosition.y * (particle.id % 3 + 1) * 0.1}px, 0)` 
                : undefined
            }}
          >
            {particleContent}
          </div>
        );
      })}

      {/* Enhanced audio spectrum-like bars with better reactivity */}
      {isPlaying && audioBars.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center space-x-1 pb-8 opacity-30">
          {audioBars.map((height, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-current to-transparent rounded-full transition-all duration-150"
              style={{
                height: `${height}px`,
                color: themeColors.waveColor,
                animationDelay: `${i * 0.05}s`,
                transform: `scaleY(${audioIntensity * 0.5 + 0.5})`,
                opacity: audioIntensity * 0.6 + 0.3
              }}
            />
          ))}
        </div>
      )}

      {/* Enhanced floating staff lines with wave motion */}
      {isPlaying && (
        <div className="absolute inset-0 opacity-10">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-px bg-gradient-to-r from-transparent via-current to-transparent animate-pulse"
              style={{
                top: `${20 + i * 15}%`,
                color: themeColors.particleColor,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '6s',
                opacity: audioIntensity * 0.5 + 0.3,
                transform: `translateX(${Math.sin(Date.now() * 0.001 + i) * 20}px)`
              }}
            />
          ))}
        </div>
      )}

      {/* Decade-specific atmospheric effects */}
      {currentSong?.release_year && (
        <div className="absolute inset-0 pointer-events-none">
          {parseInt(currentSong.release_year) >= 1980 && parseInt(currentSong.release_year) < 1990 && (
            // 80s neon grid effect
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                  linear-gradient(90deg, ${themeColors.particleColor} 1px, transparent 1px),
                  linear-gradient(180deg, ${themeColors.particleColor} 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
                transform: `perspective(1000px) rotateX(60deg)`
              }}
            />
          )}
          
          {parseInt(currentSong.release_year) >= 1970 && parseInt(currentSong.release_year) < 1980 && (
            // 70s disco ball effect
            <div className="absolute top-1/4 left-1/2 w-16 h-16 transform -translate-x-1/2">
              <div 
                className="w-full h-full rounded-full animate-spin-slow"
                style={{
                  background: `conic-gradient(${themeColors.particleColor}, transparent, ${themeColors.waveColor}, transparent)`,
                  opacity: audioIntensity * 0.3 + 0.1
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
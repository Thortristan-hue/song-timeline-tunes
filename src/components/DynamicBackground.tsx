import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface DynamicBackgroundProps {
  isPlaying?: boolean;
  currentSong?: {
    release_year?: string;
    genre?: string;
    deezer_artist?: string;
  } | null;
  className?: string;
}

export function DynamicBackground({ 
  isPlaying = false, 
  currentSong, 
  className = "" 
}: DynamicBackgroundProps) {
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);

  // Generate theme colors based on song decade
  const getThemeColors = () => {
    if (!currentSong?.release_year) {
      return {
        primary: 'from-slate-950',
        secondary: 'via-slate-900', 
        tertiary: 'to-slate-800',
        accent: 'rgba(16, 119, 147, 0.3)'
      };
    }

    const year = parseInt(currentSong.release_year);
    
    if (year >= 2010) {
      return {
        primary: 'from-indigo-950',
        secondary: 'via-purple-900',
        tertiary: 'to-pink-800',
        accent: 'rgba(99, 102, 241, 0.4)'
      };
    } else if (year >= 2000) {
      return {
        primary: 'from-blue-950',
        secondary: 'via-cyan-900',
        tertiary: 'to-teal-800',
        accent: 'rgba(6, 182, 212, 0.4)'
      };
    } else if (year >= 1990) {
      return {
        primary: 'from-emerald-950',
        secondary: 'via-green-900',
        tertiary: 'to-lime-800',
        accent: 'rgba(34, 197, 94, 0.4)'
      };
    } else if (year >= 1980) {
      return {
        primary: 'from-yellow-950',
        secondary: 'via-orange-900',
        tertiary: 'to-red-800',
        accent: 'rgba(251, 146, 60, 0.4)'
      };
    } else {
      return {
        primary: 'from-purple-950',
        secondary: 'via-violet-900',
        tertiary: 'to-fuchsia-800',
        accent: 'rgba(168, 85, 247, 0.4)'
      };
    }
  };

  const themeColors = getThemeColors();

  // Generate floating musical elements
  useEffect(() => {
    if (isPlaying) {
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [isPlaying]);

  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden", className)}>
      {/* Base gradient background that changes with song decade */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-br transition-all duration-1000",
          themeColors.primary,
          themeColors.secondary,
          themeColors.tertiary
        )} 
      />

      {/* Animated gradient overlay for audio reactivity */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-r opacity-20 transition-all duration-500",
          isPlaying 
            ? "animate-pulse from-transparent via-white/10 to-transparent" 
            : "from-transparent to-transparent"
        )} 
      />

      {/* Dynamic light orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full blur-3xl animate-pulse transition-all duration-1000"
           style={{ backgroundColor: themeColors.accent }} />
      <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full blur-2xl animate-pulse transition-all duration-1000"
           style={{ 
             backgroundColor: themeColors.accent,
             animationDelay: '2s' 
           }} />
      <div className="absolute top-1/2 left-20 w-24 h-24 rounded-full blur-2xl animate-pulse transition-all duration-1000"
           style={{ 
             backgroundColor: themeColors.accent,
             animationDelay: '1s' 
           }} />

      {/* Floating musical notes when playing */}
      {isPlaying && particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute text-white/20 text-2xl animate-float pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: '4s'
          }}
        >
          {['♪', '♫', '♩', '♬'][particle.id % 4]}
        </div>
      ))}

      {/* Audio spectrum-like bars */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center space-x-2 pb-8 opacity-30">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-current to-transparent rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 40 + 10}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.8s',
                color: themeColors.accent.replace('0.4', '0.8')
              }}
            />
          ))}
        </div>
      )}

      {/* Subtle floating staff lines */}
      {isPlaying && (
        <div className="absolute inset-0 opacity-10">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-px bg-white animate-float"
              style={{
                top: `${20 + i * 15}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '6s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
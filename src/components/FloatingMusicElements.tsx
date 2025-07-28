import React from 'react';
import { Music, Music2, Music3, Music4 } from 'lucide-react';

interface FloatingMusicElementsProps {
  isPlaying?: boolean;
  intensity?: number;
}

export function FloatingMusicElements({ isPlaying = false, intensity = 1 }: FloatingMusicElementsProps) {
  const musicIcons = [Music, Music2, Music3, Music4];
  const elementCount = Math.max(3, Math.min(8, Math.floor(intensity * 6)));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: elementCount }).map((_, index) => {
        const Icon = musicIcons[index % musicIcons.length];
        const delay = index * 0.5;
        const duration = 4 + Math.random() * 2;
        const size = 16 + Math.random() * 24;
        const opacity = 0.1 + Math.random() * 0.3;
        const left = Math.random() * 100;
        
        return (
          <div
            key={index}
            className={`absolute opacity-0 text-blue-400/40 ${isPlaying ? 'animate-float-up' : ''}`}
            style={{
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              animationIterationCount: 'infinite',
              opacity: isPlaying ? opacity : 0,
              transition: 'opacity 1s ease-in-out'
            }}
          >
            <Icon size={size} />
          </div>
        );
      })}

      {/* Musical staff lines */}
      {isPlaying && (
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`staff-${index}`}
              className="absolute w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"
              style={{
                top: `${20 + index * 15}%`,
                animationDelay: `${index * 0.2}s`,
                animationDuration: '3s'
              }}
            />
          ))}
        </div>
      )}

      {/* Musical notes that dance */}
      {isPlaying && Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`note-${index}`}
          className="absolute text-purple-400/30 animate-bounce"
          style={{
            left: `${30 + index * 30}%`,
            top: `${40 + index * 10}%`,
            animationDelay: `${index * 0.3}s`,
            animationDuration: '2s'
          }}
        >
          ♪
        </div>
      ))}
    </div>
  );
}
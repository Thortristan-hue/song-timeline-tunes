import React, { useState, useEffect } from 'react';
import { Song } from '@/types/game';
import { Play, Pause, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedMysteryCardProps {
  song: Song | null;
  isRevealed: boolean;
  isDestroyed?: boolean;
  className?: string;
  isPlaying?: boolean;
  onPlayPause?: () => void;
}

export function EnhancedMysteryCard({ 
  song, 
  isRevealed, 
  isDestroyed = false,
  className = "",
  isPlaying = false,
  onPlayPause
}: EnhancedMysteryCardProps) {
  const [showAudioVisualization, setShowAudioVisualization] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      setShowAudioVisualization(true);
    } else {
      const timer = setTimeout(() => setShowAudioVisualization(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying]);

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
        {/* Outer glow ring that reacts to audio */}
        <div className={cn(
          "absolute -inset-4 rounded-full transition-all duration-500",
          isPlaying 
            ? "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" 
            : !isRevealed 
              ? "bg-gradient-to-r from-[#107793]/20 via-blue-500/15 to-purple-500/10 animate-pulse" 
              : "bg-transparent"
        )} />

        {/* Spectrum analyzer rings */}
        {(isPlaying || showAudioVisualization) && (
          <>
            <div className="absolute -inset-2 border border-blue-400/30 rounded-full animate-pulse" style={{animationDelay: '0s'}} />
            <div className="absolute -inset-6 border border-purple-400/20 rounded-full animate-pulse" style={{animationDelay: '0.3s'}} />
            <div className="absolute -inset-8 border border-pink-400/10 rounded-full animate-pulse" style={{animationDelay: '0.6s'}} />
          </>
        )}
        
        {/* Main vinyl record */}
        <img 
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
                : 'animate-pulse hover:scale-105'
          )}
          style={{
            filter: !isRevealed 
              ? 'drop-shadow(0 0 25px rgba(16, 119, 147, 0.8)) drop-shadow(0 0 50px rgba(16, 119, 147, 0.4))' 
              : isPlaying
                ? 'drop-shadow(0 8px 25px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))'
                : 'drop-shadow(0 8px 25px rgba(0, 0, 0, 0.3))'
          }}
        />
        
        {/* Enhanced Play/Pause overlay with shimmer effect */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className={cn(
            "bg-black/70 backdrop-blur-md rounded-full p-4 transition-all duration-500 border border-white/20",
            isPlaying 
              ? 'scale-100 opacity-100 shadow-lg shadow-blue-500/20' 
              : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100'
          )}>
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-ping rounded-full" />
            
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white drop-shadow-lg relative z-10" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1 drop-shadow-lg relative z-10" />
            )}
          </div>
        </div>

        {/* Audio waveform visualization */}
        {(isPlaying || showAudioVisualization) && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex items-end space-x-1 z-10">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-gradient-to-t from-blue-400 via-purple-400 to-pink-400 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 16 + 6}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.6s'
                }}
              />
            ))}
          </div>
        )}
      </button>
      
      {/* Enhanced reveal card with stagger animation */}
      {isRevealed && song && (
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center animate-fade-in z-30">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-xs whitespace-nowrap hover:scale-105 transition-all duration-300 border border-[#107793]/30 shadow-xl">
            <div className="font-bold animate-shimmer mb-1 text-sm">{song.deezer_title}</div>
            <div className="text-white/80 mb-1">{song.deezer_artist}</div>
            <div className="text-yellow-400 font-bold animate-bounce text-lg">{song.release_year}</div>
            
            {/* Audio indicator */}
            {isPlaying && (
              <div className="flex items-center justify-center gap-1 mt-2">
                <Volume2 className="w-3 h-3 text-blue-400" />
                <div className="flex items-center gap-0.5">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-0.5 h-2 bg-blue-400 rounded-full animate-pulse"
                      style={{animationDelay: `${i * 0.15}s`}}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
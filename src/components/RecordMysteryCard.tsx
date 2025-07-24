import React from 'react';
import { Song } from '@/types/game';
import { Play, Pause } from 'lucide-react';
import recordImage from '@/assets/record.png';

interface RecordMysteryCardProps {
  song: Song | null;
  isRevealed: boolean;
  isDestroyed?: boolean;
  className?: string;
  isPlaying?: boolean;
  onPlayPause?: () => void;
}

export function RecordMysteryCard({ 
  song, 
  isRevealed, 
  isDestroyed = false,
  className = "",
  isPlaying = false,
  onPlayPause
}: RecordMysteryCardProps) {
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={onPlayPause}
        disabled={!song?.preview_url || !onPlayPause}
        className={`cursor-pointer group relative transition-all duration-500 hover:scale-110 active:scale-95 ${
          !song?.preview_url || !onPlayPause ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title={song?.preview_url ? 'Play/Pause Mystery Song' : 'Audio preview not available'}
      >
        <img 
          src="/Vinyl2_rythm.png"
          alt="Mystery Song"
          className={`w-64 h-64 object-contain transition-all duration-700 ${
            isDestroyed 
              ? 'opacity-0 scale-0 rotate-180' 
              : 'opacity-100 scale-100'
          } ${
            isPlaying ? 'animate-spin-slow' : (!isRevealed ? 'animate-pulse-glow' : 'animate-pulse')
          }`}
          style={{
            filter: !isRevealed 
              ? 'drop-shadow(0 0 25px rgba(16, 119, 147, 0.8)) drop-shadow(0 0 50px rgba(16, 119, 147, 0.4))' 
              : 'drop-shadow(0 8px 25px rgba(0, 0, 0, 0.3))'
          }}
        />
        
        {/* Enhanced Play/Pause overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`bg-black/70 backdrop-blur-md rounded-full p-4 transition-all duration-500 border border-white/20 ${
            isPlaying 
              ? 'scale-100 opacity-100' 
              : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100'
          }`}>
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white drop-shadow-lg" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1 drop-shadow-lg" />
            )}
          </div>
        </div>
      </button>
      
      {isRevealed && song && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center animate-fade-in-up">
          <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-xs whitespace-nowrap hover:scale-105 transition-all duration-300 border border-[#107793]/30">
            <div className="font-bold animate-shimmer">{song.deezer_title}</div>
            <div className="text-white/80">{song.deezer_artist}</div>
            <div className="text-yellow-400 font-bold animate-bounce">{song.release_year}</div>
          </div>
        </div>
      )}
    </div>
  );
}

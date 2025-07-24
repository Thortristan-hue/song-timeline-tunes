import React from 'react';
import { Song } from '@/types/game';
import { Play, Pause } from 'lucide-react';
import recordImage from '@/assets/record.png';
import recordPlayerImage from '@/assets/record-player.png';

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
      <img 
        src={recordPlayerImage}
        alt="Record Player"
        className="w-64 h-64 object-contain hover:scale-105 transition-transform duration-300"
      />
      
      <button
        onClick={onPlayPause}
        disabled={!song?.preview_url || !onPlayPause}
        className="absolute cursor-pointer group"
        style={{ 
          left: '46px',
          top: '46px'
        }}
        title={song?.preview_url ? 'Play/Pause Mystery Song' : 'Audio preview not available'}
      >
        <img 
          src={recordImage}
          alt="Mystery Record"
          className={`w-20 h-20 object-contain transition-all duration-500 group-hover:scale-110 group-active:scale-95 ${
            isDestroyed 
              ? 'opacity-0 scale-0 rotate-180' 
              : 'opacity-100 scale-100'
          } ${
            isPlaying ? 'record-spin' : (!isRevealed ? 'record-spin' : 'animate-pulse')
          } ${
            !song?.preview_url || !onPlayPause ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{
            filter: !isRevealed ? 'drop-shadow(0 0 15px rgba(16, 119, 147, 0.6))' : 'none'
          }}
        />
        
        {/* Play/Pause button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`bg-black/60 backdrop-blur-sm rounded-full p-2 transition-all duration-300 ${
            isPlaying 
              ? 'scale-100 opacity-100' 
              : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100'
          }`}>
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white ml-0.5" />
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

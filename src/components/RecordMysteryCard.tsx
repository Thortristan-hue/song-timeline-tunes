import React from 'react';
import { Song } from '@/types/game';
import recordImage from '@/assets/record.png';
import recordPlayerImage from '@/assets/record-player.png';

interface RecordMysteryCardProps {
  song: Song | null;
  isRevealed: boolean;
  isDestroyed?: boolean;
  className?: string;
}

export function RecordMysteryCard({ 
  song, 
  isRevealed, 
  isDestroyed = false,
  className = "" 
}: RecordMysteryCardProps) {
  return (
    <div className={`relative ${className}`}>
      <img 
        src={recordPlayerImage}
        alt="Record Player"
        className="w-64 h-64 object-contain"
      />
      
      <div 
        className="absolute"
        style={{ 
          left: '46px',
          top: '46px'
        }}
      >
        <img 
          src={recordImage}
          alt="Mystery Record"
          className={`w-20 h-20 object-contain transition-all duration-500 ${
            isDestroyed 
              ? 'opacity-0 scale-0 rotate-180' 
              : 'opacity-100 scale-100 rotate-0'
          } ${
            !isRevealed ? 'animate-spin' : ''
          }`}
          style={{
            animationDuration: isRevealed ? '0s' : '3s'
          }}
        />
        
        {isRevealed && song && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-center">
            <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-xs whitespace-nowrap">
              <div className="font-bold">{song.deezer_title}</div>
              <div className="text-white/80">{song.deezer_artist}</div>
              <div className="text-yellow-400 font-bold">{song.release_year}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

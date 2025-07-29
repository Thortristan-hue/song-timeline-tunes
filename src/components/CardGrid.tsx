
import React from 'react';
import { Song } from '@/types/game';

interface CardGridProps {
  availableSongs: Song[];
  onCardClick: (song: Song, position: number) => void;
  isProcessingMove: boolean;
}

export function CardGrid({ availableSongs, onCardClick, isProcessingMove }: CardGridProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Available Cards</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {availableSongs.map((song) => (
          <div
            key={song.id}
            className="bg-gray-800 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => !isProcessingMove && onCardClick(song, 0)}
          >
            <div className="text-sm text-white font-medium">{song.deezer_title}</div>
            <div className="text-xs text-gray-400">{song.deezer_artist}</div>
            <div className="text-xs text-gray-500">{song.release_year}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

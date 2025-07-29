
import React from 'react';
import { Song } from '@/types/game';

interface TimelineProps {
  songs: Song[];
  onCardClick: (song: Song, position: number) => void;
  isProcessingMove: boolean;
}

export function Timeline({ songs, onCardClick, isProcessingMove }: TimelineProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-lg font-semibold text-white">Your Timeline</h3>
      <div className="flex gap-2 flex-wrap">
        {songs.map((song, index) => (
          <div
            key={`${song.id}-${index}`}
            className="bg-gray-800 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
            onClick={() => !isProcessingMove && onCardClick(song, index)}
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

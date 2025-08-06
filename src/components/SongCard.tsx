
import React from 'react';
import { Song } from '@/types/game';

interface SongCardProps {
  song: Song;
  className?: string;
}

export function SongCard({ song, className = '' }: SongCardProps) {
  // Defensive rendering - handle undefined or null song
  if (!song) {
    return (
      <div className={`bg-gray-800 p-4 rounded-lg ${className} opacity-50`}>
        <div className="text-gray-500 font-semibold">Loading...</div>
        <div className="text-gray-600">Please wait</div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 p-4 rounded-lg ${className}`}>
      <div className="text-white font-semibold">{song.deezer_title || 'Unknown Title'}</div>
      <div className="text-gray-300">{song.deezer_artist || 'Unknown Artist'}</div>
      <div className="text-gray-400 text-sm">{song.deezer_album || 'Unknown Album'}</div>
      <div className="text-gray-500 text-xs">{song.release_year || 'Unknown Year'}</div>
    </div>
  );
}

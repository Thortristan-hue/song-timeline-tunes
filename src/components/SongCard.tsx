
import React from 'react';
import { Song } from '@/types/game';

interface SongCardProps {
  song: Song;
  className?: string;
}

export function SongCard({ song, className = '' }: SongCardProps) {
  return (
    <div className={`bg-gray-800 p-4 rounded-lg ${className}`}>
      <div className="text-white font-semibold">{song.deezer_title}</div>
      <div className="text-gray-300">{song.deezer_artist}</div>
      <div className="text-gray-400 text-sm">{song.deezer_album}</div>
      <div className="text-gray-500 text-xs">{song.release_year}</div>
    </div>
  );
}

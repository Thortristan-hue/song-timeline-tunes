
import React from 'react';
import { Song } from '@/types/game';

interface TimelineProps {
  songs: Song[];
  onCardClick: (song: Song, position: number) => void;
  onCardSelect?: (song: Song, position: number) => Promise<void>;
  isProcessingMove: boolean;
  currentSong?: Song;
}

export function Timeline({ songs, onCardClick, onCardSelect, isProcessingMove, currentSong }: TimelineProps) {
  const handleCardClick = (song: Song, index: number) => {
    if (!isProcessingMove) {
      if (onCardSelect) {
        onCardSelect(song, index);
      } else {
        onCardClick(song, index);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-slate-900 min-h-screen">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Your Timeline</h3>
        <p className="text-slate-300">Click on a card to place the mystery card at that position</p>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="flex gap-4 flex-wrap justify-center max-w-6xl">
          {/* Add insertion point at the beginning */}
          <div 
            className={`w-32 h-40 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors ${isProcessingMove ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => handleCardClick(songs[0] || {} as Song, 0)}
          >
            <span className="text-slate-400 text-sm">Insert here</span>
          </div>

          {songs.map((song, index) => (
            <React.Fragment key={`${song.id}-${index}`}>
              <div
                className={`bg-slate-800 p-4 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors w-48 h-40 flex flex-col justify-between ${isProcessingMove ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => handleCardClick(song, index)}
              >
                <div>
                  <div className="text-sm text-white font-medium mb-1 line-clamp-2">{song.deezer_title}</div>
                  <div className="text-xs text-slate-400 mb-1">{song.deezer_artist}</div>
                  <div className="text-xs text-slate-500">{song.deezer_album}</div>
                </div>
                <div className="text-lg font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 text-center py-1 rounded">
                  {song.release_year}
                </div>
              </div>
              
              {/* Add insertion point after each card */}
              <div 
                className={`w-32 h-40 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors ${isProcessingMove ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => handleCardClick(song, index + 1)}
              >
                <span className="text-slate-400 text-sm">Insert here</span>
              </div>
            </React.Fragment>
          ))}

          {/* If no songs, show a single insertion point */}
          {songs.length === 0 && (
            <div className="text-center text-slate-400">
              <div className="w-48 h-40 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center">
                <span className="text-sm">Your timeline will appear here</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

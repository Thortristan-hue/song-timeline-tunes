
import React from 'react';
import { Song } from '@/types/game';

interface PlayerResultDisplayProps {
  cardPlacementResult: { correct: boolean; song: Song };
}

export function PlayerResultDisplay({ cardPlacementResult }: PlayerResultDisplayProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50">
      <div className="text-center space-y-6 p-8">
        <div className={`text-9xl mb-4 ${
          cardPlacementResult.correct ? 'text-emerald-400 animate-bounce' : 'text-rose-400 animate-pulse'
        }`}>
          {cardPlacementResult.correct ? '🎯' : '💥'}
        </div>
        
        <div className={`text-5xl font-black ${
          cardPlacementResult.correct ? 
          'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400' : 
          'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-400'
        }`}>
          {cardPlacementResult.correct ? 'PERFECT!' : 'CLOSE!'}
        </div>
        
        <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-slate-600/30 max-w-md">
          <div className="text-xl font-bold text-white mb-2">
            {cardPlacementResult.song.deezer_title}
          </div>
          <div className="text-lg text-slate-300 mb-3">
            by {cardPlacementResult.song.deezer_artist}
          </div>
          <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full font-bold text-lg">
            {cardPlacementResult.song.release_year}
          </div>
        </div>
      </div>
    </div>
  );
}

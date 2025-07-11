
import React from 'react';
import { Card } from '@/components/ui/card';
import { Music, Star, Calendar } from 'lucide-react';
import { Player } from '@/types/game';

interface HostCurrentPlayerTimelineProps {
  currentTurnPlayer: Player;
}

export function HostCurrentPlayerTimeline({ currentTurnPlayer }: HostCurrentPlayerTimelineProps) {
  return (
    <div className="absolute bottom-6 left-6 right-6 z-20">
      <div className="bg-white/12 backdrop-blur-2xl rounded-3xl p-6 shadow-xl border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-4 h-4 rounded-full shadow-sm"
            style={{ backgroundColor: currentTurnPlayer.color }}
          />
          <h3 className="text-white text-xl font-semibold">
            {currentTurnPlayer.name}'s Timeline
          </h3>
          <Star className="h-5 w-5 text-yellow-400" />
          <div className="text-white/60 text-sm">
            {currentTurnPlayer.score}/10 points
          </div>
        </div>
        
        <div className="flex gap-4 items-center overflow-x-auto pb-2">
          {currentTurnPlayer.timeline.length === 0 ? (
            <div className="text-white/60 text-lg italic py-12 text-center w-full flex items-center justify-center gap-3">
              <Music className="h-8 w-8 opacity-50" />
              <span>Waiting for {currentTurnPlayer.name} to place their first card...</span>
            </div>
          ) : (
            currentTurnPlayer.timeline.map((song, index) => (
              <div
                key={`${song.deezer_title}-${index}`}
                className="min-w-32 h-36 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg border border-white/20 transform transition-all hover:scale-105 relative bg-white/10 backdrop-blur-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />
                <Calendar className="h-6 w-6 mb-2 opacity-70 relative z-10" />
                <div className="text-center relative z-10 space-y-1">
                  <div className="text-lg font-bold">
                    {song.release_year}
                  </div>
                  <div className="text-xs px-2 opacity-80 leading-tight max-w-28">
                    {song.deezer_title.length > 16 ? song.deezer_title.substring(0, 16) + '...' : song.deezer_title}
                  </div>
                  <div className="text-xs px-2 opacity-60 leading-tight max-w-28">
                    {song.deezer_artist.length > 12 ? song.deezer_artist.substring(0, 12) + '...' : song.deezer_artist}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

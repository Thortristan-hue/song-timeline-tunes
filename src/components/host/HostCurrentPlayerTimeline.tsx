
import React from 'react';
import { Card } from '@/components/ui/card';
import { Music, Star } from 'lucide-react';
import { Player } from '@/types/game';

interface HostCurrentPlayerTimelineProps {
  currentTurnPlayer: Player;
}

export function HostCurrentPlayerTimeline({ currentTurnPlayer }: HostCurrentPlayerTimelineProps) {
  return (
    <div className="absolute bottom-60 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-4xl px-4">
      <Card className="bg-slate-800/60 backdrop-blur-md border-slate-600/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-4 h-4 rounded-full border-2 border-white"
            style={{ backgroundColor: currentTurnPlayer.color }}
          />
          <h3 className="text-2xl font-bold text-white">
            {currentTurnPlayer.name}'s Timeline
          </h3>
          <Star className="h-5 w-5 text-yellow-400" />
        </div>
        
        <div className="flex gap-3 items-center overflow-x-auto pb-2">
          {currentTurnPlayer.timeline.length === 0 ? (
            <div className="text-slate-400 text-lg italic py-8 text-center w-full">
              No songs placed yet...
            </div>
          ) : (
            currentTurnPlayer.timeline.map((song, index) => (
              <div
                key={index}
                className="min-w-32 h-32 rounded-xl flex flex-col items-center justify-center text-white shadow-lg border border-white/20 transform transition-all hover:scale-105 relative"
                style={{ backgroundColor: song.cardColor || currentTurnPlayer.color }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
                <Music className="h-8 w-8 mb-2 opacity-80 relative z-10" />
                <div className="text-center relative z-10">
                  <div className="text-3xl font-black mb-1">
                    {song.release_year}
                  </div>
                  <div className="text-xs text-center px-2 opacity-90 leading-tight">
                    {song.deezer_title?.slice(0, 20)}
                    {song.deezer_title && song.deezer_title.length > 20 ? '...' : ''}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

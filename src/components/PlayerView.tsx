import React, { useRef } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Song, Player } from '@/types/game';

interface PlayerViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  roomCode: string;
}

export function PlayerView({ 
  currentPlayer, 
  currentTurnPlayer,
  roomCode
}: PlayerViewProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 p-4">
      {/* Header with Room Code and Current Turn */}
      <div className="flex justify-between items-center mb-6">
        <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400">
          Room: {roomCode}
        </Badge>
        <Badge 
          variant="outline" 
          className={cn(
            "text-white border-white/20",
            currentTurnPlayer.id === currentPlayer.id 
              ? "bg-green-500/20 border-green-400"
              : "bg-white/10"
          )}
        >
          {currentTurnPlayer.id === currentPlayer.id 
            ? "Your Turn!" 
            : `${currentTurnPlayer.name}'s Turn`}
        </Badge>
      </div>

      {/* Timeline Scroll View */}
      <div className="mt-4">
        <h3 className="text-white text-lg mb-2">Your Timeline</h3>
        <div 
          ref={timelineRef}
          className="relative overflow-x-auto touch-pan-x"
          style={{ 
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="flex">
            {currentPlayer.timeline.map((song, index) => (
              <div 
                key={index}
                className="flex-shrink-0 w-[80vw] px-2 scroll-snap-align-center"
              >
                <Card className="bg-white/10 border-white/20 p-4 h-40">
                  <div className="text-2xl font-bold text-white mb-2">
                    {song.release_year}
                  </div>
                  <div className="text-purple-200">
                    {song.deezer_title}
                  </div>
                  <div className="text-purple-200/60 text-sm">
                    {song.deezer_artist}
                  </div>
                </Card>
              </div>
            ))}
          </div>
          
          {/* Scroll Indicators */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
            {currentPlayer.timeline.map((_, index) => (
              <div 
                key={index}
                className="w-2 h-2 rounded-full bg-white/50"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

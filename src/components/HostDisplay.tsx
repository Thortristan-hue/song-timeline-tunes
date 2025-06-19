import React from 'react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Music, Clock } from 'lucide-react';
import { Badge } from './ui/badge';
import { Song, Player } from '@/types/game';

interface HostDisplayProps {
  currentTurnPlayer: Player;
  players: Player[];
  gameState: {
    timeLeft: number;
    currentSong: Song | null;
    phase: 'playing' | 'finished';
  };
}

export function HostDisplay({ currentTurnPlayer, players, gameState }: HostDisplayProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900">
      {/* Room Code */}
      <div className="absolute top-4 right-4">
        <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400 text-lg px-4 py-2">
          Room: {currentTurnPlayer?.id}
        </Badge>
      </div>

      {/* Current Turn Display */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <Card className="bg-white/10 border-white/20 p-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">
            {currentTurnPlayer.name}'s Turn
          </h2>
          <div className="flex items-center justify-center gap-2 text-purple-200">
            <Clock className="h-5 w-5" />
            <span className="text-xl">{gameState.timeLeft} seconds left</span>
          </div>
        </Card>
      </div>

      {/* Mystery Song Card (without revealing details) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <Card className="bg-white/10 border-white/20 p-8 text-center w-96">
          <Music className="h-16 w-16 text-purple-400 mx-auto mb-4 animate-pulse" />
          <h3 className="text-2xl font-bold text-white mb-4">Mystery Song</h3>
          <Progress value={(gameState.timeLeft / 30) * 100} className="w-full" />
        </Card>
      </div>

      {/* Player Timelines */}
      <div className="absolute bottom-8 left-8 right-8">
        <div className="grid grid-cols-2 gap-8">
          {players.map((player) => (
            <Card 
              key={player.id}
              className={`bg-white/10 border-white/20 p-4 ${
                currentTurnPlayer.id === player.id ? 'ring-2 ring-purple-400' : ''
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: player.color }}
                />
                <h3 className="text-xl font-bold text-white">{player.name}</h3>
                <span className="text-purple-200 ml-auto">Score: {player.score}/10</span>
              </div>
              
              {/* Timeline visualization */}
              <div className="flex gap-2 items-center overflow-x-auto pb-2">
                {player.timeline.map((song, index) => (
                  <div
                    key={index}
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: song.cardColor }}
                  >
                    {song.release_year}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

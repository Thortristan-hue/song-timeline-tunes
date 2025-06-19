import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Music } from 'lucide-react';
import { Song, Player } from '@/types/game';

interface HostDisplayProps {
  currentTurnPlayer: Player;
  players: Player[];
  roomCode: string;
  currentSongProgress: number;
  currentSongDuration: number;
  gameState: {
    currentSong: Song | null;
  };
}

export function HostDisplay({
  currentTurnPlayer,
  players,
  roomCode,
  currentSongProgress,
  currentSongDuration,
  gameState
}: HostDisplayProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900">
      {/* Room Code */}
      <div className="absolute top-4 right-4">
        <Badge 
          variant="outline" 
          className="bg-purple-500/20 text-purple-200 border-purple-400 text-lg px-4 py-2"
        >
          Room: {roomCode}
        </Badge>
      </div>

      {/* Current Turn Display */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
        <Card className="bg-white/10 border-white/20 p-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">
            {currentTurnPlayer.name}'s Turn
          </h2>
        </Card>
      </div>

      {/* Song Progress */}
      <div className="absolute top-32 left-4 right-4">
        <Card className="bg-white/10 border-white/20 p-4">
          <Progress 
            value={(currentSongProgress / currentSongDuration) * 100} 
            className="h-3"
          />
        </Card>
      </div>

      {/* Mystery Card */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <Card className="bg-white/10 border-white/20 p-8 text-center w-64 h-64">
          <Music className="h-24 w-24 text-purple-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white">Mystery Song</h3>
        </Card>
      </div>

      {/* Current Player's Timeline */}
      <div className="absolute bottom-32 left-4 right-4">
        <Card className="bg-white/10 border-white/20 p-4">
          <h3 className="text-xl font-bold text-white mb-4">
            {currentTurnPlayer.name}'s Timeline
          </h3>
          <div className="flex gap-2 items-center overflow-x-auto pb-2">
            {currentTurnPlayer.timeline.map((song, index) => (
              <div
                key={index}
                className="w-24 h-24 rounded-lg flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
                style={{ backgroundColor: song.cardColor }}
              >
                {song.release_year}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Player Scores */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {players.map((player) => (
            <Card 
              key={player.id}
              className="bg-white/10 border-white/20 p-2"
            >
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: player.color }}
                />
                <span className="text-white font-bold">{player.name}</span>
                <span className="text-purple-200 ml-auto">{player.score}/10</span>
              </div>
              <div className="flex -space-x-3">
                {player.timeline.map((song, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: song.cardColor }}
                  >
                    {song.release_year.slice(-2)}
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

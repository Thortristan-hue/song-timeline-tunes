import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Music } from 'lucide-react';
import { Badge } from './ui/badge';
import { Song, Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface HostDisplayProps {
  currentTurnPlayer: Player;
  players: Player[];
  roomCode: string;
  currentSongDuration: number;
  currentSongProgress: number;
  onSongEnd: () => void;
}

export function HostDisplay({ 
  currentTurnPlayer, 
  players, 
  roomCode,
  currentSongDuration,
  currentSongProgress,
  onSongEnd 
}: HostDisplayProps) {
  const [animatingCard, setAnimatingCard] = useState(false);
  const [cardPlacementPosition, setCardPlacementPosition] = useState<number | null>(null);

  // Animation for card placement
  const animateCardPlacement = (position: number) => {
    setAnimatingCard(true);
    setCardPlacementPosition(position);
    
    setTimeout(() => {
      setAnimatingCard(false);
      setCardPlacementPosition(null);
      onSongEnd();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 overflow-hidden">
      {/* Room Code */}
      <div className="absolute top-4 right-4">
        <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400 text-lg">
          Room: {roomCode}
        </Badge>
      </div>

      {/* Current Turn Player */}
      <div className="absolute top-4 left-4 right-4">
        <Card className="bg-white/10 border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: currentTurnPlayer.color }}
              />
              <h2 className="text-3xl font-bold text-white">
                {currentTurnPlayer.name}'s Turn
              </h2>
            </div>
          </div>
        </Card>
      </div>

      {/* Song Progress */}
      <div className="absolute top-28 left-4 right-4">
        <Card className="bg-white/10 border-white/20 p-4">
          <Progress 
            value={(currentSongProgress / currentSongDuration) * 100} 
            className="h-3"
          />
        </Card>
      </div>

      {/* Mystery Song Card */}
      <div className={cn(
        "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500",
        animatingCard && "animate-card-throw"
      )}>
        <Card className="bg-white/10 border-white/20 p-8 text-center w-64 h-64">
          <Music className="h-20 w-20 text-purple-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white">Mystery Song</h3>
        </Card>
      </div>

      {/* Current Player's Timeline */}
      <div className="absolute bottom-32 left-4 right-4">
        <Card className="bg-white/10 border-white/20 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: currentTurnPlayer.color }}
            />
            <h3 className="text-xl font-bold text-white">Timeline</h3>
          </div>
          <div className="flex gap-2 items-center overflow-x-auto pb-2">
            {currentTurnPlayer.timeline.map((song, index) => (
              <div
                key={index}
                className={cn(
                  "w-20 h-20 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0",
                  cardPlacementPosition === index && "animate-card-placement"
                )}
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
              {/* Miniature timeline with overlap */}
              <div className="flex items-center">
                {player.timeline.map((song, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold -ml-2 first:ml-0"
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

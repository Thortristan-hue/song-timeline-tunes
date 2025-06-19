import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Play, Pause, Music } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { Progress } from './ui/progress';

interface PlayerViewProps {
  currentPlayer: Player;
  isMyTurn: boolean;
  currentTurnPlayer: Player;
  gameState: {
    timeLeft: number;
    currentSong: Song | null;
    isPlaying: boolean;
  };
  onPlaceCard: (position: number) => void;
  onPlayPause: () => void;
}

export function PlayerView({ 
  currentPlayer, 
  isMyTurn, 
  currentTurnPlayer,
  gameState,
  onPlaceCard,
  onPlayPause
}: PlayerViewProps) {
  if (!isMyTurn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 p-4">
        <Card className="bg-white/10 border-white/20 p-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            {currentTurnPlayer.name}'s Turn
          </h2>
          <p className="text-purple-200">
            Wait for your turn...
          </p>
        </Card>
        
        {/* Player's timeline is still visible but not interactive */}
        <div className="mt-8">
          <h3 className="text-white text-xl mb-4">Your Timeline</h3>
          <div className="flex flex-col gap-2">
            {currentPlayer.timeline.map((song, index) => (
              <Card 
                key={index}
                className="bg-white/10 border-white/20 p-4"
              >
                <div className="text-white font-bold">{song.release_year}</div>
                <div className="text-purple-200 text-sm">
                  {song.deezer_title} - {song.deezer_artist}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 p-4">
      {/* Current Song Controls when it's player's turn */}
      <Card className="bg-white/10 border-white/20 p-6 mb-8">
        <div className="text-center mb-4">
          <Music className="h-12 w-12 text-purple-400 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-white">Your Turn!</h2>
        </div>
        
        <Button
          onClick={onPlayPause}
          className="w-full mb-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          {gameState.isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </Button>

        <Progress 
          value={(gameState.timeLeft / 30) * 100} 
          className="mb-2"
        />
        <div className="text-purple-200 text-center">
          {gameState.timeLeft} seconds remaining
        </div>
      </Card>

      {/* Interactive Timeline */}
      <div className="space-y-4">
        {/* First placement option */}
        <Button
          onClick={() => onPlaceCard(0)}
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
        >
          Place Mystery Song Here
        </Button>

        {currentPlayer.timeline.map((song, index) => (
          <React.Fragment key={index}>
            <Card className="bg-white/10 border-white/20 p-4">
              <div className="text-white font-bold">{song.release_year}</div>
              <div className="text-purple-200 text-sm">
                {song.deezer_title} - {song.deezer_artist}
              </div>
            </Card>
            
            <Button
              onClick={() => onPlaceCard(index + 1)}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
            >
              Place Mystery Song Here
            </Button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

import React, { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Song, Player } from '@/types/game';
import { cn } from '@/lib/utils';

interface PlayerViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  roomCode: string;
  isMyTurn: boolean;
  gameState: {
    currentSong: Song | null;
    isPlaying: boolean;
    timeLeft: number;
  };
  onPlaceCard: (position: number) => void;
  onPlayPause: () => void;
}

export function PlayerView({
  currentPlayer,
  currentTurnPlayer,
  roomCode,
  isMyTurn,
  gameState,
  onPlaceCard,
  onPlayPause
}: PlayerViewProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400">
          Room: {roomCode}
        </Badge>
        <Badge 
          variant="outline" 
          className={cn(
            "text-white",
            isMyTurn ? "bg-green-500/20 border-green-400" : "bg-white/10 border-white/20"
          )}
        >
          {isMyTurn ? "Your Turn!" : `${currentTurnPlayer.name}'s Turn`}
        </Badge>
      </div>

      {/* Timeline View */}
      <div className="mt-4 relative">
        <div 
          ref={timelineRef}
          className="overflow-x-auto touch-pan-x pb-8"
          style={{ 
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {isMyTurn && (
            <Button
              onClick={() => onPlaceCard(0)}
              className="w-full mb-4 bg-green-500 hover:bg-green-600"
            >
              Place Mystery Song Here
            </Button>
          )}
          
          <div className="flex gap-4 px-[10vw]">
            {currentPlayer.timeline.map((song, index) => (
              <React.Fragment key={index}>
                <div 
                  className="flex-shrink-0 w-[80vw] scroll-snap-align-center"
                >
                  <Card className="bg-white/10 border-white/20 p-6">
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
                {isMyTurn && (
                  <Button
                    onClick={() => onPlaceCard(index + 1)}
                    className="w-full bg-green-500 hover:bg-green-600 absolute"
                    style={{
                      left: `calc(${(index + 1) * 80}vw + ${(index + 1) * 1}rem)`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    Place Here
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Audio Controls - Only shown on player's turn */}
      {isMyTurn && (
        <div className="fixed bottom-4 left-4 right-4">
          <Card className="bg-white/10 border-white/20 p-4">
            <Button
              onClick={onPlayPause}
              className="w-full mb-4 bg-gradient-to-r from-green-500 to-emerald-500"
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
            <div className="text-center text-purple-200">
              {gameState.timeLeft} seconds remaining
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

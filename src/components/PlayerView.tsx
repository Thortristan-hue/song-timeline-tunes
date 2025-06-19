import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, Music } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface PlacementValidation {
  isValid: boolean;
  message: string;
}

interface PlayerViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  roomCode: string;
  isMyTurn: boolean;
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
  currentTurnPlayer,
  roomCode,
  isMyTurn,
  gameState,
  onPlaceCard,
  onPlayPause
}: PlayerViewProps) {
  const { toast } = useToast();
  const [animatingCard, setAnimatingCard] = useState<number | null>(null);
  const [placementAnimation, setPlacementAnimation] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const validatePlacement = (position: number): PlacementValidation => {
    const timeline = [...currentPlayer.timeline];
    const currentSong = gameState.currentSong;
    
    if (!currentSong) {
      return { isValid: false, message: "No song selected" };
    }

    timeline.splice(position, 0, currentSong);
    
    for (let i = 0; i < timeline.length - 1; i++) {
      const currentYear = parseInt(timeline[i].release_year);
      const nextYear = parseInt(timeline[i + 1].release_year);
      
      if (currentYear > nextYear) {
        return { 
          isValid: false, 
          message: `${timeline[i].deezer_title} (${currentYear}) cannot be before ${timeline[i + 1].deezer_title} (${nextYear})` 
        };
      }
    }

    return { isValid: true, message: "Valid placement" };
  };

  const handlePlaceCard = async (position: number) => {
    if (!isMyTurn || !gameState.currentSong) return;

    setAnimatingCard(position);
    const validation = validatePlacement(position);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (validation.isValid) {
      setPlacementAnimation('animate-success');
      toast({
        title: "Correct placement!",
        description: "The song was placed in the right position.",
        variant: "default",
      });
      onPlaceCard(position);
    } else {
      setPlacementAnimation('animate-error');
      toast({
        title: "Invalid placement",
        description: validation.message,
        variant: "destructive",
      });
      
      setTimeout(() => {
        setAnimatingCard(null);
        setPlacementAnimation(null);
      }, 1000);
    }
  };

  if (!isMyTurn) {
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
              "bg-white/10"
            )}
          >
            {currentTurnPlayer.name}'s Turn
          </Badge>
        </div>

        {/* Timeline Scroll View */}
        <div className="mt-4">
          <h3 className="text-white text-lg mb-2">Your Timeline</h3>
          <div 
            ref={timelineRef}
            className="relative overflow-x-auto touch-pan-x pb-8"
            style={{ 
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="flex px-[10vw]">
              {currentPlayer.timeline.map((song, index) => (
                <div 
                  key={index}
                  className="flex-shrink-0 w-[80vw] px-2 scroll-snap-align-center"
                  style={{
                    transform: 'translateX(-10vw)',
                  }}
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

        {/* Turn Status */}
        <div className="fixed bottom-4 left-4 right-4">
          <Card className="bg-white/10 border-white/20 p-4 text-center">
            <p className="text-white font-bold">
              Waiting for {currentTurnPlayer.name}'s turn...
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-indigo-900 p-4">
      {/* Header with Room Code and Current Turn */}
      <div className="flex justify-between items-center mb-6">
        <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400">
          Room: {roomCode}
        </Badge>
        <Badge 
          variant="outline" 
          className="bg-green-500/20 text-white border-green-400"
        >
          Your Turn!
        </Badge>
      </div>

      {/* Current Song Controls */}
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
        <Button
          onClick={() => handlePlaceCard(0)}
          className={`w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 ${
            animatingCard === 0 ? 'animate-throw' : ''
          } ${placementAnimation || ''}`}
          disabled={animatingCard !== null}
        >
          Place Mystery Song Here
        </Button>

        {currentPlayer.timeline.map((song, index) => (
          <React.Fragment key={index}>
            <div 
              className="flex-shrink-0 w-full px-2"
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
            
            <Button
              onClick={() => handlePlaceCard(index + 1)}
              className={`w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 ${
                animatingCard === index + 1 ? 'animate-throw' : ''
              } ${placementAnimation || ''}`}
              disabled={animatingCard !== null}
            >
              Place Mystery Song Here
            </Button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Music, Play, Pause, Volume2, VolumeX, Crown, Clock, Trophy, Star, Zap, Check, X } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { MysteryCard } from '@/components/MysteryCard';
import { PlayerTimeline } from '@/components/PlayerTimeline';
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
    cardPlacementPending: boolean;
    mysteryCardRevealed: boolean;
    cardPlacementCorrect: boolean | null;
  };
  draggedSong: Song | null;
  onPlaceCard: (position: number) => Promise<{ success: boolean }>;
  onPlayPause: () => void;
  onDragStart: (song: Song) => void;
  onDragEnd: () => void;
}

export function PlayerView({
  currentPlayer,
  currentTurnPlayer,
  roomCode,
  isMyTurn,
  gameState,
  draggedSong,
  onPlaceCard,
  onPlayPause,
  onDragStart,
  onDragEnd
}: PlayerViewProps) {
  const [confirmingPlacement, setConfirmingPlacement] = useState<{ song: Song; position: number } | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const handleDragOver = (e: React.DragEvent, position: number) => {
    if (!isMyTurn || !draggedSong) return;
    e.preventDefault();
    setHoveredPosition(position);
  };

  const handleDragLeave = () => {
    setHoveredPosition(null);
  };

  const handleDrop = (e: React.DragEvent | React.MouseEvent | React.TouchEvent, position: number) => {
    if (e && 'preventDefault' in e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    if (!isMyTurn || !draggedSong) return;
    
    setHoveredPosition(null);
    setConfirmingPlacement({ song: draggedSong, position });
  };

  const confirmPlacement = async () => {
    if (!confirmingPlacement) return;
    
    try {
      await onPlaceCard(confirmingPlacement.position);
    } catch (error) {
      console.error('Failed to place card:', error);
    } finally {
      setConfirmingPlacement(null);
    }
  };

  const cancelPlacement = () => {
    setConfirmingPlacement(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute top-32 left-16 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-20 w-80 h-80 bg-purple-500/2 rounded-full blur-3xl" />
      
      {/* Header */}
      <div className="absolute top-6 left-6 right-6 z-40">
        <div className="flex justify-between items-center">
          {/* Current Turn Info */}
          <div className="flex items-center gap-4 bg-black/20 backdrop-blur-3xl px-6 py-4 rounded-3xl border border-white/10">
            <div 
              className="w-3 h-3 rounded-full shadow-lg" 
              style={{ backgroundColor: currentTurnPlayer?.color }}
            />
            <div className="text-white">
              <div className="font-semibold text-lg tracking-tight">
                {isMyTurn ? "Your turn" : `${currentTurnPlayer?.name}'s turn`}
              </div>
              <div className="text-sm text-white/60 font-medium">
                {currentTurnPlayer?.score}/10 points
              </div>
            </div>
            {isMyTurn && <Crown className="h-5 w-5 text-yellow-400 ml-2" />}
          </div>

          {/* Room Code */}
          <div className="bg-white/10 backdrop-blur-3xl text-white border border-white/10 
                        text-lg px-6 py-3 font-mono font-semibold rounded-2xl tracking-wider">
            {roomCode}
          </div>
        </div>
      </div>

      {/* Game Progress */}
      <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30">
        <div className="bg-black/15 backdrop-blur-3xl px-8 py-4 rounded-3xl border border-white/10">
          <div className="flex items-center gap-6">
            <Clock className="h-5 w-5 text-blue-400" />
            <div className="text-white">
              <div className="text-sm text-white/60 font-medium">Time left</div>
              <div className="font-semibold text-xl tracking-tight">{gameState.timeLeft}s</div>
            </div>
            <Progress 
              value={(gameState.timeLeft / 30) * 100} 
              className="w-40 h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-blue-400 [&>div]:to-purple-400 [&>div]:rounded-full" 
            />
          </div>
        </div>
      </div>

      {/* Mystery Card Section */}
      {isMyTurn && gameState.currentSong && (
        <div className="absolute top-48 left-1/2 transform -translate-x-1/2 z-30">
          <div className="text-center space-y-6">
            <MysteryCard
              song={gameState.currentSong}
              isRevealed={gameState.mysteryCardRevealed}
              isInteractive={true}
              className="w-52 h-64 rounded-3xl"
              onDragStart={() => onDragStart(gameState.currentSong!)}
              onDragEnd={onDragEnd}
            />

            {/* Audio Controls */}
            <div className="flex items-center justify-center gap-4 bg-black/15 backdrop-blur-3xl p-5 rounded-3xl border border-white/10">
              <Button
                onClick={onPlayPause}
                className="bg-white text-black hover:bg-white/90 rounded-2xl px-6 py-3 font-semibold 
                         transition-all duration-200 hover:scale-105 active:scale-95 border-0"
                disabled={!gameState.currentSong?.preview_url}
              >
                {gameState.isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => setIsMuted(!isMuted)}
                className="bg-white/10 hover:bg-white/20 border-0 rounded-2xl px-4 py-3 text-white
                         transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>

            <div className="text-sm text-white/50 bg-white/5 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
              Audio plays on the host screen
            </div>
          </div>
        </div>
      )}

      {/* Waiting for Turn */}
      {!isMyTurn && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="text-center space-y-6">
            <div className="bg-black/15 backdrop-blur-3xl rounded-3xl p-12 border border-white/10 max-w-md">
              <Music className="h-20 w-20 text-white/30 mx-auto mb-6" />
              <div className="text-2xl font-semibold text-white mb-3 tracking-tight">
                {currentTurnPlayer?.name} is thinking...
              </div>
              <div className="text-white/60 font-medium">
                Hang tight, your turn is coming up!
              </div>
              
              <div className="mt-6 flex items-center justify-center gap-3">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentTurnPlayer?.color }}
                />
                <div className="text-sm text-white/50">
                  {currentTurnPlayer?.score}/10 points
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player Timeline */}
      <div className="absolute bottom-20 left-0 right-0 z-20 px-6">
        <PlayerTimeline
          player={currentPlayer}
          isCurrent={isMyTurn}
          isDarkMode={true}
          draggedSong={draggedSong}
          hoveredPosition={hoveredPosition}
          confirmingPlacement={confirmingPlacement}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          confirmPlacement={confirmPlacement}
          cancelPlacement={cancelPlacement}
        />
      </div>

      {/* Confirmation Buttons */}
      {confirmingPlacement && (
        <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex gap-4 bg-black/20 backdrop-blur-3xl p-5 rounded-3xl border border-white/10">
            <Button
              onClick={confirmPlacement}
              className="bg-white text-black hover:bg-white/90 rounded-2xl px-8 py-3 font-semibold
                       transition-all duration-200 hover:scale-105 active:scale-95 border-0"
            >
              <Check className="h-4 w-4 mr-2" />
              Place it here
            </Button>
            <Button
              onClick={cancelPlacement}
              className="bg-white/10 hover:bg-white/20 text-white rounded-2xl px-8 py-3 font-semibold 
                       border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <X className="h-4 w-4 mr-2" />
              Never mind
            </Button>
          </div>
        </div>
      )}

      {/* Card Placement Result */}
      {gameState.cardPlacementCorrect !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xl flex items-center justify-center z-50">
          <div className="text-center space-y-8 p-8">
            <div className={`text-8xl mb-6 ${
              gameState.cardPlacementCorrect ? 'animate-bounce' : 'animate-pulse'
            }`}>
              {gameState.cardPlacementCorrect ? '🎯' : '💫'}
            </div>
            
            <div className={`text-5xl font-bold tracking-tight ${
              gameState.cardPlacementCorrect ? 
              'text-green-400' : 
              'text-blue-400'
            }`}>
              {gameState.cardPlacementCorrect ? 'Perfect!' : 'Nice try!'}
            </div>
            
            <div className="bg-black/20 backdrop-blur-3xl rounded-3xl p-8 border border-white/10 max-w-sm">
              <div className="text-xl font-semibold text-white mb-2">
                {gameState.currentSong?.deezer_title}
              </div>
              <div className="text-lg text-white/70 mb-4 font-medium">
                {gameState.currentSong?.deezer_artist}
              </div>
              <div className="inline-block bg-white text-black px-4 py-2 rounded-full font-bold">
                {gameState.currentSong?.release_year}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

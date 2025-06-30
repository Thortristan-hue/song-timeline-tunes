
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
  const [confirmingPlacement, setConfirmingPlacement] = useState<{ position: number } | null>(null);
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

  const handleDrop = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    if (!isMyTurn || !draggedSong) return;
    
    setHoveredPosition(null);
    setConfirmingPlacement({ position });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-48 h-48 bg-blue-400/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}} />
      
      {/* Header */}
      <div className="absolute top-6 left-4 right-4 z-40">
        <div className="flex justify-between items-center">
          {/* Current Turn Info */}
          <div className="flex items-center gap-3 bg-slate-800/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-600/50 shadow-lg">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-lg" 
              style={{ backgroundColor: currentTurnPlayer?.color }}
            />
            <div className="text-white">
              <div className="font-bold text-lg">
                {isMyTurn ? "Your Turn" : `${currentTurnPlayer?.name}'s Turn`}
              </div>
              <div className="text-sm text-slate-300">
                Score: {currentTurnPlayer?.score}/10
              </div>
            </div>
            {isMyTurn && <Crown className="h-5 w-5 text-yellow-400" />}
          </div>

          {/* Room Code */}
          <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400 text-lg px-4 py-2 font-mono">
            {roomCode}
          </Badge>
        </div>
      </div>

      {/* Game Progress */}
      <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30">
        <div className="bg-slate-800/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-600/30">
          <div className="flex items-center gap-4">
            <Clock className="h-5 w-5 text-blue-400" />
            <div className="text-white">
              <div className="text-sm text-slate-300">Time Remaining</div>
              <div className="font-bold text-lg">{gameState.timeLeft}s</div>
            </div>
            <Progress value={(gameState.timeLeft / 30) * 100} className="w-32" />
          </div>
        </div>
      </div>

      {/* Mystery Card Section - Only show when it's player's turn */}
      {isMyTurn && gameState.currentSong && (
        <div className="absolute top-48 left-1/2 transform -translate-x-1/2 z-30">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl scale-110" />
              
              <MysteryCard
                song={gameState.currentSong}
                isRevealed={gameState.mysteryCardRevealed}
                isInteractive={true}
                className="w-48 h-60"
                onDragStart={() => onDragStart(gameState.currentSong!)}
                onDragEnd={onDragEnd}
              />
            </div>

            {/* Enhanced Audio Controls for Players */}
            <div className="flex items-center justify-center gap-3 bg-slate-800/90 backdrop-blur-lg p-4 rounded-2xl border border-slate-600/30 shadow-lg">
              <Button
                onClick={onPlayPause}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl px-6 py-3 font-bold text-white shadow-lg"
                disabled={!gameState.currentSong?.preview_url}
              >
                {gameState.isPlaying ? (
                  <>
                    <Pause className="h-5 w-5 mr-2" />
                    Pause on Host
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Play on Host
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => setIsMuted(!isMuted)}
                size="lg"
                variant="outline"
                className="rounded-xl border-slate-600/50 bg-slate-700/80 hover:bg-slate-600/80 px-4 py-3"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>

            <div className="text-sm text-purple-200 bg-purple-900/50 px-3 py-1 rounded-full">
              🎧 Audio plays on host screen • Drag card to timeline
            </div>
          </div>
        </div>
      )}

      {/* Waiting for Turn Display */}
      {!isMyTurn && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="text-center space-y-4">
            <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-8 border border-slate-600/50">
              <Music className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <div className="text-2xl font-bold text-white mb-2">
                {currentTurnPlayer?.name} is playing
              </div>
              <div className="text-slate-300">
                Wait for your turn to place cards
              </div>
              
              <div className="mt-4 flex items-center justify-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full border border-white"
                  style={{ backgroundColor: currentTurnPlayer?.color }}
                />
                <div className="text-sm text-slate-400">
                  Current Score: {currentTurnPlayer?.score}/10
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
          handleDrop={(position) => handleDrop({} as React.DragEvent, position)}
          confirmPlacement={confirmPlacement}
          cancelPlacement={cancelPlacement}
        />
      </div>

      {/* Confirmation Buttons */}
      {confirmingPlacement && (
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30">
          <div className="flex gap-3 bg-slate-800/80 backdrop-blur-lg p-4 rounded-2xl border border-slate-600/30 shadow-xl">
            <Button
              onClick={confirmPlacement}
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl px-6 py-3 font-bold shadow-lg"
            >
              <Check className="h-4 w-4 mr-2" />
              Place Card
            </Button>
            <Button
              onClick={cancelPlacement}
              size="sm"
              className="bg-slate-600/80 hover:bg-slate-500/80 text-white rounded-xl px-6 py-3 font-bold border border-slate-500/50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Card Placement Result */}
      {gameState.cardPlacementCorrect !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50">
          <div className="text-center space-y-6 p-8">
            <div className={`text-9xl mb-4 ${
              gameState.cardPlacementCorrect ? 'text-emerald-400 animate-bounce' : 'text-rose-400 animate-pulse'
            }`}>
              {gameState.cardPlacementCorrect ? '🎯' : '💥'}
            </div>
            
            <div className={`text-5xl font-black ${
              gameState.cardPlacementCorrect ? 
              'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400' : 
              'text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-400'
            }`}>
              {gameState.cardPlacementCorrect ? 'PERFECT!' : 'CLOSE!'}
            </div>
            
            <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-slate-600/30 max-w-md">
              <div className="text-xl font-bold text-white mb-2">
                {gameState.currentSong?.deezer_title}
              </div>
              <div className="text-lg text-slate-300 mb-3">
                by {gameState.currentSong?.deezer_artist}
              </div>
              <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                {gameState.currentSong?.release_year}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Music, Play, Pause, Volume2, Crown, Clock, Trophy, Star, Zap, Check, X } from 'lucide-react';
import { Song, Player } from '@/types/game';
import { PlayerTimeline } from '@/components/PlayerTimeline';
import { GameBackground, GameHeader, PlayerMysteryCard, PlayerResultDisplay, PlayerWaitingScreen } from '@/components/GameVisuals';
import { cn } from '@/lib/utils';

interface PlayerGameViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  currentSong: Song | null;
  roomCode: string;
  isMyTurn: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPlaceCard: (song: Song, position: number) => Promise<{ success: boolean }>;
  mysteryCardRevealed: boolean;
  cardPlacementResult: { correct: boolean; song: Song } | null;
  gameEnded?: boolean;
  hasPlayedAudio?: boolean;
}

export function PlayerGameView({
  currentPlayer,
  currentTurnPlayer,
  currentSong,
  roomCode,
  isMyTurn,
  isPlaying,
  onPlayPause,
  onPlaceCard,
  mysteryCardRevealed,
  cardPlacementResult,
  gameEnded = false,
  hasPlayedAudio = false
}: PlayerGameViewProps) {
  const [draggedSong, setDraggedSong] = useState<Song | null>(null);
  const [placementPending, setPlacementPending] = useState<{ song: Song; position: number } | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 30,
        medium: 50,
        heavy: 100
      };
      navigator.vibrate(patterns[type]);
    }
  };

  const handleDragStart = (song: Song) => {
    if (gameEnded || !isMyTurn) {
      console.log('🚫 Cannot drag - game ended or not your turn');
      return;
    }
    triggerHaptic('medium');
    console.log('Starting drag for mystery card:', song.deezer_title);
    setDraggedSong(song);
  };

  const handleDragEnd = () => {
    console.log('Ending drag for mystery card');
    setDraggedSong(null);
  };

  const handleDragOver = (e: React.DragEvent, position: number) => {
    if (!isMyTurn || !draggedSong || gameEnded) return;
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
    
    if (!isMyTurn || !draggedSong || gameEnded) {
      console.log('Cannot drop - not your turn, no dragged song, or game ended');
      return;
    }
    
    triggerHaptic('light');
    console.log('Mystery card dropped at position:', position);
    setHoveredPosition(null);
    setPlacementPending({ song: draggedSong, position });
    setDraggedSong(null);
  };

  const handleConfirmPlacement = async (song: Song, position: number): Promise<{ success: boolean }> => {
    if (gameEnded || !isMyTurn) {
      console.log('Cannot confirm placement - game ended or not your turn');
      return { success: false };
    }

    triggerHaptic('heavy');
    console.log('Confirming placement:', { song: song.deezer_title, position });
    
    try {
      const result = await onPlaceCard(song, position);
      setPlacementPending(null);
      return result;
    } catch (error) {
      console.error('Failed to confirm placement:', error);
      setPlacementPending(null);
      return { success: false };
    }
  };

  const handleCancelPlacement = () => {
    if (placementPending && !gameEnded && isMyTurn) {
      triggerHaptic('medium');
      console.log('Canceling placement');
      setDraggedSong(placementPending.song);
    }
    setPlacementPending(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      <GameBackground />

      {/* Enhanced turn indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className={cn(
          "bg-gradient-to-r backdrop-blur-xl px-6 py-3 rounded-full border shadow-lg",
          gameEnded ? "from-red-500/20 to-red-600/20 border-red-400/30" :
          isMyTurn ? "from-green-500/20 to-emerald-500/20 border-green-400/30 animate-pulse" :
          "from-blue-500/20 to-indigo-500/20 border-blue-400/30"
        )}>
          <p className="text-white font-medium flex items-center gap-2">
            {gameEnded ? (
              <>
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span>Game Over!</span>
              </>
            ) : isMyTurn ? (
              <>
                <Zap className="h-4 w-4 text-green-300 animate-pulse" />
                <span>Your turn to play</span>
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 text-blue-300" />
                <span>{currentTurnPlayer.name}'s turn</span>
              </>
            )}
          </p>
        </div>
      </div>

      <GameHeader
        roomCode={roomCode}
        currentPlayer={currentPlayer}
        currentTurnPlayer={currentTurnPlayer}
        isMyTurn={isMyTurn}
        gameEnded={gameEnded}
      />

      {/* Mystery Card - enhanced with audio status */}
      {currentSong && isMyTurn && !placementPending && !gameEnded && (
        <div className="absolute top-48 left-1/2 transform -translate-x-1/2 z-30">
          <PlayerMysteryCard
            currentSong={currentSong}
            mysteryCardRevealed={mysteryCardRevealed}
            isPlaying={isPlaying}
            onPlayPause={onPlayPause}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
          <div className={cn(
            "mt-4 text-sm px-4 py-2 rounded-full border mx-auto w-max",
            hasPlayedAudio ? "bg-green-500/20 border-green-400/50 text-green-200" :
            "bg-white/5 border-white/10 text-white/60"
          )}>
            {hasPlayedAudio ? "✅ Preview played" : "🎵 Listen to preview"}
          </div>
        </div>
      )}

      {/* Waiting State - enhanced design */}
      {(!isMyTurn || gameEnded) && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="text-center">
            <div className={cn(
              "w-24 h-24 backdrop-blur-xl rounded-full flex items-center justify-center mb-6 mx-auto border shadow-xl",
              gameEnded ? "bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-yellow-400/30" :
              "bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-400/30"
            )}>
              <div className="text-4xl">
                {gameEnded ? '🏆' : '⏳'}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              {gameEnded ? 'Game Complete!' : `${currentTurnPlayer.name}'s Turn`}
            </h2>
            <p className="text-white/70 max-w-xs mx-auto">
              {gameEnded ? 'Check the final scores!' : 
               isMyTurn ? 'Get ready for your turn...' : 
               'Waiting for their move...'}
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Player Timeline Container */}
      <div className="absolute bottom-6 left-6 right-6 z-20">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-3xl rounded-3xl p-6 shadow-2xl border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-4 h-4 rounded-full shadow-md"
              style={{ backgroundColor: currentPlayer.color }}
            />
            <h3 className="text-white text-xl font-bold tracking-tight">
              Your Timeline
            </h3>
            <div className="ml-auto flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold">{currentPlayer.score}</span>
            </div>
            {isMyTurn && !gameEnded && (
              <Badge className="ml-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                Your Turn
              </Badge>
            )}
          </div>
          
          <PlayerTimeline
            player={currentPlayer}
            isCurrent={isMyTurn && !gameEnded}
            isDarkMode={true}
            draggedSong={draggedSong}
            hoveredPosition={hoveredPosition}
            placementPending={placementPending}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            onConfirmPlacement={handleConfirmPlacement}
            onCancelPlacement={handleCancelPlacement}
            gameEnded={gameEnded}
            isPlaying={isPlaying}
            onToggleAudio={onPlayPause}
            hasPlayedAudio={hasPlayedAudio}
          />
        </div>
      </div>

      {/* Enhanced Result Display */}
      {cardPlacementResult && (
        <PlayerResultDisplay cardPlacementResult={cardPlacementResult} />
      )}
    </div>
  );
}

// Enhanced Player View (alternative layout)
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
  hasPlayedAudio?: boolean;
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
  onDragEnd,
  hasPlayedAudio = false
}: PlayerViewProps) {
  const [placementPending, setPlacementPending] = useState<{ song: Song; position: number } | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 30,
        medium: 50,
        heavy: 100
      };
      navigator.vibrate(patterns[type]);
    }
  };

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
    
    triggerHaptic('light');
    setHoveredPosition(null);
    setPlacementPending({ song: draggedSong, position });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-32 left-16 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>
      
      {/* Enhanced Header */}
      <div className="absolute top-6 left-6 right-6 z-40">
        <div className="flex justify-between items-center gap-4">
          {/* Current Turn Info */}
          <div className={cn(
            "flex items-center gap-4 backdrop-blur-3xl px-6 py-4 rounded-3xl border shadow-lg",
            isMyTurn ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-400/30" :
            "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-400/30"
          )}>
            <div 
              className="w-4 h-4 rounded-full shadow-lg" 
              style={{ backgroundColor: currentTurnPlayer?.color }}
            />
            <div className="text-white">
              <div className="font-bold text-lg tracking-tight">
                {isMyTurn ? "Your turn" : `${currentTurnPlayer?.name}'s turn`}
              </div>
              <div className="text-sm text-white/70 font-medium flex items-center gap-1">
                <Trophy className="h-3 w-3 text-yellow-400" />
                <span>{currentTurnPlayer?.score}/10 points</span>
              </div>
            </div>
            {isMyTurn && <Crown className="h-5 w-5 text-yellow-400 ml-2 animate-pulse" />}
          </div>

          {/* Enhanced Room Code */}
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-3xl text-white border border-white/10 
                        text-lg px-6 py-3 font-mono font-bold rounded-2xl tracking-wider shadow-lg">
            {roomCode}
          </div>
        </div>
      </div>

      {/* Enhanced Game Progress */}
      <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-30">
        <div className="bg-gradient-to-br from-black/20 to-black/10 backdrop-blur-3xl px-8 py-4 rounded-3xl border border-white/10 shadow-lg">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Clock className="h-6 w-6 text-blue-400" />
              {gameState.timeLeft < 10 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse border border-white/50"></div>
              )}
            </div>
            <div className="text-white">
              <div className="text-sm text-white/70 font-medium">Time left</div>
              <div className={cn(
                "font-bold text-xl tracking-tight",
                gameState.timeLeft < 10 ? "text-red-400" : "text-white"
              )}>
                {gameState.timeLeft}s
              </div>
            </div>
            <Progress 
              value={(gameState.timeLeft / 30) * 100} 
              className={cn(
                "w-40 h-2 bg-white/10 rounded-full overflow-hidden",
                gameState.timeLeft < 10 ? "[&>div]:bg-gradient-to-r [&>div]:from-red-400 [&>div]:to-pink-500" :
                "[&>div]:bg-gradient-to-r [&>div]:from-blue-400 [&>div]:to-purple-400"
              )}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Mystery Card Section */}
      {isMyTurn && gameState.currentSong && (
        <div className="absolute top-48 left-1/2 transform -translate-x-1/2 z-30">
          <div className="text-center space-y-6">
            <PlayerMysteryCard
              currentSong={gameState.currentSong}
              mysteryCardRevealed={gameState.mysteryCardRevealed}
              isPlaying={gameState.isPlaying}
              onPlayPause={onPlayPause}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />

            <div className={cn(
              "text-sm px-4 py-2 rounded-full border mx-auto w-max",
              hasPlayedAudio ? "bg-green-500/20 border-green-400/50 text-green-200" :
              "bg-white/5 border-white/10 text-white/60"
            )}>
              {hasPlayedAudio ? "✅ Preview played" : "🎵 Listen to preview"}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Waiting Screen */}
      {!isMyTurn && (
        <PlayerWaitingScreen currentTurnPlayer={currentTurnPlayer} />
      )}

      {/* Enhanced Player Timeline */}
      <div className="absolute bottom-20 left-0 right-0 z-20 px-6">
        <PlayerTimeline
          player={currentPlayer}
          isCurrent={isMyTurn}
          isDarkMode={true}
          draggedSong={draggedSong}
          hoveredPosition={hoveredPosition}
          placementPending={placementPending}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          isPlaying={gameState.isPlaying}
          onToggleAudio={onPlayPause}
          hasPlayedAudio={hasPlayedAudio}
        />
      </div>

      {/* Enhanced Card Placement Result */}
      {gameState.cardPlacementCorrect !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl flex items-center justify-center z-50">
          <div className="text-center space-y-8 p-8 max-w-md">
            <div className={cn(
              "text-8xl mb-6",
              gameState.cardPlacementCorrect ? "animate-bounce text-green-400" : "animate-pulse text-blue-400"
            )}>
              {gameState.cardPlacementCorrect ? '🎯' : '💫'}
            </div>
            
            <h2 className={cn(
              "text-5xl font-bold tracking-tight",
              gameState.cardPlacementCorrect ? 
              "text-green-400" : 
              "text-blue-400"
            )}>
              {gameState.cardPlacementCorrect ? 'Perfect!' : 'Nice try!'}
            </h2>
            
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-3xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <div className="text-xl font-bold text-white mb-2">
                {gameState.currentSong?.deezer_title}
              </div>
              <div className="text-lg text-white/70 mb-4 font-medium">
                {gameState.currentSong?.deezer_artist}
              </div>
              <div className="inline-block bg-gradient-to-r from-white to-white/80 text-black px-6 py-2 rounded-full font-bold text-lg shadow">
                {gameState.currentSong?.release_year}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

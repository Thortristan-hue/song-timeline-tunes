
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
  gameEnded = false
}: PlayerGameViewProps) {
  const [draggedSong, setDraggedSong] = useState<Song | null>(null);
  const [placementPending, setPlacementPending] = useState<{ song: Song; position: number } | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);

  const handleDragStart = (song: Song) => {
    if (gameEnded || !isMyTurn) {
      console.log('🚫 MANDATORY: Cannot drag - game ended or not your turn');
      return;
    }
    console.log('🎯 MANDATORY: Starting drag for mystery card (validated turn):', song.deezer_title);
    setDraggedSong(song);
  };

  const handleDragEnd = () => {
    console.log('🎯 MANDATORY: Ending drag for mystery card');
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
      console.log('🚫 MANDATORY: Cannot drop - not your turn, no dragged song, or game ended');
      return;
    }
    
    console.log('🎯 MANDATORY: Mystery card dropped at position (validated turn):', position);
    setHoveredPosition(null);
    setPlacementPending({ song: draggedSong, position });
    setDraggedSong(null);
  };

  const handleConfirmPlacement = async (song: Song, position: number): Promise<{ success: boolean }> => {
    if (gameEnded || !isMyTurn) {
      console.log('🚫 MANDATORY: Cannot confirm placement - game ended or not your turn');
      return { success: false };
    }

    console.log('🎯 MANDATORY: Confirming placement with turn validation:', { song: song.deezer_title, position });
    
    try {
      const result = await onPlaceCard(song, position);
      setPlacementPending(null);
      return result;
    } catch (error) {
      console.error('MANDATORY: Failed to confirm placement:', error);
      setPlacementPending(null);
      return { success: false };
    }
  };

  const handleCancelPlacement = () => {
    if (placementPending && !gameEnded && isMyTurn) {
      console.log('🔄 MANDATORY: Canceling placement (turn validated)');
      setDraggedSong(placementPending.song);
    }
    setPlacementPending(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      <GameBackground />

      {/* Disclaimer - enhanced with turn information */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/5 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
          <p className="text-white/70 text-sm font-medium">
            {gameEnded ? "Game Over!" : 
             isMyTurn ? "Your turn to play • Drag the mystery card to your timeline" : 
             `${currentTurnPlayer.name}'s turn • Wait for your turn`}
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

      {/* Mystery Card - only show if it's the player's turn, validated */}
      {currentSong && isMyTurn && !placementPending && !gameEnded && (
        <PlayerMysteryCard
          currentSong={currentSong}
          mysteryCardRevealed={mysteryCardRevealed}
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      )}

      {/* Waiting State - enhanced messaging */}
      {(!isMyTurn || gameEnded) && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="text-center">
            <div className={`w-24 h-24 backdrop-blur-xl rounded-full flex items-center justify-center mb-6 mx-auto border ${
              gameEnded ? 'bg-gray-500/10 border-gray-500/20' : 'bg-white/10 border-white/20'
            }`}>
              <div className="text-4xl animate-pulse">
                {gameEnded ? '🏆' : '⏳'}
              </div>
            </div>
            <div className="text-2xl font-semibold text-white mb-2">
              {gameEnded ? 'Game Over!' : 
               `${currentTurnPlayer.name}'s turn`}
            </div>
            <div className="text-white/60">
              {gameEnded ? 'Thanks for playing!' : 
               isMyTurn ? 'Get ready to place your card...' : 
               'Hang tight while they think...'}
            </div>
          </div>
        </div>
      )}

      {/* Player Timeline */}
      <div className="absolute bottom-6 left-6 right-6 z-20">
        <div className="bg-white/12 backdrop-blur-2xl rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-4 h-4 rounded-full shadow-sm"
              style={{ backgroundColor: currentPlayer.color }}
            />
            <h3 className="text-white text-xl font-semibold">
              Your Timeline
            </h3>
            {isMyTurn && !gameEnded && (
              <div className="ml-auto text-sm text-green-300 font-medium">
                Your turn - place a card!
              </div>
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
          />
        </div>
      </div>

      {/* Result Display */}
      {cardPlacementResult && (
        <PlayerResultDisplay cardPlacementResult={cardPlacementResult} />
      )}
    </div>
  );
}

// Consolidated Player View (alternative layout)
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
  const [placementPending, setPlacementPending] = useState<{ song: Song; position: number } | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);

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
    setPlacementPending({ song: draggedSong, position });
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
            <PlayerMysteryCard
              currentSong={gameState.currentSong}
              mysteryCardRevealed={gameState.mysteryCardRevealed}
              isPlaying={gameState.isPlaying}
              onPlayPause={onPlayPause}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />

            <div className="text-sm text-white/50 bg-white/5 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
              Audio plays on the host screen
            </div>
          </div>
        </div>
      )}

      {/* Waiting for Turn */}
      {!isMyTurn && (
        <PlayerWaitingScreen currentTurnPlayer={currentTurnPlayer} />
      )}

      {/* Player Timeline */}
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
        />
      </div>

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

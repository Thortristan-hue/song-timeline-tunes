
import React, { useState } from 'react';
import { PlayerHeader } from '@/components/player/PlayerHeader';
import { PlayerMysteryCard } from '@/components/player/PlayerMysteryCard';
import { PlayerWaitingScreen } from '@/components/player/PlayerWaitingScreen';
import { PlayerTimeline } from '@/components/PlayerTimeline';
import { PlayerConfirmation } from '@/components/player/PlayerConfirmation';
import { PlayerResultDisplay } from '@/components/player/PlayerResultDisplay';
import { Song, Player } from '@/types/game';

interface PlayerGameViewProps {
  currentPlayer: Player;
  currentTurnPlayer: Player;
  currentSong: Song | null;
  roomCode: string;
  isMyTurn: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPlaceCard: (position: number) => Promise<{ success: boolean }>;
  mysteryCardRevealed: boolean;
  cardPlacementResult: { correct: boolean; song: Song } | null;
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
  cardPlacementResult
}: PlayerGameViewProps) {
  const [draggedSong, setDraggedSong] = useState<Song | null>(null);
  const [confirmingPlacement, setConfirmingPlacement] = useState<{ song: Song; position: number } | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);

  const handleDragStart = (song: Song) => {
    if (!isMyTurn) return;
    setDraggedSong(song);
  };

  const handleDragEnd = () => {
    setDraggedSong(null);
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
    setHoveredPosition(null);
    setConfirmingPlacement({ song: draggedSong, position });
  };

  const confirmPlacement = async () => {
    if (!confirmingPlacement) return;
    
    const result = await onPlaceCard(confirmingPlacement.position);
    setConfirmingPlacement(null);
    setDraggedSong(null);
  };

  const cancelPlacement = () => {
    setConfirmingPlacement(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-48 h-48 bg-blue-400/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}} />
      
      <PlayerHeader 
        currentTurnPlayer={currentTurnPlayer}
        roomCode={roomCode}
        isMyTurn={isMyTurn}
      />

      {isMyTurn && currentSong && (
        <PlayerMysteryCard
          currentSong={currentSong}
          mysteryCardRevealed={mysteryCardRevealed}
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      )}

      {!isMyTurn && (
        <PlayerWaitingScreen currentTurnPlayer={currentTurnPlayer} />
      )}

      <div className="absolute bottom-40 left-0 right-0 z-20 px-6">
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

      {confirmingPlacement && (
        <PlayerConfirmation
          onConfirm={confirmPlacement}
          onCancel={cancelPlacement}
        />
      )}

      {cardPlacementResult && (
        <PlayerResultDisplay
          cardPlacementResult={cardPlacementResult}
        />
      )}
    </div>
  );
}

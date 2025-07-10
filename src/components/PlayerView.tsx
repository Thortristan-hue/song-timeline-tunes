
import React from 'react';
import { Song, Player } from '@/types/game';
import { MobilePlayerGameView } from '@/components/player/MobilePlayerGameView';

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

export function PlayerView(props: PlayerViewProps) {
  // Transform props to match mobile component interface
  const transformedProps = {
    currentPlayer: props.currentPlayer,
    currentTurnPlayer: props.currentTurnPlayer,
    currentSong: props.gameState.currentSong,
    roomCode: props.roomCode,
    isMyTurn: props.isMyTurn,
    isPlaying: props.gameState.isPlaying,
    onPlayPause: props.onPlayPause,
    onPlaceCard: async (song: Song, position: number) => {
      return await props.onPlaceCard(position);
    },
    mysteryCardRevealed: props.gameState.mysteryCardRevealed,
    cardPlacementResult: props.gameState.cardPlacementCorrect !== null ? {
      correct: props.gameState.cardPlacementCorrect,
      song: props.gameState.currentSong!
    } : null,
    gameEnded: false
  };

  return <MobilePlayerGameView {...transformedProps} />;
}

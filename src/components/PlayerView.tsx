
import React from 'react';
import { Song, Player } from '@/types/game';
import { PlayerView as ConsolidatedPlayerView } from '@/components/PlayerVisuals';

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
  return <ConsolidatedPlayerView {...props} />;
}


import React from 'react';
import { Song, Player } from '@/types/game';
import { MobilePlayerGameView } from '@/components/player/MobilePlayerGameView';

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

export function PlayerGameView(props: PlayerGameViewProps) {
  // Always use mobile view
  return <MobilePlayerGameView {...props} />;
}

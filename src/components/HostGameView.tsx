
import React from 'react';
import { HostHeader } from '@/components/host/HostHeader';
import { HostMysteryCard } from '@/components/host/HostMysteryCard';
import { HostCurrentPlayerTimeline } from '@/components/host/HostCurrentPlayerTimeline';
import { HostAllPlayersOverview } from '@/components/host/HostAllPlayersOverview';
import { HostGameBackground } from '@/components/host/HostGameBackground';
import { Song, Player } from '@/types/game';

interface HostGameViewProps {
  currentTurnPlayer: Player | null;
  currentSong: Song | null;
  roomCode: string;
  players: Player[];
  mysteryCardRevealed: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  cardPlacementResult: { correct: boolean; song: Song } | null;
}

export function HostGameView({
  currentTurnPlayer,
  currentSong,
  roomCode,
  players,
  mysteryCardRevealed,
  isPlaying,
  onPlayPause,
  cardPlacementResult
}: HostGameViewProps) {
  if (!currentTurnPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4 animate-spin">🎵</div>
          <div className="text-2xl font-bold mb-2">Loading Game...</div>
          <div className="text-slate-300">Setting up the next turn</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      <HostGameBackground />
      
      <HostHeader 
        roomCode={roomCode}
        playersCount={players.length}
      />

      <HostMysteryCard
        currentSong={currentSong}
        currentTurnPlayer={currentTurnPlayer}
        mysteryCardRevealed={mysteryCardRevealed}
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        cardPlacementResult={cardPlacementResult}
      />

      <HostCurrentPlayerTimeline
        currentTurnPlayer={currentTurnPlayer}
      />

      <HostAllPlayersOverview
        players={players}
        currentTurnPlayer={currentTurnPlayer}
      />
    </div>
  );
}

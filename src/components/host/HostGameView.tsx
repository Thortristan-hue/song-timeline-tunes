
import React from 'react';
import { GameRoom, Player } from '@/types/game';
import { HostGameBackground } from './HostGameBackground';
import { HostMysteryCard } from '@/components/GameVisuals';
import { GameHeader } from '@/components/GameVisuals';
import { CassettePlayerDisplay } from '@/components/CassettePlayerDisplay';
import { CircularPlayersLayout } from '@/components/CircularPlayersLayout';
import { HostCurrentPlayerTimeline } from './HostCurrentPlayerTimeline';

interface HostGameViewProps {
  room: GameRoom;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  roomCode: string;
  playerName: string;
  gameLogic: any;
  onRestart: () => void;
  onEndGame: () => void;
}

export default function HostGameView({
  room,
  players,
  currentPlayer,
  isHost,
  roomCode,
  playerName,
  gameLogic,
  onRestart,
  onEndGame
}: HostGameViewProps) {
  const currentTurnPlayer = gameLogic.getCurrentPlayer() || players[0];
  const currentPlayerTimeline = currentTurnPlayer?.timeline || [];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 overflow-hidden">
      {/* Background Effects */}
      <HostGameBackground />
      
      {/* Game Header */}
      <GameHeader 
        roomCode={roomCode}
        currentTurnPlayer={currentTurnPlayer}
        isMyTurn={false}
        gameEnded={gameLogic.gameState.phase === 'finished'}
      />

      {/* Mystery Card Display */}
      <HostMysteryCard
        currentSong={room.current_song}
        currentTurnPlayer={currentTurnPlayer}
        mysteryCardRevealed={gameLogic.gameState.phase === 'playing'}
        isPlaying={gameLogic.gameState.isPlaying}
        onPlayPause={() => gameLogic.setIsPlaying(!gameLogic.gameState.isPlaying)}
        cardPlacementResult={null}
      />

      {/* Current Player Timeline */}
      <HostCurrentPlayerTimeline
        currentPlayer={currentTurnPlayer}
        timeline={currentPlayerTimeline}
        gameLogic={gameLogic}
      />

      {/* Cassette Players Display */}
      <CassettePlayerDisplay
        players={players}
        currentPlayerId={currentTurnPlayer?.id}
      />

      {/* Circular Players Layout */}
      <CircularPlayersLayout
        players={players}
        currentPlayerId={currentTurnPlayer?.id || ''}
        isDarkMode={true}
      />

      {/* Host Controls */}
      <div className="absolute top-4 right-4 z-50">
        <div className="flex gap-2">
          <button
            onClick={onRestart}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Restart
          </button>
          <button
            onClick={onEndGame}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            End Game
          </button>
        </div>
      </div>
    </div>
  );
}

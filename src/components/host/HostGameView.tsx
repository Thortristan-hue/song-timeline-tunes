
import React from 'react';
import { GameRoom, Player } from '@/types/game';
import { DynamicBackground } from '@/components/DynamicBackground';
import { EnhancedMysteryCard } from '@/components/EnhancedMysteryCard';
import { GameHeader } from '@/components/GameVisuals';
import { CassettePlayerDisplay } from '@/components/CassettePlayerDisplay';
import { CircularPlayersLayout } from '@/components/CircularPlayersLayout';
import { FloatingMusicElements } from '@/components/FloatingMusicElements';

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
      {/* Enhanced Dynamic Background */}
      <DynamicBackground currentSong={room.current_song} isPlaying={gameLogic.gameState.isPlaying} />
      
      {/* Floating Musical Elements */}
      <FloatingMusicElements 
        isPlaying={gameLogic.gameState.isPlaying} 
        intensity={room.current_song ? 1 : 0.5} 
      />
      
      {/* Game Header */}
      <GameHeader 
        roomCode={roomCode}
        currentTurnPlayer={currentTurnPlayer}
        isMyTurn={false}
        gameEnded={gameLogic.gameState.phase === 'finished'}
      />

      {/* Enhanced Mystery Card Display */}
      <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-30">
        <div className="text-center space-y-6">
          {/* Current Player Info */}
          <div className="bg-slate-800/80 backdrop-blur-md px-8 py-4 rounded-2xl border border-indigo-400/30 shadow-lg animate-fade-in">
            <div className="flex items-center justify-center gap-4 text-white">
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow-lg animate-pulse" 
                style={{ backgroundColor: currentTurnPlayer.color }}
              />
              <div className="text-center">
                <div className="font-bold text-xl">{currentTurnPlayer.name}'s Turn</div>
                <div className="text-sm text-indigo-200">Score: {currentTurnPlayer.score}/10</div>
              </div>
            </div>
          </div>

          {/* Enhanced Mystery Card */}
          <EnhancedMysteryCard
            song={room.current_song}
            isRevealed={gameLogic.gameState.phase === 'playing'}
            isPlaying={gameLogic.gameState.isPlaying}
            onPlayPause={() => gameLogic.setIsPlaying(!gameLogic.gameState.isPlaying)}
            className="scale-110"
          />

          {/* Audio Controls */}
          <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 border border-slate-600/50 animate-slide-in-right">
            <div className="text-lg text-slate-300 text-center mb-4">
              {currentTurnPlayer.name} is placing their card...
            </div>
          </div>
        </div>
      </div>

      {/* Current Player Timeline - Simple display since full timeline is in HostVisuals */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
        <div className="bg-slate-800/80 backdrop-blur-md px-6 py-3 rounded-xl border border-indigo-400/30">
          <div className="text-white text-sm text-center">
            Timeline: {currentPlayerTimeline.length} cards placed
          </div>
        </div>
      </div>

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

import React from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import HostGameView from '@/components/host/HostGameView';
import MobilePlayerGameView from '@/components/player/MobilePlayerGameView';
import { useGameLogic } from '@/hooks/useGameLogic';
import { GameErrorBoundary } from '@/components/error/GameErrorBoundary';

export default function GamePlay() {
  const { room, currentPlayer, isHost, players, refreshCurrentPlayerTimeline } = useGameRoom();
  const gameLogic = useGameLogic();

  const handleRestart = () => {
    console.log('Restarting game...');
  };

  const handleEndGame = () => {
    console.log('Ending game...');
  };

  if (!room || !currentPlayer) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl mx-auto">
        <GameErrorBoundary>
          {isHost ? (
            <HostGameView
              room={room}
              players={players}
              currentPlayer={currentPlayer}
              isHost={isHost}
              roomCode={room.lobby_code}
              playerName={room.host_name}
              gameLogic={gameLogic}
              onRestart={handleRestart}
              onEndGame={handleEndGame}
            />
          ) : (
            <MobilePlayerGameView
              currentPlayer={currentPlayer}
              currentTurnPlayer={gameLogic.currentTurnPlayer}
              currentSong={gameLogic.currentSong}
              roomCode={room.lobby_code}
              isMyTurn={gameLogic.isMyTurn}
              isPlaying={gameLogic.isPlaying}
              onPlayPause={gameLogic.handlePlayPause}
              onPlaceCard={gameLogic.handlePlaceCard}
              mysteryCardRevealed={gameLogic.mysteryCardRevealed}
              cardPlacementResult={gameLogic.cardPlacementResult}
              gameEnded={gameLogic.gameEnded}
              onHighlightGap={gameLogic.onHighlightGap}
              onViewportChange={gameLogic.onViewportChange}
              refreshCurrentPlayerTimeline={refreshCurrentPlayerTimeline}
            />
          )}
        </GameErrorBoundary>
      </div>
    </div>
  );
}


import React from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import HostGameView from '@/components/host/HostGameView';
import MobilePlayerGameView from '@/components/player/MobilePlayerGameView';
import { useGameLogic } from '@/hooks/useGameLogic';
import { GameErrorBoundary } from '@/components/GameErrorBoundary';

export default function GamePlay() {
  const { room, currentPlayer, isHost, players, refreshCurrentPlayerTimeline } = useGameRoom();
  const gameLogic = useGameLogic(room?.id || null, players, room);

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
              currentTurnPlayer={gameLogic.getCurrentPlayer() || currentPlayer}
              currentSong={room.current_song || { id: '', deezer_title: '', deezer_artist: '', release_year: '', deezer_album: '', genre: '', cardColor: '', preview_url: '', deezer_url: '' }}
              roomCode={room.lobby_code}
              isMyTurn={gameLogic.getCurrentPlayer()?.id === currentPlayer.id}
              isPlaying={gameLogic.gameState.isPlaying}
              onPlayPause={() => gameLogic.setIsPlaying(!gameLogic.gameState.isPlaying)}
              onPlaceCard={async (song, position) => {
                console.log('Place card called:', song, position);
                return { success: true };
              }}
              mysteryCardRevealed={gameLogic.gameState.phase === 'playing'}
              cardPlacementResult={null}
              gameEnded={gameLogic.gameState.phase === 'finished'}
              onHighlightGap={() => {}}
              onViewportChange={() => {}}
              refreshCurrentPlayerTimeline={refreshCurrentPlayerTimeline}
            />
          )}
        </GameErrorBoundary>
      </div>
    </div>
  );
}

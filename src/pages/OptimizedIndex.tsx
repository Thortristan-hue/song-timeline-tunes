
import React from 'react';
import { useOptimizedGameRoom } from '@/hooks/useOptimizedGameRoom';
import { useOptimizedGameLogic } from '@/hooks/useOptimizedGameLogic';
import { MainMenu } from '@/components/MainMenu';
import { HostLobby } from '@/components/HostLobby';
import { MobilePlayerLobby } from '@/components/MobilePlayerLobby';
import { GamePlay } from '@/components/GamePlay';
import { MobilePlayerGameView } from '@/components/player/MobilePlayerGameView';
import { VictoryScreen } from '@/components/VictoryScreen';
import { MobileVictoryScreen } from '@/components/player/MobileVictoryScreen';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { useMobile } from '@/hooks/use-mobile';

export default function OptimizedIndex() {
  const isMobile = useMobile();
  
  const {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    error,
    gameInitialized,
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
    placeCard,
    connectionStatus,
    wsState
  } = useOptimizedGameRoom();

  const { gameState, setIsPlaying, getCurrentPlayer, initializeGame } = useOptimizedGameLogic(
    room?.id || null,
    players,
    room
  );

  console.log('🎮 Optimized game state:', {
    roomPhase: room?.phase,
    gamePhase: gameState.phase,
    playersCount: players.length,
    isLoading,
    gameInitialized
  });

  // Show loading screen only when absolutely necessary
  if (isLoading && !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Setting up game...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Error: {error}</div>
      </div>
    );
  }

  // Victory condition
  if (gameState.winner) {
    return isMobile ? (
      <MobileVictoryScreen winner={gameState.winner} onPlayAgain={() => window.location.reload()} />
    ) : (
      <VictoryScreen winner={gameState.winner} onPlayAgain={() => window.location.reload()} />
    );
  }

  // Game playing state
  if (room && gameInitialized && room.phase === 'playing') {
    if (isMobile && !isHost) {
      return (
        <MobilePlayerGameView
          currentPlayer={currentPlayer}
          gameState={gameState}
          room={room}
          onPlaceCard={placeCard}
          setIsPlaying={setIsPlaying}
        />
      );
    }

    return (
      <GamePlay
        room={room}
        players={players}
        currentPlayer={currentPlayer}
        isHost={isHost}
        gameState={gameState}
        onSetCurrentSong={() => Promise.resolve()}
        onPlaceCard={placeCard}
        setIsPlaying={setIsPlaying}
        getCurrentPlayer={getCurrentPlayer}
      />
    );
  }

  // Lobby state
  if (room && room.phase === 'lobby') {
    if (isHost) {
      return (
        <>
          <ConnectionStatus 
            connectionStatus={connectionStatus}
            wsState={wsState}
          />
          <HostLobby
            room={room}
            players={players}
            onStartGame={startGame}
            onLeaveRoom={leaveRoom}
            initializeGame={initializeGame}
          />
        </>
      );
    } else if (isMobile) {
      return (
        <>
          <ConnectionStatus 
            connectionStatus={connectionStatus}
            wsState={wsState}
          />
          <MobilePlayerLobby
            room={room}
            currentPlayer={currentPlayer}
            players={players}
            onLeaveRoom={leaveRoom}
          />
        </>
      );
    }
  }

  // Main menu
  return (
    <MainMenu
      onCreateRoom={createRoom}
      onJoinRoom={joinRoom}
      isLoading={isLoading}
    />
  );
}

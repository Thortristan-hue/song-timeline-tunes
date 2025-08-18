
import React from 'react';
import { useOptimizedGameRoom } from '@/hooks/useOptimizedGameRoom';
import { useOptimizedGameLogic } from '@/hooks/useOptimizedGameLogic';
import { MainMenu } from '@/components/MainMenu';
import { HostLobby } from '@/components/HostLobby';
import MobilePlayerLobby from '@/components/MobilePlayerLobby';
import { GamePlay } from '@/components/GamePlay';
import MobilePlayerGameView from '@/components/player/MobilePlayerGameView';
import { VictoryScreen } from '@/components/VictoryScreen';
import MobileVictoryScreen from '@/components/player/MobileVictoryScreen';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { useIsMobile } from '@/hooks/use-mobile';

export default function OptimizedIndex() {
  const isMobile = useIsMobile();
  
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

  // Find current turn player
  const currentTurnPlayer = players.find(p => p.id === room?.current_player_id) || players[0];

  // Victory condition
  if (gameState.winner) {
    return isMobile ? (
      <MobileVictoryScreen 
        winningPlayer={gameState.winner}
        allPlayers={players}
        onReplay={() => window.location.reload()}
        roomCode={room?.lobby_code || ''}
      />
    ) : (
      <VictoryScreen 
        winner={gameState.winner} 
        players={players}
        onPlayAgain={() => window.location.reload()}
        onBackToMenu={() => window.location.reload()}
      />
    );
  }

  // Game playing state
  if (room && gameInitialized && room.phase === 'playing') {
    if (isMobile && !isHost) {
      return (
        <MobilePlayerGameView
          currentPlayer={currentPlayer}
          currentTurnPlayer={currentTurnPlayer}
          currentSong={room.current_song}
          roomCode={room.lobby_code}
          isMyTurn={currentPlayer?.id === currentTurnPlayer?.id}
          isPlaying={gameState.isPlaying}
          onPlayPause={() => setIsPlaying(!gameState.isPlaying)}
          onPlaceCard={placeCard}
          mysteryCardRevealed={false}
          cardPlacementResult={null}
          gameEnded={false}
        />
      );
    }

    return (
      <GamePlay
        room={room}
        players={players}
        currentPlayer={currentPlayer}
        isHost={isHost}
        onSetCurrentSong={() => Promise.resolve()}
        onPlaceCard={placeCard}
        customSongs={gameState.availableSongs}
        connectionStatus={{
          isConnected: connectionStatus.isConnected,
          isReconnecting: connectionStatus.isReconnecting,
          lastError: '',
          retryCount: connectionStatus.retryCount
        }}
        onReconnect={() => {}}
        onReplayGame={() => window.location.reload()}
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
            lobbyCode={room.lobby_code}
            onStartGame={async () => {
              await initializeGame();
              await startGame();
            }}
            onBackToMenu={() => {
              leaveRoom();
              window.location.reload();
            }}
            setCustomSongs={() => {}}
            isLoading={isLoading}
            customSongs={gameState.availableSongs}
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
            onBackToMenu={() => {
              leaveRoom();
              window.location.reload();
            }}
            onUpdatePlayer={async (name: string, character: string) => {
              // TODO: Implement player update functionality
              console.log('Update player:', name, character);
            }}
          />
        </>
      );
    }
  }

  // Main menu
  return (
    <MainMenu
      onCreateRoom={async (hostName: string) => {
        const code = await createRoom(hostName);
        return code || '';
      }}
      onJoinRoom={async (lobbyCode: string, playerName: string) => {
        return await joinRoom(lobbyCode, playerName);
      }}
      isLoading={isLoading}
    />
  );
}

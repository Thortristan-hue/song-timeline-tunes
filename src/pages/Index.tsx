
import { useState } from 'react';
import { useGameRoom } from '@/hooks/useGameRoom';
import { audioManager } from '@/services/AudioManager';
import { GameState, GamePhase } from '@/types/game';
import { MainMenu } from '@/components/MainMenu';
import { HostLobby } from '@/components/HostLobby';
import { MobileJoin } from '@/components/MobileJoin';
import MobilePlayerLobby from '@/components/MobilePlayerLobby';
import GamePlay from '@/components/GamePlay';
import { VictoryScreen } from '@/components/VictoryScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ConnectionStatus } from '@/components/ConnectionStatus';

export default function Index() {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'menu',
    currentTurn: 0,
    currentSong: null,
    timeLeft: 30,
    isPlaying: false,
    isDarkMode: false,
    throwingCard: null,
    confirmingPlacement: null,
    cardResult: null,
    transitioningTurn: false,
    winner: null,
    isMuted: false,
    pendingPlacement: null,
    cardPlacementPending: false,
    cardPlacementConfirmed: false,
    cardPlacementCorrect: null,
    mysteryCardRevealed: false,
    gameEnded: false,
    highlightedGapIndex: null,
  });

  const {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    error,
    connectionStatus,
    forceReconnect,
    createRoom,
    joinRoom,
    updatePlayer,
    updateRoomSongs,
    updateRoomGamemode,
    startGame,
    leaveRoom,
    placeCard,
    setCurrentSong,
    assignStartingCards,
    kickPlayer,
  } = useGameRoom();

  const handlePhaseChange = (newPhase: GamePhase) => {
    setGameState(prev => ({ ...prev, phase: newPhase }));
  };

  const handleCreateRoom = async (hostName: string) => {
    const lobbyCode = await createRoom(hostName);
    if (lobbyCode) {
      handlePhaseChange('hostLobby');
      // Initialize audio manager as host
      if (room?.id) {
        await audioManager.initialize(room.id, true);
      }
    }
  };

  const handleJoinRoom = async (lobbyCode: string, playerName: string) => {
    const success = await joinRoom(lobbyCode, playerName);
    if (success) {
      handlePhaseChange('mobileLobby');
      // Initialize audio manager as mobile player
      if (room?.id) {
        await audioManager.initialize(room.id, false);
      }
    }
    return success;
  };

  const handleStartGame = async () => {
    await startGame();
    handlePhaseChange('playing');
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    audioManager.cleanup();
    handlePhaseChange('menu');
  };

  const handleGameEnd = () => {
    handlePhaseChange('finished');
  };

  const handleBackToMenu = () => {
    handleLeaveRoom();
    handlePhaseChange('menu');
  };

  const handleUpdatePlayer = async (name: string, character: string) => {
    await updatePlayer({ name, character });
  };

  const renderCurrentPhase = () => {
    switch (gameState.phase) {
      case 'menu':
        return (
          <MainMenu
            onCreateRoom={handleCreateRoom}
            onJoinRoom={() => handlePhaseChange('mobileJoin')}
            gameState={gameState}
            setGameState={setGameState}
          />
        );
      
      case 'hostLobby':
        return (
          <HostLobby
            room={room}
            players={players}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
            onUpdateSongs={updateRoomSongs}
            onUpdateGamemode={updateRoomGamemode}
            onKickPlayer={kickPlayer}
            gameState={gameState}
            setGameState={setGameState}
          />
        );
      
      case 'mobileJoin':
        return (
          <MobileJoin
            onJoinRoom={handleJoinRoom}
            gameState={gameState}
            setGameState={setGameState}
          />
        );
      
      case 'mobileLobby':
        return (
          <MobilePlayerLobby
            room={room}
            players={players}
            currentPlayer={currentPlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onLeaveRoom={handleLeaveRoom}
            gameState={gameState}
            setGameState={setGameState}
          />
        );
      
      case 'playing':
        return (
          <GamePlay
            room={room}
            players={players}
            currentPlayer={currentPlayer}
            isHost={isHost}
            onPlaceCard={placeCard}
            onSetCurrentSong={setCurrentSong}
            onGameEnd={handleGameEnd}
            gameState={gameState}
            setGameState={setGameState}
          />
        );
      
      case 'finished':
        return (
          <VictoryScreen
            winner={gameState.winner}
            players={players}
            onBackToMenu={handleBackToMenu}
            onPlayAgain={handleBackToMenu}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <ConnectionStatus 
          connectionStatus={{
            isConnected: connectionStatus === 'connected',
            isReconnecting: connectionStatus === 'connecting',
            lastError: connectionStatus === 'error' ? 'Connection error' : null,
            retryCount: 0
          }} 
          onReconnect={forceReconnect}
        />
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 m-4 rounded-lg">
            Error: {error}
          </div>
        )}
        
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 text-white">
              Loading...
            </div>
          </div>
        )}
        
        {renderCurrentPhase()}
      </div>
    </ErrorBoundary>
  );
}

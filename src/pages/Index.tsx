
import React, { useState, useEffect } from 'react';
import { MainMenu } from '@/components/MainMenu';
import { HostLobby } from '@/components/HostLobby';
import { MobileJoinFlow } from '@/components/MobileJoinFlow';
import MobilePlayerLobby from '@/components/MobilePlayerLobby';
import { GamePlay } from '@/components/GamePlay';
import { VictoryScreen } from '@/components/VictoryScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GameErrorBoundary } from '@/components/GameErrorBoundary';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { HostAudioController } from '@/components/HostAudioController';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useRealtimeGameState } from '@/hooks/useRealtimeGameState';
import { Song, GamePhase, Player } from '@/types/game';
import { useSoundEffects } from '@/hooks/useSoundEffects';

function Index() {
  const soundEffects = useSoundEffects();
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [customSongs, setCustomSongs] = useState<Song[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [winner, setWinner] = useState<Player | null>(null);
  const [autoJoinCode, setAutoJoinCode] = useState<string>('');

  const {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    error,
    connectionStatus,
    wsState,
    gameInitialized,
    forceReconnect,
    wsReconnect,
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
    kickPlayer
  } = useGameRoom();

  // Enhanced realtime game state management
  const { gameState, updateGameState, updatePlayerData } = useRealtimeGameState(
    room?.id || null,
    currentPlayer?.id || null
  );

  // Enhanced debugging for phase transitions
  console.log('[GameState] Index render - Phase transition debug:', {
    gamePhase,
    roomPhase: gameState.room?.phase || room?.phase,
    isHost: gameState.isHost || isHost,
    playersCount: gameState.players.length || players.length,
    currentPlayer: gameState.currentPlayer?.name || currentPlayer?.name,
    autoJoinCode,
    gameInitialized,
    isLoading,
    wsReady: wsState.isReady,
    realtimeConnected: gameState.isConnected
  });

  // Enhanced auto-join from URL parameters (QR code)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    
    if (joinCode && gamePhase === 'menu') {
      const cleanCode = joinCode.trim().toUpperCase();
      console.log('🔗 Auto-joining from URL parameter:', cleanCode);
      
      // Validate the lobby code format (5 letters + 1 digit)
      const lobbyCodeRegex = /^[A-Z]{5}[0-9]$/;
      if (lobbyCodeRegex.test(cleanCode)) {
        setAutoJoinCode(cleanCode);
        setGamePhase('mobileJoin');
        
        // Clear the URL parameter after processing to prevent re-triggering
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } else {
        console.error('❌ Invalid lobby code format:', cleanCode);
      }
    }
  }, [gamePhase]);

  // FIXED: Improved room phase transition logic with proper game start validation
  useEffect(() => {
    // Use realtime game state as primary source of truth
    const currentRoom = gameState.room || room;
    const currentPlayers = gameState.players.length > 0 ? gameState.players : players;
    const currentIsHost = gameState.isHost || isHost;
    
    // Only transition to playing when:
    // 1. Room phase is actually 'playing' 
    // 2. We're not already in playing phase
    // 3. For non-hosts: ensure we have a valid connection to receive the transition
    if (currentRoom?.phase === 'playing' && gamePhase !== 'playing') {
      // Add validation to ensure this is a legitimate game start
      const shouldTransition = currentIsHost || (gameState.isConnected && currentPlayers.length > 0);
      
      if (shouldTransition) {
        console.log('[GameState] Valid room transition to playing phase - starting game');
        console.log('[GameState] Room data:', { 
          phase: currentRoom.phase, 
          id: currentRoom.id, 
          hostId: currentRoom.host_id,
          isHost: currentIsHost,
          playersCount: currentPlayers.length,
          realtimeConnected: gameState.isConnected
        });
        
        setGamePhase('playing');
        soundEffects.playGameStart();
      } else {
        console.warn('[GameState] Ignoring premature room phase transition - connection not ready or no players');
      }
    }
  }, [gameState.room?.phase, gameState.room?.host_id, gameState.room?.id, gamePhase, soundEffects, gameState.isHost, gameState.players.length, gameState.isConnected, room?.phase, room?.host_id, room?.id, isHost, players.length, wsState.isReady]);

  // Check for winner using realtime game state
  useEffect(() => {
    const currentPlayers = gameState.players.length > 0 ? gameState.players : players;
    const winningPlayer = currentPlayers.find(player => player.score >= 10);
    if (winningPlayer && !winner) {
      setWinner(winningPlayer);
      setGamePhase('finished');
      soundEffects.playGameStart(); // Victory sound
    }
  }, [gameState.players, players, winner, soundEffects]);

  const handleCreateRoom = async (): Promise<boolean> => {
    try {
      const lobbyCode = await createRoom('Host');
      if (lobbyCode) {
        setGamePhase('hostLobby');
        soundEffects.playGameStart();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create room:', error);
      return false;
    }
  };

  const handleJoinRoom = async (lobbyCode: string, name: string): Promise<boolean> => {
    try {
      console.log('🎮 Attempting to join room with:', { lobbyCode, name });
      const success = await joinRoom(lobbyCode, name);
      if (success) {
        setPlayerName(name);
        setGamePhase('mobileLobby');
        soundEffects.playPlayerJoin();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to join room:', error);
      return false;
    }
  };

  const handleStartGame = async () => {
    try {
      console.log('🎮 Host starting game...');
      await startGame();
      // Note: Phase transition will be handled by the room phase listener
      soundEffects.playGameStart();
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const handleBackToMenu = () => {
    leaveRoom();
    setGamePhase('menu');
    setCustomSongs([]);
    setPlayerName('');
    setWinner(null);
    setAutoJoinCode(''); // Clear auto-join code
    soundEffects.playButtonClick();
  };

  const handlePlaceCard = async (song: Song, position: number) => {
    const result = await placeCard(song, position);
    return result;
  };

  // Create a wrapper function for updatePlayer that matches the expected signature
  const handleUpdatePlayer = async (name: string, characterId: string): Promise<void> => {
    // Import the character constants
    const { GAME_CHARACTERS } = await import('@/constants/characters');
    
    // Find the character data
    const selectedCharacter = GAME_CHARACTERS.find(char => char.id === characterId);
    const color = selectedCharacter?.color || '#007AFF';
    
    await updatePlayer({ name, color, character: characterId });
  };

  const handleRestartWithSamePlayers = () => {
    // Reset game state but keep same players
    setGamePhase('hostLobby');
    setWinner(null);
    soundEffects.playButtonClick();
  };

  const handleKickPlayer = async (playerId: string) => {
    if (kickPlayer) {
      const success = await kickPlayer(playerId);
      if (success) {
        soundEffects.playButtonClick();
      }
    }
  };

  const handlePlayAgain = () => {
    setGamePhase('hostLobby');
    setWinner(null);
    soundEffects.playButtonClick();
  };

  // FIXED: More specific loading state - only show when creating room
  if (isLoading && gamePhase === 'hostLobby' && !room) {
    return (
      <GameErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
          </div>
          <div className="text-center text-white relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-6 mx-auto border border-white/20">
              <div className="text-3xl animate-spin">🎵</div>
            </div>
            <div className="text-2xl font-semibold mb-2">Creating room...</div>
            <div className="text-white/60 max-w-md mx-auto">Setting up your game session</div>
          </div>
        </div>
      </GameErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <GameErrorBoundary>
        <div className="min-h-screen">
          {/* Connection status indicator */}
          <ConnectionStatus 
            connectionStatus={{
              isConnected: connectionStatus.isConnected && wsState.isConnected,
              isReconnecting: connectionStatus.isReconnecting || wsState.isConnecting,
              lastError: connectionStatus.lastError || wsState.lastError,
              retryCount: Math.max(connectionStatus.retryCount, wsState.reconnectAttempts)
            }}
            onReconnect={() => {
              forceReconnect();
              wsReconnect();
            }}
          />

          {gamePhase === 'menu' && (
            <MainMenu
              onCreateRoom={() => setGamePhase('hostLobby')}
              onJoinRoom={() => setGamePhase('mobileJoin')}
            />
          )}

          {gamePhase === 'hostLobby' && (
            <HostLobby
              room={gameState.room || room}
              lobbyCode={(gameState.room || room)?.lobby_code || ''}
              players={gameState.players.length > 0 ? gameState.players : players}
              onStartGame={handleStartGame}
              onBackToMenu={handleBackToMenu}
              setCustomSongs={setCustomSongs}
              isLoading={isLoading}
              createRoom={handleCreateRoom}
              onKickPlayer={handleKickPlayer}
              updateRoomGamemode={updateRoomGamemode}
            />
          )}

          {gamePhase === 'mobileJoin' && (
            <MobileJoinFlow
              onJoinRoom={handleJoinRoom}
              onBackToMenu={handleBackToMenu}
              isLoading={isLoading}
              autoJoinCode={autoJoinCode}
            />
          )}

          {gamePhase === 'mobileLobby' && (
            <MobilePlayerLobby
              room={gameState.room || room}
              players={gameState.players.length > 0 ? gameState.players : players}
              currentPlayer={gameState.currentPlayer || currentPlayer}
              onBackToMenu={handleBackToMenu}
              onUpdatePlayer={handleUpdatePlayer}
            />
          )}

          {gamePhase === 'playing' && (gameState.room || room) && (gameState.currentPlayer || currentPlayer) && (
            <>
              {/* Host audio controller - only for host */}
              <HostAudioController 
                roomId={(gameState.room || room)!.id} 
                isHost={gameState.isHost || isHost} 
              />
              
              <GamePlay
                room={gameState.room || room}
                players={gameState.players.length > 0 ? gameState.players : players}
                currentPlayer={gameState.currentPlayer || currentPlayer}
                isHost={gameState.isHost || isHost}
                onPlaceCard={handlePlaceCard}
                onSetCurrentSong={setCurrentSong}
                customSongs={customSongs}
                connectionStatus={{
                  isConnected: (gameState.isConnected && connectionStatus.isConnected) && wsState.isConnected,
                  isReconnecting: connectionStatus.isReconnecting || wsState.isConnecting,
                  lastError: gameState.error || connectionStatus.lastError || wsState.lastError,
                  retryCount: Math.max(connectionStatus.retryCount, wsState.reconnectAttempts)
                }}
                onReconnect={() => {
                  forceReconnect();
                  wsReconnect();
                }}
                onReplayGame={handlePlayAgain}
              />
            </>
          )}

          {gamePhase === 'finished' && winner && (
            <VictoryScreen
              winner={winner}
              players={players}
              onPlayAgain={handlePlayAgain}
              onRestartWithSamePlayers={isHost ? handleRestartWithSamePlayers : undefined}
              onBackToMenu={handleBackToMenu}
            />
          )}

          {error && (
            <div className="fixed bottom-4 right-4 bg-red-500/90 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
              <div className="font-bold mb-1">Oops!</div>
              <div className="text-sm">{error}</div>
            </div>
          )}
        </div>
      </GameErrorBoundary>
    </ErrorBoundary>
  );
}

export default Index;

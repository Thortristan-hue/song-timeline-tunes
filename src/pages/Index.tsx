
import React, { useState, useEffect } from 'react';
import { MainMenu } from '@/components/MainMenu';
import { HostLobby } from '@/components/HostLobby';
import { MobileJoin } from '@/components/MobileJoin';
import MobilePlayerLobby from '@/components/MobilePlayerLobby';
import { GamePlay } from '@/components/GamePlay';
import { VictoryScreen } from '@/components/VictoryScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GameErrorBoundary } from '@/components/GameErrorBoundary';
import { LoadingErrorBoundary } from '@/components/LoadingErrorBoundary';
import { useGameRoom } from '@/hooks/useGameRoom';
import { Song, GamePhase } from '@/types/game';
import { useSoundEffects } from '@/hooks/useSoundEffects';

function Index() {
  const soundEffects = useSoundEffects();
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [customSongs, setCustomSongs] = useState<Song[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [winner, setWinner] = useState<any>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    error,
    createRoom,
    joinRoom,
    updatePlayer,
    updateRoomSongs,
    startGame,
    leaveRoom,
    placeCard,
    setCurrentSong,
    assignStartingCards,
    clearError,
    retryConnection
  } = useGameRoom();

  // Enhanced debugging for phase transitions
  console.log('📱 Index render - Phase transition debug:', {
    gamePhase,
    roomPhase: room?.phase,
    isHost,
    playersCount: players.length,
    currentPlayer: currentPlayer?.name,
    isLoading,
    error,
    isCreatingRoom
  });

  // Check for auto-join from URL parameters (QR code)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join');
    
    if (joinCode && gamePhase === 'menu') {
      console.log('🔗 Auto-joining from URL:', joinCode);
      setGamePhase('mobileJoin');
      // Clear the URL parameter after processing
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [gamePhase]);

  // Enhanced room phase listener with better error handling
  useEffect(() => {
    if (room?.phase === 'playing' && gamePhase !== 'playing') {
      console.log('🎮 Room transitioned to playing phase - starting game');
      console.log('🎮 Room data:', { 
        phase: room.phase, 
        id: room.id, 
        hostId: room.host_id,
        isHost,
        playersCount: players.length 
      });
      
      setGamePhase('playing');
      soundEffects.playGameStart();
    }
  }, [room?.phase, gamePhase, soundEffects, isHost, players.length]);

  // Check for winner
  useEffect(() => {
    const winningPlayer = players.find(player => player.score >= 10);
    if (winningPlayer && !winner) {
      setWinner(winningPlayer);
      setGamePhase('finished');
      soundEffects.playGameStart(); // Victory sound
    }
  }, [players, winner, soundEffects]);

  // FIXED: Proper room creation with phase management
  const handleCreateRoom = async () => {
    if (isCreatingRoom) return; // Prevent double creation
    
    try {
      console.log('🏠 Starting room creation process...');
      setIsCreatingRoom(true);
      clearError(); // Clear any previous errors
      
      const lobbyCode = await createRoom('Host');
      if (lobbyCode) {
        console.log('✅ Room created successfully, transitioning to lobby');
        setGamePhase('hostLobby');
        soundEffects.playGameStart();
      } else {
        console.error('❌ Room creation failed');
        setIsCreatingRoom(false);
      }
    } catch (error) {
      console.error('❌ Room creation error:', error);
      setIsCreatingRoom(false);
    }
  };

  // FIXED: Clean up room creation state when room is successfully created
  useEffect(() => {
    if (room && isCreatingRoom) {
      console.log('✅ Room creation completed, clearing creation state');
      setIsCreatingRoom(false);
    }
  }, [room, isCreatingRoom]);

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
    setIsCreatingRoom(false);
    clearError();
    soundEffects.playButtonClick();
  };

  const handlePlaceCard = async (song: Song, position: number) => {
    const result = await placeCard(song, position);
    return result;
  };

  // Create a wrapper function for updatePlayer that matches the expected signature
  const handleUpdatePlayer = async (name: string, color: string): Promise<void> => {
    await updatePlayer({ name, color });
  };

  const handleRetry = () => {
    clearError();
    retryConnection();
    setIsCreatingRoom(false);
  };

  return (
    <ErrorBoundary>
      <GameErrorBoundary>
        <LoadingErrorBoundary
          isLoading={(isLoading && gamePhase !== 'menu') || isCreatingRoom}
          error={error}
          onRetry={handleRetry}
          onBackToMenu={handleBackToMenu}
          loadingMessage={
            isCreatingRoom ? 'Creating your room...' :
            gamePhase === 'hostLobby' ? 'Setting up your room...' :
            gamePhase === 'mobileJoin' ? 'Joining room...' :
            gamePhase === 'mobileLobby' ? 'Loading lobby...' :
            gamePhase === 'playing' ? 'Loading game...' :
            'Getting things ready...'
          }
        >
          <div className="min-h-screen">
            {gamePhase === 'menu' && (
              <MainMenu
                onCreateRoom={handleCreateRoom}
                onJoinRoom={() => setGamePhase('mobileJoin')}
              />
            )}

            {gamePhase === 'hostLobby' && room && (
              <HostLobby
                lobbyCode={room.lobby_code}
                players={players}
                onStartGame={handleStartGame}
                onBackToMenu={handleBackToMenu}
                setCustomSongs={setCustomSongs}
                isLoading={isLoading}
              />
            )}

            {gamePhase === 'mobileJoin' && (
              <MobileJoin
                onJoinRoom={handleJoinRoom}
                onBackToMenu={handleBackToMenu}
                isLoading={isLoading}
              />
            )}

            {gamePhase === 'mobileLobby' && (
              <MobilePlayerLobby
                room={room}
                players={players}
                currentPlayer={currentPlayer}
                onBackToMenu={handleBackToMenu}
                onUpdatePlayer={handleUpdatePlayer}
              />
            )}

            {gamePhase === 'playing' && room && currentPlayer && (
              <GamePlay
                room={room}
                players={players}
                currentPlayer={currentPlayer}
                isHost={isHost}
                onPlaceCard={handlePlaceCard}
                onSetCurrentSong={setCurrentSong}
                customSongs={customSongs}
              />
            )}

            {gamePhase === 'finished' && winner && (
              <VictoryScreen
                winner={winner}
                players={players}
                onPlayAgain={() => {
                  setGamePhase('hostLobby');
                  setWinner(null);
                }}
                onBackToMenu={handleBackToMenu}
              />
            )}
          </div>
        </LoadingErrorBoundary>
      </GameErrorBoundary>
    </ErrorBoundary>
  );
}

export default Index;

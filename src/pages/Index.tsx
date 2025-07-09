import React, { useState, useEffect } from 'react';
import { MainMenu } from '@/components/MainMenu';
import { HostLobby } from '@/components/HostLobby';
import { MobileJoin } from '@/components/MobileJoin';
import MobilePlayerLobby from '@/components/MobilePlayerLobby';
import { GamePlay } from '@/components/GamePlay';
import { VictoryScreen } from '@/components/VictoryScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GameErrorBoundary } from '@/components/GameErrorBoundary';
import { useGameRoom } from '@/hooks/useGameRoom';
import { Song, GamePhase } from '@/types/game';
import { useSoundEffects } from '@/hooks/useSoundEffects';

function Index() {
  const soundEffects = useSoundEffects();
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [customSongs, setCustomSongs] = useState<Song[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [winner, setWinner] = useState<any>(null);

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
    assignStartingCards
  } = useGameRoom();

  // Enhanced debugging for phase transitions
  console.log('📱 Index render - Phase transition debug:', {
    gamePhase,
    roomPhase: room?.phase,
    isHost,
    playersCount: players.length,
    currentPlayer: currentPlayer?.name,
    hasRoom: !!room
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

  const handleCreateRoom = async (): Promise<boolean> => {
    try {
      console.log('🏠 Starting room creation...');
      const lobbyCode = await createRoom('Host');
      console.log('🏠 Room creation result:', { lobbyCode, hasRoom: !!room });
      
      if (lobbyCode) {
        // Wait a moment for room state to be set
        setTimeout(() => {
          setGamePhase('hostLobby');
          soundEffects.playGameStart();
        }, 100);
        return true;
      }
      console.error('❌ Room creation failed - no lobby code returned');
      return false;
    } catch (error) {
      console.error('❌ Failed to create room:', error);
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

  // Modern loading state
  if (isLoading && gamePhase !== 'menu') {
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
            <div className="text-2xl font-semibold mb-2">Setting things up...</div>
            <div className="text-white/60 max-w-md mx-auto">Getting your music game experience ready</div>
          </div>
        </div>
      </GameErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <GameErrorBoundary>
        <div className="min-h-screen">
          {gamePhase === 'menu' && (
            <MainMenu
              onCreateRoom={handleCreateRoom}
              onJoinRoom={() => setGamePhase('mobileJoin')}
            />
          )}

          {gamePhase === 'hostLobby' && (
            <HostLobby
              onGameStart={handleStartGame}
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

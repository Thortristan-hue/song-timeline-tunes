import React, { useState, useEffect } from 'react';
import { MainMenu } from '@/components/MainMenu';
import { HostLobby } from '@/components/HostLobby';
import { MobileJoinFlow } from '@/components/MobileJoinFlow';
import MobilePlayerLobby from '@/components/MobilePlayerLobby';
import { GamePlay } from '@/components/GamePlay';
import { VictoryScreen } from '@/components/VictoryScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GameErrorBoundary } from '@/components/GameErrorBoundary';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useGameRoom } from '@/hooks/useGameRoom';
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
    kickPlayer
  } = useGameRoom();

  // Enhanced debugging for phase transitions
  console.log('📱 Index render - Phase transition debug:', {
    gamePhase,
    roomPhase: room?.phase,
    isHost,
    playersCount: players.length,
    currentPlayer: currentPlayer?.name,
    autoJoinCode
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
        // Show error toast for invalid format
        // Note: toast would need to be available here, but keeping it simple for now
      }
    }
  }, [gamePhase]);

  // Enhanced room phase listener with comprehensive error handling and logging
  useEffect(() => {
    if (room?.phase === 'playing' && gamePhase !== 'playing') {
      console.log('🎮 PHASE TRANSITION: Room transitioned to playing phase - starting game');
      console.log('🎮 PHASE TRANSITION: Room data:', { 
        phase: room.phase, 
        id: room.id, 
        hostId: room.host_id,
        isHost,
        playersCount: players.length,
        currentPlayerName: currentPlayer?.name,
        lobbyCode: room.lobby_code
      });
      
      // Additional safety checks before transition
      if (!room.id) {
        console.error('❌ PHASE TRANSITION: Cannot transition to playing - missing room ID');
        return;
      }
      
      if (isHost && players.length === 0) {
        console.warn('⚠️  PHASE TRANSITION: Host transitioning with no players - this might cause issues');
      }
      
      console.log('✅ PHASE TRANSITION: All checks passed, transitioning to playing phase');
      setGamePhase('playing');
      soundEffects.playGameStart();
    }
  }, [room?.phase, room?.host_id, room?.id, gamePhase, soundEffects, isHost, players.length, currentPlayer?.name, room?.lobby_code]);

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
      console.log('🎮 Game start request completed successfully');
    } catch (error) {
      console.error('❌ Failed to start game:', error);
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
  const handleUpdatePlayer = async (name: string, color: string): Promise<void> => {
    await updatePlayer({ name, color });
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

  // Enhanced loading state with new loading screen
  if (isLoading && gamePhase !== 'menu') {
    return (
      <GameErrorBoundary>
        <LoadingScreen
          title="Setting things up..."
          subtitle="Getting your music game experience ready"
          variant="connection"
        />
      </GameErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <GameErrorBoundary>
        <div className="min-h-screen">
          {gamePhase === 'menu' && (
            <MainMenu
              onCreateRoom={() => setGamePhase('hostLobby')}
              onJoinRoom={() => setGamePhase('mobileJoin')}
            />
          )}

          {gamePhase === 'hostLobby' && (
            <HostLobby
              room={room}
              lobbyCode={room?.lobby_code || ''}
              players={players}
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
              room={room}
              players={players}
              currentPlayer={currentPlayer}
              onBackToMenu={handleBackToMenu}
              onUpdatePlayer={handleUpdatePlayer}
            />
          )}

          {gamePhase === 'playing' && (
            /* DEFENSIVE RENDERING: Ensure all required data is available before rendering GamePlay */
            room && currentPlayer ? (
              <GamePlay
                room={room}
                players={players}
                currentPlayer={currentPlayer}
                isHost={isHost}
                onPlaceCard={handlePlaceCard}
                onSetCurrentSong={setCurrentSong}
                customSongs={customSongs}
                connectionStatus={connectionStatus}
                onReconnect={forceReconnect}
                onReplayGame={handlePlayAgain}
              />
            ) : (
              /* Fallback UI for missing required data */
              <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden flex items-center justify-center p-4">
                <div className="text-center text-white relative z-10 max-w-md mx-auto p-6">
                  <div className="text-4xl mb-4">⏳</div>
                  <div className="text-2xl font-bold mb-3">Loading Game...</div>
                  <div className="text-lg mb-4">
                    {!room ? 'Connecting to room...' : 'Setting up player data...'}
                  </div>
                  <div className="text-sm text-white/60 mb-6">Please wait a moment</div>
                  
                  {/* Debug info for development */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="bg-black/50 p-3 rounded-lg text-xs text-left">
                      <div className="font-bold mb-2">Debug Info:</div>
                      <div>Room: {room ? '✓' : '✗ Missing'}</div>
                      <div>Current Player: {currentPlayer ? '✓' : '✗ Missing'}</div>
                      <div>Is Host: {isHost ? 'Yes' : 'No'}</div>
                      <div>Players Count: {players.length}</div>
                      <div>Game Phase: {gamePhase}</div>
                      <div>Room Phase: {room?.phase || 'Unknown'}</div>
                    </div>
                  )}
                  
                  {/* Back to menu option if stuck */}
                  <button
                    onClick={handleBackToMenu}
                    className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200"
                  >
                    Back to Menu
                  </button>
                </div>
              </div>
            )
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

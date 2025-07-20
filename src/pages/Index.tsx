import React, { useState, useEffect } from 'react';
import { MainMenu } from '@/components/MainMenu';
import { HostLobby } from '@/components/HostLobby';
import { MobileJoinFlow } from '@/components/MobileJoinFlow';
import MobilePlayerLobby from '@/components/MobilePlayerLobby';
import { GamePlay } from '@/components/GamePlay';
import { VictoryScreen } from '@/components/VictoryScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GameErrorBoundary } from '@/components/GameErrorBoundary';
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

  // Enhanced room phase listener with better error handling and currentPlayer validation
  useEffect(() => {
    if (room?.phase === 'playing' && gamePhase !== 'playing') {
      console.log('🎮 Room transitioned to playing phase - starting game');
      console.log('🎮 Room data:', { 
        phase: room.phase, 
        id: room.id, 
        hostId: room.host_id,
        currentPlayerId: room.current_player_id,
        isHost,
        playersCount: players.length,
        hasCurrentPlayer: !!currentPlayer
      });
      
      // Enhanced validation before transitioning
      if (!room.current_player_id && players.length > 0) {
        console.error('❌ PHASE TRANSITION ERROR: No current_player_id set but players available');
        console.error('❌ This may cause the game to get stuck. Room data:', room);
      }

      // CRITICAL FIX: For non-host players, ensure currentPlayer is available before transitioning
      if (!isHost && !currentPlayer && players.length > 0) {
        console.warn('⚠️ PHASE TRANSITION WARNING: Missing currentPlayer for non-host, delaying transition');
        
        // Try to find current player based on room's current_player_id
        const foundCurrentPlayer = players.find(p => p.id === room.current_player_id);
        if (foundCurrentPlayer) {
          console.log('🔄 Found currentPlayer in players list, this should resolve automatically');
        } else {
          console.error('❌ CRITICAL: Cannot find currentPlayer in players list');
          setError('Unable to identify your player session. Please refresh and rejoin the room.');
          return;
        }
      }
      
      setGamePhase('playing');
      
      // Enhanced audio start with better error handling and non-blocking behavior
      setTimeout(() => {
        try {
          soundEffects.playGameStart();
        } catch (error) {
          console.warn('🔊 Game start sound failed, continuing anyway:', error);
        }
      }, 100); // Delay to prevent blocking phase transition
    }
  }, [room?.phase, room?.host_id, room?.id, room?.current_player_id, gamePhase, soundEffects, isHost, players.length, currentPlayer]);

  // CRITICAL FIX: Recovery mechanism for missing currentPlayer in playing phase
  useEffect(() => {
    if (room?.phase === 'playing' && gamePhase === 'playing' && !isHost && !currentPlayer && players.length > 0) {
      console.log('🔄 RECOVERY: Attempting to restore missing currentPlayer');
      
      // Try to find player by session ID first
      const myPlayerBySession = players.find(p => 
        p.id.includes(playerName) || 
        p.name === playerName
      );
      
      if (myPlayerBySession) {
        console.log('🔄 RECOVERY: Found player by name match:', myPlayerBySession.name);
        // This will be handled by the fetchPlayersOptimized function
        return;
      }
      
      // If we're the current turn player, we can identify ourselves
      if (room.current_player_id) {
        const currentTurnPlayer = players.find(p => p.id === room.current_player_id);
        if (currentTurnPlayer) {
          console.log('🔄 RECOVERY: Could identify current turn player:', currentTurnPlayer.name);
          // The user might be this player, but we need more certainty
        }
      }
      
      // Last resort: show a helpful error after a delay
      setTimeout(() => {
        if (!currentPlayer && !isHost && room?.phase === 'playing') {
          console.error('❌ RECOVERY FAILED: Could not restore currentPlayer after attempts');
          setError('Your player session was lost. Please leave and rejoin the room.');
        }
      }, 3000); // Give 3 seconds for automatic recovery
    }
  }, [room?.phase, gamePhase, isHost, currentPlayer, players, room?.current_player_id, playerName]);
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

          {gamePhase === 'playing' && room && (isHost || currentPlayer) && (
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

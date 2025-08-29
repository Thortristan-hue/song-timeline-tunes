
import React, { useState, useEffect, useCallback } from 'react';
import { MainMenu } from '@/components/MainMenu';
import { HostLobby } from '@/components/HostLobby';
import { MobileJoinFlow } from '@/components/MobileJoinFlow';
import MobilePlayerLobby from '@/components/MobilePlayerLobby';
import { GamePlay } from '@/components/GamePlay';
import { VictoryScreen } from '@/components/VictoryScreen';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GameErrorBoundary } from '@/components/GameErrorBoundary';
import { LoadingScreen, GameLoadingScreen } from '@/components/LoadingScreen';
import { useGameRoom } from '@/hooks/useGameRoom';
import { Song, GamePhase, Player } from '@/types/game';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { getRealtimeSync } from '@/services/realtimeGameSync';

function Index() {
  const soundEffects = useSoundEffects();
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [customSongs, setCustomSongs] = useState<Song[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [winner, setWinner] = useState<Player | null>(null);
  const [autoJoinCode, setAutoJoinCode] = useState<string>('');
  
  // Part 2.1: Add new state variables for mystery song and player cards
  const [mysterySong, setMysterySong] = useState<Song | null>(null);
  const [playerCards, setPlayerCards] = useState<Song[]>([]);

  // Part 2.2: Add new WebSocket message handlers
  const handlePlayerCardDealt = useCallback((data: { card: Song }) => {
    console.log('🃏 PLAYER_CARD_DEALT received:', data);
    // Update playerCards state by appending the new card
    setPlayerCards(prev => [...prev, data.card]);
    soundEffects.playButtonClick();
  }, [soundEffects]);

  const handleGameStartedMessage = useCallback((data: { gamePhase: string; mysterySong: Song }) => {
    console.log('🎮 GAME_STARTED received:', data);
    // Set gamePhase and mysterySong from server
    if (data.gamePhase === 'playing') {
      setGamePhase('playing');
    }
    setMysterySong(data.mysterySong);
    soundEffects.playGameStart();
  }, [soundEffects]);

  const handleNewMysterySong = useCallback((data: { mysterySong: Song }) => {
    console.log('🎵 NEW_MYSTERY_SONG received:', data);
    // Update mysterySong state
    setMysterySong(data.mysterySong);
  }, []);

  const {
    room,
    players,
    currentPlayer,
    isHost,
    error: roomError,
    isLoading: roomLoading,
    createRoom,
    joinRoom,
    startGame,
    refreshRoom,
    leaveRoom
  } = useGameRoom();

  // Setup real-time message handlers
  useEffect(() => {
    const realtimeSync = getRealtimeSync();
    if (realtimeSync) {
      realtimeSync.onUpdate('PLAYER_CARD_DEALT', (update) => {
        if (update.payload.playerId === currentPlayer?.id) {
          handlePlayerCardDealt(update.payload);
        }
      });

      realtimeSync.onUpdate('GAME_STARTED', (update) => {
        handleGameStartedMessage(update.payload);
      });

      realtimeSync.onUpdate('NEW_MYSTERY_SONG', (update) => {
        handleNewMysterySong(update.payload);
      });

      realtimeSync.onUpdate('PLAYER_JOINED', (update) => {
        console.log('👋 Player joined:', update.payload.player);
        refreshRoom();
      });
    }
  }, [currentPlayer, handlePlayerCardDealt, handleGameStartedMessage, handleNewMysterySong, refreshRoom]);

  // Update mystery song when room current_song changes
  useEffect(() => {
    if (room?.current_song) {
      setMysterySong(room.current_song);
    }
  }, [room?.current_song]);

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

  // Game phase transition logic
  useEffect(() => {
    if (room?.phase === 'playing' && gamePhase !== 'playing') {
      const shouldTransition = isHost || players.length > 0;
      
      if (shouldTransition) {
        console.log('🎮 Room transition to playing phase');
        setGamePhase('playing');
        soundEffects.playGameStart();
      }
    }
  }, [room?.phase, gamePhase, soundEffects, isHost, players.length]);

  // Check for winner
  useEffect(() => {
    const winningPlayer = players.find(player => player.score >= 9);
    if (winningPlayer && !winner) {
      setWinner(winningPlayer);
      setGamePhase('finished');
      soundEffects.playGameStart(); // Victory sound
    }
  }, [players, winner, soundEffects]);


  const handleCreateRoom = async (): Promise<boolean> => {
    try {
      const sessionId = `host-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const success = await createRoom(sessionId);
      if (success) {
        soundEffects.playGameStart();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create room:', error);
      return false;
    }
  };

  const handleJoinRoom = async (code: string, name: string, character: string): Promise<boolean> => {
    try {
      console.log('🎮 Attempting to join room with:', { code, name, character });
      const success = await joinRoom(code, name, character);
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

  // Part 2.4: Centralized startGame logic
  const handleStartGame = async (): Promise<boolean> => {
    if (!customSongs || customSongs.length === 0) {
      console.error('❌ No songs available for game');
      return false;
    }

    console.log('🎮 Starting game with', customSongs.length, 'songs');
    
    try {
      const success = await startGame(customSongs);
      if (success) {
        console.log('✅ Game started successfully');
        return true;
      } else {
        console.error('❌ Failed to start game');
        return false;
      }
    } catch (error) {
      console.error('❌ Error starting game:', error);
      return false;
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

  const handlePlayAgain = () => {
    setGamePhase('hostLobby');
    setWinner(null);
    soundEffects.playButtonClick();
  };

  // Show loading screen only when room is being created
  if (roomLoading && gamePhase === 'menu') {
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
          {gamePhase === 'menu' && (
            <MainMenu
              onCreateRoom={() => setGamePhase('hostLobby')}
              onJoinRoom={() => setGamePhase('mobileJoin')}
            />
          )}

          {gamePhase === 'hostLobby' && (
            <HostLobby
              roomCode={room?.lobby_code || ''}
              players={players}
              onStartGame={async () => { await handleStartGame(); }}
              onBackToMenu={handleBackToMenu}
              customSongs={customSongs}
            />
          )}

          {gamePhase === 'mobileJoin' && (
            <MobileJoinFlow
              onJoinRoom={handleJoinRoom}
              onBackToMenu={handleBackToMenu}
              autoJoinCode={autoJoinCode}
            />
          )}

          {gamePhase === 'mobileLobby' && (
            <MobilePlayerLobby
              room={room}
              players={players}
              currentPlayer={currentPlayer}
              onBackToMenu={handleBackToMenu}
              onUpdatePlayer={async () => {}} // Dummy function for now
            />
          )}

          {gamePhase === 'playing' && room && currentPlayer && (
            <GamePlay
              room={room}
              players={players}
              currentPlayer={currentPlayer}
              isHost={isHost}
              onPlaceCard={async (song, position) => ({ success: true, correct: true })}
              onSetCurrentSong={async () => {}}
              customSongs={customSongs}
              connectionStatus={{
                isConnected: true,
                isReconnecting: false,
                lastError: null,
                retryCount: 0
              }}
              onReconnect={() => {}}
              onReplayGame={handlePlayAgain}
            />
          )}

          {gamePhase === 'finished' && winner && (
            <VictoryScreen
              winner={winner}
              players={players}
              onPlayAgain={handlePlayAgain}
              onBackToMenu={handleBackToMenu}
            />
          )}

          {roomError && (
            <div className="fixed bottom-4 right-4 bg-red-500/90 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
              <div className="font-bold mb-1">Oops!</div>
              <div className="text-sm">{roomError}</div>
            </div>
          )}
        </div>
      </GameErrorBoundary>
    </ErrorBoundary>
  );
}

export default Index;

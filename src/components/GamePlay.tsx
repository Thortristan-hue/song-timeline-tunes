import React, { useState, useEffect, useRef } from 'react';
import { useClassicGameLogic } from '@/hooks/useClassicGameLogic';
import { useFiendGameLogic } from '@/hooks/useFiendGameLogic';
import { useSprintGameLogic } from '@/hooks/useSprintGameLogic';
import MobilePlayerGameView from '@/components/player/MobilePlayerGameView';
import MobileVictoryScreen from '@/components/player/MobileVictoryScreen';
import { HostGameView } from '@/components/HostVisuals';
import { FiendModePlayerView } from '@/components/fiend/FiendModePlayerView';
import { FiendModeHostView } from '@/components/fiend/FiendModeHostView';
import { SprintModePlayerView } from '@/components/sprint/SprintModePlayerView';
import { SprintModeHostView } from '@/components/sprint/SprintModeHostView';
import { HostViewErrorBoundary } from '@/components/HostViewErrorBoundary';
import { Song, Player } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { GameService } from '@/services/gameService';
import { defaultPlaylistService } from '@/services/defaultPlaylistService';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { ConnectionStatus as ConnectionStatusType } from '@/hooks/useRealtimeSubscription';
import { GameRoom } from '@/types/game';
import { HostGameOverScreen } from '@/components/host/HostGameOverScreen';
import { LoadingScreen } from '@/components/LoadingScreen';

interface GamePlayProps {
  room: GameRoom;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  onPlaceCard: (song: Song, position: number, availableSongs?: Song[]) => Promise<{ success: boolean; correct?: boolean }>;
  onSetCurrentSong: (song: Song) => Promise<void>;
  customSongs: Song[];
  connectionStatus?: ConnectionStatusType;
  onReconnect?: () => void;
  onReplayGame?: () => void;
}

export function GamePlay({
  room,
  players,
  currentPlayer,
  isHost,
  onPlaceCard,
  onSetCurrentSong,
  customSongs,
  connectionStatus,
  onReconnect,
  onReplayGame
}: GamePlayProps) {
  const soundEffects = useSoundEffects();
  const [isPlaying, setIsPlaying] = useState(false);
  const [cardPlacementResult, setCardPlacementResult] = useState<{ correct: boolean; song: Song } | null>(null);
  const [mysteryCardRevealed, setMysteryCardRevealed] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [winningPlayer, setWinningPlayer] = useState<Player | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [gameInitialized, setGameInitialized] = useState(false);
  const [lastTurnIndex, setLastTurnIndex] = useState<number>(-1);
  const [highlightedGapIndex, setHighlightedGapIndex] = useState<number | null>(null);
  const [mobileViewport, setMobileViewport] = useState<{ startIndex: number; endIndex: number; totalCards: number } | null>(null);
  
  // Gamemode-specific state
  const [currentRound, setCurrentRound] = useState(1);
  const [playerGuesses, setPlayerGuesses] = useState<Record<string, { year: number; accuracy: number; points: number }>>({});
  const [playerTimeouts, setPlayerTimeouts] = useState<Record<string, number>>({});
  const [recentPlacements, setRecentPlacements] = useState<Record<string, { correct: boolean; song: Song; timestamp: number }>>({});

  // Audio management - ENHANCED FOR UNIVERSAL CONTROL
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioChannelRef = useRef<BroadcastChannel | null>(null);
  const realtimeChannelRef = useRef<any>(null);

  // Use appropriate game logic based on gamemode
  const gamemode = room?.gamemode || 'classic';
  
  const classicLogic = useClassicGameLogic(room?.id, players, room, onSetCurrentSong);
  const fiendLogic = useFiendGameLogic(room?.id, players, room, onSetCurrentSong);
  const sprintLogic = useSprintGameLogic(room?.id, players, room, onSetCurrentSong);
  
  const gameLogic = gamemode === 'fiend' ? fiendLogic : 
                   gamemode === 'sprint' ? sprintLogic : 
                   classicLogic;

  // ENHANCED: Real-time audio control setup
  useEffect(() => {
    if (!room?.id) return;

    console.log('AUDIO: Setting up universal audio control for room:', room.id);
    
    // Create broadcast channel for cross-tab audio sync
    const audioChannel = new BroadcastChannel(`audio-control-${room.id}`);
    audioChannelRef.current = audioChannel;

    // Set up real-time channel for instant audio control
    const channel = supabase
      .channel(`audio-control-${room.id}`)
      .on('broadcast', { event: 'audio-control' }, ({ payload }) => {
        console.log('AUDIO: Received audio control broadcast:', payload);
        if (payload.action === 'play' && isHost) {
          handleHostAudioPlay();
        } else if (payload.action === 'pause' && isHost) {
          handleHostAudioPause();
        }
      })
      .subscribe((status) => {
        console.log('AUDIO: Control channel status:', status);
      });

    realtimeChannelRef.current = channel;

    // Listen for broadcast messages
    audioChannel.onmessage = (event) => {
      const { action, roomId } = event.data;
      if (roomId === room.id && isHost) {
        if (action === 'play') {
          handleHostAudioPlay();
        } else if (action === 'pause') {
          handleHostAudioPause();
        }
      }
    };

    return () => {
      audioChannel.close();
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [room?.id, isHost]);

  // Enhanced host audio control functions
  const handleHostAudioPlay = async () => {
    if (!isHost || !room?.current_song?.preview_url) return;

    console.log('AUDIO: Host playing audio from universal control');
    
    // Stop any existing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    // Create new audio element
    const audio = new Audio(room.current_song.preview_url);
    audio.crossOrigin = 'anonymous';
    audio.volume = 0.8;
    audio.preload = 'auto';
    
    currentAudioRef.current = audio;
    
    // Enhanced event handlers
    audio.addEventListener('ended', () => {
      console.log('AUDIO: Host audio playback ended');
      setIsPlaying(false);
      gameLogic.setIsPlaying(false);
      broadcastAudioState('pause');
    });
    
    audio.addEventListener('error', (e) => {
      console.error('AUDIO: Host audio error:', e);
      setIsPlaying(false);
      gameLogic.setIsPlaying(false);
      broadcastAudioState('pause');
    });
    
    try {
      await audio.play();
      console.log('AUDIO: Host audio playing successfully');
      setIsPlaying(true);
      gameLogic.setIsPlaying(true);
      broadcastAudioState('play');
    } catch (error) {
      console.error('AUDIO: Host audio play failed:', error);
      setIsPlaying(false);
      gameLogic.setIsPlaying(false);
    }
  };

  const handleHostAudioPause = () => {
    if (!isHost) return;

    console.log('AUDIO: Host pausing audio from universal control');
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    setIsPlaying(false);
    gameLogic.setIsPlaying(false);
    broadcastAudioState('pause');
  };

  // Broadcast audio state to all players
  const broadcastAudioState = (action: 'play' | 'pause') => {
    if (!room?.id) return;

    // Broadcast via channel
    if (audioChannelRef.current) {
      audioChannelRef.current.postMessage({
        action,
        roomId: room.id,
        timestamp: Date.now()
      });
    }

    // Also broadcast via realtime
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'audio-state',
        payload: { action, roomId: room.id }
      });
    }
  };

  // ENHANCED: Universal play/pause handler for players
  const handleUniversalPlayPause = async () => {
    if (gameEnded || !room?.current_song) {
      console.log('AUDIO: Cannot control audio - game ended or missing data');
      return;
    }

    console.log('AUDIO: Player universal audio control triggered');

    const newAction = isPlaying ? 'pause' : 'play';
    
    // Broadcast to host immediately
    if (audioChannelRef.current) {
      audioChannelRef.current.postMessage({
        action: newAction,
        roomId: room.id,
        timestamp: Date.now()
      });
    }

    // Also send via realtime for instant response
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.send({
        type: 'broadcast',
        event: 'audio-control',
        payload: { action: newAction, roomId: room.id }
      });
    }

    // Update local state optimistically
    setIsPlaying(!isPlaying);
    gameLogic.setIsPlaying(!isPlaying);
  };

  // ENHANCED PERFORMANCE FIX: More resilient game initialization with 20 songs and timeout
  useEffect(() => {
    const shouldInitialize = room?.phase === 'playing' && 
                           !gameInitialized &&
                           !gameLogic.gameState.playlistInitialized;

    if (shouldInitialize && isHost) {
      console.log('🚀 INIT: Host initializing game with enhanced loading...');
      
      setInitializationError(null);
      setGameInitialized(true);
      
      const initializeGameOptimal = async () => {
        try {
          console.log('🎵 LOAD: Starting to load songs with working previews...');
          const startTime = Date.now();
          
          // ENHANCED: Add global timeout to prevent infinite hanging
          const globalTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Game initialization timed out after 45 seconds. This may be due to network issues or server problems. Please refresh and try again.')), 45000)
          );
          
          // ENHANCED: Try to get 20 songs with previews for better success rate
          const songsPromise = defaultPlaylistService.loadOptimizedGameSongs(20);
          const optimizedSongs = await Promise.race([songsPromise, globalTimeoutPromise]) as Song[];
          
          const loadTime = Date.now() - startTime;
          console.log(`⏱️ LOAD: Song loading took ${loadTime}ms`);
          
          if (optimizedSongs.length === 0) {
            throw new Error('No songs with valid audio previews found. This could be due to network issues or problems with the music service. Please check your internet connection and try again.');
          }

          // ENHANCED: Accept fewer songs if we couldn't get the full 20, but need at least 8
          if (optimizedSongs.length < 8) {
            throw new Error(`Only ${optimizedSongs.length} songs with valid audio previews found. Need at least 8 songs to start the game. This may be due to network connectivity issues. Please check your internet connection.`);
          }

          console.log(`✅ SUCCESS: Using ${optimizedSongs.length} songs with working previews`);

          console.log('🎯 INIT: Initializing game state with starting cards...');
          const initStartTime = Date.now();
          
          // Initialize game with timeout protection
          const initTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Game state initialization timed out after 20 seconds. Please try again.')), 20000)
          );
          
          const initPromise = GameService.initializeGameWithStartingCards(room.id, optimizedSongs);
          await Promise.race([initPromise, initTimeoutPromise]);
          
          const initTime = Date.now() - initStartTime;
          console.log(`⏱️ INIT: Game initialization took ${initTime}ms`);
          console.log('🎉 INIT: Game ready with enhanced song set!');
        } catch (error) {
          console.error('❌ ERROR: Game initialization failed:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to initialize game. Please try again.';
          
          // Add helpful context based on error type
          let contextualMessage = errorMessage;
          if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
            contextualMessage = `${errorMessage}\n\n💡 Tip: This usually happens due to slow internet or server issues. Try refreshing the page and starting again.`;
          } else if (errorMessage.includes('No songs') || errorMessage.includes('audio previews')) {
            contextualMessage = `${errorMessage}\n\n💡 Tip: Check your internet connection and ensure music services are accessible.`;
          }
          
          setInitializationError(contextualMessage);
          setGameInitialized(false);
        }
      };

      // Add a small delay to prevent multiple rapid initializations
      const initTimer = setTimeout(() => {
        initializeGameOptimal();
      }, 500);

      return () => clearTimeout(initTimer);
    }
  }, [room?.phase, gameInitialized, gameLogic.gameState.playlistInitialized, isHost, room?.id]);

  // Initialize game logic after host sets up the room
  useEffect(() => {
    if (room?.phase === 'playing' && !gameLogic.gameState.playlistInitialized) {
      gameLogic.initializeGame();
    }
  }, [room?.phase, gameLogic.gameState.playlistInitialized, gameLogic.initializeGame]);

  // Track turn changes for mystery card updates
  useEffect(() => {
    const currentTurn = room?.current_turn || 0;
    
    if (room?.id && currentTurn !== lastTurnIndex && lastTurnIndex !== -1) {
      console.log('TURN: Mystery card should update automatically');
    }
    
    setLastTurnIndex(currentTurn);
  }, [room?.current_turn, room?.id, lastTurnIndex]);

  // Check for game end condition
  useEffect(() => {
    const activePlayers = players.filter(p => !p.id.includes(room?.host_id));
    const winningPlayer = activePlayers.find(player => player.timeline.length >= 10);
    
    if (winningPlayer && !gameEnded) {
      console.log('GAME END: Player reached 10 cards:', winningPlayer.name);
      setGameEnded(true);
      setWinningPlayer(winningPlayer);
      
      if (isHost) {
        GameService.endGame(room.id).catch(error => {
          console.error('Failed to end game in database:', error);
        });
      }
      
      try {
        soundEffects.playGameStart();
      } catch (error) {
        console.warn('Could not play victory sound:', error);
      }
    }
  }, [players, room?.host_id, gameEnded, soundEffects, room?.id, isHost]);

  // Get current game state
  const currentMysteryCard = room?.current_song;
  const currentTurnPlayerId = room?.current_player_id;
  const activePlayers = players.filter(p => !p.id.includes(room?.host_id));
  const currentTurnPlayer = activePlayers.find(p => p.id === currentTurnPlayerId) || activePlayers[room?.current_turn || 0];
  const isMyTurn = currentPlayer?.id === currentTurnPlayerId;

  // ENHANCED: Handle incorrect card placement by removing from timeline
  const handlePlaceCard = async (song: Song, position: number): Promise<{ success: boolean }> => {
    if (gameEnded || !currentPlayer) {
      return { success: false };
    }

    if (currentPlayer.id !== currentTurnPlayerId) {
      console.error('TURN: Not your turn for placement');
      return { success: false };
    }

    try {
      console.log('CARD: Processing placement');
      setMysteryCardRevealed(true);
      soundEffects.playCardPlace();

      // Stop audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      broadcastAudioState('pause');

      const result = await GameService.placeCardAndAdvanceTurn(
        room.id,
        currentPlayer.id,
        song,
        position,
        gameLogic.gameState.availableSongs
      );
      
      console.log('CARD: Placement result:', result);
      
      if (result.success) {
        const isCorrect = result.correct ?? false;
        
        setCardPlacementResult({ 
          correct: isCorrect, 
          song: song 
        });

        if (isCorrect) {
          soundEffects.playCardSuccess();
          
          if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
          }
        } else {
          soundEffects.playCardError();
          
          // ENHANCED: Remove incorrect card from timeline
          console.log('CARD: Incorrect placement - card will be removed from timeline');
          
          if ('vibrate' in navigator) {
            navigator.vibrate([50, 50, 50, 50, 50]);
          }
        }

        // Show result display
        setTimeout(() => {
          setCardPlacementResult(null);
          setMysteryCardRevealed(false);
          setIsPlaying(false);
          
          if (result.gameEnded) {
            setGameEnded(true);
          }
        }, 2000);

        return { success: true };
      }

      return { success: false };
    } catch (error) {
      console.error('ERROR: Card placement failed:', error);
      setCardPlacementResult(null);
      setMysteryCardRevealed(false);
      return { success: false };
    }
  };

  // Handle replay functionality
  const handleReplay = async () => {
    if (!room?.id) return;
    
    try {
      // Reset game state
      setGameEnded(false);
      setWinningPlayer(null);
      setGameInitialized(false);
      setInitializationError(null);
      setCardPlacementResult(null);
      setMysteryCardRevealed(false);
      setIsPlaying(false);
      
      // Clean up audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      
      if (isHost) {
        // Reset room to lobby phase and restart
        await GameService.resetGameForReplay(room.id);
      }
      
      // Call parent replay handler if provided
      if (onReplayGame) {
        onReplayGame();
      }
    } catch (error) {
      console.error('Failed to restart game:', error);
    }
  };

  const handleBackToMenu = () => {
    // Call parent handler to go back to menu
    if (onReplayGame) {
      onReplayGame();
    }
  };

  const handleHighlightGap = (gapIndex: number | null) => {
    setHighlightedGapIndex(gapIndex);
  };

  const handleViewportChange = (viewportInfo: { startIndex: number; endIndex: number; totalCards: number } | null) => {
    setMobileViewport(viewportInfo);
  };

  // Fiend Mode specific handlers
  const handleFiendModeGuess = async (year: number): Promise<{ success: boolean; accuracy?: number; points?: number }> => {
    if (!currentPlayer || !currentMysteryCard) {
      return { success: false };
    }

    try {
      const actualYear = parseInt(currentMysteryCard.release_year);
      const yearDifference = Math.abs(year - actualYear);
      
      // Calculate accuracy percentage (100% for exact, decreasing by 2% per year off)
      const accuracy = Math.max(0, 100 - (yearDifference * 2));
      
      // Calculate points based on accuracy (max 100 points)
      const points = Math.round(accuracy);
      
      // Update player score
      const newScore = currentPlayer.score + points;
      await GameService.updatePlayerScore(room.id, currentPlayer.id, newScore);
      
      // Store the guess result
      setPlayerGuesses(prev => ({
        ...prev,
        [currentPlayer.id]: { year, accuracy, points }
      }));
      
      soundEffects.playCardSuccess();
      
      return { success: true, accuracy, points };
    } catch (error) {
      console.error('Failed to submit Fiend Mode guess:', error);
      return { success: false };
    }
  };

  // Sprint Mode specific handlers
  const handleSprintModePlace = async (song: Song, position: number): Promise<{ success: boolean; correct?: boolean }> => {
    if (!currentPlayer) {
      return { success: false };
    }

    try {
      // Check if placement is correct
      const playerTimeline = currentPlayer.timeline
        .filter(s => s !== null)
        .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));
      
      const songYear = parseInt(song.release_year);
      const beforeSong = position > 0 ? playerTimeline[position - 1] : null;
      const afterSong = position < playerTimeline.length ? playerTimeline[position] : null;
      
      const beforeYear = beforeSong ? parseInt(beforeSong.release_year) : 0;
      const afterYear = afterSong ? parseInt(afterSong.release_year) : 9999;
      
      const isCorrect = songYear >= beforeYear && songYear <= afterYear;
      
      if (isCorrect) {
        // Add card to timeline
        const result = await onPlaceCard(song, position);
        
        // Track placement result
        setRecentPlacements(prev => ({
          ...prev,
          [currentPlayer.id]: { correct: true, song, timestamp: Date.now() }
        }));
        
        soundEffects.playCardSuccess();
        return { success: true, correct: true };
      } else {
        // Start timeout
        setPlayerTimeouts(prev => ({
          ...prev,
          [currentPlayer.id]: 5
        }));
        
        // Track placement result
        setRecentPlacements(prev => ({
          ...prev,
          [currentPlayer.id]: { correct: false, song, timestamp: Date.now() }
        }));
        
        // Countdown timeout
        let timeRemaining = 5;
        const timeoutInterval = setInterval(() => {
          timeRemaining--;
          setPlayerTimeouts(prev => ({
            ...prev,
            [currentPlayer.id]: timeRemaining
          }));
          
          if (timeRemaining <= 0) {
            clearInterval(timeoutInterval);
            setPlayerTimeouts(prev => {
              const newTimeouts = { ...prev };
              delete newTimeouts[currentPlayer.id];
              return newTimeouts;
            });
          }
        }, 1000);
        
        soundEffects.playCardError();
        return { success: true, correct: false };
      }
    } catch (error) {
      console.error('Failed to place Sprint Mode card:', error);
      return { success: false };
    }
  };

  // Show initialization error with comprehensive recovery options
  if (initializationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black relative overflow-hidden flex items-center justify-center p-4">
        <div className="text-center text-white relative z-10 max-w-lg mx-auto p-6">
          <div className="text-4xl mb-4">🚨</div>
          <div className="text-2xl font-bold mb-3">Game Setup Failed</div>
          <div className="text-lg mb-4 leading-relaxed">{initializationError}</div>
          <div className="text-sm text-white/60 mb-6">This usually happens due to network issues or problems loading music data.</div>
          
          {/* Action buttons */}
          <div className="flex flex-col gap-3 mb-6">
            {/* Retry button for host */}
            {isHost && (
              <button
                onClick={() => {
                  console.log('🔄 Retrying game initialization...');
                  setInitializationError(null);
                  setGameInitialized(false);
                  // The useEffect will trigger reinitialization
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
              >
                🔄 Try Again
              </button>
            )}
            
            {/* Go back to lobby button */}
            {isHost && onReplayGame && (
              <button
                onClick={() => {
                  console.log('🏠 Going back to lobby...');
                  onReplayGame();
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
              >
                🏠 Back to Lobby
              </button>
            )}
          </div>
          
          {/* Help tips */}
          <div className="text-xs text-white/50 mb-4 space-y-2">
            <div className="font-semibold">💡 Tips to fix this:</div>
            <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
              <li>Check your internet connection</li>
              <li>Refresh the page and try again</li>
              <li>Ensure music services are accessible</li>
              <li>Try again in a few minutes</li>
            </ul>
          </div>
          
          {/* Debug information for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 bg-black/50 p-3 rounded-lg text-xs text-left">
              <div className="font-bold mb-2 text-red-400">Debug Info:</div>
              <div>Room ID: {room?.id || 'Unknown'}</div>
              <div>Is Host: {isHost ? 'Yes' : 'No'}</div>
              <div>Game Mode: {room?.gamemode || 'Unknown'}</div>
              <div>Players: {players.length}</div>
              <div>Game Initialized: {gameInitialized ? 'Yes' : 'No'}</div>
              <div>Playlist Initialized: {gameLogic.gameState.playlistInitialized ? 'Yes' : 'No'}</div>
            </div>
          )}
          
          {/* For non-host players */}
          {!isHost && (
            <div className="text-white/70 text-sm mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-400/30">
              <div className="font-semibold mb-2">👥 Player Notice</div>
              <div>The host is experiencing setup issues. Please wait while they resolve the problem, or ask them to restart the game.</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show game over screens when game ends
  if (gameEnded && winningPlayer) {
    const activePlayers = players.filter(p => !p.id.includes(room?.host_id));
    
    // Import the game over screens
    const MobileGameOverScreen = React.lazy(() => import('@/components/player/MobileGameOverScreen'));
    
    // Mobile game over screen for players
    if (!isHost) {
      return (
        <React.Suspense fallback={<div>Loading...</div>}>
          <MobileGameOverScreen
            winningPlayer={winningPlayer}
            allPlayers={activePlayers}
            onPlayAgain={handleReplay}
            roomCode={room.lobby_code}
          />
        </React.Suspense>
      );
    }
    
    // Host game over screen
    return (
      <HostGameOverScreen
        winner={winningPlayer}
        players={activePlayers}
        onPlayAgain={handleReplay}
        onRestartWithSamePlayers={handleReplay} // For now, both do the same thing
        onBackToMenu={handleBackToMenu}
        roomCode={room.lobby_code}
      />
    );
  }

  // Enhanced game readiness check with better debugging and fallbacks
  const gameReady = 
    room?.phase === 'playing' &&
    activePlayers.length > 0 &&
    currentMysteryCard &&
    currentTurnPlayer;

  // Enhanced debug logging
  console.log('🎮 GamePlay Readiness Check:', {
    roomPhase: room?.phase,
    roomId: room?.id,
    playersCount: activePlayers.length,
    hasMysteryCard: !!currentMysteryCard,
    hasTurnPlayer: !!currentTurnPlayer,
    gameInitialized,
    initializationError,
    gameReady,
    isHost,
    gameLogicInitialized: gameLogic.gameState.playlistInitialized,
    currentTurnPlayerId: room?.current_player_id,
    activePlayers: activePlayers.map(p => ({ id: p.id, name: p.name }))
  });

  // DEFENSIVE RENDERING: Always show meaningful UI, never a white screen
  if (!gameReady) {
    // Show different loading states based on what's missing
    let loadingMessage = "Setting up game...";
    let loadingDetail = "Preparing your music experience";
    
    if (!room) {
      loadingMessage = "Connection issue";
      loadingDetail = "Unable to connect to game room";
    } else if (room?.phase !== 'playing') {
      loadingMessage = "Waiting for host...";
      loadingDetail = "Host is starting the game";
    } else if (activePlayers.length === 0) {
      loadingMessage = "Waiting for players...";
      loadingDetail = "Getting player information";
    } else if (!currentMysteryCard) {
      loadingMessage = isHost ? "Loading music..." : "Host is loading music...";
      loadingDetail = isHost ? "Finding songs with working audio previews" : "Please wait while the host sets up the game";
    } else if (!currentTurnPlayer) {
      loadingMessage = "Setting up turns...";
      loadingDetail = "Determining who goes first";
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative overflow-hidden">
        <LoadingScreen
          title={loadingMessage}
          subtitle={loadingDetail}
          variant="game"
        />
        
        {/* Debug information overlay for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs max-w-sm z-50">
            <div className="font-bold mb-2">Debug Info:</div>
            <div>Room: {room?.id ? '✓' : '✗'}</div>
            <div>Phase: {room?.phase || 'unknown'}</div>
            <div>Players: {activePlayers.length}</div>
            <div>Mystery Card: {currentMysteryCard ? '✓' : '✗'}</div>
            <div>Turn Player: {currentTurnPlayer ? '✓' : '✗'}</div>
            <div>Game Init: {gameInitialized ? '✓' : '✗'}</div>
            <div>Logic Init: {gameLogic.gameState.playlistInitialized ? '✓' : '✗'}</div>
            <div>Is Host: {isHost ? 'Yes' : 'No'}</div>
          </div>
        )}
        
        {/* Enhanced host-specific debugging */}
        {isHost && process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 bg-red-900/80 text-white p-3 rounded-lg text-xs max-w-sm z-50">
            <div className="font-bold mb-2 text-red-400">Host Debug:</div>
            <div>Init Error: {initializationError ? 'Yes' : 'No'}</div>
            <div>Playlist Init: {gameLogic.gameState.playlistInitialized ? 'Yes' : 'No'}</div>
            <div>Current Song: {currentMysteryCard?.deezer_title || 'None'}</div>
            <div>Turn Player: {currentTurnPlayer?.name || 'None'}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {connectionStatus && (
        <ConnectionStatus 
          connectionStatus={connectionStatus} 
          onReconnect={onReconnect}
        />
      )}
      
      {/* Render different views based on gamemode */}
      {room.gamemode === 'fiend' ? (
        isHost ? (
          <HostViewErrorBoundary>
            <FiendModeHostView
              players={activePlayers}
              currentSong={currentMysteryCard}
              roundNumber={currentRound}
              totalRounds={room.gamemode_settings?.rounds || 5}
              roomCode={room.lobby_code}
              timeLeft={30}
              playerGuesses={playerGuesses}
            />
          </HostViewErrorBoundary>
        ) : (
          <FiendModePlayerView
            currentPlayer={currentPlayer}
            currentSong={currentMysteryCard}
            roomCode={room.lobby_code}
            isPlaying={isPlaying}
            onPlayPause={handleUniversalPlayPause}
            onSubmitGuess={handleFiendModeGuess}
            gameEnded={gameEnded}
            roundNumber={currentRound}
            totalRounds={room.gamemode_settings?.rounds || 5}
            timeLeft={30}
          />
        )
      ) : room.gamemode === 'sprint' ? (
        isHost ? (
          <HostViewErrorBoundary>
            <SprintModeHostView
              players={activePlayers}
              currentSong={currentMysteryCard}
              targetCards={room.gamemode_settings?.targetCards || 10}
              roomCode={room.lobby_code}
              timeLeft={30}
              playerTimeouts={playerTimeouts}
              recentPlacements={recentPlacements}
            />
          </HostViewErrorBoundary>
        ) : (
          <SprintModePlayerView
            currentPlayer={currentPlayer}
            currentSong={currentMysteryCard}
            roomCode={room.lobby_code}
            isPlaying={isPlaying}
            onPlayPause={handleUniversalPlayPause}
            onPlaceCard={handleSprintModePlace}
            gameEnded={gameEnded}
            targetCards={room.gamemode_settings?.targetCards || 10}
            timeLeft={30}
            isInTimeout={playerTimeouts[currentPlayer?.id] > 0}
            timeoutRemaining={playerTimeouts[currentPlayer?.id] || 0}
          />
        )
      ) : (
        // Classic gamemode (existing behavior) - ALWAYS WRAP HOST VIEW WITH COMPREHENSIVE SAFETY
        isHost ? (
          <HostViewErrorBoundary>
            {/* DEFENSIVE RENDERING: Ensure all required props are available before rendering */}
            {currentTurnPlayer && currentMysteryCard && activePlayers.length > 0 ? (
              <HostGameView
                currentTurnPlayer={currentTurnPlayer}
                currentSong={currentMysteryCard}
                roomCode={room.lobby_code}
                players={activePlayers}
                mysteryCardRevealed={mysteryCardRevealed}
                isPlaying={isPlaying}
                onPlayPause={handleHostAudioPlay}
                cardPlacementResult={cardPlacementResult}
                transitioning={false}
                highlightedGapIndex={highlightedGapIndex}
                mobileViewport={mobileViewport}
              />
            ) : (
              /* Fallback UI for missing props */
              <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden flex items-center justify-center">
                <div className="text-center text-white relative z-10 max-w-md mx-auto p-6">
                  <div className="text-4xl mb-4">🎮</div>
                  <div className="text-2xl font-bold mb-3">Loading Host Display...</div>
                  <div className="text-lg mb-4">Setting up the game interface</div>
                  <div className="text-sm text-white/60 mb-6">Please wait a moment</div>
                  
                  {/* Debug what's missing */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="bg-black/50 p-3 rounded-lg text-xs text-left">
                      <div className="font-bold mb-2">Missing Data:</div>
                      <div>Turn Player: {currentTurnPlayer ? '✓' : '✗ Missing'}</div>
                      <div>Mystery Card: {currentMysteryCard ? '✓' : '✗ Missing'}</div>
                      <div>Players: {activePlayers.length > 0 ? `✓ (${activePlayers.length})` : '✗ No players'}</div>
                      <div>Room Code: {room.lobby_code || 'Missing'}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </HostViewErrorBoundary>
        ) : (
          <MobilePlayerGameView
            currentPlayer={currentPlayer}
            currentTurnPlayer={currentTurnPlayer}
            currentSong={currentMysteryCard}
            roomCode={room.lobby_code}
            isMyTurn={isMyTurn}
            isPlaying={isPlaying}
            onPlayPause={handleUniversalPlayPause}
            onPlaceCard={handlePlaceCard}
            mysteryCardRevealed={mysteryCardRevealed}
            cardPlacementResult={cardPlacementResult}
            gameEnded={gameEnded}
            onHighlightGap={handleHighlightGap}
            onViewportChange={handleViewportChange}
          />
        )
      )}
    </div>
  );
}

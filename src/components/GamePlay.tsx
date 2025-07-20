import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Song, Player } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { GameService } from '@/services/gameService';
import { defaultPlaylistService } from '@/services/defaultPlaylistService';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { ConnectionStatus as ConnectionStatusType } from '@/hooks/useRealtimeSubscription';
import { GameRoom } from '@/types/game';
import { HostGameOverScreen } from '@/components/host/HostGameOverScreen';

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
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Use appropriate game logic based on gamemode
  const gamemode = room?.gamemode || 'classic';
  
  const classicLogic = useClassicGameLogic(room?.id, players, room, onSetCurrentSong);
  const fiendLogic = useFiendGameLogic(room?.id, players, room, onSetCurrentSong);
  const sprintLogic = useSprintGameLogic(room?.id, players, room, onSetCurrentSong);
  
  const gameLogic = gamemode === 'fiend' ? fiendLogic : 
                   gamemode === 'sprint' ? sprintLogic : 
                   classicLogic;

  // Broadcast audio state to all players
  const broadcastAudioState = useCallback((action: 'play' | 'pause') => {
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
  }, [room?.id]);

  // Enhanced host audio control functions - declared early to prevent lexical ordering issues
  const handleHostAudioPlay = useCallback(async () => {
    if (!isHost) {
      console.log('🔊 HOST: Not host, ignoring play command');
      return;
    }

    if (!room?.current_song?.preview_url) {
      console.error('🔊 HOST: No preview URL available for current song:', room?.current_song);
      return;
    }

    console.log('🔊 HOST: Playing audio from universal control, URL:', room.current_song.preview_url);
    
    // Stop any existing audio
    if (currentAudioRef.current) {
      console.log('🔊 HOST: Stopping existing audio');
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    
    try {
      // Create new audio element with enhanced error handling
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.volume = 0.8;
      audio.preload = 'auto';
      audio.src = room.current_song.preview_url;
      
      currentAudioRef.current = audio;
      
      // Enhanced event handlers with more detailed logging
      audio.addEventListener('loadstart', () => {
        console.log('🔊 HOST: Audio loading started');
      });
      
      audio.addEventListener('canplay', () => {
        console.log('🔊 HOST: Audio can start playing');
      });
      
      audio.addEventListener('playing', () => {
        console.log('🔊 HOST: Audio is now playing');
        setIsPlaying(true);
        gameLogic.setIsPlaying(true);
        broadcastAudioState('play');
      });
      
      audio.addEventListener('ended', () => {
        console.log('🔊 HOST: Audio playback ended');
        setIsPlaying(false);
        gameLogic.setIsPlaying(false);
        broadcastAudioState('pause');
      });
      
      audio.addEventListener('error', (e) => {
        console.error('🔊 HOST: Audio error event:', e);
        console.error('🔊 HOST: Audio error details:', audio.error);
        setIsPlaying(false);
        gameLogic.setIsPlaying(false);
        broadcastAudioState('pause');
      });
      
      audio.addEventListener('pause', () => {
        console.log('🔊 HOST: Audio paused');
        setIsPlaying(false);
        gameLogic.setIsPlaying(false);
      });

      // CRITICAL FIX: Actually call audio.play() to start playback
      console.log('🔊 HOST: Attempting to load and play audio');
      audio.load(); // Explicitly load the audio
      
      // Wait a bit for loading then try to play
      setTimeout(async () => {
        try {
          console.log('🔊 HOST: Calling audio.play()...');
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log('🔊 HOST: Audio play promise resolved successfully');
          }
        } catch (playError) {
          console.error('🔊 HOST: Audio play promise rejected:', playError);
          
          // Try alternative approach - reset and retry once
          try {
            console.log('🔊 HOST: Retrying audio play...');
            audio.currentTime = 0;
            await audio.play();
            console.log('🔊 HOST: Audio play retry succeeded');
          } catch (retryError) {
            console.error('🔊 HOST: Audio play retry also failed:', retryError);
            setIsPlaying(false);
            gameLogic.setIsPlaying(false);
            broadcastAudioState('pause');
          }
        }
      }, 100);
      
    } catch (error) {
      console.error('🔊 HOST: Audio setup failed:', error);
      setIsPlaying(false);
      gameLogic.setIsPlaying(false);
    }
  }, [isHost, room?.current_song, gameLogic, broadcastAudioState]);

  const handleHostAudioPause = useCallback(() => {
    if (!isHost) return;

    console.log('🔊 HOST: Pausing audio from universal control');
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
    }
    setIsPlaying(false);
    gameLogic.setIsPlaying(false);
    broadcastAudioState('pause');
  }, [isHost, gameLogic, broadcastAudioState]);

  // ENHANCED: Universal play/pause handler for players - declared early to prevent lexical ordering issues
  const handleUniversalPlayPause = useCallback(async () => {
    if (gameEnded || !room?.current_song) {
      console.log('🚫 Cannot control audio: game ended or missing data');
      return;
    }

    console.log('🔊 PLAYER: Universal audio control triggered');

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
  }, [gameEnded, room?.current_song, room?.id, isPlaying, gameLogic]);

  // ENHANCED: Real-time audio control setup
  useEffect(() => {
    if (!room?.id) return;

    console.log('🔊 Setting up universal audio control for room:', room.id);
    
    // Create broadcast channel for cross-tab audio sync
    const audioChannel = new BroadcastChannel(`audio-control-${room.id}`);
    audioChannelRef.current = audioChannel;

    // Set up real-time channel for instant audio control
    const channel = supabase
      .channel(`audio-control-${room.id}`)
      .on('broadcast', { event: 'audio-control' }, ({ payload }) => {
        console.log('🔊 Received audio control broadcast:', payload);
        if (payload.action === 'play' && isHost) {
          handleHostAudioPlay();
        } else if (payload.action === 'pause' && isHost) {
          handleHostAudioPause();
        }
      })
      .subscribe((status) => {
        console.log('🔊 Audio control channel status:', status);
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
  }, [room?.id, isHost, handleHostAudioPlay, handleHostAudioPause]);

  // ENHANCED PERFORMANCE FIX: More resilient game initialization with 20 songs
  useEffect(() => {
    const shouldInitialize = room?.phase === 'playing' && 
                           !gameInitialized &&
                           !gameLogic.gameState.playlistInitialized;

    if (shouldInitialize && isHost) {
      console.log('🚀 ENHANCED INIT: Host initializing with 20 song resilient loading...');
      
      setInitializationError(null);
      setGameInitialized(true);
      
      const initializeGameOptimal = async () => {
        try {
          // ENHANCED: Try to get 20 songs with previews for better success rate
          console.log('⚡ RESILIENT LOAD: Loading 20 songs with previews (enhanced success rate)...');
          const optimizedSongs = await defaultPlaylistService.loadOptimizedGameSongs(20);
          
          if (optimizedSongs.length === 0) {
            throw new Error('No songs with valid previews found after trying multiple songs');
          }

          // ENHANCED: Accept fewer songs if we couldn't get the full 20, but need at least 8
          if (optimizedSongs.length < 8) {
            throw new Error(`Only ${optimizedSongs.length} songs with valid audio previews found. Need at least 8 songs for game start.`);
          }

          console.log(`🚀 RESILIENT SUCCESS: Using ${optimizedSongs.length} songs with working previews`);

          // Initialize game with whatever songs we successfully got
          await GameService.initializeGameWithStartingCards(room.id, optimizedSongs);
          
          console.log('⚡ RESILIENT INIT COMPLETE: Game ready with enhanced song set');
        } catch (error) {
          console.error('❌ RESILIENT INIT FAILED:', error);
          setInitializationError(error instanceof Error ? error.message : 'Failed to initialize resilient game');
          setGameInitialized(false);
        }
      };

      initializeGameOptimal();
    }
  }, [room?.phase, gameInitialized, gameLogic.gameState.playlistInitialized, isHost, room?.id]);

  // Initialize game logic after host sets up the room
  useEffect(() => {
    if (room?.phase === 'playing' && !gameLogic.gameState.playlistInitialized) {
      gameLogic.initializeGame();
    }
  }, [room?.phase, gameLogic.gameState.playlistInitialized, gameLogic, gameInitialized, isHost, room?.id]);

  // Track turn changes for mystery card updates
  useEffect(() => {
    const currentTurn = room?.current_turn || 0;
    
    if (room?.id && currentTurn !== lastTurnIndex && lastTurnIndex !== -1) {
      console.log('🔄 TURN CHANGE: Mystery card should update automatically');
    }
    
    setLastTurnIndex(currentTurn);
  }, [room?.current_turn, room?.id, lastTurnIndex]);

  // Check for game end condition
  useEffect(() => {
    const activePlayers = players.filter(p => !p.id.includes(room?.host_id));
    const winningPlayer = activePlayers.find(player => player.timeline.length >= 10);
    
    if (winningPlayer && !gameEnded) {
      console.log('🎯 GAME END: Player reached 10 cards:', winningPlayer.name);
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
      console.error('❌ Not your turn for placement!');
      return { success: false };
    }

    try {
      console.log('📱 CARD PLACEMENT: Processing');
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
      
      console.log('📱 PLACEMENT RESULT:', result);
      
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
          console.log('❌ INCORRECT PLACEMENT: Card will be removed from timeline');
          
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
      console.error('❌ Card placement failed:', error);
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

  // Show initialization error
  if (initializationError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black relative overflow-hidden flex items-center justify-center p-4">
        <div className="text-center text-white relative z-10 max-w-md mx-auto p-6">
          <div className="text-4xl mb-4">🚨</div>
          <div className="text-2xl font-bold mb-3">Cannot Start Optimized Game</div>
          <div className="text-lg mb-4">{initializationError}</div>
          <div className="text-sm text-white/60">Please check your playlist optimization and try again.</div>
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

  // Check if game is ready with enhanced validation
  const gameReady = 
    room?.phase === 'playing' &&
    activePlayers.length > 0 &&
    currentMysteryCard;

  // Add specific checks for missing critical data with better error messages
  const missingCurrentPlayer = !currentPlayer && !isHost;
  const missingCurrentTurnPlayer = !currentTurnPlayer && currentMysteryCard;
  const noValidPlayers = activePlayers.length === 0;

  // ENHANCED: Better error handling for various missing data scenarios with recovery options
  // For players: show game interface even if currentPlayer is temporarily missing, with fallback UI
  if (!gameReady || noValidPlayers || (isHost && missingCurrentTurnPlayer)) {
    let errorMessage = "🚀 Optimized Setup...";
    let subMessage = "Preparing enhanced mobile gameplay with performance optimizations";
    const showRefreshButton = false;
    let showRejoinButton = false;
    let errorLevel = "loading"; // "loading", "warning", "error"

    if (noValidPlayers) {
      errorMessage = "⚠️ No players found in the game";
      subMessage = "The game needs at least one player to start. Please check if players have joined properly.";
      errorLevel = "warning";
    } else if (missingCurrentPlayer) {
      errorMessage = "❌ Your player session was lost";
      subMessage = `Please go back to the menu and rejoin using code: ${room?.lobby_code}`;
      errorLevel = "error";
      showRejoinButton = true;
    } else if (missingCurrentTurnPlayer) {
      errorMessage = "⏳ Waiting for turn assignment...";
      subMessage = "Turn data is being synchronized. This should resolve automatically.";
      errorLevel = "warning";
    } else if (!currentMysteryCard) {
      errorMessage = "🎵 Loading game music...";
      subMessage = "Setting up the mystery card and audio for gameplay.";
      errorLevel = "loading";
    }
    
    console.log('🚫 GamePlay not ready:', { 
      gameReady, 
      missingCurrentPlayer, 
      missingCurrentTurnPlayer,
      noValidPlayers,
      currentPlayer: currentPlayer?.name,
      currentTurnPlayer: currentTurnPlayer?.name,
      hasPlayers: activePlayers.length > 0,
      hasCurrentSong: !!currentMysteryCard,
      phase: room?.phase,
      errorLevel
    });

    const bgColor = errorLevel === "error" ? "from-red-900 via-red-800 to-black" :
                    errorLevel === "warning" ? "from-yellow-900 via-yellow-800 to-black" :
                    "from-gray-900 via-gray-800 to-black";
    
    const iconColor = errorLevel === "error" ? "text-red-400" :
                      errorLevel === "warning" ? "text-yellow-400" :
                      "text-white";

    const icon = errorLevel === "error" ? "⚠️" :
                 errorLevel === "warning" ? "⏳" :
                 "🎵";

    return (
      <div className={`min-h-screen bg-gradient-to-br ${bgColor} relative overflow-hidden flex items-center justify-center p-4`}>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        </div>
        <div className="text-center text-white relative z-10 max-w-md mx-auto">
          <div className={`w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-4 mx-auto border border-white/20 ${iconColor}`}>
            <div className={`text-2xl ${errorLevel === "loading" ? "animate-spin" : ""}`}>{icon}</div>
          </div>
          <div className="text-xl font-semibold mb-2">{errorMessage}</div>
          <div className="text-white/60 max-w-sm mx-auto text-sm mb-4">{subMessage}</div>
          
          {showRefreshButton && (
            <div className="space-y-2">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 hover:bg-red-500/30 transition-colors"
              >
                Refresh Page
              </button>
              <div className="text-xs text-white/40">
                If this keeps happening, try rejoining the room
              </div>
            </div>
          )}

          {showRejoinButton && (
            <div className="space-y-2">
              <button 
                onClick={() => {
                  // Go back to menu to rejoin
                  if (onReplayGame) {
                    onReplayGame();
                  } else {
                    window.location.href = '/';
                  }
                }} 
                className="px-6 py-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-200 hover:bg-blue-500/30 transition-colors"
              >
                Go Back to Menu
              </button>
              <div className="text-xs text-white/40">
                Use room code: {room?.lobby_code} to rejoin
              </div>
            </div>
          )}

          {errorLevel === "warning" && (
            <div className="text-xs text-white/40 mt-2">
              This should resolve automatically in a few seconds
            </div>
          )}
        </div>
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
          <FiendModeHostView
            players={activePlayers}
            currentSong={currentMysteryCard}
            roundNumber={currentRound}
            totalRounds={room.gamemode_settings?.rounds || 5}
            roomCode={room.lobby_code}
            timeLeft={30}
            playerGuesses={playerGuesses}
          />
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
          <SprintModeHostView
            players={activePlayers}
            currentSong={currentMysteryCard}
            targetCards={room.gamemode_settings?.targetCards || 10}
            roomCode={room.lobby_code}
            timeLeft={30}
            playerTimeouts={playerTimeouts}
            recentPlacements={recentPlacements}
          />
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
        // Classic gamemode (existing behavior)
        isHost ? (
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

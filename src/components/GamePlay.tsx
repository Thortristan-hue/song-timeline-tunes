import React, { useState, useEffect, useRef } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import MobilePlayerGameView from '@/components/player/MobilePlayerGameView';
import MobileVictoryScreen from '@/components/player/MobileVictoryScreen';
import { HostGameView } from '@/components/HostVisuals';
import { Song, Player } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { GameService } from '@/services/gameService';
import { defaultPlaylistService } from '@/services/defaultPlaylistService';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { ConnectionStatus as ConnectionStatusType } from '@/hooks/useRealtimeSubscription';

interface GamePlayProps {
  room: any;
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

  // Audio management - MOBILE OPTIMIZED
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioChannelRef = useRef<any>(null);

  const {
    gameState,
    setIsPlaying: setGameIsPlaying,
    initializeGame
  } = useGameLogic(room?.id, players, room, onSetCurrentSong);

  // ENHANCED PERFORMANCE FIX: More resilient game initialization with 20 songs
  useEffect(() => {
    const shouldInitialize = room?.phase === 'playing' && 
                           !gameInitialized &&
                           !gameState.playlistInitialized;

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
  }, [room?.phase, gameInitialized, gameState.playlistInitialized, isHost, room?.id]);

  // Initialize game logic after host sets up the room
  useEffect(() => {
    if (room?.phase === 'playing' && !gameState.playlistInitialized) {
      initializeGame();
    }
  }, [room?.phase, gameState.playlistInitialized, initializeGame]);

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

  // ENHANCED: Host can now control audio too
  const handlePlayPause = async () => {
    if (gameEnded || !currentMysteryCard) {
      console.log('🚫 Cannot play: game ended or missing data');
      return;
    }

    // Allow both host and current turn player to control audio
    if (!isHost && currentPlayer && currentPlayer.id !== currentTurnPlayerId) {
      console.log('🚫 Not your turn and not host - audio control blocked');
      return;
    }

    // Pause if already playing
    if (isPlaying && currentAudioRef.current) {
      console.log('🎵 Pausing audio');
      currentAudioRef.current.pause();
      setIsPlaying(false);
      setGameIsPlaying(false);
      return;
    }

    // Get preview URL
    const previewUrl = currentMysteryCard.preview_url;
    
    if (!previewUrl) {
      console.log('❌ No preview URL available for playback');
      return;
    }
    
    console.log('🎵 AUDIO: Playing with enhanced compatibility');
    
    // Stop any existing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    // Create new audio element
    const audio = new Audio(previewUrl);
    audio.crossOrigin = 'anonymous';
    audio.volume = 0.8;
    audio.preload = 'auto';
    
    audio.muted = false;
    audio.autoplay = false;
    
    currentAudioRef.current = audio;
    
    // Enhanced event handlers
    audio.addEventListener('ended', () => {
      console.log('🎵 Audio playback ended');
      setIsPlaying(false);
      setGameIsPlaying(false);
    });
    
    audio.addEventListener('error', (e) => {
      console.error('🎵 Audio error:', e);
      setIsPlaying(false);
      setGameIsPlaying(false);
    });
    
    audio.addEventListener('canplay', () => {
      console.log('🎵 Audio ready for playback');
    });
    
    audio.addEventListener('loadstart', () => {
      console.log('🎵 Audio loading started');
    });
    
    try {
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log('🎵 AUDIO SUCCESS: Playing');
        setIsPlaying(true);
        setGameIsPlaying(true);
      }
    } catch (error) {
      console.error('🎵 Audio play failed:', error);
      setIsPlaying(false);
      setGameIsPlaying(false);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          console.warn('🎵 Audio blocked - user interaction required');
        } else if (error.name === 'NotSupportedError') {
          console.warn('🎵 Audio format not supported');
        }
      }
    }
  };

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

      const result = await GameService.placeCardAndAdvanceTurn(
        room.id,
        currentPlayer.id,
        song,
        position,
        gameState.availableSongs
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
    const { HostGameOverScreen } = require('@/components/host/HostGameOverScreen');
    
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

  // Check if game is ready
  const gameReady = 
    room?.phase === 'playing' &&
    activePlayers.length > 0 &&
    currentMysteryCard &&
    currentTurnPlayer;

  if (!gameReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        </div>
        <div className="text-center text-white relative z-10">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-4 mx-auto border border-white/20">
            <div className="text-2xl animate-spin">🎵</div>
          </div>
          <div className="text-xl font-semibold mb-2">🚀 Optimized Setup...</div>
          <div className="text-white/60 max-w-sm mx-auto text-sm">Preparing enhanced mobile gameplay with performance optimizations</div>
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
      
      {isHost ? (
        <HostGameView
          currentTurnPlayer={currentTurnPlayer}
          currentSong={currentMysteryCard}
          roomCode={room.lobby_code}
          players={activePlayers}
          mysteryCardRevealed={mysteryCardRevealed}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          cardPlacementResult={cardPlacementResult}
          transitioning={false}
          highlightedGapIndex={highlightedGapIndex}
        />
      ) : (
        <MobilePlayerGameView
          currentPlayer={currentPlayer}
          currentTurnPlayer={currentTurnPlayer}
          currentSong={currentMysteryCard}
          roomCode={room.lobby_code}
          isMyTurn={isMyTurn}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onPlaceCard={handlePlaceCard}
          mysteryCardRevealed={mysteryCardRevealed}
          cardPlacementResult={cardPlacementResult}
          gameEnded={gameEnded}
          onHighlightGap={handleHighlightGap}
        />
      )}
    </div>
  );
}

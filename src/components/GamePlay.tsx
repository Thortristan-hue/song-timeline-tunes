
import React, { useState, useEffect, useRef } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { PlayerGameView } from '@/components/PlayerVisuals';
import { HostGameView } from '@/components/HostVisuals';
import { Song, Player } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { GameService } from '@/services/gameService';
import { defaultPlaylistService } from '@/services/defaultPlaylistService';

interface GamePlayProps {
  room: any;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  onPlaceCard: (song: Song, position: number, availableSongs?: Song[]) => Promise<{ success: boolean; correct?: boolean }>;
  onSetCurrentSong: (song: Song) => Promise<void>;
  customSongs: Song[];
}

export function GamePlay({
  room,
  players,
  currentPlayer,
  isHost,
  onPlaceCard,
  onSetCurrentSong,
  customSongs
}: GamePlayProps) {
  const soundEffects = useSoundEffects();
  const [isPlaying, setIsPlaying] = useState(false);
  const [cardPlacementResult, setCardPlacementResult] = useState<{ correct: boolean; song: Song } | null>(null);
  const [mysteryCardRevealed, setMysteryCardRevealed] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [gameInitialized, setGameInitialized] = useState(false);
  const [lastTurnIndex, setLastTurnIndex] = useState<number>(-1);

  // Audio management - MOBILE OPTIMIZED
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioChannelRef = useRef<any>(null);

  const {
    gameState,
    setIsPlaying: setGameIsPlaying,
    initializeGame
  } = useGameLogic(room?.id, players, room, onSetCurrentSong);

  // ENHANCED PERFORMANCE FIX: More resilient game initialization
  useEffect(() => {
    const shouldInitialize = room?.phase === 'playing' && 
                           !gameInitialized &&
                           !gameState.playlistInitialized;

    if (shouldInitialize && isHost) {
      console.log('🚀 ENHANCED INIT: Host initializing with resilient song loading...');
      
      setInitializationError(null);
      setGameInitialized(true);
      
      const initializeGameOptimal = async () => {
        try {
          // ENHANCED: Try to get at least 8 songs with previews, but accept fewer if needed
          console.log('⚡ RESILIENT LOAD: Loading songs with previews (will keep trying until we get enough)...');
          const optimizedSongs = await defaultPlaylistService.loadOptimizedGameSongs(8);
          
          if (optimizedSongs.length === 0) {
            throw new Error('No songs with valid previews found after trying multiple songs');
          }

          // ENHANCED: Accept fewer songs if we couldn't get the full amount
          if (optimizedSongs.length < 5) {
            throw new Error(`Only ${optimizedSongs.length} songs with valid audio previews found. Need at least 5 songs for game start.`);
          }

          console.log(`🚀 RESILIENT SUCCESS: Using ${optimizedSongs.length} songs with working previews`);

          // Initialize game with whatever songs we successfully got
          await GameService.initializeGameWithStartingCards(room.id, optimizedSongs);
          
          console.log('⚡ RESILIENT INIT COMPLETE: Game ready with optimized song set');
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

  // MOBILE OPTIMIZED: Enhanced audio playback for touch devices
  const handlePlayPause = async () => {
    if (gameEnded || !currentTurnPlayer || !currentMysteryCard) {
      console.log('🚫 Cannot play: game ended or missing data');
      return;
    }

    // Only current turn player can control audio
    if (currentPlayer && currentPlayer.id !== currentTurnPlayerId) {
      console.log('🚫 Not your turn - audio control blocked');
      return;
    }

    // Pause if already playing
    if (isPlaying && currentAudioRef.current) {
      console.log('🎵 Pausing mobile audio');
      currentAudioRef.current.pause();
      setIsPlaying(false);
      setGameIsPlaying(false);
      return;
    }

    // Get preview URL
    const previewUrl = currentMysteryCard.preview_url;
    
    if (!previewUrl) {
      console.log('❌ No preview URL available for mobile playback');
      return;
    }
    
    console.log('🎵 MOBILE AUDIO OPTIMIZED: Playing with enhanced mobile compatibility');
    
    // Stop any existing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    // Create new audio element with mobile optimization
    const audio = new Audio(previewUrl);
    audio.crossOrigin = 'anonymous';
    audio.volume = 0.8; // Higher volume for mobile speakers
    audio.preload = 'auto'; // Better mobile performance
    
    // iOS/Safari specific optimizations
    audio.muted = false;
    audio.autoplay = false;
    
    currentAudioRef.current = audio;
    
    // MOBILE SPECIFIC: Enhanced event handlers for iOS/Android
    audio.addEventListener('ended', () => {
      console.log('🎵 Mobile audio playback ended');
      setIsPlaying(false);
      setGameIsPlaying(false);
    });
    
    audio.addEventListener('error', (e) => {
      console.error('🎵 Mobile audio error:', e);
      setIsPlaying(false);
      setGameIsPlaying(false);
    });
    
    audio.addEventListener('canplay', () => {
      console.log('🎵 Mobile audio ready for playback');
    });
    
    audio.addEventListener('loadstart', () => {
      console.log('🎵 Mobile audio loading started');
    });
    
    try {
      // MOBILE AUDIO: Enhanced play with user gesture handling
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log('🎵 MOBILE AUDIO SUCCESS: Playing on touch device');
        setIsPlaying(true);
        setGameIsPlaying(true);
      }
    } catch (error) {
      console.error('🎵 Mobile audio play failed:', error);
      setIsPlaying(false);
      setGameIsPlaying(false);
      
      // Mobile-specific error handling
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          console.warn('🎵 Mobile audio blocked - user interaction required');
        } else if (error.name === 'NotSupportedError') {
          console.warn('🎵 Mobile audio format not supported');
        }
      }
    }
  };

  // MOBILE OPTIMIZED: Enhanced card placement for touch interaction
  const handlePlaceCard = async (song: Song, position: number): Promise<{ success: boolean }> => {
    if (gameEnded || !currentPlayer) {
      return { success: false };
    }

    if (currentPlayer.id !== currentTurnPlayerId) {
      console.error('❌ Not your turn for mobile placement!');
      return { success: false };
    }

    try {
      console.log('📱 MOBILE CARD PLACEMENT: Optimized touch interaction processing');
      setMysteryCardRevealed(true);
      soundEffects.playCardPlace();

      // Stop audio for mobile
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }
      setIsPlaying(false);

      // Use optimized placement method for mobile
      const result = await GameService.placeCardAndAdvanceTurn(
        room.id,
        currentPlayer.id,
        song,
        position,
        gameState.availableSongs
      );
      
      console.log('📱 MOBILE PLACEMENT RESULT:', result);
      
      if (result.success) {
        const isCorrect = result.correct ?? false;
        
        setCardPlacementResult({ 
          correct: isCorrect, 
          song: song 
        });

        if (isCorrect) {
          soundEffects.playCardSuccess();
          
          // Mobile haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
          }
        } else {
          soundEffects.playCardError();
          
          // Different haptic pattern for incorrect
          if ('vibrate' in navigator) {
            navigator.vibrate([50, 50, 50, 50, 50]);
          }
        }

        // Mobile-optimized result display (shorter duration for better UX)
        setTimeout(() => {
          setCardPlacementResult(null);
          setMysteryCardRevealed(false);
          setIsPlaying(false);
          
          if (result.gameEnded) {
            setGameEnded(true);
          }
        }, 2000); // Shorter for mobile attention spans

        return { success: true };
      }

      return { success: false };
    } catch (error) {
      console.error('❌ Mobile card placement failed:', error);
      setCardPlacementResult(null);
      setMysteryCardRevealed(false);
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

  // Show game over screen
  if (gameEnded) {
    const winningPlayer = activePlayers.find(player => player.timeline.length >= 10);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex items-center justify-center p-4">
        <div className="text-center text-white relative z-10">
          <div className="text-4xl mb-4">🏆</div>
          <div className="text-3xl font-bold mb-3">Game Over!</div>
          {winningPlayer && (
            <div className="text-xl mb-4">
              <span style={{ color: winningPlayer.color }}>{winningPlayer.name}</span> wins!
            </div>
          )}
          <div className="text-base text-white/60">Thanks for playing our optimized mobile game!</div>
        </div>
      </div>
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

  // Host view
  if (isHost) {
    return (
      <div className="relative">
        <HostGameView
          currentTurnPlayer={currentTurnPlayer}
          currentSong={currentMysteryCard}
          roomCode={room.lobby_code}
          players={activePlayers}
          mysteryCardRevealed={mysteryCardRevealed}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          cardPlacementResult={cardPlacementResult}
        />
      </div>
    );
  }

  // Player view
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex items-center justify-center p-4">
        <div className="text-center text-white relative z-10">
          <div className="text-4xl mb-3">❌</div>
          <div className="text-xl font-semibold mb-2">Something went wrong</div>
          <div className="text-white/60 text-sm">Couldn't find your player info in optimized game</div>
        </div>
      </div>
    );
  }

  const isMyTurn = currentPlayer.id === currentTurnPlayerId;

  return (
    <div className="relative">
      <PlayerGameView
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
      />
    </div>
  );
}

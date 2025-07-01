import React, { useState, useEffect, useRef } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { PlayerGameView } from '@/components/PlayerGameView';
import { HostGameView } from '@/components/HostGameView';
import { LoadingErrorBoundary } from '@/components/LoadingErrorBoundary';
import { Song, Player } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { AudioPlayer } from '@/components/AudioPlayer';
import { DeezerAudioService } from '@/services/DeezerAudioService';
import { GameService } from '@/services/gameService';
import { useGameState } from '@/hooks/useGameState';
import { useToast } from '@/hooks/use-toast';

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
  const gameLoadingState = useGameState({ timeout: 30000 });
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [cardPlacementResult, setCardPlacementResult] = useState<{ correct: boolean; song: Song } | null>(null);
  const [mysteryCardRevealed, setMysteryCardRevealed] = useState(false);
  const [startingCardsAssigned, setStartingCardsAssigned] = useState(false);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [initializationAttempts, setInitializationAttempts] = useState(0);

  // Single audio instance management to prevent overlaps
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioChannelRef = useRef<any>(null);
  const initializationAttempted = useRef<boolean>(false);
  const maxInitializationAttempts = 3;

  const {
    gameState,
    setIsPlaying: setGameIsPlaying,
    getCurrentPlayer,
    initializeGame,
    startNewTurn
  } = useGameLogic(room?.id, players, room, onSetCurrentSong);

  // Enhanced initialization with robust error handling and retry logic
  useEffect(() => {
    const initializeGameWithMysteryCard = async () => {
      if (
        room?.phase === 'playing' && 
        gameState.phase === 'loading' && 
        isHost && 
        !initializationAttempted.current &&
        initializationAttempts < maxInitializationAttempts
      ) {
        initializationAttempted.current = true;
        const currentAttempt = initializationAttempts + 1;
        setInitializationAttempts(currentAttempt);
        
        console.log(`🎯 INIT: Host initializing game (attempt ${currentAttempt}/${maxInitializationAttempts})...`);
        
        gameLoadingState.startLoading('Initializing game');
        
        try {
          // Ensure we have available songs
          if (gameState.availableSongs.length === 0) {
            throw new Error('No songs available to start the game. Please add songs to your playlist.');
          }

          // Initialize the game with a mystery card using GameService
          console.log('🎯 INIT: Starting initialization with GameService...');
          await GameService.initializeGameWithMysteryCard(room.id, gameState.availableSongs);
          console.log('✅ INIT: Game initialized with mystery card successfully');
          
          // Initialize local game state
          initializeGame();
          
          // Clear any previous errors
          setInitializationError(null);
          gameLoadingState.stopLoading();
          
          toast({
            title: "Game Started!",
            description: "The mystery card has been set. Let the game begin!",
          });
          
        } catch (error) {
          console.error('❌ INIT: Failed to initialize game with mystery card:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to initialize game. Please try again.';
          
          setInitializationError(errorMessage);
          gameLoadingState.stopLoading(false, errorMessage);
          
          // Reset the attempt flag for potential retry
          initializationAttempted.current = false;
          
          toast({
            title: "Game Initialization Failed",
            description: errorMessage,
            variant: "destructive",
          });

          // Auto-retry with exponential backoff if we haven't reached max attempts
          if (currentAttempt < maxInitializationAttempts) {
            const retryDelay = Math.min(2000 * Math.pow(2, currentAttempt - 1), 10000); // Cap at 10 seconds
            console.log(`🔄 INIT: Auto-retrying in ${retryDelay}ms (attempt ${currentAttempt + 1}/${maxInitializationAttempts})`);
            
            setTimeout(() => {
              initializationAttempted.current = false;
            }, retryDelay);
          } else {
            console.error('❌ INIT: Max initialization attempts reached. Manual retry required.');
            toast({
              title: "Initialization Failed",
              description: "Maximum retry attempts reached. Please use the retry button.",
              variant: "destructive",
            });
          }
        }
      }
    };

    initializeGameWithMysteryCard();
  }, [room?.phase, gameState.phase, gameState.availableSongs, isHost, initializeGame, room?.id, gameLoadingState, initializationAttempts, toast]);

  // Check for game end condition
  useEffect(() => {
    const activePlayers = players.filter(p => {
      const isHostPlayer = p.id.includes(room?.host_id) || p.id === room?.host_id;
      return !isHostPlayer;
    });

    const winningPlayer = activePlayers.find(player => player.score >= 10);
    if (winningPlayer && !gameEnded) {
      console.log('🎯 Game ended - winner found:', winningPlayer.name);
      setGameEnded(true);
      soundEffects.playGameStart(); // Victory sound
    }
  }, [players, room?.host_id, gameEnded, soundEffects]);

  // CRITICAL FIX: Use synchronized mystery card from room state with validation
  const currentMysteryCard = room?.current_song;
  const currentTurnPlayerId = room?.current_player_id;
  
  // Find current turn player from room state
  const activePlayers = players.filter(p => {
    const isHostPlayer = p.id.includes(room?.host_id) || p.id === room?.host_id;
    return !isHostPlayer;
  });
  
  const currentTurnPlayer = activePlayers.find(p => p.id === currentTurnPlayerId) || activePlayers[room?.current_turn || 0];

  // CRITICAL VALIDATION: Log mystery card state
  useEffect(() => {
    console.log('🎯 SYNC: Mystery card validation:', {
      mysteryCard: currentMysteryCard?.deezer_title || 'UNDEFINED',
      mysteryCardExists: !!currentMysteryCard,
      currentTurnPlayer: currentTurnPlayer?.name || 'UNDEFINED',
      currentPlayerId: currentTurnPlayerId,
      currentTurn: room?.current_turn,
      roomPhase: room?.phase,
      isHost,
      gameEnded,
      initializationError,
      initializationAttempts
    });

    // ALERT if mystery card is undefined in playing phase and we're not in error state
    if (room?.phase === 'playing' && !currentMysteryCard && !gameEnded && !gameLoadingState.isLoading && !initializationError) {
      console.error('🚨 CRITICAL: Mystery card is undefined during gameplay!');
      if (isHost && initializationAttempts < maxInitializationAttempts) {
        setInitializationError('Mystery card not loaded. Retrying initialization...');
        initializationAttempted.current = false; // Allow retry
      } else {
        setInitializationError('Mystery card not loaded. Please refresh the game.');
      }
    }
  }, [currentMysteryCard, currentTurnPlayer, currentTurnPlayerId, room?.current_turn, room?.phase, isHost, gameEnded, gameLoadingState.isLoading, initializationError, initializationAttempts]);

  // Assign starting cards to players when game starts
  useEffect(() => {
    const assignStartingCards = async () => {
      if (
        !startingCardsAssigned &&
        gameState.phase === 'playing' &&
        gameState.availableSongs.length > 0 &&
        activePlayers.length > 0 &&
        isHost &&
        !gameEnded
      ) {
        console.log('🃏 Assigning starting cards to all players');
        
        for (const player of activePlayers) {
          if (player.timeline.length === 0) {
            const randomSong = gameState.availableSongs[Math.floor(Math.random() * gameState.availableSongs.length)];
            console.log(`🃏 Assigning starting card to ${player.name}:`, randomSong.deezer_title);
            
            try {
              const { error } = await supabase
                .from('players')
                .update({
                  timeline: [randomSong] as any
                })
                .eq('id', player.id);

              if (error) {
                console.error(`Failed to assign starting card to ${player.name}:`, error);
              }
            } catch (error) {
              console.error(`Error assigning starting card to ${player.name}:`, error);
            }
          }
        }
        
        setStartingCardsAssigned(true);
      }
    };

    assignStartingCards();
  }, [gameState.phase, gameState.availableSongs, activePlayers, isHost, startingCardsAssigned, gameEnded]);

  // Audio setup - synchronized mystery card only
  useEffect(() => {
    if (!room?.id || !currentTurnPlayer || gameEnded) return;

    if (audioChannelRef.current) {
      audioChannelRef.current.unsubscribe();
      audioChannelRef.current = null;
    }

    const setupChannel = () => {
      const channel = supabase
        .channel(`audio-${room.id}`)
        .on('broadcast', { event: 'audio-control' }, (payload) => {
          console.log('🔊 SYNC: Audio control received:', payload.payload);
          if (payload.payload?.currentTurnPlayerId === currentTurnPlayer.id && 
              payload.payload?.songId === currentMysteryCard?.id) {
            if (payload.payload?.action === 'play') {
              setIsPlaying(true);
            } else if (payload.payload?.action === 'pause') {
              setIsPlaying(false);
            } else if (payload.payload?.action === 'stop') {
              setIsPlaying(false);
              if (currentAudioRef.current) {
                currentAudioRef.current.pause();
                currentAudioRef.current.currentTime = 0;
              }
            }
          }
        })
        .subscribe();

      audioChannelRef.current = channel;
    };

    const timeoutId = setTimeout(setupChannel, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (audioChannelRef.current) {
        audioChannelRef.current.unsubscribe();
        audioChannelRef.current = null;
      }
    };
  }, [room?.id, currentTurnPlayer?.id, currentMysteryCard?.id, gameEnded]);

  // Stop any playing audio when song changes to prevent overlaps
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
    };
  }, [currentMysteryCard?.id]);

  const handlePlayPause = async () => {
    if (gameEnded) {
      console.log('🚫 Game ended - no audio interactions allowed');
      return;
    }

    console.log('🎵 SYNC: Play/Pause for synchronized mystery card:', { 
      isHost, 
      isPlaying, 
      currentSong: currentMysteryCard?.deezer_title,
      currentTurnPlayer: currentTurnPlayer?.name,
      previewUrl: currentMysteryCard?.preview_url,
      isLoadingPreview
    });
    
    if (!currentTurnPlayer || !currentMysteryCard || isLoadingPreview) {
      console.log('⚠️ Cannot play: missing data or loading preview');
      return;
    }

    if (isPlaying) {
      console.log('🎵 Pausing synchronized audio');
      setIsPlaying(false);
      setGameIsPlaying(false);
      
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      
      if (audioChannelRef.current) {
        await audioChannelRef.current.send({
          type: 'broadcast',
          event: 'audio-control',
          payload: { 
            action: 'pause',
            currentTurnPlayerId: currentTurnPlayer.id,
            songId: currentMysteryCard.id
          }
        });
      }
      return;
    }

    let previewUrl = currentMysteryCard.preview_url;
    
    if (!previewUrl && currentMysteryCard.id) {
      console.log('🔍 No preview URL, fetching fresh one for synchronized playback...');
      setIsLoadingPreview(true);
      try {
        previewUrl = await DeezerAudioService.getPreviewUrl(currentMysteryCard.id);
        if (previewUrl) {
          // Update the room's current song with fresh preview URL
          const updatedSong = { ...currentMysteryCard, preview_url: previewUrl };
          await onSetCurrentSong(updatedSong);
        }
      } catch (error) {
        console.error('Failed to fetch fresh preview URL:', error);
        setIsLoadingPreview(false);
        return;
      } finally {
        setIsLoadingPreview(false);
      }
    }

    if (!previewUrl) {
      console.log('❌ No preview URL available for synchronized playback');
      return;
    }
    
    const allAudio = document.querySelectorAll('audio');
    allAudio.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    console.log('🎵 SYNC: Starting synchronized audio playback');
    setIsPlaying(true);
    setGameIsPlaying(true);

    if (audioChannelRef.current) {
      console.log('🔊 SYNC: Broadcasting synchronized audio control: play');
      await audioChannelRef.current.send({
        type: 'broadcast',
        event: 'audio-control',
        payload: { 
          action: 'play',
          currentTurnPlayerId: currentTurnPlayer.id,
          songId: currentMysteryCard.id
        }
      });
    }
  };

  const handlePlaceCard = async (song: Song, position: number): Promise<{ success: boolean }> => {
    if (gameEnded) {
      console.log('🚫 Game ended - no card placement allowed');
      return { success: false };
    }

    if (!currentPlayer || isProcessingTurn) {
      console.error('Cannot place card: missing player or turn in progress');
      return { success: false };
    }

    // CRITICAL FIX: Enforce turn validation
    if (currentPlayer.id !== currentTurnPlayerId) {
      console.error('❌ MANDATORY: Not your turn! Current turn belongs to:', currentTurnPlayerId);
      return { success: false };
    }

    setIsProcessingTurn(true);

    try {
      console.log('🃏 MANDATORY: Placing card with turn advancement enforcement');
      setMysteryCardRevealed(true);
      soundEffects.playCardPlace();

      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }
      setIsPlaying(false);

      // Pass available songs for new mystery card selection
      const result = await onPlaceCard(song, position, gameState.availableSongs);
      console.log('🃏 MANDATORY: Card placement result with turn advancement:', result);
      
      if (result.success) {
        const isCorrect = result.correct ?? false;
        
        setCardPlacementResult({ 
          correct: isCorrect, 
          song: song 
        });

        if (isCorrect) {
          soundEffects.playCardSuccess();
        } else {
          soundEffects.playCardError();
        }

        // Show result for 3 seconds, then clear and reset
        setTimeout(() => {
          setCardPlacementResult(null);
          setMysteryCardRevealed(false);
          setIsPlaying(false);
          
          if (audioChannelRef.current) {
            audioChannelRef.current.send({
              type: 'broadcast',
              event: 'audio-control',
              payload: { action: 'stop' }
            });
          }
          
          setIsProcessingTurn(false);
        }, 3000);

        return { success: true };
      }

      setIsProcessingTurn(false);
      return { success: false };
    } catch (error) {
      console.error('Failed to place card:', error);
      setCardPlacementResult(null);
      setMysteryCardRevealed(false);
      setIsProcessingTurn(false);
      return { success: false };
    }
  };

  const handleRetryInitialization = () => {
    console.log('🔄 INIT: Manual retry requested');
    setInitializationError(null);
    setInitializationAttempts(0);
    initializationAttempted.current = false;
    gameLoadingState.clearError();
    
    toast({
      title: "Retrying Game Initialization",
      description: "Attempting to start the game again...",
    });
  };

  // Show initialization error screen with enhanced retry options
  if (initializationError) {
    return (
      <LoadingErrorBoundary
        isLoading={false}
        error={initializationError}
        onRetry={handleRetryInitialization}
        loadingMessage="Initializing game..."
      >
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black relative overflow-hidden flex items-center justify-center">
          <div className="text-center text-white relative z-10 max-w-md mx-auto p-6">
            <div className="text-6xl mb-6">⚠️</div>
            <div className="text-3xl font-bold mb-4">Game Initialization Failed</div>
            <div className="text-lg mb-4 text-red-200">{initializationError}</div>
            <div className="text-sm mb-6 text-red-300">
              Attempts: {initializationAttempts}/{maxInitializationAttempts}
            </div>
            <div className="space-y-4">
              <button
                onClick={handleRetryInitialization}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
                disabled={gameLoadingState.isLoading}
              >
                {gameLoadingState.isLoading ? 'Retrying...' : 'Retry Initialization'}
              </button>
              <div className="text-xs text-red-400">
                If this keeps failing, try refreshing the page or check your internet connection.
              </div>
            </div>
          </div>
        </div>
      </LoadingErrorBoundary>
    );
  }

  // CRITICAL FIX: Show error if mystery card is undefined after loading
  if (room?.phase === 'playing' && !currentMysteryCard && !gameEnded && !gameLoadingState.isLoading && !initializationError) {
    return (
      <LoadingErrorBoundary
        isLoading={false}
        error="Mystery card not loaded. The game may not have initialized properly."
        onRetry={handleRetryInitialization}
        loadingMessage="Loading mystery card..."
      >
        <div />
      </LoadingErrorBoundary>
    );
  }

  // Show game over screen if game has ended
  if (gameEnded) {
    const winningPlayer = activePlayers.find(player => player.score >= 10);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex items-center justify-center">
        <div className="text-center text-white relative z-10">
          <div className="text-6xl mb-6">🏆</div>
          <div className="text-4xl font-bold mb-4">Game Over!</div>
          {winningPlayer && (
            <div className="text-2xl mb-6">
              <span style={{ color: winningPlayer.color }}>{winningPlayer.name}</span> wins!
            </div>
          )}
          <div className="text-lg text-white/60">Thanks for playing!</div>
        </div>
      </div>
    );
  }

  // Loading state with proper error boundary
  if (gameState.phase === 'loading' || gameLoadingState.isLoading) {
    return (
      <LoadingErrorBoundary
        isLoading={true}
        error={null}
        loadingMessage="Getting the tunes ready..."
      >
        <div />
      </LoadingErrorBoundary>
    );
  }

  // Host view
  if (isHost) {
    const validCurrentTurnPlayer = currentTurnPlayer || activePlayers[0];
    
    if (!validCurrentTurnPlayer) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
          </div>
          <div className="text-center text-white relative z-10">
            <div className="text-6xl mb-4">⏳</div>
            <div className="text-2xl font-semibold mb-2">Waiting for players</div>
            <div className="text-white/60">Need at least one player to get started</div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <HostGameView
          currentTurnPlayer={validCurrentTurnPlayer}
          currentSong={currentMysteryCard}
          roomCode={room.lobby_code}
          players={activePlayers}
          mysteryCardRevealed={mysteryCardRevealed}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          cardPlacementResult={cardPlacementResult}
        />
        
        {currentMysteryCard?.preview_url && (
          <div className="fixed bottom-4 right-4 opacity-50">
            <AudioPlayer
              src={currentMysteryCard.preview_url}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              className="bg-black/50 p-2 rounded"
              ref={currentAudioRef}
              disabled={isLoadingPreview}
            />
          </div>
        )}
      </div>
    );
  }

  // Player view
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
        </div>
        <div className="text-center text-white relative z-10">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-2xl font-semibold mb-2">Something went wrong</div>
          <div className="text-white/60">Couldn't find your player info</div>
        </div>
      </div>
    );
  }

  const isMyTurn = currentPlayer.id === currentTurnPlayerId;

  return (
    <div className="relative">
      <PlayerGameView
        currentPlayer={currentPlayer}
        currentTurnPlayer={currentTurnPlayer || currentPlayer}
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
      
      {currentMysteryCard?.preview_url && isMyTurn && !gameEnded && (
        <div className="fixed bottom-4 right-4 opacity-50">
          <AudioPlayer
            src={currentMysteryCard.preview_url}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            className="bg-black/50 p-2 rounded"
            ref={currentAudioRef}
            disabled={isLoadingPreview}
          />
        </div>
      )}
    </div>
  );
}

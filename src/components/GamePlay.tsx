import React, { useState, useEffect, useRef } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { PlayerGameView } from '@/components/PlayerGameView';
import { HostGameView } from '@/components/HostGameView';
import { Song, Player } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { AudioPlayer } from '@/components/AudioPlayer';
import { DeezerAudioService } from '@/services/DeezerAudioService';

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
  const [startingCardsAssigned, setStartingCardsAssigned] = useState(false);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  // Single audio instance management to prevent overlaps
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioChannelRef = useRef<any>(null);

  const {
    gameState,
    setIsPlaying: setGameIsPlaying,
    getCurrentPlayer,
    initializeGame,
    startNewTurn
  } = useGameLogic(room?.id, players, room, onSetCurrentSong);

  // Initialize game on mount - CRITICAL FIX: Ensure mystery card is always set
  useEffect(() => {
    const initializeGameWithMysteryCard = async () => {
      if (room?.phase === 'playing' && gameState.phase === 'loading' && isHost) {
        console.log('🎯 INIT: Host initializing game with mystery card...');
        
        // Ensure we have available songs
        if (gameState.availableSongs.length > 0) {
          try {
            // Initialize the game with a mystery card using GameService
            await GameService.initializeGameWithMysteryCard(room.id, gameState.availableSongs);
            console.log('✅ INIT: Game initialized with mystery card successfully');
          } catch (error) {
            console.error('❌ INIT: Failed to initialize game with mystery card:', error);
          }
        }
        
        initializeGame();
      }
    };

    initializeGameWithMysteryCard();
  }, [room?.phase, gameState.phase, gameState.availableSongs, isHost, initializeGame, room?.id]);

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
      gameEnded
    });

    // ALERT if mystery card is undefined in playing phase
    if (room?.phase === 'playing' && !currentMysteryCard && !gameEnded) {
      console.error('🚨 CRITICAL: Mystery card is undefined during gameplay!');
    }
  }, [currentMysteryCard, currentTurnPlayer, currentTurnPlayerId, room?.current_turn, room?.phase, isHost, gameEnded]);

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

  // CRITICAL FIX: Show error if mystery card is undefined
  if (room?.phase === 'playing' && !currentMysteryCard && !gameEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black relative overflow-hidden flex items-center justify-center">
        <div className="text-center text-white relative z-10">
          <div className="text-6xl mb-6">🚨</div>
          <div className="text-4xl font-bold mb-4">Mystery Card Error</div>
          <div className="text-xl mb-6">The mystery card is not loading properly.</div>
          <div className="text-lg text-white/60">Please refresh the page or rejoin the game.</div>
        </div>
      </div>
    );
  }

  // FIX 4: Show game over screen if game has ended
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

  // Modern loading state
  if (gameState.phase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        </div>
        <div className="text-center text-white relative z-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center mb-6 mx-auto border border-white/20">
            <div className="text-3xl animate-spin">🎵</div>
          </div>
          <div className="text-2xl font-semibold mb-2">Getting the tunes ready...</div>
          <div className="text-white/60 max-w-md mx-auto">We're setting up some great music for you</div>
        </div>
      </div>
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

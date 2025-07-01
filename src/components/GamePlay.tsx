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
  onPlaceCard: (song: Song, position: number) => Promise<{ success: boolean; correct?: boolean }>;
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
  const [currentSongWithPreview, setCurrentSongWithPreview] = useState<Song | null>(null);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

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

  // Initialize game on mount
  useEffect(() => {
    if (room?.phase === 'playing' && gameState.phase === 'loading') {
      console.log('🎯 Initializing game...');
      initializeGame();
    }
  }, [room?.phase, gameState.phase, initializeGame]);

  // Get current turn player - this will only be from active players (non-host)
  const currentTurnPlayer = getCurrentPlayer();
  // Filter out host from active players for display and turn logic
  const activePlayers = players.filter(p => {
    const isHostPlayer = p.id.includes(room?.host_id) || p.id === room?.host_id;
    return !isHostPlayer;
  });

  console.log('🎯 Game debug (HOST FILTERING):', {
    allPlayers: players.length,
    activePlayers: activePlayers.length,
    currentTurnPlayer: currentTurnPlayer?.name,
    isHost,
    hostId: room?.host_id,
    hostFilteredOut: players.filter(p => p.id.includes(room?.host_id) || p.id === room?.host_id).length
  });

  // Fetch fresh preview URL when current song changes
  useEffect(() => {
    const fetchFreshPreview = async () => {
      if (gameState.currentSong && gameState.currentSong.id) {
        console.log('🎵 Fetching FRESH preview for mystery card:', gameState.currentSong.deezer_title);
        setIsLoadingPreview(true);
        try {
          // Always fetch a fresh preview URL to avoid expired ones
          const freshPreviewUrl = await DeezerAudioService.getPreviewUrl(gameState.currentSong.id);
          if (freshPreviewUrl) {
            const songWithFreshPreview = {
              ...gameState.currentSong,
              preview_url: freshPreviewUrl
            };
            setCurrentSongWithPreview(songWithFreshPreview);
            console.log('✅ Fresh preview URL obtained:', freshPreviewUrl);
          } else {
            console.error('❌ No preview URL available for mystery card');
            setCurrentSongWithPreview(gameState.currentSong);
          }
        } catch (error) {
          console.error('❌ Failed to fetch fresh preview URL:', error);
          setCurrentSongWithPreview(gameState.currentSong);
        } finally {
          setIsLoadingPreview(false);
        }
      } else {
        setCurrentSongWithPreview(gameState.currentSong);
      }
    };

    fetchFreshPreview();
  }, [gameState.currentSong?.id]);

  // Assign starting cards to players when game starts
  useEffect(() => {
    const assignStartingCards = async () => {
      if (
        !startingCardsAssigned &&
        gameState.phase === 'playing' &&
        gameState.availableSongs.length > 0 &&
        activePlayers.length > 0 &&
        isHost
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
  }, [gameState.phase, gameState.availableSongs, activePlayers, isHost, startingCardsAssigned]);

  // Audio setup - only for current turn player's mystery card
  useEffect(() => {
    if (!room?.id || !currentTurnPlayer) return;

    if (audioChannelRef.current) {
      audioChannelRef.current.unsubscribe();
      audioChannelRef.current = null;
    }

    const setupChannel = () => {
      const channel = supabase
        .channel(`audio-${room.id}`)
        .on('broadcast', { event: 'audio-control' }, (payload) => {
          console.log('🔊 Audio control received:', payload.payload);
          // Only respond to audio controls for the current mystery card
          if (payload.payload?.currentTurnPlayerId === currentTurnPlayer.id && 
              payload.payload?.songId === currentSongWithPreview?.id) {
            if (payload.payload?.action === 'play') {
              setIsPlaying(true);
            } else if (payload.payload?.action === 'pause') {
              setIsPlaying(false);
            } else if (payload.payload?.action === 'stop') {
              setIsPlaying(false);
              // Stop any currently playing audio
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
  }, [room?.id, currentTurnPlayer?.id, currentSongWithPreview?.id]);

  // Stop any playing audio when song changes to prevent overlaps
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
    };
  }, [currentSongWithPreview?.id]);

  // FIXED: Simplified and reliable host audio preview
  const handlePlayPause = async () => {
    console.log('🎵 Play/Pause for mystery card:', { 
      isHost, 
      isPlaying, 
      currentSong: currentSongWithPreview?.deezer_title,
      currentTurnPlayer: currentTurnPlayer?.name,
      previewUrl: currentSongWithPreview?.preview_url,
      isLoadingPreview
    });
    
    if (!currentTurnPlayer || !currentSongWithPreview || isLoadingPreview) {
      console.log('⚠️ Cannot play: missing data or loading preview');
      return;
    }

    // If already playing, just pause
    if (isPlaying) {
      console.log('🎵 Pausing audio');
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
            songId: currentSongWithPreview.id
          }
        });
      }
      return;
    }

    // Need fresh preview URL before playing
    let previewUrl = currentSongWithPreview.preview_url;
    
    if (!previewUrl && currentSongWithPreview.id) {
      console.log('🔍 No preview URL, fetching fresh one for host play...');
      setIsLoadingPreview(true);
      try {
        previewUrl = await DeezerAudioService.getPreviewUrl(currentSongWithPreview.id);
        if (previewUrl) {
          setCurrentSongWithPreview(prev => prev ? { ...prev, preview_url: previewUrl } : null);
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
      console.log('❌ No preview URL available for host playback');
      return;
    }
    
    // Stop any currently playing audio before starting new one
    const allAudio = document.querySelectorAll('audio');
    allAudio.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    
    console.log('🎵 Starting audio playback for host');
    setIsPlaying(true);
    setGameIsPlaying(true);

    if (audioChannelRef.current) {
      console.log('🔊 Broadcasting audio control: play');
      await audioChannelRef.current.send({
        type: 'broadcast',
        event: 'audio-control',
        payload: { 
          action: 'play',
          currentTurnPlayerId: currentTurnPlayer.id,
          songId: currentSongWithPreview.id
        }
      });
    }
  };

  const handlePlaceCard = async (song: Song, position: number): Promise<{ success: boolean }> => {
    if (!currentPlayer || isProcessingTurn) {
      console.error('Cannot place card: missing player or turn in progress');
      return { success: false };
    }

    // Prevent multiple concurrent turn processing
    setIsProcessingTurn(true);

    try {
      console.log('🃏 Placing mystery card:', { song: song.deezer_title, position });
      setMysteryCardRevealed(true);
      soundEffects.playCardPlace();

      // Stop any playing audio when card is placed
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }
      setIsPlaying(false);

      const result = await onPlaceCard(song, position);
      console.log('🃏 Card placement result:', result);
      
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

        // ALWAYS advance turn after showing result, regardless of correctness
        setTimeout(async () => {
          setCardPlacementResult(null);
          setMysteryCardRevealed(false);
          setIsPlaying(false);
          
          // Stop any audio before turn transition
          if (audioChannelRef.current) {
            await audioChannelRef.current.send({
              type: 'broadcast',
              event: 'audio-control',
              payload: { action: 'stop' }
            });
          }
          
          // Update turn in database - ALWAYS advance to next player
          if (isHost) {
            const nextTurnIndex = (gameState.currentTurnIndex + 1) % activePlayers.length;
            console.log(`🔄 Advancing turn from ${gameState.currentTurnIndex} to ${nextTurnIndex}`);
            
            try {
              const { error } = await supabase
                .from('game_rooms')
                .update({ current_turn: nextTurnIndex })
                .eq('id', room.id);
                
              if (error) {
                console.error('Failed to update turn:', error);
              } else {
                console.log('✅ Turn successfully advanced to next player');
              }
            } catch (error) {
              console.error('Error updating turn:', error);
            }
          }
          
          // Start new turn with new mystery card after brief delay
          setTimeout(() => {
            console.log('🎯 Starting new turn with new mystery card');
            startNewTurn();
            setIsProcessingTurn(false);
          }, 1000);
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
          currentSong={currentSongWithPreview}
          roomCode={room.lobby_code}
          players={activePlayers}
          mysteryCardRevealed={mysteryCardRevealed}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          cardPlacementResult={cardPlacementResult}
        />
        
        {/* ENHANCED: Host audio player with better error handling */}
        {currentSongWithPreview?.preview_url && (
          <div className="fixed bottom-4 right-4 opacity-50">
            <AudioPlayer
              src={currentSongWithPreview.preview_url}
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

  const isMyTurn = currentTurnPlayer?.id === currentPlayer.id;

  return (
    <div className="relative">
      <PlayerGameView
        currentPlayer={currentPlayer}
        currentTurnPlayer={currentTurnPlayer || currentPlayer}
        currentSong={currentSongWithPreview}
        roomCode={room.lobby_code}
        isMyTurn={isMyTurn}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onPlaceCard={handlePlaceCard}
        mysteryCardRevealed={mysteryCardRevealed}
        cardPlacementResult={cardPlacementResult}
      />
      
      {/* Player audio player - only plays if it's their turn and it's the mystery card */}
      {currentSongWithPreview?.preview_url && isMyTurn && (
        <div className="fixed bottom-4 right-4 opacity-50">
          <AudioPlayer
            src={currentSongWithPreview.preview_url}
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

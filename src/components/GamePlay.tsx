
import React, { useState, useEffect, useRef } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { PlayerGameView } from '@/components/PlayerGameView';
import { HostDisplay } from '@/components/HostDisplay';
import { Song, Player } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { useSoundEffects } from '@/hooks/useSoundEffects';

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
  const [draggedSong, setDraggedSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cardPlacementResult, setCardPlacementResult] = useState<{ correct: boolean; song: Song } | null>(null);
  const [mysteryCardRevealed, setMysteryCardRevealed] = useState(false);
  const [songLoadingError, setSongLoadingError] = useState<string | null>(null);
  const [retryingSong, setRetryingSong] = useState(false);
  const [audioPlaybackError, setAudioPlaybackError] = useState<string | null>(null);

  const audioChannelRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const songProgressRef = useRef(0);
  const songDurationRef = useRef(0);

  const {
    gameState,
    setIsPlaying: setGameIsPlaying,
    getCurrentPlayer,
    initializeGame,
    startNewTurn
  } = useGameLogic(room?.id, players, room, onSetCurrentSong);

  // Debug logging - but only log once per second to prevent spam
  const lastLogTime = useRef(0);
  const now = Date.now();
  if (now - lastLogTime.current > 1000) {
    console.log('🎮 GamePlay render - DEBUG INFO:', {
      isHost,
      roomPhase: room?.phase,
      playersCount: players.length,
      currentPlayerExists: !!currentPlayer,
      roomId: room?.id,
      hostId: room?.host_id,
      connectionState: { gamePhase: gameState.phase, currentSong: !!gameState.currentSong }
    });
    lastLogTime.current = now;
  }

  // Initialize game on mount
  useEffect(() => {
    if (room?.phase === 'playing' && gameState.phase === 'loading') {
      console.log('🎯 Initializing game...');
      initializeGame();
    }
  }, [room?.phase, gameState.phase, initializeGame]);

  // Get current turn player
  const currentTurnPlayer = getCurrentPlayer();
  const activePlayers = players.filter(p => p.id !== room?.host_id);

  // Audio setup with proper cleanup
  useEffect(() => {
    if (!room?.id) return;

    // Cleanup existing channel
    if (audioChannelRef.current) {
      console.log('🧹 Cleaning up existing audio channel...');
      audioChannelRef.current.unsubscribe();
      audioChannelRef.current = null;
    }

    // Only set up audio channel every 5 seconds to prevent spam
    const setupChannel = () => {
      console.log('🔌 Setting up audio control channel for room:', room.id);
      
      const channel = supabase
        .channel(`audio-${room.id}`)
        .on('broadcast', { event: 'audio-control' }, (payload) => {
          if (payload.payload?.action === 'play') {
            setIsPlaying(true);
          } else if (payload.payload?.action === 'pause') {
            setIsPlaying(false);
          }
        })
        .subscribe((status) => {
          console.log('🔌 Audio channel status:', status);
        });

      audioChannelRef.current = channel;
    };

    // Debounce channel setup
    const timeoutId = setTimeout(setupChannel, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (audioChannelRef.current) {
        audioChannelRef.current.unsubscribe();
        audioChannelRef.current = null;
      }
    };
  }, [room?.id]);

  // Handle audio playback
  useEffect(() => {
    if (!gameState.currentSong?.preview_url || !isHost) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (isPlaying && gameState.currentSong.preview_url) {
      const audio = new Audio(gameState.currentSong.preview_url);
      audioRef.current = audio;

      audio.addEventListener('loadedmetadata', () => {
        songDurationRef.current = audio.duration;
        setAudioPlaybackError(null);
      });

      audio.addEventListener('timeupdate', () => {
        songProgressRef.current = audio.currentTime;
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setAudioPlaybackError('Failed to play audio preview');
      });

      audio.play().catch((error) => {
        console.error('Failed to play audio:', error);
        setAudioPlaybackError('Audio autoplay blocked by browser');
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isPlaying, gameState.currentSong?.preview_url, isHost]);

  const handlePlayPause = async () => {
    if (!isHost) {
      // For players, send request to host
      if (audioChannelRef.current) {
        await audioChannelRef.current.send({
          type: 'broadcast',
          event: 'audio-control',
          payload: { action: isPlaying ? 'pause' : 'play' }
        });
      }
      return;
    }

    // For host, control directly
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    setGameIsPlaying(newIsPlaying);

    // Broadcast to other players
    if (audioChannelRef.current) {
      await audioChannelRef.current.send({
        type: 'broadcast',
        event: 'audio-control',
        payload: { action: newIsPlaying ? 'play' : 'pause' }
      });
    }
  };

  const handlePlaceCard = async (position: number): Promise<{ success: boolean }> => {
    if (!draggedSong || !currentPlayer) {
      return { success: false };
    }

    try {
      setMysteryCardRevealed(true);
      soundEffects.playCardPlace();

      const result = await onPlaceCard(draggedSong, position);
      
      if (result.success) {
        const isCorrect = result.correct ?? false;
        
        setCardPlacementResult({ 
          correct: isCorrect, 
          song: draggedSong 
        });

        if (isCorrect) {
          soundEffects.playCardSuccess();
        } else {
          soundEffects.playCardError();
        }

        // Show result for 3 seconds
        setTimeout(() => {
          setCardPlacementResult(null);
          setMysteryCardRevealed(false);
          setDraggedSong(null);
          
          // Start next turn
          startNewTurn();
        }, 3000);

        return { success: true };
      }

      return { success: false };
    } catch (error) {
      console.error('Failed to place card:', error);
      setCardPlacementResult(null);
      setMysteryCardRevealed(false);
      return { success: false };
    }
  };

  const handleDragStart = (song: Song) => {
    setDraggedSong(song);
  };

  const handleDragEnd = () => {
    setDraggedSong(null);
  };

  const handleRetrySong = () => {
    setRetryingSong(true);
    setSongLoadingError(null);
    setTimeout(() => {
      startNewTurn();
      setRetryingSong(false);
    }, 1000);
  };

  const handleRetryAudio = () => {
    setAudioPlaybackError(null);
    setIsPlaying(false);
    setTimeout(() => setIsPlaying(true), 500);
  };

  const handleSkipSong = () => {
    setAudioPlaybackError(null);
    setSongLoadingError(null);
    startNewTurn();
  };

  // Debug logging for renders (throttled)
  if (now - lastLogTime.current > 1000) {
    console.log('🎮 GamePlay render:', {
      isHost,
      currentTurnPlayer: currentTurnPlayer?.name,
      currentSong: gameState.currentSong?.deezer_title,
      activePlayers: activePlayers.length,
      gamePhase: gameState.phase,
      roomPhase: room?.phase,
      connectionStatus: audioChannelRef.current ? 'connected' : 'disconnected'
    });
  }

  // Loading state
  if (gameState.phase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4 animate-spin">🎵</div>
          <div className="text-2xl font-bold mb-2">Loading Game...</div>
          <div className="text-slate-300">Preparing the music timeline</div>
        </div>
      </div>
    );
  }

  // Host view
  if (isHost) {
    console.log('🎮 Rendering HostDisplay with:', {
      currentTurnPlayer: currentTurnPlayer?.name,
      playersCount: players.length,
      currentSong: gameState.currentSong?.deezer_title
    });

    return (
      <HostDisplay
        currentTurnPlayer={currentTurnPlayer || players[0]} // Fallback to first player
        players={activePlayers}
        roomCode={room.lobby_code}
        currentSongProgress={songProgressRef.current}
        currentSongDuration={songDurationRef.current}
        gameState={{
          currentSong: gameState.currentSong,
          mysteryCardRevealed,
          cardPlacementCorrect: cardPlacementResult?.correct || null
        }}
        songLoadingError={songLoadingError}
        retryingSong={retryingSong}
        onRetrySong={handleRetrySong}
        audioPlaybackError={audioPlaybackError}
        onRetryAudio={handleRetryAudio}
        onSkipSong={handleSkipSong}
      />
    );
  }

  // Player view
  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-2xl font-bold mb-2">Player Not Found</div>
          <div className="text-slate-300">Unable to load your player data</div>
        </div>
      </div>
    );
  }

  const isMyTurn = currentTurnPlayer?.id === currentPlayer.id;

  console.log('🎮 Rendering PlayerView for:', currentPlayer.name, 'isMyTurn:', isMyTurn);

  return (
    <PlayerGameView
      currentPlayer={currentPlayer}
      currentTurnPlayer={currentTurnPlayer || currentPlayer}
      currentSong={gameState.currentSong}
      roomCode={room.lobby_code}
      isMyTurn={isMyTurn}
      isPlaying={isPlaying}
      onPlayPause={handlePlayPause}
      onPlaceCard={handlePlaceCard}
      mysteryCardRevealed={mysteryCardRevealed}
      cardPlacementResult={cardPlacementResult}
    />
  );
}

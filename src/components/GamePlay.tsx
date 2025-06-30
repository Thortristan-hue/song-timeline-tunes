
import React, { useState, useEffect, useRef } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { PlayerGameView } from '@/components/PlayerGameView';
import { HostGameView } from '@/components/HostGameView';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [cardPlacementResult, setCardPlacementResult] = useState<{ correct: boolean; song: Song } | null>(null);
  const [mysteryCardRevealed, setMysteryCardRevealed] = useState(false);

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

  // Get current turn player
  const currentTurnPlayer = getCurrentPlayer();
  // Filter out host from active players for turn-based gameplay
  const activePlayers = players.filter(p => !p.id.includes(room?.host_id));

  // Audio setup
  useEffect(() => {
    if (!room?.id) return;

    if (audioChannelRef.current) {
      audioChannelRef.current.unsubscribe();
      audioChannelRef.current = null;
    }

    const setupChannel = () => {
      const channel = supabase
        .channel(`audio-${room.id}`)
        .on('broadcast', { event: 'audio-control' }, (payload) => {
          console.log('🔊 Audio control received:', payload.payload);
          if (payload.payload?.action === 'play') {
            setIsPlaying(true);
          } else if (payload.payload?.action === 'pause') {
            setIsPlaying(false);
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
  }, [room?.id]);

  const handlePlayPause = async () => {
    if (!isHost) {
      if (audioChannelRef.current) {
        const action = isPlaying ? 'pause' : 'play';
        await audioChannelRef.current.send({
          type: 'broadcast',
          event: 'audio-control',
          payload: { action }
        });
      }
      return;
    }

    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    setGameIsPlaying(newIsPlaying);

    if (audioChannelRef.current) {
      await audioChannelRef.current.send({
        type: 'broadcast',
        event: 'audio-control',
        payload: { action: newIsPlaying ? 'play' : 'pause' }
      });
    }
  };

  const handlePlaceCard = async (position: number): Promise<{ success: boolean }> => {
    if (!gameState.currentSong || !currentPlayer) {
      console.error('Cannot place card: missing song or player');
      return { success: false };
    }

    try {
      console.log('🃏 Placing card at position:', position);
      setMysteryCardRevealed(true);
      soundEffects.playCardPlace();

      const result = await onPlaceCard(gameState.currentSong, position);
      console.log('🃏 Card placement result:', result);
      
      if (result.success) {
        const isCorrect = result.correct ?? false;
        
        setCardPlacementResult({ 
          correct: isCorrect, 
          song: gameState.currentSong 
        });

        if (isCorrect) {
          soundEffects.playCardSuccess();
        } else {
          soundEffects.playCardError();
        }

        setTimeout(() => {
          setCardPlacementResult(null);
          setMysteryCardRevealed(false);
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
    const validCurrentTurnPlayer = currentTurnPlayer || activePlayers[0];
    
    if (!validCurrentTurnPlayer) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-6xl mb-4">⏳</div>
            <div className="text-2xl font-bold mb-2">Waiting for Players</div>
            <div className="text-slate-300">Need at least one player to start the game</div>
          </div>
        </div>
      );
    }

    return (
      <HostGameView
        currentTurnPlayer={validCurrentTurnPlayer}
        currentSong={gameState.currentSong}
        roomCode={room.lobby_code}
        players={activePlayers}
        mysteryCardRevealed={mysteryCardRevealed}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        cardPlacementResult={cardPlacementResult}
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

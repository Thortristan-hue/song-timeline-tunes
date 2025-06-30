
import React, { useState, useEffect, useRef } from 'react';
import { useGameLogic } from '@/hooks/useGameLogic';
import { PlayerGameView } from '@/components/PlayerGameView';
import { HostGameView } from '@/components/HostGameView';
import { Song, Player } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { AudioPlayer } from '@/components/AudioPlayer';

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

  // Audio setup - only for current turn player's song
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
          // Only play/pause if this is for the current turn player's song
          if (payload.payload?.currentTurnPlayerId === currentTurnPlayer?.id) {
            if (payload.payload?.action === 'play') {
              setIsPlaying(true);
            } else if (payload.payload?.action === 'pause') {
              setIsPlaying(false);
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
  }, [room?.id, currentTurnPlayer?.id]);

  const handlePlayPause = async () => {
    console.log('🎵 Play/Pause clicked:', { 
      isHost, 
      isPlaying, 
      currentSong: gameState.currentSong?.deezer_title,
      currentTurnPlayer: currentTurnPlayer?.name
    });
    
    if (!currentTurnPlayer) {
      console.log('⚠️ No current turn player, ignoring play/pause');
      return;
    }
    
    if (!isHost) {
      if (audioChannelRef.current) {
        const action = isPlaying ? 'pause' : 'play';
        console.log(`🔊 Sending audio control: ${action} for player ${currentTurnPlayer.name}`);
        await audioChannelRef.current.send({
          type: 'broadcast',
          event: 'audio-control',
          payload: { 
            action,
            currentTurnPlayerId: currentTurnPlayer.id
          }
        });
      }
      return;
    }

    const newIsPlaying = !isPlaying;
    console.log(`🎵 Host setting isPlaying to: ${newIsPlaying} for ${currentTurnPlayer.name}`);
    setIsPlaying(newIsPlaying);
    setGameIsPlaying(newIsPlaying);

    if (audioChannelRef.current) {
      console.log(`🔊 Broadcasting audio control: ${newIsPlaying ? 'play' : 'pause'} for player ${currentTurnPlayer.name}`);
      await audioChannelRef.current.send({
        type: 'broadcast',
        event: 'audio-control',
        payload: { 
          action: newIsPlaying ? 'play' : 'pause',
          currentTurnPlayerId: currentTurnPlayer.id
        }
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
          currentSong={gameState.currentSong}
          roomCode={room.lobby_code}
          players={activePlayers}
          mysteryCardRevealed={mysteryCardRevealed}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          cardPlacementResult={cardPlacementResult}
        />
        
        {/* Hidden audio player for host - only plays current turn player's song */}
        {gameState.currentSong?.preview_url && (
          <div className="fixed bottom-4 right-4 opacity-50">
            <AudioPlayer
              src={gameState.currentSong.preview_url}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              className="bg-black/50 p-2 rounded"
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
        currentSong={gameState.currentSong}
        roomCode={room.lobby_code}
        isMyTurn={isMyTurn}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onPlaceCard={handlePlaceCard}
        mysteryCardRevealed={mysteryCardRevealed}
        cardPlacementResult={cardPlacementResult}
      />
      
      {/* Hidden audio player for player - only plays if it's their turn */}
      {gameState.currentSong?.preview_url && isMyTurn && (
        <div className="fixed bottom-4 right-4 opacity-50">
          <AudioPlayer
            src={gameState.currentSong.preview_url}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            className="bg-black/50 p-2 rounded"
          />
        </div>
      )}
    </div>
  );
}

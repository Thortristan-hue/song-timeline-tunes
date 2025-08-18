
import { useState, useEffect, useCallback } from 'react';
import { Song, Player, GameRoom } from '@/types/game';
import { defaultPlaylistService } from '@/services/defaultPlaylistService';
import { useToast } from '@/components/ui/use-toast';

interface OptimizedGameState {
  phase: 'loading' | 'ready' | 'playing' | 'finished';
  players: Player[];
  currentTurnIndex: number;
  currentSong: Song | null;
  availableSongs: Song[];
  usedSongs: Song[];
  isPlaying: boolean;
  winner: Player | null;
  loadingError: string | null;
  timeLeft: number;
  playlistInitialized: boolean;
}

export function useOptimizedGameLogic(
  roomId: string | null, 
  allPlayers: Player[],
  roomData: GameRoom | null = null,
  onSetCurrentSong?: (song: Song) => Promise<void>
) {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<OptimizedGameState>({
    phase: 'loading',
    players: [],
    currentTurnIndex: 0,
    currentSong: null,
    availableSongs: [],
    usedSongs: [],
    isPlaying: false,
    winner: null,
    loadingError: null,
    timeLeft: 30,
    playlistInitialized: false
  });

  // Instant player sync
  useEffect(() => {
    if (allPlayers.length > 0) {
      const activePlayers = allPlayers.filter(p => !p.id.includes('host-'));
      setGameState(prev => ({ ...prev, players: activePlayers }));
      
      const winner = activePlayers.find(player => player.score >= 9);
      if (winner && !gameState.winner) {
        setGameState(prev => ({ ...prev, winner, phase: 'finished' }));
      }
    }
  }, [allPlayers, gameState.winner]);

  // Instant room sync
  useEffect(() => {
    if (roomData) {
      setGameState(prev => ({
        ...prev,
        currentSong: roomData.current_song || prev.currentSong,
        currentTurnIndex: roomData.current_turn || 0,
        phase: roomData.phase === 'playing' ? 'playing' : prev.phase
      }));
    }
  }, [roomData]);

  // Instant game initialization
  const initializeGame = useCallback(async () => {
    if (gameState.playlistInitialized) {
      setGameState(prev => ({ ...prev, phase: 'ready' }));
      return;
    }

    try {
      setGameState(prev => ({ ...prev, phase: 'loading', loadingError: null }));
      
      console.log('🚀 Loading songs instantly...');
      const optimizedSongs = await defaultPlaylistService.loadOptimizedGameSongs(20);
      
      if (optimizedSongs.length < 8) {
        throw new Error(`Not enough songs (${optimizedSongs.length}/8 minimum)`);
      }

      setGameState(prev => ({
        ...prev,
        phase: 'ready',
        availableSongs: optimizedSongs,
        usedSongs: [],
        currentTurnIndex: 0,
        timeLeft: 30,
        playlistInitialized: true
      }));

      console.log('✅ Game initialized instantly');
    } catch (error) {
      console.error('❌ Game initialization failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to initialize game';
      setGameState(prev => ({ ...prev, loadingError: errorMsg, playlistInitialized: false }));
      
      toast({
        title: "Game Setup Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  }, [toast, gameState.playlistInitialized]);

  return {
    gameState,
    setIsPlaying: (playing: boolean) => {
      setGameState(prev => ({ ...prev, isPlaying: playing }));
    },
    getCurrentPlayer: () => {
      const activePlayers = gameState.players;
      if (activePlayers.length === 0) return null;
      
      const currentIndex = Math.min(gameState.currentTurnIndex, activePlayers.length - 1);
      return activePlayers[currentIndex] || null;
    },
    initializeGame
  };
}

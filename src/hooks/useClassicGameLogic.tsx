import { useState, useEffect, useCallback } from 'react';
import { Song, Player, GameRoom } from '@/types/game';
import { defaultPlaylistService } from '@/services/defaultPlaylistService';
import { useToast } from '@/components/ui/use-toast';
import { GameService } from '@/services/gameService';

interface ClassicGameLogicState {
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
  transitioningTurn: boolean;
  playlistInitialized: boolean;
  backgroundLoadingComplete: boolean;
}

const MAX_SONGS_PER_SESSION = 20;
const WINNING_CARDS_COUNT = 10;

export function useClassicGameLogic(
  roomId: string | null, 
  allPlayers: Player[],
  roomData: GameRoom | null = null,
  onSetCurrentSong?: (song: Song) => Promise<void>
) {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<ClassicGameLogicState>({
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
    transitioningTurn: false,
    playlistInitialized: false,
    backgroundLoadingComplete: false
  });

  // Filter and sync ONLY non-host players
  useEffect(() => {
    if (allPlayers.length > 0) {
      const activePlayers = allPlayers.filter(p => {
        const isHostLike = p.id.includes('host-') || 
                          (roomData?.host_id && p.id === roomData.host_id);
        return !isHostLike;
      });
      
      setGameState(prev => ({
        ...prev,
        players: activePlayers
      }));
      
      // Check for winner (first player to reach 10 cards)
      const winner = activePlayers.find(player => player.timeline.length >= WINNING_CARDS_COUNT);
      if (winner && !gameState.winner) {
        setGameState(prev => ({
          ...prev,
          winner,
          phase: 'finished'
        }));
      }
    }
  }, [allPlayers, roomData?.host_id, gameState.winner]);

  // Phase synchronization from room data
  useEffect(() => {
    if (roomData) {
      setGameState(prev => ({
        ...prev,
        currentSong: roomData.current_song || prev.currentSong,
        currentTurnIndex: roomData.current_turn || 0,
        phase: roomData.phase === 'playing' ? 'playing' : prev.phase
      }));
    }
  }, [roomData?.current_song, roomData?.phase, roomData?.current_turn, roomData]);

  // Initialize game with optimized song loading
  const initializeGame = useCallback(async () => {
    if (gameState.playlistInitialized) {
      console.log('🎵 Classic Mode: Playlist already initialized');
      setGameState(prev => ({ ...prev, phase: 'ready' }));
      return;
    }

    try {
      setGameState(prev => ({ ...prev, phase: 'loading', loadingError: null }));
      
      console.log(`🎯 Classic Mode: Loading ${MAX_SONGS_PER_SESSION} songs`);
      const optimizedSongs = await defaultPlaylistService.loadOptimizedGameSongs(MAX_SONGS_PER_SESSION);
      
      if (optimizedSongs.length === 0) {
        throw new Error('No songs with valid previews available');
      }

      if (optimizedSongs.length < 8) {
        throw new Error(`Not enough songs with valid audio previews (${optimizedSongs.length}/8 minimum)`);
      }

      console.log(`🎯 Classic Mode: Ready with ${optimizedSongs.length} songs`);

      setGameState(prev => ({
        ...prev,
        phase: 'ready',
        availableSongs: optimizedSongs,
        usedSongs: [],
        currentTurnIndex: 0,
        timeLeft: 30,
        playlistInitialized: true
      }));

    } catch (error) {
      console.error('❌ Classic Mode initialization failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to initialize classic mode';
      setGameState(prev => ({ ...prev, loadingError: errorMsg, playlistInitialized: false }));
      
      toast({
        title: "Classic Mode Setup Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  }, [toast, gameState.playlistInitialized]);

  // Place card in timeline (turn-based)
  const placeCard = useCallback(async (song: Song, position: number, playerId: string): Promise<{ success: boolean; correct?: boolean }> => {
    if (!roomId || gameState.phase !== 'playing') {
      return { success: false };
    }

    try {
      const result = await GameService.placeCardAndAdvanceTurn(
        roomId,
        playerId,
        song,
        position,
        gameState.availableSongs
      );

      if (result.success) {
        // Check if game ended
        if (result.gameEnded && result.winner) {
          setGameState(prev => ({
            ...prev,
            winner: result.winner!,
            phase: 'finished'
          }));
        }

        return { success: true, correct: result.correct };
      }

      return { success: false };
    } catch (error) {
      console.error('Failed to place card in classic mode:', error);
      return { success: false };
    }
  }, [roomId, gameState.phase, gameState.availableSongs]);

  return {
    gameState,
    setIsPlaying: (playing: boolean) => {
      setGameState(prev => ({ ...prev, isPlaying: playing }));
    },
    getCurrentPlayer: () => {
      const activePlayers = gameState.players;
      if (activePlayers.length === 0) {
        return null;
      }
      
      const currentIndex = Math.min(gameState.currentTurnIndex, activePlayers.length - 1);
      return activePlayers[currentIndex] || null;
    },
    initializeGame,
    placeCard,
    WINNING_CARDS_COUNT
  };
}
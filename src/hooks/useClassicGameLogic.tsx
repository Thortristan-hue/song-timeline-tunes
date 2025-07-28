
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

  // Phase synchronization from room data - CRITICAL: Update currentSong state
  useEffect(() => {
    if (roomData) {
      console.log('🎯 ROOM DATA UPDATE:', {
        currentSong: roomData.current_song,
        phase: roomData.phase,
        currentTurn: roomData.current_turn
      });
      
      setGameState(prev => ({
        ...prev,
        currentSong: roomData.current_song || prev.currentSong,
        currentTurnIndex: roomData.current_turn || 0,
        phase: roomData.phase === 'playing' ? 'playing' : prev.phase,
        // CRITICAL: Update available songs from room data
        availableSongs: roomData.songs ? (Array.isArray(roomData.songs) ? roomData.songs as unknown as Song[] : prev.availableSongs) : prev.availableSongs
      }));
    }
  }, [roomData?.current_song, roomData?.phase, roomData?.current_turn, roomData?.songs]);

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

  // CRITICAL FIX: Place card in timeline with proper mystery card update
  const placeCard = useCallback(async (song: Song, position: number, playerId: string): Promise<{ success: boolean; correct?: boolean }> => {
    if (!roomId || gameState.phase !== 'playing') {
      console.error('❌ PLACE CARD: Invalid state', { roomId, phase: gameState.phase });
      return { success: false };
    }

    console.log('🃏 PLACE CARD: Starting placement', {
      song: song.deezer_title,
      position,
      playerId,
      availableSongsCount: gameState.availableSongs.length
    });

    try {
      // CRITICAL: Pass current available songs to the service
      const result = await GameService.placeCardAndAdvanceTurn(
        roomId,
        playerId,
        song,
        position,
        gameState.availableSongs // Pass current available songs
      );

      console.log('🎯 PLACE CARD RESULT:', result);

      if (result.success) {
        // CRITICAL: Update local state to remove placed song from available songs
        setGameState(prev => ({
          ...prev,
          availableSongs: prev.availableSongs.filter(s => s.id !== song.id),
          usedSongs: [...prev.usedSongs, song]
        }));
        
        console.log('✅ PLACE CARD: Local state updated, song removed from available pool');

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
      console.error('❌ PLACE CARD: Failed:', error);
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

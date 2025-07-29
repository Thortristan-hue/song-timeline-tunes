
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
  gameFullyInitialized: boolean;
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
    backgroundLoadingComplete: false,
    gameFullyInitialized: false
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

  // CRITICAL FIX: Single comprehensive room data handler
  useEffect(() => {
    if (!roomData) return;

    console.log('🎯 Classic Mode: Processing room data update:', {
      currentSong: roomData.current_song?.deezer_title || 'none',
      songsCount: roomData.songs?.length || 0,
      phase: roomData.phase,
      gameFullyInitialized: gameState.gameFullyInitialized
    });

    // Update basic room state
    setGameState(prev => ({
      ...prev,
      currentSong: roomData.current_song || prev.currentSong,
      currentTurnIndex: roomData.current_turn || 0
    }));

    // CRITICAL: Handle songs from room data and initialize game properly
    if (roomData.songs && roomData.songs.length > 0 && !gameState.gameFullyInitialized) {
      console.log('🎵 Classic Mode: Initializing game with songs from room data:', roomData.songs.length);
      
      setGameState(prev => ({
        ...prev,
        availableSongs: roomData.songs,
        playlistInitialized: true,
        backgroundLoadingComplete: true,
        gameFullyInitialized: true,
        phase: roomData.phase === 'playing' ? 'playing' : 'ready'
      }));

      // If we don't have a current song and we have available songs, set the first one
      if (!roomData.current_song && roomData.songs.length > 0 && onSetCurrentSong) {
        console.log('🎵 Classic Mode: Setting initial mystery card from available songs');
        const firstSong = roomData.songs[0];
        onSetCurrentSong(firstSong).catch(error => {
          console.error('Failed to set initial mystery card:', error);
        });
      }
    } 
    // If we already have songs and room phase changes to playing, update phase
    else if (gameState.gameFullyInitialized && roomData.phase === 'playing') {
      console.log('🎯 Classic Mode: Room phase changed to playing with existing game state');
      setGameState(prev => ({
        ...prev,
        phase: 'playing'
      }));
    }
  }, [roomData, gameState.gameFullyInitialized, onSetCurrentSong]);

  // Initialize game with optimized song loading (fallback for local song fetching)
  const initializeGame = useCallback(async () => {
    // If we already have songs from room data, don't fetch again
    if (roomData?.songs && roomData.songs.length > 0) {
      console.log('🎵 Classic Mode: Using existing songs from room data, skipping fetch');
      setGameState(prev => ({
        ...prev,
        phase: 'ready',
        availableSongs: roomData.songs,
        playlistInitialized: true,
        backgroundLoadingComplete: true,
        gameFullyInitialized: true
      }));
      return;
    }

    if (gameState.playlistInitialized) {
      console.log('🎵 Classic Mode: Playlist already initialized, setting to ready');
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
        playlistInitialized: true,
        backgroundLoadingComplete: true,
        gameFullyInitialized: true
      }));

      console.log('✅ Classic Mode: Initialization complete');

    } catch (error) {
      console.error('❌ Classic Mode initialization failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to initialize classic mode';
      setGameState(prev => ({ 
        ...prev, 
        loadingError: errorMsg, 
        playlistInitialized: false,
        gameFullyInitialized: false 
      }));
      
      toast({
        title: "Classic Mode Setup Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  }, [toast, gameState.playlistInitialized, roomData?.songs]);

  // Place card in timeline (turn-based)
  const placeCard = useCallback(async (song: Song, position: number, playerId: string): Promise<{ success: boolean; correct?: boolean }> => {
    if (!roomId || gameState.phase !== 'playing') {
      console.error('Cannot place card: invalid state', { roomId: !!roomId, phase: gameState.phase });
      return { success: false };
    }

    if (gameState.availableSongs.length === 0) {
      console.error('Cannot place card: no available songs');
      return { success: false };
    }

    console.log('🎯 Classic Mode: Attempting to place card with available songs:', gameState.availableSongs.length);

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

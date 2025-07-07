
import { useState, useEffect, useCallback } from 'react';
import { Song, Player } from '@/types/game';
import { defaultPlaylistService } from '@/services/defaultPlaylistService';
import { useToast } from '@/components/ui/use-toast';

interface GameLogicState {
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

export function useGameLogic(
  roomId: string | null, 
  allPlayers: Player[],
  roomData: any = null,
  onSetCurrentSong?: (song: Song) => Promise<void>
) {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameLogicState>({
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
      
      const winner = activePlayers.find(player => player.score >= 10);
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
  }, [roomData?.current_song, roomData?.phase, roomData?.current_turn]);

  // OPTIMIZATION: Initialize game with quick start approach
  const initializeGame = useCallback(async () => {
    if (gameState.playlistInitialized) {
      console.log('🎵 Playlist already initialized, skipping...');
      setGameState(prev => ({ ...prev, phase: 'ready' }));
      return;
    }

    try {
      setGameState(prev => ({ ...prev, phase: 'loading', loadingError: null }));
      
      console.log('🎵 Loading optimized playlist (quick start mode)...');
      const allSongs = await defaultPlaylistService.loadDefaultPlaylist();
      
      if (allSongs.length === 0) {
        throw new Error('No songs available in playlist');
      }

      // OPTIMIZATION: Quick start with 10 songs, expand later
      const INITIAL_LOAD_COUNT = 10;
      const shuffledSongs = [...allSongs].sort(() => Math.random() - 0.5);
      const initialSongs = shuffledSongs.slice(0, INITIAL_LOAD_COUNT);
      
      const validSongs = defaultPlaylistService.filterValidSongs(initialSongs);
      
      if (validSongs.length < 5) {
        throw new Error(`Not enough valid songs (${validSongs.length}/5 minimum)`);
      }

      const songsWithPreviews = defaultPlaylistService.filterSongsWithPreviews(validSongs);
      
      console.log(`✅ QUICK START: Loaded ${initialSongs.length} songs instead of ${allSongs.length} (${songsWithPreviews.length} with previews)`);
      
      if (songsWithPreviews.length < 3) {
        throw new Error(`Not enough songs with valid audio previews (${songsWithPreviews.length}/3 minimum)`);
      }

      setGameState(prev => ({
        ...prev,
        phase: 'ready',
        availableSongs: validSongs,
        usedSongs: [],
        currentTurnIndex: 0,
        timeLeft: 30,
        playlistInitialized: true
      }));

      console.log(`🎯 Game initialized with optimized ${validSongs.length} songs`);

      // OPTIMIZATION: Background load remaining songs
      if (shuffledSongs.length > INITIAL_LOAD_COUNT) {
        console.log('🔄 Starting background loading of remaining songs...');
        backgroundLoadRemainingSongs(shuffledSongs, INITIAL_LOAD_COUNT);
      }

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

  // OPTIMIZATION: Background loading function
  const backgroundLoadRemainingSongs = useCallback(async (allSongs: Song[], startIndex: number) => {
    try {
      const remainingSongs = allSongs.slice(startIndex);
      console.log(`🔄 Background loading ${remainingSongs.length} additional songs...`);
      
      // Process in batches to avoid blocking
      const BATCH_SIZE = 5;
      const processedSongs: Song[] = [];
      
      for (let i = 0; i < remainingSongs.length; i += BATCH_SIZE) {
        const batch = remainingSongs.slice(i, i + BATCH_SIZE);
        const validBatch = defaultPlaylistService.filterValidSongs(batch);
        processedSongs.push(...validBatch);
        
        // Small delay to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Update available songs with background loaded songs
      setGameState(prev => ({
        ...prev,
        availableSongs: [...prev.availableSongs, ...processedSongs],
        backgroundLoadingComplete: true
      }));
      
      console.log(`✅ Background loading completed: ${processedSongs.length} additional songs loaded`);
      
      toast({
        title: "More Songs Loaded!",
        description: `${processedSongs.length} additional songs now available`,
      });
      
    } catch (error) {
      console.warn('⚠️ Background loading failed:', error);
      setGameState(prev => ({ ...prev, backgroundLoadingComplete: true }));
    }
  }, [toast]);

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
      const currentPlayer = activePlayers[currentIndex];
      
      return currentPlayer || null;
    },
    initializeGame,
    startNewTurn: () => {
      console.log('🎯 Turn management handled by GameService');
    }
  };
}, []);

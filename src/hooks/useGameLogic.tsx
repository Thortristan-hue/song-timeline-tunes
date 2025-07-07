
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

// CRITICAL PERFORMANCE FIX: Only load 10 songs max for instant game start
const MAX_SONGS_PER_SESSION = 10;

export function useGameLogic(
  roomId: string | null, 
  allPlayers: Player[],
  roomData: any = null,
  onSetCurrentSong?: (Song: Song) => Promise<void>
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

  // CRITICAL PERFORMANCE FIX: Ultra-efficient initialization - max 10 songs only
  const initializeGame = useCallback(async () => {
    if (gameState.playlistInitialized) {
      console.log('🎵 Playlist already initialized, skipping...');
      setGameState(prev => ({ ...prev, phase: 'ready' }));
      return;
    }

    try {
      setGameState(prev => ({ ...prev, phase: 'loading', loadingError: null }));
      
      console.log(`🚀 PERFORMANCE FIX: Loading ONLY ${MAX_SONGS_PER_SESSION} songs to prevent API spam`);
      const allSongs = await defaultPlaylistService.loadDefaultPlaylist();
      
      if (allSongs.length === 0) {
        throw new Error('No songs available in playlist');
      }

      // CRITICAL FIX: Only take max 10 songs to prevent API spam
      const shuffledSongs = [...allSongs].sort(() => Math.random() - 0.5);
      const limitedSongs = shuffledSongs.slice(0, MAX_SONGS_PER_SESSION);
      
      console.log(`📊 API PERFORMANCE: Reduced from ${allSongs.length} to ${limitedSongs.length} songs to prevent proxy spam`);
      
      const validSongs = defaultPlaylistService.filterValidSongs(limitedSongs);
      
      if (validSongs.length < 5) {
        throw new Error(`Not enough valid songs (${validSongs.length}/5 minimum)`);
      }

      const songsWithPreviews = defaultPlaylistService.filterSongsWithPreviews(validSongs);
      
      console.log(`⚡ PERFORMANCE COMPLETE: ${songsWithPreviews.length} songs ready (prevented ${allSongs.length - limitedSongs.length} unnecessary API calls)`);
      
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

      console.log(`🎯 OPTIMIZED GAME START: Ready with ${validSongs.length} songs (API calls reduced by ${((allSongs.length - limitedSongs.length) / allSongs.length * 100).toFixed(1)}%)`);

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
}

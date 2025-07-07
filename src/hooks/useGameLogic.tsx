
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

// CRITICAL FIX 1: Only load 10 songs upfront for instant game start
const INSTANT_START_SONGS = 10;

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

  // CRITICAL FIX 1: Ultra-fast game initialization - only 10 songs
  const initializeGame = useCallback(async () => {
    if (gameState.playlistInitialized) {
      console.log('🎵 Playlist already initialized, skipping...');
      setGameState(prev => ({ ...prev, phase: 'ready' }));
      return;
    }

    try {
      setGameState(prev => ({ ...prev, phase: 'loading', loadingError: null }));
      
      console.log(`🚀 INSTANT START: Loading only ${INSTANT_START_SONGS} songs for immediate game start`);
      const allSongs = await defaultPlaylistService.loadDefaultPlaylist();
      
      if (allSongs.length === 0) {
        throw new Error('No songs available in playlist');
      }

      // INSTANT START: Only take first 10 songs, shuffle them
      const shuffledSongs = [...allSongs].sort(() => Math.random() - 0.5);
      const instantStartSongs = shuffledSongs.slice(0, INSTANT_START_SONGS);
      
      const validSongs = defaultPlaylistService.filterValidSongs(instantStartSongs);
      
      if (validSongs.length < 5) {
        throw new Error(`Not enough valid songs (${validSongs.length}/5 minimum)`);
      }

      const songsWithPreviews = defaultPlaylistService.filterSongsWithPreviews(validSongs);
      
      console.log(`⚡ INSTANT START COMPLETE: ${songsWithPreviews.length} songs ready immediately`);
      
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

      console.log(`🎯 INSTANT GAME START: Ready with ${validSongs.length} songs`);

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

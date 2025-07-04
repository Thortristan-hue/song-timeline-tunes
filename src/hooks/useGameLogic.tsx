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
  isPlaying: boolean;
  winner: Player | null;
  loadingError: string | null;
  timeLeft: number;
  transitioningTurn: boolean;
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
    isPlaying: false,
    winner: null,
    loadingError: null,
    timeLeft: 30,
    transitioningTurn: false
  });

  // CRITICAL: Filter and sync ONLY non-host players
  useEffect(() => {
    if (allPlayers.length > 0) {
      // NEVER include host players - they should already be filtered out, but double-check
      const activePlayers = allPlayers.filter(p => {
        // Extra safety: exclude any potential host players
        const isHostLike = p.id.includes('host-') || 
                          (roomData?.host_id && p.id === roomData.host_id);
        return !isHostLike;
      });
      
      console.log('🎯 Game Logic - Active Players (NO HOST):', {
        allPlayersCount: allPlayers.length,
        activePlayersCount: activePlayers.length,
        activePlayerNames: activePlayers.map(p => p.name),
        hostId: roomData?.host_id
      });
      
      setGameState(prev => ({
        ...prev,
        players: activePlayers
      }));
      
      // Check for winner among active players only
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

  // Sync current song and turn from room data
  useEffect(() => {
    if (roomData) {
      setGameState(prev => ({
        ...prev,
        currentSong: roomData.current_song || prev.currentSong,
        // CRITICAL: Ensure turn index is always within bounds of active (non-host) players
        currentTurnIndex: Math.min(roomData.current_turn || 0, Math.max(0, prev.players.length - 1))
      }));
    }
  }, [roomData?.current_song, roomData?.current_turn]);

  // Initialize game with default playlist - but don't fetch previews yet
  const initializeGame = useCallback(async () => {
    try {
      setGameState(prev => ({ ...prev, phase: 'loading', loadingError: null }));
      
      console.log('🎵 Loading default playlist...');
      const songs = await defaultPlaylistService.loadDefaultPlaylist();
      const validSongs = defaultPlaylistService.filterValidSongs(songs);
      
      if (validSongs.length < 10) {
        throw new Error(`Not enough valid songs (${validSongs.length}/10 minimum)`);
      }

      console.log(`✅ Loaded ${validSongs.length} valid songs (previews will be fetched per turn)`);
      
      setGameState(prev => ({
        ...prev,
        phase: 'ready',
        availableSongs: validSongs,
        currentTurnIndex: 0,
        timeLeft: 30
      }));

      // Start first turn if game is already in playing phase
      if (roomData?.phase === 'playing' && validSongs.length > 0) {
        console.log('🎯 Room is in playing phase, starting new turn...');
        await startNewTurnWithSongs(validSongs);
      }

    } catch (error) {
      console.error('❌ Game initialization failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to initialize game';
      setGameState(prev => ({ ...prev, loadingError: errorMsg }));
      
      toast({
        title: "Game Setup Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  }, [toast, roomData?.phase]);

  // Helper function to start new turn with specific songs
  const startNewTurnWithSongs = useCallback(async (songsToUse: Song[]) => {
    if (songsToUse.length === 0) {
      console.error('No available songs for new turn');
      return;
    }

    try {
      // Set transitioning state
      setGameState(prev => ({ ...prev, transitioningTurn: true }));

      // Pick a random song from available songs and fetch its preview fresh
      let attempts = 0;
      let selectedSong: Song | null = null;

      while (attempts < 5 && !selectedSong) {
        const randomIndex = Math.floor(Math.random() * songsToUse.length);
        const candidateSong = songsToUse[randomIndex];
        console.log(`🎵 Attempting to fetch fresh preview for: ${candidateSong.deezer_title}`);
        selectedSong = await fetchSongPreview(candidateSong);
        attempts++;
      }

      if (!selectedSong) {
        throw new Error('Could not find a song with preview after 5 attempts');
      }

      console.log(`🎯 New turn started with song: ${selectedSong.deezer_title}`);
      console.log(`🎵 Fresh preview URL: ${selectedSong.preview_url}`);

      // Update local state
      setGameState(prev => ({
        ...prev,
        currentSong: selectedSong,
        isPlaying: false,
        phase: 'playing',
        timeLeft: 30,
        transitioningTurn: false
      }));

      // Sync to database if we have the callback
      if (onSetCurrentSong) {
        await onSetCurrentSong(selectedSong);
      }

    } catch (error) {
      console.error('Failed to start new turn:', error);
      setGameState(prev => ({ ...prev, transitioningTurn: false }));
      toast({
        title: "Turn Start Failed",
        description: "Could not load song for this turn",
        variant: "destructive",
      });
    }
  }, [onSetCurrentSong, toast]);

  // Start a new turn
  const startNewTurn = useCallback(async (availableSongs?: Song[]) => {
    const songsToUse = availableSongs || gameState.availableSongs;
    await startNewTurnWithSongs(songsToUse);
  }, [gameState.availableSongs, startNewTurnWithSongs]);

  // Fetch song preview with fallback - always fetch fresh
  const fetchSongPreview = async (song: Song): Promise<Song | null> => {
    try {
      console.log(`🔍 Fetching fresh preview URL for: ${song.deezer_title}`);
      const songWithPreview = await defaultPlaylistService.fetchPreviewUrl(song);
      if (songWithPreview.preview_url) {
        console.log(`✅ Found fresh preview URL: ${songWithPreview.preview_url}`);
        return songWithPreview;
      } else {
        console.warn(`❌ No preview URL found for: ${song.deezer_title}`);
        return null;
      }
    } catch (error) {
      console.warn(`Failed to fetch preview for ${song.deezer_title}:`, error);
      return null;
    }
  };

  // Start new turn when room transitions to playing and we have no current song
  useEffect(() => {
    if (roomData?.phase === 'playing' && 
        !gameState.currentSong && 
        gameState.availableSongs.length > 0 && 
        gameState.phase === 'ready') {
      console.log('🎯 Room phase is playing but no current song - starting turn...');
      startNewTurn();
    }
  }, [roomData?.phase, gameState.currentSong, gameState.availableSongs.length, gameState.phase, startNewTurn]);

  return {
    gameState,
    setIsPlaying: (playing: boolean) => {
      console.log(`🎵 Setting isPlaying to: ${playing}`);
      setGameState(prev => ({ ...prev, isPlaying: playing }));
    },
    getCurrentPlayer: () => {
      // CRITICAL: Only return from active (non-host) players
      const activePlayers = gameState.players;
      if (activePlayers.length === 0) {
        console.log('🎯 No active players available');
        return null;
      }
      
      const currentIndex = Math.min(gameState.currentTurnIndex, activePlayers.length - 1);
      const currentPlayer = activePlayers[currentIndex];
      
      console.log('🎯 Getting current player:', {
        currentIndex,
        currentPlayer: currentPlayer?.name,
        totalActivePlayers: activePlayers.length,
        allActivePlayerNames: activePlayers.map(p => p.name)
      });
      
      return currentPlayer || null;
    },
    initializeGame,
    startNewTurn: () => startNewTurn()
  };
}

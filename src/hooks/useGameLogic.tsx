
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
  onSetCurrentSong?: (song: Song) => Promise<void>,
  onAssignStartingCards?: (songs: Song[]) => Promise<void>
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

  // Sync players from room data
  useEffect(() => {
    if (allPlayers.length > 0) {
      setGameState(prev => ({
        ...prev,
        players: allPlayers
      }));
      
      // Check for winner
      const winner = allPlayers.find(player => player.score >= 10);
      if (winner && !gameState.winner) {
        setGameState(prev => ({
          ...prev,
          winner,
          phase: 'finished'
        }));
      }
    }
  }, [allPlayers, gameState.winner]);

  // Sync current song and turn from room data
  useEffect(() => {
    if (roomData) {
      setGameState(prev => ({
        ...prev,
        currentSong: roomData.current_song || prev.currentSong,
        currentTurnIndex: roomData.current_turn || 0
      }));
    }
  }, [roomData?.current_song, roomData?.current_turn]);

  // Check if game has started and assign starting cards
  useEffect(() => {
    if (roomData?.phase === 'playing' && gameState.availableSongs.length > 0 && onAssignStartingCards) {
      const playersNeedStartingCards = allPlayers.some(player => 
        player.timeline.length === 0 && player.id !== roomData.host_id
      );
      
      if (playersNeedStartingCards) {
        console.log('🎯 Assigning starting cards to players...');
        onAssignStartingCards(gameState.availableSongs);
      }
    }
  }, [roomData?.phase, gameState.availableSongs, allPlayers, onAssignStartingCards, roomData?.host_id]);

  // Initialize game with default playlist
  const initializeGame = useCallback(async () => {
    try {
      setGameState(prev => ({ ...prev, phase: 'loading', loadingError: null }));
      
      console.log('🎵 Loading default playlist...');
      const songs = await defaultPlaylistService.loadDefaultPlaylist();
      const validSongs = defaultPlaylistService.filterValidSongs(songs);
      
      if (validSongs.length < 10) {
        throw new Error(`Not enough valid songs (${validSongs.length}/10 minimum)`);
      }

      console.log(`✅ Loaded ${validSongs.length} valid songs`);
      
      setGameState(prev => ({
        ...prev,
        phase: 'ready',
        availableSongs: validSongs,
        currentTurnIndex: 0,
        timeLeft: 30
      }));

      // Start first turn if game is already in playing phase
      if (roomData?.phase === 'playing' && validSongs.length > 0) {
        await startNewTurn(validSongs);
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

  // Start a new turn
  const startNewTurn = useCallback(async (availableSongs?: Song[]) => {
    const songsToUse = availableSongs || gameState.availableSongs;
    
    if (songsToUse.length === 0) {
      console.error('No available songs for new turn');
      return;
    }

    try {
      // Set transitioning state
      setGameState(prev => ({ ...prev, transitioningTurn: true }));

      // Pick a random song from available songs
      let attempts = 0;
      let selectedSong: Song | null = null;

      while (attempts < 5 && !selectedSong) {
        const randomIndex = Math.floor(Math.random() * songsToUse.length);
        const candidateSong = songsToUse[randomIndex];
        selectedSong = await fetchSongPreview(candidateSong);
        attempts++;
      }

      if (!selectedSong) {
        throw new Error('Could not find a song with preview after 5 attempts');
      }

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

      console.log(`🎯 New turn started with song: ${selectedSong.deezer_title}`);

    } catch (error) {
      console.error('Failed to start new turn:', error);
      setGameState(prev => ({ ...prev, transitioningTurn: false }));
      toast({
        title: "Turn Start Failed",
        description: "Could not load song for this turn",
        variant: "destructive",
      });
    }
  }, [gameState.availableSongs, onSetCurrentSong, toast]);

  // Fetch song preview with fallback
  const fetchSongPreview = async (song: Song): Promise<Song | null> => {
    try {
      if (song.preview_url) return song;
      
      const songWithPreview = await defaultPlaylistService.fetchPreviewUrl(song);
      return songWithPreview.preview_url ? songWithPreview : null;
    } catch (error) {
      console.warn(`Failed to fetch preview for ${song.deezer_title}:`, error);
      return null;
    }
  };

  // Check if we need a new turn when current song is null
  useEffect(() => {
    if (gameState.phase === 'playing' && !gameState.currentSong && gameState.availableSongs.length > 0) {
      startNewTurn();
    }
  }, [gameState.phase, gameState.currentSong, gameState.availableSongs.length, startNewTurn]);

  return {
    gameState,
    setIsPlaying: (playing: boolean) => setGameState(prev => ({ ...prev, isPlaying: playing })),
    getCurrentPlayer: () => {
      const activePlayers = gameState.players.filter(p => p.id !== roomData?.host_id);
      return activePlayers[gameState.currentTurnIndex] || null;
    },
    initializeGame,
    startNewTurn: () => startNewTurn()
  };
}

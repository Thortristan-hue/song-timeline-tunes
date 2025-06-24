
import { useState, useEffect, useCallback } from 'react';
import { Song, Player } from '@/types/game';
import { defaultPlaylistService } from '@/services/defaultPlaylistService';
import { CorsProxyService } from '@/services/corsProxyService';
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
}

export function useGameLogic(roomId: string | null, allPlayers: Player[]) {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameLogicState>({
    phase: 'loading',
    players: [],
    currentTurnIndex: 0,
    currentSong: null,
    availableSongs: [],
    isPlaying: false,
    winner: null,
    loadingError: null
  });

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
      
      // Give each player a random starting card
      const playersWithStartingCards = await Promise.all(
        allPlayers.map(async (player) => {
          const randomSong = validSongs[Math.floor(Math.random() * validSongs.length)];
          const songWithPreview = await fetchSongPreview(randomSong);
          
          return {
            ...player,
            timeline: songWithPreview ? [songWithPreview] : [],
            score: songWithPreview ? 1 : 0
          };
        })
      );

      setGameState(prev => ({
        ...prev,
        phase: 'ready',
        players: playersWithStartingCards,
        availableSongs: validSongs,
        currentTurnIndex: 0
      }));

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
  }, [allPlayers, toast]);

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

  // Start a new turn
  const startNewTurn = useCallback(async () => {
    if (gameState.availableSongs.length === 0) {
      console.error('No available songs for new turn');
      return;
    }

    try {
      // Pick a random song from available songs
      let attempts = 0;
      let selectedSong: Song | null = null;

      while (attempts < 5 && !selectedSong) {
        const randomIndex = Math.floor(Math.random() * gameState.availableSongs.length);
        const candidateSong = gameState.availableSongs[randomIndex];
        selectedSong = await fetchSongPreview(candidateSong);
        attempts++;
      }

      if (!selectedSong) {
        throw new Error('Could not find a song with preview after 5 attempts');
      }

      setGameState(prev => ({
        ...prev,
        currentSong: selectedSong,
        isPlaying: false
      }));

      console.log(`🎯 New turn started for ${gameState.players[gameState.currentTurnIndex]?.name} with song: ${selectedSong.deezer_title}`);

    } catch (error) {
      console.error('Failed to start new turn:', error);
      toast({
        title: "Turn Start Failed",
        description: "Could not load song for this turn",
        variant: "destructive",
      });
    }
  }, [gameState.availableSongs, gameState.currentTurnIndex, gameState.players, toast]);

  // Place card on timeline
  const placeCard = useCallback((playerId: string, song: Song, position: number): { success: boolean } => {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return { success: false };

    // Check if placement is chronologically correct
    const newTimeline = [...player.timeline];
    newTimeline.splice(position, 0, song);

    let isCorrect = true;
    for (let i = 0; i < newTimeline.length - 1; i++) {
      const currentYear = parseInt(newTimeline[i].release_year);
      const nextYear = parseInt(newTimeline[i + 1].release_year);
      if (currentYear > nextYear) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      // Update player's timeline
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => 
          p.id === playerId 
            ? { ...p, timeline: newTimeline, score: newTimeline.length }
            : p
        )
      }));

      // Check for winner
      if (newTimeline.length >= 10) {
        setGameState(prev => ({
          ...prev,
          phase: 'finished',
          winner: player
        }));
        return { success: true };
      }
    }

    // Move to next turn
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        currentTurnIndex: (prev.currentTurnIndex + 1) % prev.players.length
      }));
    }, 2000);

    return { success: isCorrect };
  }, [gameState.players]);

  // Initialize when players change
  useEffect(() => {
    if (allPlayers.length >= 2 && gameState.phase === 'loading') {
      initializeGame();
    }
  }, [allPlayers, gameState.phase, initializeGame]);

  // Start new turn when turn index changes
  useEffect(() => {
    if (gameState.phase === 'ready' || (gameState.phase === 'playing' && !gameState.currentSong)) {
      setGameState(prev => ({ ...prev, phase: 'playing' }));
      startNewTurn();
    }
  }, [gameState.currentTurnIndex, gameState.phase, startNewTurn]);

  return {
    gameState,
    placeCard,
    setIsPlaying: (playing: boolean) => setGameState(prev => ({ ...prev, isPlaying: playing })),
    getCurrentPlayer: () => gameState.players[gameState.currentTurnIndex] || null,
    initializeGame
  };
}

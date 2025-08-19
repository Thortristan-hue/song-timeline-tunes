import { useState, useEffect, useCallback } from 'react';
import { Song, Player, GameRoom } from '@/types/game';
import { defaultPlaylistService } from '@/services/defaultPlaylistService';
import { useToast } from '@/components/ui/use-toast';
import { GameService } from '@/services/gameService';

interface FiendGameLogicState {
  phase: 'loading' | 'ready' | 'playing' | 'finished';
  players: Player[];
  currentSong: Song | null;
  availableSongs: Song[];
  currentRound: number;
  totalRounds: number;
  isPlaying: boolean;
  winner: Player | null;
  loadingError: string | null;
  timeLeft: number;
  playlistInitialized: boolean;
  playerGuesses: Record<string, { year: number; accuracy: number; points: number }>;
  roundComplete: boolean;
}

const MAX_SONGS_PER_SESSION = 20;

export function useFiendGameLogic(
  roomId: string | null, 
  allPlayers: Player[],
  roomData: GameRoom | null = null,
  onSetCurrentSong?: (song: Song) => Promise<void>
) {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<FiendGameLogicState>({
    phase: 'loading',
    players: [],
    currentSong: null,
    availableSongs: [],
    currentRound: 1,
    totalRounds: roomData?.gamemode_settings?.rounds || 5,
    isPlaying: false,
    winner: null,
    loadingError: null,
    timeLeft: 30,
    playlistInitialized: false,
    playerGuesses: {},
    roundComplete: false
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
    }
  }, [allPlayers, roomData?.host_id]);

  // Phase synchronization from room data
  useEffect(() => {
    if (roomData) {
      setGameState(prev => ({
        ...prev,
        currentSong: roomData.current_song || prev.currentSong,
        phase: roomData.phase === 'playing' ? 'playing' : prev.phase,
        totalRounds: roomData.gamemode_settings?.rounds || 5
      }));
    }
  }, [roomData?.current_song, roomData?.phase, roomData?.gamemode_settings?.rounds]);

  // Initialize game with optimized song loading
  const initializeGame = useCallback(async () => {
    if (gameState.playlistInitialized) {
      console.log('🎵 Fiend Mode: Playlist already initialized');
      setGameState(prev => ({ ...prev, phase: 'ready' }));
      return;
    }

    try {
      setGameState(prev => ({ ...prev, phase: 'loading', loadingError: null }));
      
      console.log(`🎯 Fiend Mode: Loading ${MAX_SONGS_PER_SESSION} songs`);
      const optimizedSongs = await defaultPlaylistService.loadOptimizedGameSongs(MAX_SONGS_PER_SESSION);
      
      if (optimizedSongs.length === 0) {
        throw new Error('No songs with valid previews available');
      }

      if (optimizedSongs.length < gameState.totalRounds) {
        throw new Error(`Not enough songs for ${gameState.totalRounds} rounds`);
      }

      console.log(`🎯 Fiend Mode: Ready with ${optimizedSongs.length} songs for ${gameState.totalRounds} rounds`);

      setGameState(prev => ({
        ...prev,
        phase: 'ready',
        availableSongs: optimizedSongs,
        currentRound: 1,
        timeLeft: 30,
        playlistInitialized: true
      }));

    } catch (error) {
      console.error('❌ Fiend Mode initialization failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to initialize fiend mode';
      setGameState(prev => ({ ...prev, loadingError: errorMsg, playlistInitialized: false }));
      
      toast({
        title: "Fiend Mode Setup Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  }, [toast, gameState.playlistInitialized, gameState.totalRounds]);

  // Submit year guess
  const submitGuess = useCallback(async (year: number, playerId: string): Promise<{ success: boolean; accuracy?: number; points?: number }> => {
    if (!roomId || !gameState.currentSong || gameState.phase !== 'playing') {
      return { success: false };
    }

    try {
      const actualYear = parseInt(gameState.currentSong.release_year);
      const yearDifference = Math.abs(year - actualYear);
      
      // Calculate accuracy percentage (100% for exact, decreasing by 2% per year off)
      const accuracy = Math.max(0, 100 - (yearDifference * 2));
      
      // Calculate points based on accuracy (max 100 points)
      const points = Math.round(accuracy);
      
      // Update player score
      const player = gameState.players.find(p => p.id === playerId);
      if (player) {
        const newScore = player.score + points;
        await GameService.updatePlayerTimeline(playerId, player.timeline);
      }
      
      // Store the guess result
      setGameState(prev => ({
        ...prev,
        playerGuesses: {
          ...prev.playerGuesses,
          [playerId]: { year, accuracy, points }
        }
      }));
      
      return { success: true, accuracy, points };
    } catch (error) {
      console.error('Failed to submit Fiend Mode guess:', error);
      return { success: false };
    }
  }, [roomId, gameState.currentSong, gameState.phase, gameState.players]);

  // Check if all players have submitted guesses
  const allPlayersSubmitted = useCallback(() => {
    return gameState.players.every(p => gameState.playerGuesses[p.id]);
  }, [gameState.players, gameState.playerGuesses]);

  // Advance to next round
  const nextRound = useCallback(async () => {
    if (!roomId || gameState.currentRound >= gameState.totalRounds) {
      return;
    }

    try {
      const nextRoundNumber = gameState.currentRound + 1;
      
      if (nextRoundNumber > gameState.totalRounds) {
        // Game finished - determine winner by highest score
        const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
        const winner = sortedPlayers[0];
        
        setGameState(prev => ({
          ...prev,
          phase: 'finished',
          winner
        }));
        
        await GameService.endGame(roomId, winner.id);
        return;
      }

      // Get next song with validation
      let nextSong = gameState.availableSongs[nextRoundNumber - 1];
      
      // Validate next song exists and has required properties
      if (!nextSong || !nextSong.deezer_title) {
        console.warn('⚠️ No valid song available for round', nextRoundNumber, ', skipping to next available song or ending game');
        
        // Try to find next valid song
        let validSong: Song | null = null;
        for (let i = nextRoundNumber - 1; i < gameState.availableSongs.length; i++) {
          const candidate = gameState.availableSongs[i];
          if (candidate && candidate.deezer_title) {
            validSong = candidate;
            break;
          }
        }
        
        if (!validSong) {
          console.warn('⚠️ No more valid songs available, ending game early');
          const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
          const winner = sortedPlayers[0];
          
          setGameState(prev => ({
            ...prev,
            phase: 'finished',
            winner
          }));
          
          if (winner) {
            await GameService.endGame(roomId, winner.id);
          }
          return;
        }
        
        // Use the valid song we found
        nextSong = validSong;
      }
      
      // Update game state
      setGameState(prev => ({
        ...prev,
        currentRound: nextRoundNumber,
        currentSong: nextSong,
        playerGuesses: {},
        roundComplete: false,
        timeLeft: 30
      }));

      // Update room data - only call if we have a valid song and callback
      if (onSetCurrentSong && nextSong) {
        await onSetCurrentSong(nextSong);
      }

    } catch (error) {
      console.error('Failed to advance to next round:', error);
      // Continue gracefully - don't let round advancement errors break the game
    }
  }, [roomId, gameState.currentRound, gameState.totalRounds, gameState.availableSongs, gameState.players, onSetCurrentSong]);

  // Check if round is complete
  useEffect(() => {
    if (allPlayersSubmitted() && !gameState.roundComplete) {
      setGameState(prev => ({ ...prev, roundComplete: true }));
      
      // Auto-advance to next round after 5 seconds
      setTimeout(() => {
        nextRound();
      }, 5000);
    }
  }, [allPlayersSubmitted, gameState.roundComplete, nextRound]);

  return {
    gameState,
    setIsPlaying: (playing: boolean) => {
      setGameState(prev => ({ ...prev, isPlaying: playing }));
    },
    initializeGame,
    submitGuess,
    nextRound,
    allPlayersSubmitted
  };
}
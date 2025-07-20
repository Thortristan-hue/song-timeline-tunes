import { useState, useEffect, useCallback } from 'react';
import { Song, Player, GameRoom } from '@/types/game';
import defaultPlaylistServiceInstance from '@/services/defaultPlaylistService';
import { useToast } from '@/components/ui/use-toast';
import { GameService } from '@/services/gameService';

interface SprintGameLogicState {
  phase: 'loading' | 'ready' | 'playing' | 'finished';
  players: Player[];
  currentSong: Song | null;
  availableSongs: Song[];
  targetCards: number;
  isPlaying: boolean;
  winner: Player | null;
  loadingError: string | null;
  timeLeft: number;
  playlistInitialized: boolean;
  playerTimeouts: Record<string, number>;
  recentPlacements: Record<string, { correct: boolean; song: Song; timestamp: number }>;
}

const MAX_SONGS_PER_SESSION = 20;
const TIMEOUT_DURATION = 5; // seconds

export function useSprintGameLogic(
  roomId: string | null, 
  allPlayers: Player[],
  roomData: GameRoom | null = null,
  onSetCurrentSong?: (song: Song) => Promise<void>
) {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<SprintGameLogicState>({
    phase: 'loading',
    players: [],
    currentSong: null,
    availableSongs: [],
    targetCards: roomData?.gamemode_settings?.targetCards || 8,
    isPlaying: false,
    winner: null,
    loadingError: null,
    timeLeft: 30,
    playlistInitialized: false,
    playerTimeouts: {},
    recentPlacements: {}
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
      
      // Check for winner (first player to reach target cards)
      const winner = activePlayers.find(player => player.timeline.length >= gameState.targetCards);
      if (winner && !gameState.winner) {
        setGameState(prev => ({
          ...prev,
          winner,
          phase: 'finished'
        }));
      }
    }
  }, [allPlayers, roomData?.host_id, gameState.targetCards, gameState.winner]);

  // Phase synchronization from room data
  useEffect(() => {
    if (roomData) {
      setGameState(prev => ({
        ...prev,
        currentSong: roomData.current_song || prev.currentSong,
        phase: roomData.phase === 'playing' ? 'playing' : prev.phase,
        targetCards: roomData.gamemode_settings?.targetCards || 8
      }));
    }
  }, [roomData?.current_song, roomData?.phase, roomData?.gamemode_settings?.targetCards]);

  // Initialize game with optimized song loading and starting cards
  const initializeGame = useCallback(async () => {
    if (gameState.playlistInitialized) {
      console.log('🎵 Sprint Mode: Playlist already initialized');
      setGameState(prev => ({ ...prev, phase: 'ready' }));
      return;
    }

    try {
      setGameState(prev => ({ ...prev, phase: 'loading', loadingError: null }));
      
      console.log(`🎯 Sprint Mode: Loading ${MAX_SONGS_PER_SESSION} songs`);
      const optimizedSongs = await defaultPlaylistServiceInstance.loadOptimizedGameSongs(MAX_SONGS_PER_SESSION);
      
      if (optimizedSongs.length === 0) {
        throw new Error('No songs with valid previews available');
      }

      if (optimizedSongs.length < gameState.targetCards + 5) {
        throw new Error(`Not enough songs for Sprint Mode (need ${gameState.targetCards + 5} minimum)`);
      }

      console.log(`🎯 Sprint Mode: Ready with ${optimizedSongs.length} songs for ${gameState.targetCards} card race`);

      setGameState(prev => ({
        ...prev,
        phase: 'ready',
        availableSongs: optimizedSongs,
        timeLeft: 30,
        playlistInitialized: true
      }));

    } catch (error) {
      console.error('❌ Sprint Mode initialization failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to initialize sprint mode';
      setGameState(prev => ({ ...prev, loadingError: errorMsg, playlistInitialized: false }));
      
      toast({
        title: "Sprint Mode Setup Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  }, [toast, gameState.playlistInitialized, gameState.targetCards]);

  // Place card in timeline (real-time, all players can play simultaneously)
  const placeCard = useCallback(async (song: Song, position: number, playerId: string): Promise<{ success: boolean; correct?: boolean }> => {
    if (!roomId || gameState.phase !== 'playing') {
      return { success: false };
    }

    // Check if player is in timeout
    if (gameState.playerTimeouts[playerId] > 0) {
      return { success: false };
    }

    try {
      const player = gameState.players.find(p => p.id === playerId);
      if (!player) {
        return { success: false };
      }

      // Check if placement is correct
      const playerTimeline = player.timeline
        .filter(s => s !== null)
        .sort((a, b) => parseInt(a.release_year) - parseInt(b.release_year));
      
      const songYear = parseInt(song.release_year);
      const beforeSong = position > 0 ? playerTimeline[position - 1] : null;
      const afterSong = position < playerTimeline.length ? playerTimeline[position] : null;
      
      const beforeYear = beforeSong ? parseInt(beforeSong.release_year) : 0;
      const afterYear = afterSong ? parseInt(afterSong.release_year) : 9999;
      
      const isCorrect = songYear >= beforeYear && songYear <= afterYear;
      
      if (isCorrect) {
        // Add card to timeline
        const newTimeline = [...playerTimeline];
        newTimeline.splice(position, 0, song);
        
        await GameService.updatePlayerTimeline(playerId, newTimeline, player.score + 1);
        
        // Track placement result
        setGameState(prev => ({
          ...prev,
          recentPlacements: {
            ...prev.recentPlacements,
            [playerId]: { correct: true, song, timestamp: Date.now() }
          }
        }));
        
        // Check if player won
        if (newTimeline.length >= gameState.targetCards) {
          setGameState(prev => ({
            ...prev,
            winner: { ...player, timeline: newTimeline, score: player.score + 1 },
            phase: 'finished'
          }));
          
          await GameService.endGame(roomId, playerId);
        }
        
        return { success: true, correct: true };
      } else {
        // Start timeout
        setGameState(prev => ({
          ...prev,
          playerTimeouts: {
            ...prev.playerTimeouts,
            [playerId]: TIMEOUT_DURATION
          },
          recentPlacements: {
            ...prev.recentPlacements,
            [playerId]: { correct: false, song, timestamp: Date.now() }
          }
        }));
        
        // Countdown timeout
        let timeRemaining = TIMEOUT_DURATION;
        const timeoutInterval = setInterval(() => {
          timeRemaining--;
          setGameState(prev => ({
            ...prev,
            playerTimeouts: {
              ...prev.playerTimeouts,
              [playerId]: timeRemaining
            }
          }));
          
          if (timeRemaining <= 0) {
            clearInterval(timeoutInterval);
            setGameState(prev => {
              const newTimeouts = { ...prev.playerTimeouts };
              delete newTimeouts[playerId];
              return { ...prev, playerTimeouts: newTimeouts };
            });
          }
        }, 1000);
        
        return { success: true, correct: false };
      }
    } catch (error) {
      console.error('Failed to place card in Sprint Mode:', error);
      return { success: false };
    }
  }, [roomId, gameState.phase, gameState.players, gameState.playerTimeouts, gameState.targetCards]);

  // Get next mystery song for all players
  const getNextMysteryCard = useCallback((): Song | null => {
    const usedSongs = new Set<string>();
    
    // Add all songs from all players' timelines
    gameState.players.forEach(player => {
      player.timeline.forEach(song => {
        if (song && song.id) {
          usedSongs.add(song.id);
        }
      });
    });
    
    // Add current song
    if (gameState.currentSong) {
      usedSongs.add(gameState.currentSong.id);
    }
    
    // Find unused song
    const availableSongs = gameState.availableSongs.filter(song => !usedSongs.has(song.id));
    
    if (availableSongs.length === 0) {
      return null;
    }
    
    return availableSongs[Math.floor(Math.random() * availableSongs.length)];
  }, [gameState.players, gameState.currentSong, gameState.availableSongs]);

  return {
    gameState,
    setIsPlaying: (playing: boolean) => {
      setGameState(prev => ({ ...prev, isPlaying: playing }));
    },
    initializeGame,
    placeCard,
    getNextMysteryCard,
    setCurrentSong: (song: Song) => {
      setGameState(prev => ({ ...prev, currentSong: song }));
    }
  };
}
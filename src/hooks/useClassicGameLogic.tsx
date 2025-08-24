
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
      
      console.log('👥 CLASSIC MODE: Active players updated:', activePlayers.length, activePlayers.map(p => ({ name: p.name, timeline: p.timeline.length })));
      
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

  // Enhanced room data synchronization
  useEffect(() => {
    if (!roomData) return;

    console.log('🎯 CLASSIC MODE: Processing room update:', {
      currentSong: roomData.current_song?.deezer_title || 'none',
      songsCount: roomData.songs?.length || 0,
      phase: roomData.phase,
      gameInitialized: gameState.gameFullyInitialized
    });

    // Always sync the current song (mystery card)
    if (roomData.current_song && roomData.current_song.deezer_title) {
      console.log('🎵 CLASSIC MODE: Syncing mystery card from room:', roomData.current_song.deezer_title);
      setGameState(prev => ({
        ...prev,
        currentSong: roomData.current_song
      }));
    }

    // Initialize with room songs if available
    if (roomData.songs && roomData.songs.length > 0 && !gameState.gameFullyInitialized) {
      console.log('🎵 CLASSIC MODE: Initializing with room songs:', roomData.songs.length);
      
      setGameState(prev => ({
        ...prev,
        availableSongs: roomData.songs,
        playlistInitialized: true,
        backgroundLoadingComplete: true,
        gameFullyInitialized: true,
        phase: roomData.phase === 'playing' ? 'playing' : 'ready'
      }));
    } else if (gameState.gameFullyInitialized && roomData.phase === 'playing') {
      setGameState(prev => ({
        ...prev,
        phase: 'playing'
      }));
    }

    // Sync turn index
    if (typeof roomData.current_turn === 'number') {
      setGameState(prev => ({
        ...prev,
        currentTurnIndex: roomData.current_turn || 0
      }));
    }
  }, [roomData, gameState.gameFullyInitialized]);

  // Get next available song for mystery card
  const getNextMysteryCard = useCallback((): Song | null => {
    console.log('🎯 CLASSIC MODE: Getting next mystery card');
    
    // Get all used song IDs from all players' timelines
    const usedSongIds = new Set<string>();
    
    gameState.players.forEach(player => {
      player.timeline.forEach(song => {
        if (song && song.id) {
          usedSongIds.add(song.id);
        }
      });
    });

    // Add current song to used
    if (gameState.currentSong) {
      usedSongIds.add(gameState.currentSong.id);
    }

    // Find unused songs
    const availableSongs = gameState.availableSongs.filter(song => !usedSongIds.has(song.id));
    
    console.log(`🎯 CLASSIC MODE: ${availableSongs.length} songs available for next mystery card`);
    
    if (availableSongs.length === 0) {
      console.warn('⚠️ CLASSIC MODE: No more songs available!');
      return null;
    }

    const nextSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
    console.log('🎵 CLASSIC MODE: Selected next mystery card:', nextSong.deezer_title);
    
    return nextSong;
  }, [gameState.players, gameState.currentSong, gameState.availableSongs]);

  // Initialize game with enhanced loading states and progress tracking
  const initializeGame = useCallback(async () => {
    // If we already have songs from room data, don't fetch again
    if (roomData?.songs && roomData.songs.length > 0) {
      console.log('🎵 CLASSIC MODE: Using existing songs from room data, skipping fetch');
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
      console.log('🎵 CLASSIC MODE: Playlist already initialized, setting to ready');
      setGameState(prev => ({ ...prev, phase: 'ready' }));
      return;
    }

    try {
      setGameState(prev => ({ ...prev, phase: 'loading', loadingError: null }));
      
      console.log(`🎯 CLASSIC MODE: Loading ${MAX_SONGS_PER_SESSION} songs with enhanced progress tracking`);
      
      // Show loading immediately
      setGameState(prev => ({ ...prev, phase: 'loading' }));
      
      const optimizedSongs = await defaultPlaylistService.loadOptimizedGameSongs(MAX_SONGS_PER_SESSION);
      
      if (optimizedSongs.length === 0) {
        throw new Error('No songs with valid previews available');
      }

      if (optimizedSongs.length < 8) {
        throw new Error(`Not enough songs with valid audio previews (${optimizedSongs.length}/8 minimum)`);
      }

      console.log(`🎯 CLASSIC MODE: Ready with ${optimizedSongs.length} songs`);

      // Distribute starting cards to players (3 random songs per player)
      if (roomId && allPlayers.length > 0) {
        console.log('🃏 Distributing starting cards to players...');
        const playersWithoutHost = allPlayers.filter(p => {
          const isHostLike = p.id.includes('host-') || 
                            (roomData?.host_id && p.id === roomData.host_id);
          return !isHostLike;
        });

        for (const player of playersWithoutHost) {
          // Give each player 3 random starting cards
          const startingCards = optimizedSongs
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
          
          try {
            await GameService.updatePlayerTimeline(player.id, startingCards);
            console.log(`✅ Gave ${startingCards.length} starting cards to ${player.name}`);
          } catch (error) {
            console.error(`❌ Failed to give starting cards to ${player.name}:`, error);
          }
        }
      }

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

      console.log('✅ CLASSIC MODE: Initialization complete with starting cards distributed');

    } catch (error) {
      console.error('❌ CLASSIC MODE initialization failed:', error);
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
  }, [toast, gameState.playlistInitialized, roomData?.songs, roomId, allPlayers, roomData?.host_id]);

  // Enhanced place card function with automatic song advancement
  const placeCard = useCallback(async (song: Song, position: number, playerId: string): Promise<{ success: boolean; correct?: boolean }> => {
    if (!roomId || gameState.phase !== 'playing') {
      console.error('Cannot place card: invalid state', { roomId: !!roomId, phase: gameState.phase });
      return { success: false };
    }

    console.log('🎯 CLASSIC MODE: Placing card and advancing to next song');

    try {
      const result = await GameService.placeCardAndAdvanceTurn(
        roomId,
        playerId,
        song,
        position
      );

      if (result.success) {
        // Get next mystery card
        const nextSong = getNextMysteryCard();
        
        if (nextSong && onSetCurrentSong) {
          console.log('🎵 CLASSIC MODE: Setting next mystery card:', nextSong.deezer_title);
          await onSetCurrentSong(nextSong);
          
          // Update local state
          setGameState(prev => ({
            ...prev,
            currentSong: nextSong,
            usedSongs: [...prev.usedSongs, song]
          }));
        }

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
  }, [roomId, gameState.phase, gameState.availableSongs, getNextMysteryCard, onSetCurrentSong]);

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
    getNextMysteryCard,
    WINNING_CARDS_COUNT
  };
}

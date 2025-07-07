
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
    playlistInitialized: false
  });

  // Filter and sync ONLY non-host players
  useEffect(() => {
    if (allPlayers.length > 0) {
      const activePlayers = allPlayers.filter(p => {
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
        currentTurnIndex: Math.min(roomData.current_turn || 0, Math.max(0, prev.players.length - 1)),
        phase: roomData.phase === 'playing' ? 
          (prev.phase === 'loading' ? 'ready' : prev.phase === 'ready' ? 'playing' : prev.phase) : 
          prev.phase
      }));
      
      console.log('🎯 PHASE SYNC:', {
        roomPhase: roomData.phase,
        currentGamePhase: gameState.phase,
        playlistInitialized: gameState.playlistInitialized
      });
    }
  }, [roomData?.current_song, roomData?.current_turn, roomData?.phase]);

  // Initialize game with playlist - ONLY ONCE
  const initializeGame = useCallback(async () => {
    // Prevent multiple initializations
    if (gameState.playlistInitialized) {
      console.log('🎵 Playlist already initialized, skipping...');
      setGameState(prev => ({ ...prev, phase: 'ready' }));
      return;
    }

    try {
      setGameState(prev => ({ ...prev, phase: 'loading', loadingError: null }));
      
      console.log('🎵 Loading playlist for the first time...');
      const songs = await defaultPlaylistService.loadDefaultPlaylist();
      
      const validSongs = defaultPlaylistService.filterValidSongs(songs);
      
      if (validSongs.length < 10) {
        throw new Error(`Not enough valid songs (${validSongs.length}/10 minimum)`);
      }

      const songsWithPreviews = defaultPlaylistService.filterSongsWithPreviews(validSongs);
      
      console.log(`✅ Loaded ${validSongs.length} valid songs (${songsWithPreviews.length} with previews)`);
      
      if (songsWithPreviews.length === 0) {
        throw new Error(`No songs in the playlist have valid audio previews. Cannot start the game.`);
      }

      // Shuffle and take initial 10 songs for the game
      const shuffledSongs = [...validSongs].sort(() => Math.random() - 0.5);
      const initialSongs = shuffledSongs.slice(0, 10);
      const remainingSongs = shuffledSongs.slice(10);

      setGameState(prev => ({
        ...prev,
        phase: 'ready',
        availableSongs: initialSongs,
        usedSongs: [],
        currentTurnIndex: 0,
        timeLeft: 30,
        playlistInitialized: true
      }));

      console.log(`🎯 Game initialized with ${initialSongs.length} songs ready to play`);

      // Start first turn if game is already in playing phase
      if (roomData?.phase === 'playing' && initialSongs.length > 0) {
        console.log('🎯 Room is in playing phase, starting new turn...');
        await startNewTurnWithSongs(initialSongs);
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
  }, [toast, roomData?.phase, gameState.playlistInitialized]);

  // Get next available song (avoiding repeats)
  const getNextSong = useCallback((): Song | null => {
    const availableSongs = gameState.availableSongs.filter(song => 
      !gameState.usedSongs.some(used => used.id === song.id)
    );

    if (availableSongs.length === 0) {
      console.log('🎵 No more unused songs available');
      return null;
    }

    // Prefer songs with previews
    const songsWithPreviews = defaultPlaylistService.filterSongsWithPreviews(availableSongs);
    const songPool = songsWithPreviews.length > 0 ? songsWithPreviews : availableSongs;
    
    return songPool[Math.floor(Math.random() * songPool.length)];
  }, [gameState.availableSongs, gameState.usedSongs]);

  // Start new turn with song management
  const startNewTurnWithSongs = useCallback(async (songsToUse: Song[]) => {
    if (songsToUse.length === 0) {
      console.error('No available songs for new turn');
      return;
    }

    try {
      setGameState(prev => ({ ...prev, transitioningTurn: true }));

      const nextSong = getNextSong();
      if (!nextSong) {
        console.error('❌ No more songs available for new turn');
        setGameState(prev => ({ ...prev, transitioningTurn: false }));
        return;
      }

      console.log(`🎯 New turn started with song: ${nextSong.deezer_title}`);
      console.log(`🎵 Preview URL: ${nextSong.preview_url || 'None'}`);

      // Mark song as used
      setGameState(prev => ({
        ...prev,
        currentSong: nextSong,
        usedSongs: [...prev.usedSongs, nextSong],
        isPlaying: false,
        phase: 'playing',
        timeLeft: 30,
        transitioningTurn: false
      }));

      // Sync to database if we have the callback
      if (onSetCurrentSong) {
        await onSetCurrentSong(nextSong);
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
  }, [getNextSong, onSetCurrentSong, toast]);

  // Start a new turn
  const startNewTurn = useCallback(async () => {
    await startNewTurnWithSongs(gameState.availableSongs);
  }, [gameState.availableSongs, startNewTurnWithSongs]);

  // Start new turn when room transitions to playing and we have no current song
  useEffect(() => {
    if (roomData?.phase === 'playing' && 
        !gameState.currentSong && 
        gameState.availableSongs.length > 0 && 
        gameState.playlistInitialized &&
        (gameState.phase === 'ready' || gameState.phase === 'loading')) {
      console.log('🎯 Room phase is playing but no current song - starting turn...');
      startNewTurn();
    }
  }, [roomData?.phase, gameState.currentSong, gameState.availableSongs.length, gameState.phase, gameState.playlistInitialized, startNewTurn]);

  return {
    gameState,
    setIsPlaying: (playing: boolean) => {
      console.log(`🎵 Setting isPlaying to: ${playing}`);
      setGameState(prev => ({ ...prev, isPlaying: playing }));
    },
    getCurrentPlayer: () => {
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

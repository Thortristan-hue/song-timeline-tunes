
import { useState, useEffect, useCallback } from 'react';
import { Song, Player } from '@/types/game';
import { defaultPlaylistService } from '@/services/defaultPlaylistService';
import { useToast } from '@/components/ui/use-toast';
import { GameService } from '@/services/gameService';

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

  // CRITICAL: Force mystery card change when current player changes
  useEffect(() => {
    const forceCardChangeOnPlayerChange = async () => {
      if (!roomId || !roomData || gameState.phase !== 'playing' || !gameState.availableSongs.length) {
        return;
      }

      const currentTurnIndex = roomData.current_turn || 0;
      const previousTurnIndex = gameState.currentTurnIndex;
      
      // FORCE mystery card change when turn index changes
      if (currentTurnIndex !== previousTurnIndex && gameState.playlistInitialized) {
        console.log('🔄 PLAYER CHANGE DETECTED: Forcing mystery card change', {
          previousTurn: previousTurnIndex,
          currentTurn: currentTurnIndex,
          roomId
        });

        try {
          setGameState(prev => ({ ...prev, transitioningTurn: true }));
          
          // Force a fresh mystery card for the new player
          const newMysteryCard = await GameService.forceMysteryCardChange(
            roomId,
            gameState.availableSongs,
            currentTurnIndex
          );

          if (newMysteryCard) {
            console.log('✅ MYSTERY CARD CHANGED FOR NEW PLAYER:', {
              newPlayer: currentTurnIndex,
              newCard: newMysteryCard.deezer_title
            });

            setGameState(prev => ({
              ...prev,
              currentSong: newMysteryCard,
              currentTurnIndex: currentTurnIndex,
              transitioningTurn: false
            }));

            // Sync to callback if provided
            if (onSetCurrentSong) {
              await onSetCurrentSong(newMysteryCard);
            }
          } else {
            console.error('❌ Failed to get fresh mystery card for player change');
            setGameState(prev => ({ ...prev, transitioningTurn: false }));
          }
        } catch (error) {
          console.error('❌ Error forcing mystery card change:', error);
          setGameState(prev => ({ ...prev, transitioningTurn: false }));
        }
      } else {
        // Just update the turn index if no change needed
        setGameState(prev => ({
          ...prev,
          currentTurnIndex: currentTurnIndex
        }));
      }
    };

    forceCardChangeOnPlayerChange();
  }, [roomData?.current_turn, roomId, gameState.availableSongs, gameState.phase, gameState.playlistInitialized, onSetCurrentSong]);

  // Phase synchronization from room data
  useEffect(() => {
    if (roomData) {
      setGameState(prev => ({
        ...prev,
        currentSong: roomData.current_song || prev.currentSong,
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
  }, [roomData?.current_song, roomData?.phase]);

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

      // Shuffle and take larger pool of songs for fresh mystery card selection
      const shuffledSongs = [...validSongs].sort(() => Math.random() - 0.5);
      const gameSongs = shuffledSongs.slice(0, Math.min(100, shuffledSongs.length)); // Take up to 100 songs for maximum variety

      setGameState(prev => ({
        ...prev,
        phase: 'ready',
        availableSongs: gameSongs,
        usedSongs: [],
        currentTurnIndex: 0,
        timeLeft: 30,
        playlistInitialized: true
      }));

      console.log(`🎯 Game initialized with ${gameSongs.length} songs ready for GUARANTEED fresh mystery card selection`);

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
    startNewTurn: () => {
      console.log('🎯 Start new turn called - mystery card change handled by player change effect');
    }
  };
}

import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { shallow } from 'zustand/shallow';

import { supabase } from '@/integrations/supabase/client';
import { GameRoom, Player, Song, GameMode, GameModeSettings } from '@/types/game';
import { useGameStore } from '@/stores/gameStore';
import { useClassicGameLogic } from './useClassicGameLogic';
import { useSprintGameLogic } from './useSprintGameLogic';

interface UseGameRoomReturn {
  roomData: GameRoom | null;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;
  createRoom: (gamemode: GameMode, settings: GameModeSettings) => Promise<boolean>;
  joinRoom: (lobbyCode: string, playerName: string, character?: string) => Promise<boolean>;
  startGame: () => Promise<void>;
  placeCard: (song: Song, position: number) => Promise<{ success: boolean; correct?: boolean }>;
  leaveRoom: () => Promise<void>;
  resetRoom: () => Promise<void>;
}

export function useGameRoom(): UseGameRoomReturn {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const lobbyCode = searchParams.get('lobby');
  
  // Use a simple session ID based on timestamp and random number
  const playerSessionId = useState(() => 
    localStorage.getItem('playerSessionId') || 
    (() => {
      const id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('playerSessionId', id);
      return id;
    })()
  )[0];

  const [roomData, setRoomData] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);

  // Access game state using the store
  const {
    phase,
    setPhase,
    currentSong,
    setCurrentSong,
    isDarkMode,
    setIsDarkMode,
    isMuted,
    setIsMuted,
    cardPlacementPending,
    setCardPlacementPending,
    cardPlacementConfirmed,
    setCardPlacementConfirmed,
    cardPlacementCorrect,
    setCardPlacementCorrect,
    mysteryCardRevealed,
    setMysteryCardRevealed,
    gameEnded,
    setGameEnded,
    highlightedGapIndex,
    setHighlightedGapIndex
  } = useGameStore(
    (state) => ({
      phase: state.phase,
      setPhase: state.setPhase,
      currentSong: state.currentSong,
      setCurrentSong: state.setCurrentSong,
      isDarkMode: state.isDarkMode,
      setIsDarkMode: state.setIsDarkMode,
      isMuted: state.isMuted,
      setIsMuted: state.setIsMuted,
      cardPlacementPending: state.cardPlacementPending,
      setCardPlacementPending: state.setCardPlacementPending,
      cardPlacementConfirmed: state.cardPlacementConfirmed,
      setCardPlacementConfirmed: state.setCardPlacementConfirmed,
      cardPlacementCorrect: state.cardPlacementCorrect,
      setCardPlacementCorrect: state.setCardPlacementCorrect,
      mysteryCardRevealed: state.mysteryCardRevealed,
      setMysteryCardRevealed: state.setMysteryCardRevealed,
      gameEnded: state.gameEnded,
      setGameEnded: state.setGameEnded,
      highlightedGapIndex: state.highlightedGapIndex,
      setHighlightedGapIndex: state.setHighlightedGapIndex
    }),
    shallow
  );

  // Initialize game logic based on game mode
  const classicGameLogic = useClassicGameLogic(roomData?.id || null, players, roomData, setCurrentSong);
  const sprintGameLogic = useSprintGameLogic(roomData?.id || null, players, roomData, setCurrentSong);

  // Helper function to convert database GameRoom to application GameRoom
  const mapDbGameRoomToGameRoom = useCallback((dbRoom: any): GameRoom => ({
    id: dbRoom.id,
    lobby_code: dbRoom.lobby_code,
    host_id: dbRoom.host_id,
    host_name: dbRoom.host_name || '',
    phase: dbRoom.phase as 'lobby' | 'playing' | 'finished',
    gamemode: dbRoom.gamemode as 'classic' | 'fiend' | 'sprint',
    gamemode_settings: dbRoom.gamemode_settings || {},
    songs: Array.isArray(dbRoom.songs) ? dbRoom.songs as Song[] : [],
    created_at: dbRoom.created_at,
    updated_at: dbRoom.updated_at,
    current_turn: dbRoom.current_turn,
    current_song: dbRoom.current_song as Song | null,
    current_player_id: dbRoom.current_player_id
  }), []);

  // Helper function to convert database Player to application Player
  const mapDbPlayerToPlayer = useCallback((dbPlayer: any): Player => ({
    id: dbPlayer.id,
    name: dbPlayer.name,
    color: dbPlayer.color,
    timelineColor: dbPlayer.timeline_color,
    score: dbPlayer.score || 0,
    timeline: Array.isArray(dbPlayer.timeline) ? dbPlayer.timeline as Song[] : [],
    character: dbPlayer.character || 'char_dave'
  }), []);

  // Fetch room and players data on lobby code change
  useEffect(() => {
    const fetchRoomAndPlayers = async () => {
      if (!lobbyCode) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch room data
        const { data: room, error: roomError } = await supabase
          .from('game_rooms')
          .select('*')
          .eq('lobby_code', lobbyCode.toUpperCase())
          .single();

        if (roomError || !room) {
          throw new Error('Room not found');
        }

        const mappedRoom = mapDbGameRoomToGameRoom(room);
        setRoomData(mappedRoom);
        setPhase(mappedRoom.phase);

        // Fetch players data
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', room.id)
          .order('joined_at', { ascending: true });

        if (playersError) {
          throw new Error('Failed to fetch players');
        }

        const mappedPlayers = (playersData || []).map(mapDbPlayerToPlayer);
        setPlayers(mappedPlayers);
        setIsHost(room.host_id === playerSessionId);

      } catch (err: any) {
        setError(err.message || 'Failed to fetch room data');
        toast.error(err.message || 'Failed to fetch room data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomAndPlayers();
  }, [lobbyCode, playerSessionId, setPhase, mapDbGameRoomToGameRoom, mapDbPlayerToPlayer]);

  // Subscribe to room updates
  useEffect(() => {
    if (!roomData?.id) return;

    const roomSubscription = supabase
      .channel('room_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomData.id}` },
        (payload) => {
          if (payload.new) {
            const mappedRoom = mapDbGameRoomToGameRoom(payload.new);
            setRoomData(mappedRoom);
            setPhase(mappedRoom.phase);
            if (mappedRoom.current_song) {
              setCurrentSong(mappedRoom.current_song);
            }
          }
        })
      .subscribe();

    return () => {
      supabase.removeChannel(roomSubscription);
    };
  }, [roomData?.id, setCurrentSong, setPhase, mapDbGameRoomToGameRoom]);

  // Subscribe to player updates
  useEffect(() => {
    if (!roomData?.id) return;

    const playerSubscription = supabase
      .channel('player_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomData.id}` },
        (payload) => {
          // Fetch latest players
          supabase
            .from('players')
            .select('*')
            .eq('room_id', roomData.id)
            .order('joined_at', { ascending: true })
            .then(({ data, error }) => {
              if (error) {
                console.error('Failed to update players:', error);
              } else {
                const mappedPlayers = (data || []).map(mapDbPlayerToPlayer);
                setPlayers(mappedPlayers);
              }
            });
        })
      .subscribe();

    return () => {
      supabase.removeChannel(playerSubscription);
    };
  }, [roomData?.id, mapDbPlayerToPlayer]);

  // Get current player
  const currentPlayer = players.find(player => player.id.includes(playerSessionId)) || null;

  // Create room
  const createRoom = useCallback(async (gamemode: GameMode, settings: GameModeSettings): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: room, error: roomError } = await supabase.functions.invoke('create-game-room', {
        body: { hostSessionId: playerSessionId, gamemode, settings }
      });

      if (roomError) {
        throw new Error(roomError.message || 'Failed to create room');
      }

      if (room?.lobby_code) {
        navigate(`/?lobby=${room.lobby_code}`);
        return true;
      } else {
        throw new Error('Failed to create room: Missing lobby code');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
      toast.error(err.message || 'Failed to create room');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [playerSessionId, navigate]);

  // Join room
  const joinRoom = useCallback(async (lobbyCode: string, playerName: string, character: string = 'char_dave'): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('join-game-room', {
        body: { lobbyCode: lobbyCode.toUpperCase(), playerName, playerSessionId, character }
      });

      if (error) {
        throw new Error(error.message || 'Failed to join room');
      }

      if (data?.room?.lobby_code) {
        const mappedRoom = mapDbGameRoomToGameRoom(data.room);
        const mappedPlayers = (data.players || []).map(mapDbPlayerToPlayer);
        
        setRoomData(mappedRoom);
        setPlayers(mappedPlayers);
        setIsHost(data.room.host_id === playerSessionId);
        setPhase(mappedRoom.phase);
        return true;
      } else {
        throw new Error('Failed to join room: Missing lobby code');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
      toast.error(err.message || 'Failed to join room');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [playerSessionId, mapDbGameRoomToGameRoom, mapDbPlayerToPlayer, setPhase]);

  // Start game
  const startGame = useCallback(async () => {
    if (!roomData?.id) {
      console.error('Cannot start game: missing room data');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Initialize game based on game mode
      if (roomData.gamemode === 'classic') {
        if (classicGameLogic.gameState.availableSongs.length === 0) {
          toast.error('Please wait, the songs are still loading!');
          return;
        }
        
        // Set the first mystery card
        const firstSong = classicGameLogic.getNextMysteryCard();
        if (firstSong) {
          setCurrentSong(firstSong);
        }
      }

      // Start the game by updating the phase
      const { error: updateError } = await supabase
        .from('game_rooms')
        .update({ phase: 'playing' })
        .eq('id', roomData.id);

      if (updateError) {
        throw new Error('Failed to start game');
      }

      setPhase('playing');
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
      toast.error(err.message || 'Failed to start game');
    } finally {
      setIsLoading(false);
    }
  }, [roomData?.id, roomData?.gamemode, setPhase, classicGameLogic, setCurrentSong]);

  const placeCard = useCallback(async (song: Song, position: number): Promise<{ success: boolean; correct?: boolean }> => {
    if (!currentPlayer || !roomData?.id) {
      console.error('❌ Cannot place card: missing player or room data');
      return { success: false };
    }

    console.log('🃏 Placing card:', song.deezer_title, 'at position:', position);

    try {
      let result: { success: boolean; correct?: boolean };

      // Use appropriate game mode logic
      if (roomData.gamemode === 'classic') {
        result = await classicGameLogic.placeCard(song, position, currentPlayer.id);
      } else if (roomData.gamemode === 'sprint') {
        result = await sprintGameLogic.placeCard(song, position, currentPlayer.id);
      } else {
        console.error('❌ Unsupported game mode for card placement:', roomData.gamemode);
        return { success: false };
      }

      if (result.success && result.correct !== undefined) {
        const isCorrect = result.correct;
        
        toast(isCorrect ? "Correct placement! Great job!" : "Incorrect placement! Try again!");

        return { success: true, correct: isCorrect };
      } else if (result.success) {
        return { success: true };
      } else {
        return { success: false };
      }
    } catch (error) {
      console.error('❌ Error placing card:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast.error(`Error placing card: ${errorMessage}`);

      return { success: false };
    }
  }, [currentPlayer, roomData?.id, roomData?.gamemode, classicGameLogic, sprintGameLogic]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Remove player from the room
      const { error: removeError } = await supabase
        .from('players')
        .delete()
        .eq('player_session_id', playerSessionId)
        .eq('room_id', roomData?.id);

      if (removeError) {
        throw new Error('Failed to leave room');
      }

      // If the leaving player was the host, reassign host or end the game
      if (isHost) {
        // Fetch remaining players
        const { data: remainingPlayers, error: fetchError } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', roomData?.id)
          .order('joined_at', { ascending: true });

        if (fetchError) {
          console.error('Failed to fetch remaining players:', fetchError);
          throw new Error('Failed to leave room');
        }

        if (remainingPlayers && remainingPlayers.length > 0) {
          // Reassign host to the next player
          const newHost = remainingPlayers[0];

          const { error: updateError } = await supabase
            .from('game_rooms')
            .update({ host_id: newHost.player_session_id })
            .eq('id', roomData?.id);

          if (updateError) {
            console.error('Failed to reassign host:', updateError);
            throw new Error('Failed to leave room');
          }
        } else {
          // No players left, end the game
          const { error: endError } = await supabase
            .from('game_rooms')
            .update({ phase: 'finished' })
            .eq('id', roomData?.id);

          if (endError) {
            console.error('Failed to end game:', endError);
            throw new Error('Failed to leave room');
          }
        }
      }

      // Redirect to home page
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to leave room');
      toast.error(err.message || 'Failed to leave room');
    } finally {
      setIsLoading(false);
    }
  }, [playerSessionId, roomData?.id, isHost, navigate]);

  // Reset room
  const resetRoom = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Reset the game state in the database
      const { error: resetError } = await supabase
        .from('game_rooms')
        .update({
          phase: 'lobby',
          current_song: null,
          current_turn: 0,
          songs: null
        })
        .eq('id', roomData?.id);

      if (resetError) {
        throw new Error('Failed to reset room');
      }

      // Clear player timelines
      const { error: clearError } = await supabase
        .from('players')
        .update({ timeline: [] })
        .eq('room_id', roomData?.id);

      if (clearError) {
        throw new Error('Failed to clear player timelines');
      }

      // Reset local state
      setPhase('lobby');
      setCurrentSong(null);

    } catch (err: any) {
      setError(err.message || 'Failed to reset room');
      toast.error(err.message || 'Failed to reset room');
    } finally {
      setIsLoading(false);
    }
  }, [roomData?.id, setPhase, setCurrentSong]);

  return {
    roomData,
    players,
    currentPlayer,
    isHost,
    isLoading,
    error,
    createRoom,
    joinRoom,
    startGame,
    placeCard,
    leaveRoom,
    resetRoom
  };
}


import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameRoom, Player, Song, GameMode, GameModeSettings } from '@/types/game';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { gameService } from '@/services/gameService';

interface UseGameRoomReturn {
  room: GameRoom | null;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  setRoom: React.Dispatch<React.SetStateAction<GameRoom | null>>;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setCurrentPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  fetchRoom: (roomId: string) => Promise<void>;
  fetchPlayers: (roomId: string) => Promise<void>;
  fetchCurrentPlayer: (roomId: string, userId: string) => Promise<void>;
  subscribeToRoomUpdates: (roomId: string) => void;
  subscribeToPlayerUpdates: (roomId: string) => void;
  transformPlayer: (dbPlayer: any) => Player;
  refreshCurrentPlayerTimeline: () => Promise<void>;
  createRoom: (hostName: string) => Promise<string | null>;
  joinRoom: (lobbyCode: string, playerName: string) => Promise<boolean>;
  updatePlayer: (updates: { name?: string; character?: string }) => Promise<void>;
  updateRoomSongs: (songs: Song[]) => Promise<void>;
  updateRoomGamemode: (gamemode: GameMode, settings: GameModeSettings) => Promise<void>;
  startGame: () => Promise<void>;
  leaveRoom: () => void;
  placeCard: (song: Song, position: number) => Promise<{ success: boolean; error?: string; correct?: boolean }>;
  setCurrentSong: (song: Song) => void;
  assignStartingCards: () => Promise<void>;
  kickPlayer?: (playerId: string) => Promise<boolean>;
  forceReconnect: () => void;
}

export const useGameRoom = (): UseGameRoomReturn => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { connectionStatus, forceReconnect } = useRealtimeSubscription();

  const fetchRoom = useCallback(async (roomId: string) => {
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) {
        throw new Error(`Failed to fetch room: ${roomError.message}`);
      }

      if (roomData) {
        // Type cast the database response to our GameRoom type
        const typedRoom: GameRoom = {
          ...roomData,
          phase: roomData.phase as 'lobby' | 'playing' | 'finished',
          gamemode: roomData.gamemode as GameMode,
          gamemode_settings: roomData.gamemode_settings as GameModeSettings,
          songs: Array.isArray(roomData.songs) ? roomData.songs as Song[] : [],
          current_song: roomData.current_song as Song | null
        };
        setRoom(typedRoom);
      } else {
        setRoom(null);
      }
    } catch (error: any) {
      console.error('Error fetching room:', error.message);
      setError(error.message);
    }
  }, []);

  const fetchPlayers = useCallback(async (roomId: string) => {
    try {
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId);

      if (playersError) {
        throw new Error(`Failed to fetch players: ${playersError.message}`);
      }

      if (playersData) {
        const transformedPlayers = playersData.map(transformPlayer);
        setPlayers(transformedPlayers);
      } else {
        setPlayers([]);
      }
    } catch (error: any) {
      console.error('Error fetching players:', error.message);
      setError(error.message);
    }
  }, []);

  const fetchCurrentPlayer = useCallback(async (roomId: string, userId: string) => {
    try {
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('id', userId)
        .single();

      if (playerError) {
        console.warn(`Failed to fetch current player: ${playerError.message}`);
        setCurrentPlayer(null);
        return;
      }

      if (playerData) {
        setCurrentPlayer(transformPlayer(playerData));
      } else {
        setCurrentPlayer(null);
      }
    } catch (error: any) {
      console.error('Error fetching current player:', error.message);
      setCurrentPlayer(null);
    }
  }, []);

  const subscribeToRoomUpdates = useCallback((roomId: string) => {
    const roomSubscription = supabase
      .channel(`room_updates_${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms' }, (payload) => {
        if (payload.new) {
          const typedRoom: GameRoom = {
            ...payload.new,
            phase: payload.new.phase as 'lobby' | 'playing' | 'finished',
            gamemode: payload.new.gamemode as GameMode,
            gamemode_settings: payload.new.gamemode_settings as GameModeSettings,
            songs: Array.isArray(payload.new.songs) ? payload.new.songs as Song[] : [],
            current_song: payload.new.current_song as Song | null
          };
          setRoom(typedRoom);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomSubscription);
    };
  }, []);

  const subscribeToPlayerUpdates = useCallback((roomId: string) => {
    const playersSubscription = supabase
      .channel(`player_updates_${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload) => {
        fetchPlayers(roomId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(playersSubscription);
    };
  }, [fetchPlayers]);

  const transformPlayer = (dbPlayer: any): Player => {
    return {
      id: dbPlayer.id,
      name: dbPlayer.name,
      color: dbPlayer.color,
      timelineColor: dbPlayer.timeline_color,
      score: dbPlayer.score,
      timeline: Array.isArray(dbPlayer.timeline) ? dbPlayer.timeline as Song[] : []
    };
  };

  const refreshCurrentPlayerTimeline = async () => {
    if (!currentPlayer) return;

    try {
      const { data: playerData, error } = await supabase
        .from('players')
        .select('timeline')
        .eq('id', currentPlayer.id)
        .single();

      if (error) {
        console.error('Failed to refresh player timeline:', error);
        return;
      }

      const updatedTimeline = Array.isArray(playerData.timeline) ? playerData.timeline as Song[] : [];
      
      setCurrentPlayer(prev => prev ? {
        ...prev,
        timeline: updatedTimeline
      } : null);

      console.log('✅ Player timeline refreshed:', updatedTimeline.length, 'songs');
    } catch (error) {
      console.error('Error refreshing player timeline:', error);
    }
  };

  // Game room management functions
  const createRoom = async (hostName: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await gameService.createRoom(hostName);
      if (result.success && result.room && result.player) {
        setRoom(result.room);
        setCurrentPlayer(result.player);
        setIsHost(true);
        return result.room.lobby_code;
      }
      return null;
    } catch (error: any) {
      setError(error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async (lobbyCode: string, playerName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await gameService.joinRoom(lobbyCode, playerName);
      if (result.success && result.room && result.player) {
        setRoom(result.room);
        setCurrentPlayer(result.player);
        setIsHost(false);
        return true;
      }
      return false;
    } catch (error: any) {
      setError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlayer = async (updates: { name?: string; character?: string }): Promise<void> => {
    if (!currentPlayer) return;
    
    try {
      const result = await gameService.updatePlayer(currentPlayer.id, updates);
      if (result.success && result.player) {
        setCurrentPlayer(result.player);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const updateRoomSongs = async (songs: Song[]): Promise<void> => {
    if (!room) return;
    
    try {
      const result = await gameService.updateRoomSongs(room.id, songs);
      if (result.success && result.room) {
        setRoom(result.room);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const updateRoomGamemode = async (gamemode: GameMode, settings: GameModeSettings): Promise<void> => {
    if (!room) return;
    
    try {
      const result = await gameService.updateRoomGamemode(room.id, gamemode, settings);
      if (result.success && result.room) {
        setRoom(result.room);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const startGame = async (): Promise<void> => {
    if (!room) return;
    
    try {
      const result = await gameService.startGame(room.id);
      if (result.success && result.room) {
        setRoom(result.room);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const leaveRoom = (): void => {
    setRoom(null);
    setPlayers([]);
    setCurrentPlayer(null);
    setIsHost(false);
    setError(null);
  };

  const placeCard = async (song: Song, position: number): Promise<{ success: boolean; error?: string; correct?: boolean }> => {
    if (!room || !currentPlayer) {
      return { success: false, error: 'Missing room or player data' };
    }
    
    try {
      const result = await gameService.placeCard(room.id, currentPlayer.id, song, position);
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const setCurrentSong = (song: Song): void => {
    if (room) {
      setRoom(prev => prev ? { ...prev, current_song: song } : null);
    }
  };

  const assignStartingCards = async (): Promise<void> => {
    if (!room) return;
    
    try {
      await gameService.assignStartingCards(room.id);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const kickPlayer = async (playerId: string): Promise<boolean> => {
    if (!room) return false;
    
    try {
      const result = await gameService.kickPlayer(room.id, playerId);
      return result.success;
    } catch (error: any) {
      setError(error.message);
      return false;
    }
  };

  return {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    error,
    connectionStatus,
    setRoom,
    setPlayers,
    setCurrentPlayer,
    fetchRoom,
    fetchPlayers,
    fetchCurrentPlayer,
    subscribeToRoomUpdates,
    subscribeToPlayerUpdates,
    transformPlayer,
    refreshCurrentPlayerTimeline,
    createRoom,
    joinRoom,
    updatePlayer,
    updateRoomSongs,
    updateRoomGamemode,
    startGame,
    leaveRoom,
    placeCard,
    setCurrentSong,
    assignStartingCards,
    kickPlayer,
    forceReconnect,
  };
};

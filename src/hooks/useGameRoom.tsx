
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameRoom, Player, Song, GameMode, GameModeSettings } from '@/types/game';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Json } from '@/integrations/supabase/types';

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
  updateRoomGamemode: (gamemode: GameMode, settings: GameModeSettings) => Promise<boolean>;
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
  
  const { connectionStatus, forceReconnect } = useRealtimeSubscription([]);

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
          id: roomData.id,
          lobby_code: roomData.lobby_code,
          host_id: roomData.host_id,
          host_name: roomData.host_name || '',
          created_at: roomData.created_at,
          updated_at: roomData.updated_at,
          phase: roomData.phase as 'lobby' | 'playing' | 'finished',
          gamemode: roomData.gamemode as GameMode,
          gamemode_settings: roomData.gamemode_settings as GameModeSettings,
          songs: Array.isArray(roomData.songs) ? (roomData.songs as unknown as Song[]) : [],
          current_song: roomData.current_song ? (roomData.current_song as unknown as Song) : null,
          current_turn: roomData.current_turn,
          current_player_id: roomData.current_player_id
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
        if (payload.new && typeof payload.new === 'object') {
          const newData = payload.new as any;
          const typedRoom: GameRoom = {
            id: newData.id,
            lobby_code: newData.lobby_code,
            host_id: newData.host_id,
            host_name: newData.host_name || '',
            created_at: newData.created_at,
            updated_at: newData.updated_at,
            phase: newData.phase as 'lobby' | 'playing' | 'finished',
            gamemode: newData.gamemode as GameMode,
            gamemode_settings: newData.gamemode_settings as GameModeSettings,
            songs: Array.isArray(newData.songs) ? (newData.songs as unknown as Song[]) : [],
            current_song: newData.current_song ? (newData.current_song as unknown as Song) : null,
            current_turn: newData.current_turn,
            current_player_id: newData.current_player_id
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
      timeline: Array.isArray(dbPlayer.timeline) ? (dbPlayer.timeline as unknown as Song[]) : []
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

      const updatedTimeline = Array.isArray(playerData.timeline) ? (playerData.timeline as unknown as Song[]) : [];
      
      setCurrentPlayer(prev => prev ? {
        ...prev,
        timeline: updatedTimeline
      } : null);

      console.log('✅ Player timeline refreshed:', updatedTimeline.length, 'songs');
    } catch (error) {
      console.error('Error refreshing player timeline:', error);
    }
  };

  // Simplified game room management functions without GameService
  const createRoom = async (hostName: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate a random lobby code
      const lobbyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          lobby_code: lobbyCode,
          host_name: hostName,
          phase: 'lobby',
          gamemode: 'classic',
          gamemode_settings: {},
          songs: []
        })
        .select()
        .single();

      if (roomError) throw roomError;

      if (roomData) {
        const typedRoom: GameRoom = {
          id: roomData.id,
          lobby_code: roomData.lobby_code,
          host_id: roomData.host_id,
          host_name: roomData.host_name || '',
          created_at: roomData.created_at,
          updated_at: roomData.updated_at,
          phase: roomData.phase as 'lobby' | 'playing' | 'finished',
          gamemode: roomData.gamemode as GameMode,
          gamemode_settings: roomData.gamemode_settings as GameModeSettings,
          songs: Array.isArray(roomData.songs) ? (roomData.songs as unknown as Song[]) : [],
          current_song: roomData.current_song ? (roomData.current_song as unknown as Song) : null,
          current_turn: roomData.current_turn,
          current_player_id: roomData.current_player_id
        };
        setRoom(typedRoom);
        setIsHost(true);
        return lobbyCode;
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
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('lobby_code', lobbyCode)
        .single();

      if (roomError || !roomData) {
        setError('Room not found');
        return false;
      }

      const typedRoom: GameRoom = {
        id: roomData.id,
        lobby_code: roomData.lobby_code,
        host_id: roomData.host_id,
        host_name: roomData.host_name || '',
        created_at: roomData.created_at,
        updated_at: roomData.updated_at,
        phase: roomData.phase as 'lobby' | 'playing' | 'finished',
        gamemode: roomData.gamemode as GameMode,
        gamemode_settings: roomData.gamemode_settings as GameModeSettings,
        songs: Array.isArray(roomData.songs) ? (roomData.songs as unknown as Song[]) : [],
        current_song: roomData.current_song ? (roomData.current_song as unknown as Song) : null,
        current_turn: roomData.current_turn,
        current_player_id: roomData.current_player_id
      };
      setRoom(typedRoom);
      setIsHost(false);
      return true;
    } catch (error: any) {
      setError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlayer = async (updates: { name?: string; character?: string }): Promise<void> => {
    // Simplified implementation
    console.log('Update player:', updates);
  };

  const updateRoomSongs = async (songs: Song[]): Promise<void> => {
    if (!room) return;
    
    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ songs: songs as any })
        .eq('id', room.id);

      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
    }
  };

  const updateRoomGamemode = async (gamemode: GameMode, settings: GameModeSettings): Promise<boolean> => {
    if (!room) return false;
    
    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ 
          gamemode: gamemode,
          gamemode_settings: settings as any
        })
        .eq('id', room.id);

      if (error) throw error;
      return true;
    } catch (error: any) {
      setError(error.message);
      return false;
    }
  };

  const startGame = async (): Promise<void> => {
    if (!room) return;
    
    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ phase: 'playing' })
        .eq('id', room.id);

      if (error) throw error;
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
    // Simplified implementation
    console.log('Place card:', song, position);
    return { success: true };
  };

  const setCurrentSong = (song: Song): void => {
    if (room) {
      setRoom(prev => prev ? { ...prev, current_song: song } : null);
    }
  };

  const assignStartingCards = async (): Promise<void> => {
    // Simplified implementation
    console.log('Assign starting cards');
  };

  const kickPlayer = async (playerId: string): Promise<boolean> => {
    // Simplified implementation
    console.log('Kick player:', playerId);
    return true;
  };

  // Convert ConnectionStatus to simple string
  const simpleConnectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error' = 
    connectionStatus.isConnected ? 'connected' :
    connectionStatus.isReconnecting ? 'connecting' :
    connectionStatus.lastError ? 'error' : 'disconnected';

  return {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    error,
    connectionStatus: simpleConnectionStatus,
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

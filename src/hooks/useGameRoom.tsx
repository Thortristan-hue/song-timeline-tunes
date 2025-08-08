
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Song, Player, GameRoom, DatabasePhase } from '@/types/game';

interface UseGameRoomReturn {
  room: GameRoom | null;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;
  createRoom: (hostName: string) => Promise<string | null>;
  joinRoom: (lobbyCode: string, playerName: string) => Promise<boolean>;
  updatePlayer: (updates: { name?: string; character?: string }) => Promise<boolean>;
  updateRoomSongs: (songs: Song[]) => Promise<boolean>;
  leaveRoom: () => void;
  setCurrentSong: (song: Song) => Promise<void>;
  connectionStatus: {
    isConnected: boolean;
    isReconnecting: boolean;
    lastError: string | null;
    retryCount: number;
  };
}

export function useGameRoom(): UseGameRoomReturn {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: true,
    isReconnecting: false,
    lastError: null as string | null,
    retryCount: 0
  });

  const subscriptionRef = useRef<any>(null);
  const playersSubscriptionRef = useRef<any>(null);
  const roomIdRef = useRef<string | null>(null);
  const currentPlayerIdRef = useRef<string | null>(null);

  // Helper function to transform database player to Player interface
  const transformDatabasePlayer = (dbPlayer: any): Player => {
    return {
      id: dbPlayer.id,
      name: dbPlayer.name,
      color: dbPlayer.color,
      timelineColor: dbPlayer.timeline_color,
      score: dbPlayer.score || 0,
      timeline: Array.isArray(dbPlayer.timeline) ? dbPlayer.timeline : [],
      character: dbPlayer.character
    };
  };

  const setupRoomSubscription = useCallback((roomId: string) => {
    console.log('[useGameRoom] Setting up room subscription for:', roomId);
    
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    subscriptionRef.current = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          console.log('[useGameRoom] Room update received:', payload);
          if (payload.new) {
            setRoom(payload.new as GameRoom);
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
        async () => {
          console.log('[useGameRoom] Player update detected, refetching players');
          await fetchPlayers(roomId);
        }
      )
      .subscribe((status) => {
        console.log('[useGameRoom] Room subscription status:', status);
        setConnectionStatus(prev => ({
          ...prev,
          isConnected: status === 'SUBSCRIBED',
          isReconnecting: status === 'CHANNEL_ERROR'
        }));
      });

    roomIdRef.current = roomId;
  }, []);

  const setupPlayersSubscription = useCallback((roomId: string) => {
    console.log('[useGameRoom] Setting up players subscription for:', roomId);
    
    if (playersSubscriptionRef.current) {
      supabase.removeChannel(playersSubscriptionRef.current);
    }

    playersSubscriptionRef.current = supabase
      .channel(`players-${roomId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
        async () => {
          console.log('[useGameRoom] Players change detected');
          await fetchPlayers(roomId);
        }
      )
      .subscribe();
  }, []);

  const fetchPlayers = useCallback(async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[useGameRoom] Error fetching players:', error);
        return;
      }

      console.log('[useGameRoom] Players fetched:', data?.length || 0);
      
      const transformedPlayers = data?.map(transformDatabasePlayer) || [];
      setPlayers(transformedPlayers);

      if (currentPlayerIdRef.current && data) {
        const dbPlayer = data.find(p => p.id === currentPlayerIdRef.current);
        if (dbPlayer) {
          setCurrentPlayer(transformDatabasePlayer(dbPlayer));
        }
      }
    } catch (error) {
      console.error('[useGameRoom] Error fetching players:', error);
    }
  }, []);

  const createRoom = useCallback(async (hostName: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const lobbyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          lobby_code: lobbyCode,
          host_id: 'temp_host_id',
          host_name: hostName || 'Host',
          phase: DatabasePhase.LOBBY,
          gamemode: 'classic',
          gamemode_settings: {},
          songs: []
        })
        .select()
        .single();

      if (error) {
        console.error('[useGameRoom] Error creating room:', error);
        setError('Failed to create room');
        return null;
      }

      console.log('[useGameRoom] Room created:', data);
      setRoom(data as GameRoom);
      setIsHost(true);
      
      setupRoomSubscription(data.id);
      setupPlayersSubscription(data.id);
      
      return lobbyCode;
    } catch (error) {
      console.error('[useGameRoom] Error creating room:', error);
      setError('Failed to create room');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setupRoomSubscription, setupPlayersSubscription]);

  const joinRoom = useCallback(async (lobbyCode: string, playerName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('lobby_code', lobbyCode.toUpperCase())
        .single();

      if (roomError || !roomData) {
        setError('Room not found');
        return false;
      }

      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: roomData.id,
          name: playerName,
          color: '#FF6B9D',
          timeline_color: '#FF6B9D',
          score: 0,
          timeline: [],
          character: 'char_jessica'
        })
        .select()
        .single();

      if (playerError) {
        console.error('[useGameRoom] Error creating player:', playerError);
        setError('Failed to join room');
        return false;
      }

      console.log('[useGameRoom] Player created:', playerData);
      setRoom(roomData as GameRoom);
      setCurrentPlayer(transformDatabasePlayer(playerData));
      setIsHost(false);
      
      currentPlayerIdRef.current = playerData.id || null;
      
      setupRoomSubscription(roomData.id);
      setupPlayersSubscription(roomData.id);
      
      return true;
    } catch (error) {
      console.error('[useGameRoom] Error joining room:', error);
      setError('Failed to join room');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setupRoomSubscription, setupPlayersSubscription]);

  const updatePlayer = useCallback(async (updates: { name?: string; character?: string }): Promise<boolean> => {
    if (!currentPlayer?.id) {
      console.error('[useGameRoom] No current player to update');
      return false;
    }

    try {
      const { error } = await supabase
        .from('players')
        .update(updates)
        .eq('id', currentPlayer.id);

      if (error) {
        console.error('[useGameRoom] Error updating player:', error);
        return false;
      }

      setCurrentPlayer(prev => prev ? { ...prev, ...updates } : null);
      
      console.log('[useGameRoom] Player updated successfully');
      return true;
    } catch (error) {
      console.error('[useGameRoom] Error updating player:', error);
      return false;
    }
  }, [currentPlayer?.id]);

  const updateRoomSongs = useCallback(async (songs: Song[]): Promise<boolean> => {
    if (!room?.id) return false;

    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ songs })
        .eq('id', room.id);

      if (error) {
        console.error('[useGameRoom] Error updating room songs:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[useGameRoom] Error updating room songs:', error);
      return false;
    }
  }, [room?.id]);

  const setCurrentSong = useCallback(async (song: Song): Promise<void> => {
    if (!room?.id) return;

    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ current_song: song })
        .eq('id', room.id);

      if (error) {
        console.error('[useGameRoom] Error setting current song:', error);
      }
    } catch (error) {
      console.error('[useGameRoom] Error setting current song:', error);
    }
  }, [room?.id]);

  const leaveRoom = useCallback(() => {
    console.log('[useGameRoom] Leaving room');
    
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    if (playersSubscriptionRef.current) {
      supabase.removeChannel(playersSubscriptionRef.current);
      playersSubscriptionRef.current = null;
    }

    setRoom(null);
    setPlayers([]);
    setCurrentPlayer(null);
    setIsHost(false);
    setError(null);
    roomIdRef.current = null;
    currentPlayerIdRef.current = null;
    
    setConnectionStatus({
      isConnected: true,
      isReconnecting: false,
      lastError: null,
      retryCount: 0
    });
  }, []);

  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
      if (playersSubscriptionRef.current) {
        supabase.removeChannel(playersSubscriptionRef.current);
      }
    };
  }, []);

  return {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    error,
    createRoom,
    joinRoom,
    updatePlayer,
    updateRoomSongs,
    leaveRoom,
    setCurrentSong,
    connectionStatus
  };
}

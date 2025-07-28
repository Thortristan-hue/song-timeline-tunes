import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameRoom, Player, Song } from '@/types/game';

interface UseGameRoomReturn {
  room: GameRoom | null;
  players: Player[];
  currentPlayer: Player | null;
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
}

export const useGameRoom = (): UseGameRoomReturn => {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

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
        setRoom(roomData);
      } else {
        setRoom(null);
      }
    } catch (error: any) {
      console.error('Error fetching room:', error.message);
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
        // Not critical, just log the error
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
          setRoom(payload.new);
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
      timeline: Array.isArray(dbPlayer.timeline) ? dbPlayer.timeline : []
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

      const updatedTimeline = Array.isArray(playerData.timeline) ? playerData.timeline : [];
      
      setCurrentPlayer(prev => prev ? {
        ...prev,
        timeline: updatedTimeline
      } : null);

      console.log('✅ Player timeline refreshed:', updatedTimeline.length, 'songs');
    } catch (error) {
      console.error('Error refreshing player timeline:', error);
    }
  };

  return {
    room,
    players,
    currentPlayer,
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
  };
};


import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameRoom, Player, Song, GamePhase, DatabasePhase } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';

export interface RealtimeGameState {
  room: GameRoom | null;
  players: Player[];
  currentPlayer: Player | null;
  mysteryCard: Song | null;
  isHost: boolean;
  isConnected: boolean;
  error: string | null;
}

// Helper function to convert database phase to GamePhase
const toGamePhase = (dbPhase: DatabasePhase): GamePhase => {
  switch (dbPhase) {
    case 'lobby':
      return 'hostLobby'; // Default to hostLobby, can be refined based on context
    case 'playing':
      return 'playing';
    case 'finished':
      return 'finished';
    default:
      return 'hostLobby';
  }
};

// Helper function to safely convert database player to Player type
const convertDatabasePlayer = (dbPlayer: any): Player => {
  return {
    id: dbPlayer.id,
    name: dbPlayer.name || 'Unknown Player',
    color: dbPlayer.color || '#007AFF',
    timelineColor: dbPlayer.timeline_color || '#007AFF',
    score: dbPlayer.score || 0,
    timeline: Array.isArray(dbPlayer.timeline) ? dbPlayer.timeline : [],
    character: dbPlayer.character || 'char_dave'
  };
};

export function useRealtimeGameState(roomId: string | null, currentPlayerId: string | null) {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<RealtimeGameState>({
    room: null,
    players: [],
    currentPlayer: null,
    mysteryCard: null,
    isHost: false,
    isConnected: false,
    error: null
  });

  // Subscribe to real-time updates from the games table
  useEffect(() => {
    if (!roomId) {
      console.log('[RealtimeGameState] No room ID provided, clearing subscription');
      setGameState(prev => ({ ...prev, room: null, players: [], currentPlayer: null }));
      return;
    }

    console.log('[RealtimeGameState] Setting up real-time subscription for room:', roomId);

    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'game_rooms',
          filter: `id=eq.${roomId}`
        }, 
        (payload) => {
          console.log('[RealtimeGameState] Game room update received:', payload);
          if (payload.new) {
            updateGameRoom(payload.new as any);
          }
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('[RealtimeGameState] Players update received:', payload);
          fetchPlayers();
        }
      )
      .subscribe((status) => {
        console.log('[RealtimeGameState] Subscription status:', status);
        setGameState(prev => ({ 
          ...prev, 
          isConnected: status === 'SUBSCRIBED',
          error: status === 'CLOSED' ? 'Connection lost' : null
        }));
      });

    // Initial data fetch
    fetchInitialData();

    return () => {
      console.log('[RealtimeGameState] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const fetchInitialData = async () => {
    if (!roomId) return;

    try {
      // Fetch room data
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;
      if (roomData) {
        updateGameRoom(roomData);
      }

      // Fetch players
      await fetchPlayers();

    } catch (error) {
      console.error('[RealtimeGameState] Error fetching initial data:', error);
      setGameState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to fetch game data' 
      }));
    }
  };

  const fetchPlayers = async () => {
    if (!roomId) return;

    try {
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true });

      if (playersError) throw playersError;

      if (playersData) {
        console.log('[RealtimeGameState] Raw players data:', playersData);
        
        const convertedPlayers: Player[] = playersData.map(convertDatabasePlayer);
        console.log('[RealtimeGameState] Converted players:', convertedPlayers);

        // Filter out host players - they should not be in the game rotation
        const actualPlayers = convertedPlayers.filter(player => {
          const originalPlayer = playersData.find(p => p.id === player.id);
          return !originalPlayer?.is_host;
        });

        console.log('[RealtimeGameState] Actual players (non-host):', actualPlayers);

        const currentPlayer = currentPlayerId 
          ? convertedPlayers.find(p => {
              const originalPlayer = playersData.find(orig => orig.id === p.id);
              return originalPlayer?.player_session_id === currentPlayerId;
            }) || null
          : null;

        const isHost = playersData.some(p => p.player_session_id === currentPlayerId && p.is_host);

        console.log('[RealtimeGameState] Player analysis:', {
          totalPlayers: convertedPlayers.length,
          actualPlayers: actualPlayers.length,
          currentPlayerId,
          isHost,
          currentPlayer: currentPlayer?.name
        });

        setGameState(prev => ({ 
          ...prev, 
          players: actualPlayers, // Only non-host players
          currentPlayer,
          isHost
        }));
      }
    } catch (error) {
      console.error('[RealtimeGameState] Error fetching players:', error);
    }
  };

  const updateGameRoom = (roomData: any) => {
    const dbPhase = roomData.phase as DatabasePhase;
    const gamePhase = toGamePhase(dbPhase);
    
    const updatedRoom: GameRoom = {
      id: roomData.id,
      lobby_code: roomData.lobby_code,
      host_id: roomData.host_id,
      host_name: roomData.host_name || '',
      phase: gamePhase, // Convert to GamePhase
      gamemode: roomData.gamemode || 'classic',
      gamemode_settings: roomData.gamemode_settings || {},
      songs: Array.isArray(roomData.songs) ? roomData.songs : [],
      created_at: roomData.created_at,
      updated_at: roomData.updated_at,
      current_turn: roomData.current_turn || 0,
      current_song: roomData.current_song || null,
      current_player_id: roomData.current_player_id || null
    };

    // Extract mystery card from current_song
    const mysteryCard = updatedRoom.current_song || null;

    console.log('[RealtimeGameState] Room updated:', {
      phase: updatedRoom.phase,
      currentPlayerId: updatedRoom.current_player_id,
      mysteryCard: mysteryCard?.deezer_title
    });

    setGameState(prev => ({ 
      ...prev, 
      room: updatedRoom,
      mysteryCard,
      error: null
    }));
  };

  // Game action methods
  const updateGameState = useCallback(async (updates: Partial<GameRoom>) => {
    if (!roomId) return false;

    try {
      const { error } = await supabase
        .from('game_rooms')
        .update(updates as any)
        .eq('id', roomId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[RealtimeGameState] Error updating game state:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update game state",
        variant: "destructive",
      });
      return false;
    }
  }, [roomId, toast]);

  const updatePlayerData = useCallback(async (playerId: string, updates: Partial<Player>) => {
    try {
      const { error } = await supabase
        .from('players')
        .update({
          name: updates.name,
          color: updates.color,
          timeline_color: updates.timelineColor,
          score: updates.score,
          timeline: updates.timeline as any,
          character: updates.character
        })
        .eq('id', playerId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[RealtimeGameState] Error updating player:', error);
      return false;
    }
  }, []);

  return {
    gameState,
    updateGameState,
    updatePlayerData,
    refreshData: fetchInitialData
  };
}

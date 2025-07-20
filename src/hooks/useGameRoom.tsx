
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Song, Player, GameRoom, GamePhase, GameMode, GameModeSettings } from '@/types/game';
import { GameService } from '@/services/gameService';
import { useToast } from '@/components/ui/use-toast';
import { useRealtimeSubscription, ConnectionStatus } from '@/hooks/useRealtimeSubscription';

// ENHANCED: Reduced debounce for snappier updates
const PLAYER_UPDATE_DEBOUNCE = 500; // Reduced from 1500ms

export function useGameRoom() {
  const { toast } = useToast();
  
  // Core game state
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Session and connection management
  const [sessionId] = useState(() => Math.random().toString(36).substring(2));
  const playerUpdateTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitialFetch = useRef(true);
  const lastFetchTime = useRef<number>(0);
  const fetchCooldown = 1000; // 1 second cooldown between fetches

  // ENHANCED: Real-time subscription configs for instant updates
  const subscriptionConfigs = useMemo(() => {
    if (!room?.id) return [];
    
    return [
      {
        table: 'game_rooms',
        filter: `id=eq.${room.id}`,
        onUpdate: (payload: any) => {
          console.log('🏠 REALTIME: Room updated instantly:', payload.new);
          setRoom(payload.new);
        }
      },
      {
        table: 'players', 
        filter: `room_id=eq.${room.id}`,
        onInsert: (payload: any) => {
          console.log('👤 REALTIME: Player joined instantly:', payload.new);
          fetchPlayersOptimized(room.id, true);
        },
        onUpdate: (payload: any) => {
          console.log('👤 REALTIME: Player updated instantly:', payload.new);
          fetchPlayersOptimized(room.id, true);
        },
        onDelete: (payload: any) => {
          console.log('👤 REALTIME: Player left instantly:', payload.old);
          fetchPlayersOptimized(room.id, true);
        }
      }
    ];
  }, [room?.id]);

  // ENHANCED: Real-time subscription with instant updates
  const { connectionStatus, forceReconnect } = useRealtimeSubscription(subscriptionConfigs);

  // ENHANCED: Optimized player fetching with rate limiting
  const fetchPlayersOptimized = useCallback(async (roomId: string, forceUpdate = false) => {
    // Rate limiting to prevent spam
    const now = Date.now();
    if (!forceUpdate && now - lastFetchTime.current < fetchCooldown) {
      console.log('🚫 Fetch rate limited, skipping...');
      return;
    }
    lastFetchTime.current = now;

    console.log('🔍 Fetching players for room:', roomId, 'forceUpdate:', forceUpdate);
    
    try {
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_host', false)
        .order('joined_at', { ascending: true });

      if (playersError) {
        console.error('❌ Error fetching players:', playersError);
        return;
      }

      console.log('👥 Raw non-host players from DB:', playersData);

      // Convert to Player format with proper type casting
      const convertedPlayers: Player[] = playersData.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        timelineColor: p.timeline_color,
        score: p.score,
        timeline: Array.isArray(p.timeline) ? p.timeline as Song[] : []
      }));

      console.log('👥 Converted non-host players:', convertedPlayers);

      // ENHANCED: Immediate state update for snappy UX
      setPlayers(convertedPlayers);
      console.log('✅ Player list updated successfully with', convertedPlayers.length, 'players');

    } catch (error) {
      console.error('❌ Failed to fetch players:', error);
    }
  }, []);

  // ENHANCED: Debounced player updates with immediate application
  useEffect(() => {
    if (!room?.id) return;

    // Clear existing timeout
    if (playerUpdateTimeoutRef.current) {
      clearTimeout(playerUpdateTimeoutRef.current);
    }

    // ENHANCED: Immediate update on first fetch, debounced on subsequent
    if (isInitialFetch.current) {
      fetchPlayersOptimized(room.id, true);
      isInitialFetch.current = false;
    } else {
      // Debounced updates for subsequent changes
      playerUpdateTimeoutRef.current = setTimeout(() => {
        fetchPlayersOptimized(room.id, false);
      }, PLAYER_UPDATE_DEBOUNCE);
    }

    return () => {
      if (playerUpdateTimeoutRef.current) {
        clearTimeout(playerUpdateTimeoutRef.current);
      }
    };
  }, [room?.id, fetchPlayersOptimized]);

  // Room management functions
  const createRoom = useCallback(async (hostName: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Create room using direct Supabase calls since GameService methods don't exist
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          host_name: hostName,
          host_id: sessionId,
          lobby_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          phase: 'lobby',
          gamemode: 'classic',
          gamemode_settings: {},
          songs: []
        })
        .select()
        .single();

      if (roomError) throw roomError;

      setRoom(roomData);
      setIsHost(true);
      console.log('🏠 Room created successfully:', roomData.lobby_code);
      return roomData.lobby_code;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
      console.error('❌ Create room error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const joinRoom = useCallback(async (lobbyCode: string, playerName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Find room by lobby code
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('lobby_code', lobbyCode)
        .single();

      if (roomError) throw new Error('Room not found');

      // Create player
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: roomData.id,
          name: playerName,
          color: '#3b82f6',
          timeline_color: '#3b82f6',
          player_session_id: sessionId,
          is_host: false,
          score: 0,
          timeline: []
        })
        .select()
        .single();

      if (playerError) throw playerError;

      const player: Player = {
        id: playerData.id,
        name: playerData.name,
        color: playerData.color,
        timelineColor: playerData.timeline_color,
        score: playerData.score,
        timeline: Array.isArray(playerData.timeline) ? playerData.timeline as Song[] : []
      };

      setRoom(roomData);
      setCurrentPlayer(player);
      setIsHost(false);
      console.log('🎮 Joined room successfully:', lobbyCode);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
      console.error('❌ Join room error:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // ENHANCED: Instant game state updates using real-time
  const updatePlayer = useCallback(async (updates: Partial<Pick<Player, 'name' | 'color'>>) => {
    if (!currentPlayer || !room) return;

    try {
      // ENHANCED: Optimistic update for instant UI response
      const updatedPlayer = { ...currentPlayer, ...updates };
      setCurrentPlayer(updatedPlayer);

      const { error } = await supabase
        .from('players')
        .update({
          name: updates.name,
          color: updates.color,
          timeline_color: updates.color
        })
        .eq('id', currentPlayer.id);
      
      if (error) {
        // Revert on failure
        setCurrentPlayer(currentPlayer);
        throw error;
      }
      
      console.log('👤 Player updated successfully');
    } catch (error) {
      console.error('❌ Update player error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update player');
    }
  }, [currentPlayer, room]);

  const updateRoomSongs = useCallback(async (songs: Song[]) => {
    if (!room || !isHost) return;

    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .update({ songs })
        .eq('id', room.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setRoom(data);
      console.log('🎵 Room songs updated successfully');
    } catch (error) {
      console.error('❌ Update room songs error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update songs');
    }
  }, [room, isHost]);

  const updateRoomGamemode = useCallback(async (gamemode: GameMode, settings: GameModeSettings): Promise<boolean> => {
    if (!room || !isHost) return false;

    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .update({ 
          gamemode,
          gamemode_settings: settings 
        })
        .eq('id', room.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // ENHANCED: Immediate state update
      setRoom(data);
      console.log('🎮 Room gamemode updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Update room gamemode error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update gamemode');
      return false;
    }
  }, [room, isHost]);

  const startGame = useCallback(async () => {
    if (!room || !isHost) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('game_rooms')
        .update({ phase: 'playing' })
        .eq('id', room.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // ENHANCED: Immediate phase transition
      setRoom(data);
      console.log('🚀 Game started successfully');
    } catch (error) {
      console.error('❌ Start game error:', error);
      setError(error instanceof Error ? error.message : 'Failed to start game');
    } finally {
      setIsLoading(false);
    }
  }, [room, isHost]);

  // ENHANCED: Instant card placement with optimistic updates
  const placeCard = useCallback(async (song: Song, position: number) => {
    if (!currentPlayer || !room) {
      return { success: false, error: 'No player or room context' };
    }

    try {
      // ENHANCED: Optimistic timeline update for instant feedback
      const optimisticTimeline = [...currentPlayer.timeline];
      optimisticTimeline.splice(position, 0, song);
      
      const optimisticPlayer = {
        ...currentPlayer,
        timeline: optimisticTimeline,
        score: currentPlayer.score + 1
      };
      
      setCurrentPlayer(optimisticPlayer);

      const { error } = await supabase
        .from('players')
        .update({
          timeline: optimisticTimeline,
          score: currentPlayer.score + 1
        })
        .eq('id', currentPlayer.id);

      if (error) {
        // Revert optimistic update on failure
        setCurrentPlayer(currentPlayer);
        return { success: false, error: error.message };
      }

      console.log('🃏 Card placed successfully');
      return { success: true, correct: true };
    } catch (error) {
      // Revert optimistic update on error
      setCurrentPlayer(currentPlayer);
      console.error('❌ Place card error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to place card' };
    }
  }, [currentPlayer, room]);

  const setCurrentSong = useCallback(async (song: Song) => {
    if (!room || !isHost) return;

    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .update({ current_song: song })
        .eq('id', room.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setRoom(data);
      console.log('🎵 Current song updated successfully');
    } catch (error) {
      console.error('❌ Set current song error:', error);
      setError(error instanceof Error ? error.message : 'Failed to set current song');
    }
  }, [room, isHost]);

  const assignStartingCards = useCallback(async (playerCards: Record<string, Song>) => {
    if (!room || !isHost) return;

    try {
      // Update each player's timeline with their starting card
      const updatePromises = Object.entries(playerCards).map(([playerId, song]) =>
        supabase
          .from('players')
          .update({ timeline: [song] })
          .eq('id', playerId)
      );

      await Promise.all(updatePromises);
      
      console.log('🃏 Starting cards assigned successfully');
      // Refresh players to get updated timelines
      await fetchPlayersOptimized(room.id, true);
    } catch (error) {
      console.error('❌ Assign starting cards error:', error);
      setError(error instanceof Error ? error.message : 'Failed to assign starting cards');
    }
  }, [room, isHost, fetchPlayersOptimized]);

  const kickPlayer = useCallback(async (playerId: string): Promise<boolean> => {
    if (!room || !isHost) return false;

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)
        .eq('room_id', room.id);
      
      if (error) throw error;
      
      console.log('👤 Player kicked successfully');
      // Refresh players immediately
      await fetchPlayersOptimized(room.id, true);
      return true;
    } catch (error) {
      console.error('❌ Kick player error:', error);
      setError(error instanceof Error ? error.message : 'Failed to kick player');
      return false;
    }
  }, [room, isHost, fetchPlayersOptimized]);

  const leaveRoom = useCallback(async () => {
    if (!room) return;

    try {
      if (currentPlayer) {
        await supabase
          .from('players')
          .delete()
          .eq('id', currentPlayer.id);
      }
      
      // Clear all state
      setRoom(null);
      setPlayers([]);
      setCurrentPlayer(null);
      setIsHost(false);
      setError(null);
      isInitialFetch.current = true;
      
      console.log('👋 Left room successfully');
    } catch (error) {
      console.error('❌ Leave room error:', error);
    }
  }, [room, currentPlayer]);

  return {
    // State
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
    error,
    connectionStatus,
    
    // Actions
    forceReconnect,
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
    kickPlayer: isHost ? kickPlayer : undefined
  };
}

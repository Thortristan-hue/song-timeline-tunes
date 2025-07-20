import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Song, Player, GameRoom, GamePhase } from '@/types/game';
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

      // Convert to Player format
      const convertedPlayers: Player[] = playersData.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        timelineColor: p.timeline_color,
        score: p.score,
        timeline: p.timeline || []
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
      const result = await GameService.createRoom(hostName, sessionId);
      
      if (result.success && result.room && result.lobbyCode) {
        setRoom(result.room);
        setIsHost(true);
        console.log('🏠 Room created successfully:', result.lobbyCode);
        return result.lobbyCode;
      } else {
        throw new Error(result.error || 'Failed to create room');
      }
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
      const result = await GameService.joinRoom(lobbyCode, playerName, sessionId);
      
      if (result.success && result.room && result.player) {
        setRoom(result.room);
        setCurrentPlayer(result.player);
        setIsHost(false);
        console.log('🎮 Joined room successfully:', lobbyCode);
        return true;
      } else {
        throw new Error(result.error || 'Failed to join room');
      }
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

      const result = await GameService.updatePlayer(currentPlayer.id, updates);
      
      if (!result.success) {
        // Revert on failure
        setCurrentPlayer(currentPlayer);
        throw new Error(result.error || 'Failed to update player');
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
      const result = await GameService.updateRoomSongs(room.id, songs);
      
      if (result.success && result.room) {
        setRoom(result.room);
        console.log('🎵 Room songs updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update room songs');
      }
    } catch (error) {
      console.error('❌ Update room songs error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update songs');
    }
  }, [room, isHost]);

  const updateRoomGamemode = useCallback(async (gamemode: string, settings?: any) => {
    if (!room || !isHost) return;

    try {
      const result = await GameService.updateRoomGamemode(room.id, gamemode, settings);
      
      if (result.success && result.room) {
        // ENHANCED: Immediate state update
        setRoom(result.room);
        console.log('🎮 Room gamemode updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update gamemode');
      }
    } catch (error) {
      console.error('❌ Update room gamemode error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update gamemode');
    }
  }, [room, isHost]);

  const startGame = useCallback(async () => {
    if (!room || !isHost) return;

    try {
      setIsLoading(true);
      const result = await GameService.startGame(room.id);
      
      if (result.success && result.room) {
        // ENHANCED: Immediate phase transition
        setRoom(result.room);
        console.log('🚀 Game started successfully');
      } else {
        throw new Error(result.error || 'Failed to start game');
      }
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

      const result = await GameService.placeCardAndAdvanceTurn(
        room.id,
        currentPlayer.id,
        song,
        position,
        []
      );

      if (!result.success) {
        // Revert optimistic update on failure
        setCurrentPlayer(currentPlayer);
        return { success: false, error: result.error };
      }

      console.log('🃏 Card placed successfully');
      return { success: true, correct: result.correct };
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
      const result = await GameService.setCurrentSong(room.id, song);
      
      if (result.success && result.room) {
        setRoom(result.room);
        console.log('🎵 Current song updated successfully');
      } else {
        throw new Error(result.error || 'Failed to set current song');
      }
    } catch (error) {
      console.error('❌ Set current song error:', error);
      setError(error instanceof Error ? error.message : 'Failed to set current song');
    }
  }, [room, isHost]);

  const assignStartingCards = useCallback(async (playerCards: Record<string, Song>) => {
    if (!room || !isHost) return;

    try {
      const result = await GameService.assignStartingCards(room.id, playerCards);
      
      if (result.success) {
        console.log('🃏 Starting cards assigned successfully');
        // Refresh players to get updated timelines
        await fetchPlayersOptimized(room.id, true);
      } else {
        throw new Error(result.error || 'Failed to assign starting cards');
      }
    } catch (error) {
      console.error('❌ Assign starting cards error:', error);
      setError(error instanceof Error ? error.message : 'Failed to assign starting cards');
    }
  }, [room, isHost, fetchPlayersOptimized]);

  const kickPlayer = useCallback(async (playerId: string): Promise<boolean> => {
    if (!room || !isHost) return false;

    try {
      const result = await GameService.kickPlayer(room.id, playerId);
      
      if (result.success) {
        console.log('👤 Player kicked successfully');
        // Refresh players immediately
        await fetchPlayersOptimized(room.id, true);
        return true;
      } else {
        throw new Error(result.error || 'Failed to kick player');
      }
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
        await GameService.leaveRoom(room.id, currentPlayer.id);
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


import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Song, Player, GameRoom, GamePhase, GameMode, GameModeSettings } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';
import { useRealtimeSubscription, ConnectionStatus } from '@/hooks/useRealtimeSubscription';

// ENHANCED: Reduced debounce for snappier updates
const PLAYER_UPDATE_DEBOUNCE = 500; // Reduced from 1500ms

// Helper function to safely convert Json to Song[]
const convertJsonToSongs = (jsonData: any): Song[] => {
  if (!Array.isArray(jsonData)) return [];
  return jsonData.filter(item => 
    item && 
    typeof item === 'object' && 
    item.id && 
    item.deezer_title
  ) as Song[];
};

// Helper function to safely convert Json to GameModeSettings
const convertJsonToGameModeSettings = (jsonData: any): GameModeSettings => {
  if (!jsonData || typeof jsonData !== 'object') return {};
  return jsonData as GameModeSettings;
};

// Helper function to safely convert database room to GameRoom
const convertDatabaseRoomToGameRoom = (dbRoom: any): GameRoom => {
  // Ensure phase is properly typed - database only has 'lobby', 'playing', 'finished'
  const validPhase = dbRoom.phase as 'lobby' | 'playing' | 'finished';
  
  return {
    id: dbRoom.id,
    lobby_code: dbRoom.lobby_code,
    host_id: dbRoom.host_id,
    host_name: dbRoom.host_name,
    phase: validPhase,
    gamemode: dbRoom.gamemode as GameMode,
    gamemode_settings: convertJsonToGameModeSettings(dbRoom.gamemode_settings),
    songs: convertJsonToSongs(dbRoom.songs),
    created_at: dbRoom.created_at,
    updated_at: dbRoom.updated_at,
    current_turn: dbRoom.current_turn,
    current_song: dbRoom.current_song ? dbRoom.current_song as Song : null,
    current_player_id: dbRoom.current_player_id
  };
};

// Helper function to safely convert Song to Json
const convertSongToJson = (song: Song): any => {
  return song as any;
};

// Helper function to safely convert Song[] to Json
const convertSongsToJson = (songs: Song[]): any => {
  return songs as any;
};

// Helper function to safely convert GameModeSettings to Json
const convertGameModeSettingsToJson = (settings: GameModeSettings): any => {
  return settings as any;
};

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
        channelName: `room-${room.id}`,
        table: 'game_rooms',
        filter: `id=eq.${room.id}`,
        onUpdate: (payload: any) => {
          console.log('🏠 REALTIME: Room updated instantly:', payload.new);
          setRoom(convertDatabaseRoomToGameRoom(payload.new));
        }
      },
      {
        channelName: `players-${room.id}`,
        table: 'players', 
        filter: `room_id=eq.${room.id}`,
        onInsert: (payload: any) => {
          console.log('👤 REALTIME: Player joined instantly:', payload.new);
          fetchPlayersOptimized(room.id, true);
        },
        onUpdate: (payload: any) => {
          console.log('👤 REALTIME: Player updated instantly:', payload.new);
          
          // CRITICAL FIX: Update currentPlayer if this update is for the current player
          if (currentPlayer && payload.new.id === currentPlayer.id) {
            console.log('🔄 REALTIME: Updating currentPlayer timeline from database:', payload.new);
            const updatedCurrentPlayer: Player = {
              id: payload.new.id,
              name: payload.new.name,
              color: payload.new.color,
              timelineColor: payload.new.timeline_color,
              score: payload.new.score,
              timeline: convertJsonToSongs(payload.new.timeline)
            };
            setCurrentPlayer(updatedCurrentPlayer);
            console.log('✅ REALTIME: currentPlayer timeline updated:', updatedCurrentPlayer.timeline.length, 'cards');
          }
          
          fetchPlayersOptimized(room.id, true);
        },
        onDelete: (payload: any) => {
          console.log('👤 REALTIME: Player left instantly:', payload.old);
          fetchPlayersOptimized(room.id, true);
        }
      }
    ];
  }, [room?.id, currentPlayer, fetchPlayersOptimized]);

  // ENHANCED: Real-time subscription with instant updates
  const { connectionStatus, forceReconnect } = useRealtimeSubscription(subscriptionConfigs);

  // ENHANCED: Optimized player fetching with rate limiting and currentPlayer restoration
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
        timeline: convertJsonToSongs(p.timeline)
      }));

      console.log('👥 Converted non-host players:', convertedPlayers);

      // ENHANCED: Immediate state update for snappy UX
      setPlayers(convertedPlayers);

      // CRITICAL FIX: Restore currentPlayer if missing but we have session data
      if (!currentPlayer && !isHost && sessionId) {
        const myPlayer = playersData.find(p => p.player_session_id === sessionId);
        if (myPlayer) {
          console.log('🔄 RESTORING currentPlayer from session:', myPlayer.name);
          const restoredPlayer: Player = {
            id: myPlayer.id,
            name: myPlayer.name,
            color: myPlayer.color,
            timelineColor: myPlayer.timeline_color,
            score: myPlayer.score,
            timeline: convertJsonToSongs(myPlayer.timeline)
          };
          setCurrentPlayer(restoredPlayer);
          console.log('✅ RESTORED: currentPlayer with timeline:', restoredPlayer.timeline.length, 'cards');
        } else {
          console.warn('⚠️ Could not find player with current session ID:', sessionId);
          
          // ENHANCED FALLBACK: Try to match by any available method
          if (playersData.length === 1) {
            console.log('🔄 FALLBACK: Only one player in room, assuming it is us');
            const fallbackPlayer: Player = {
              id: playersData[0].id,
              name: playersData[0].name,
              color: playersData[0].color,
              timelineColor: playersData[0].timeline_color,
              score: playersData[0].score,
              timeline: convertJsonToSongs(playersData[0].timeline)
            };
            setCurrentPlayer(fallbackPlayer);
            console.log('✅ FALLBACK: currentPlayer set with timeline:', fallbackPlayer.timeline.length, 'cards');
          }
        }
      } else if (currentPlayer && playersData.length > 0) {
        // ENHANCED: Update currentPlayer data if we find a newer version
        const updatedPlayerData = playersData.find(p => p.id === currentPlayer.id);
        if (updatedPlayerData) {
          const updatedPlayer: Player = {
            id: updatedPlayerData.id,
            name: updatedPlayerData.name,
            color: updatedPlayerData.color,
            timelineColor: updatedPlayerData.timeline_color,
            score: updatedPlayerData.score,
            timeline: convertJsonToSongs(updatedPlayerData.timeline)
          };
          
          // Only update if there's a meaningful change (different timeline length or score)
          if (updatedPlayer.timeline.length !== currentPlayer.timeline.length || 
              updatedPlayer.score !== currentPlayer.score) {
            console.log('🔄 SYNC: Updating currentPlayer data from database');
            setCurrentPlayer(updatedPlayer);
            console.log('✅ SYNC: currentPlayer updated with timeline:', updatedPlayer.timeline.length, 'cards, score:', updatedPlayer.score);
          }
        }
      }
      
      console.log('✅ Player list updated successfully with', convertedPlayers.length, 'players');

    } catch (error) {
      console.error('❌ Failed to fetch players:', error);
    }
  }, [currentPlayer, isHost, sessionId]);

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
      // Create room using direct Supabase calls
      // Note: lobby_code is intentionally omitted to allow the database DEFAULT 
      // generate_lobby_code() function to create the proper 5-letter + digit format
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          host_name: hostName,
          host_id: sessionId,
          phase: 'lobby',
          gamemode: 'classic',
          gamemode_settings: {},
          songs: []
        })
        .select()
        .single();

      if (roomError) throw roomError;

      setRoom(convertDatabaseRoomToGameRoom(roomData));
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
        timeline: convertJsonToSongs(playerData.timeline)
      };

      setRoom(convertDatabaseRoomToGameRoom(roomData));
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
        .update({ songs: convertSongsToJson(songs) })
        .eq('id', room.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setRoom(convertDatabaseRoomToGameRoom(data));
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
          gamemode_settings: convertGameModeSettingsToJson(settings)
        })
        .eq('id', room.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // ENHANCED: Immediate state update
      setRoom(convertDatabaseRoomToGameRoom(data));
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
      
      // Get all non-host players to assign the first current player
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room.id)
        .eq('is_host', false)
        .order('joined_at', { ascending: true });

      if (playersError) {
        throw new Error('Failed to get players for game start');
      }

      if (!allPlayers || allPlayers.length === 0) {
        throw new Error('No players available to start the game');
      }

      console.log('🎮 Starting game with players:', allPlayers.map(p => p.name));

      // CRITICAL FIX: Ensure all players are properly assigned starting data
      // Set the first player as the current player
      const firstPlayer = allPlayers[0];
      
      const { data, error } = await supabase
        .from('game_rooms')
        .update({ 
          phase: 'playing',
          current_player_id: firstPlayer.id,
          current_turn: 0
        })
        .eq('id', room.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // ENHANCED: Immediate phase transition
      setRoom(convertDatabaseRoomToGameRoom(data));
      
      // CRITICAL FIX: Force immediate player refresh to ensure all client states are synchronized
      await fetchPlayersOptimized(room.id, true);
      
      // CRITICAL FIX: Additional validation to ensure proper state transition
      setTimeout(async () => {
        console.log('🔄 VALIDATION: Checking if game state is properly synchronized...');
        await fetchPlayersOptimized(room.id, true);
        
        // Double-check that the room state is correct
        const { data: updatedRoom } = await supabase
          .from('game_rooms')
          .select('*')
          .eq('id', room.id)
          .single();
          
        if (updatedRoom) {
          setRoom(convertDatabaseRoomToGameRoom(updatedRoom));
          console.log('✅ VALIDATION: Game state synchronized successfully');
        }
      }, 1000);
      
      console.log('🚀 Game started successfully with first player:', firstPlayer.name);
      console.log('🔄 Triggering player data refresh to ensure currentPlayer assignment');
    } catch (error) {
      console.error('❌ Start game error:', error);
      setError(error instanceof Error ? error.message : 'Failed to start game');
    } finally {
      setIsLoading(false);
    }
  }, [room, isHost, fetchPlayersOptimized]);

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
          timeline: convertSongsToJson(optimisticTimeline),
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
        .update({ current_song: convertSongToJson(song) })
        .eq('id', room.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setRoom(convertDatabaseRoomToGameRoom(data));
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
          .update({ timeline: convertSongsToJson([song]) })
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

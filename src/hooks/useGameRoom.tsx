import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Song, Player, GameRoom, GamePhase, GameMode, GameModeSettings } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';
import { useRealtimeSubscription, ConnectionStatus } from '@/hooks/useRealtimeSubscription';
import { GameService } from '@/services/gameService';
import { defaultPlaylistService } from '@/services/defaultPlaylistService';

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
          console.log('REALTIME: Room updated instantly:', payload.new);
          setRoom(convertDatabaseRoomToGameRoom(payload.new));
        }
      },
      {
        channelName: `players-${room.id}`,
        table: 'players', 
        filter: `room_id=eq.${room.id}`,
        onInsert: (payload: any) => {
          console.log('REALTIME: Player joined instantly:', payload.new);
          fetchPlayersOptimized(room.id, true);
        },
        onUpdate: (payload: any) => {
          console.log('REALTIME: Player updated instantly:', payload.new);
          fetchPlayersOptimized(room.id, true);
          
          // ENHANCED: Update current player if it's our player
          if (currentPlayer && payload.new.id === currentPlayer.id) {
            console.log('REALTIME: Current player timeline updated:', payload.new.timeline);
            const updatedPlayer: Player = {
              id: payload.new.id,
              name: payload.new.name,
              color: payload.new.color,
              timelineColor: payload.new.timeline_color,
              character: payload.new.character || 'mike',
              score: payload.new.score,
              timeline: convertJsonToSongs(payload.new.timeline)
            };
            setCurrentPlayer(updatedPlayer);
          }
        },
        onDelete: (payload: any) => {
          console.log('REALTIME: Player left instantly:', payload.old);
          fetchPlayersOptimized(room.id, true);
        }
      }
    ];
  }, [room?.id, currentPlayer?.id]);

  // ENHANCED: Real-time subscription with instant updates
  const { connectionStatus, forceReconnect } = useRealtimeSubscription(subscriptionConfigs);

  // ENHANCED: Optimized player fetching with rate limiting
  const fetchPlayersOptimized = useCallback(async (roomId: string, forceUpdate = false) => {
    // Rate limiting to prevent spam
    const now = Date.now();
    if (!forceUpdate && now - lastFetchTime.current < fetchCooldown) {
      console.log('FETCH: Rate limited, skipping...');
      return;
    }
    lastFetchTime.current = now;

    console.log('FETCH: Getting players for room:', roomId, 'forceUpdate:', forceUpdate);
    
    try {
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_host', false)
        .order('joined_at', { ascending: true });

      if (playersError) {
        console.error('ERROR: Failed to fetch players:', playersError);
        return;
      }

      console.log('FETCH: Raw non-host players from database:', playersData);

      // Convert to Player format with proper type casting
      const convertedPlayers: Player[] = playersData.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        timelineColor: p.timeline_color,
        character: p.character || 'mike', // Default to mike if not set
        score: p.score,
        timeline: convertJsonToSongs(p.timeline)
      }));

      console.log('FETCH: Converted non-host players:', convertedPlayers);

      // Immediate state update for responsive UX
      setPlayers(convertedPlayers);
      console.log('SUCCESS: Player list updated with', convertedPlayers.length, 'players');

    } catch (error) {
      console.error('ERROR: Failed to fetch players:', error);
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
      // Generate proper lobby code format (WORD + NUMBER) using database function
      const { data: codeData, error: codeError } = await supabase.rpc('generate_lobby_code');
      
      if (codeError) throw codeError;
      
      // Create room with generated lobby code
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          host_name: hostName,
          host_id: sessionId,
          lobby_code: codeData,
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
      console.log('SUCCESS: Room created with lobby code:', roomData.lobby_code);
      return roomData.lobby_code;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create room';
      console.error('ERROR: Create room failed:', errorMessage);
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
          character: 'mike', // Default character
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
        character: playerData.character,
        score: playerData.score,
        timeline: convertJsonToSongs(playerData.timeline)
      };

      setRoom(convertDatabaseRoomToGameRoom(roomData));
      setCurrentPlayer(player);
      setIsHost(false);
      
      // ENHANCED: If game is already playing, fetch the current player's timeline
      if (roomData.phase === 'playing') {
        console.log('🔄 JOIN: Game already in progress, fetching current timeline...');
        // Refresh player data after joining
        setTimeout(() => {
          fetchCurrentPlayerTimeline(player.id);
        }, 1000);
      }
      
      console.log('SUCCESS: Joined room successfully:', lobbyCode);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join room';
      console.error('ERROR: Join room failed:', errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // NEW: Function to fetch current player's timeline
  const fetchCurrentPlayerTimeline = useCallback(async (playerId: string) => {
    if (!playerId) return;
    
    try {
      console.log('🔄 TIMELINE: Fetching timeline for player:', playerId);
      
      const { data: playerData, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();
        
      if (error) throw error;
      
      console.log('🔄 TIMELINE: Raw player data from database:', playerData);
      console.log('🔄 TIMELINE: Timeline field:', playerData.timeline);
      
      const updatedPlayer: Player = {
        id: playerData.id,
        name: playerData.name,
        color: playerData.color,
        timelineColor: playerData.timeline_color,
        character: playerData.character || 'mike',
        score: playerData.score,
        timeline: convertJsonToSongs(playerData.timeline)
      };
      
      console.log('🔄 TIMELINE: Converted player timeline:', updatedPlayer.timeline);
      setCurrentPlayer(updatedPlayer);
      
    } catch (error) {
      console.error('ERROR: Failed to fetch player timeline:', error);
    }
  }, []);

  const updatePlayer = useCallback(async (updates: Partial<Pick<Player, 'name' | 'color' | 'character'>>) => {
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
          timeline_color: updates.color,
          character: updates.character
        })
        .eq('id', currentPlayer.id);
      
      if (error) {
        // Revert on failure
        setCurrentPlayer(currentPlayer);
        throw error;
      }
      
      console.log('SUCCESS: Player updated successfully');
    } catch (error) {
      console.error('ERROR: Update player failed:', error);
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
      console.log('SUCCESS: Room songs updated successfully');
    } catch (error) {
      console.error('ERROR: Update room songs failed:', error);
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
      console.log('SUCCESS: Room gamemode updated successfully');
      return true;
    } catch (error) {
      console.error('ERROR: Update room gamemode failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to update gamemode');
      return false;
    }
  }, [room, isHost]);

  const startGame = useCallback(async () => {
    if (!room || !isHost) return;

    try {
      setIsLoading(true);
      console.log('🎮 HOST: Starting game initialization...');

      // Step 1: Load songs for the game
      console.log('🎵 INIT: Loading songs for game...');
      const gamePlaylistSongs = await defaultPlaylistService.loadOptimizedGameSongs(20);
      
      if (gamePlaylistSongs.length < 8) {
        throw new Error(`Not enough songs available (${gamePlaylistSongs.length}/8 minimum)`);
      }

      console.log(`🎵 INIT: Loaded ${gamePlaylistSongs.length} songs successfully`);

      // Step 2: Initialize game with starting cards and mystery card
      console.log('🚀 INIT: Initializing game with starting cards...');
      const initialMysteryCard = await GameService.initializeGameWithStartingCards(room.id, gamePlaylistSongs);
      
      console.log('✅ INIT: Game initialized successfully with mystery card:', initialMysteryCard.deezer_title);
      
      // Refresh players to get updated timelines
      await fetchPlayersOptimized(room.id, true);
      
      console.log('🎮 HOST: Game initialization completed successfully');
    } catch (error) {
      console.error('❌ HOST: Game initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start game';
      setError(errorMessage);
      
      toast({
        title: "Game Start Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [room, isHost, toast, fetchPlayersOptimized]);

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

      console.log('SUCCESS: Card placed successfully');
      return { success: true, correct: true };
    } catch (error) {
      // Revert optimistic update on error
      setCurrentPlayer(currentPlayer);
      console.error('ERROR: Place card failed:', error);
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
      console.log('SUCCESS: Current song updated successfully');
    } catch (error) {
      console.error('ERROR: Set current song failed:', error);
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
      
      console.log('SUCCESS: Starting cards assigned successfully');
      // Refresh players to get updated timelines
      await fetchPlayersOptimized(room.id, true);
    } catch (error) {
      console.error('ERROR: Assign starting cards failed:', error);
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
      
      console.log('SUCCESS: Player kicked successfully');
      // Refresh players immediately
      await fetchPlayersOptimized(room.id, true);
      return true;
    } catch (error) {
      console.error('ERROR: Kick player failed:', error);
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
      
      console.log('SUCCESS: Left room successfully');
    } catch (error) {
      console.error('ERROR: Leave room failed:', error);
    }
  }, [room, currentPlayer]);

  // ENHANCED: Expose the timeline refresh function
  const refreshCurrentPlayerTimeline = useCallback(() => {
    if (currentPlayer?.id) {
      fetchCurrentPlayerTimeline(currentPlayer.id);
    }
  }, [currentPlayer?.id, fetchCurrentPlayerTimeline]);

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
    kickPlayer: isHost ? kickPlayer : undefined,
    refreshCurrentPlayerTimeline
  };
}

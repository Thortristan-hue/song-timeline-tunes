
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

  // ENHANCED: Optimized player fetching with rate limiting and currentPlayer restoration
  const fetchPlayersOptimized = useCallback(async (roomId: string, forceUpdate = false) => {
    // Rate limiting to prevent spam
    const now = Date.now();
    if (!forceUpdate && now - lastFetchTime.current < fetchCooldown) {
      console.log('🚫 Fetch rate limited, skipping...');
      return;
    }
    lastFetchTime.current = now;

    console.log('🔍 ENHANCED FETCH: Fetching players for room:', roomId, 'forceUpdate:', forceUpdate);
    
    try {
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_host', false)
        .order('joined_at', { ascending: true });

      if (playersError) {
        console.error('❌ FETCH ERROR: Error fetching players:', playersError);
        setError(`Failed to fetch players: ${playersError.message}`);
        return;
      }

      console.log('👥 FETCH SUCCESS: Raw non-host players from DB:', {
        count: playersData?.length || 0,
        players: playersData?.map(p => ({ id: p.id, name: p.name, session: p.player_session_id })) || []
      });

      // CRITICAL FIX: Handle empty players array
      if (!playersData) {
        console.warn('⚠️ FETCH WARNING: No players data returned from database');
        setPlayers([]);
        return;
      }

      // Convert to Player format with proper type casting
      const convertedPlayers: Player[] = playersData.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        timelineColor: p.timeline_color,
        score: p.score,
        timeline: convertJsonToSongs(p.timeline)
      }));

      console.log('👥 FETCH CONVERTED: Converted non-host players:', {
        count: convertedPlayers.length,
        players: convertedPlayers.map(p => ({ id: p.id, name: p.name, score: p.score, timelineLength: p.timeline.length }))
      });

      // ENHANCED: Immediate state update for snappy UX
      setPlayers(convertedPlayers);

      // CRITICAL FIX: Restore currentPlayer if missing but we have session data
      if (!currentPlayer && !isHost && sessionId) {
        const myPlayer = playersData.find(p => p.player_session_id === sessionId);
        if (myPlayer) {
          console.log('🔄 RESTORING: currentPlayer from session:', {
            id: myPlayer.id,
            name: myPlayer.name,
            session: myPlayer.player_session_id
          });
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
          console.warn('⚠️ RESTORE WARNING: Could not find player with current session ID:', sessionId);
          
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
          } else if (playersData.length === 0) {
            console.error('🚨 CRITICAL: No players found in room during fetch');
            setError('No players found in the game room. Please rejoin the game.');
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
      
      console.log('✅ FETCH COMPLETE: Player list updated successfully with', convertedPlayers.length, 'players');

    } catch (error) {
      console.error('❌ FETCH CATCH: Failed to fetch players:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch players');
    }
  }, [isHost, sessionId, currentPlayer]);

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
    if (!room || !isHost) {
      console.error('🚨 START GAME ERROR: Missing room or not host', { hasRoom: !!room, isHost });
      setError('Cannot start game: missing room or insufficient permissions');
      return;
    }

    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      
      console.log('🎮 GAME START: Initiating game start sequence for room:', room.id);
      
      // CRITICAL FIX: Get all non-host players with enhanced validation
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room.id)
        .eq('is_host', false)
        .order('joined_at', { ascending: true });

      if (playersError) {
        console.error('🚨 PLAYERS FETCH ERROR:', playersError);
        throw new Error(`Failed to get players for game start: ${playersError.message}`);
      }

      // CRITICAL FIX: Enhanced player validation with detailed logging
      if (!allPlayers || allPlayers.length === 0) {
        console.error('🚨 NO PLAYERS ERROR:', { 
          allPlayers, 
          roomId: room.id, 
          currentPlayersState: players.length 
        });
        throw new Error(`No players available to start the game. Room: ${room.lobby_code}`);
      }

      console.log('🎮 GAME START: Validated players for game start:', {
        playersCount: allPlayers.length,
        players: allPlayers.map(p => ({ id: p.id, name: p.name, session: p.player_session_id }))
      });

      // CRITICAL FIX: Enhanced player assignment with validation
      const firstPlayer = allPlayers[0];
      
      if (!firstPlayer.id || !firstPlayer.name) {
        console.error('🚨 INVALID PLAYER ERROR:', firstPlayer);
        throw new Error('Invalid first player data - missing ID or name');
      }

      console.log('🎮 GAME START: Assigning first player:', {
        id: firstPlayer.id,
        name: firstPlayer.name,
        totalPlayers: allPlayers.length
      });
      
      // CRITICAL FIX: Update room with comprehensive error handling
      const { data: updatedRoom, error: updateError } = await supabase
        .from('game_rooms')
        .update({ 
          phase: 'playing',
          current_player_id: firstPlayer.id,
          current_turn: 0
        })
        .eq('id', room.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('🚨 ROOM UPDATE ERROR:', updateError);
        throw new Error(`Failed to update room phase: ${updateError.message}`);
      }

      if (!updatedRoom) {
        console.error('🚨 NO ROOM DATA ERROR: Update succeeded but no data returned');
        throw new Error('Room update succeeded but no data returned');
      }
      
      // ENHANCED: Immediate state updates with validation
      const convertedRoom = convertDatabaseRoomToGameRoom(updatedRoom);
      setRoom(convertedRoom);
      
      console.log('🚀 GAME START: Room phase updated successfully:', {
        roomId: updatedRoom.id,
        phase: updatedRoom.phase,
        currentPlayerId: updatedRoom.current_player_id,
        playersCount: allPlayers.length
      });
      
      // CRITICAL FIX: Force immediate player refresh with retry logic
      console.log('🔄 GAME START: Forcing player state synchronization...');
      await fetchPlayersOptimized(room.id, true);
      
      // CRITICAL FIX: Additional validation with enhanced error handling
      setTimeout(async () => {
        try {
          console.log('🔄 VALIDATION: Post-start state verification...');
          
          // Refresh players again to ensure synchronization
          await fetchPlayersOptimized(room.id, true);
          
          // Double-check room state
          const { data: finalRoom, error: checkError } = await supabase
            .from('game_rooms')
            .select('*')
            .eq('id', room.id)
            .single();
            
          if (checkError) {
            console.error('🚨 VALIDATION ERROR: Failed to verify room state:', checkError);
            setError(`Game started but verification failed: ${checkError.message}`);
            return;
          }
          
          if (!finalRoom) {
            console.error('🚨 VALIDATION ERROR: Room no longer exists after start');
            setError('Game started but room disappeared during verification');
            return;
          }
          
          if (finalRoom.phase !== 'playing') {
            console.error('🚨 VALIDATION ERROR: Room phase not playing after start:', finalRoom.phase);
            setError(`Game start incomplete: phase is ${finalRoom.phase} instead of playing`);
            return;
          }
          
          setRoom(convertDatabaseRoomToGameRoom(finalRoom));
          console.log('✅ VALIDATION: Game state fully synchronized and verified', {
            phase: finalRoom.phase,
            currentPlayerId: finalRoom.current_player_id,
            playersInState: players.length
          });
        } catch (validationError) {
          console.error('🚨 VALIDATION CATCH: Error during post-start validation:', validationError);
          setError('Game started but post-validation failed');
        }
      }, 1500); // Increased delay for better reliability
      
      console.log('🚀 GAME START: Successfully initiated with first player:', firstPlayer.name);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start game';
      console.error('🚨 START GAME CATCH: Critical error during game start:', {
        error: errorMessage,
        roomId: room?.id,
        lobbyCode: room?.lobby_code,
        playersCount: players.length
      });
      setError(`Game start failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [room, isHost, fetchPlayersOptimized, players.length]);

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
    if (!room || !isHost) {
      console.log('🎵 PATCH: Cannot set current song - missing room or not host', { 
        hasRoom: !!room, 
        isHost, 
        roomId: room?.id 
      });
      return;
    }

    try {
      console.log('🎵 PATCH: Attempting to update current_song', {
        roomId: room.id,
        songTitle: song.deezer_title,
        songArtist: song.deezer_artist
      });

      const { data, error } = await supabase
        .from('game_rooms')
        .update({ current_song: convertSongToJson(song) })
        .eq('id', room.id)
        .select()
        .single();
      
      if (error) {
        console.error('🎵 PATCH ERROR: Failed to update current_song', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          roomId: room.id
        });
        throw error;
      }

      if (!data) {
        console.error('🎵 PATCH ERROR: No data returned from update (PGRST116 - 0 rows updated)', {
          roomId: room.id,
          queryCondition: `id = ${room.id}`
        });
        
        // Verify the room still exists
        const { data: existingRoom, error: checkError } = await supabase
          .from('game_rooms')
          .select('id, lobby_code')
          .eq('id', room.id)
          .single();
          
        if (checkError || !existingRoom) {
          console.error('🎵 PATCH VERIFICATION: Room no longer exists', {
            roomId: room.id,
            checkError: checkError?.message
          });
          setError('Game room no longer exists. Please create a new game.');
          return;
        } else {
          console.log('🎵 PATCH VERIFICATION: Room exists but update failed', {
            existingRoom,
            roomId: room.id
          });
        }
        
        throw new Error(`Failed to update current song: no rows were updated (room ID: ${room.id})`);
      }
      
      setRoom(convertDatabaseRoomToGameRoom(data));
      console.log('🎵 PATCH SUCCESS: Current song updated successfully', {
        roomId: room.id,
        newSong: song.deezer_title
      });
    } catch (error) {
      console.error('🎵 PATCH CATCH: Set current song error:', error);
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

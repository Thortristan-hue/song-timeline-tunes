import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Song, Player, GameRoom, GameMode, GameModeSettings } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';
import { GameService } from '@/services/gameService';
import { useRealtimeSubscription, SubscriptionConfig } from '@/hooks/useRealtimeSubscription';
import { useWebSocketGameSync } from '@/hooks/useWebSocketGameSync';
import { getDefaultCharacter } from '@/constants/characters';
import type { Json } from '@/integrations/supabase/types';

interface DatabasePlayer {
  id: string;
  name: string;
  color: string;
  timeline_color: string;
  score: number;
  timeline: Json;
  room_id: string;
  character?: string;
  created_at?: string;
}

interface DatabaseGameRoom {
  id: string;
  lobby_code: string;
  host_id: string;
  host_name: string;
  phase: string;
  gamemode?: string;
  gamemode_settings?: GameModeSettings;
  songs: Song[];
  current_turn?: number;
  current_song?: Song | null;
  current_player_id?: string;
  created_at: string;
  updated_at: string;
}

export function useGameRoom() {
  const { toast } = useToast();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionConfigs, setSubscriptionConfigs] = useState<SubscriptionConfig[]>([]);
  const [gameInitialized, setGameInitialized] = useState(false);

  const hostSessionId = useRef<string | null>(null);
  const playerSessionId = useRef<string | null>(null);
  const lastFetchTime = useRef<number>(0);
  const isInitialFetch = useRef<boolean>(true);

  // Convert database player to frontend player
  const convertPlayer = useCallback((dbPlayer: DatabasePlayer): Player => {
    return {
      id: dbPlayer.id,
      name: dbPlayer.name,
      color: dbPlayer.color,
      timelineColor: dbPlayer.timeline_color,
      score: dbPlayer.score || 0,
      timeline: Array.isArray(dbPlayer.timeline) ? dbPlayer.timeline as unknown as Song[] : [],
      character: dbPlayer.character || getDefaultCharacter().id
    };
  }, []);

  // Fetch players for a room (ONLY non-host players) with improved debouncing
  const fetchPlayers = useCallback(async (roomId: string, forceUpdate = false) => {
    const now = Date.now();
    
    // Prevent rapid successive fetches unless forced or it's been a while
    if (!forceUpdate && !isInitialFetch.current && (now - lastFetchTime.current) < 1000) {
      console.log('⚡ Skipping fetch - too soon since last fetch');
      return;
    }
    
    lastFetchTime.current = now;
    isInitialFetch.current = false;

    try {
      console.log('🔍 Fetching players for room:', roomId, 'forceUpdate:', forceUpdate);
      
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_host', false)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching players:', error);
        throw error;
      }

      console.log('👥 Raw non-host players from DB:', data);
      
      // Only bail out if we have no data at all
      if (!data) {
        console.log('⚠️ No player data received, keeping current players');
        return;
      }
      
      const convertedPlayers = data.map(convertPlayer);
      console.log('👥 Converted non-host players:', convertedPlayers);
      
      // More sophisticated change detection
      const currentPlayerIds = players.map(p => p.id).sort();
      const newPlayerIds = convertedPlayers.map(p => p.id).sort();
      const hasPlayerListChanged = JSON.stringify(currentPlayerIds) !== JSON.stringify(newPlayerIds);
      
      if (!forceUpdate && !hasPlayerListChanged) {
        console.log('⚡ Player list unchanged, skipping update');
        return;
      }
      
      // Update players list
      setPlayers(convertedPlayers);
      console.log('✅ Player list updated successfully with', convertedPlayers.length, 'players');

      // Broadcast player update via WebSocket
      broadcastPlayerUpdate(convertedPlayers);

      // Update current player if we have one (only for non-host players)
      if (playerSessionId.current && !isHost) {
        const current = convertedPlayers.find(p => 
          data.find(dbP => dbP.id === p.id && dbP.player_session_id === playerSessionId.current)
        );
        if (current) {
          console.log('🎯 Updated current player:', current);
          setCurrentPlayer(current);
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch players:', error);
      // Don't clear players on error to prevent unwanted kicks
    }
  }, [convertPlayer, isHost, players]);

  // Setup realtime subscription with retry logic
  const { connectionStatus, forceReconnect } = useRealtimeSubscription(subscriptionConfigs);

  // Create stable callback for GAME_STARTED to avoid re-subscriptions
  const handleGameStarted = useCallback((data: { room?: { id?: string; phase?: string; songs?: Song[]; [key: string]: any }; timestamp?: number }) => {
    console.log('🎮 WebSocket GAME_STARTED received - inspecting payload:', {
      hasRoom: !!data.room,
      roomId: data.room?.id,
      roomPhase: data.room?.phase,
      songsCount: data.room?.songs?.length || 0,
      timestamp: data.timestamp,
      currentRoomId: room?.id,
      isHost,
      connectionStatus: connectionStatus.isConnected
    });
    
    // GUARD: Only apply transition if we have valid room data
    if (!data.room || !data.room.id) {
      console.warn('⚠️ GAME_STARTED: Invalid or missing room data - ignoring transition');
      return;
    }

    // GUARD: Only apply transition if this is for our current room
    if (room && data.room.id !== room.id) {
      console.warn('⚠️ GAME_STARTED: Room ID mismatch - ignoring stale transition', {
        receivedRoomId: data.room.id,
        currentRoomId: room.id
      });
      return;
    }

    // GUARD: Ensure backend confirms room is in started/in-progress phase
    if (data.room.phase !== 'playing') {
      console.warn('⚠️ GAME_STARTED: Backend room phase is not "playing" - blocking transition', {
        backendPhase: data.room.phase,
        expected: 'playing'
      });
      return;
    }

    // GUARD: For non-hosts, ensure we have a realtime connection
    if (!isHost && !connectionStatus.isConnected) {
      console.warn('⚠️ GAME_STARTED: Non-host without realtime connection - blocking transition to prevent desynced state', {
        isHost,
        realtimeConnected: connectionStatus.isConnected
      });
      return;
    }

    console.log('✅ GAME_STARTED: All guards passed - applying room transition to playing phase');
    
    // Merge room state intelligently to prevent stale overwrites
    setRoom(prev => {
      if (!prev) {
        console.log('🎮 GAME_STARTED: Creating new room from WebSocket data');
        return {
          id: data.room!.id,
          lobby_code: data.room!.lobby_code || '',
          host_id: data.room!.host_id || '',
          host_name: data.room!.host_name || '',
          phase: 'playing' as const,
          gamemode: data.room!.gamemode || 'classic',
          gamemode_settings: data.room!.gamemode_settings || {},
          songs: data.room!.songs || [],
          created_at: data.room!.created_at || new Date().toISOString(),
          updated_at: data.room!.updated_at || new Date().toISOString(),
          current_turn: data.room!.current_turn,
          current_song: data.room!.current_song || null,
          current_player_id: data.room!.current_player_id
        };
      }

      console.log('🎮 GAME_STARTED: Merging room state - preserving local data where possible');
      return {
        ...prev,
        phase: 'playing' as const, // Force phase transition
        songs: data.room!.songs || prev.songs, // Update songs if provided
        current_turn: data.room!.current_turn ?? prev.current_turn,
        current_song: data.room!.current_song ?? prev.current_song,
        current_player_id: data.room!.current_player_id ?? prev.current_player_id,
        updated_at: new Date().toISOString()
      };
    });

    setGameInitialized(true);
    setIsLoading(false);
    console.log('✅ Game synchronized via WebSocket - phase set to playing with', data.room.songs?.length || 0, 'songs');
    
    // CRITICAL FIX: Force refresh player data to show timeline cards after game starts
    if (data.room.id) {
      console.log('🔄 Force refreshing player data after game start...');
      fetchPlayers(data.room.id, true);
    }
  }, [fetchPlayers, room, isHost, connectionStatus.isConnected]);

  // Setup WebSocket sync
  const {
    syncState: wsState,
    broadcastPlayerUpdate,
    broadcastGameStart,
    broadcastCardPlaced,
    broadcastSongSet,
    sendHostSetSongs,
    setHostStatus,
    forceReconnect: wsReconnect
  } = useWebSocketGameSync(
    room?.id || null,
    (roomData) => {
      console.log('🔄 WebSocket room update:', roomData);
      setRoom(prev => prev ? { ...prev, ...roomData } : null);
    },
    (playersData) => {
      console.log('👥 WebSocket players update:', playersData);
      if (Array.isArray(playersData)) {
        setPlayers(playersData);
      }
    },
    () => {
      console.log('🎮 WebSocket game start signal received');
      // Game start will be handled by room phase changes
    },
    (cardData) => {
      console.log('🃏 WebSocket card placed:', cardData);
      // Handle card placement updates
    },
    (song) => {
      console.log('🎵 WebSocket song set:', song);
      setRoom(prev => prev ? { ...prev, current_song: song } : null);
    },
    handleGameStarted
  );

  // Generate session ID
  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  // Generate lobby code with word + digit format (e.g., 'APPLE3', 'TRACK7')
  const generateLobbyCode = () => {
    const words = [
      'APPLE', 'TRACK', 'MUSIC', 'DANCE', 'PARTY', 'SOUND', 'BEATS', 'PIANO', 'DRUMS', 'VOICE',
      'STAGE', 'TEMPO', 'CHORD', 'BANDS', 'REMIX', 'VINYL', 'RADIO', 'SONGS', 'ALBUM', 'DISCO',
      'BLUES', 'SWING', 'FORTE', 'SHARP', 'MINOR', 'MAJOR', 'SCALE', 'NOTES', 'LYRIC', 'VERSE',
      'CHOIR', 'ORGAN', 'FLUTE', 'CELLO', 'TENOR', 'OPERA'
    ];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const randomDigit = Math.floor(Math.random() * 10);
    return `${randomWord}${randomDigit}`;
  };

  // Setup subscription configurations when room is available - STABILIZED
  useEffect(() => {
    if (!room?.id) {
      console.log('🔄 No room ID, clearing subscription configs');
      setSubscriptionConfigs([]);
      return;
    }

    // Only setup subscriptions once per room
    console.log('🔄 Setting up subscription configs for room:', room.id);

    const configs: SubscriptionConfig[] = [
      {
        channelName: `room-${room.id}`,
        table: 'game_rooms',
        filter: `id=eq.${room.id}`,
        onUpdate: (payload) => {
          console.log('🔄 SYNC: Room updated with turn/mystery card:', payload.new);
          const roomData = payload.new as DatabaseGameRoom;
          
          // CRITICAL FIX: Properly cast current_song from Json to Song and preserve lobby phase
          let currentSong: Song | null = null;
          if (roomData.current_song) {
            // Cast from Json to Song with proper type assertion
            currentSong = roomData.current_song as unknown as Song;
          }
          console.log('🎵 SYNC: Mystery card from database:', currentSong?.deezer_title || 'undefined');
          
          // CRITICAL: Preserve existing local state where possible to prevent kicks
          setRoom(prevRoom => {
            if (!prevRoom) return null;
            
            const updatedRoom = {
              ...prevRoom,
              lobby_code: roomData.lobby_code,
              host_id: roomData.host_id,
              host_name: roomData.host_name || prevRoom.host_name,
              phase: roomData.phase as 'lobby' | 'playing' | 'finished',
              gamemode: (roomData.gamemode as GameMode) || prevRoom.gamemode,
              gamemode_settings: (roomData.gamemode_settings as GameModeSettings) || prevRoom.gamemode_settings,
              songs: Array.isArray(roomData.songs) ? roomData.songs as unknown as Song[] : prevRoom.songs,
              created_at: roomData.created_at,
              updated_at: roomData.updated_at,
              current_turn: roomData.current_turn ?? prevRoom.current_turn,
              current_song: currentSong ?? prevRoom.current_song,
              current_player_id: roomData.current_player_id ?? prevRoom.current_player_id
            };

            // REMOVED: Client-side room update broadcasting - only server should send authoritative updates
            
            return updatedRoom;
          });

          // Fix loading screen - mark game as initialized when room transitions to playing
          if (roomData.phase === 'playing' && !gameInitialized) {
            console.log('✅ Game initialized - hiding loading screen');
            setGameInitialized(true);
            setIsLoading(false);
          }
        },
        onError: (error) => {
          console.error('❌ Room subscription error:', error);
          setError('Connection issue with game room. Retrying...');
        }
      },
      {
        channelName: `room-${room.id}`,
        table: 'players',
        filter: `room_id=eq.${room.id}`,
        onUpdate: (payload) => {
          console.log('🎮 Player change detected:', payload);
          // Much longer debounce to prevent subscription loops
          setTimeout(() => {
            fetchPlayers(room.id, false);
          }, 1500); // Increased from 500ms to 1500ms
        },
        onError: (error) => {
          console.error('❌ Players subscription error:', error);
        }
      }
    ];

    setSubscriptionConfigs(configs);

    // Initial fetch only once when room is first established
    if (isInitialFetch.current) {
      console.log('🔄 Initial player fetch for room:', room.id);
      fetchPlayers(room.id, true);
    }
  }, [room?.id, gameInitialized, fetchPlayers]);

  const createRoom = useCallback(async (hostName: string, gamemode: GameMode = 'classic', gamemodeSettings: GameModeSettings = {}): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      setGameInitialized(false);

      const sessionId = generateSessionId();
      hostSessionId.current = sessionId;

      console.log('🏠 Creating room with host session ID:', sessionId, 'gamemode:', gamemode);

      // Try to use database function for lobby code generation with uniqueness checking
      let lobbyCode: string;
      try {
        const { data: dbCodeResult, error: codeError } = await supabase.rpc('generate_lobby_code');
        if (codeError || !dbCodeResult) {
          console.log('⚠️ Database lobby code generation failed, using client fallback');
          lobbyCode = generateLobbyCode();
        } else {
          lobbyCode = dbCodeResult;
          console.log('✅ Using database-generated lobby code:', lobbyCode);
        }
      } catch (error) {
        console.log('⚠️ Database lobby code generation error, using client fallback:', error);
        lobbyCode = generateLobbyCode();
      }

      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          lobby_code: lobbyCode,
          host_id: sessionId,
          host_name: hostName,
          phase: 'lobby',
          gamemode: gamemode,
          gamemode_settings: gamemodeSettings as unknown as Json
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Room created successfully:', data);

      const newRoom = {
        id: data.id,
        lobby_code: data.lobby_code,
        host_id: data.host_id,
        host_name: data.host_name || hostName,
        phase: data.phase as 'lobby' | 'playing' | 'finished',
        gamemode: (data.gamemode as GameMode) || 'classic',
        gamemode_settings: (data.gamemode_settings as GameModeSettings) || {},
        songs: Array.isArray(data.songs) ? data.songs as unknown as Song[] : [],
        created_at: data.created_at,
        updated_at: data.updated_at,
        current_turn: data.current_turn,
        current_song: data.current_song ? data.current_song as unknown as Song : null
      };

      setRoom(newRoom);

      // Create a virtual host player for local use only (not stored in database)
      const hostPlayer: Player = {
        id: `host-${sessionId}`,
        name: hostName,
        color: '#FF6B6B',
        timelineColor: '#FF8E8E',
        score: 0,
        timeline: [],
        character: getDefaultCharacter().id
      };

      setCurrentPlayer(hostPlayer);
      setIsHost(true);
      setHostStatus(true); // Set WebSocket host status
      isInitialFetch.current = true;
      return data.lobby_code;
    } catch (error) {
      console.error('❌ Failed to create room:', error);
      setError('Failed to create room');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (lobbyCode: string, playerName: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      setGameInitialized(false);

      console.log('🎮 Attempting to join room with code:', lobbyCode);

      // Validate lobby code format
      const lobbyCodeRegex = /^[A-Z]{5}[0-9]$/;
      if (!lobbyCodeRegex.test(lobbyCode)) {
        console.error('❌ Invalid lobby code format:', lobbyCode);
        throw new Error('Invalid lobby code format');
      }

      // First, find the room
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('lobby_code', lobbyCode)
        .single();

      if (roomError || !roomData) {
        console.error('❌ Room not found:', roomError);
        throw new Error('Room not found');
      }

      console.log('✅ Room found:', roomData);

      // Generate colors for the player
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
      ];
      const timelineColors = [
        '#FF8E8E', '#5DEDE5', '#58C4E0', '#A8D8C8', '#FFE9B8',
        '#E8B7E8', '#AAE0D1', '#F9E07F', '#C8A2D0', '#97CEF0'
      ];

      const sessionId = generateSessionId();
      playerSessionId.current = sessionId;

      console.log('🎮 Creating player with session ID:', sessionId);

      // Create player (explicitly set is_host to false)
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert({
          room_id: roomData.id,
          player_session_id: sessionId,
          name: playerName,
          color: colors[Math.floor(Math.random() * colors.length)],
          timeline_color: timelineColors[Math.floor(Math.random() * timelineColors.length)],
          score: 0,
          timeline: [],
          is_host: false,
          character: getDefaultCharacter().id
        })
        .select()
        .single();

      if (playerError) {
        console.error('❌ Failed to create player:', playerError);
        throw playerError;
      }

      console.log('✅ Player created successfully:', playerData);

      const newRoom = {
        id: roomData.id,
        lobby_code: roomData.lobby_code,
        host_id: roomData.host_id,
        host_name: roomData.host_name || '',
        phase: roomData.phase as 'lobby' | 'playing' | 'finished',
        gamemode: (roomData.gamemode as GameMode) || 'classic',
        gamemode_settings: (roomData.gamemode_settings as GameModeSettings) || {},
        songs: Array.isArray(roomData.songs) ? roomData.songs as unknown as Song[] : [],
        created_at: roomData.created_at,
        updated_at: roomData.updated_at,
        current_turn: roomData.current_turn,
        current_song: roomData.current_song ? roomData.current_song as unknown as Song : null
      };

      setRoom(newRoom);
      setCurrentPlayer(convertPlayer(playerData));
      setIsHost(false);
      isInitialFetch.current = true;

      if (roomData.phase === 'playing') {
        setGameInitialized(true);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to join room:', error);
      setError(error instanceof Error ? error.message : 'Failed to join room');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [convertPlayer]);

  const startGame = useCallback(async (availableSongs?: Song[]): Promise<boolean> => {
    if (!room || !isHost) {
      console.warn('⚠️ Cannot start game:', { hasRoom: !!room, isHost });
      return false;
    }

    try {
      console.log('🎯 Host starting game - checking prerequisites...', {
        roomId: room.id,
        roomPhase: room.phase,
        isHost,
        wsReady: wsState.isReady,
        wsConnected: wsState.isConnected,
        players: players.length
      });

      // GUARD: Ensure WebSocket is ready before proceeding
      if (!wsState.isReady || !wsState.isConnected) {
        console.warn('⚠️ WebSocket not ready - cannot start game reliably', {
          isReady: wsState.isReady,
          isConnected: wsState.isConnected
        });
        throw new Error('Connection not ready. Please wait and try again.');
      }

      setIsLoading(true);
      setGameInitialized(false);
      
      let songsToUse = availableSongs;
      
      // If no songs provided, fetch them from the playlist service
      if (!songsToUse || songsToUse.length === 0) {
        console.log('🎵 No songs provided, fetching from playlist service...');
        const { defaultPlaylistService } = await import('@/services/defaultPlaylistService');
        songsToUse = await defaultPlaylistService.loadOptimizedGameSongs(20);
        
        if (songsToUse.length === 0) {
          throw new Error('No songs with valid previews found after trying multiple songs');
        }

        if (songsToUse.length < 8) {
          throw new Error(`Only ${songsToUse.length} songs with valid audio previews found. Need at least 8 songs for game start.`);
        }

        console.log(`🎯 RESILIENT RESULT: ${songsToUse.length} songs with previews after processing`);
      }
      
      // Use database-driven game initialization
      if (songsToUse && songsToUse.length > 0) {
        console.log('[GameState] Initializing game with database updates...');
        
        // Use database as source of truth - initialize via GameService
        const { GameService } = await import('@/services/gameService');
        
        // Initialize the game with songs and set phase to playing
        await GameService.initializeGameWithStartingCards(room.id, songsToUse);
        
        // Update room phase to playing in database - this will trigger realtime updates
        const { error: phaseError } = await supabase
          .from('game_rooms')
          .update({ 
            phase: 'playing',
            songs: songsToUse as unknown as Json,
            updated_at: new Date().toISOString()
          })
          .eq('id', room.id);

        if (phaseError) {
          console.error('[GameState] Failed to update room phase:', phaseError);
          throw new Error('Failed to start game - database update failed');
        }
        
        console.log('[GameState] Game initialization completed - realtime will propagate changes');
      } else {
        console.log('⚠️ No songs available, cannot start game');
        throw new Error('No songs available for game start');
      }
      
      console.log('✅ Game start process initiated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to start game:', error);
      setIsLoading(false);
      throw error; // Re-throw to let caller handle the error
    }
  }, [room, isHost, sendHostSetSongs, hostSessionId, wsState, players]);

  const placeCard = useCallback(async (song: Song, position: number, availableSongs: Song[] = []): Promise<{ success: boolean; correct?: boolean }> => {
    if (!currentPlayer || !room) {
      console.error('Cannot place card: missing currentPlayer or room');
      return { success: false };
    }

    try {
      console.log('🃏 Using correct GameService method for card placement');
      
      const result = await GameService.placeCardAndAdvanceTurn(room.id, currentPlayer.id, song, position, availableSongs);
      
      if (result.success) {
        console.log('✅ Card placed and turn advanced successfully');
        // Broadcast card placement via WebSocket
        broadcastCardPlaced({ playerId: currentPlayer.id, song, position, correct: result.correct });
        return { success: true, correct: result.correct };
      } else {
        console.error('❌ Card placement failed:', result.error);
        return { success: false };
      }
    } catch (error) {
      console.error('Failed to place card:', error);
      return { success: false };
    }
  }, [currentPlayer, room]);

  const updatePlayer = useCallback(async (updates: Partial<Player>): Promise<boolean> => {
    if (!currentPlayer) return false;

    try {
      // Skip database update if this is the host
      if (!isHost) {
        const { error } = await supabase
          .from('players')
          .update({
            name: updates.name,
            color: updates.color,
            timeline_color: updates.timelineColor,
            character: updates.character
          })
          .eq('id', currentPlayer.id);

        if (error) throw error;
      }

      setCurrentPlayer(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (error) {
      console.error('Failed to update player:', error);
      return false;
    }
  }, [currentPlayer, isHost]);

  const updateRoomSongs = useCallback(async (songs: Song[]): Promise<boolean> => {
    if (!room || !isHost) return false;

    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ songs: songs as unknown as Json })
        .eq('id', room.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to update room songs:', error);
      return false;
    }
  }, [room, isHost]);

  const updateRoomGamemode = useCallback(async (gamemode: GameMode, gamemodeSettings: GameModeSettings): Promise<boolean> => {
    if (!room || !isHost) return false;

    try {
      console.log('🎮 Updating gamemode to:', gamemode, 'settings:', gamemodeSettings);
      
      // Single atomic update to prevent race conditions
      const { error } = await supabase
        .from('game_rooms')
        .update({ 
          gamemode: gamemode,
          gamemode_settings: gamemodeSettings as unknown as Json,
          phase: 'lobby' // Explicitly maintain lobby phase
        })
        .eq('id', room.id);

      if (error) throw error;
      
      // Update local state with explicit phase maintenance
      setRoom(prev => prev ? {
        ...prev,
        gamemode,
        gamemode_settings: gamemodeSettings,
        phase: 'lobby' as const // Ensure phase stays 'lobby'
      } : null);
      
      console.log('✅ Gamemode updated successfully, phase maintained as lobby');
      
      return true;
    } catch (error) {
      console.error('Failed to update room gamemode:', error);
      return false;
    }
  }, [room, isHost]);

  const leaveRoom = useCallback(async () => {
    // Only delete player record if this is a non-host player
    if (currentPlayer && !isHost) {
      await supabase
        .from('players')
        .delete()
        .eq('id', currentPlayer.id);
    }

    setRoom(null);
    setPlayers([]);
    setCurrentPlayer(null);
    setIsHost(false);
    setGameInitialized(false);
    hostSessionId.current = null;
    playerSessionId.current = null;
    isInitialFetch.current = true;
  }, [currentPlayer, isHost]);

  const setCurrentSong = useCallback(async (song: Song): Promise<void> => {
    if (!room || !isHost) return;

    try {
      // Validate song object exists and has required properties
      if (!song || !song.deezer_title) {
        console.warn('⚠️ Invalid song object provided to setCurrentSong, skipping:', song);
        return;
      }

      console.log('🎵 Host setting synchronized mystery card:', song.deezer_title);
      await GameService.setCurrentSong(room.id, song);
      // Broadcast song set via WebSocket
      broadcastSongSet(song);
    } catch (error) {
      console.error('Failed to set current song:', error);
      // Continue gracefully - don't let song setting errors break the game
    }
  }, [room, isHost]);

  const assignStartingCards = useCallback(async (availableSongs: Song[]): Promise<void> => {
    if (!room || !isHost || !availableSongs.length) {
      console.log('⚠️ Cannot assign starting cards:', { room: !!room, isHost, songsLength: availableSongs.length });
      return;
    }

    try {
      console.log('🃏 Assigning starting cards to players...');
      console.log('🎯 Players to assign cards to:', players.map(p => ({ name: p.name, timelineLength: p.timeline.length })));
      
      for (const player of players) {
        if (player.timeline.length === 0) {
          const randomSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
          console.log(`🃏 Assigning starting card to ${player.name}:`, randomSong.deezer_title);
          
          const { error } = await supabase
            .from('players')
            .update({
              timeline: [randomSong] as unknown as Json
            })
            .eq('id', player.id);

          if (error) {
            console.error(`Failed to assign starting card to ${player.name}:`, error);
          } else {
            console.log(`✅ Successfully assigned starting card to ${player.name}`);
          }
        }
      }
      
      // Refresh players after assigning cards
      console.log('🔄 Refreshing players after assigning starting cards...');
      await fetchPlayers(room.id);
    } catch (error) {
      console.error('Failed to assign starting cards:', error);
    }
  }, [room, isHost, players, fetchPlayers]);

  const kickPlayer = useCallback(async (playerId: string): Promise<boolean> => {
    if (!room || !isHost) {
      console.error('Cannot kick player: not host or no room');
      return false;
    }

    try {
      setIsLoading(true);
      console.log('👟 Kicking player:', playerId);

      // Remove player from database
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)
        .eq('room_id', room.id);

      if (error) {
        console.error('❌ Failed to kick player:', error);
        setError('Failed to remove player');
        return false;
      }

      console.log('✅ Player kicked successfully');
      
      // Refresh players list
      await fetchPlayers(room.id);
      
      toast({
        title: "Player removed",
        description: "Player has been removed from the lobby",
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error kicking player:', error);
      setError('Failed to remove player');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [room, isHost, fetchPlayers, toast]);

  return {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading: isLoading && !gameInitialized,
    error,
    connectionStatus,
    wsState,
    gameInitialized,
    forceReconnect,
    wsReconnect,
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
    sendHostSetSongs,
    setHostStatus
  };
}

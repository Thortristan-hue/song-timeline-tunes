import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { useWebSocketGameSync } from './useWebSocketGameSync';
import { Song, Player, GameRoom, GamePhase, GameMode, GameModeSettings, DatabasePhase } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';
import { Json } from '@/integrations/supabase/types';
import { GameService } from '@/services/gameService';

interface UseGameRoomResult {
  room: GameRoom | null;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;
  connectionStatus: {
    isConnected: boolean;
    isReconnecting: boolean;
    lastError: string | null;
    retryCount: number;
  };
  wsState: {
    isConnected: boolean;
    isConnecting: boolean;
    isReady: boolean;
    reconnectAttempts: number;
    lastError: string | null;
  };
  gameInitialized: boolean;
  forceReconnect: () => void;
  wsReconnect: () => void;
  createRoom: (hostName: string) => Promise<string | null>;
  joinRoom: (lobbyCode: string, playerName: string) => Promise<boolean>;
  updatePlayer: (updates: Partial<Player>) => Promise<boolean>;
  updateRoomSongs: (songs: Song[]) => Promise<boolean>;
  updateRoomGamemode: (gamemode: string, settings: any) => Promise<boolean>;
  startGame: () => Promise<void>;
  leaveRoom: () => void;
  placeCard: (song: Song, position: number) => Promise<{ success: boolean; correct?: boolean; gameEnded?: boolean; winner?: Player; }>;
  setCurrentSong: (song: Song | null) => Promise<void>;
  assignStartingCards: (songs: Song[]) => Promise<void>;
  kickPlayer: (playerId: string) => Promise<boolean>;
}

export function useGameRoom(): UseGameRoomResult {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    isReconnecting: false,
    lastError: null as string | null,
    retryCount: 0
  });

  const { toast } = useToast();
  const playerSessionId = useRef<string>('');
  const hostSessionId = useRef<string>('');
  const [gameInitialized, setGameInitialized] = useState(false);

  // Helper function to safely convert Json to Song
  const jsonToSong = (json: Json): Song | null => {
    if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
    
    const obj = json as Record<string, any>;
    if (!obj.deezer_title) return null;
    
    return {
      id: obj.id || `song-${Math.random().toString(36).substr(2, 9)}`,
      deezer_title: obj.deezer_title || 'Unknown Title',
      deezer_artist: obj.deezer_artist || 'Unknown Artist',
      deezer_album: obj.deezer_album || 'Unknown Album',
      release_year: obj.release_year || '2000',
      genre: obj.genre || 'Unknown',
      cardColor: obj.cardColor || '#007AFF',
      preview_url: obj.preview_url || '',
      deezer_url: obj.deezer_url || ''
    };
  };

  // Helper function to safely convert Json array to Song array
  const jsonArrayToSongs = (jsonArray: Json): Song[] => {
    if (!Array.isArray(jsonArray)) return [];
    
    return jsonArray
      .map(item => jsonToSong(item))
      .filter((song): song is Song => song !== null);
  };

  // Helper function to safely convert GamePhase for database
  const safeGamePhase = (phase: string): DatabasePhase => {
    if (phase === 'playing' || phase === 'finished') return phase;
    return 'lobby'; // Default fallback for menu, hostLobby, mobileJoin, mobileLobby phases
  };

  // Helper function to convert database phase to GamePhase for display
  const toGamePhase = (dbPhase: DatabasePhase): GamePhase => {
    return dbPhase as GamePhase; // Safe cast since DatabasePhase is subset of GamePhase
  };

  // Fetch player session ID from local storage
  useEffect(() => {
    const storedPlayerSessionId = localStorage.getItem('playerSessionId');
    if (storedPlayerSessionId) {
      playerSessionId.current = storedPlayerSessionId;
    } else {
      const newPlayerSessionId = generateSessionId();
      playerSessionId.current = newPlayerSessionId;
      localStorage.setItem('playerSessionId', newPlayerSessionId);
    }
  }, []);

  // Helper function to generate a unique session ID
  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  // Function to handle room updates from realtime subscription
  const handleRoomUpdate = useCallback((updatedRoom: any) => {
    const roomData: GameRoom = {
      id: updatedRoom.id,
      lobby_code: updatedRoom.lobby_code,
      host_id: updatedRoom.host_id,
      host_name: updatedRoom.host_name || '',
      phase: toGamePhase(safeGamePhase(updatedRoom.phase)),
      gamemode: (updatedRoom.gamemode as GameMode) || 'classic',
      gamemode_settings: (updatedRoom.gamemode_settings as GameModeSettings) || {},
      songs: jsonArrayToSongs(updatedRoom.songs),
      created_at: updatedRoom.created_at,
      updated_at: updatedRoom.updated_at,
      current_turn: updatedRoom.current_turn || 0,
      current_song: jsonToSong(updatedRoom.current_song),
      current_player_id: updatedRoom.current_player_id || null
    };
    setRoom(roomData);
  }, []);

  // Function to handle players updates from realtime subscription
  const handlePlayersUpdate = useCallback((updatedPlayers: Player[]) => {
    setPlayers(updatedPlayers);
  }, []);

  const handleCardPlaced = useCallback((cardData: any) => {
    // Handle card placed logic
    console.log('Card placed:', cardData);
  }, []);

  const handleSongSet = useCallback((song: Song) => {
    // Handle song set logic
    console.log('Song set:', song);
  }, []);

  const handleGameStarted = useCallback((data: any) => {
    // Handle game started logic
    console.log('Game started:', data);
  }, []);

  // Realtime subscription setup
  const { connectionStatus: realtimeStatus, forceReconnect } = useRealtimeSubscription([
    {
      channelName: `room-${room?.id}`,
      table: 'game_rooms',
      filter: `id=eq.${room?.id}`,
      onUpdate: (payload: any) => {
        console.log('[Realtime] Game room update received:', payload);
        if (payload.new) {
          handleRoomUpdate(payload.new);
        }
      },
      onError: (err: Error) => {
        console.error('[Realtime] Error in game_rooms subscription:', err);
        setError(err.message);
      }
    },
    {
      channelName: `room-${room?.id}`,
      table: 'players',
      filter: `room_id=eq.${room?.id}`,
      onUpdate: (payload: any) => {
        console.log('[Realtime] Players update received:', payload);
        fetchPlayers();
      },
      onError: (err: Error) => {
        console.error('[Realtime] Error in players subscription:', err);
        setError(err.message);
      }
    }
  ]);

  // Simplified WebSocket sync - mainly for host communication
  const {
    syncState: wsState,
    setHostStatus,
    forceReconnect: wsReconnect
  } = useWebSocketGameSync(
    room?.id || null,
    handleRoomUpdate,
    handlePlayersUpdate,
    undefined, // onGameStart - not needed
    handleCardPlaced,
    handleSongSet,
    handleGameStarted
  );

  // Update connection status
  useEffect(() => {
    setConnectionStatus({
      isConnected: realtimeStatus.isConnected,
      isReconnecting: realtimeStatus.isReconnecting,
      lastError: realtimeStatus.lastError || null,
      retryCount: realtimeStatus.retryCount
    });
  }, [realtimeStatus]);

  const startGame = async (): Promise<void> => {
    if (!room || !isHost) {
      console.warn('Cannot start game: no room or not host');
      return;
    }

    setIsLoading(true);

    try {
      console.log('[GameState] Host starting game - using database-only approach...');

      // Get songs with previews
      const songsWithPreviews: Song[] = [];
      const roomSongs = Array.isArray(room.songs) ? room.songs : [];

      if (roomSongs.length > 0) {
        for (const song of roomSongs) {
          if (song && typeof song === 'object') {
            songsWithPreviews.push(song as Song);
          }
        }
      }

      // Fallback to default playlist if needed
      let songsToUse = songsWithPreviews;
      if (songsToUse.length === 0) {
        console.log('🎵 No custom songs, loading default playlist...');
        const { loadDefaultPlaylist } = await import('@/services/defaultPlaylistService');
        const defaultSongs = await loadDefaultPlaylist();
        songsToUse = defaultSongs.slice(0, 20);
        console.log(`🎯 Loaded ${songsToUse.length} songs from default playlist`);
      }

      if (songsToUse.length === 0) {
        throw new Error('No songs available for game start');
      }

      console.log('[GameState] Initializing game with songs:', songsToUse.length);

      // Initialize game logic
      await GameService.initializeGameWithStartingCards(room.id, songsToUse);

      // Update room to playing phase - this will trigger realtime updates for all clients
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

      console.log('[GameState] Game started successfully - all clients will receive update via realtime');
      setGameInitialized(true);

    } catch (error) {
      console.error('Failed to start game:', error);
      toast({
        title: "Failed to Start Game",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createRoom = async (hostName: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate a unique lobby code
      const lobbyCode = generateLobbyCode();

      // Insert the new game room into the database
      const { data, error } = await supabase
        .from('game_rooms')
        .insert([{ lobby_code: lobbyCode, host_id: playerSessionId.current, host_name: hostName, phase: 'lobby' }])
        .select()
        .single();

      if (error) {
        console.error('Failed to create room:', error);
        setError('Failed to create room');
        return null;
      }

      // Set the host session ID
      hostSessionId.current = playerSessionId.current;

      // Set the player as the host
      setIsHost(true);
      setHostStatus(true);

      // Set the room
      const roomData: GameRoom = {
        id: data.id,
        lobby_code: data.lobby_code,
        host_id: data.host_id,
        host_name: data.host_name || '',
        phase: toGamePhase(safeGamePhase(data.phase)),
        gamemode: (data.gamemode as GameMode) || 'classic',
        gamemode_settings: (data.gamemode_settings as GameModeSettings) || {},
        songs: jsonArrayToSongs(data.songs),
        created_at: data.created_at,
        updated_at: data.updated_at,
        current_turn: data.current_turn || 0,
        current_song: jsonToSong(data.current_song),
        current_player_id: data.current_player_id || null
      };
      setRoom(roomData);

      return lobbyCode;
    } catch (err) {
      console.error('Failed to create room:', err);
      setError('Failed to create room');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateLobbyCode = () => {
    const words = ['APPLE', 'TRACK', 'MUSIC', 'DANCE', 'PARTY', 'SOUND', 'BEATS', 'PIANO', 'DRUMS', 'VOICE'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const randomDigit = Math.floor(Math.random() * 10);
    return randomWord + randomDigit;
  };

  const joinRoom = async (lobbyCode: string, playerName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if the lobby code exists and the room is in the lobby phase
      const { data: rooms, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('lobby_code', lobbyCode)
        .eq('phase', 'lobby');

      if (roomError) {
        console.error('Failed to join room:', roomError);
        setError('Failed to join room');
        return false;
      }

      // If no room is found, return an error
      if (!rooms || rooms.length === 0) {
        setError('Invalid lobby code');
        return false;
      }

      // Get the room ID
      const roomId = rooms[0].id;

      // Check if the player already exists in the room
      const { data: existingPlayers, error: existingPlayersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('player_session_id', playerSessionId.current);

      if (existingPlayersError) {
        console.error('Failed to check existing players:', existingPlayersError);
        setError('Failed to join room');
        return false;
      }

      // If the player already exists in the room, return an error
      if (existingPlayers && existingPlayers.length > 0) {
        setError('Player already in room');
        return false;
      }

      // Insert the new player into the database with required fields
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .insert([{ 
          room_id: roomId, 
          name: playerName, 
          player_session_id: playerSessionId.current,
          color: '#007AFF',
          timeline_color: '#007AFF'
        }])
        .select()
        .single();

      if (playerError) {
        console.error('Failed to join room:', playerError);
        setError('Failed to join room');
        return false;
      }

      // Set the current player
      const playerDataWithType: Player = {
        id: playerData.id,
        name: playerData.name,
        color: playerData.color || '#007AFF',
        timelineColor: playerData.timeline_color || '#007AFF',
        score: playerData.score || 0,
        timeline: Array.isArray(playerData.timeline) ? playerData.timeline as unknown as Song[] : [],
        character: (playerData as any).character || 'char_dave'
      };
      setCurrentPlayer(playerDataWithType);

      // Set the room
      const { data: roomData, error: roomDataError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomDataError) {
        console.error('Failed to get room:', roomDataError);
        setError('Failed to join room');
        return false;
      }

      const roomDataWithType: GameRoom = {
        id: roomData.id,
        lobby_code: roomData.lobby_code,
        host_id: roomData.host_id,
        host_name: roomData.host_name || '',
        phase: toGamePhase(safeGamePhase(roomData.phase)),
        gamemode: (roomData.gamemode as GameMode) || 'classic',
        gamemode_settings: (roomData.gamemode_settings as GameModeSettings) || {},
        songs: jsonArrayToSongs(roomData.songs),
        created_at: roomData.created_at,
        updated_at: roomData.updated_at,
        current_turn: roomData.current_turn || 0,
        current_song: jsonToSong(roomData.current_song),
        current_player_id: roomData.current_player_id || null
      };
      setRoom(roomDataWithType);

      // Fetch players
      await fetchPlayers();

      return true;
    } catch (err) {
      console.error('Failed to join room:', err);
      setError('Failed to join room');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlayer = async (updates: Partial<Player>): Promise<boolean> => {
    if (!room?.id) {
      console.error('Cannot update player: no room available');
      setError('Room not available');
      return false;
    }

    if (!currentPlayer?.id) {
      console.error('Cannot update player: no current player');
      setError('Player not found');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Updating player:', { playerId: currentPlayer.id, roomId: room.id, updates });
      
      // Update the player in the database using the player's actual ID
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
        .eq('id', currentPlayer.id)
        .eq('room_id', room.id);

      if (error) {
        console.error('Failed to update player:', error);
        setError('Failed to update player');
        return false;
      }

      // Update the local state
      setCurrentPlayer(prev => prev ? { ...prev, ...updates } : null);
      
      console.log('Player updated successfully');
      return true;
    } catch (err) {
      console.error('Failed to update player:', err);
      setError('Failed to update player');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateRoomSongs = async (songs: Song[]): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Update the room in the database
      const { error } = await supabase
        .from('game_rooms')
        .update({ songs: songs as unknown as Json })
        .eq('id', room?.id);

      if (error) {
        console.error('Failed to update room songs:', error);
        setError('Failed to update room songs');
        return false;
      }

      // Update the local state
      setRoom((prevRoom: GameRoom | null) => {
        if (prevRoom) {
          return { ...prevRoom, songs: songs };
        }
        return prevRoom;
      });

      return true;
    } catch (err) {
      console.error('Failed to update room songs:', err);
      setError('Failed to update room songs');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateRoomGamemode = async (gamemode: string, settings: any): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Update the room in the database
      const { error } = await supabase
        .from('game_rooms')
        .update({ gamemode: gamemode as GameMode, gamemode_settings: settings })
        .eq('id', room?.id);

      if (error) {
        console.error('Failed to update room gamemode:', error);
        setError('Failed to update room gamemode');
        return false;
      }

      // Update the local state
      setRoom((prevRoom: GameRoom | null) => {
        if (prevRoom) {
          return { ...prevRoom, gamemode: gamemode as GameMode, gamemode_settings: settings };
        }
        return prevRoom;
      });

      return true;
    } catch (err) {
      console.error('Failed to update room gamemode:', err);
      setError('Failed to update room gamemode');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const leaveRoom = () => {
    setRoom(null);
    setPlayers([]);
    setCurrentPlayer(null);
    setIsHost(false);
    setError(null);
    setGameInitialized(false);
    localStorage.removeItem('playerSessionId');
  };

  const placeCard = async (song: Song, position: number): Promise<{ success: boolean; correct?: boolean; gameEnded?: boolean; winner?: Player; }> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('players')
        .update({ timeline: { [position]: song } as any })
        .eq('player_session_id', playerSessionId.current)
        .eq('room_id', room?.id);

      if (error) {
        console.error('Failed to place card:', error);
        setError('Failed to place card');
        return { success: false };
      }

      setCurrentPlayer((prevPlayer: Player | null) => {
        if (prevPlayer) {
          const newTimeline = { ...prevPlayer.timeline, [position]: song };
          return { ...prevPlayer, timeline: newTimeline };
        }
        return prevPlayer;
      });

      return { success: true };
    } catch (err) {
      console.error('Failed to place card:', err);
      setError('Failed to place card');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentSong = async (song: Song | null): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ current_song: song as any })
        .eq('id', room?.id);

      if (error) {
        console.error('Failed to set current song:', error);
        setError('Failed to set current song');
        return;
      }

      setRoom((prevRoom: GameRoom | null) => {
        if (prevRoom) {
          return { ...prevRoom, current_song: song };
        }
        return prevRoom;
      });
    } catch (err) {
      console.error('Failed to set current song:', err);
      setError('Failed to set current song');
    } finally {
      setIsLoading(false);
    }
  };

  const assignStartingCards = async (songs: Song[]): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room?.id);

      if (playersError) {
        console.error('Failed to get players:', playersError);
        setError('Failed to get players');
        return;
      }

      for (const player of players) {
        const randomCard = songs[Math.floor(Math.random() * songs.length)];

        const { error } = await supabase
          .from('players')
          .update({ timeline: { 0: randomCard } as any })
          .eq('id', player.id);

        if (error) {
          console.error('Failed to assign starting card:', error);
          setError('Failed to assign starting card');
          return;
        }
      }

      await fetchPlayers();
    } catch (err) {
      console.error('Failed to assign starting cards:', err);
      setError('Failed to assign starting cards');
    } finally {
      setIsLoading(false);
    }
  };

  const kickPlayer = async (playerId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (error) {
        console.error('Failed to kick player:', error);
        setError('Failed to kick player');
        return false;
      }

      await fetchPlayers();
      return true;
    } catch (err) {
      console.error('Failed to kick player:', err);
      setError('Failed to kick player');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlayers = async () => {
    // CRITICAL: Guard clause to prevent database call with undefined room ID
    if (!room?.id) {
      console.warn('⚠️ fetchPlayers called without valid room ID, skipping');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room.id)
        .order('joined_at', { ascending: true });

      if (playersError) {
        console.error('Failed to get players:', playersError);
        setError('Failed to get players');
        return;
      }

      const playersWithType: Player[] = playersData.map(player => ({
        id: player.id,
        name: player.name,
        color: player.color || '#007AFF',
        timelineColor: player.timeline_color || '#007AFF',
        score: player.score || 0,
        timeline: Array.isArray(player.timeline) ? player.timeline as unknown as Song[] : [],
        character: (player as any).character || 'char_dave'
      }));
      
      // Filter out host from players list to prevent them from being in the turn rotation
      // Check both player_session_id and is_host flag from database
      const actualPlayers = playersWithType.filter((player, index) => {
        const originalPlayer = playersData[index];
        return originalPlayer?.player_session_id !== hostSessionId.current && !originalPlayer?.is_host;
      });
      setPlayers(actualPlayers);

      const currentPlayerWithType = playersWithType.find(player => (player as any).player_session_id === playerSessionId.current) || null;
      setCurrentPlayer(currentPlayerWithType);

      const isHostWithType = playersData.some(player => (player as any).player_session_id === hostSessionId.current && player.is_host);
      setIsHost(isHostWithType);
      setHostStatus(isHostWithType);
    } catch (err) {
      console.error('Failed to get players:', err);
      setError('Failed to get players');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading,
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
    kickPlayer
  };
}

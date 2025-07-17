
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Song, Player, GameRoom, GameMode, GameModeSettings } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';
import { GameService } from '@/services/gameService';
import { useRealtimeSubscription, SubscriptionConfig } from '@/hooks/useRealtimeSubscription';
import type { Json } from '@/integrations/supabase/types';

interface DatabasePlayer {
  id: string;
  name: string;
  color: string;
  timeline_color: string;
  score: number;
  timeline: Json;
  room_id: string;
  created_at?: string;
}

interface DatabaseGameRoom {
  id: string;
  lobby_code: string;
  host_id: string;
  host_name: string;
  phase: string;
  gamemode?: string;
  gamemode_settings?: any;
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
  
  const hostSessionId = useRef<string | null>(null);
  const playerSessionId = useRef<string | null>(null);

  // Setup realtime subscription with retry logic
  const { connectionStatus, forceReconnect } = useRealtimeSubscription(subscriptionConfigs);

  // Generate session ID
  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  // Generate lobby code
  const generateLobbyCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Convert database player to frontend player
  const convertPlayer = useCallback((dbPlayer: DatabasePlayer): Player => {
    return {
      id: dbPlayer.id,
      name: dbPlayer.name,
      color: dbPlayer.color,
      timelineColor: dbPlayer.timeline_color,
      score: dbPlayer.score || 0,
      timeline: Array.isArray(dbPlayer.timeline) ? dbPlayer.timeline as unknown as Song[] : []
    };
  }, []);

  // Fetch players for a room (ONLY non-host players)
  const fetchPlayers = useCallback(async (roomId: string) => {
    try {
      console.log('🔍 Fetching players for room:', roomId);
      
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching players:', error);
        throw error;
      }

      console.log('👥 Raw players from DB:', data);
      
      // Filter out host players - only include players where is_host is false or null
      const nonHostPlayers = data?.filter(dbPlayer => {
        const isHostPlayer = dbPlayer.is_host === true;
        console.log(`🔍 Player ${dbPlayer.name}: is_host=${dbPlayer.is_host}, including=${!isHostPlayer}`);
        return !isHostPlayer;
      }) || [];
      
      const convertedPlayers = nonHostPlayers.map(convertPlayer);
      console.log('👥 Converted non-host players:', convertedPlayers);
      
      setPlayers(convertedPlayers);

      // Update current player if we have one (only for non-host players)
      if (playerSessionId.current && !isHost) {
        const current = convertedPlayers.find(p => 
          nonHostPlayers.find(dbP => dbP.id === p.id && dbP.player_session_id === playerSessionId.current)
        );
        if (current) {
          console.log('🎯 Updated current player:', current);
          setCurrentPlayer(current);
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch players:', error);
    }
  }, [convertPlayer, isHost]);

  // Setup subscription configurations when room is available
  useEffect(() => {
    if (!room?.id) {
      setSubscriptionConfigs([]);
      return;
    }

    console.log('🔄 Setting up subscription configs for room:', room.id);

    const configs: SubscriptionConfig[] = [
      {
        channelName: `room-${room.id}`,
        table: 'game_rooms',
        filter: `id=eq.${room.id}`,
        onUpdate: (payload) => {
          console.log('🔄 SYNC: Room updated with turn/mystery card:', payload.new);
          const roomData = payload.new as DatabaseGameRoom;
          
          // CRITICAL FIX: Properly cast current_song from Json to Song
          let currentSong: Song | null = null;
          if (roomData.current_song) {
            // Cast from Json to Song with proper type assertion
            currentSong = roomData.current_song as unknown as Song;
          }
          console.log('🎵 SYNC: Mystery card from database:', currentSong?.deezer_title || 'undefined');
          
          setRoom({
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
            current_song: currentSong,
            current_player_id: roomData.current_player_id || null
          });
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
          fetchPlayers(room.id);
        },
        onError: (error) => {
          console.error('❌ Players subscription error:', error);
        }
      }
    ];

    setSubscriptionConfigs(configs);

    // Initial fetch
    fetchPlayers(room.id);
  }, [room?.id, fetchPlayers]);

  const createRoom = useCallback(async (hostName: string, gamemode: GameMode = 'classic', gamemodeSettings: GameModeSettings = {}): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const sessionId = generateSessionId();
      const lobbyCode = generateLobbyCode();
      hostSessionId.current = sessionId;

      console.log('🏠 Creating room with host session ID:', sessionId, 'gamemode:', gamemode);

      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          lobby_code: lobbyCode,
          host_id: sessionId,
          host_name: hostName,
          phase: 'lobby',
          gamemode: gamemode,
          gamemode_settings: gamemodeSettings as any
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Room created successfully:', data);

      setRoom({
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
      });

      // Create a virtual host player for local use only (not stored in database)
      const hostPlayer: Player = {
        id: `host-${sessionId}`,
        name: hostName,
        color: '#FF6B6B',
        timelineColor: '#FF8E8E',
        score: 0,
        timeline: []
      };

      setCurrentPlayer(hostPlayer);
      setIsHost(true);
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

      console.log('🎮 Attempting to join room:', lobbyCode);

      // First, find the room
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('lobby_code', lobbyCode.toUpperCase())
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
          is_host: false // Explicitly set to false
        })
        .select()
        .single();

      if (playerError) {
        console.error('❌ Failed to create player:', playerError);
        throw playerError;
      }

      console.log('✅ Player created successfully:', playerData);

      setRoom({
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
      });
      
      setCurrentPlayer(convertPlayer(playerData));
      setIsHost(false);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to join room:', error);
      setError(error instanceof Error ? error.message : 'Failed to join room');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [convertPlayer]);

  const placeCard = useCallback(async (song: Song, position: number, availableSongs: Song[] = []): Promise<{ success: boolean; correct?: boolean }> => {
    if (!currentPlayer || !room) {
      console.error('Cannot place card: missing currentPlayer or room');
      return { success: false };
    }

    try {
      console.log('🃏 FIXED: Using correct GameService method for card placement');
      
      // FIXED: Use the correct method name
      const result = await GameService.placeCardAndAdvanceTurn(room.id, currentPlayer.id, song, position, availableSongs);
      
      if (result.success) {
        console.log('✅ FIXED: Card placed and turn advanced successfully');
        return { success: true, correct: result.correct };
      } else {
        console.error('❌ FIXED: Card placement failed:', result.error);
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
            timeline_color: updates.timelineColor
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
      const { error } = await supabase
        .from('game_rooms')
        .update({ 
          gamemode: gamemode,
          gamemode_settings: gamemodeSettings as any
        })
        .eq('id', room.id);

      if (error) throw error;
      
      // Update local state
      setRoom(prev => prev ? {
        ...prev,
        gamemode,
        gamemode_settings: gamemodeSettings
      } : null);
      
      return true;
    } catch (error) {
      console.error('Failed to update room gamemode:', error);
      return false;
    }
  }, [room, isHost]);

  const startGame = useCallback(async (availableSongs?: Song[]): Promise<boolean> => {
    if (!room || !isHost) return false;

    try {
      console.log('🎯 FIXED: Starting game with correct initialization method');
      
      // FIXED: Use the correct method name
      if (availableSongs && availableSongs.length > 0) {
        await GameService.initializeGameWithStartingCards(room.id, availableSongs);
      } else {
        // Fallback: just set phase to playing
        const { error } = await supabase
          .from('game_rooms')
          .update({ 
            phase: 'playing',
            current_turn: 0
          })
          .eq('id', room.id);

        if (error) throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to start game:', error);
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
    hostSessionId.current = null;
    playerSessionId.current = null;
  }, [currentPlayer, isHost]);

  const setCurrentSong = useCallback(async (song: Song): Promise<void> => {
    if (!room || !isHost) return;

    try {
      console.log('🎵 SYNC: Host setting synchronized mystery card:', song.deezer_title);
      await GameService.setCurrentSong(room.id, song);
    } catch (error) {
      console.error('Failed to set current song:', error);
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
    isLoading,
    error,
    connectionStatus,
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
    kickPlayer
  };
}


import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Song, Player, GameRoom, GameMode, GameModeSettings } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';
import { GameService } from '@/services/gameService';
import { optimizedRealtimeService } from '@/services/optimizedRealtimeService';
import { getDefaultCharacter } from '@/constants/characters';
import type { Json } from '@/integrations/supabase/types';

// Add character property to database player interface
interface DatabasePlayer {
  id: string;
  name: string;
  color: string;
  timeline_color: string;
  score: number;
  timeline: Json;
  room_id: string;
  player_session_id: string;
  is_host: boolean;
  joined_at: string;
  last_active: string;
  character?: string; // Add character property
}

export function useOptimizedGameRoom() {
  const { toast } = useToast();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameInitialized, setGameInitialized] = useState(false);

  const hostSessionId = useRef<string | null>(null);
  const playerSessionId = useRef<string | null>(null);

  // Generate session ID
  const generateSessionId = () => Math.random().toString(36).substring(2, 15);

  // Generate lobby code
  const generateLobbyCode = () => {
    const words = ['APPLE', 'TRACK', 'MUSIC', 'DANCE', 'PARTY', 'SOUND', 'BEATS', 'PIANO'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const randomDigit = Math.floor(Math.random() * 10);
    return `${randomWord}${randomDigit}`;
  };

  // Setup real-time subscription
  useEffect(() => {
    if (!room?.id) return;

    console.log('🚀 Setting up optimized real-time subscription');
    
    optimizedRealtimeService.subscribe({
      roomId: room.id,
      onRoomUpdate: (roomData) => {
        console.log('⚡ Instant room update');
        setRoom(prev => prev ? { ...prev, ...roomData } : null);
        
        if (roomData.phase === 'playing' && !gameInitialized) {
          setGameInitialized(true);
          setIsLoading(false);
        }
      },
      onPlayerUpdate: (updatedPlayers) => {
        console.log('⚡ Instant player update');
        setPlayers(updatedPlayers);
      },
      onGameEvent: (event, data) => {
        console.log('⚡ Instant game event:', event);
        // Handle game events instantly
      }
    });

    return () => {
      optimizedRealtimeService.unsubscribe(room.id);
    };
  }, [room?.id, gameInitialized]);

  const createRoom = useCallback(async (hostName: string, gamemode: GameMode = 'classic'): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const sessionId = generateSessionId();
      hostSessionId.current = sessionId;
      const lobbyCode = generateLobbyCode();

      console.log('🏠 Creating room instantly...');

      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          lobby_code: lobbyCode,
          host_id: sessionId,
          host_name: hostName,
          phase: 'lobby',
          gamemode: gamemode,
          gamemode_settings: {} as Json
        })
        .select()
        .single();

      if (error) throw error;

      const newRoom: GameRoom = {
        id: data.id,
        lobby_code: data.lobby_code,
        host_id: data.host_id,
        host_name: data.host_name || hostName,
        phase: data.phase as 'lobby' | 'playing' | 'finished',
        gamemode: (data.gamemode as GameMode) || 'classic',
        gamemode_settings: (data.gamemode_settings as GameModeSettings) || {},
        songs: [],
        created_at: data.created_at,
        updated_at: data.updated_at,
        current_turn: data.current_turn,
        current_song: null
      };

      setRoom(newRoom);
      setIsHost(true);
      
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
      console.log('✅ Room created instantly');
      return lobbyCode;
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

      console.log('🎮 Joining room instantly...');

      // Find room
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('lobby_code', lobbyCode)
        .single();

      if (roomError || !roomData) {
        throw new Error('Room not found');
      }

      // Create player
      const sessionId = generateSessionId();
      playerSessionId.current = sessionId;

      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
      const timelineColors = ['#FF8E8E', '#5DEDE5', '#58C4E0', '#A8D8C8', '#FFE9B8'];

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

      if (playerError) throw playerError;

      const newRoom: GameRoom = {
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
      setCurrentPlayer({
        id: playerData.id,
        name: playerData.name,
        color: playerData.color,
        timelineColor: playerData.timeline_color,
        score: playerData.score || 0,
        timeline: [],
        character: playerData.character || getDefaultCharacter().id
      });
      setIsHost(false);

      if (roomData.phase === 'playing') {
        setGameInitialized(true);
      }

      console.log('✅ Joined room instantly');
      return true;
    } catch (error) {
      console.error('❌ Failed to join room:', error);
      setError(error instanceof Error ? error.message : 'Failed to join room');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startGame = useCallback(async (availableSongs?: Song[]): Promise<boolean> => {
    if (!room || !isHost) return false;

    try {
      console.log('🎯 Starting game instantly...');
      setIsLoading(true);

      let songsToUse = availableSongs;
      
      if (!songsToUse || songsToUse.length === 0) {
        const { defaultPlaylistService } = await import('@/services/defaultPlaylistService');
        songsToUse = await defaultPlaylistService.loadOptimizedGameSongs(20);
        
        if (songsToUse.length < 8) {
          throw new Error(`Only ${songsToUse.length} songs found. Need at least 8.`);
        }
      }

      // Initialize game instantly via GameService
      await GameService.initializeGameWithStartingCards(room.id, songsToUse);

      // Update room phase instantly
      await supabase
        .from('game_rooms')
        .update({ 
          phase: 'playing',
          songs: songsToUse as unknown as Json
        })
        .eq('id', room.id);

      // Broadcast event instantly
      await optimizedRealtimeService.broadcastGameEvent(room.id, 'game_started', {
        songCount: songsToUse.length
      });

      setGameInitialized(true);
      console.log('✅ Game started instantly');
      return true;
    } catch (error) {
      console.error('❌ Failed to start game:', error);
      setIsLoading(false);
      throw error;
    }
  }, [room, isHost]);

  const placeCard = useCallback(async (song: Song, position: number, availableSongs: Song[] = []): Promise<{ success: boolean; correct?: boolean }> => {
    if (!currentPlayer || !room) return { success: false };

    try {
      console.log('🃏 Placing card instantly...');
      
      const result = await GameService.placeCardAndAdvanceTurn(room.id, currentPlayer.id, song, position, availableSongs);
      
      if (result.success) {
        // Broadcast instantly
        await optimizedRealtimeService.broadcastGameEvent(room.id, 'card_placed', {
          playerId: currentPlayer.id,
          song,
          position,
          correct: result.correct
        });
        
        console.log('✅ Card placed instantly');
        return { success: true, correct: result.correct };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Failed to place card:', error);
      return { success: false };
    }
  }, [currentPlayer, room]);

  const leaveRoom = useCallback(async () => {
    if (currentPlayer && !isHost) {
      await supabase
        .from('players')
        .delete()
        .eq('id', currentPlayer.id);
    }

    optimizedRealtimeService.disconnect();
    setRoom(null);
    setPlayers([]);
    setCurrentPlayer(null);
    setIsHost(false);
    setGameInitialized(false);
  }, [currentPlayer, isHost]);

  return {
    room,
    players,
    currentPlayer,
    isHost,
    isLoading: isLoading && !gameInitialized,
    error,
    gameInitialized,
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
    placeCard,
    // Simplified API - no need for complex connection management
    forceReconnect: () => {}, // Not needed with real-time
    wsReconnect: () => {}, // Not needed
    connectionStatus: { isConnected: true, isReconnecting: false, retryCount: 0 }, // Always connected
    wsState: { isConnected: true, isConnecting: false, isReady: true, reconnectAttempts: 0, lastError: null }
  };
}

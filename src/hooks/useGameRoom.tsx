import { useState, useEffect, useCallback, useRef } from 'react';
import { GameRoom, Player, Song } from '@/types/game';
import { GameService } from '@/services/gameService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { initializeUniqueSongService, getUniqueSongService } from '@/services/uniqueSongService';
import { initializeRealtimeSync, getRealtimeSync, cleanupRealtimeSync } from '@/services/realtimeGameSync';

interface UseGameRoomReturn {
  room: GameRoom | null;
  players: Player[];
  currentPlayer: Player | null;
  isHost: boolean;
  error: string | null;
  isLoading: boolean;
  createRoom: (hostSessionId: string, gamemode?: string) => Promise<boolean>;
  joinRoom: (lobbyCode: string, playerName: string, character?: string) => Promise<boolean>;
  startGame: (songs: Song[]) => Promise<boolean>;
  refreshRoom: () => Promise<void>;
  leaveRoom: () => void;
}

export function useGameRoom(): UseGameRoomReturn {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const subscriptionRef = useRef<any>(null);

  const isHost = currentPlayer?.id?.includes('host-') || false;

  const createRoom = useCallback(async (hostSessionId: string, gamemode: string = 'classic'): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🏠 Creating room...');
      const roomData = await GameService.createRoom(hostSessionId, gamemode);
      
      console.log('✅ Room created:', roomData);
      setRoom(roomData);
      
      // Set host as current player (create a pseudo-player for host)
      const hostPlayer: Player = {
        id: `host-${hostSessionId}`,
        name: 'Host',
        color: '#FFD700',
        timelineColor: '#FFD700', 
        score: 0,
        timeline: [],
        character: 'char_dave'
      };
      
      setCurrentPlayer(hostPlayer);
      setPlayers([hostPlayer]);

      // Initialize real-time sync for the room
      if (roomData && roomData.id) {
        initializeRealtimeSync(roomData.id);
      }

      console.log('✅ Room creation complete');
      return true;
    } catch (err) {
      console.error('❌ Failed to create room:', err);
      setError(err instanceof Error ? err.message : 'Failed to create room');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinRoom = useCallback(async (lobbyCode: string, playerName: string, character: string = 'char_dave'): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🚪 Joining room...');
      const sessionId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const result = await GameService.joinRoom(lobbyCode, playerName, sessionId, character);
      
      console.log('✅ Successfully joined room:', result);
      setRoom(result.room);
      setCurrentPlayer(result.player);

      // Initialize real-time sync for the room
      if (result.room && result.room.id) {
        initializeRealtimeSync(result.room.id);
        
        // Send real-time notification that player joined
        const realtimeSync = getRealtimeSync();
        if (realtimeSync) {
          await realtimeSync.sendPlayerJoined(result.player);
        }
      }

      // Refresh players list
      await refreshRoom();
      return true;
    } catch (err) {
      console.error('❌ Failed to join room:', err);
      setError(err instanceof Error ? err.message : 'Failed to join room');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startGame = useCallback(async (songs: Song[]): Promise<boolean> => {
    if (!room || !currentPlayer) {
      setError('No room or player available');
      return false;
    }

    if (!isHost) {
      setError('Only the host can start the game');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🎮 Starting game with', songs.length, 'songs');
      
      // Initialize unique song service
      const uniqueSongService = initializeUniqueSongService(songs);
      
      // Get first mystery song
      const mysterySong = uniqueSongService.fetchUniqueRandomSong();
      if (!mysterySong) {
        throw new Error('No songs available for mystery card');
      }

      // Update room phase and set mystery song
      await GameService.updateRoom(room.id, {
        phase: 'playing',
        songs: songs,
        current_song: mysterySong,
        current_turn: 0
      });

      // Send real-time game started notification
      const realtimeSync = getRealtimeSync();
      if (realtimeSync) {
        await realtimeSync.sendGameStarted('playing', mysterySong);
      }

      // Refresh room state
      await refreshRoom();

      console.log('✅ Game started successfully');
      return true;
    } catch (err) {
      console.error('❌ Failed to start game:', err);
      setError(err instanceof Error ? err.message : 'Failed to start game');
      toast({
        title: "Failed to start game",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [room, currentPlayer, isHost, toast]);

  const refreshRoom = useCallback(async () => {
    if (!room) return;
    
    try {
      const [roomResponse, playersResponse] = await Promise.all([
        supabase.from('game_rooms').select('*').eq('id', room.id).single(),
        supabase.from('players').select('*').eq('room_id', room.id)
      ]);

      if (roomResponse.data) {
        const roomData: GameRoom = {
          id: roomResponse.data.id,
          lobby_code: roomResponse.data.lobby_code,
          host_id: roomResponse.data.host_id,
          host_name: roomResponse.data.host_name || '',
          phase: roomResponse.data.phase as 'lobby' | 'playing' | 'finished',
          gamemode: roomResponse.data.gamemode as 'classic' | 'fiend' | 'sprint',
          gamemode_settings: (roomResponse.data.gamemode_settings as any) || {},
          songs: Array.isArray(roomResponse.data.songs) ? (roomResponse.data.songs as Song[]) : [],
          created_at: roomResponse.data.created_at,
          updated_at: roomResponse.data.updated_at,
          current_turn: roomResponse.data.current_turn,
          current_song: (roomResponse.data.current_song as Song | null)
        };
        
        setRoom(roomData);
        
        console.log('✅ Room state updated with mystery song:', (roomData.current_song as any)?.deezer_title || 'none');
      }

      if (playersResponse.data) {
        const playersData: Player[] = playersResponse.data.map(p => ({
          id: p.id,
          name: p.name,
          color: p.color,
          timelineColor: p.timeline_color,
          score: p.score || 0,
          timeline: Array.isArray(p.timeline) ? (p.timeline as Song[]) : [],
          character: p.character || 'char_dave'
        }));
        
        setPlayers(playersData);
      }
    } catch (error) {
      console.error('❌ Failed to fetch room state:', error);
    }
  }, [room]);

  const leaveRoom = useCallback(() => {
    console.log('🚪 Leaving room');
    
    // Cleanup real-time connections
    cleanupRealtimeSync();
    
    // Cleanup database subscriptions
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    setRoom(null);
    setPlayers([]);
    setCurrentPlayer(null);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      cleanupRealtimeSync();
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  return {
    room,
    players,
    currentPlayer,
    isHost,
    error,
    isLoading,
    createRoom,
    joinRoom,
    startGame,
    refreshRoom,
    leaveRoom
  };
}
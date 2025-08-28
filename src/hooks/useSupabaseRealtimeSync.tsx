import { useEffect, useCallback, useState } from 'react';
import { supabaseRealtimeService } from '@/services/supabaseRealtimeService';
import { Song, Player, GameRoom } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';

interface RealtimeSyncState {
  isConnected: boolean;
  isConnecting: boolean;
  isReady: boolean;
  lastError: string | null;
  reconnectAttempts: number;
}

export function useSupabaseRealtimeSync(
  roomId: string | null,
  onRoomUpdate?: (room: Partial<GameRoom>) => void,
  onPlayerUpdate?: (players: Player[]) => void,
  onGameStart?: (data: any) => void,
  onCardPlaced?: (data: any) => void,
  onSongSet?: (song: Song) => void,
  onGameStarted?: (data: any) => void,
  onTurnTransition?: (data: any) => void,
  onPlayerCardDealt?: (data: any) => void,
  onNewMysterySong?: (data: any) => void
) {
  const { toast } = useToast();
  const [syncState, setSyncState] = useState<RealtimeSyncState>({
    isConnected: false,
    isConnecting: false,
    isReady: false,
    lastError: null,
    reconnectAttempts: 0
  });

  // Update sync state based on connection status
  useEffect(() => {
    const checkConnection = () => {
      const status = supabaseRealtimeService.getConnectionStatus();
      setSyncState(prev => ({
        ...prev,
        isConnected: status === 'connected',
        isConnecting: status === 'connecting',
        isReady: status === 'connected'
      }));
    };

    const interval = setInterval(checkConnection, 1000);
    checkConnection(); // Initial check

    return () => clearInterval(interval);
  }, []);

  // Connect when room ID is available
  useEffect(() => {
    if (!roomId) {
      supabaseRealtimeService.disconnect();
      return;
    }

    const connectToRoom = async () => {
      try {
        setSyncState(prev => ({ ...prev, isConnecting: true, lastError: null }));
        await supabaseRealtimeService.connect(roomId);
        console.log('✅ Supabase realtime sync established for room:', roomId);
        setSyncState(prev => ({ ...prev, isConnected: true, isConnecting: false, isReady: true }));
      } catch (error) {
        console.error('❌ Failed to establish Supabase realtime sync:', error);
        setSyncState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          lastError: error instanceof Error ? error.message : 'Connection failed'
        }));

        toast({
          title: "Connection Issue",
          description: "Reconnecting to game server...",
          variant: "destructive",
        });
      }
    };

    connectToRoom();

    return () => {
      supabaseRealtimeService.disconnect();
    };
  }, [roomId, toast]);

  // Set up event listeners
  useEffect(() => {
    const handlers = {
      ROOM_UPDATE: (data: any) => {
        console.log('🔄 Room update received:', data);
        onRoomUpdate?.(data);
      },
      PLAYER_UPDATE: (data: any) => {
        console.log('👥 Player update received:', data);
        onPlayerUpdate?.(data);
      },
      GAME_START: (data: any) => {
        console.log('🎮 Game start received:', data);
        onGameStart?.(data);
      },
      CARD_PLACED: (data: any) => {
        console.log('🃏 Card placed received:', data);
        onCardPlaced?.(data);
      },
      SONG_SET: (data: any) => {
        console.log('🎵 Song set received:', data);
        onSongSet?.(data);
      },
      GAME_STARTED: (data: any) => {
        console.log('🎮 GAME_STARTED received:', data);
        onGameStarted?.(data);
      },
      TURN_TRANSITION: (data: any) => {
        console.log('🔄 Turn transition received:', data);
        onTurnTransition?.(data);
      },
      PLAYER_CARD_DEALT: (data: any) => {
        console.log('🃏 Player card dealt received:', data);
        onPlayerCardDealt?.(data);
      },
      NEW_MYSTERY_SONG: (data: any) => {
        console.log('🎵 New mystery song received:', data);
        onNewMysterySong?.(data);
      }
    };

    // Register all handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      supabaseRealtimeService.on(event, handler);
    });

    return () => {
      // Cleanup all handlers
      Object.entries(handlers).forEach(([event, handler]) => {
        supabaseRealtimeService.off(event, handler);
      });
    };
  }, [onRoomUpdate, onPlayerUpdate, onGameStart, onCardPlaced, onSongSet, onGameStarted, onTurnTransition, onPlayerCardDealt, onNewMysterySong]);

  // Broadcast methods
  const broadcastPlayerUpdate = useCallback((players: Player[]) => {
    if (!syncState.isConnected) {
      console.warn('⚠️ Cannot broadcast player update - not connected');
      return;
    }
    
    supabaseRealtimeService.broadcastPlayerUpdate(players);
  }, [syncState.isConnected]);

  const broadcastGameStart = useCallback(() => {
    if (!syncState.isConnected) {
      console.warn('⚠️ Cannot broadcast game start - not connected');
      return;
    }
    
    supabaseRealtimeService.broadcastGameStart();
  }, [syncState.isConnected]);

  const broadcastCardPlaced = useCallback((cardData: any) => {
    if (!syncState.isConnected) {
      console.warn('⚠️ Cannot broadcast card placed - not connected');
      return;
    }
    
    supabaseRealtimeService.broadcastCardPlaced(cardData);
  }, [syncState.isConnected]);

  const broadcastSongSet = useCallback((song: Song) => {
    if (!syncState.isConnected) {
      console.warn('⚠️ Cannot broadcast song set - not connected');
      return;
    }
    
    supabaseRealtimeService.broadcastSongSet(song);
  }, [syncState.isConnected]);

  const broadcastGameStarted = useCallback((room: GameRoom) => {
    if (!syncState.isConnected) {
      console.warn('⚠️ Cannot broadcast game started - not connected');
      return;
    }
    
    supabaseRealtimeService.broadcastGameStarted(room);
  }, [syncState.isConnected]);

  const broadcastTurnTransition = useCallback((data: any) => {
    if (!syncState.isConnected) {
      console.warn('⚠️ Cannot broadcast turn transition - not connected');
      return;
    }
    
    supabaseRealtimeService.broadcastTurnTransition(data);
  }, [syncState.isConnected]);

  const setHostStatus = useCallback((isHost: boolean) => {
    supabaseRealtimeService.setHostStatus(isHost);
  }, []);

  const sendHostSetSongs = useCallback((songList: Song[], hostId: string) => {
    if (!syncState.isConnected) {
      console.warn('⚠️ Cannot send HOST_SET_SONGS - not connected');
      return;
    }
    
    console.log('📦 Sending HOST_SET_SONGS with', songList.length, 'songs');
    broadcastGameStarted({ songs: songList } as GameRoom);
  }, [syncState.isConnected, broadcastGameStarted]);

  const forceReconnect = useCallback(() => {
    supabaseRealtimeService.forceReconnect();
  }, []);

  return {
    syncState,
    broadcastPlayerUpdate,
    broadcastGameStart,
    broadcastCardPlaced,
    broadcastSongSet,
    broadcastGameStarted,
    broadcastTurnTransition,
    sendHostSetSongs,
    setHostStatus,
    forceReconnect
  };
}
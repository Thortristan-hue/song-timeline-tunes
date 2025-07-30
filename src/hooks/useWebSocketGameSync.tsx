
import { useEffect, useCallback, useState } from 'react';
import { reliableWebSocketService } from '@/services/reliableWebSocketService';
import { connectionManager, ConnectionState } from '@/services/connectionManager';
import { Song, Player, GameRoom } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';

export function useWebSocketGameSync(
  roomId: string | null,
  onRoomUpdate?: (room: Partial<GameRoom>) => void,
  onPlayerUpdate?: (players: Player[]) => void,
  onGameStart?: (data: any) => void,
  onCardPlaced?: (data: any) => void,
  onSongSet?: (song: Song) => void,
  onGameStarted?: (data: any) => void
) {
  const { toast } = useToast();
  const [syncState, setSyncState] = useState<ConnectionState>(connectionManager.getState());

  // Subscribe to connection state changes
  useEffect(() => {
    const unsubscribe = connectionManager.subscribe((state) => {
      setSyncState(state);
      
      if (state.lastError && state.reconnectAttempts === 1) {
        toast({
          title: "Connection Issue",
          description: "Reconnecting to game server...",
          variant: "destructive",
        });
      }
    });

    return unsubscribe;
  }, [toast]);

  // Connect when room ID is available
  useEffect(() => {
    if (!roomId) {
      reliableWebSocketService.disconnect();
      return;
    }

    const connectToRoom = async () => {
      try {
        await reliableWebSocketService.connect(roomId);
        console.log('🔗 WebSocket sync established for room:', roomId);
      } catch (error) {
        console.error('❌ Failed to establish WebSocket sync:', error);
      }
    };

    connectToRoom();

    return () => {
      reliableWebSocketService.disconnect();
    };
  }, [roomId]);

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
      }
    };

    // Register all handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      reliableWebSocketService.on(event, handler);
    });

    return () => {
      // Cleanup all handlers
      Object.entries(handlers).forEach(([event, handler]) => {
        reliableWebSocketService.off(event, handler);
      });
    };
  }, [onRoomUpdate, onPlayerUpdate, onGameStart, onCardPlaced, onSongSet, onGameStarted]);

  const broadcastPlayerUpdate = useCallback((players: Player[]) => {
    if (!roomId || !syncState.isReady) {
      console.warn('⚠️ Cannot broadcast player update - not ready');
      return;
    }
    
    reliableWebSocketService.sendMessage({
      type: 'PLAYER_UPDATE',
      roomId,
      data: players
    });
  }, [roomId, syncState.isReady]);

  const broadcastGameStart = useCallback(() => {
    if (!roomId || !syncState.isReady) {
      console.warn('⚠️ Cannot broadcast game start - not ready');
      return;
    }
    
    reliableWebSocketService.sendMessage({
      type: 'GAME_START',
      roomId,
      data: { timestamp: Date.now() }
    });
  }, [roomId, syncState.isReady]);

  const broadcastCardPlaced = useCallback((cardData: any) => {
    if (!roomId || !syncState.isReady) {
      console.warn('⚠️ Cannot broadcast card placed - not ready');
      return;
    }
    
    reliableWebSocketService.sendMessage({
      type: 'CARD_PLACED',
      roomId,
      data: cardData
    });
  }, [roomId, syncState.isReady]);

  const broadcastSongSet = useCallback((song: Song) => {
    if (!roomId || !syncState.isReady) {
      console.warn('⚠️ Cannot broadcast song set - not ready');
      return;
    }
    
    reliableWebSocketService.sendMessage({
      type: 'SONG_SET',
      roomId,
      data: song
    });
  }, [roomId, syncState.isReady]);

  const sendHostSetSongs = useCallback((songList: Song[], hostId: string) => {
    if (!roomId || !syncState.isReady) {
      console.warn('⚠️ Cannot send HOST_SET_SONGS - not ready');
      return;
    }
    
    console.log('📦 Sending HOST_SET_SONGS with', songList.length, 'songs');
    reliableWebSocketService.sendHostSetSongs(roomId, songList, hostId);
  }, [roomId, syncState.isReady]);

  const setHostStatus = useCallback((isHost: boolean) => {
    reliableWebSocketService.setHostStatus(isHost);
  }, []);

  const forceReconnect = useCallback(() => {
    if (roomId) {
      connectionManager.resetRetries();
      reliableWebSocketService.connect(roomId);
    }
  }, [roomId]);

  return {
    syncState,
    broadcastRoomUpdate: () => {}, // Disabled - server should handle authoritative updates
    broadcastPlayerUpdate,
    broadcastGameStart,
    broadcastCardPlaced,
    broadcastSongSet,
    sendHostSetSongs,
    setHostStatus,
    forceReconnect
  };
}

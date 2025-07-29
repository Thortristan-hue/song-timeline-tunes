
import { useEffect, useCallback, useState } from 'react';
import { websocketService, GameStateMessage } from '@/services/websocketService';
import { Song, Player, GameRoom } from '@/types/game';
import { useToast } from '@/components/ui/use-toast';

interface WebSocketGameSyncState {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  lastError: string | null;
}

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
  const [syncState, setSyncState] = useState<WebSocketGameSyncState>({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    lastError: null
  });

  // FIXED: Track connection ready state separately from connecting state
  const [isConnectionReady, setIsConnectionReady] = useState(false);

  // Connect to WebSocket when room ID is available
  useEffect(() => {
    if (!roomId) {
      setSyncState(prev => ({ ...prev, isConnected: false }));
      setIsConnectionReady(false);
      return;
    }

    const connectToRoom = async () => {
      try {
        setSyncState(prev => ({ ...prev, isConnecting: true, lastError: null }));
        setIsConnectionReady(false);
        
        await websocketService.connect(roomId);
        
        const status = websocketService.getConnectionStatus();
        setSyncState(prev => ({ 
          ...prev, 
          isConnected: status.isConnected,
          isConnecting: false,
          reconnectAttempts: status.reconnectAttempts
        }));

        // FIXED: Wait for connection to be fully ready before allowing message sending
        if (status.isConnected) {
          // Add a small delay to ensure the connection is fully established
          setTimeout(() => {
            setIsConnectionReady(true);
            console.log('🔗 WebSocket connection ready for message sending');
          }, 100);
        }

      } catch (error) {
        console.error('❌ Failed to connect to WebSocket:', error);
        setSyncState(prev => ({ 
          ...prev, 
          isConnecting: false,
          lastError: error instanceof Error ? error.message : 'Connection failed'
        }));
        setIsConnectionReady(false);
        
        toast({
          title: "Connection Issue",
          description: "Having trouble connecting to the game server. Retrying...",
          variant: "destructive",
        });
      }
    };

    connectToRoom();

    return () => {
      websocketService.disconnect();
      setIsConnectionReady(false);
    };
  }, [roomId, toast]);

  // Set up event listeners
  useEffect(() => {
    const handleRoomUpdate = (data: any) => {
      console.log('🔄 WebSocket room update received:', data);
      onRoomUpdate?.(data);
    };

    const handlePlayerUpdate = (data: any) => {
      console.log('👥 WebSocket player update received:', data);
      onPlayerUpdate?.(data);
    };

    const handleGameStart = (data: any) => {
      console.log('🎮 WebSocket game start received:', data);
      onGameStart?.(data);
    };

    const handleCardPlaced = (data: any) => {
      console.log('🃏 WebSocket card placed received:', data);
      onCardPlaced?.(data);
    };

    const handleGameStarted = (data: any) => {
      console.log('🎮 WebSocket GAME_STARTED received:', data);
      onGameStarted?.(data);
    };

    const handleSongSet = (data: any) => {
      console.log('🎵 WebSocket song set received:', data);
      onSongSet?.(data);
    };

    // Register listeners
    websocketService.on('ROOM_UPDATE', handleRoomUpdate);
    websocketService.on('PLAYER_UPDATE', handlePlayerUpdate);
    websocketService.on('GAME_START', handleGameStart);
    websocketService.on('CARD_PLACED', handleCardPlaced);
    websocketService.on('SONG_SET', handleSongSet);
    websocketService.on('GAME_STARTED', handleGameStarted);

    return () => {
      // Cleanup listeners
      websocketService.off('ROOM_UPDATE', handleRoomUpdate);
      websocketService.off('PLAYER_UPDATE', handlePlayerUpdate);
      websocketService.off('GAME_START', handleGameStart);
      websocketService.off('CARD_PLACED', handleCardPlaced);
      websocketService.off('SONG_SET', handleSongSet);
      websocketService.off('GAME_STARTED', handleGameStarted);
    };
  }, [onRoomUpdate, onPlayerUpdate, onGameStart, onCardPlaced, onSongSet, onGameStarted]);

  // FIXED: Broadcast functions now check if connection is ready before sending
  const broadcastRoomUpdate = useCallback((roomData: Partial<GameRoom>) => {
    if (!roomId || !isConnectionReady) {
      console.warn('⚠️ Cannot broadcast room update - connection not ready:', { roomId, isConnectionReady });
      return;
    }
    
    console.log('📤 Broadcasting room update:', roomData);
    websocketService.sendMessage({
      type: 'ROOM_UPDATE',
      roomId,
      data: roomData
    });
  }, [roomId, isConnectionReady]);

  const broadcastPlayerUpdate = useCallback((players: Player[]) => {
    if (!roomId || !isConnectionReady) {
      console.warn('⚠️ Cannot broadcast player update - connection not ready:', { roomId, isConnectionReady });
      return;
    }
    
    console.log('📤 Broadcasting player update:', players);
    websocketService.sendMessage({
      type: 'PLAYER_UPDATE',
      roomId,
      data: players
    });
  }, [roomId, isConnectionReady]);

  const broadcastGameStart = useCallback(() => {
    if (!roomId || !isConnectionReady) {
      console.warn('⚠️ Cannot broadcast game start - connection not ready:', { roomId, isConnectionReady });
      return;
    }
    
    console.log('📤 Broadcasting game start');
    websocketService.sendMessage({
      type: 'GAME_START',
      roomId,
      data: { timestamp: Date.now() }
    });
  }, [roomId, isConnectionReady]);

  const broadcastCardPlaced = useCallback((cardData: any) => {
    if (!roomId || !isConnectionReady) {
      console.warn('⚠️ Cannot broadcast card placed - connection not ready:', { roomId, isConnectionReady });
      return;
    }
    
    console.log('📤 Broadcasting card placed:', cardData);
    websocketService.sendMessage({
      type: 'CARD_PLACED',
      roomId,
      data: cardData
    });
  }, [roomId, isConnectionReady]);

  const broadcastSongSet = useCallback((song: Song) => {
    if (!roomId || !isConnectionReady) {
      console.warn('⚠️ Cannot broadcast song set - connection not ready:', { roomId, isConnectionReady });
      return;
    }
    
    console.log('📤 Broadcasting song set:', song);
    websocketService.sendMessage({
      type: 'SONG_SET',
      roomId,
      data: song
    });
  }, [roomId, isConnectionReady]);

  const sendHostSetSongs = useCallback((songList: Song[], hostId: string) => {
    if (!roomId || !isConnectionReady) {
      console.warn('⚠️ Cannot send HOST_SET_SONGS - connection not ready:', { roomId, isConnectionReady });
      return;
    }
    
    console.log('📤 Sending HOST_SET_SONGS:', songList.length, 'songs');
    websocketService.sendHostSetSongs(roomId, songList, hostId);
  }, [roomId, isConnectionReady]);

  const setHostStatus = useCallback((isHost: boolean) => {
    websocketService.setHostStatus(isHost);
  }, []);

  const forceReconnect = useCallback(() => {
    if (roomId) {
      setSyncState(prev => ({ ...prev, reconnectAttempts: 0 }));
      setIsConnectionReady(false);
      websocketService.connect(roomId);
    }
  }, [roomId]);

  return {
    syncState: {
      ...syncState,
      isReady: isConnectionReady
    },
    broadcastRoomUpdate,
    broadcastPlayerUpdate,
    broadcastGameStart,
    broadcastCardPlaced,
    broadcastSongSet,
    sendHostSetSongs,
    setHostStatus,
    forceReconnect
  };
}

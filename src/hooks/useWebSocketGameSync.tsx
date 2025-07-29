
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
  onSongSet?: (song: Song) => void
) {
  const { toast } = useToast();
  const [syncState, setSyncState] = useState<WebSocketGameSyncState>({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    lastError: null
  });

  // Connect to WebSocket when room ID is available
  useEffect(() => {
    if (!roomId) {
      setSyncState(prev => ({ ...prev, isConnected: false }));
      return;
    }

    const connectToRoom = async () => {
      try {
        setSyncState(prev => ({ ...prev, isConnecting: true, lastError: null }));
        await websocketService.connect(roomId);
        
        const status = websocketService.getConnectionStatus();
        setSyncState(prev => ({ 
          ...prev, 
          isConnected: status.isConnected,
          isConnecting: false,
          reconnectAttempts: status.reconnectAttempts
        }));

      } catch (error) {
        console.error('❌ Failed to connect to WebSocket:', error);
        setSyncState(prev => ({ 
          ...prev, 
          isConnecting: false,
          lastError: error instanceof Error ? error.message : 'Connection failed'
        }));
        
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

    return () => {
      // Cleanup listeners
      websocketService.off('ROOM_UPDATE', handleRoomUpdate);
      websocketService.off('PLAYER_UPDATE', handlePlayerUpdate);
      websocketService.off('GAME_START', handleGameStart);
      websocketService.off('CARD_PLACED', handleCardPlaced);
      websocketService.off('SONG_SET', handleSongSet);
    };
  }, [onRoomUpdate, onPlayerUpdate, onGameStart, onCardPlaced, onSongSet]);

  // Broadcast functions
  const broadcastRoomUpdate = useCallback((roomData: Partial<GameRoom>) => {
    if (!roomId) return;
    
    websocketService.sendMessage({
      type: 'ROOM_UPDATE',
      roomId,
      data: roomData
    });
  }, [roomId]);

  const broadcastPlayerUpdate = useCallback((players: Player[]) => {
    if (!roomId) return;
    
    websocketService.sendMessage({
      type: 'PLAYER_UPDATE',
      roomId,
      data: players
    });
  }, [roomId]);

  const broadcastGameStart = useCallback(() => {
    if (!roomId) return;
    
    websocketService.sendMessage({
      type: 'GAME_START',
      roomId,
      data: { timestamp: Date.now() }
    });
  }, [roomId]);

  const broadcastCardPlaced = useCallback((cardData: any) => {
    if (!roomId) return;
    
    websocketService.sendMessage({
      type: 'CARD_PLACED',
      roomId,
      data: cardData
    });
  }, [roomId]);

  const broadcastSongSet = useCallback((song: Song) => {
    if (!roomId) return;
    
    websocketService.sendMessage({
      type: 'SONG_SET',
      roomId,
      data: song
    });
  }, [roomId]);

  const forceReconnect = useCallback(() => {
    if (roomId) {
      setSyncState(prev => ({ ...prev, reconnectAttempts: 0 }));
      websocketService.connect(roomId);
    }
  }, [roomId]);

  return {
    syncState,
    broadcastRoomUpdate,
    broadcastPlayerUpdate,
    broadcastGameStart,
    broadcastCardPlaced,
    broadcastSongSet,
    forceReconnect
  };
}

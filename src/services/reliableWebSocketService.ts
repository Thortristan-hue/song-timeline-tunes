
import { Song, Player, GameRoom } from '@/types/game';
import { connectionManager } from './connectionManager';

export interface GameStateMessage {
  type: 'ROOM_UPDATE' | 'PLAYER_UPDATE' | 'GAME_START' | 'CARD_PLACED' | 'TURN_CHANGE' | 'SONG_SET' | 'JOIN_ROOM' | 'HOST_SET_SONGS' | 'GAME_STARTED';
  roomId: string;
  data: any;
  timestamp: number;
}

export class ReliableWebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private roomId: string | null = null;
  private isHost = false;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.setupVisibilityHandlers();
    this.setupOnlineHandlers();
  }

  private setupVisibilityHandlers() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.roomId && !this.isConnected()) {
        console.log('🔄 Page visible, attempting reconnect...');
        this.connect(this.roomId);
      }
    });
  }

  private setupOnlineHandlers() {
    window.addEventListener('online', () => {
      if (this.roomId && !this.isConnected()) {
        console.log('🌐 Network online, attempting reconnect...');
        connectionManager.resetRetries();
        this.connect(this.roomId);
      }
    });

    window.addEventListener('offline', () => {
      console.log('🌐 Network offline');
      connectionManager.setError('Network offline');
      this.cleanup();
    });
  }

  connect(roomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (connectionManager.getState().isConnecting) {
        console.log('⚠️ Already connecting, skipping duplicate attempt');
        return;
      }

      this.roomId = roomId;
      connectionManager.updateState({ isConnecting: true, lastError: null });

      this.cleanup();

      try {
        // Use a mock WebSocket server that's more reliable than echo.websocket.org
        this.ws = new WebSocket('wss://ws.postman-echo.com/raw');

        // Set connection timeout
        this.connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            console.warn('⏰ WebSocket connection timeout');
            this.handleConnectionError('Connection timeout');
            reject(new Error('Connection timeout'));
          }
        }, 10000); // 10 second timeout

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }

          connectionManager.updateState({
            isConnected: true,
            isConnecting: false,
            isReady: false // Will be set to true after JOIN_ROOM confirmation
          });
          connectionManager.resetRetries();

          // Start heartbeat
          this.startHeartbeat();

          // Join the room
          this.sendMessage({
            type: 'JOIN_ROOM',
            roomId,
            data: { timestamp: Date.now() },
            timestamp: Date.now()
          });

          // Mark as ready after successful join
          setTimeout(() => {
            connectionManager.updateState({ isReady: true });
            console.log('🔗 WebSocket connection ready for game messages');
          }, 500);

          resolve();
        };

        this.ws.onmessage = this.handleMessage.bind(this);
        this.ws.onclose = this.handleClose.bind(this);
        this.ws.onerror = this.handleError.bind(this);

      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
        this.handleConnectionError(error instanceof Error ? error.message : 'Connection failed');
        reject(error);
      }
    });
  }

  private handleMessage(event: MessageEvent) {
    try {
      if (typeof event.data !== 'string') {
        console.log('📨 Received non-string message, ignoring');
        return;
      }

      let messageData;
      try {
        messageData = JSON.parse(event.data);
      } catch (parseError) {
        console.log('📨 Received non-JSON message:', event.data.substring(0, 100));
        return;
      }

      if (!messageData || typeof messageData !== 'object' || !messageData.type) {
        console.log('📨 Invalid message structure, ignoring');
        return;
      }

      const message: GameStateMessage = messageData;
      console.log('📨 Processing WebSocket message:', message.type);

      // Handle special server-side messages
      if (message.type === 'HOST_SET_SONGS') {
        this.handleHostSetSongs(message);
        return;
      }

      // Dispatch to registered listeners
      const listeners = this.listeners.get(message.type);
      if (listeners) {
        listeners.forEach(listener => {
          try {
            listener(message.data);
          } catch (error) {
            console.error('❌ Error in message listener:', error);
          }
        });
      }
    } catch (error) {
      console.error('❌ Error processing WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent) {
    console.log('🔌 WebSocket closed:', event.code, event.reason || 'No reason');
    
    this.cleanup();
    connectionManager.updateState({
      isConnected: false,
      isConnecting: false,
      isReady: false
    });

    // Only attempt reconnect for abnormal closures and if we should retry
    if (event.code !== 1000 && this.roomId && connectionManager.shouldRetry()) {
      this.scheduleReconnect();
    } else if (!connectionManager.shouldRetry()) {
      connectionManager.setError('Max reconnection attempts reached');
    }
  }

  private handleError(error: Event) {
    console.error('❌ WebSocket error:', error);
    this.handleConnectionError('WebSocket error occurred');
  }

  private handleConnectionError(message: string) {
    connectionManager.setError(message);
    connectionManager.updateState({ isConnecting: false });
    this.cleanup();
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    connectionManager.incrementRetries();
    const delay = connectionManager.getRetryDelay();

    console.log(`🔄 Scheduling reconnect attempt ${connectionManager.getState().reconnectAttempts}/${3} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      if (this.roomId) {
        this.connect(this.roomId);
      }
    }, delay);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        try {
          this.ws?.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
        } catch (error) {
          console.warn('⚠️ Heartbeat failed:', error);
        }
      }
    }, 30000); // Every 30 seconds
  }

  private cleanup() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private async handleHostSetSongs(message: GameStateMessage) {
    console.log('🎯 HOST_SET_SONGS received - processing game initialization:', {
      roomId: message.roomId,
      songCount: message.data?.songList?.length || 0,
      hostId: message.data?.hostId,
      timestamp: message.timestamp
    });
    
    try {
      const { GameService } = await import('./gameService');
      
      console.log('🎮 Calling GameService.initializeGameWithStartingCards...');
      await GameService.initializeGameWithStartingCards(message.roomId, message.data.songList);
      console.log('✅ Game initialization completed successfully');
      
      // Broadcast game started with proper room data
      setTimeout(() => {
        console.log('📡 Broadcasting GAME_STARTED event to all clients...');
        
        const gameStartedData = {
          room: { 
            id: message.roomId, 
            phase: 'playing', 
            initialized: true,
            songs: message.data.songList || [],
            host_id: message.data.hostId,
            updated_at: new Date().toISOString()
          },
          timestamp: Date.now()
        };
        
        console.log('📡 GAME_STARTED payload:', gameStartedData);
        
        const listeners = this.listeners.get('GAME_STARTED');
        if (listeners && listeners.size > 0) {
          console.log(`📡 Notifying ${listeners.size} GAME_STARTED listeners...`);
          listeners.forEach((listener, index) => {
            try {
              listener(gameStartedData);
              console.log(`✅ GAME_STARTED listener ${index + 1} notified successfully`);
            } catch (error) {
              console.error(`❌ Error in GAME_STARTED listener ${index + 1}:`, error);
            }
          });
        } else {
          console.warn('⚠️ No GAME_STARTED listeners registered - event will not be processed');
        }
      }, 1000);
    } catch (error) {
      console.error('❌ Failed to handle HOST_SET_SONGS - game start blocked:', {
        error: error instanceof Error ? error.message : String(error),
        roomId: message.roomId,
        songCount: message.data?.songList?.length || 0
      });
    }
  }

  sendMessage(message: Partial<GameStateMessage>) {
    const state = connectionManager.getState();
    
    if (!this.isConnected() || !state.isReady) {
      console.warn('⚠️ Cannot send message - connection not ready:', {
        connected: this.isConnected(),
        ready: state.isReady
      });
      return;
    }

    try {
      const fullMessage: GameStateMessage = {
        type: message.type || 'ROOM_UPDATE',
        roomId: message.roomId || this.roomId || '',
        data: message.data || {},
        timestamp: Date.now()
      };

      console.log('📤 Sending WebSocket message:', fullMessage.type);
      this.ws?.send(JSON.stringify(fullMessage));
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      this.handleConnectionError('Failed to send message');
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  setHostStatus(isHost: boolean) {
    this.isHost = isHost;
    console.log('🏠 Host status set:', isHost);
  }

  sendHostSetSongs(roomId: string, songList: Song[], hostId: string) {
    if (!this.isHost) {
      console.warn('⚠️ Only host can send HOST_SET_SONGS');
      return;
    }

    this.sendMessage({
      type: 'HOST_SET_SONGS',
      roomId,
      data: { roomId, songList, hostId }
    });
  }

  on(eventType: string, listener: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
  }

  off(eventType: string, listener: (data: any) => void) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  disconnect() {
    console.log('🔌 Disconnecting WebSocket');
    this.roomId = null;
    this.cleanup();
    this.listeners.clear();
    connectionManager.updateState({
      isConnected: false,
      isConnecting: false,
      isReady: false,
      reconnectAttempts: 0
    });
  }

  getConnectionStatus() {
    return connectionManager.getState();
  }
}

export const reliableWebSocketService = new ReliableWebSocketService();

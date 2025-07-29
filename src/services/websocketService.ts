import { Song, Player, GameRoom } from '@/types/game';

export interface GameStateMessage {
  type: 'ROOM_UPDATE' | 'PLAYER_UPDATE' | 'GAME_START' | 'CARD_PLACED' | 'TURN_CHANGE' | 'SONG_SET' | 'JOIN_ROOM' | 'HOST_SET_SONGS' | 'GAME_STARTED';
  roomId: string;
  data: any;
  timestamp: number;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting = false;
  private roomId: string | null = null;
  private isHost = false;
  private roomSongs: Song[] = [];

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.roomId && (!this.ws || this.ws.readyState !== WebSocket.OPEN)) {
        console.log('🔄 Page became visible, reconnecting WebSocket...');
        this.connect(this.roomId);
      }
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
      if (this.roomId && (!this.ws || this.ws.readyState !== WebSocket.OPEN)) {
        console.log('🌐 Network back online, reconnecting...');
        this.connect(this.roomId);
      }
    });
  }

  connect(roomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        console.log('⚠️ Already connecting, skipping duplicate connection attempt');
        return;
      }

      this.roomId = roomId;
      this.isConnecting = true;

      // Close existing connection
      if (this.ws) {
        this.ws.close();
      }

      console.log('🔗 Connecting to WebSocket for room:', roomId);

      try {
        // Use a simple WebSocket echo server for now - in production this would be your game server
        this.ws = new WebSocket('wss://echo.websocket.org/');

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Join the room
          this.sendMessage({
            type: 'JOIN_ROOM',
            roomId,
            data: { timestamp: Date.now() },
            timestamp: Date.now()
          });
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            // Handle both string and object data from echo server
            let messageData;
            if (typeof event.data === 'string') {
              try {
                messageData = JSON.parse(event.data);
              } catch (parseError) {
                console.log('📨 WebSocket received non-JSON message, ignoring:', event.data);
                return;
              }
            } else {
              messageData = event.data;
            }

            // Validate message structure
            if (!messageData || typeof messageData !== 'object' || !messageData.type) {
              console.log('📨 WebSocket received invalid message structure, ignoring');
              return;
            }

            const message: GameStateMessage = messageData;
            console.log('📨 Received WebSocket message:', message);
            this.handleMessage(message);
          } catch (error) {
            console.log('📨 WebSocket message processing skipped due to format:', error);
            // Don't throw errors for message parsing issues - just log and continue
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket connection closed:', event.code, event.reason);
          this.isConnecting = false;
          
          if (event.code !== 1000 && this.roomId) { // Not a normal closure
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error);
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(() => {
      if (this.roomId) {
        this.connect(this.roomId);
      }
    }, delay);
  }

  private handleMessage(message: GameStateMessage) {
    // Simulate server-side behavior for song synchronization
    if (message.type === 'HOST_SET_SONGS') {
      this.handleHostSetSongs(message);
      return;
    }

    const listeners = this.listeners.get(message.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(message.data);
        } catch (error) {
          console.error('❌ Error in WebSocket message listener:', error);
        }
      });
    }
  }

  private handleHostSetSongs(message: GameStateMessage) {
    console.log('🎯 HOST_SET_SONGS received:', message.data);
    
    // Verify this is from the host (in a real server, we'd check session/auth)
    const { roomId, songList, hostId } = message.data;
    
    if (roomId !== this.roomId) {
      console.warn('⚠️ Ignoring HOST_SET_SONGS for different room');
      return;
    }

    // Store the songs (simulate server state)
    this.roomSongs = songList || [];
    console.log(`📦 Server stored ${this.roomSongs.length} songs for room ${roomId}`);

    // Broadcast GAME_STARTED to all clients (simulate server broadcast)
    const gameStartedMessage: GameStateMessage = {
      type: 'GAME_STARTED',
      roomId: roomId,
      data: {
        room: {
          id: roomId,
          phase: 'playing',
          songs: this.roomSongs,
          // Include other room data that clients need
        },
        timestamp: Date.now()
      },
      timestamp: Date.now()
    };

    console.log('📤 Server broadcasting GAME_STARTED:', gameStartedMessage);
    
    // Simulate server broadcast by triggering listeners
    setTimeout(() => {
      const listeners = this.listeners.get('GAME_STARTED');
      if (listeners) {
        listeners.forEach(listener => {
          try {
            listener(gameStartedMessage.data);
          } catch (error) {
            console.error('❌ Error in GAME_STARTED listener:', error);
          }
        });
      }
    }, 100); // Small delay to simulate server processing
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

    const message: GameStateMessage = {
      type: 'HOST_SET_SONGS',
      roomId: roomId,
      data: {
        roomId,
        songList,
        hostId
      },
      timestamp: Date.now()
    };

    console.log('📤 Host sending HOST_SET_SONGS:', message);
    this.sendMessage(message);
  }

  sendMessage(message: Partial<GameStateMessage>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not connected, cannot send message:', message);
      return;
    }

    const fullMessage: GameStateMessage = {
      type: message.type || 'ROOM_UPDATE',
      roomId: message.roomId || this.roomId || '',
      data: message.data || {},
      timestamp: Date.now()
    };

    console.log('📤 Sending WebSocket message:', fullMessage);
    this.ws.send(JSON.stringify(fullMessage));
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
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.listeners.clear();
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  getConnectionStatus() {
    return {
      isConnected: this.ws?.readyState === WebSocket.OPEN,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

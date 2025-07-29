
import { Song, Player, GameRoom } from '@/types/game';

export interface GameStateMessage {
  type: 'ROOM_UPDATE' | 'PLAYER_UPDATE' | 'GAME_START' | 'CARD_PLACED' | 'TURN_CHANGE' | 'SONG_SET' | 'JOIN_ROOM';
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
            const message: GameStateMessage = JSON.parse(event.data);
            console.log('📨 Received WebSocket message:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
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

import { GameService } from './gameService';
import { Song, Player, GameRoom } from '@/types/game';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  roomId?: string;
}

export interface WebSocketCallbacks {
  onRoomUpdate?: (room: GameRoom) => void;
  onPlayersUpdate?: (players: Player[]) => void;
  onGameStart?: (data: any) => void;
  onCardPlaced?: (data: any) => void;
  onSongSet?: (song: Song) => void;
  onGameStarted?: (data: any) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private roomId: string | null = null;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private isHost = false;

  constructor(roomId: string, callbacks: WebSocketCallbacks) {
    this.roomId = roomId;
    this.callbacks = callbacks;
    this.connect();
  }

  private connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    
    try {
      const wsUrl = this.getWebSocketUrl();
      console.log('[WebSocket] Connecting to:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/game/${this.roomId}`;
  }

  private handleOpen(): void {
    console.log('[WebSocket] Connected successfully');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Send queued messages
    this.flushMessageQueue();
    
    // Notify connection change
    if (this.callbacks.onConnectionChange) {
      this.callbacks.onConnectionChange(true);
    }
    
    // Join room
    this.send({
      type: 'joinRoom',
      data: { roomId: this.roomId, isHost: this.isHost },
      timestamp: Date.now()
    });
  }

  private async handleMessage(event: MessageEvent): Promise<void> {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('[WebSocket] Message received:', message);
      
      const { type, data } = message;
      
      switch (type) {
        case 'roomUpdate':
          if (this.callbacks.onRoomUpdate) {
            this.callbacks.onRoomUpdate(data);
          }
          break;
          
        case 'playersUpdate':
          if (this.callbacks.onPlayersUpdate) {
            this.callbacks.onPlayersUpdate(data);
          }
          break;
          
        case 'cardPlaced':
          if (this.callbacks.onCardPlaced) {
            this.callbacks.onCardPlaced(data);
          }
          break;
          
        case 'songSet':
          if (this.callbacks.onSongSet) {
            this.callbacks.onSongSet(data);
          }
          break;
          
        case 'gameStart':
          console.log('[WebSocket] Game start received:', data);
          if (this.callbacks.onGameStart) {
            this.callbacks.onGameStart(data);
          }
          
          // Initialize game if we have songs
          if (data.songs && data.songs.length > 0) {
            try {
              await GameService.initializeGameWithStartingCards(this.roomId!, data.songs);
            } catch (error) {
              console.error('[WebSocket] Failed to initialize game:', error);
            }
          }
          break;
          
        case 'gameStarted':
          if (this.callbacks.onGameStarted) {
            this.callbacks.onGameStarted(data);
          }
          break;
          
        case 'pong':
          // Heartbeat response - connection is alive
          break;
          
        case 'error':
          console.error('[WebSocket] Server error:', data);
          if (this.callbacks.onError) {
            this.callbacks.onError(new Error(data.message || 'WebSocket server error'));
          }
          break;
          
        default:
          console.warn('[WebSocket] Unknown message type:', type);
      }
      
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error as Error);
      }
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('[WebSocket] Connection closed:', event.code, event.reason);
    this.isConnecting = false;
    
    // Stop heartbeat
    this.stopHeartbeat();
    
    // Notify connection change
    if (this.callbacks.onConnectionChange) {
      this.callbacks.onConnectionChange(false);
    }
    
    // Attempt to reconnect if not a clean close
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  private handleError(error: Event): void {
    console.error('[WebSocket] Connection error:', error);
    this.isConnecting = false;
    
    if (this.callbacks.onError) {
      this.callbacks.onError(new Error('WebSocket connection error'));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      if (this.callbacks.onError) {
        this.callbacks.onError(new Error('Max reconnection attempts reached'));
      }
      return;
    }
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`[WebSocket] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'ping',
          data: {},
          timestamp: Date.now()
        });
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendImmediate(message);
      }
    }
  }

  private sendImmediate(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[WebSocket] Error sending message:', error);
      }
    }
  }

  public send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sendImmediate(message);
    } else {
      // Queue message for later
      this.messageQueue.push(message);
      
      // Try to connect if not already connecting
      if (!this.isConnecting && (!this.ws || this.ws.readyState === WebSocket.CLOSED)) {
        this.connect();
      }
    }
  }

  public setHostStatus(isHost: boolean): void {
    this.isHost = isHost;
  }

  public forceReconnect(): void {
    console.log('[WebSocket] Force reconnecting...');
    this.reconnectAttempts = 0;
    
    if (this.ws) {
      this.ws.close();
    }
    
    setTimeout(() => {
      this.connect();
    }, 100);
  }

  public disconnect(): void {
    console.log('[WebSocket] Disconnecting...');
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.messageQueue = [];
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public getConnectionState(): {
    isConnected: boolean;
    isConnecting: boolean;
    reconnectAttempts: number;
  } {
    return {
      isConnected: this.isConnected(),
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

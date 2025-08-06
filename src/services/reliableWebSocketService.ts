import { GameService } from './gameService';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export class ReliableWebSocket {
  private url: string;
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 1000;
  private maxReconnectAttempts: number = 10;
  private reconnectAttempts: number = 0;
  private messageQueue: string[] = [];
  private isConnected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private roomId: string | null = null;
  private onOpenCallback: (() => void) | null = null;
  private onCloseCallback: (() => void) | null = null;
  private onErrorCallback: ((error: Event) => void) | null = null;
  private onMessageCallback: ((message: any) => void) | null = null;
  private onGameStart: ((data: any) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  public setRoomId(roomId: string) {
    this.roomId = roomId;
  }

  public setOnOpen(callback: () => void) {
    this.onOpenCallback = callback;
  }

  public setOnClose(callback: () => void) {
    this.onCloseCallback = callback;
  }

  public setOnError(callback: (error: Event) => void) {
    this.onErrorCallback = callback;
  }

  public setOnMessage(callback: (message: any) => void) {
    this.onMessageCallback = callback;
  }

  public setOnGameStart(callback: (data: any) => void) {
    this.onGameStart = callback;
  }

  public connect(): void {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => this.onOpen();
    this.ws.onclose = (event) => this.onClose(event);
    this.ws.onerror = (error) => this.onError(error);
    this.ws.onmessage = (message) => this.onMessage(message);
  }

  private onOpen(): void {
    console.log('[ReliableWebSocket] Connected to WebSocket server');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.flushMessageQueue();
    if (this.onOpenCallback) {
      this.onOpenCallback();
    }
  }

  private onClose(event: CloseEvent): void {
    console.log('[ReliableWebSocket] Disconnected from WebSocket server:', event.reason, event.code);
    this.isConnected = false;
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
    this.reconnect();
  }

  private onError(error: Event): void {
    console.error('[ReliableWebSocket] WebSocket error:', error);
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }

  private onMessage(message: MessageEvent): void {
    try {
      const data = JSON.parse(message.data);
      this.handleMessage(data);
      if (this.onMessageCallback) {
        this.onMessageCallback(data);
      }
    } catch (error) {
      console.error('[ReliableWebSocket] Failed to parse message data:', error);
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[ReliableWebSocket] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('[ReliableWebSocket] Max reconnect attempts reached. Giving up.');
    }
  }

  public send(message: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    } else {
      this.messageQueue.push(message);
      console.log(`[ReliableWebSocket] Queued message: ${message}`);
    }
  }

  private flushMessageQueue(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        if (message) {
          this.ws.send(message);
          console.log(`[ReliableWebSocket] Sent queued message: ${message}`);
        }
      }
    }
  }

  public close(): void {
    if (this.ws) {
      this.ws.close();
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  public isWsConnected(): boolean {
    return this.isConnected;
  }

  private handleMessage(data: WebSocketMessage): void {
    //console.log('[ReliableWebSocket] Received message:', data);

    if (data.type === 'roomUpdate') {
      console.log('[ReliableWebSocket] Room update received:', data);
    }

    if (data.type === 'playersUpdate') {
      console.log('[ReliableWebSocket] Players update received:', data);
    }

    if (data.type === 'cardPlaced') {
      console.log('[ReliableWebSocket] Card placed:', data);
    }

    if (data.type === 'songSet') {
      console.log('[ReliableWebSocket] Song set:', data);
    }

    // In the handleMessage method, replace the initializeGameWithStartingCards call:
    if (data.type === 'gameStart') {
      console.log('[ReliableWebSocket] Game start received:', data);
      if (this.onGameStart) {
        this.onGameStart(data);
      }
      
      // Initialize game if we have songs
      if (data.songs && data.songs.length > 0) {
        try {
          await GameService.initializeGameWithStartingCards(this.roomId!, data.songs);
        } catch (error) {
          console.error('[ReliableWebSocket] Failed to initialize game:', error);
        }
      }
    }
  }
}

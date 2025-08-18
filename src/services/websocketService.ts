import { gameService } from '@/services/gameService';
import { Song } from '@/types/game';

export class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number;
  private reconnectTimeoutId: number | null = null;
  private messageQueue: string[] = [];
  private isReconnecting: boolean = false;

  constructor(url: string, reconnectInterval: number = 3000) {
    this.url = url;
    this.reconnectInterval = reconnectInterval;
  }

  connect(roomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(`${this.url}?roomId=${roomId}`);
  
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.isReconnecting = false;
        this.clearReconnectTimeout();
        this.flushMessageQueue();
        resolve();
      };
  
      this.socket.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
      };
  
      this.socket.onclose = (event) => {
        console.log('WebSocket closed:', event.reason, event.code);
        if (event.code !== 1000) {
          // Normal closure should not trigger a reconnect
          this.reconnect();
        }
      };
  
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
        this.reconnect();
      };
    });
  }

  private reconnect(): void {
    if (this.isReconnecting) {
      return; // Prevent multiple reconnect attempts
    }
    this.isReconnecting = true;
    console.log(`Attempting to reconnect in ${this.reconnectInterval}ms`);
    this.reconnectTimeoutId = window.setTimeout(() => {
      this.connect('').catch(() => {
        console.log('Reconnection attempt failed.');
      });
    }, this.reconnectInterval);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  disconnect(): void {
    if (!this.socket) return;
    this.socket.close(1000, 'Normal closure');
    this.socket = null;
    this.clearReconnectTimeout();
  }

  sendMessage(message: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not connected, queuing message:', message);
      this.messageQueue.push(message);
      return;
    }
    this.socket.send(message);
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  async initializeGame(roomId: string, songs: Song[]): Promise<void> {
    try {
      await gameService.initializeGameWithStartingCards(roomId, songs);
    } catch (error) {
      console.error('Failed to initialize game:', error);
      throw error;
    }
  }
}

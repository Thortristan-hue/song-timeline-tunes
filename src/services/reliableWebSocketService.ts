import { RealtimeChannel } from '@supabase/supabase-js';
import { gameService } from '../gameService';
import { Song } from '@/types/game';

interface WebSocketMessage<T> {
  type: string;
  payload: T;
}

export class ReliableWebSocketService {
  private roomId: string;
  private channel: RealtimeChannel | null = null;
  private onMessageCallback: ((message: WebSocketMessage<any>) => void) | null = null;
  private onStatusChangeCallback: ((status: string) => void) | null = null;

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  async subscribe(
    channel: RealtimeChannel,
    onMessage: (message: WebSocketMessage<any>) => void,
    onStatusChange: (status: string) => void
  ): Promise<void> {
    this.channel = channel;
    this.onMessageCallback = onMessage;
    this.onStatusChangeCallback = onStatusChange;

    channel
      .on('broadcast', { event: '*' }, (payload) => {
        if (this.onMessageCallback) {
          this.onMessageCallback(payload.payload as WebSocketMessage<any>);
        }
      })
      .subscribe((status) => {
        if (this.onStatusChangeCallback) {
          this.onStatusChangeCallback(status);
        }
      });
  }

  unsubscribe(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
      this.onMessageCallback = null;
      this.onStatusChangeCallback = null;
    }
  }

  sendMessage<T>(type: string, payload: T): void {
    if (this.channel) {
      this.channel.send({
        type: 'broadcast',
        event: type,
        payload: {
          type: type,
          payload: payload,
        },
      });
    } else {
      console.warn('WebSocket is not connected, message not sent.');
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

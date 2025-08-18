import { Socket, Channel } from 'phoenix';

interface RealtimeChannel {
  socket: Socket;
  topic: string;
  channel: Channel;
  isConnected: boolean;
  timeout: number;
  reconnectAfterMs: number;
}

export class ReliableWebSocket {
  private socket: Socket;
  private channel: Channel | null = null;
  private topic: string;
  private url: string;
  private isConnected: boolean = false;
  private timeout: number = 5000;
  private reconnectAfterMs: number = 5000;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 5;
  private reconnectTimer: any;

  constructor(url: string, topic: string) {
    this.url = url;
    this.topic = topic;
    this.socket = new Socket(this.url, {
      params: {
        // Add any necessary params here
      },
    });

    this.socket.onOpen(() => {
      console.log('🔗 WebSocket connected');
      this.isConnected = true;
      this.connectionAttempts = 0;
    });

    this.socket.onClose(() => {
      console.log('❌ WebSocket disconnected');
      this.isConnected = false;
      this.reconnect();
    });

    this.socket.onError((error) => {
      console.error('🚨 WebSocket error', error);
      this.isConnected = false;
      this.reconnect();
    });
  }

  connect(): void {
    if (this.isConnected) {
      console.log('WebSocket already connected');
      return;
    }

    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.warn('Max connection attempts reached. Not reconnecting.');
      return;
    }

    this.connectionAttempts++;
    console.log(`Attempting to connect... (Attempt ${this.connectionAttempts})`);

    this.socket.connect();
    this.setupChannel();
  }

  private setupChannel(): void {
    if (this.channel && this.channel.topic) {
      this.channel.unsubscribe();
    }

    this.channel = this.socket.channel(this.topic, {});

    this.channel
      .join()
      .receive('ok', (resp) => {
        console.log('✅ Channel joined successfully', resp);
      })
      .receive('error', (resp) => {
        console.error('❌ Unable to join channel', resp);
      })
      .receive('timeout', () => {
        console.log('⏳ Timeout while joining channel');
        this.reconnect();
      });

    this.channel.onError((reason) => {
      console.error('Channel error', reason);
      this.reconnect();
    });

    this.channel.onClose(() => {
      console.log('Channel closed');
      this.reconnect();
    });
  }

  private reconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      this.connect();
    }, this.reconnectAfterMs);
  }

  sendMessage(event: string, payload: any): void {
    if (this.channel) {
      this.channel
        .push(event, payload)
        .receive('ok', (resp) => {
          console.log('👍 Message sent successfully', resp);
        })
        .receive('error', (resp) => {
          console.error('👎 Failed to send message', resp);
        })
        .receive('timeout', () => {
          console.log('⏳ Timeout sending message');
        });
    } else {
      console.warn('Channel not initialized. Message not sent.');
    }
  }

  disconnect(): void {
    if (this.channel) {
      this.channel.leave();
    }
    this.socket.disconnect();
    this.isConnected = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
  }
}

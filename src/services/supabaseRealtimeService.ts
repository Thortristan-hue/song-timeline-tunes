import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js';
import { Song, Player, GameRoom } from '@/types/game';

export interface GameMessage {
  type: 'ROOM_UPDATE' | 'PLAYER_UPDATE' | 'GAME_START' | 'CARD_PLACED' | 'SONG_SET' | 'GAME_STARTED' | 'TURN_TRANSITION';
  roomId: string;
  data: any;
  timestamp: number;
  sender?: string;
}

export class SupabaseRealtimeService {
  private channel: RealtimeChannel | null = null;
  private currentRoomId: string | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isHost = false;
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Handle page visibility changes for reconnection
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.currentRoomId && this.connectionStatus !== 'connected') {
        console.log('🔄 Page became visible, reconnecting...');
        this.connect(this.currentRoomId);
      }
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
      if (this.currentRoomId && this.connectionStatus !== 'connected') {
        console.log('🌐 Network back online, reconnecting...');
        this.connect(this.currentRoomId);
      }
    });
  }

  async connect(roomId: string): Promise<void> {
    if (this.currentRoomId === roomId && this.connectionStatus === 'connected') {
      console.log('✅ Already connected to room:', roomId);
      return;
    }

    this.currentRoomId = roomId;
    this.connectionStatus = 'connecting';

    // Cleanup existing connection
    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }

    console.log('🔗 Connecting to realtime for room:', roomId);

    try {
      // Create a broadcast channel for real-time communication
      this.channel = supabase.channel(`game-room-${roomId}`, {
        config: {
          broadcast: { 
            self: false, // Don't receive our own messages
            ack: true    // Request acknowledgments
          },
          presence: { 
            key: `player-${Date.now()}` 
          }
        }
      });

      // Listen for broadcast messages
      this.channel
        .on('broadcast', { event: 'game-message' }, (payload) => {
          this.handleMessage(payload.payload as GameMessage);
        })
        .on('presence', { event: 'sync' }, () => {
          const state = this.channel?.presenceState();
          console.log('👥 Presence sync:', Object.keys(state || {}).length, 'users online');
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('👋 Player joined:', key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('👋 Player left:', key, leftPresences);
        });

      // Subscribe to the channel with proper callback handling
      const subscribePromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Subscription timeout after 10 seconds'));
        }, 10000);

        this.channel?.subscribe((status, err) => {
          clearTimeout(timeout);
          console.log('📡 Subscription status:', status, err);
          
          if (status === 'SUBSCRIBED') {
            this.connectionStatus = 'connected';
            console.log('✅ Connected to realtime for room:', roomId);
            resolve();
          } else if (status === 'TIMED_OUT') {
            reject(new Error('Subscription timed out'));
          } else if (status === 'CLOSED') {
            reject(new Error('Channel closed'));
          } else if (status === 'CHANNEL_ERROR') {
            const errorMsg = err ? (typeof err === 'string' ? err : JSON.stringify(err)) : 'Channel error';
            reject(new Error(errorMsg));
          }
        });
      });

      await subscribePromise;
      
      // Track our presence after successful connection
      if (this.channel) {
        await this.channel.track({
          user_id: `user-${Date.now()}`,
          online_at: new Date().toISOString(),
          is_host: this.isHost
        });
      }

    } catch (error) {
      // Safely handle error to prevent cyclic reference issues
      const errorMessage = error instanceof Error ? error.message : 
                           (typeof error === 'string' ? error : 'Failed to connect to realtime');
      console.error('❌ Failed to connect to realtime:', errorMessage);
      this.connectionStatus = 'disconnected';
      throw new Error(errorMessage);
    }
  }

  private handleMessage(message: GameMessage) {
    if (!message || typeof message !== 'object') {
      console.warn('⚠️ Invalid message received:', message);
      return;
    }

    console.log('📨 Received realtime message:', message);

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
  }

  async sendMessage(message: Partial<GameMessage>): Promise<RealtimeChannelSendResponse> {
    if (!this.channel || this.connectionStatus !== 'connected') {
      console.warn('⚠️ Cannot send message - not connected, status:', this.connectionStatus);
      return 'error';
    }

    if (!this.currentRoomId) {
      console.warn('⚠️ Cannot send message - no room ID');
      return 'error';
    }

    const fullMessage: GameMessage = {
      type: message.type || 'ROOM_UPDATE',
      roomId: message.roomId || this.currentRoomId,
      data: message.data || {},
      timestamp: Date.now(),
      sender: this.isHost ? 'host' : 'player'
    };

    console.log('📤 Sending realtime message:', fullMessage.type, 'to room:', this.currentRoomId);

    try {
      const response = await this.channel.send({
        type: 'broadcast',
        event: 'game-message',
        payload: fullMessage
      });

      if (response === 'ok') {
        console.log('✅ Message sent successfully');
      } else {
        console.warn('⚠️ Message send response:', response);
      }

      return response;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      return 'error';
    }
  }

  // Broadcast methods for game events
  async broadcastPlayerUpdate(players: Player[]): Promise<void> {
    await this.sendMessage({
      type: 'PLAYER_UPDATE',
      data: players
    });
  }

  async broadcastGameStart(): Promise<void> {
    await this.sendMessage({
      type: 'GAME_START',
      data: { timestamp: Date.now() }
    });
  }

  async broadcastCardPlaced(cardData: any): Promise<void> {
    await this.sendMessage({
      type: 'CARD_PLACED',
      data: cardData
    });
  }

  async broadcastSongSet(song: Song): Promise<void> {
    await this.sendMessage({
      type: 'SONG_SET',
      data: song
    });
  }

  async broadcastGameStarted(room: GameRoom): Promise<void> {
    await this.sendMessage({
      type: 'GAME_STARTED',
      data: { room, timestamp: Date.now() }
    });
  }

  async broadcastTurnTransition(data: any): Promise<void> {
    await this.sendMessage({
      type: 'TURN_TRANSITION',
      data
    });
  }

  // Event listener management
  on(eventType: string, listener: (data: any) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
  }

  off(eventType: string, listener: (data: any) => void): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  setHostStatus(isHost: boolean): void {
    this.isHost = isHost;
    console.log('🏠 Host status set:', isHost);

    // Update presence with host status
    if (this.channel) {
      this.channel.track({
        user_id: `user-${Date.now()}`,
        online_at: new Date().toISOString(),
        is_host: isHost
      });
    }
  }

  getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' {
    return this.connectionStatus;
  }

  async disconnect(): Promise<void> {
    console.log('🔌 Disconnecting from realtime');
    
    this.connectionStatus = 'disconnected';
    this.currentRoomId = null;
    
    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }
    
    this.listeners.clear();
  }

  async forceReconnect(): Promise<void> {
    if (this.currentRoomId) {
      console.log('🔄 Force reconnecting...');
      await this.disconnect();
      await this.connect(this.currentRoomId);
    }
  }
}

// Export singleton instance
export const supabaseRealtimeService = new SupabaseRealtimeService();
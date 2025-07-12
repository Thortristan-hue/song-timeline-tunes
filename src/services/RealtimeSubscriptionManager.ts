
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface SubscriptionConfig {
  roomId: string;
  onRoomUpdate: (payload: any) => void;
  onPlayersUpdate: (roomId: string) => void;
  onGameMovesUpdate: (payload: any) => void;
}

export class RealtimeSubscriptionManager {
  private channel: RealtimeChannel | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseDelay = 1000; // 1 second
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isDestroyed = false;
  private config: SubscriptionConfig | null = null;

  constructor() {
    console.log('🔄 RealtimeSubscriptionManager initialized');
  }

  async subscribe(config: SubscriptionConfig): Promise<boolean> {
    this.config = config;
    return this.createSubscription();
  }

  private async createSubscription(): Promise<boolean> {
    if (this.isDestroyed || !this.config) {
      console.log('⚠️ Cannot create subscription: manager destroyed or no config');
      return false;
    }

    // Clean up existing subscription
    this.cleanup();

    const { roomId, onRoomUpdate, onPlayersUpdate, onGameMovesUpdate } = this.config;

    try {
      console.log(`🔄 Creating subscription for room: ${roomId}`);

      this.channel = supabase
        .channel(`room-${roomId}-${Date.now()}`) // Unique channel name to avoid conflicts
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${roomId}`
        }, (payload) => {
          console.log('🔄 SYNC: Room updated:', payload.new);
          onRoomUpdate(payload);
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`
        }, (payload) => {
          console.log('🎮 SYNC: Player change:', payload);
          onPlayersUpdate(roomId);
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'game_moves',
          filter: `room_id=eq.${roomId}`
        }, (payload) => {
          console.log('🎯 SYNC: Game move:', payload);
          onGameMovesUpdate(payload);
        })
        .subscribe((status, error) => {
          console.log(`📡 Subscription status: ${status}`, error);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to real-time updates');
            this.reconnectAttempts = 0; // Reset on successful connection
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.error(`❌ Subscription error: ${status}`, error);
            this.handleSubscriptionError();
          }
        });

      return true;
    } catch (error) {
      console.error('❌ Failed to create subscription:', error);
      this.handleSubscriptionError();
      return false;
    }
  }

  private handleSubscriptionError(): void {
    if (this.isDestroyed || !this.config) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached. Stopping reconnection.');
      return;
    }

    const delay = this.calculateBackoffDelay();
    this.reconnectAttempts++;

    console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      if (!this.isDestroyed) {
        this.createSubscription();
      }
    }, delay);
  }

  private calculateBackoffDelay(): number {
    // Exponential backoff with jitter: base * 2^attempts + random(0, 1000)
    const exponentialDelay = this.baseDelay * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.channel) {
      console.log('🧹 Cleaning up existing subscription');
      this.channel.unsubscribe();
      this.channel = null;
    }
  }

  async refreshGameState(): Promise<void> {
    if (!this.config) return;

    try {
      console.log('🔄 Refreshing game state after reconnection...');
      // Trigger a fresh fetch of players data
      this.config.onPlayersUpdate(this.config.roomId);
    } catch (error) {
      console.error('❌ Failed to refresh game state:', error);
    }
  }

  destroy(): void {
    console.log('🧹 Destroying RealtimeSubscriptionManager');
    this.isDestroyed = true;
    this.cleanup();
    this.config = null;
  }

  isConnected(): boolean {
    return this.channel?.state === 'joined';
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}

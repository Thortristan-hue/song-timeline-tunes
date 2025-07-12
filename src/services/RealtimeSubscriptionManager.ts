
import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

export interface SubscriptionCallbacks {
  onRoomUpdate?: (payload: any) => void;
  onPlayerUpdate?: (payload: any) => void;
  onGameMoveUpdate?: (payload: any) => void;
  onError?: (error: any) => void;
  onReconnect?: () => void;
}

export class RealtimeSubscriptionManager {
  private supabase: SupabaseClient<Database>;
  private channels: Map<string, RealtimeChannel> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000; // 1 second
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isReconnecting = false;
  private roomId: string | null = null;
  private callbacks: SubscriptionCallbacks = {};

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  async subscribeToRoom(roomId: string, callbacks: SubscriptionCallbacks) {
    console.log('Subscribing to room:', roomId);
    this.roomId = roomId;
    this.callbacks = callbacks;
    
    // Clean up any existing subscriptions
    this.cleanup();
    
    try {
      await this.createSubscriptions();
      this.reconnectAttempts = 0; // Reset on successful connection
    } catch (error) {
      console.error('Failed to create subscriptions:', error);
      this.handleConnectionError();
    }
  }

  private async createSubscriptions() {
    if (!this.roomId) return;

    console.log('Creating real-time subscriptions for room:', this.roomId);

    // Room updates subscription
    const roomChannel = this.supabase
      .channel(`room-${this.roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${this.roomId}`
      }, (payload) => {
        console.log('Room updated:', payload.new);
        console.log('Room updated with turn/mystery card:', payload.new);
        this.callbacks.onRoomUpdate?.(payload);
      })
      .on('system', { event: 'error' }, (error) => {
        console.error('Room subscription error:', error);
        this.handleConnectionError();
      })
      .subscribe((status) => {
        console.log('Room subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to room updates');
        }
      });

    // Players subscription
    const playersChannel = this.supabase
      .channel(`players-${this.roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${this.roomId}`
      }, (payload) => {
        console.log('Player update:', payload);
        this.callbacks.onPlayerUpdate?.(payload);
      })
      .on('system', { event: 'error' }, (error) => {
        console.error('Players subscription error:', error);
        this.handleConnectionError();
      })
      .subscribe((status) => {
        console.log('Players subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to player updates');
        }
      });

    // Game moves subscription
    const movesChannel = this.supabase
      .channel(`moves-${this.roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_moves',
        filter: `room_id=eq.${this.roomId}`
      }, (payload) => {
        console.log('Game move update:', payload);
        this.callbacks.onGameMoveUpdate?.(payload);
      })
      .on('system', { event: 'error' }, (error) => {
        console.error('Game moves subscription error:', error);
        this.handleConnectionError();
      })
      .subscribe((status) => {
        console.log('Game moves subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to game moves');
        }
      });

    // Store channels for cleanup
    this.channels.set('room', roomChannel);
    this.channels.set('players', playersChannel);
    this.channels.set('moves', movesChannel);

    // Set up error handlers for all channels
    [roomChannel, playersChannel, movesChannel].forEach(channel => {
      channel.on('system', { event: 'error' }, (error) => {
        console.error('Subscription error:', error);
        this.handleConnectionError();
      });
    });
  }

  private handleConnectionError() {
    if (this.isReconnecting) return;

    console.error('Subscription error detected');
    this.callbacks.onError?.('Connection lost');

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    } else {
      console.error('Max reconnection attempts reached');
      this.callbacks.onError?.('Max reconnection attempts reached');
    }
  }

  private attemptReconnect() {
    if (this.isReconnecting) return;

    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    // Exponential backoff with jitter
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1) + Math.random() * 1000,
      30000 // Cap at 30 seconds
    );

    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay.toFixed(0)}ms`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        // Clean up existing subscriptions
        this.cleanup(false);
        
        // Re-fetch current state and recreate subscriptions
        await this.refetchStateAndReconnect();
        
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        console.log('Successfully reconnected');
        
        this.callbacks.onReconnect?.();
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.isReconnecting = false;
        
        // Try again if we haven't hit the limit
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => this.attemptReconnect(), 1000);
        }
      }
    }, delay);
  }

  private async refetchStateAndReconnect() {
    if (!this.roomId) return;

    console.log('Refetching current room state before reconnection');
    
    // Re-fetch current room state
    const { data: roomData, error: roomError } = await this.supabase
      .from('game_rooms')
      .select('*')
      .eq('id', this.roomId)
      .single();

    if (roomError) {
      console.error('Failed to refetch room state:', roomError);
      throw roomError;
    }

    // Re-fetch players
    const { data: playersData, error: playersError } = await this.supabase
      .from('players')
      .select('*')
      .eq('room_id', this.roomId);

    if (playersError) {
      console.error('Failed to refetch players:', playersError);
      throw playersError;
    }

    console.log('Successfully refetched room state, recreating subscriptions');
    
    // Recreate subscriptions
    await this.createSubscriptions();
    
    // Notify about the refetched state
    this.callbacks.onRoomUpdate?.({ 
      eventType: 'UPDATE', 
      new: roomData, 
      old: {} 
    });
    
    if (playersData) {
      playersData.forEach(player => {
        this.callbacks.onPlayerUpdate?.({ 
          eventType: 'UPDATE', 
          new: player, 
          old: {} 
        });
      });
    }
  }

  cleanup(resetReconnection = true) {
    console.log('Cleaning up real-time subscriptions');
    
    // Clear reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Unsubscribe from all channels
    this.channels.forEach((channel, key) => {
      console.log(`Unsubscribing from ${key} channel`);
      channel.unsubscribe();
    });
    
    this.channels.clear();

    if (resetReconnection) {
      this.isReconnecting = false;
      this.reconnectAttempts = 0;
      this.roomId = null;
      this.callbacks = {};
    }
  }

  getConnectionStatus(): 'connected' | 'disconnected' | 'reconnecting' {
    if (this.isReconnecting) return 'reconnecting';
    if (this.channels.size > 0) return 'connected';
    return 'disconnected';
  }
}

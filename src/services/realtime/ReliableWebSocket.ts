import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { realtimeMessageSchema, RealtimeMessageInput } from '@/schemas/validation';
import { ZodError } from 'zod';

export interface RealtimeCallbacks {
  onRoomUpdate?: (payload: any) => void;
  onPlayersUpdate?: (payload: any) => void;
  onGameStart?: (payload: any) => void;
  onCardPlaced?: (payload: any) => void;
  onSongSet?: (payload: any) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean, retryCount?: number) => void;
}

export interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastError: string | null;
  retryCount: number;
}

export class ReliableWebSocket {
  private channel: RealtimeChannel | null = null;
  private roomId: string | null = null;
  private callbacks: RealtimeCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseReconnectDelay = 1000;
  private isConnecting = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionState: ConnectionState = {
    isConnected: false,
    isReconnecting: false,
    lastError: null,
    retryCount: 0
  };

  constructor(roomId?: string, callbacks?: RealtimeCallbacks) {
    if (roomId) this.roomId = roomId;
    if (callbacks) this.callbacks = callbacks;
  }

  public setRoomId(roomId: string): void {
    this.roomId = roomId;
  }

  public setCallbacks(callbacks: RealtimeCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  public async connect(): Promise<void> {
    if (!this.roomId) {
      const error = new Error('Room ID is required for connection');
      this.handleError(error);
      return;
    }

    if (this.isConnecting || this.connectionState.isConnected) {
      return;
    }

    this.isConnecting = true;
    this.updateConnectionState({ isReconnecting: true });

    try {
      console.log('📡 [ReliableWebSocket] Connecting to room:', this.roomId);
      
      // Clean up existing connection
      await this.disconnect();

      const channelName = `room_${this.roomId}`;
      this.channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: '' }
        }
      });

      // Set up event listeners
      this.setupEventListeners();

      // Subscribe to the channel
      const subscriptionResult = await this.channel.subscribe((status) => {
        console.log('📡 [ReliableWebSocket] Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ [ReliableWebSocket] Successfully connected');
          this.onConnectionSuccess();
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [ReliableWebSocket] Channel error');
          this.onConnectionError(new Error('Channel subscription failed'));
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ [ReliableWebSocket] Connection timed out');
          this.onConnectionError(new Error('Connection timed out'));
        }
      });

      if (subscriptionResult === 'ok') {
        console.log('📡 [ReliableWebSocket] Subscription request sent');
      } else {
        throw new Error('Failed to initiate subscription');
      }

    } catch (error) {
      console.error('❌ [ReliableWebSocket] Connection failed:', error);
      this.onConnectionError(error as Error);
    } finally {
      this.isConnecting = false;
    }
  }

  private setupEventListeners(): void {
    if (!this.channel) return;

    // Listen for room updates
    this.channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'game_rooms',
      filter: `id=eq.${this.roomId}`
    }, (payload) => {
      console.log('📡 [ReliableWebSocket] Room update:', payload);
      this.callbacks.onRoomUpdate?.(payload);
    });

    // Listen for player updates
    this.channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'players',
      filter: `room_id=eq.${this.roomId}`
    }, (payload) => {
      console.log('📡 [ReliableWebSocket] Player update:', payload);
      this.callbacks.onPlayersUpdate?.(payload);
    });

    // Listen for custom events
    this.channel.on('broadcast', { event: 'game_start' }, (payload) => {
      console.log('📡 [ReliableWebSocket] Game start:', payload);
      this.callbacks.onGameStart?.(payload);
    });

    this.channel.on('broadcast', { event: 'card_placed' }, (payload) => {
      console.log('📡 [ReliableWebSocket] Card placed:', payload);
      this.callbacks.onCardPlaced?.(payload);
    });

    this.channel.on('broadcast', { event: 'song_set' }, (payload) => {
      console.log('📡 [ReliableWebSocket] Song set:', payload);
      this.callbacks.onSongSet?.(payload);
    });
  }

  public async disconnect(): Promise<void> {
    console.log('📡 [ReliableWebSocket] Disconnecting...');
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }

    this.updateConnectionState({
      isConnected: false,
      isReconnecting: false,
      retryCount: 0
    });
  }

  public async sendMessage(message: RealtimeMessageInput): Promise<void> {
    try {
      // Validate message
      const validatedMessage = realtimeMessageSchema.parse(message);
      
      if (!this.channel || !this.connectionState.isConnected) {
        throw new Error('Not connected to realtime service');
      }

      const result = await this.channel.send({
        type: 'broadcast',
        event: validatedMessage.type,
        payload: validatedMessage.data || {}
      });

      if (result !== 'ok') {
        throw new Error('Failed to send message');
      }

    } catch (error) {
      if (error instanceof ZodError) {
        console.error('❌ [ReliableWebSocket] Message validation error:', error.issues);
        throw new Error(`Invalid message: ${error.issues.map(i => i.message).join(', ')}`);
      }
      console.error('❌ [ReliableWebSocket] Send message error:', error);
      throw error;
    }
  }

  private onConnectionSuccess(): void {
    this.reconnectAttempts = 0;
    this.updateConnectionState({
      isConnected: true,
      isReconnecting: false,
      lastError: null,
      retryCount: 0
    });
    this.callbacks.onConnectionChange?.(true, 0);
  }

  private onConnectionError(error: Error): void {
    console.error('❌ [ReliableWebSocket] Connection error:', error);
    
    this.updateConnectionState({
      isConnected: false,
      lastError: error.message
    });

    this.handleError(error);
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ [ReliableWebSocket] Max reconnection attempts reached');
      this.updateConnectionState({
        isReconnecting: false,
        lastError: 'Max reconnection attempts reached'
      });
      this.callbacks.onConnectionChange?.(false, this.reconnectAttempts);
      return;
    }

    const delay = this.calculateBackoffDelay();
    console.log(`🔄 [ReliableWebSocket] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.updateConnectionState({ retryCount: this.reconnectAttempts });
      this.callbacks.onConnectionChange?.(false, this.reconnectAttempts);
      this.connect();
    }, delay);
  }

  private calculateBackoffDelay(): number {
    // Exponential backoff with jitter
    const exponentialDelay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  private updateConnectionState(updates: Partial<ConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates };
  }

  private handleError(error: Error): void {
    console.error('❌ [ReliableWebSocket] Error:', error);
    this.callbacks.onError?.(error);
  }
}

// Export singleton instance for shared usage
export const realtimeService = new ReliableWebSocket();
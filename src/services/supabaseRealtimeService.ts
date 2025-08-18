import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Song, Player, GameRoom } from '@/types/game';
import { connectionManager } from './connectionManager';

export interface GameStateMessage {
  type: 'ROOM_UPDATE' | 'PLAYER_UPDATE' | 'GAME_START' | 'CARD_PLACED' | 'TURN_CHANGE' | 'SONG_SET' | 'JOIN_ROOM' | 'HOST_SET_SONGS' | 'GAME_STARTED';
  roomId: string;
  data: any;
  timestamp: number;
  playerId?: string;
}

export interface RealtimeConfig {
  channelName: string;
  table: string;
  filter?: string;
  onUpdate: (payload: any) => void;
  onError?: (error: Error) => void;
}

export class SupabaseRealtimeService {
  private channel: RealtimeChannel | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private roomId: string | null = null;
  private isHost = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupVisibilityHandlers();
    this.setupOnlineHandlers();
  }

  private setupVisibilityHandlers() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.roomId && !this.isConnected()) {
        console.log('🔄 Page visible, attempting reconnect...');
        this.connect(this.roomId);
      }
    });
  }

  private setupOnlineHandlers() {
    window.addEventListener('online', () => {
      if (this.roomId && !this.isConnected()) {
        console.log('🌐 Network online, attempting reconnect...');
        connectionManager.resetRetries();
        this.connect(this.roomId);
      }
    });

    window.addEventListener('offline', () => {
      console.log('🌐 Network offline');
      connectionManager.setError('Network offline');
      this.cleanup();
    });
  }

  async connect(roomId: string): Promise<void> {
    if (connectionManager.getState().isConnecting) {
      console.log('⚠️ Already connecting, skipping duplicate attempt');
      return;
    }

    this.roomId = roomId;
    connectionManager.updateState({ isConnecting: true, lastError: null });

    this.cleanup();

    try {
      console.log('📡 Connecting to Supabase real-time for room:', roomId);
      
      // Create a channel for this specific room
      this.channel = supabase.channel(`game_room_${roomId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: roomId }
        }
      });

      // Listen for broadcast messages (game actions)
      this.channel
        .on('broadcast', { event: 'game_action' }, (payload) => {
          this.handleBroadcastMessage(payload);
        })
        .on('presence', { event: 'sync' }, () => {
          console.log('👥 Presence sync received');
          this.handlePresenceSync();
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('👋 Player joined:', key, newPresences);
          this.handlePresenceJoin(newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('👋 Player left:', key, leftPresences);
          this.handlePresenceLeave(leftPresences);
        });

      // Subscribe to database changes for persistent state
      this.setupDatabaseSubscriptions();

      // Subscribe with timeout handling
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Subscription timeout'));
        }, 15000); // 15 second timeout

        this.channel?.subscribe((status, err) => {
          clearTimeout(timeout);
          
          switch (status) {
            case 'SUBSCRIBED':
              console.log('✅ Supabase real-time connected successfully');
              connectionManager.updateState({ 
                isConnected: true, 
                isConnecting: false,
                isReady: false
              });
              connectionManager.resetRetries();

              // Start heartbeat
              this.startHeartbeat();

              // Join the room presence
              this.joinRoomPresence();

              // Mark as ready after successful join
              setTimeout(() => {
                connectionManager.updateState({ isReady: true });
                console.log('🔗 Supabase real-time connection ready for game messages');
                resolve();
              }, 500);
              break;
              
            case 'TIMED_OUT':
              console.warn('⏰ Supabase real-time subscription timed out');
              reject(new Error('Subscription timed out'));
              break;
              
            case 'CLOSED':
              console.warn('🔌 Supabase real-time subscription closed');
              connectionManager.updateState({ isConnected: false });
              this.scheduleReconnect();
              break;
              
            case 'CHANNEL_ERROR':
              console.error('❌ Supabase real-time channel error:', err);
              reject(err || new Error('Channel error'));
              break;
          }
        });
      });
      
    } catch (error) {
      console.error('❌ Failed to setup Supabase real-time:', error);
      connectionManager.setError(error instanceof Error ? error.message : 'Real-time connection failed');
      this.scheduleReconnect();
      throw error;
    }
  }

  private setupDatabaseSubscriptions() {
    if (!this.roomId || !this.channel) return;

    // Listen to room updates
    this.channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'game_rooms',
      filter: `id=eq.${this.roomId}`
    }, (payload) => {
      console.log('🏠 Room database change:', payload);
      this.handleDatabaseChange('ROOM_UPDATE', payload);
    });

    // Listen to player updates
    this.channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'players',
      filter: `room_id=eq.${this.roomId}`
    }, (payload) => {
      console.log('👤 Player database change:', payload);
      this.handleDatabaseChange('PLAYER_UPDATE', payload);
    });

    // Listen to game moves
    this.channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'game_moves',
      filter: `room_id=eq.${this.roomId}`
    }, (payload) => {
      console.log('🎯 Game move recorded:', payload);
      this.handleDatabaseChange('GAME_MOVE', payload);
    });
  }

  private handleBroadcastMessage(payload: any) {
    try {
      const message: GameStateMessage = payload.payload;
      console.log('📨 Broadcast message received:', message.type);

      // Handle special server-side messages
      if (message.type === 'HOST_SET_SONGS') {
        this.handleHostSetSongs(message);
        return;
      }

      // Dispatch to registered listeners
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
    } catch (error) {
      console.error('❌ Error processing broadcast message:', error);
    }
  }

  private handleDatabaseChange(eventType: string, payload: any) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(payload);
        } catch (error) {
          console.error(`❌ Error in ${eventType} listener:`, error);
        }
      });
    }
  }

  private handlePresenceSync() {
    if (!this.channel) return;
    
    const presenceState = this.channel.presenceState();
    console.log('👥 Current presence state:', presenceState);
    
    // Notify listeners about presence sync
    const listeners = this.listeners.get('PRESENCE_SYNC');
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(presenceState);
        } catch (error) {
          console.error('❌ Error in presence sync listener:', error);
        }
      });
    }
  }

  private handlePresenceJoin(newPresences: any[]) {
    const listeners = this.listeners.get('PLAYER_JOIN');
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(newPresences);
        } catch (error) {
          console.error('❌ Error in player join listener:', error);
        }
      });
    }
  }

  private handlePresenceLeave(leftPresences: any[]) {
    const listeners = this.listeners.get('PLAYER_LEAVE');
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(leftPresences);
        } catch (error) {
          console.error('❌ Error in player leave listener:', error);
        }
      });
    }
  }

  private joinRoomPresence() {
    if (!this.channel || !this.roomId) return;

    const presenceData = {
      room_id: this.roomId,
      is_host: this.isHost,
      joined_at: new Date().toISOString()
    };

    this.channel.track(presenceData);
    console.log('👋 Joined room presence:', presenceData);
  }

  private async handleHostSetSongs(message: GameStateMessage) {
    console.log('🎯 HOST_SET_SONGS received:', message.data);
    
    try {
      const { GameService } = await import('./gameService');
      await GameService.initializeGameWithStartingCards(message.roomId, message.data.songList);
      
      // Broadcast game started
      setTimeout(() => {
        const listeners = this.listeners.get('GAME_STARTED');
        if (listeners) {
          listeners.forEach(listener => {
            try {
              listener({
                room: { id: message.roomId, phase: 'playing', initialized: true }
              });
            } catch (error) {
              console.error('❌ Error in GAME_STARTED listener:', error);
            }
          });
        }
      }, 1000);
    } catch (error) {
      console.error('❌ Failed to handle HOST_SET_SONGS:', error);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (!connectionManager.shouldRetry()) {
      console.error('❌ Max reconnection attempts reached');
      connectionManager.setError('Max reconnection attempts reached');
      return;
    }

    connectionManager.incrementRetries();
    const delay = connectionManager.getRetryDelay();

    console.log(`🔄 Scheduling reconnect attempt ${connectionManager.getState().reconnectAttempts}/3 in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      if (this.roomId) {
        this.connect(this.roomId);
      }
    }, delay);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        // Supabase handles heartbeat automatically, but we can send a presence update
        this.joinRoomPresence();
      }
    }, 30000); // Every 30 seconds
  }

  private cleanup() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
  }

  broadcastMessage(message: Partial<GameStateMessage>) {
    const state = connectionManager.getState();
    
    if (!this.isConnected() || !state.isReady || !this.channel) {
      console.warn('⚠️ Cannot broadcast message - connection not ready:', {
        connected: this.isConnected(),
        ready: state.isReady,
        hasChannel: !!this.channel
      });
      return;
    }

    try {
      const fullMessage: GameStateMessage = {
        type: message.type || 'ROOM_UPDATE',
        roomId: message.roomId || this.roomId || '',
        data: message.data || {},
        timestamp: Date.now(),
        playerId: message.playerId
      };

      console.log('📤 Broadcasting message:', fullMessage.type);
      this.channel.send({
        type: 'broadcast',
        event: 'game_action',
        payload: fullMessage
      });
    } catch (error) {
      console.error('❌ Failed to broadcast message:', error);
      connectionManager.setError('Failed to send message');
    }
  }

  isConnected(): boolean {
    return this.channel?.state === 'joined';
  }

  setHostStatus(isHost: boolean) {
    this.isHost = isHost;
    console.log('🏠 Host status set:', isHost);
    
    // Update presence with new host status
    if (this.isConnected()) {
      this.joinRoomPresence();
    }
  }

  sendHostSetSongs(roomId: string, songList: Song[], hostId: string) {
    if (!this.isHost) {
      console.warn('⚠️ Only host can send HOST_SET_SONGS');
      return;
    }

    this.broadcastMessage({
      type: 'HOST_SET_SONGS',
      roomId,
      data: { roomId, songList, hostId }
    });
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
    console.log('🔌 Disconnecting Supabase real-time');
    this.roomId = null;
    this.cleanup();
    this.listeners.clear();
    connectionManager.updateState({
      isConnected: false,
      isConnecting: false,
      isReady: false,
      reconnectAttempts: 0
    });
  }

  getConnectionStatus() {
    return connectionManager.getState();
  }

  // Legacy methods for compatibility with existing hooks
  sendMessage(message: Partial<GameStateMessage>) {
    this.broadcastMessage(message);
  }

  // Support for database subscription configs (backward compatibility)
  async connectWithConfigs(configs: RealtimeConfig[]) {
    if (configs.length === 0) {
      console.log('📡 No realtime configs provided');
      connectionManager.updateState({ isConnected: true });
      return;
    }

    // For now, we'll use the first config's channelName as roomId
    const roomId = configs[0].channelName.replace('game_room_', '');
    await this.connect(roomId);

    // Set up listeners for the configs
    configs.forEach(config => {
      this.on(config.table.toUpperCase() + '_UPDATE', config.onUpdate);
      if (config.onError) {
        this.on(config.table.toUpperCase() + '_ERROR', config.onError);
      }
    });
  }

  forceReconnect() {
    console.log('🔄 Force reconnecting Supabase real-time...');
    connectionManager.resetRetries();
    if (this.roomId) {
      this.connect(this.roomId);
    }
  }
}

export const supabaseRealtimeService = new SupabaseRealtimeService();
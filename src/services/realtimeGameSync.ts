import { supabase } from '@/integrations/supabase/client';
import { Song, Player, GameRoom } from '@/types/game';

export interface GameStateUpdate {
  type: 'PLAYER_CARD_DEALT' | 'GAME_STARTED' | 'NEW_MYSTERY_SONG' | 'PLAYER_JOINED' | 'GAME_STATE_CHANGED';
  payload: any;
  roomId: string;
  timestamp: number;
}

export class RealtimeGameSync {
  private channel: any = null;
  private roomId: string;
  private callbacks: Map<string, (update: GameStateUpdate) => void> = new Map();

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  /**
   * Initialize real-time connection for the room
   */
  initialize(): void {
    if (this.channel) {
      this.cleanup();
    }

    console.log('🔄 Initializing real-time sync for room:', this.roomId);

    this.channel = supabase.channel(`game_room_${this.roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = this.channel.presenceState();
        console.log('👥 Presence sync:', presenceState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 Player joined presence:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 Player left presence:', key, leftPresences);
      })
      .on('broadcast', { event: 'game_update' }, (payload: { payload: GameStateUpdate }) => {
        console.log('📡 Received game update:', payload);
        this.handleGameUpdate(payload.payload);
      })
      .subscribe();
  }

  /**
   * Send a game state update to all clients in the room
   */
  async broadcastUpdate(type: GameStateUpdate['type'], payload: any): Promise<void> {
    if (!this.channel) {
      console.error('❌ Cannot broadcast - channel not initialized');
      return;
    }

    const update: GameStateUpdate = {
      type,
      payload,
      roomId: this.roomId,
      timestamp: Date.now()
    };

    console.log('📡 Broadcasting update:', update);

    const result = await this.channel.send({
      type: 'broadcast',
      event: 'game_update',
      payload: update
    });

    if (result !== 'ok') {
      console.error('❌ Failed to broadcast update:', result);
    }
  }

  /**
   * Track presence for a player
   */
  async trackPlayerPresence(playerId: string, playerData: any): Promise<void> {
    if (!this.channel) {
      console.error('❌ Cannot track presence - channel not initialized');
      return;
    }

    const presenceData = {
      player_id: playerId,
      online_at: new Date().toISOString(),
      ...playerData
    };

    const result = await this.channel.track(presenceData);
    console.log('👤 Tracking player presence:', presenceData, result);
  }

  /**
   * Register a callback for specific update types
   */
  onUpdate(type: string, callback: (update: GameStateUpdate) => void): void {
    this.callbacks.set(type, callback);
  }

  /**
   * Handle incoming game updates
   */
  private handleGameUpdate(update: GameStateUpdate): void {
    const callback = this.callbacks.get(update.type);
    if (callback) {
      callback(update);
    } else {
      console.log('📨 Unhandled update type:', update.type);
    }
  }

  /**
   * Send a player card dealt message
   */
  async sendPlayerCardDealt(playerId: string, card: Song): Promise<void> {
    await this.broadcastUpdate('PLAYER_CARD_DEALT', { playerId, card });
  }

  /**
   * Send game started message
   */
  async sendGameStarted(gamePhase: string, mysterySong: Song): Promise<void> {
    await this.broadcastUpdate('GAME_STARTED', { gamePhase, mysterySong });
  }

  /**
   * Send new mystery song message
   */
  async sendNewMysterySong(mysterySong: Song): Promise<void> {
    await this.broadcastUpdate('NEW_MYSTERY_SONG', { mysterySong });
  }

  /**
   * Send player joined message
   */
  async sendPlayerJoined(player: Player): Promise<void> {
    await this.broadcastUpdate('PLAYER_JOINED', { player });
  }

  /**
   * Send general game state change
   */
  async sendGameStateChanged(gameState: any): Promise<void> {
    await this.broadcastUpdate('GAME_STATE_CHANGED', gameState);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.channel) {
      console.log('🧹 Cleaning up real-time sync');
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.callbacks.clear();
  }
}

// Global instance
let globalRealtimeSync: RealtimeGameSync | null = null;

export const initializeRealtimeSync = (roomId: string): RealtimeGameSync => {
  if (globalRealtimeSync) {
    globalRealtimeSync.cleanup();
  }
  
  globalRealtimeSync = new RealtimeGameSync(roomId);
  globalRealtimeSync.initialize();
  return globalRealtimeSync;
};

export const getRealtimeSync = (): RealtimeGameSync | null => {
  return globalRealtimeSync;
};

export const cleanupRealtimeSync = (): void => {
  if (globalRealtimeSync) {
    globalRealtimeSync.cleanup();
    globalRealtimeSync = null;
  }
};
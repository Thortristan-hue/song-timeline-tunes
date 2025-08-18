
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Song, Player, GameRoom } from '@/types/game';

export interface RealtimeSubscription {
  roomId: string;
  onRoomUpdate?: (room: Partial<GameRoom>) => void;
  onPlayerUpdate?: (players: Player[]) => void;
  onGameEvent?: (event: string, data: any) => void;
}

export class OptimizedRealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscriptions: Map<string, RealtimeSubscription> = new Map();

  async subscribe(subscription: RealtimeSubscription) {
    const { roomId } = subscription;
    
    // Clean up existing subscription
    this.unsubscribe(roomId);
    
    console.log('🚀 Setting up optimized real-time for room:', roomId);
    
    // Create single channel for room
    const channel = supabase.channel(`game-room-${roomId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: '' }
      }
    });

    // Room updates
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'game_rooms',
      filter: `id=eq.${roomId}`
    }, (payload) => {
      console.log('⚡ Real-time room update:', payload.new);
      subscription.onRoomUpdate?.(payload.new as Partial<GameRoom>);
    });

    // Player updates
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'players',
      filter: `room_id=eq.${roomId}`
    }, async (payload) => {
      console.log('⚡ Real-time player update:', payload);
      
      // Fetch all current players immediately
      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_host', false);
      
      if (players) {
        const convertedPlayers: Player[] = players.map(p => ({
          id: p.id,
          name: p.name,
          color: p.color,
          timelineColor: p.timeline_color,
          score: p.score || 0,
          timeline: Array.isArray(p.timeline) ? p.timeline as unknown as Song[] : [],
          character: p.character || 'dave'
        }));
        
        subscription.onPlayerUpdate?.(convertedPlayers);
      }
    });

    // Game moves for instant feedback
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'game_moves',
      filter: `room_id=eq.${roomId}`
    }, (payload) => {
      console.log('⚡ Real-time game move:', payload.new);
      subscription.onGameEvent?.('move_made', payload.new);
    });

    // Subscribe with instant connection
    const status = await new Promise<string>((resolve) => {
      channel.subscribe((status) => {
        console.log('📡 Channel status:', status);
        resolve(status);
      });
    });

    if (status === 'SUBSCRIBED') {
      this.channels.set(roomId, channel);
      this.subscriptions.set(roomId, subscription);
      console.log('✅ Real-time connection established instantly');
      return true;
    } else {
      console.error('❌ Failed to establish real-time connection');
      return false;
    }
  }

  unsubscribe(roomId: string) {
    const channel = this.channels.get(roomId);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(roomId);
      this.subscriptions.delete(roomId);
      console.log('🔌 Unsubscribed from room:', roomId);
    }
  }

  // Broadcast game events instantly
  async broadcastGameEvent(roomId: string, eventType: string, data: any) {
    const channel = this.channels.get(roomId);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: eventType,
        payload: data
      });
      console.log('📤 Broadcasted event:', eventType);
    }
  }

  disconnect() {
    for (const [roomId] of this.channels) {
      this.unsubscribe(roomId);
    }
  }
}

export const optimizedRealtimeService = new OptimizedRealtimeService();

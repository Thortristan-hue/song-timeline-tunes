
import { supabase } from '@/integrations/supabase/client';

export interface AudioControlEvent {
  action: 'play' | 'pause' | 'stop';
  songId: string;
  playerId: string;
  timestamp: number;
}

export class AudioSyncService {
  private static instance: AudioSyncService;
  private currentChannel: any = null;

  private constructor() {}

  public static getInstance(): AudioSyncService {
    if (!AudioSyncService.instance) {
      AudioSyncService.instance = new AudioSyncService();
    }
    return AudioSyncService.instance;
  }

  // Send audio control command from player to host
  public async sendAudioControl(roomId: string, event: AudioControlEvent): Promise<void> {
    try {
      console.log('🎵 AUDIO SYNC: Sending audio control to host:', event);
      
      const { error } = await supabase
        .from('game_rooms')
        .update({
          current_song: {
            ...event,
            room_id: roomId,
            updated_at: new Date().toISOString()
          } as any
        })
        .eq('id', roomId);

      if (error) {
        console.error('❌ Failed to send audio control:', error);
        throw error;
      }

      // Also broadcast via realtime for immediate response
      if (this.currentChannel) {
        this.currentChannel.send({
          type: 'broadcast',
          event: 'audio_control',
          payload: { ...event, roomId }
        });
      }
    } catch (error) {
      console.error('❌ Audio sync service error:', error);
      throw error;
    }
  }

  // Subscribe to audio control events (for host)
  public subscribeToAudioControls(
    roomId: string, 
    onAudioControl: (event: AudioControlEvent) => void
  ): () => void {
    console.log('🎵 AUDIO SYNC: Host subscribing to audio controls for room:', roomId);

    this.currentChannel = supabase
      .channel(`audio-sync-${roomId}`)
      .on('broadcast', { event: 'audio_control' }, (payload) => {
        console.log('🎵 AUDIO SYNC: Host received audio control:', payload);
        onAudioControl(payload.payload);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${roomId}`
      }, (payload) => {
        if (payload.new.current_song && payload.new.current_song.action) {
          console.log('🎵 AUDIO SYNC: Host received DB audio control:', payload.new.current_song);
          onAudioControl(payload.new.current_song as AudioControlEvent);
        }
      })
      .subscribe();

    return () => {
      console.log('🎵 AUDIO SYNC: Unsubscribing from audio controls');
      if (this.currentChannel) {
        supabase.removeChannel(this.currentChannel);
        this.currentChannel = null;
      }
    };
  }

  // Cleanup
  public cleanup(): void {
    if (this.currentChannel) {
      supabase.removeChannel(this.currentChannel);
      this.currentChannel = null;
    }
  }
}

export const audioSyncService = AudioSyncService.getInstance();

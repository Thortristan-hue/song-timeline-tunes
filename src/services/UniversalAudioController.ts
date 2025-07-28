import { supabase } from '@/integrations/supabase/client';
import { DeezerAudioService } from './DeezerAudioService';
import { Song } from '@/types/game';

/**
 * Redesigned Universal Audio Controller for robust cross-device audio synchronization
 * Handles audio playback coordination between host and mobile devices
 */
class UniversalAudioController {
  private static instance: UniversalAudioController;
  private currentAudio: HTMLAudioElement | null = null;
  private currentSong: Song | null = null;
  private isPlaying: boolean = false;
  private playStateListeners: Array<(isPlaying: boolean, song?: Song) => void> = [];
  private roomId: string | null = null;
  private isHost: boolean = false;
  private playerId: string | null = null;
  private realtimeChannel: any = null;
  private connectionRetryCount = 0;
  private maxRetries = 3;

  private constructor() {}

  static getInstance(): UniversalAudioController {
    if (!UniversalAudioController.instance) {
      UniversalAudioController.instance = new UniversalAudioController();
    }
    return UniversalAudioController.instance;
  }

  /**
   * Initialize the controller for a specific room and role
   */
  initialize(roomId: string, isHost: boolean, playerId?: string) {
    console.log(`🎵 UNIVERSAL AUDIO: Initializing for room ${roomId} as ${isHost ? 'HOST' : 'MOBILE'}`);
    
    this.roomId = roomId;
    this.isHost = isHost;
    this.playerId = playerId || this.generatePlayerId();
    this.connectionRetryCount = 0;
    
    // Clean up any existing connection
    this.cleanup();
    
    // Set up real-time connection
    this.setupRealtimeConnection();
  }

  /**
   * Set up enhanced real-time connection with fallback mechanisms
   */
  private setupRealtimeConnection() {
    if (!this.roomId) return;

    const channelName = `universal-audio-${this.roomId}`;
    console.log(`🎵 UNIVERSAL AUDIO: Setting up channel: ${channelName}`);

    this.realtimeChannel = supabase.channel(channelName, {
      config: {
        broadcast: { 
          self: false, // Don't receive our own messages
          ack: true   // Request acknowledgment
        },
        presence: {
          key: this.playerId
        }
      }
    });

    // Handle incoming audio control commands
    this.realtimeChannel
      .on('broadcast', { event: 'audio_command' }, (payload: any) => {
        console.log('🎵 RECEIVED AUDIO COMMAND:', payload);
        this.handleAudioCommand(payload.payload);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = this.realtimeChannel.presenceState();
        console.log('🎵 PRESENCE SYNC:', state);
      })
      .subscribe((status: string) => {
        console.log(`🎵 UNIVERSAL AUDIO: Channel status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ UNIVERSAL AUDIO: Successfully connected');
          this.connectionRetryCount = 0;
          
          // Track presence for this device
          this.realtimeChannel.track({
            userId: this.playerId,
            isHost: this.isHost,
            timestamp: Date.now()
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`❌ UNIVERSAL AUDIO: Connection failed: ${status}`);
          this.handleConnectionError();
        } else if (status === 'CLOSED') {
          console.warn('🎵 UNIVERSAL AUDIO: Channel closed');
        }
      });
  }

  /**
   * Handle connection errors with retry logic
   */
  private handleConnectionError() {
    if (this.connectionRetryCount < this.maxRetries) {
      this.connectionRetryCount++;
      console.log(`🔄 UNIVERSAL AUDIO: Retrying connection (${this.connectionRetryCount}/${this.maxRetries})`);
      
      setTimeout(() => {
        this.setupRealtimeConnection();
      }, 2000 * this.connectionRetryCount); // Exponential backoff
    } else {
      console.error('❌ UNIVERSAL AUDIO: Max retries reached, connection failed');
    }
  }

  /**
   * Send audio command with enhanced reliability
   */
  async sendAudioCommand(action: 'play' | 'pause' | 'toggle', song?: Song): Promise<boolean> {
    if (this.isHost) {
      console.warn('🎵 HOST: Hosts should not send commands, they receive them');
      return false;
    }

    if (!this.realtimeChannel || !this.roomId) {
      console.error('🎵 MOBILE: No active connection to send command. Channel:', !!this.realtimeChannel, 'Room:', this.roomId);
      return false;
    }

    // Wait a moment for the channel to be ready if it's still connecting
    if (!this.realtimeChannel.isClosed() === false) {
      console.log('🎵 MOBILE: Channel ready, sending command');
    }

    const command = {
      action,
      song: song ? {
        id: song.id,
        deezer_title: song.deezer_title,
        deezer_artist: song.deezer_artist,
        release_year: song.release_year,
        preview_url: song.preview_url
      } : null,
      senderId: this.playerId,
      timestamp: Date.now(),
      roomId: this.roomId
    };

    console.log('🎵 MOBILE: Sending audio command:', command);

    try {
      const result = await this.realtimeChannel.send({
        type: 'broadcast',
        event: 'audio_command',
        payload: command
      });

      console.log('✅ MOBILE: Audio command sent with result:', result);
      return true;
    } catch (error) {
      console.error('❌ MOBILE: Error sending audio command:', error);
      return false;
    }
  }

  /**
   * Handle incoming audio commands (host only)
   */
  private async handleAudioCommand(command: any) {
    if (!this.isHost) {
      console.log('🎵 MOBILE: Ignoring audio command (not host)');
      return;
    }

    if (!command || !command.action) {
      console.error('❌ HOST: Invalid audio command received:', command);
      return;
    }

    // Ignore old commands (older than 10 seconds)
    if (command.timestamp && Date.now() - command.timestamp > 10000) {
      console.warn('🎵 HOST: Ignoring old command');
      return;
    }

    console.log('🎵 HOST: Processing audio command:', command);

    try {
      switch (command.action) {
        case 'play':
          if (command.song) {
            await this.playSong(command.song);
          } else if (this.currentSong) {
            await this.resume();
          }
          break;
        case 'pause':
          this.pause();
          break;
        case 'toggle':
          if (command.song) {
            await this.togglePlayPause(command.song);
          }
          break;
        default:
          console.error('❌ HOST: Unknown audio action:', command.action);
      }
    } catch (error) {
      console.error('❌ HOST: Failed to execute audio command:', error);
    }
  }

  /**
   * Play a song preview
   */
  async playSong(song: Song): Promise<void> {
    try {
      console.log('🎵 PLAYING:', song.deezer_title);
      
      // Stop current audio if playing
      this.stop();

      if (!song.preview_url) {
        console.warn('No preview URL available for song:', song.deezer_title);
        return;
      }

      this.currentSong = song;
      this.currentAudio = DeezerAudioService.createAudioElement(song.preview_url);
      
      // Set up event listeners
      this.currentAudio.addEventListener('ended', () => {
        this.isPlaying = false;
        this.notifyPlayStateChange();
      });

      this.currentAudio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        this.isPlaying = false;
        this.notifyPlayStateChange();
      });

      await this.currentAudio.play();
      this.isPlaying = true;
      this.notifyPlayStateChange();
      
    } catch (error) {
      console.error('Failed to play song:', error);
      this.isPlaying = false;
      this.notifyPlayStateChange();
    }
  }

  /**
   * Pause current playback
   */
  pause(): void {
    if (this.currentAudio && this.isPlaying) {
      this.currentAudio.pause();
      this.isPlaying = false;
      this.notifyPlayStateChange();
      console.log('⏸️ PAUSED');
    }
  }

  /**
   * Resume current playback
   */
  async resume(): Promise<void> {
    if (this.currentAudio && !this.isPlaying) {
      try {
        await this.currentAudio.play();
        this.isPlaying = true;
        this.notifyPlayStateChange();
        console.log('▶️ RESUMED');
      } catch (error) {
        console.error('Failed to resume audio:', error);
      }
    }
  }

  /**
   * Stop current playback
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
    this.currentSong = null;
    this.notifyPlayStateChange();
  }

  /**
   * Toggle play/pause
   */
  async togglePlayPause(song?: Song): Promise<boolean> {
    // If not host, send command to host
    if (!this.isHost) {
      return await this.sendAudioCommand('toggle', song);
    }

    // Host logic for actual audio playback
    const targetSong = song || this.currentSong;
    
    if (!targetSong) {
      console.warn('No song to play');
      return false;
    }

    try {
      // If different song, start playing new song
      if (!this.currentSong || this.currentSong.id !== targetSong.id) {
        await this.playSong(targetSong);
        return true;
      }

      // Toggle current song
      if (this.isPlaying) {
        this.pause();
      } else {
        await this.resume();
      }
      return true;
    } catch (error) {
      console.error('Failed to toggle play/pause:', error);
      return false;
    }
  }

  /**
   * Subscribe to play state changes
   */
  addPlayStateListener(listener: (isPlaying: boolean, song?: Song) => void) {
    this.playStateListeners.push(listener);
  }

  /**
   * Remove play state listener
   */
  removePlayStateListener(listener: (isPlaying: boolean, song?: Song) => void) {
    this.playStateListeners = this.playStateListeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of play state change
   */
  private notifyPlayStateChange() {
    this.playStateListeners.forEach(listener => listener(this.isPlaying, this.currentSong || undefined));
  }

  /**
   * Get current playing state
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current song
   */
  getCurrentSong(): Song | null {
    return this.currentSong;
  }

  /**
   * Generate a unique player ID
   */
  private generatePlayerId(): string {
    let playerId = localStorage.getItem('rythmy_player_id');
    if (!playerId) {
      playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('rythmy_player_id', playerId);
    }
    return playerId;
  }

  /**
   * Cleanup method
   */
  cleanup(): void {
    console.log('🧹 UNIVERSAL AUDIO: Cleaning up');
    
    // Stop any playing audio
    this.stop();
    
    // Remove realtime subscription
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    
    // Clear listeners
    this.playStateListeners = [];
    
    // Reset state
    this.roomId = null;
    this.isHost = false;
    this.playerId = null;
    this.connectionRetryCount = 0;
  }
}

// Export singleton instance
export const universalAudioController = UniversalAudioController.getInstance();
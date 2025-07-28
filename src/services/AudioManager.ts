
import { DeezerAudioService } from './DeezerAudioService';
import { Song } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';

/**
 * Simplified Universal Audio Controller
 * Handles playing mystery songs and coordinating between host and mobile devices
 */
class AudioManager {
  private static instance: AudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentSong: Song | null = null;
  private isPlaying: boolean = false;
  private playStateListeners: Array<(isPlaying: boolean, song?: Song) => void> = [];
  private roomId: string | null = null;
  private isHost: boolean = false;
  private realtimeChannel: any = null;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'failed' = 'disconnected';
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize the audio manager for a specific room and role
   */
  async initialize(roomId: string, isHost: boolean): Promise<void> {
    // Prevent multiple initializations for the same room
    if (this.isInitialized && this.roomId === roomId && this.isHost === isHost) {
      console.log('🎵 AUDIO MANAGER: Already initialized for this room and role');
      return;
    }

    this.roomId = roomId;
    this.isHost = isHost;
    this.isInitialized = true;
    this.connectionState = 'disconnected';
    
    console.log(`🎵 AUDIO MANAGER: Initializing for room ${roomId} as ${isHost ? 'HOST' : 'MOBILE'}`);
    
    // Subscribe to audio control events if this is the host
    if (isHost && roomId) {
      await this.subscribeToAudioControl();
    }
  }

  /**
   * Subscribe to real-time audio control events
   */
  private async subscribeToAudioControl(): Promise<void> {
    if (!this.roomId || this.connectionState === 'connecting') return;

    this.connectionState = 'connecting';
    console.log(`🎵 HOST: Setting up audio control subscription for room ${this.roomId}`);

    try {
      // Clean up existing channel
      if (this.realtimeChannel) {
        await supabase.removeChannel(this.realtimeChannel);
      }

      // Create a unique channel name for this room
      const channelName = `audio-control-${this.roomId}`;
      this.realtimeChannel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
          presence: { key: 'audio-manager' }
        }
      });
      
      this.realtimeChannel
        .on('broadcast', { event: 'audio_control' }, (payload: any) => {
          console.log('🎵 HOST: Received audio control broadcast event:', payload);
          
          if (payload && payload.payload) {
            console.log('🎵 HOST: Processing payload:', payload.payload);
            this.handleUniversalAudioControl(payload.payload);
          }
        })
        .subscribe(async (status: string) => {
          console.log(`🎵 HOST: Audio control subscription status: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ HOST: Audio control subscription established successfully');
            this.connectionState = 'connected';
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('❌ HOST: Audio control subscription failed');
            this.connectionState = 'failed';
          } else if (status === 'CLOSED') {
            console.log('🔌 HOST: Audio control subscription closed');
            this.connectionState = 'disconnected';
          }
        });

    } catch (error) {
      console.error('❌ HOST: Failed to set up audio control subscription:', error);
      this.connectionState = 'failed';
    }
  }

  /**
   * Handle universal audio control commands from mobile devices
   */
  private async handleUniversalAudioControl(command: { action: 'play' | 'pause' | 'toggle', song?: Song, timestamp?: number }) {
    if (!this.isHost) {
      console.warn('🎵 NON-HOST: Ignoring audio control command (not host)');
      return;
    }

    if (!command || !command.action) {
      console.error('❌ HOST: Invalid audio control command received:', command);
      return;
    }

    // Ignore outdated commands (older than 10 seconds)
    if (command.timestamp && Date.now() - command.timestamp > 10000) {
      console.warn('🎵 HOST: Ignoring outdated audio control command');
      return;
    }

    console.log('🎵 HOST: Processing audio control command:', {
      action: command.action,
      song: command.song?.deezer_title,
      currentSong: this.currentSong?.deezer_title,
      isPlaying: this.isPlaying
    });

    try {
      switch (command.action) {
        case 'play':
          if (command.song && this.isValidSong(command.song)) {
            await this.playSong(command.song);
          } else if (this.currentSong) {
            await this.resume();
          }
          break;
        case 'pause':
          this.pause();
          break;
        case 'toggle':
          if (command.song && this.isValidSong(command.song)) {
            await this.togglePlayPause(command.song);
          }
          break;
      }
    } catch (error) {
      console.error('❌ HOST: Failed to handle audio control:', error);
      this.notifyPlayStateChange();
    }
  }

  /**
   * Validate song object
   */
  private isValidSong(song: Song): boolean {
    return !!(song && song.id && song.deezer_title && song.deezer_artist);
  }

  /**
   * Send universal audio control command
   */
  async sendUniversalAudioControl(action: 'play' | 'pause' | 'toggle', song?: Song): Promise<boolean> {
    if (!this.roomId || this.isHost) {
      return false;
    }

    console.log('📱 MOBILE: Sending audio control command:', { action, song: song?.deezer_title });

    try {
      const channelName = `audio-control-${this.roomId}`;
      const channel = supabase.channel(channelName, {
        config: { broadcast: { self: false } }
      });
      
      const result = await channel.send({
        type: 'broadcast',
        event: 'audio_control',
        payload: { action, song, timestamp: Date.now() }
      });

      await supabase.removeChannel(channel);
      return result === 'ok';
    } catch (error) {
      console.error('❌ MOBILE: Failed to send audio control command:', error);
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
   * Play a song preview
   */
  async playSong(song: Song): Promise<void> {
    try {
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
      
      console.log('🎵 Playing:', song.deezer_title, 'by', song.deezer_artist);
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
      console.log('⏸️ Paused audio');
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
        console.log('▶️ Resumed audio');
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
    if (!this.isHost && this.roomId) {
      return await this.sendUniversalAudioControl('toggle', song);
    }

    // Host-only logic
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
      console.error('❌ HOST: Failed to toggle play/pause:', error);
      return false;
    }
  }

  /**
   * Cleanup method
   */
  cleanup(): void {
    console.log('🧹 AUDIO MANAGER: Cleaning up');
    
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
    this.connectionState = 'disconnected';
    this.isInitialized = false;
    this.roomId = null;
    this.isHost = false;
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();

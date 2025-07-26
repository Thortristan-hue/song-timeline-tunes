import { DeezerAudioService } from './DeezerAudioService';
import { Song } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';

/**
 * Universal Audio Controller for cross-device audio synchronization
 * Handles playing mystery songs and coordinating between host and mobile devices
 * Provides universal control where mobile devices can control host audio playback
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
  initialize(roomId: string, isHost: boolean) {
    this.roomId = roomId;
    this.isHost = isHost;
    
    console.log(`🎵 AUDIO MANAGER: Initializing for room ${roomId} as ${isHost ? 'HOST' : 'MOBILE'}`);
    
    // Clean up any existing subscription
    if (this.realtimeChannel) {
      console.log('🎵 AUDIO MANAGER: Cleaning up existing channel');
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    
    // Subscribe to audio control events if this is the host
    if (isHost && roomId) {
      this.subscribeToAudioControl();
    }
  }

  /**
   * Subscribe to real-time audio control events (host only) with enhanced error handling
   */
  private subscribeToAudioControl() {
    if (!this.roomId) return;

    console.log(`🎵 HOST: Setting up audio control subscription for room ${this.roomId}`);

    try {
      // Create a unique channel name for this room
      const channelName = `audio-control-${this.roomId}`;
      this.realtimeChannel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false }
        }
      });
      
      this.realtimeChannel
        .on('broadcast', { event: 'audio_control' }, (payload: any) => {
          console.log('🎵 HOST: Received audio control broadcast event:', payload);
          console.log('🎵 HOST: Full payload structure:', JSON.stringify(payload, null, 2));
          
          if (payload && payload.payload) {
            console.log('🎵 HOST: Processing payload:', payload.payload);
            this.handleUniversalAudioControl(payload.payload);
          } else {
            console.warn('🎵 HOST: Invalid audio control payload structure:', payload);
          }
        })
        .subscribe((status: string) => {
          console.log(`🎵 HOST: Audio control subscription status: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ HOST: Audio control subscription established successfully');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ HOST: Audio control subscription error');
          } else if (status === 'TIMED_OUT') {
            console.error('❌ HOST: Audio control subscription timed out');
          } else if (status === 'CLOSED') {
            console.log('🔌 HOST: Audio control subscription closed');
          }
        });

    } catch (error) {
      console.error('❌ HOST: Failed to set up audio control subscription:', error);
    }
  }

  /**
   * Handle universal audio control commands from mobile devices with enhanced validation
   */
  private async handleUniversalAudioControl(command: { action: 'play' | 'pause' | 'toggle', song?: Song, timestamp?: number }) {
    if (!this.isHost) {
      console.warn('🎵 NON-HOST: Ignoring audio control command (not host)');
      return;
    }

    // Validate command structure
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
      timestamp: command.timestamp,
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
          } else {
            console.warn('🎵 HOST: No valid song to play');
          }
          break;
        case 'pause':
          this.pause();
          break;
        case 'toggle':
          if (command.song && this.isValidSong(command.song)) {
            await this.togglePlayPause(command.song);
          } else {
            console.warn('🎵 HOST: No valid song provided for toggle');
          }
          break;
        default:
          console.error('❌ HOST: Unknown audio control action:', command.action);
      }
    } catch (error) {
      console.error('❌ HOST: Failed to handle audio control:', error);
      // Notify listeners of the error
      this.notifyPlayStateChange();
    }
  }

  /**
   * Validate song object has required fields
   */
  private isValidSong(song: Song): boolean {
    return !!(song && 
             song.id && 
             song.deezer_title && 
             song.deezer_artist && 
             song.release_year);
  }

  /**
   * Send universal audio control command (mobile only) with enhanced error handling
   */
  async sendUniversalAudioControl(action: 'play' | 'pause' | 'toggle', song?: Song): Promise<boolean> {
    if (!this.roomId) {
      console.error('📱 MOBILE: Cannot send audio control - no room ID');
      return false;
    }

    if (this.isHost) {
      console.warn('📱 HOST: Host should not send audio control commands');
      return false;
    }

    console.log('📱 MOBILE: Sending audio control command:', { 
      action, 
      song: song?.deezer_title,
      roomId: this.roomId
    });

    try {
      // Create a fresh channel for sending the command
      const channelName = `audio-control-${this.roomId}`;
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false }
        }
      });
      
      console.log(`📱 MOBILE: Sending command via channel: ${channelName}`);
      
      // Send the command
      const result = await channel.send({
        type: 'broadcast',
        event: 'audio_control',
        payload: { action, song, timestamp: Date.now() }
      });

      console.log('📱 MOBILE: Send result:', result);

      // Clean up the channel
      await supabase.removeChannel(channel);

      // Check if the send was successful
      if (result === 'ok') {
        console.log('📱 MOBILE: Successfully sent audio control command');
        return true;
      } else {
        console.error('❌ MOBILE: Failed to send audio control command:', result);
        return false;
      }

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
   * Toggle play/pause with universal control support and enhanced error handling
   */
  async togglePlayPause(song?: Song): Promise<boolean> {
    // If not host, send command to host instead of playing locally
    if (!this.isHost && this.roomId) {
      const success = await this.sendUniversalAudioControl('toggle', song);
      if (!success) {
        console.warn('📱 MOBILE: Universal control command failed, falling back to local feedback');
        // Still update local state for immediate UI feedback
        this.isPlaying = !this.isPlaying;
        this.notifyPlayStateChange();
      }
      return success;
    }

    // Host-only logic for actual audio playback
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
   * Cleanup method to be called when switching rooms or unmounting
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
    this.roomId = null;
    this.isHost = false;
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();

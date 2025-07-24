import { DeezerAudioService } from './DeezerAudioService';
import { Song } from '@/types/game';

/**
 * Centralized audio management service for game audio playback
 * Handles playing mystery songs and coordinating between host and mobile devices
 */
class AudioManager {
  private static instance: AudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentSong: Song | null = null;
  private isPlaying: boolean = false;
  private playStateListeners: Array<(isPlaying: boolean) => void> = [];

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Subscribe to play state changes
   */
  addPlayStateListener(listener: (isPlaying: boolean) => void) {
    this.playStateListeners.push(listener);
  }

  /**
   * Remove play state listener
   */
  removePlayStateListener(listener: (isPlaying: boolean) => void) {
    this.playStateListeners = this.playStateListeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners of play state change
   */
  private notifyPlayStateChange() {
    this.playStateListeners.forEach(listener => listener(this.isPlaying));
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
  async togglePlayPause(song?: Song): Promise<void> {
    // If no song provided, use current song
    const targetSong = song || this.currentSong;
    
    if (!targetSong) {
      console.warn('No song to play');
      return;
    }

    // If different song, start playing new song
    if (!this.currentSong || this.currentSong.id !== targetSong.id) {
      await this.playSong(targetSong);
      return;
    }

    // Toggle current song
    if (this.isPlaying) {
      this.pause();
    } else {
      await this.resume();
    }
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();
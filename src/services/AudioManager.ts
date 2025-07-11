import { Song } from '@/types/game';
import { enhancedAudioService } from './EnhancedAudioService';
import { memoryCleanup } from './MemoryCleanup';

interface AudioManagerOptions {
  maxConcurrentLoads: number;
  preloadDistance: number; // How many songs ahead to preload
  autoCleanup: boolean;
}

class AudioManagerService {
  private loadQueue: Song[] = [];
  private isProcessingQueue = false;
  private currentSongIndex = 0;
  private playlist: Song[] = [];
  
  private options: AudioManagerOptions = {
    maxConcurrentLoads: 3,
    preloadDistance: 2,
    autoCleanup: true
  };

  constructor() {
    this.registerCleanupTasks();
  }

  private registerCleanupTasks(): void {
    memoryCleanup.registerCleanupTask('audio-manager', () => {
      this.cleanup();
    }, 3);
  }

  async initializePlaylist(songs: Song[]): Promise<void> {
    console.log(`🎵 AudioManager: Initializing playlist with ${songs.length} songs`);
    
    this.playlist = [...songs];
    this.currentSongIndex = 0;
    
    // Preload first few songs
    await this.preloadUpcoming();
  }

  async playNextSong(): Promise<Song | null> {
    if (this.currentSongIndex >= this.playlist.length) {
      console.log('🎵 AudioManager: End of playlist reached');
      return null;
    }

    const song = this.playlist[this.currentSongIndex];
    this.currentSongIndex++;

    console.log(`🎵 AudioManager: Playing song ${this.currentSongIndex}/${this.playlist.length}: ${song.deezer_title}`);

    // Play the current song
    const success = await enhancedAudioService.playSong(song, {
      autoPlay: true,
      fadeIn: true
    });

    if (success) {
      // Preload upcoming songs in background
      this.preloadUpcoming();
      return song;
    } else {
      console.warn(`⚠️ AudioManager: Failed to play ${song.deezer_title}, trying next song`);
      return this.playNextSong(); // Recursively try next song
    }
  }

  async playPreviousSong(): Promise<Song | null> {
    if (this.currentSongIndex <= 1) {
      console.log('🎵 AudioManager: At beginning of playlist');
      return null;
    }

    this.currentSongIndex = Math.max(0, this.currentSongIndex - 2);
    return this.playNextSong();
  }

  async playSongAtIndex(index: number): Promise<Song | null> {
    if (index < 0 || index >= this.playlist.length) {
      console.warn(`⚠️ AudioManager: Invalid song index ${index}`);
      return null;
    }

    this.currentSongIndex = index;
    return this.playNextSong();
  }

  async preloadUpcoming(): Promise<void> {
    if (this.isProcessingQueue) return;

    const upcomingSongs = this.getUpcomingSongs();
    if (upcomingSongs.length === 0) return;

    this.isProcessingQueue = true;
    
    try {
      console.log(`🎵 AudioManager: Preloading ${upcomingSongs.length} upcoming songs`);
      await enhancedAudioService.preloadSongs(upcomingSongs);
    } catch (error) {
      console.warn('⚠️ AudioManager: Preloading failed:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private getUpcomingSongs(): Song[] {
    const start = this.currentSongIndex;
    const end = Math.min(start + this.options.preloadDistance, this.playlist.length);
    return this.playlist.slice(start, end);
  }

  getCurrentSong(): Song | null {
    const index = this.currentSongIndex - 1; // -1 because currentSongIndex points to next song
    return index >= 0 && index < this.playlist.length ? this.playlist[index] : null;
  }

  getNextSong(): Song | null {
    return this.currentSongIndex < this.playlist.length ? this.playlist[this.currentSongIndex] : null;
  }

  getPreviousSong(): Song | null {
    const index = this.currentSongIndex - 2; // -2 because currentSongIndex points to next song
    return index >= 0 ? this.playlist[index] : null;
  }

  getPlaylistInfo(): {
    totalSongs: number;
    currentIndex: number;
    remainingSongs: number;
    progress: number;
  } {
    return {
      totalSongs: this.playlist.length,
      currentIndex: this.currentSongIndex - 1,
      remainingSongs: Math.max(0, this.playlist.length - this.currentSongIndex),
      progress: this.playlist.length > 0 ? (this.currentSongIndex - 1) / this.playlist.length : 0
    };
  }

  async pause(): Promise<void> {
    await enhancedAudioService.pause();
  }

  async resume(): Promise<void> {
    await enhancedAudioService.resume();
  }

  async stop(): Promise<void> {
    await enhancedAudioService.stop(true); // Fade out
  }

  setVolume(volume: number): void {
    enhancedAudioService.setVolume(volume);
  }

  async shuffle(): Promise<void> {
    console.log('🎵 AudioManager: Shuffling playlist');
    
    // Keep current song at the beginning
    const currentSong = this.getCurrentSong();
    const remainingSongs = this.playlist.slice(this.currentSongIndex);
    
    // Shuffle remaining songs
    for (let i = remainingSongs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingSongs[i], remainingSongs[j]] = [remainingSongs[j], remainingSongs[i]];
    }
    
    // Rebuild playlist
    this.playlist = [
      ...this.playlist.slice(0, this.currentSongIndex),
      ...remainingSongs
    ];
    
    // Preload upcoming songs with new order
    await this.preloadUpcoming();
  }

  async skipToPosition(percentage: number): Promise<void> {
    const targetIndex = Math.floor(this.playlist.length * percentage);
    await this.playSongAtIndex(targetIndex);
  }

  getAudioState() {
    return enhancedAudioService.getState();
  }

  getPerformanceStats() {
    return enhancedAudioService.getPerformanceStats();
  }

  private cleanup(): void {
    this.loadQueue = [];
    this.isProcessingQueue = false;
    console.log('🧹 AudioManager: Cleanup completed');
  }

  async reset(): Promise<void> {
    await this.stop();
    this.playlist = [];
    this.currentSongIndex = 0;
    this.cleanup();
    await enhancedAudioService.reset();
    console.log('🔄 AudioManager: Reset completed');
  }
}

export const audioManager = new AudioManagerService();

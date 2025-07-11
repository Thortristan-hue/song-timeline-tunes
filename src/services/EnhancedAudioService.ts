import { Song } from '@/types/game';
import { audioPreloader } from './AudioPreloader';
import { audioFallback } from './AudioFallback';
import { memoryCleanup } from './MemoryCleanup';
import { performanceMonitor } from './PerformanceMonitor';

interface AudioState {
  currentAudio: HTMLAudioElement | null;
  isPlaying: boolean;
  volume: number;
  currentSong: Song | null;
  playbackFailed: boolean;
  fallbackActive: boolean;
}

interface AudioOptions {
  autoPlay?: boolean;
  loop?: boolean;
  volume?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
}

class EnhancedAudioService {
  private state: AudioState = {
    currentAudio: null,
    isPlaying: false,
    volume: 0.7,
    currentSong: null,
    playbackFailed: false,
    fallbackActive: false
  };

  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private fadeTimeouts: NodeJS.Timeout[] = [];
  private playbackPromise: Promise<void> | null = null;

  constructor() {
    this.initializeAudioContext();
    this.registerCleanupTasks();
  }

  private initializeAudioContext(): void {
    try {
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        console.log('🎵 EnhancedAudio: Audio context initialized');
      }
    } catch (error) {
      console.warn('⚠️ EnhancedAudio: AudioContext not available:', error);
    }
  }

  private registerCleanupTasks(): void {
    memoryCleanup.registerCleanupTask('enhanced-audio', () => {
      this.stopAndCleanup();
    }, 4); // High priority
  }

  async preloadSongs(songs: Song[]): Promise<void> {
    console.log(`🎵 EnhancedAudio: Starting preload of ${songs.length} songs`);
    await audioPreloader.preloadSongs(songs);
    
    const cacheStatus = audioPreloader.getCacheStatus();
    console.log(`📊 Audio preload complete:`, cacheStatus);
  }

  async playSong(song: Song, options: AudioOptions = {}): Promise<boolean> {
    const startTime = performance.now();
    
    try {
      // Stop current playback
      await this.stop();

      console.log(`🎵 EnhancedAudio: Attempting to play ${song.deezer_title}`);

      // Try to get audio through fallback service
      const playbackResult = await audioFallback.attemptPlayback(song);
      
      if (!playbackResult.success || !playbackResult.audio) {
        console.warn(`⚠️ EnhancedAudio: Playback failed for ${song.deezer_title}`);
        this.state.playbackFailed = true;
        this.state.fallbackActive = !!playbackResult.fallback;
        
        // Even with failure, we can still provide timing for the game
        if (playbackResult.fallback) {
          this.simulatePlayback(playbackResult.fallback.duration);
          return true; // Game can continue with silent mode
        }
        return false;
      }

      // Set up the audio
      const audio = playbackResult.audio;
      this.state.currentAudio = audio;
      this.state.currentSong = song;
      this.state.playbackFailed = false;
      this.state.fallbackActive = !!playbackResult.fallback;

      // Configure audio settings
      audio.volume = options.volume || this.state.volume;
      audio.loop = options.loop || false;
      audio.currentTime = 0;

      // Set up Web Audio API effects if available
      if (this.audioContext && this.gainNode) {
        try {
          // Resume audio context if suspended (for mobile browsers)
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }

          const source = this.audioContext.createMediaElementSource(audio);
          source.connect(this.gainNode);
        } catch (webAudioError) {
          console.warn('⚠️ EnhancedAudio: Web Audio API setup failed:', webAudioError);
        }
      }

      // Handle fade in
      if (options.fadeIn && this.gainNode) {
        this.gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(
          options.volume || this.state.volume,
          this.audioContext!.currentTime + 1
        );
      }

      // Play the audio
      if (options.autoPlay !== false) {
        this.playbackPromise = audio.play();
        await this.playbackPromise;
        this.state.isPlaying = true;
      }

      const playTime = performance.now() - startTime;
      performanceMonitor.recordMetric('audioLoadTime', playTime);
      
      console.log(`✅ EnhancedAudio: Successfully playing ${song.deezer_title}`);
      return true;

    } catch (error) {
      console.error(`❌ EnhancedAudio: Failed to play ${song.deezer_title}:`, error);
      this.state.playbackFailed = true;
      return false;
    }
  }

  async pause(): Promise<void> {
    if (this.state.currentAudio && this.state.isPlaying) {
      try {
        this.state.currentAudio.pause();
        this.state.isPlaying = false;
        console.log('⏸️ EnhancedAudio: Paused');
      } catch (error) {
        console.warn('⚠️ EnhancedAudio: Pause failed:', error);
      }
    }
  }

  async resume(): Promise<void> {
    if (this.state.currentAudio && !this.state.isPlaying) {
      try {
        await this.state.currentAudio.play();
        this.state.isPlaying = true;
        console.log('▶️ EnhancedAudio: Resumed');
      } catch (error) {
        console.warn('⚠️ EnhancedAudio: Resume failed:', error);
      }
    }
  }

  async stop(fadeOut: boolean = false): Promise<void> {
    try {
      if (fadeOut && this.gainNode && this.audioContext) {
        // Fade out over 0.5 seconds
        this.gainNode.gain.linearRampToValueAtTime(
          0,
          this.audioContext.currentTime + 0.5
        );
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (this.state.currentAudio) {
        this.state.currentAudio.pause();
        this.state.currentAudio.currentTime = 0;
      }

      this.state.isPlaying = false;
      this.clearFadeTimeouts();
      
      if (this.playbackPromise) {
        try {
          await this.playbackPromise;
        } catch (error) {
          // Ignore playback promise rejections during stop
        }
        this.playbackPromise = null;
      }

      console.log('⏹️ EnhancedAudio: Stopped');
    } catch (error) {
      console.warn('⚠️ EnhancedAudio: Stop failed:', error);
    }
  }

  private simulatePlayback(duration: number): void {
    console.log(`🎵 EnhancedAudio: Simulating ${duration}s playback for timing purposes`);
    this.state.isPlaying = true;
    
    setTimeout(() => {
      this.state.isPlaying = false;
      console.log('⏹️ EnhancedAudio: Simulated playback complete');
    }, duration * 1000);
  }

  setVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume));
    
    if (this.state.currentAudio) {
      this.state.currentAudio.volume = this.state.volume;
    }
    
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(this.state.volume, this.audioContext!.currentTime);
    }
  }

  getCurrentTime(): number {
    return this.state.currentAudio?.currentTime || 0;
  }

  getDuration(): number {
    return this.state.currentAudio?.duration || 30; // Default 30s for fallback
  }

  getState(): AudioState {
    return { ...this.state };
  }

  isReady(): boolean {
    return this.state.currentAudio !== null || this.state.fallbackActive;
  }

  hasPlaybackFailed(): boolean {
    return this.state.playbackFailed;
  }

  private clearFadeTimeouts(): void {
    this.fadeTimeouts.forEach(timeout => clearTimeout(timeout));
    this.fadeTimeouts = [];
  }

  private stopAndCleanup(): void {
    this.stop();
    
    if (this.state.currentAudio) {
      this.state.currentAudio.src = '';
      this.state.currentAudio.load();
    }
    
    this.state.currentAudio = null;
    this.state.currentSong = null;
    this.clearFadeTimeouts();
    
    console.log('🧹 EnhancedAudio: Cleanup completed');
  }

  getPerformanceStats(): {
    isPlaying: boolean;
    hasFailed: boolean;
    fallbackActive: boolean;
    currentSong: string | null;
    audioContextState: string;
  } {
    return {
      isPlaying: this.state.isPlaying,
      hasFailed: this.state.playbackFailed,
      fallbackActive: this.state.fallbackActive,
      currentSong: this.state.currentSong?.deezer_title || null,
      audioContextState: this.audioContext?.state || 'unavailable'
    };
  }

  async reset(): Promise<void> {
    await this.stop();
    this.stopAndCleanup();
    this.state.playbackFailed = false;
    this.state.fallbackActive = false;
    audioFallback.clearFallbackCache();
    console.log('🔄 EnhancedAudio: Reset completed');
  }
}

export const enhancedAudioService = new EnhancedAudioService();
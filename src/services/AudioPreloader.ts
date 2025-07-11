import { Song } from '@/types/game';
import { performanceMonitor } from './PerformanceMonitor';

interface CachedAudio {
  audio: HTMLAudioElement;
  loaded: boolean;
  error: boolean;
  lastUsed: number;
}

class AudioPreloaderService {
  private cache = new Map<string, CachedAudio>();
  private maxCacheSize = 20; // Limit memory usage
  private preloadQueue: Song[] = [];
  private isPreloading = false;

  async preloadSongs(songs: Song[]): Promise<void> {
    console.log(`🎵 AudioPreloader: Starting preload of ${songs.length} songs`);
    this.preloadQueue = [...songs];
    
    if (!this.isPreloading) {
      await this.processPreloadQueue();
    }
  }

  private async processPreloadQueue(): Promise<void> {
    this.isPreloading = true;
    
    while (this.preloadQueue.length > 0) {
      const song = this.preloadQueue.shift()!;
      await this.preloadSingle(song);
      
      // Small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.isPreloading = false;
    console.log('🎵 AudioPreloader: Preload queue completed');
  }

  private async preloadSingle(song: Song): Promise<void> {
    if (!song.preview_url || this.cache.has(song.id)) {
      return;
    }

    const startTime = performance.now();
    
    try {
      const audio = new HTMLAudioElement();
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      
      const cachedAudio: CachedAudio = {
        audio,
        loaded: false,
        error: false,
        lastUsed: Date.now(),
      };

      this.cache.set(song.id, cachedAudio);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          cachedAudio.error = true;
          reject(new Error('Audio load timeout'));
        }, 10000); // 10 second timeout

        audio.oncanplaythrough = () => {
          clearTimeout(timeout);
          cachedAudio.loaded = true;
          const loadTime = performance.now() - startTime;
          performanceMonitor.recordMetric('audioLoadTime', loadTime);
          resolve();
        };

        audio.onerror = () => {
          clearTimeout(timeout);
          cachedAudio.error = true;
          reject(new Error('Audio load failed'));
        };

        audio.src = song.preview_url!;
      });

      console.log(`✅ AudioPreloader: Loaded ${song.deezer_title}`);
    } catch (error) {
      console.warn(`⚠️ AudioPreloader: Failed to load ${song.deezer_title}:`, error);
      const cachedAudio = this.cache.get(song.id);
      if (cachedAudio) {
        cachedAudio.error = true;
      }
    }

    this.cleanupCache();
  }

  getAudio(songId: string): HTMLAudioElement | null {
    const cached = this.cache.get(songId);
    if (cached && cached.loaded && !cached.error) {
      cached.lastUsed = Date.now();
      return cached.audio;
    }
    return null;
  }

  isLoaded(songId: string): boolean {
    const cached = this.cache.get(songId);
    return cached ? cached.loaded && !cached.error : false;
  }

  hasError(songId: string): boolean {
    const cached = this.cache.get(songId);
    return cached ? cached.error : false;
  }

  private cleanupCache(): void {
    if (this.cache.size <= this.maxCacheSize) {
      return;
    }

    // Remove oldest unused items
    const entries = Array.from(this.cache.entries());
    entries.sort(([, a], [, b]) => a.lastUsed - b.lastUsed);
    
    const toRemove = entries.slice(0, entries.length - this.maxCacheSize);
    toRemove.forEach(([id, cached]) => {
      cached.audio.src = '';
      cached.audio.load(); // Release memory
      this.cache.delete(id);
    });

    console.log(`🧹 AudioPreloader: Cleaned up ${toRemove.length} cached audio files`);
  }

  clearCache(): void {
    this.cache.forEach(cached => {
      cached.audio.src = '';
      cached.audio.load();
    });
    this.cache.clear();
    console.log('🧹 AudioPreloader: Cache cleared');
  }

  getCacheStatus(): {
    totalCached: number;
    loadedCount: number;
    errorCount: number;
    memoryEstimate: number;
  } {
    let loadedCount = 0;
    let errorCount = 0;
    
    this.cache.forEach(cached => {
      if (cached.loaded) loadedCount++;
      if (cached.error) errorCount++;
    });

    return {
      totalCached: this.cache.size,
      loadedCount,
      errorCount,
      memoryEstimate: this.cache.size * 1024 * 512, // Rough estimate: 512KB per song
    };
  }
}

export const audioPreloader = new AudioPreloaderService();
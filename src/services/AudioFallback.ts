import { Song } from '@/types/game';
import { audioPreloader } from './AudioPreloader';
import { performanceMonitor } from './PerformanceMonitor';

interface AudioFallback {
  type: 'silence' | 'placeholder' | 'cached';
  duration: number;
  reason: string;
}

interface PlaybackResult {
  success: boolean;
  audio?: HTMLAudioElement;
  fallback?: AudioFallback;
  error?: string;
}

class AudioFallbackService {
  private placeholderAudio: HTMLAudioElement | null = null;
  private silentAudio: HTMLAudioElement | null = null;
  private fallbackAttempts = new Map<string, number>();
  private maxFallbackAttempts = 3;

  constructor() {
    this.initializeFallbackAudio();
  }

  private initializeFallbackAudio(): void {
    try {
      // Create silent audio for timing purposes
      this.silentAudio = new HTMLAudioElement();
      this.silentAudio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMcBjiS1/LNeSsFJHfI8N2QQQsUXrPm66hVFAlGr+PzwGUcBzaR1+XNeSsFJHfH8N2QQQsUXrPp66pVFAlGn+DyvmMcBjiS1/LNeSsFJHfI8N2QQQsUXrTm66hVFAl=';
      this.silentAudio.load();

      // Create placeholder tone (optional - could be a simple beep)
      this.placeholderAudio = new HTMLAudioElement();
      this.placeholderAudio.src = this.silentAudio.src; // Use silent for now
      this.placeholderAudio.load();

      console.log('🎵 AudioFallback: Initialized fallback audio sources');
    } catch (error) {
      console.error('❌ AudioFallback: Failed to initialize fallback audio:', error);
    }
  }

  async attemptPlayback(song: Song): Promise<PlaybackResult> {
    const startTime = performance.now();
    const attemptCount = this.fallbackAttempts.get(song.id) || 0;

    try {
      // Strategy 1: Try preloaded audio first
      const preloadedAudio = audioPreloader.getAudio(song.id);
      if (preloadedAudio) {
        console.log(`🎵 AudioFallback: Using preloaded audio for ${song.deezer_title}`);
        const loadTime = performance.now() - startTime;
        performanceMonitor.recordMetric('audioLoadTime', loadTime);
        return { success: true, audio: preloadedAudio };
      }

      // Strategy 2: Try direct loading with timeout
      if (song.preview_url && attemptCount < this.maxFallbackAttempts) {
        try {
          const audio = await this.loadWithTimeout(song.preview_url, 5000);
          console.log(`🎵 AudioFallback: Direct load successful for ${song.deezer_title}`);
          const loadTime = performance.now() - startTime;
          performanceMonitor.recordMetric('audioLoadTime', loadTime);
          return { success: true, audio };
        } catch (directError) {
          console.warn(`⚠️ AudioFallback: Direct load failed for ${song.deezer_title}:`, directError);
          this.fallbackAttempts.set(song.id, attemptCount + 1);
        }
      }

      // Strategy 3: Check for CORS alternative URLs
      if (song.preview_url) {
        const corsProxyUrl = this.tryCorsFallback(song.preview_url);
        if (corsProxyUrl) {
          try {
            const audio = await this.loadWithTimeout(corsProxyUrl, 3000);
            console.log(`🎵 AudioFallback: CORS proxy successful for ${song.deezer_title}`);
            const loadTime = performance.now() - startTime;
            performanceMonitor.recordMetric('audioLoadTime', loadTime);
            return { success: true, audio };
          } catch (corsError) {
            console.warn(`⚠️ AudioFallback: CORS proxy failed for ${song.deezer_title}:`, corsError);
          }
        }
      }

      // Strategy 4: Use cached audio from previous sessions
      const cachedAudio = this.tryFromCache(song);
      if (cachedAudio) {
        console.log(`🎵 AudioFallback: Using cached audio for ${song.deezer_title}`);
        return {
          success: true,
          audio: cachedAudio,
          fallback: {
            type: 'cached',
            duration: 30,
            reason: 'Using cached audio from previous session'
          }
        };
      }

      // Strategy 5: Silent fallback for gameplay continuity
      console.warn(`⚠️ AudioFallback: All audio sources failed for ${song.deezer_title}, using silent fallback`);
      return {
        success: false,
        audio: this.silentAudio || undefined,
        fallback: {
          type: 'silence',
          duration: 30,
          reason: 'All audio sources unavailable - silent mode'
        },
        error: 'No audio sources available'
      };

    } catch (error) {
      console.error(`❌ AudioFallback: Complete failure for ${song.deezer_title}:`, error);
      return {
        success: false,
        fallback: {
          type: 'silence',
          duration: 30,
          reason: 'Audio system error'
        },
        error: error instanceof Error ? error.message : 'Unknown audio error'
      };
    }
  }

  private async loadWithTimeout(url: string, timeout: number): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new HTMLAudioElement();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';

      const timeoutId = setTimeout(() => {
        audio.src = '';
        reject(new Error(`Audio load timeout after ${timeout}ms`));
      }, timeout);

      audio.oncanplaythrough = () => {
        clearTimeout(timeoutId);
        resolve(audio);
      };

      audio.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Audio load error: ${audio.error?.message || 'Unknown error'}`));
      };

      audio.src = url;
    });
  }

  private tryCorsFallback(originalUrl: string): string | null {
    // Try different CORS proxy approaches
    const proxies = [
      // Note: These are examples - in production, you'd use your own proxy
      // `https://cors-anywhere.herokuapp.com/${originalUrl}`,
      // `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`,
    ];

    // For now, just try a simple modification to the URL
    if (originalUrl.includes('deezer.com')) {
      // Sometimes adding parameters can help with caching
      const separator = originalUrl.includes('?') ? '&' : '?';
      return `${originalUrl}${separator}timestamp=${Date.now()}`;
    }

    return null;
  }

  private tryFromCache(song: Song): HTMLAudioElement | null {
    // Check if we have this song cached from audioPreloader with error state
    if (audioPreloader.hasError(song.id)) {
      return null;
    }

    // Try to get cached version even if marked as failed
    return audioPreloader.getAudio(song.id);
  }

  resetFallbackAttempts(songId: string): void {
    this.fallbackAttempts.delete(songId);
  }

  getFallbackStats(): {
    totalAttempts: number;
    averageAttempts: number;
    mostProblematicSongs: Array<{ songId: string; attempts: number }>;
  } {
    const attempts = Array.from(this.fallbackAttempts.entries());
    const totalAttempts = attempts.reduce((sum, [, count]) => sum + count, 0);
    const averageAttempts = attempts.length > 0 ? totalAttempts / attempts.length : 0;
    
    const mostProblematic = attempts
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([songId, attempts]) => ({ songId, attempts }));

    return {
      totalAttempts,
      averageAttempts,
      mostProblematicSongs: mostProblematic
    };
  }

  clearFallbackCache(): void {
    this.fallbackAttempts.clear();
    console.log('🧹 AudioFallback: Cleared fallback attempt cache');
  }
}

export const audioFallback = new AudioFallbackService();
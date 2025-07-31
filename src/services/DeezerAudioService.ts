
/**
 * Service for handling Deezer audio playback
 * Handles fetching track metadata and extracting MP3 preview URLs
 */
export class DeezerAudioService {
  private static readonly PROXY_BASE = 'https://timeliner-proxy.thortristanjd.workers.dev/';
  private static readonly DEEZER_API = 'https://api.deezer.com/track/';
  private static readonly AUDIO_CACHE = new Map<string, string>();

  /**
   * Gets the playable MP3 preview URL for a Deezer track with resilient error handling
   * @param trackId Deezer track ID (number or string)
   * @returns Promise<string> MP3 preview URL
   * @throws Error if request fails or no preview available
   */
  static async getPreviewUrl(trackId: string | number): Promise<string> {
    const cacheKey = String(trackId);
    if (this.AUDIO_CACHE.has(cacheKey)) {
      return this.AUDIO_CACHE.get(cacheKey)!;
    }

    const apiUrl = `${this.DEEZER_API}${trackId}`;
    const proxyUrl = `${this.PROXY_BASE}?url=${encodeURIComponent(apiUrl)}`;
    
    try {
      console.log('🎵 Fetching audio preview for track:', trackId);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        const errorMsg = `Deezer API request failed: ${response.status} ${response.statusText}`;
        console.warn('⚠️ Audio fetch failed (non-blocking):', errorMsg);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (!data.preview) {
        const errorMsg = `No preview available for track ${trackId}`;
        console.warn('⚠️ No audio preview available (non-blocking):', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('✅ Audio preview URL fetched successfully for track:', trackId);
      this.AUDIO_CACHE.set(cacheKey, data.preview);
      return data.preview;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load audio preview';
      console.warn('⚠️ Audio preview fetch failed (non-blocking):', {
        trackId,
        error: errorMsg,
        note: 'Game will continue without this audio preview'
      });
      
      // Re-throw but with clear indication this is non-blocking
      throw new Error(`Audio unavailable: ${errorMsg}`);
    }
  }

  /**
   * Creates a configured audio element for playback with CORS resilience
   * @param url MP3 URL to play
   * @returns HTMLAudioElement ready for playback
   */
  static createAudioElement(url: string): HTMLAudioElement {
    const audio = new Audio();
    
    // CRITICAL: Set crossOrigin BEFORE src assignment to fix CORS issues
    audio.crossOrigin = 'anonymous';
    audio.preload = 'metadata';
    
    // Add error handling for audio loading failures
    audio.addEventListener('error', (e) => {
      console.warn('⚠️ Audio loading failed (non-blocking):', {
        url: url,
        error: e,
        networkState: audio.networkState,
        readyState: audio.readyState
      });
      // Don't throw - allow game to continue without audio
    });

    audio.addEventListener('canplaythrough', () => {
      console.log('✅ Audio loaded successfully:', url.substring(0, 50) + '...');
    });

    // Set src after crossOrigin is configured
    audio.src = url;
    
    return audio;
  }

  /**
   * Gets a proxied URL for CORS-free access
   * @param originalUrl Original Deezer URL
   * @returns Proxied URL
   */
  getProxiedUrl(originalUrl: string): string {
    return `${DeezerAudioService.PROXY_BASE}?url=${encodeURIComponent(originalUrl)}`;
  }
}

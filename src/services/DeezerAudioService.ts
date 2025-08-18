
/**
 * Service for handling Deezer audio playback
 * Handles fetching track metadata and extracting MP3 preview URLs
 */
export class DeezerAudioService {
  private static readonly PROXY_BASE = 'https://timeliner-proxy.thortristanjd.workers.dev/';
  private static readonly DEEZER_API = 'https://api.deezer.com/track/';
  private static readonly AUDIO_CACHE = new Map<string, string>();

  /**
   * Gets the playable MP3 preview URL for a Deezer track
   * @param trackId Deezer track ID (number or string)
   * @returns Promise<string> MP3 preview URL
   * @throws Error if request fails or no preview available
   */
  static async getPreviewUrl(trackId: string | number): Promise<string> {
    const cacheKey = String(trackId);
    if (this.AUDIO_CACHE.has(cacheKey)) {
      console.log('🎵 Using cached preview URL for track:', trackId);
      return this.AUDIO_CACHE.get(cacheKey)!;
    }

    const apiUrl = `${this.DEEZER_API}${trackId}`;
    const proxyUrl = `${this.PROXY_BASE}?url=${encodeURIComponent(apiUrl)}`;
    
    try {
      console.log('🔄 Fetching track data from proxy:', proxyUrl);
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`Deezer API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 Track data received:', { id: data.id, title: data.title, hasPreview: !!data.preview });
      
      if (!data.preview) {
        throw new Error('No preview available for this track');
      }

      // Cache the preview URL
      this.AUDIO_CACHE.set(cacheKey, data.preview);
      console.log('✅ Preview URL cached for track:', trackId);
      
      return data.preview;
    } catch (error) {
      console.error('❌ Failed to get preview URL for track', trackId, ':', error);
      throw new Error(`Failed to load audio preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates a configured audio element for playback
   * @param url MP3 URL to play
   * @returns HTMLAudioElement ready for playback
   */
  static createAudioElement(url: string): HTMLAudioElement {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    audio.src = url;
    return audio;
  }

  /**
   * Gets a proxied URL for CORS-free access
   * @param originalUrl Original Deezer URL
   * @returns Proxied URL
   */
  static getProxiedUrl(originalUrl: string): string {
    return `${DeezerAudioService.PROXY_BASE}?url=${encodeURIComponent(originalUrl)}`;
  }

  /**
   * Clears the audio cache
   */
  static clearCache(): void {
    this.AUDIO_CACHE.clear();
    console.log('🗑️ Audio cache cleared');
  }

  /**
   * Gets cache size
   */
  static getCacheSize(): number {
    return this.AUDIO_CACHE.size;
  }
}

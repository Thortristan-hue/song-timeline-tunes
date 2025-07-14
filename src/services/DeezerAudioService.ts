
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
      return this.AUDIO_CACHE.get(cacheKey)!;
    }

    const apiUrl = `${this.DEEZER_API}${trackId}`;
    const proxyUrl = `${this.PROXY_BASE}?url=${encodeURIComponent(apiUrl)}`;
    
    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Deezer API request failed: ${response.status}`);
      }

      const data = await response.json();
      if (!data.preview) {
        throw new Error('No preview available for this track');
      }

      this.AUDIO_CACHE.set(cacheKey, data.preview);
      return data.preview;
    } catch (error) {
      console.error('Failed to get preview URL:', error);
      throw new Error('Failed to load audio preview');
    }
  }

  /**
   * Creates a configured audio element for playback
   * @param url MP3 URL to play
   * @returns HTMLAudioElement ready for playback
   */
  static createAudioElement(url: string): HTMLAudioElement {
    const audio = new Audio(url);
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
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

/**
 * Deezer Audio Proxy Service
 * Handles fetching and playing Deezer track previews through a CORS proxy
 */
export class DeezerAudioService {
  private static readonly PROXY_BASE = 'https://timeliner-proxy.thortristanjd.workers.dev/';
  private static readonly DEEZER_API = 'https://api.deezer.com/track/';

  /**
   * Fetches track data and returns the MP3 preview URL
   * @param trackId Deezer track ID (e.g., "1797192397")
   * @returns Promise<string> MP3 preview URL
   * @throws Error if request fails or no preview available
   */
  static async getPreviewUrl(trackId: string): Promise<string> {
    if (!trackId.match(/^\d+$/)) {
      throw new Error('Invalid Deezer track ID');
    }

    const apiUrl = `${this.DEEZER_API}${trackId}`;
    const proxyUrl = `${this.PROXY_BASE}?url=${encodeURIComponent(apiUrl)}`;

    const response = await fetch(proxyUrl);
    const data = await this.parseResponse(response);

    if (!data.preview) {
      throw new Error('No preview available for this track');
    }

    return data.preview;
  }

  /**
   * Creates and returns a playable Audio element
   * @param trackId Deezer track ID
   * @returns Promise<HTMLAudioElement> Configured audio element
   */
  static async createAudioElement(trackId: string): Promise<HTMLAudioElement> {
    const previewUrl = await this.getPreviewUrl(trackId);
    const audio = new Audio(previewUrl);
    audio.preload = 'auto';
    audio.controls = false;
    return audio;
  }

  /**
   * Plays a track preview (automatically handles loading)
   * @param trackId Deezer track ID
   * @returns Promise that resolves when playback begins
   */
  static async playPreview(trackId: string): Promise<void> {
    const audio = await this.createAudioElement(trackId);
    return new Promise((resolve, reject) => {
      audio.oncanplaythrough = () => {
        audio.play().then(resolve).catch(reject);
      };
      audio.onerror = () => {
        reject(new Error('Audio playback failed'));
      };
    });
  }

  private static async parseResponse(response: Response): Promise<any> {
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error('Failed to parse API response');
    }
  }
}

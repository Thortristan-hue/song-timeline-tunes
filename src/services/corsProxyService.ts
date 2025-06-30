/**
 * A service for making CORS-compatible requests through a Cloudflare Worker proxy.
 * Handles all communication with timeliner-proxy for Deezer, MusicBrainz, and Discogs APIs.
 */
export class CorsProxyService {
  private static readonly PROXY_BASE_URL = 'https://timeliner-proxy.thortristanjd.workers.dev/';
  private static readonly ALLOWED_DOMAINS = [
    'api.deezer.com',
    'musicbrainz.org',
    'api.discogs.com'
  ];

  /**
   * Fetches a resource through the CORS proxy
   * @param url The target API URL (must be from allowed domains)
   * @returns A Promise resolving to the Response
   * @throws Error if the request fails or URL is invalid
   */
  static async fetch(url: string): Promise<Response> {
    this.validateUrl(url);
    const proxyUrl = this.buildProxyUrl(url);
    
    try {
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }
      
      return response;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Fetches JSON data through the proxy
   * @param url The target API URL
   * @returns Parsed JSON data
   */
  static async fetchJson<T>(url: string): Promise<T> {
    const response = await this.fetch(url);
    return response.json();
  }

  /**
   * Checks if a URL can be accessed through the proxy
   * @param url The URL to validate
   * @returns boolean indicating if the URL is supported
   */
  static isSupportedUrl(url: string): boolean {
    try {
      const hostname = new URL(url).hostname;
      return this.ALLOWED_DOMAINS.some(domain => hostname.endsWith(domain));
    } catch {
      return false;
    }
  }

  private static validateUrl(url: string): void {
    if (!this.isSupportedUrl(url)) {
      throw new Error(`Unsupported URL: ${url}. Proxy only allows: ${this.ALLOWED_DOMAINS.join(', ')}`);
    }
  }

  private static buildProxyUrl(url: string): string {
    return `${this.PROXY_BASE_URL}?url=${encodeURIComponent(url)}`;
  }

  private static async handleErrorResponse(response: Response): Promise<void> {
    let errorMessage = `Proxy request failed with status ${response.status}`;
    
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        errorMessage += `: ${errorData.error}`;
      }
    } catch {
      // Fall back to status text if JSON parsing fails
      errorMessage += `: ${response.statusText}`;
    }
    
    throw new Error(errorMessage);
  }

  private static normalizeError(error: unknown): Error {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }
}

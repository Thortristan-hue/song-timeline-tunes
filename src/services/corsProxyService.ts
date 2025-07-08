
/**
 * Generic CORS Proxy Service for external API calls
 */
export class CorsProxyService {
  private static readonly PROXY_BASE = 'https://timeliner-proxy.thortristanjd.workers.dev/';

  /**
   * Checks if a URL is supported by the proxy service
   * @param url URL to check
   * @returns boolean indicating support
   */
  static isSupportedUrl(url: string): boolean {
    const supportedDomains = [
      'api.deezer.com',
      'deezer.com'
    ];
    
    try {
      const urlObj = new URL(url);
      return supportedDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }

  /**
   * Fetches JSON data through the proxy with enhanced error handling
   * @param url Target URL to fetch
   * @returns Promise with parsed JSON data
   */
  static async fetchJson<T>(url: string): Promise<T> {
    if (!this.isSupportedUrl(url)) {
      throw new Error('URL not supported by proxy service');
    }

    const proxyUrl = `${this.PROXY_BASE}?url=${encodeURIComponent(url)}`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Proxy request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('Proxy request timed out:', url);
          throw new Error('Request timed out');
        }
        console.error('Proxy fetch error:', error.message);
        throw new Error(`Failed to fetch data: ${error.message}`);
      }
      console.error('Unknown proxy fetch error:', error);
      throw new Error('Failed to fetch data through proxy');
    }
  }
}


// CORS Proxy Service using custom Cloudflare Worker proxy
// Uses the timeliner-proxy for reliable external API access

export class CorsProxyService {
  private static readonly PROXY_BASE_URL = 'https://timeliner-proxy.thortristanjd.workers.dev/';

  static async fetchWithProxy(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      // Construct proxy URL with the target URL as a parameter
      const proxyUrl = `${this.PROXY_BASE_URL}?url=${encodeURIComponent(url)}`;
      
      console.log(`🔄 Fetching via proxy: ${url}`);
      console.log(`🔄 Proxy URL: ${proxyUrl}`);
      
      const response = await fetch(proxyUrl, {
        method: 'GET', // Proxy only supports GET requests
        headers: {
          'Accept': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        // Try to get error details from proxy response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If we can't parse error JSON, use the status text
        }
        throw new Error(errorMessage);
      }

      console.log(`✅ Successfully fetched via proxy: ${url}`);
      return response;
    } catch (error) {
      console.error(`❌ Proxy fetch failed for ${url}:`, error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  static async fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await this.fetchWithProxy(url, options);
    return response.json();
  }

  static async fetchText(url: string, options: RequestInit = {}): Promise<string> {
    const response = await this.fetchWithProxy(url, options);
    return response.text();
  }

  // Helper method to check if a URL is supported by the proxy
  static isSupportedUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const supportedDomains = [
        'api.deezer.com',
        'musicbrainz.org',
        'api.discogs.com'
      ];
      return supportedDomains.some(domain => parsed.hostname.endsWith(domain));
    } catch {
      return false;
    }
  }
}

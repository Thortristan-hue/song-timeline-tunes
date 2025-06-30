export class CorsProxyService {
  private static readonly PROXY_BASE_URL = 'https://timeliner-proxy.thortristanjd.workers.dev/';
  
  /**
   * Converts any Deezer URL to API format
   * Example:
   * https://www.deezer.com/track/123 → https://api.deezer.com/track/123
   */
  private static forceApiUrl(url: string): string {
    try {
      const parsed = new URL(url);
      
      // Handle both www.deezer.com and deezer.com
      if (parsed.hostname.includes('deezer.com')) {
        parsed.hostname = 'api.deezer.com';
        return parsed.toString();
      }
      
      return url;
    } catch {
      return url;
    }
  }

  /**
   * Fetches through proxy with automatic URL correction
   */
  static async fetch(url: string): Promise<Response> {
    const apiUrl = this.forceApiUrl(url);
    const proxyUrl = `${this.PROXY_BASE_URL}?url=${encodeURIComponent(apiUrl)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response;
  }

  static async fetchJson<T>(url: string): Promise<T> {
    const response = await this.fetch(url);
    return response.json();
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

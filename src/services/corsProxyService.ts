
// CORS Proxy Service for fetching external resources
// Uses multiple fallback proxies for reliability

interface ProxyConfig {
  name: string;
  baseUrl: string;
  urlParam: string;
}

const CORS_PROXIES: ProxyConfig[] = [
  {
    name: 'cors-anywhere-heroku',
    baseUrl: 'https://cors-anywhere.herokuapp.com/',
    urlParam: ''
  },
  {
    name: 'thingproxy',
    baseUrl: 'https://thingproxy.freeboard.io/fetch/',
    urlParam: ''
  },
  {
    name: 'yacdn',
    baseUrl: 'https://yacdn.org/proxy/',
    urlParam: ''
  }
];

export class CorsProxyService {
  private static currentProxyIndex = 0;

  static async fetchWithProxy(url: string, options: RequestInit = {}): Promise<Response> {
    const errors: Error[] = [];
    
    // Try each proxy in sequence
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      const proxyIndex = (this.currentProxyIndex + i) % CORS_PROXIES.length;
      const proxy = CORS_PROXIES[proxyIndex];
      
      try {
        const proxyUrl = `${proxy.baseUrl}${url}`;
        console.log(`🔄 Trying CORS proxy: ${proxy.name} for ${url}`);
        
        const response = await fetch(proxyUrl, {
          ...options,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            ...options.headers
          }
        });

        if (response.ok) {
          console.log(`✅ Successfully fetched via ${proxy.name}`);
          this.currentProxyIndex = proxyIndex; // Remember working proxy
          return response;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.warn(`❌ Proxy ${proxy.name} failed:`, error);
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // If all proxies fail, try direct fetch as last resort
    try {
      console.log('🔄 Trying direct fetch as fallback...');
      const response = await fetch(url, options);
      if (response.ok) {
        console.log('✅ Direct fetch succeeded');
        return response;
      }
      throw new Error(`Direct fetch failed: HTTP ${response.status}`);
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }

    // All methods failed
    const errorMessage = `All CORS proxies failed. Errors: ${errors.map(e => e.message).join(', ')}`;
    console.error('❌ Complete fetch failure:', errorMessage);
    throw new Error(errorMessage);
  }

  static async fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await this.fetchWithProxy(url, options);
    return response.json();
  }

  static async fetchText(url: string, options: RequestInit = {}): Promise<string> {
    const response = await this.fetchWithProxy(url, options);
    return response.text();
  }
}

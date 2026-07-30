interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function getFallbackUrl(url: string): string | null {
  if (url.startsWith('https://raw.githubusercontent.com/finmap-org/')) {
    return url.replace('https://raw.githubusercontent.com/finmap-org/', 'https://data.finmap.org/');
  }
  if (url.startsWith('https://raw.githubusercontent.com/')) {
    return url.replace('https://raw.githubusercontent.com/', 'https://data.finmap.org/');
  }
  return null;
}

export class DataService {
  private static cache = new Map<string, CacheEntry<any>>();

  static async fetchJson<T>(url: string, signal?: AbortSignal, ttlMs?: number): Promise<T> {
    if (ttlMs && ttlMs > 0) {
      const cached = this.cache.get(url);
      if (cached && Date.now() - cached.timestamp < ttlMs) {
        return cached.data as T;
      }
    }

    try {
      const response = await fetch(url, signal ? { signal } : undefined);
      if (!response.ok) {
        throw new HttpError(response.status, `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: T = await response.json();

      if (ttlMs && ttlMs > 0) {
        this.cache.set(url, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw error;
      }

      const fallbackUrl = getFallbackUrl(url);
      if (fallbackUrl && fallbackUrl !== url) {
        console.warn(`Primary fetch failed for ${url}, attempting fallback: ${fallbackUrl}`, error);
        try {
          const fallbackResponse = await fetch(fallbackUrl, signal ? { signal } : undefined);
          if (!fallbackResponse.ok) {
            throw new HttpError(
              fallbackResponse.status,
              `Fallback HTTP ${fallbackResponse.status}: ${fallbackResponse.statusText}`,
            );
          }
          const data: T = await fallbackResponse.json();
          if (ttlMs && ttlMs > 0) {
            this.cache.set(url, { data, timestamp: Date.now() });
          }
          return data;
        } catch (fallbackError: any) {
          if (fallbackError?.name === 'AbortError') {
            throw fallbackError;
          }
          throw error;
        }
      }

      throw error;
    }
  }

  static async fetchText(url: string, signal?: AbortSignal): Promise<string> {
    try {
      const response = await fetch(url, signal ? { signal } : undefined);
      if (!response.ok) {
        throw new HttpError(response.status, `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw error;
      }

      const fallbackUrl = getFallbackUrl(url);
      if (fallbackUrl && fallbackUrl !== url) {
        console.warn(`Primary fetch failed for ${url}, attempting fallback: ${fallbackUrl}`, error);
        try {
          const fallbackResponse = await fetch(fallbackUrl, signal ? { signal } : undefined);
          if (!fallbackResponse.ok) {
            throw new HttpError(
              fallbackResponse.status,
              `Fallback HTTP ${fallbackResponse.status}: ${fallbackResponse.statusText}`,
            );
          }
          return await fallbackResponse.text();
        } catch (fallbackError: any) {
          if (fallbackError?.name === 'AbortError') {
            throw fallbackError;
          }
          throw error;
        }
      }

      throw error;
    }
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

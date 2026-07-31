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
  const PREFIX = 'https://raw.githubusercontent.com/finmap-org/';
  if (url.startsWith(PREFIX)) {
    return url.replace(PREFIX, 'https://data.finmap.org/');
  }
  return null;
}

export class DataService {
  private static cache = new Map<string, CacheEntry<any>>();

  private static async fetchResponseWithFallback(
    url: string,
    signal?: AbortSignal,
  ): Promise<Response> {
    const requestOptions = signal ? { signal } : undefined;

    try {
      const response = await fetch(url, requestOptions);
      if (!response.ok) {
        throw new HttpError(response.status, `HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    } catch (primaryError: any) {
      if (primaryError?.name === 'AbortError') {
        throw primaryError;
      }

      const fallbackUrl = getFallbackUrl(url);
      if (fallbackUrl && fallbackUrl !== url) {
        console.warn(
          `Primary fetch failed for ${url}, attempting fallback: ${fallbackUrl}`,
          primaryError,
        );
        try {
          const fallbackResponse = await fetch(fallbackUrl, requestOptions);
          if (!fallbackResponse.ok) {
            throw new HttpError(
              fallbackResponse.status,
              `Fallback HTTP ${fallbackResponse.status}: ${fallbackResponse.statusText}`,
            );
          }
          return fallbackResponse;
        } catch (fallbackError: any) {
          if (fallbackError?.name === 'AbortError') {
            throw fallbackError;
          }
          console.error(`Fallback fetch also failed for ${fallbackUrl}:`, fallbackError);
        }
      }

      throw primaryError;
    }
  }

  static async fetchJson<T>(url: string, signal?: AbortSignal, ttlMs?: number): Promise<T> {
    if (ttlMs && ttlMs > 0) {
      const cached = this.cache.get(url);
      if (cached && Date.now() - cached.timestamp < ttlMs) {
        return cached.data as T;
      }
    }

    const response = await this.fetchResponseWithFallback(url, signal);
    const data: T = await response.json();

    if (ttlMs && ttlMs > 0) {
      this.cache.set(url, { data, timestamp: Date.now() });
    }

    return data;
  }

  static async fetchText(url: string, signal?: AbortSignal): Promise<string> {
    const response = await this.fetchResponseWithFallback(url, signal);
    return await response.text();
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
      throw error;
    }
  }

  static async fetchText(url: string, signal?: AbortSignal): Promise<string> {
    try {
      const response = await fetch(url, signal ? { signal } : undefined);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw error;
      }
      throw error;
    }
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

export class HttpError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = 'HttpError';
    }
}
export function getFallbackUrl(url) {
    const PREFIX = 'https://raw.githubusercontent.com/finmap-org/';
    if (url.startsWith(PREFIX)) {
        return url.replace(PREFIX, 'https://data.finmap.org/');
    }
    return null;
}
export class DataService {
    static cache = new Map();
    static async fetchResponseWithFallback(url, signal) {
        const requestOptions = signal ? { signal } : undefined;
        try {
            const response = await fetch(url, requestOptions);
            if (!response.ok) {
                throw new HttpError(response.status, `HTTP ${response.status}: ${response.statusText}`);
            }
            return response;
        }
        catch (primaryError) {
            if (primaryError?.name === 'AbortError') {
                throw primaryError;
            }
            const fallbackUrl = getFallbackUrl(url);
            if (fallbackUrl && fallbackUrl !== url) {
                console.warn(`Primary fetch failed for ${url}, attempting fallback: ${fallbackUrl}`, primaryError);
                try {
                    const fallbackResponse = await fetch(fallbackUrl, requestOptions);
                    if (!fallbackResponse.ok) {
                        throw new HttpError(fallbackResponse.status, `Fallback HTTP ${fallbackResponse.status}: ${fallbackResponse.statusText}`);
                    }
                    return fallbackResponse;
                }
                catch (fallbackError) {
                    if (fallbackError?.name === 'AbortError') {
                        throw fallbackError;
                    }
                    console.error(`Fallback fetch also failed for ${fallbackUrl}:`, fallbackError);
                }
            }
            throw primaryError;
        }
    }
    static async fetchJson(url, signal, ttlMs) {
        if (ttlMs && ttlMs > 0) {
            const cached = this.cache.get(url);
            if (cached && Date.now() - cached.timestamp < ttlMs) {
                return cached.data;
            }
        }
        const response = await this.fetchResponseWithFallback(url, signal);
        const data = await response.json();
        if (ttlMs && ttlMs > 0) {
            this.cache.set(url, { data, timestamp: Date.now() });
        }
        return data;
    }
    static async fetchText(url, signal) {
        const response = await this.fetchResponseWithFallback(url, signal);
        return await response.text();
    }
    static clearCache() {
        this.cache.clear();
    }
}
//# sourceMappingURL=api.js.map
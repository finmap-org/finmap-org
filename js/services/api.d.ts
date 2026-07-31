export declare class HttpError extends Error {
    status: number;
    constructor(status: number, message: string);
}
export declare function getFallbackUrl(url: string): string | null;
export declare class DataService {
    private static cache;
    private static fetchResponseWithFallback;
    static fetchJson<T>(url: string, signal?: AbortSignal, ttlMs?: number): Promise<T>;
    static fetchText(url: string, signal?: AbortSignal): Promise<string>;
    static clearCache(): void;
}
//# sourceMappingURL=api.d.ts.map
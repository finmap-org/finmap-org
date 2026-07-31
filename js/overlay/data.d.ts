import type { NewsItem, CompanyInfo } from './types.js';
export declare function escapeHtml(str: string): string;
export declare function fetchNews(ticker: string, companyName: string, date: string, signal?: AbortSignal): Promise<NewsItem[]>;
export declare function fetchCompanyInfo(exchange: string, ticker: string, wikiPageIdEng?: string, wikiPageIdOriginal?: string, signal?: AbortSignal): Promise<CompanyInfo | null>;
//# sourceMappingURL=data.d.ts.map
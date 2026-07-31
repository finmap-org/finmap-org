export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sourceUrl: string;
}

export interface CompanyInfo {
  description: string;
  sourceLink: string;
}

export type OverlayTab = 'news' | 'info' | 'buy';

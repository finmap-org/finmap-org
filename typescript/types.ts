import type { Currency } from './currency/types.js';

export type Exchange = 'nasdaq' | 'nyse' | 'amex' | 'us-all' | 'moex' | 'lse' | 'bist' | 'hkex';
export type ChartType = 'treemap' | 'histogram';
export type DataType = 'marketcap' | 'value' | 'trades' | 'nestedItems';
export type Language = 'en' | 'ru' | 'tr' | 'cn';

export interface AppConfig {
  exchange: Exchange;
  chartType: ChartType;
  dataType: DataType;
  date: string;
  currency: Currency;
  currencyExchangeRate: number;
  language: Language;
}

export interface ChartRenderer {
  render(data: any[], container: HTMLElement): void;
  destroy(): void;
}

export interface SearchableChart extends ChartRenderer {
  searchAndHighlight(query: string): void;
}

export function isSearchableChart(renderer: ChartRenderer | null): renderer is SearchableChart {
  return (
    renderer !== null && typeof (renderer as SearchableChart).searchAndHighlight === 'function'
  );
}

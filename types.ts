export interface MarketDataResponse {
  securities: {
    columns: string[];
    data: any[][];
  };
}

export interface MarketData {
  exchange: string;
  country: string;
  type: 'stock' | 'etf' | 'sector';
  sector: string;
  industry: string;
  currencyId: string;
  ticker: string;
  nameEng: string;
  nameEngShort: string;
  nameOriginal: string;
  nameOriginalShort: string;
  priceOpen: number;
  priceLastSale: number;
  priceChangePct: number | null;
  volume: number;
  value: number;
  numTrades: number;
  marketCap: number;
  listedFrom: string;
  listedTill: string;
  wikiPageIdEng: string;
  wikiPageIdOriginal: string;
  nestedItemsCount: number;
}

export interface HistoricalDataResponse {
  dates: string[];
  sectors: HistoricalSector[];
}

export interface HistoricalSector {
  sectorName: string;
  itemsNumber: number[];
  marketCap: number[];
  priceChangePct: number[];
}

export type Exchange = 'nasdaq' | 'nyse' | 'amex' | 'us-all' | 'moex' | 'lse' | 'bist';
export type ChartType = 'treemap' | 'histogram';
export type DataType = 'marketcap' | 'value' | 'trades' | 'nestedItems';
export type Currency = 'USD' | 'RUB' | 'GBP' | 'TRY';
export type Language = 'ENG' | 'RUS';

export interface AppConfig {
  exchange: Exchange;
  chartType: ChartType;
  dataType: DataType;
  date: string;
  currency: Currency;
  language: Language;
}

export interface FilterCriteria {
  ticker: string[];
  amount: number[];
}

export interface DataParsingService {
  parseMarketData(response: MarketDataResponse): MarketData[];
  parseHistoricalData(response: HistoricalDataResponse): HistoricalSector[];
}

export interface DataParser {
  parseSecurityRow(columns: string[], row: any[]): MarketData;
  validateDataIntegrity(data: MarketDataResponse): boolean;
}

export interface ChartRenderer {
  render(data: MarketData[], container: HTMLElement): void;
  destroy(): void;
}

export interface TreemapNode {
  ticker: string;
  name: string;
  value: number;
  change: number;
  color: string;
  children?: TreemapNode[];
  data?: MarketData;
}

export interface HistogramDataPoint {
  date: string;
  value: number;
  sector: string;
}

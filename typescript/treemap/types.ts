import type { Exchange } from '../types.js';
import type { HierarchyNode as D3HierarchyNode } from 'd3';

export type RawSecurityValue = string | number | null;
export type RawSecurityRow = RawSecurityValue[];

export interface MarketDataResponse {
  securities: {
    columns: string[];
    data: RawSecurityRow[];
  };
}

export interface MarketData {
  exchange: Exchange;
  country: string;
  type: string;
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
  positionValue?: number;
  isPortfolio?: boolean;
}

export interface DataParsingService {
  parseMarketData(response: MarketDataResponse): MarketData[];
  // parseHistoricalData(response: HistoricalDataResponse): HistoricalSector[];
}

export interface DataParser {
  parseSecurityRow(columns: string[], row: RawSecurityRow): MarketData;
  validateDataIntegrity(data: MarketDataResponse): boolean;
}

export interface ChartRenderer {
  render(data: MarketData[], container: HTMLElement): void;
  destroy(): void;
}

export type HierarchyNode = D3HierarchyNode<any> & {
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
};

export type TreemapNode = HierarchyNode;

export interface PathbarItem {
  name: string;
  node: HierarchyNode;
}

export function isLeafNode(node: any): boolean {
  return !node.children || node.children.length === 0;
}

export function getNodeData(node: any): MarketData {
  return node.data.data;
}

export function getNodeChange(node: any): number {
  const data = getNodeData(node);
  return data?.priceChangePct || 0;
}

export const dataParser: DataParser = {
  parseSecurityRow(columns: string[], row: RawSecurityRow): MarketData {
    const data: Record<string, RawSecurityValue> = {};
    columns.forEach((col, index) => {
      data[col] = row[index] ?? null;
    });

    const str = (v: RawSecurityValue | undefined): string =>
      v !== null && v !== undefined ? String(v) : '';
    const num = (v: RawSecurityValue | undefined): number =>
      v !== null && v !== undefined ? Number(v) || 0 : 0;

    const exchangeValue = str(data.exchange);
    return {
      exchange: exchangeValue ? (exchangeValue.toLowerCase() as Exchange) : ('' as any),
      country: str(data.country),
      type: str(data.type),
      sector: str(data.sector),
      industry: str(data.industry),
      currencyId: str(data.currencyId),
      ticker: str(data.ticker),
      nameEng: str(data.nameEng),
      nameEngShort: str(data.nameEngShort),
      nameOriginal: str(data.nameOriginal),
      nameOriginalShort: str(data.nameOriginalShort),
      priceOpen: num(data.priceOpen),
      priceLastSale: num(data.priceLastSale),
      priceChangePct: data.priceChangePct === null ? null : num(data.priceChangePct),
      volume: num(data.volume),
      value: num(data.value),
      numTrades: num(data.numTrades),
      marketCap: num(data.marketCap),
      listedFrom: str(data.listedFrom),
      listedTill: str(data.listedTill),
      wikiPageIdEng: str(data.wikiPageIdEng),
      wikiPageIdOriginal: str(data.wikiPageIdOriginal),
      nestedItemsCount: num(data.nestedItemsCount),
    };
  },

  validateDataIntegrity(data: MarketDataResponse): boolean {
    return !!(data?.securities?.columns?.length && data?.securities?.data?.length);
  },
};

export function parseMarketData(response: MarketDataResponse): MarketData[] {
  if (!dataParser.validateDataIntegrity(response)) {
    return [];
  }

  return response.securities.data.map(row =>
    dataParser.parseSecurityRow(response.securities.columns, row),
  );
}

export function getDisplayName(
  data: MarketData,
  language: string,
  exchangeLanguage: string | null,
): string {
  if (
    exchangeLanguage &&
    language !== 'en' &&
    language === exchangeLanguage &&
    data.nameOriginalShort
  ) {
    return data.nameOriginalShort;
  }
  return data.nameEng;
}

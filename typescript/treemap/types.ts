import type { Exchange } from "../types.js";

export interface MarketDataResponse {
  securities: {
    columns: string[];
    data: any[][];
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
  parseSecurityRow(columns: string[], row: any[]): MarketData;
  validateDataIntegrity(data: MarketDataResponse): boolean;
}

export interface ChartRenderer {
  render(data: MarketData[], container: HTMLElement): void;
  destroy(): void;
}

export interface TreemapNode {
  children?: TreemapNode[];
  parent?: TreemapNode;
  data: MarketData;
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
  value?: number;
  depth?: number;
}

export interface HierarchyNode extends TreemapNode {
  descendants: () => HierarchyNode[];
  leaves: () => HierarchyNode[];
}

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
  parseSecurityRow(columns: string[], row: any[]): MarketData {
    const data: Record<string, any> = {};
    columns.forEach((col, index) => {
      data[col] = row[index];
    });

    const exchangeValue = data.exchange || "";
    return {
      exchange: exchangeValue
        ? (exchangeValue.toLowerCase() as Exchange)
        : ("" as any),
      country: data.country || "",
      type: data.type || "",
      sector: data.sector || "",
      industry: data.industry || "",
      currencyId: data.currencyId || "",
      ticker: data.ticker || "",
      nameEng: data.nameEng || "",
      nameEngShort: data.nameEngShort || "",
      nameOriginal: data.nameOriginal || "",
      nameOriginalShort: data.nameOriginalShort || "",
      priceOpen: Number(data.priceOpen) || 0,
      priceLastSale: Number(data.priceLastSale) || 0,
      priceChangePct:
        data.priceChangePct === null ? null : Number(data.priceChangePct) || 0,
      volume: Number(data.volume) || 0,
      value: Number(data.value) || 0,
      numTrades: Number(data.numTrades) || 0,
      marketCap: Number(data.marketCap) || 0,
      listedFrom: data.listedFrom || "",
      listedTill: data.listedTill || "",
      wikiPageIdEng: data.wikiPageIdEng || "",
      wikiPageIdOriginal: data.wikiPageIdOriginal || "",
      nestedItemsCount: Number(data.nestedItemsCount) || 0,
    };
  },

  validateDataIntegrity(data: MarketDataResponse): boolean {
    return !!(
      data?.securities?.columns?.length && data?.securities?.data?.length
    );
  },
};

export function parseMarketData(response: MarketDataResponse): MarketData[] {
  if (!dataParser.validateDataIntegrity(response)) {
    return [];
  }

  return response.securities.data.map((row) =>
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
    language !== "en" &&
    language === exchangeLanguage &&
    data.nameOriginalShort
  ) {
    return data.nameOriginalShort;
  }
  return data.nameEng;
}

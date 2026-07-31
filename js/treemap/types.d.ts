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
export declare function isLeafNode(node: any): boolean;
export declare function getNodeData(node: any): MarketData;
export declare function getNodeChange(node: any): number;
export declare const dataParser: DataParser;
export declare function parseMarketData(response: MarketDataResponse): MarketData[];
export declare function getDisplayName(data: MarketData, language: string, exchangeLanguage: string | null): string;
//# sourceMappingURL=types.d.ts.map
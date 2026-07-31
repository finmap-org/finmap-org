import type { MarketData, HierarchyNode } from './types.js';
export declare function buildHierarchy(data: MarketData[]): HierarchyNode;
export declare function getValueForDataType(item: MarketData): number;
export declare function fetchMarketData(signal?: AbortSignal): Promise<MarketData[]>;
//# sourceMappingURL=data.d.ts.map
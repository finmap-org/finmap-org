import type { HistoricalDataResponse, ExchangeRateData, CommodityData } from './types.js';
export { fetchExchangeRates } from '../currency/index.js';
export declare function fetchHistoricalData(signal?: AbortSignal): Promise<HistoricalDataResponse>;
export declare function fetchCommodityData(signal?: AbortSignal): Promise<CommodityData>;
export declare function convertCurrency(data: HistoricalDataResponse, exchangeRates: ExchangeRateData): HistoricalDataResponse;
export declare function calculateTotalValues(data: HistoricalDataResponse, dataType: string): number[];
//# sourceMappingURL=data.d.ts.map
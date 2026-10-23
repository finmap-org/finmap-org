import type { Currency, CurrencyInfo, ExchangeRates } from './types.js';
export declare function getCurrencyInfo(currency: Currency): CurrencyInfo;
export declare function fetchExchangeRates(currency: Currency, signal?: AbortSignal): Promise<ExchangeRates>;
export declare function findRateByDate(rates: ExchangeRates, targetDate: string): number;
export declare function getExchangeRate(fromCurrency: Currency, toCurrency: Currency, date: string, signal?: AbortSignal): Promise<number>;
//# sourceMappingURL=index.d.ts.map
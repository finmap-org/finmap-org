export type Currency = 'USD' | 'RUB' | 'EUR' | 'GBP' | 'TRY' | 'HKD';
export interface CurrencyInfo {
    code: Currency;
    symbol: string;
    name: string;
    position: 'before' | 'after';
}
export type ExchangeRates = Record<string, number>;
//# sourceMappingURL=types.d.ts.map
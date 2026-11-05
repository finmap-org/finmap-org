import type { MarketData } from '../treemap/types.js';
import type { Currency } from './types.js';
import { getConfig, updateConfig, EXCHANGE_INFO } from '../config.js';
import { getExchangeRate } from './index.js';

export async function convertCurrencyValues(
  data: MarketData[],
  fromCurrency: Currency,
  toCurrency: Currency,
  date: string,
): Promise<MarketData[]> {
  const exchangeRate = await getExchangeRate(fromCurrency, toCurrency, date);

  return data.map(item => ({
    ...item,
    value: item.value / exchangeRate,
    marketCap: item.marketCap / exchangeRate,
  }));
}

export function toggleCurrency(): void {
  const config = getConfig();
  const exchangeInfo = EXCHANGE_INFO[config.exchange];
  const nativeCurrency = exchangeInfo?.nativeCurrency || 'USD';
  const newCurrency = config.currency === 'USD' ? nativeCurrency : 'USD';

  updateConfig({ currency: newCurrency });
}

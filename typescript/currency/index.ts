import type { Currency, CurrencyInfo, ExchangeRates } from './types.js';

const CURRENCY_INFO: Record<Currency, CurrencyInfo> = {
  USD: { symbol: '$', name: 'US Dollar', code: 'USD', position: 'before' },
  RUB: { symbol: '₽', name: 'Russian Ruble', code: 'RUB', position: 'after' },
  EUR: { symbol: '€', name: 'Euro', code: 'EUR', position: 'before' },
  GBP: { symbol: '£', name: 'British Pound', code: 'GBP', position: 'before' },
  TRY: { symbol: '₺', name: 'Turkish Lira', code: 'TRY', position: 'after' },
  HKD: {
    symbol: 'HK$',
    name: 'Hong Kong dollar',
    code: 'HKD',
    position: 'before',
  },
};

const ratesCache = new Map<Currency, { rates: ExchangeRates; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour

export function getCurrencyInfo(currency: Currency): CurrencyInfo {
  return CURRENCY_INFO[currency] || CURRENCY_INFO.USD;
}

export async function fetchExchangeRates(
  currency: Currency,
  signal?: AbortSignal,
): Promise<ExchangeRates> {
  if (currency === 'USD') return {};

  // Check cache first
  const cached = ratesCache.get(currency);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rates;
  }

  const url = `https://raw.githubusercontent.com/finmap-org/data-currency/refs/heads/main/marketdata/${currency}perUSD.json?_=${new Date().toISOString().split('T')[0]}`;

  try {
    const response = await fetch(url, signal ? { signal } : undefined);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rates: ExchangeRates = await response.json();

    // Cache the result
    ratesCache.set(currency, { rates, timestamp: Date.now() });
    return rates;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw error;
    }
    console.warn(`Failed to fetch exchange rates for ${currency}:`, error);
    return {};
  }
}

export function findRateByDate(rates: ExchangeRates, targetDate: string): number {
  const normalizedDate = targetDate.replace(/\//g, '-');
  const directRate = rates[normalizedDate] || rates[targetDate];
  if (directRate !== undefined && directRate > 0) return directRate;

  // Use UTC date arithmetic to avoid timezone offset day shifts
  const [yearStr, monthStr, dayStr] = normalizedDate.split('-');
  if (!yearStr || !monthStr || !dayStr) return 1;

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return 1;

  const date = new Date(Date.UTC(year, month, day));

  for (let i = 1; i <= 14; i++) {
    date.setUTCDate(date.getUTCDate() - 1);
    const fallbackDate = date.toISOString().split('T')[0];
    if (fallbackDate && rates[fallbackDate] && rates[fallbackDate] > 0) {
      return rates[fallbackDate];
    }
  }

  return 1;
}

export async function getExchangeRate(
  fromCurrency: Currency,
  toCurrency: Currency,
  date: string,
  signal?: AbortSignal,
): Promise<number> {
  if (fromCurrency === toCurrency) return 1;

  // Handle USD as base currency
  if (fromCurrency === 'USD') {
    const rates = await fetchExchangeRates(toCurrency, signal);
    const rate = findRateByDate(rates, date);
    return rate > 0 ? 1 / rate : 1;
  }

  if (toCurrency === 'USD') {
    const rates = await fetchExchangeRates(fromCurrency, signal);
    const rate = findRateByDate(rates, date);
    return rate > 0 ? rate : 1;
  }

  // Cross currency conversion via USD
  const fromToUsdRate = await getExchangeRate(fromCurrency, 'USD', date, signal);
  const usdToTargetRate = await getExchangeRate('USD', toCurrency, date, signal);
  return fromToUsdRate * usdToTargetRate;
}

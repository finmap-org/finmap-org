import type { Currency, CurrencyInfo, ExchangeRates } from "./types.js";

const CURRENCY_INFO: Record<Currency, CurrencyInfo> = {
  USD: { symbol: "$", name: "US Dollar", code: "USD", position: "before" },
  RUB: { symbol: "₽", name: "Russian Ruble", code: "RUB", position: "after" },
  EUR: { symbol: "€", name: "Euro", code: "EUR", position: "before" },
  GBP: { symbol: "£", name: "British Pound", code: "GBP", position: "before" },
  TRY: { symbol: "₺", name: "Turkish Lira", code: "TRY", position: "after" },
  HKD: {
    symbol: "HK$",
    name: "Hong Kong dollar",
    code: "HKD",
    position: "before",
  },
};

const ratesCache = new Map<
  Currency,
  { rates: ExchangeRates; timestamp: number }
>();
const CACHE_TTL = 3600000; // 1 hour

export function getCurrencyInfo(currency: Currency): CurrencyInfo {
  return CURRENCY_INFO[currency] || CURRENCY_INFO.USD;
}

export async function fetchExchangeRates(
  currency: Currency,
): Promise<ExchangeRates> {
  if (currency === "USD") return {};

  // Check cache first
  const cached = ratesCache.get(currency);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rates;
  }

  const url = `https://raw.githubusercontent.com/finmap-org/data-currency/refs/heads/main/marketdata/${currency}perUSD.json?_=${new Date().toISOString().split("T")[0]}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rates: ExchangeRates = await response.json();

    // Cache the result
    ratesCache.set(currency, { rates, timestamp: Date.now() });
    return rates;
  } catch (error) {
    console.warn(`Failed to fetch exchange rates for ${currency}:`, error);
    return {};
  }
}

export function findRateByDate(
  rates: ExchangeRates,
  targetDate: string,
): number {
  if (rates[targetDate]) return rates[targetDate];

  // Simple fallback - look for recent rates
  const date = new Date(targetDate);
  for (let i = 1; i <= 14; i++) {
    date.setDate(date.getDate() - 1);
    const fallbackDate = date.toISOString().split("T")[0];
    if (fallbackDate && rates[fallbackDate]) {
      return rates[fallbackDate];
    }
  }

  return 1;
}

export async function getExchangeRate(
  fromCurrency: Currency,
  toCurrency: Currency,
  date: string,
): Promise<number> {
  if (fromCurrency === toCurrency) return 1;

  // Handle USD as base currency
  if (fromCurrency === "USD") {
    const rates = await fetchExchangeRates(toCurrency);
    return 1 / findRateByDate(rates, date);
  }

  if (toCurrency === "USD") {
    const rates = await fetchExchangeRates(fromCurrency);
    return findRateByDate(rates, date);
  }

  // Cross currency conversion via USD
  const fromToUsdRate = await getExchangeRate(fromCurrency, "USD", date);
  const usdToTargetRate = await getExchangeRate("USD", toCurrency, date);
  return fromToUsdRate * usdToTargetRate;
}

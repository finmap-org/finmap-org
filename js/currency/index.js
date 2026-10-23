const CURRENCY_INFO = {
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
const ratesCache = new Map();
const CACHE_TTL = 3600000; // 1 hour
export function getCurrencyInfo(currency) {
    return CURRENCY_INFO[currency] || CURRENCY_INFO.USD;
}
import { DataService } from '../services/api.js';
export async function fetchExchangeRates(currency, signal) {
    if (currency === 'USD')
        return {};
    const url = `https://raw.githubusercontent.com/finmap-org/data-currency/refs/heads/main/marketdata/${currency}perUSD.json?_=${new Date().toISOString().split('T')[0]}`;
    try {
        return await DataService.fetchJson(url, signal, CACHE_TTL);
    }
    catch (error) {
        if (error?.name === 'AbortError') {
            throw error;
        }
        console.warn(`Failed to fetch exchange rates for ${currency}:`, error);
        return {};
    }
}
export function findRateByDate(rates, targetDate) {
    const normalizedDate = targetDate.replace(/\//g, '-');
    const directRate = rates[normalizedDate] || rates[targetDate];
    if (directRate !== undefined && directRate > 0)
        return directRate;
    // Use UTC date arithmetic to avoid timezone offset day shifts
    const [yearStr, monthStr, dayStr] = normalizedDate.split('-');
    if (!yearStr || !monthStr || !dayStr)
        return 1;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    if (isNaN(year) || isNaN(month) || isNaN(day))
        return 1;
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
export async function getExchangeRate(fromCurrency, toCurrency, date, signal) {
    if (fromCurrency === toCurrency)
        return 1;
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
//# sourceMappingURL=index.js.map
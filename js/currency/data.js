import { getConfig, updateConfig, EXCHANGE_INFO } from '../config.js';
import { getExchangeRate } from './index.js';
export async function convertCurrencyValues(data, fromCurrency, toCurrency, date) {
    const exchangeRate = await getExchangeRate(fromCurrency, toCurrency, date);
    return data.map(item => ({
        ...item,
        value: item.value / exchangeRate,
        marketCap: item.marketCap / exchangeRate,
    }));
}
export function toggleCurrency() {
    const config = getConfig();
    const exchangeInfo = EXCHANGE_INFO[config.exchange];
    const nativeCurrency = exchangeInfo?.nativeCurrency || 'USD';
    const newCurrency = config.currency === 'USD' ? nativeCurrency : 'USD';
    updateConfig({ currency: newCurrency });
}
//# sourceMappingURL=data.js.map
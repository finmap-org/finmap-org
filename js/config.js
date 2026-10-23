export const EXCHANGE_INFO = {
    'nasdaq': {
        nativeCurrency: 'USD',
        dataRepo: 'data-us',
        minDate: '2024-12-09',
        maxDate: null,
        marketOpenHour: 5,
        updateFrequencyMinutes: 60,
        region: 'us',
        language: 'en',
    },
    'nyse': {
        nativeCurrency: 'USD',
        dataRepo: 'data-us',
        minDate: '2024-12-09',
        maxDate: null,
        marketOpenHour: 5,
        updateFrequencyMinutes: 60,
        region: 'us',
        language: 'en',
    },
    'amex': {
        nativeCurrency: 'USD',
        dataRepo: 'data-us',
        minDate: '2024-12-09',
        maxDate: null,
        marketOpenHour: 5,
        updateFrequencyMinutes: 60,
        region: 'us',
        language: 'en',
    },
    'us-all': {
        nativeCurrency: 'USD',
        dataRepo: 'data-us',
        minDate: '2024-12-09',
        maxDate: null,
        marketOpenHour: 5,
        updateFrequencyMinutes: 60,
        region: 'us',
        language: 'en',
    },
    'moex': {
        nativeCurrency: 'RUB',
        dataRepo: 'data-russia',
        minDate: '2011-12-19',
        maxDate: null,
        marketOpenHour: 8,
        updateFrequencyMinutes: 15,
        region: 'russia',
        language: 'ru',
    },
    'lse': {
        nativeCurrency: 'GBP',
        dataRepo: 'data-uk',
        minDate: '2025-02-07',
        maxDate: null,
        marketOpenHour: 5,
        updateFrequencyMinutes: 60,
        region: 'uk',
        language: 'en',
    },
    'bist': {
        nativeCurrency: 'TRY',
        dataRepo: 'data-turkey',
        minDate: '2015-11-30',
        maxDate: '2025-05-30',
        marketOpenHour: 8,
        updateFrequencyMinutes: 86400,
        region: 'turkey',
        language: 'tr',
    },
    'hkex': {
        nativeCurrency: 'HKD',
        dataRepo: 'data-hongkong',
        minDate: '2025-09-29',
        maxDate: null,
        marketOpenHour: 2,
        updateFrequencyMinutes: 30,
        region: 'hongkong',
        language: 'cn',
    },
};
export function getExchangeInfo(exchange) {
    return EXCHANGE_INFO[exchange];
}
function calculateLatestAvailableDate(exchange) {
    const exchangeInfo = EXCHANGE_INFO[exchange];
    if (exchangeInfo.maxDate) {
        return exchangeInfo.maxDate;
    }
    let date = new Date();
    if (date.getUTCHours() < exchangeInfo.marketOpenHour) {
        date.setUTCDate(date.getUTCDate() - 1);
    }
    switch (exchange) {
        case 'nasdaq':
        case 'nyse':
        case 'amex':
        case 'us-all':
            date.setUTCDate(date.getUTCDate() - 1);
            break;
        default:
            break;
    }
    // Skip weekends
    while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
        date.setUTCDate(date.getUTCDate() - 1);
    }
    return date.toISOString().split('T')[0];
}
export function getDateRange(exchange) {
    const exchangeInfo = EXCHANGE_INFO[exchange];
    return {
        min: exchangeInfo.minDate,
        max: calculateLatestAvailableDate(exchange),
    };
}
export function getFallbackDate(requestedDateStr, exchange) {
    const latestDateStr = calculateLatestAvailableDate(exchange);
    const requestedDate = new Date(requestedDateStr.replace(/\//g, '-'));
    const latestDate = new Date(latestDateStr);
    if (requestedDate > latestDate) {
        return latestDateStr.replace(/-/g, '/');
    }
    const date = new Date(requestedDate);
    do {
        date.setUTCDate(date.getUTCDate() - 1);
    } while (date.getUTCDay() === 0 || date.getUTCDay() === 6);
    const prevDateStr = date.toISOString().split('T')[0];
    const minDateStr = EXCHANGE_INFO[exchange].minDate;
    if (minDateStr && prevDateStr < minDateStr) {
        return latestDateStr.replace(/-/g, '/');
    }
    return prevDateStr.replace(/-/g, '/');
}
export const defaultConfig = {
    exchange: 'nasdaq',
    chartType: 'treemap',
    dataType: 'marketcap',
    date: calculateLatestAvailableDate('nasdaq').replace(/-/g, '/'),
    currency: 'USD',
    currencyExchangeRate: 1.0,
    language: 'en',
};
export let appConfig = { ...defaultConfig };
export function toggleLanguage() {
    const exchangeInfo = EXCHANGE_INFO[appConfig.exchange];
    const nativeLanguage = exchangeInfo.language;
    if (nativeLanguage === 'en') {
        return;
    }
    const newLanguage = appConfig.language === 'en' ? nativeLanguage : 'en';
    updateConfig({ language: newLanguage });
}
const listeners = new Set();
export function onConfigChange(listener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}
export function updateConfig(updates) {
    const previousConfig = { ...appConfig };
    appConfig = { ...appConfig, ...updates };
    if (updates.exchange) {
        const exchangeInfo = EXCHANGE_INFO[updates.exchange];
        if (exchangeInfo) {
            if (!updates.currency) {
                appConfig.currency = exchangeInfo.nativeCurrency;
            }
            if (!updates.date) {
                const latestDate = calculateLatestAvailableDate(updates.exchange);
                appConfig.date = latestDate.replace(/-/g, '/');
            }
        }
    }
    const changedKeys = Object.keys(appConfig).filter(key => appConfig[key] !== previousConfig[key]);
    if (changedKeys.length > 0) {
        saveConfigToURL();
        listeners.forEach(listener => listener(appConfig, changedKeys));
    }
}
export function getConfig() {
    return appConfig;
}
export function loadConfigFromURL() {
    const params = new URLSearchParams(window.location.search);
    const urlConfig = {};
    const exchange = params.get('exchange');
    if (exchange && exchange in EXCHANGE_INFO) {
        urlConfig.exchange = exchange;
    }
    const chart = params.get('chart');
    if (chart && ['treemap', 'histogram'].includes(chart)) {
        urlConfig.chartType = chart;
    }
    const data = params.get('data');
    if (data && ['marketcap', 'value', 'trades', 'nestedItems'].includes(data)) {
        urlConfig.dataType = data;
    }
    const date = params.get('date');
    if (date) {
        urlConfig.date = date;
    }
    const currency = params.get('currency');
    if (currency && ['USD', 'RUB', 'GBP', 'TRY', 'HKD', 'EUR', 'CNY'].includes(currency)) {
        urlConfig.currency = currency;
    }
    const lang = params.get('lang');
    if (lang && ['en', 'ru', 'tr', 'cn'].includes(lang)) {
        urlConfig.language = lang;
    }
    if (!params.has('currency')) {
        const targetExchange = urlConfig.exchange || defaultConfig.exchange;
        const exchangeInfo = EXCHANGE_INFO[targetExchange];
        if (exchangeInfo) {
            urlConfig.currency = exchangeInfo.nativeCurrency;
        }
    }
    updateConfig(urlConfig);
}
export function saveConfigToURL() {
    const params = new URLSearchParams();
    params.set('exchange', appConfig.exchange);
    params.set('chart', appConfig.chartType);
    params.set('data', appConfig.dataType);
    params.set('date', appConfig.date);
    params.set('currency', appConfig.currency);
    params.set('lang', appConfig.language);
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newURL);
}
//# sourceMappingURL=config.js.map
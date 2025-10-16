import type { AppConfig } from "./types.js";

export const EXCHANGE_INFO = {
  nasdaq: {
    nativeCurrency: "USD" as const,
    dataRepo: "data-us",
    minDate: "2024-12-09",
    maxDate: null,
    marketOpenHour: 10,
    updateFrequencyMinutes: 60,
    region: "us",
    language: "en",
  },
  nyse: {
    nativeCurrency: "USD" as const,
    dataRepo: "data-us",
    minDate: "2024-12-09",
    maxDate: null,
    marketOpenHour: 10,
    updateFrequencyMinutes: 60,
    region: "us",
    language: "en",
  },
  amex: {
    nativeCurrency: "USD" as const,
    dataRepo: "data-us",
    minDate: "2024-12-09",
    maxDate: null,
    marketOpenHour: 10,
    updateFrequencyMinutes: 60,
    region: "us",
    language: "en",
  },
  "us-all": {
    nativeCurrency: "USD" as const,
    dataRepo: "data-us",
    minDate: "2024-12-09",
    maxDate: null,
    marketOpenHour: 10,
    updateFrequencyMinutes: 60,
    region: "us",
    language: "en",
  },
  moex: {
    nativeCurrency: "RUB" as const,
    dataRepo: "data-russia",
    minDate: "2011-12-19",
    maxDate: null,
    marketOpenHour: 8,
    updateFrequencyMinutes: 15,
    region: "russia",
    language: "ru",
  },
  lse: {
    nativeCurrency: "GBP" as const,
    dataRepo: "data-uk",
    minDate: "2025-02-07",
    maxDate: null,
    marketOpenHour: 5,
    updateFrequencyMinutes: 60,
    region: "uk",
    language: "en",
  },
  bist: {
    nativeCurrency: "TRY" as const,
    dataRepo: "data-turkey",
    minDate: "2015-11-30",
    maxDate: "2025-05-30",
    marketOpenHour: 8,
    updateFrequencyMinutes: 86400,
    region: "turkey",
    language: "tr",
  },
  hkex: {
    nativeCurrency: "HKD" as const,
    dataRepo: "data-hongkong",
    minDate: "2025-09-29",
    maxDate: null,
    marketOpenHour: 2,
    updateFrequencyMinutes: 30,
    region: "hongkong",
    language: "cn",
  },
} as const;

export function getExchangeInfo(exchange: keyof typeof EXCHANGE_INFO) {
  return EXCHANGE_INFO[exchange];
}

function calculateLatestAvailableDate(
  exchange: keyof typeof EXCHANGE_INFO,
): string {
  const exchangeInfo = EXCHANGE_INFO[exchange];

  if (exchangeInfo.maxDate) {
    return exchangeInfo.maxDate;
  }

  let date: Date;
  switch (exchange) {
    case "nasdaq":
    case "nyse":
    case "amex":
    case "us-all":
      date = new Date(new Date().setDate(new Date().getDate() - 1));
      break;
    default:
      date = new Date();
      // If current time is before market open, use previous day
      if (date.getUTCHours() < exchangeInfo.marketOpenHour) {
        date.setUTCDate(date.getUTCDate() - 1);
      }
      break;
  }

  // Skip weekends
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6) {
    date.setUTCDate(date.getUTCDate() - 1);
  }

  return date.toISOString().split("T")[0]!;
}

export function getDateRange(exchange: keyof typeof EXCHANGE_INFO): {
  min: string;
  max: string;
} {
  const exchangeInfo = EXCHANGE_INFO[exchange];
  return {
    min: exchangeInfo.minDate,
    max: calculateLatestAvailableDate(exchange),
  };
}

export const defaultConfig: AppConfig = {
  exchange: "nasdaq",
  chartType: "treemap",
  dataType: "marketcap",
  date: calculateLatestAvailableDate("nasdaq").replace(/-/g, "/"),
  currency: "USD",
  language: "en",
};

export let appConfig: AppConfig = { ...defaultConfig };

export function toggleLanguage(): void {
  const exchangeInfo = EXCHANGE_INFO[appConfig.exchange];
  const nativeLanguage = exchangeInfo.language;

  if (nativeLanguage === "en") {
    return;
  }

  const newLanguage = appConfig.language === "en" ? nativeLanguage : "en";
  updateConfig({ language: newLanguage });
}

export function updateConfig(updates: Partial<AppConfig>): void {
  appConfig = { ...appConfig, ...updates };

  if (updates.exchange) {
    const exchangeInfo = EXCHANGE_INFO[updates.exchange];
    if (exchangeInfo) {
      if (
        appConfig.currency !== "USD" &&
        appConfig.currency !== exchangeInfo.nativeCurrency
      ) {
        appConfig.currency = exchangeInfo.nativeCurrency;
      }

      if (!updates.date) {
        const latestDate = calculateLatestAvailableDate(updates.exchange);
        appConfig.date = latestDate.replace(/-/g, "/");
      }
    }
  }
}

export function getConfig(): Readonly<AppConfig> {
  return appConfig;
}

export function loadConfigFromURL(): void {
  const params = new URLSearchParams(window.location.search);
  const urlConfig: Partial<AppConfig> = {};

  if (params.has("exchange"))
    urlConfig.exchange = params.get("exchange") as any;
  if (params.has("chart")) urlConfig.chartType = params.get("chart") as any;
  if (params.has("data")) urlConfig.dataType = params.get("data") as any;
  if (params.has("date")) urlConfig.date = params.get("date")!;
  if (params.has("currency"))
    urlConfig.currency = params.get("currency") as any;
  if (params.has("lang")) urlConfig.language = params.get("lang") as any;

  updateConfig(urlConfig);
}

export function saveConfigToURL(): void {
  const params = new URLSearchParams();
  params.set("exchange", appConfig.exchange);
  params.set("chart", appConfig.chartType);
  params.set("data", appConfig.dataType);
  params.set("date", appConfig.date);
  params.set("currency", appConfig.currency);
  params.set("lang", appConfig.language);

  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({}, "", newURL);
}

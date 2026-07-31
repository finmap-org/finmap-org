import type { AppConfig } from './types.js';
export declare const EXCHANGE_INFO: {
    readonly nasdaq: {
        readonly nativeCurrency: "USD";
        readonly dataRepo: "data-us";
        readonly minDate: "2024-12-09";
        readonly maxDate: null;
        readonly marketOpenHour: 5;
        readonly updateFrequencyMinutes: 60;
        readonly region: "us";
        readonly language: "en";
    };
    readonly nyse: {
        readonly nativeCurrency: "USD";
        readonly dataRepo: "data-us";
        readonly minDate: "2024-12-09";
        readonly maxDate: null;
        readonly marketOpenHour: 5;
        readonly updateFrequencyMinutes: 60;
        readonly region: "us";
        readonly language: "en";
    };
    readonly amex: {
        readonly nativeCurrency: "USD";
        readonly dataRepo: "data-us";
        readonly minDate: "2024-12-09";
        readonly maxDate: null;
        readonly marketOpenHour: 5;
        readonly updateFrequencyMinutes: 60;
        readonly region: "us";
        readonly language: "en";
    };
    readonly 'us-all': {
        readonly nativeCurrency: "USD";
        readonly dataRepo: "data-us";
        readonly minDate: "2024-12-09";
        readonly maxDate: null;
        readonly marketOpenHour: 5;
        readonly updateFrequencyMinutes: 60;
        readonly region: "us";
        readonly language: "en";
    };
    readonly moex: {
        readonly nativeCurrency: "RUB";
        readonly dataRepo: "data-russia";
        readonly minDate: "2011-12-19";
        readonly maxDate: null;
        readonly marketOpenHour: 8;
        readonly updateFrequencyMinutes: 15;
        readonly region: "russia";
        readonly language: "ru";
    };
    readonly lse: {
        readonly nativeCurrency: "GBP";
        readonly dataRepo: "data-uk";
        readonly minDate: "2025-02-07";
        readonly maxDate: null;
        readonly marketOpenHour: 5;
        readonly updateFrequencyMinutes: 60;
        readonly region: "uk";
        readonly language: "en";
    };
    readonly bist: {
        readonly nativeCurrency: "TRY";
        readonly dataRepo: "data-turkey";
        readonly minDate: "2015-11-30";
        readonly maxDate: "2025-05-30";
        readonly marketOpenHour: 8;
        readonly updateFrequencyMinutes: 86400;
        readonly region: "turkey";
        readonly language: "tr";
    };
    readonly hkex: {
        readonly nativeCurrency: "HKD";
        readonly dataRepo: "data-hongkong";
        readonly minDate: "2025-09-29";
        readonly maxDate: null;
        readonly marketOpenHour: 2;
        readonly updateFrequencyMinutes: 30;
        readonly region: "hongkong";
        readonly language: "cn";
    };
};
export declare function getExchangeInfo(exchange: keyof typeof EXCHANGE_INFO): {
    readonly nativeCurrency: "USD";
    readonly dataRepo: "data-us";
    readonly minDate: "2024-12-09";
    readonly maxDate: null;
    readonly marketOpenHour: 5;
    readonly updateFrequencyMinutes: 60;
    readonly region: "us";
    readonly language: "en";
} | {
    readonly nativeCurrency: "USD";
    readonly dataRepo: "data-us";
    readonly minDate: "2024-12-09";
    readonly maxDate: null;
    readonly marketOpenHour: 5;
    readonly updateFrequencyMinutes: 60;
    readonly region: "us";
    readonly language: "en";
} | {
    readonly nativeCurrency: "USD";
    readonly dataRepo: "data-us";
    readonly minDate: "2024-12-09";
    readonly maxDate: null;
    readonly marketOpenHour: 5;
    readonly updateFrequencyMinutes: 60;
    readonly region: "us";
    readonly language: "en";
} | {
    readonly nativeCurrency: "USD";
    readonly dataRepo: "data-us";
    readonly minDate: "2024-12-09";
    readonly maxDate: null;
    readonly marketOpenHour: 5;
    readonly updateFrequencyMinutes: 60;
    readonly region: "us";
    readonly language: "en";
} | {
    readonly nativeCurrency: "RUB";
    readonly dataRepo: "data-russia";
    readonly minDate: "2011-12-19";
    readonly maxDate: null;
    readonly marketOpenHour: 8;
    readonly updateFrequencyMinutes: 15;
    readonly region: "russia";
    readonly language: "ru";
} | {
    readonly nativeCurrency: "GBP";
    readonly dataRepo: "data-uk";
    readonly minDate: "2025-02-07";
    readonly maxDate: null;
    readonly marketOpenHour: 5;
    readonly updateFrequencyMinutes: 60;
    readonly region: "uk";
    readonly language: "en";
} | {
    readonly nativeCurrency: "TRY";
    readonly dataRepo: "data-turkey";
    readonly minDate: "2015-11-30";
    readonly maxDate: "2025-05-30";
    readonly marketOpenHour: 8;
    readonly updateFrequencyMinutes: 86400;
    readonly region: "turkey";
    readonly language: "tr";
} | {
    readonly nativeCurrency: "HKD";
    readonly dataRepo: "data-hongkong";
    readonly minDate: "2025-09-29";
    readonly maxDate: null;
    readonly marketOpenHour: 2;
    readonly updateFrequencyMinutes: 30;
    readonly region: "hongkong";
    readonly language: "cn";
};
export declare function getDateRange(exchange: keyof typeof EXCHANGE_INFO): {
    min: string;
    max: string;
};
export declare function getFallbackDate(requestedDateStr: string, exchange: keyof typeof EXCHANGE_INFO): string;
export declare const defaultConfig: AppConfig;
export declare let appConfig: AppConfig;
export declare function toggleLanguage(): void;
export type ConfigChangeListener = (config: Readonly<AppConfig>, changedKeys: (keyof AppConfig)[]) => void;
export declare function onConfigChange(listener: ConfigChangeListener): () => void;
export declare function updateConfig(updates: Partial<AppConfig>): void;
export declare function getConfig(): Readonly<AppConfig>;
export declare function loadConfigFromURL(): void;
export declare function saveConfigToURL(): void;
//# sourceMappingURL=config.d.ts.map
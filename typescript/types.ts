import type { Currency } from "./currency/types.js";

export type Exchange =
  | "nasdaq"
  | "nyse"
  | "amex"
  | "us-all"
  | "moex"
  | "lse"
  | "bist"
  | "hkex";
export type ChartType = "treemap" | "histogram";
export type DataType = "marketcap" | "value" | "trades" | "nestedItems";
export type Language = "en" | "ru" | "tr" | "cn";

export interface AppConfig {
  exchange: Exchange;
  chartType: ChartType;
  dataType: DataType;
  date: string;
  currency: Currency;
  language: Language;
}

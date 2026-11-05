export interface HistoricalDataResponse {
    dates: string[];
    sectors: HistoricalSector[];
}
export interface HistoricalSector {
    sectorName: string;
    itemsNumber: number[];
    marketCap: number[];
    value: number[];
    volume: number[];
    priceChangePct: number[];
    tradesNumber: number[];
}
export interface ExchangeRateData {
    [date: string]: number;
}
export interface CommodityData {
    [date: string]: number;
}
export interface PlotlyTrace {
    name: string;
    x: string[];
    y: number[];
    customdata?: number[];
    type: 'scatter' | 'line';
    fill?: string;
    fillcolor?: string;
    mode?: string;
    stackgroup?: string;
    connectgaps?: boolean;
    hoverinfo?: string;
    hovertemplate?: string;
    yaxis?: string;
    visible?: boolean | 'legendonly';
    showlegend?: boolean;
    line?: {
        dash?: string;
        width?: number;
        color?: string;
    };
    marker?: {
        color?: string;
        size?: number;
    };
}
export interface ChartRenderer {
    render(data: any[], container: HTMLElement): void;
    destroy(): void;
}
//# sourceMappingURL=types.d.ts.map
import type { ChartRenderer } from './types.js';
export declare class HistogramChart implements ChartRenderer {
    private container;
    private plotElement;
    private chartData;
    private isFirstRender;
    private fetchController;
    render(_: any[], container: HTMLElement): void;
    destroy(): void;
    private setupContainer;
    private loadAndRenderChart;
    private renderChart;
    private showError;
}
//# sourceMappingURL=index.d.ts.map
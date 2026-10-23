import type { MarketData } from './types.js';
export declare class PathbarComponent {
    private element;
    create(container: HTMLElement): HTMLElement;
    update(path: any[], callbacks: {
        onDrill: (node: any) => void;
        onShowTooltip: (data: MarketData, event: MouseEvent, node?: any) => void;
        onHideTooltip: () => void;
    }): void;
}
//# sourceMappingURL=pathbar.d.ts.map
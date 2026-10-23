import type { MarketData } from './types.js';
interface InteractionCallbacks {
    onDrill: (node: any) => void;
    onShowCompany: (data: MarketData) => void;
    onShowTooltip: (data: MarketData, event: MouseEvent, node?: any) => void;
    onHideTooltip: () => void;
    onNodeAtPosition: (event: MouseEvent) => any;
    isTransitioning: () => boolean;
}
export declare class InteractionHandler {
    private canvas;
    private callbacks;
    private eventListeners;
    private lastHoveredNode;
    init(canvas: HTMLCanvasElement, callbacks: InteractionCallbacks): void;
    private setupEventListeners;
    private createClickHandler;
    private createMouseMoveHandler;
    private createMouseEnterHandler;
    private createMouseLeaveHandler;
    private registerListener;
    destroy(): void;
}
export {};
//# sourceMappingURL=interactions.d.ts.map
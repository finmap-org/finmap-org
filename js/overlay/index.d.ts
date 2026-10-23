import { type MarketData } from '../treemap/types.js';
export declare class OverlayComponent {
    private static instance;
    private overlay;
    private currentTab;
    private currentData;
    private fetchController;
    private eventListeners;
    constructor();
    static getInstance(): OverlayComponent;
    show(data: MarketData): void;
    private abortFetch;
    private setupEventListeners;
    private addEventListenerWithCleanup;
    private removeEventListener;
    private populate;
    private switchTab;
    private loadTabContent;
    private loadNewsContent;
    private loadInfoContent;
    private loadBuyContent;
    private showOverlay;
    private hide;
    destroy(): void;
    static destroyInstance(): void;
}
//# sourceMappingURL=index.d.ts.map
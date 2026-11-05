import type { MarketData } from './types.js';
export declare class TooltipComponent {
    private element;
    private isVisible;
    private currentData;
    private isFollowing;
    private isSticky;
    private rafId;
    private pendingMouseEvent;
    private container;
    private hideTimeout;
    init(container?: HTMLElement): void;
    private createElement;
    private setupEventListeners;
    private handleRightClick;
    private handleClick;
    private handleMouseMove;
    private startFollowing;
    private stopFollowing;
    show(data: MarketData, event: MouseEvent, node?: any): void;
    showSticky(data: MarketData, event: MouseEvent, node?: any): void;
    private showElement;
    private updateTooltipContent;
    private populateTooltipData;
    private position;
    hide(): void;
    destroy(): void;
}
//# sourceMappingURL=tooltip.d.ts.map
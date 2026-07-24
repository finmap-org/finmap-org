import { TRANSITIONS } from "./constants.js";
import { isLeafNode, getNodeData } from "./types.js";
import type { MarketData } from "./types.js";

declare const d3: any;

interface InteractionCallbacks {
  onDrill: (node: any) => void;
  onShowCompany: (data: MarketData) => void;
  onShowTooltip: (data: MarketData, event: MouseEvent, node?: any) => void;
  onHideTooltip: () => void;
  onNodeAtPosition: (event: MouseEvent) => any;
  isTransitioning: () => boolean;
}

export class InteractionHandler {
  private canvas: HTMLCanvasElement | null = null;
  private callbacks: InteractionCallbacks | null = null;
  private eventListeners: Map<string, EventListener> = new Map();
  private lastHoveredNode: any = null;

  init(canvas: HTMLCanvasElement, callbacks: InteractionCallbacks): void {
    this.destroy();
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.canvas || !this.callbacks) return;

    const canvasSelection = d3.select(this.canvas);

    const clickHandler = this.createClickHandler();
    const mouseMoveHandler = this.createMouseMoveHandler(canvasSelection);
    const mouseEnterHandler = this.createMouseEnterHandler(canvasSelection);
    const mouseLeaveHandler = this.createMouseLeaveHandler(canvasSelection);

    this.registerListener("click", clickHandler);
    this.registerListener("mousemove", mouseMoveHandler);
    this.registerListener("mouseenter", mouseEnterHandler);
    this.registerListener("mouseleave", mouseLeaveHandler);
  }

  private createClickHandler() {
    return (event: Event) => {
      if (!this.callbacks) return;
      const mouseEvent = event as MouseEvent;
      if (this.callbacks.isTransitioning()) return;

      const node = this.callbacks.onNodeAtPosition(mouseEvent);
      if (!node) return;

      const isLeaf = isLeafNode(node);
      const data = getNodeData(node);

      if (isLeaf) {
        this.callbacks.onShowCompany(data);
      } else {
        this.callbacks.onDrill(node);
      }
    };
  }

  private createMouseMoveHandler(canvasSelection: any) {
    return (event: Event) => {
      if (!this.callbacks) return;
      const mouseEvent = event as MouseEvent;
      if (this.callbacks.isTransitioning()) return;

      const node = this.callbacks.onNodeAtPosition(mouseEvent);

      // Optimize: only update if node changed
      if (node === this.lastHoveredNode) return;
      this.lastHoveredNode = node;

      if (!node) {
        this.callbacks.onHideTooltip();
        canvasSelection.style("cursor", "default");
        return;
      }

      const data = getNodeData(node);
      this.callbacks.onShowTooltip(data, mouseEvent, node);
      canvasSelection.style("cursor", "pointer");
    };
  }

  private createMouseEnterHandler(canvasSelection: any) {
    return () => {
      if (this.callbacks && !this.callbacks.isTransitioning()) {
        canvasSelection
          .transition()
          .duration(TRANSITIONS.HOVER)
          .style("filter", "brightness(1.05)");
      }
    };
  }

  private createMouseLeaveHandler(canvasSelection: any) {
    return () => {
      this.lastHoveredNode = null;
      canvasSelection
        .transition()
        .duration(TRANSITIONS.HOVER)
        .style("filter", "brightness(1)")
        .style("cursor", "default");
      if (this.callbacks) {
        this.callbacks.onHideTooltip();
      }
    };
  }

  private registerListener(eventType: string, handler: EventListener): void {
    if (!this.canvas) return;
    this.eventListeners.set(eventType, handler);
    this.canvas.addEventListener(eventType, handler);
  }

  destroy(): void {
    if (this.canvas) {
      this.eventListeners.forEach((listener, eventType) => {
        this.canvas!.removeEventListener(eventType, listener);
      });
      this.eventListeners.clear();
    }
  }
}

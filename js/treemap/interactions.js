import { TRANSITIONS } from './constants.js';
import { isLeafNode, getNodeData } from './types.js';
export class InteractionHandler {
    canvas = null;
    callbacks = null;
    eventListeners = new Map();
    lastHoveredNode = null;
    init(canvas, callbacks) {
        this.destroy();
        this.canvas = canvas;
        this.callbacks = callbacks;
        this.setupEventListeners();
    }
    setupEventListeners() {
        if (!this.canvas || !this.callbacks)
            return;
        const canvasSelection = d3.select(this.canvas);
        const clickHandler = this.createClickHandler();
        const mouseMoveHandler = this.createMouseMoveHandler(canvasSelection);
        const mouseEnterHandler = this.createMouseEnterHandler(canvasSelection);
        const mouseLeaveHandler = this.createMouseLeaveHandler(canvasSelection);
        this.registerListener('click', clickHandler);
        this.registerListener('mousemove', mouseMoveHandler);
        this.registerListener('mouseenter', mouseEnterHandler);
        this.registerListener('mouseleave', mouseLeaveHandler);
    }
    createClickHandler() {
        return (event) => {
            if (!this.callbacks)
                return;
            const mouseEvent = event;
            if (this.callbacks.isTransitioning())
                return;
            const node = this.callbacks.onNodeAtPosition(mouseEvent);
            if (!node)
                return;
            const isLeaf = isLeafNode(node);
            const data = getNodeData(node);
            if (isLeaf) {
                this.callbacks.onShowCompany(data);
            }
            else {
                this.callbacks.onDrill(node);
            }
        };
    }
    createMouseMoveHandler(canvasSelection) {
        return (event) => {
            if (!this.callbacks)
                return;
            const mouseEvent = event;
            if (this.callbacks.isTransitioning())
                return;
            const node = this.callbacks.onNodeAtPosition(mouseEvent);
            // Optimize: only update if node changed
            if (node === this.lastHoveredNode)
                return;
            this.lastHoveredNode = node;
            if (!node) {
                this.callbacks.onHideTooltip();
                canvasSelection.style('cursor', 'default');
                return;
            }
            const data = getNodeData(node);
            this.callbacks.onShowTooltip(data, mouseEvent, node);
            canvasSelection.style('cursor', 'pointer');
        };
    }
    createMouseEnterHandler(canvasSelection) {
        return () => {
            if (this.callbacks && !this.callbacks.isTransitioning()) {
                canvasSelection
                    .transition()
                    .duration(TRANSITIONS.HOVER)
                    .style('filter', 'brightness(1.05)');
            }
        };
    }
    createMouseLeaveHandler(canvasSelection) {
        return () => {
            this.lastHoveredNode = null;
            canvasSelection
                .transition()
                .duration(TRANSITIONS.HOVER)
                .style('filter', 'brightness(1)')
                .style('cursor', 'default');
            if (this.callbacks) {
                this.callbacks.onHideTooltip();
            }
        };
    }
    registerListener(eventType, handler) {
        if (!this.canvas)
            return;
        this.eventListeners.set(eventType, handler);
        this.canvas.addEventListener(eventType, handler);
    }
    destroy() {
        if (this.canvas) {
            this.eventListeners.forEach((listener, eventType) => {
                this.canvas.removeEventListener(eventType, listener);
            });
            this.eventListeners.clear();
        }
    }
}
//# sourceMappingURL=interactions.js.map
import { buildHierarchy, getValueForDataType } from './data.js';
import { isLeafNode, getNodeData } from './types.js';
import { LAYOUT, TRANSITIONS, RECURSION } from './constants.js';
import { PathbarComponent } from './pathbar.js';
import { TooltipComponent } from './tooltip.js';
import { OverlayComponent } from '../overlay/index.js';
import { CanvasRenderer } from './renderer.js';
import { InteractionHandler } from './interactions.js';
const getCanvasSize = (container) => {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const availableHeight = container.height - LAYOUT.PATHBAR_HEIGHT - LAYOUT.FOOTER_HEIGHT;
    return {
        width: container.width * devicePixelRatio,
        height: availableHeight * devicePixelRatio,
    };
};
const getViewportSize = (container) => ({
    width: container.width,
    height: container.height - LAYOUT.PATHBAR_HEIGHT - LAYOUT.FOOTER_HEIGHT,
});
export class TreemapChart {
    container = null;
    canvas = null;
    context = null;
    currentData = [];
    hierarchy = null;
    currentRoot = null;
    rootNode = null;
    nodes = [];
    resizeObserver = null;
    isTransitioning = false;
    pathToRestore = [];
    drillTimeout = null;
    pathbar;
    tooltip;
    overlay;
    renderer;
    interactions;
    constructor() {
        this.pathbar = new PathbarComponent();
        this.tooltip = new TooltipComponent();
        this.overlay = OverlayComponent.getInstance();
        this.renderer = new CanvasRenderer();
        this.interactions = new InteractionHandler();
    }
    render(data, container) {
        // Store current path for restoration
        if (this.currentRoot && this.currentRoot !== this.rootNode) {
            this.pathToRestore = this.getPathIdentifiers(this.currentRoot);
        }
        this.cleanup();
        this.container = container;
        this.currentData = data;
        this.setupContainer();
        this.setupCanvas();
        this.buildHierarchyData();
        this.restorePreviousPath();
        this.setupComponents();
        this.setupResizeObserver();
        this.renderTreemap();
    }
    cleanup() {
        if (this.drillTimeout !== null) {
            clearTimeout(this.drillTimeout);
            this.drillTimeout = null;
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        this.interactions.destroy();
        this.tooltip.destroy();
    }
    restorePreviousPath() {
        if (this.pathToRestore.length > 0 && this.hierarchy) {
            const restoredNode = this.findNodeByIdentifiers(this.hierarchy, this.pathToRestore);
            if (restoredNode) {
                this.currentRoot = restoredNode;
            }
            this.pathToRestore.length = 0;
        }
    }
    getPathIdentifiers(node, maxDepth = RECURSION.MAX_DEPTH) {
        const path = [];
        let current = node;
        let depth = 0;
        while (current && current !== this.rootNode && depth < maxDepth) {
            const data = getNodeData(current);
            const id = data?.ticker || data?.nameEng;
            if (id)
                path.unshift(id);
            current = current.parent;
            depth++;
        }
        return path;
    }
    findNodeByIdentifiers(node, identifiers, maxDepth = RECURSION.MAX_DEPTH) {
        if (maxDepth <= 0 || !identifiers.length)
            return null;
        const traverse = (current, path, depth) => {
            if (depth > maxDepth || !current)
                return null;
            const data = getNodeData(current);
            const id = data?.ticker || data?.nameEng;
            if (path.length === 1 && id === path[0]) {
                return current;
            }
            if (id === path[0] && current.children) {
                const remainingPath = path.slice(1);
                for (const child of current.children) {
                    const result = traverse(child, remainingPath, depth + 1);
                    if (result)
                        return result;
                }
            }
            if (current.children && depth === 0) {
                for (const child of current.children) {
                    const result = traverse(child, path, depth + 1);
                    if (result)
                        return result;
                }
            }
            return null;
        };
        return traverse(node, identifiers, 0);
    }
    setupContainer() {
        if (!this.container)
            return;
        d3.select(this.container).selectAll('*').remove();
        d3.select(this.container).style('display', 'flex').style('flex-direction', 'column');
    }
    setupCanvas() {
        if (!this.container)
            return;
        const pathbarElement = this.pathbar.create(this.container);
        this.canvas = d3
            .select(this.container)
            .append('canvas')
            .style('width', '100%')
            .style('height', '100%')
            .style('display', 'block')
            .style('cursor', 'pointer')
            .style('flex-grow', '1')
            .node();
        this.updateCanvasSize();
    }
    updateCanvasSize() {
        if (!this.canvas || !this.container)
            return;
        const rect = this.container.getBoundingClientRect();
        const { width, height } = getCanvasSize(rect);
        const devicePixelRatio = window.devicePixelRatio || 1;
        this.canvas.width = width;
        this.canvas.height = height;
        this.context = this.canvas.getContext('2d');
        if (this.context) {
            this.context.scale(devicePixelRatio, devicePixelRatio);
        }
    }
    buildHierarchyData() {
        this.hierarchy = buildHierarchy(this.currentData);
        this.rootNode = this.hierarchy;
        if (!this.currentRoot) {
            this.currentRoot = this.hierarchy;
        }
    }
    setupComponents() {
        this.tooltip.init(this.container || undefined);
        if (this.canvas) {
            this.interactions.init(this.canvas, {
                onDrill: node => this.drillTo(node),
                onShowCompany: data => this.overlay.show(data),
                onShowTooltip: (data, event, node) => this.tooltip.show(data, event, node),
                onHideTooltip: () => this.tooltip.hide(),
                onNodeAtPosition: event => this.getNodeAtPosition(event),
                isTransitioning: () => this.isTransitioning,
            });
        }
    }
    setupResizeObserver() {
        if (!this.container)
            return;
        this.resizeObserver = new ResizeObserver(() => {
            if (this.isTransitioning)
                return;
            this.updateCanvasSize();
            this.renderTreemap();
        });
        this.resizeObserver.observe(this.container);
    }
    renderTreemap() {
        if (!this.canvas || !this.context || !this.container || !this.hierarchy)
            return;
        const rect = this.container.getBoundingClientRect();
        const { width, height } = getViewportSize(rect);
        const currentHierarchy = this.currentRoot === this.rootNode
            ? this.hierarchy
            : this.createSubHierarchy(this.currentRoot);
        this.applyTreemapLayout(currentHierarchy, width, height);
        // Clear canvas and render
        this.context.clearRect(0, 0, width, height);
        this.updatePathbar();
        this.renderer.render(this.nodes, this.context);
    }
    createSubHierarchy(rootNode, maxDepth = RECURSION.MAX_DEPTH - 1) {
        if (maxDepth <= 0 || !rootNode?.data?.data) {
            return d3.hierarchy({ data: { nameEng: 'Empty', value: 0 } });
        }
        const nodeData = rootNode.data.data;
        const createHierarchyData = (node, depth) => {
            if (depth > maxDepth || !node?.data?.data)
                return null;
            const result = {
                data: node.data.data,
                children: undefined,
            };
            if (node.children && depth < maxDepth) {
                const childData = node.children
                    .map((child) => createHierarchyData(child, depth + 1))
                    .filter(Boolean);
                if (childData.length > 0) {
                    result.children = childData;
                }
            }
            return result;
        };
        const hierarchyData = createHierarchyData(rootNode, 0);
        return d3
            .hierarchy(hierarchyData)
            .sum((d) => (d.children ? 0 : getValueForDataType(d.data)))
            .sort((a, b) => (b.value || 0) - (a.value || 0));
    }
    applyTreemapLayout(hierarchy, width, height) {
        const treemap = d3
            .treemap()
            .size([width, height])
            .paddingTop((d) => !d.parent
            ? LAYOUT.PADDING.TOP
            : d.children
                ? LAYOUT.SECTOR_HEADER_HEIGHT
                : LAYOUT.PADDING.TOP)
            .paddingInner(LAYOUT.PADDING.INNER)
            .paddingOuter(LAYOUT.PADDING.OUTER)
            .paddingRight(LAYOUT.PADDING.RIGHT)
            .paddingBottom(LAYOUT.PADDING.BOTTOM)
            .paddingLeft(LAYOUT.PADDING.LEFT);
        treemap(hierarchy);
        this.nodes = hierarchy.descendants();
        this.adjustNodesForSectorHeaders();
    }
    updatePathbar() {
        this.pathbar.update(this.getPathToRoot(this.currentRoot), {
            onDrill: node => this.drillTo(node),
            onShowTooltip: (data, event, node) => this.tooltip.show(data, event, node),
            onHideTooltip: () => this.tooltip.hide(),
        });
    }
    adjustNodesForSectorHeaders() {
        this.nodes.forEach((node) => {
            if (node.parent && node.children && node.children.length > 0) {
                const sectorTop = node.y0;
                const sectorHeight = node.y1 - node.y0;
                const availableHeight = sectorHeight - LAYOUT.SECTOR_HEADER_HEIGHT;
                if (availableHeight > 0) {
                    node.children.forEach((child) => {
                        const isLeafChild = !child.children || child.children.length === 0;
                        if (isLeafChild) {
                            const childHeight = child.y1 - child.y0;
                            const newChildHeight = (childHeight / sectorHeight) * availableHeight;
                            child.y0 =
                                sectorTop +
                                    LAYOUT.SECTOR_HEADER_HEIGHT +
                                    ((child.y0 - sectorTop) / sectorHeight) * availableHeight;
                            child.y1 = child.y0 + newChildHeight;
                        }
                    });
                }
            }
        });
    }
    drillTo(node) {
        if (this.isTransitioning)
            return;
        this.isTransitioning = true;
        this.tooltip.hide();
        this.currentRoot = node;
        if (this.canvas) {
            d3.select(this.canvas)
                .style('opacity', 1)
                .transition()
                .duration(TRANSITIONS.DRILL)
                .style('opacity', 0.3)
                .transition()
                .duration(TRANSITIONS.DRILL)
                .style('opacity', 1)
                .on('end', () => {
                this.isTransitioning = false;
            });
        }
        if (this.drillTimeout !== null) {
            clearTimeout(this.drillTimeout);
        }
        this.drillTimeout = window.setTimeout(() => {
            this.drillTimeout = null;
            this.renderTreemap();
        }, TRANSITIONS.DRILL);
    }
    getPathToRoot(node) {
        const path = [];
        let current = node;
        while (current) {
            path.unshift({
                name: current.data?.nameEng || current.data.data?.nameEng || 'Market',
                node: current,
            });
            current = current.parent || null;
        }
        return path;
    }
    getNodeAtPosition(event) {
        if (!this.canvas || !this.nodes)
            return null;
        const rect = this.canvas.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;
        const x = ((event.clientX - rect.left) * (this.canvas.width / rect.width)) / devicePixelRatio;
        const y = ((event.clientY - rect.top) * (this.canvas.height / rect.height)) / devicePixelRatio;
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const node = this.nodes[i];
            if (node &&
                typeof node.x0 === 'number' &&
                typeof node.x1 === 'number' &&
                typeof node.y0 === 'number' &&
                typeof node.y1 === 'number' &&
                node.x0 <= x &&
                x <= node.x1 &&
                node.y0 <= y &&
                y <= node.y1) {
                return node;
            }
        }
        return null;
    }
    searchAndHighlight(query) {
        if (!this.nodes || !query.trim())
            return;
        const searchQuery = query.toLowerCase();
        const matchingNode = this.nodes.find(node => {
            if (!isLeafNode(node))
                return false;
            const data = getNodeData(node);
            return (data &&
                (data.ticker?.toLowerCase().includes(searchQuery) ||
                    data.nameEng?.toLowerCase().includes(searchQuery)));
        });
        if (matchingNode) {
            const data = getNodeData(matchingNode);
            if (data) {
                this.overlay.show(data);
            }
        }
    }
    destroy() {
        if (this.drillTimeout !== null) {
            clearTimeout(this.drillTimeout);
            this.drillTimeout = null;
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        this.interactions.destroy();
        this.tooltip.destroy();
        if (this.context && this.canvas) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.hierarchy = null;
        this.currentRoot = null;
        this.rootNode = null;
        this.nodes.length = 0;
        this.currentData.length = 0;
        this.pathToRestore.length = 0;
        if (this.container) {
            d3.select(this.container).selectAll('*').remove();
        }
        this.canvas = null;
        this.context = null;
        this.container = null;
    }
}
export { TreemapChart as D3TreemapRenderer };
//# sourceMappingURL=index.js.map
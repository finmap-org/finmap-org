import { COLOR_SCALE, COLORS, LAYOUT, TRANSITIONS } from './constants.js';
import { formatCurrency } from '../utils.js';
import { getDisplayName } from './types.js';
import { getConfig, EXCHANGE_INFO } from '../config.js';
import { getCurrencyInfo } from '../currency/index.js';
export class TooltipComponent {
    element = null;
    isVisible = false;
    currentData = null;
    isFollowing = false;
    isSticky = false;
    rafId = null;
    pendingMouseEvent = null;
    container = null;
    hideTimeout = null;
    init(container) {
        this.destroy();
        this.container = container || null;
        this.createElement();
        this.setupEventListeners();
    }
    createElement() {
        const template = document.getElementById('tooltip');
        const clone = template.content.cloneNode(true);
        const div = document.createElement('div');
        div.className = 'tooltip';
        div.appendChild(clone);
        document.body.appendChild(div);
        this.element = div;
    }
    setupEventListeners() {
        if (this.container) {
            this.container.addEventListener('contextmenu', this.handleRightClick);
            this.container.addEventListener('click', this.handleClick);
        }
    }
    handleRightClick = (event) => {
        event.preventDefault();
        const target = event.target;
        const nodeData = target.__data__;
        if (nodeData?.data) {
            this.showSticky(nodeData.data, event, nodeData);
        }
    };
    handleClick = (event) => {
        if (this.isSticky && this.isVisible) {
            this.hide();
        }
    };
    handleMouseMove = (event) => {
        this.pendingMouseEvent = event;
        if (!this.rafId) {
            this.rafId = requestAnimationFrame(() => {
                if (this.pendingMouseEvent && this.isFollowing) {
                    this.position(this.pendingMouseEvent);
                }
                this.rafId = null;
                this.pendingMouseEvent = null;
            });
        }
    };
    startFollowing() {
        if (!this.isFollowing && this.container) {
            this.isFollowing = true;
            this.container.addEventListener('mousemove', this.handleMouseMove);
        }
    }
    stopFollowing() {
        if (this.isFollowing && this.container) {
            this.isFollowing = false;
            this.container.removeEventListener('mousemove', this.handleMouseMove);
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
        }
    }
    show(data, event, node) {
        if (!this.element || !data)
            return;
        if (this.hideTimeout !== null) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        if (this.currentData === data && this.isVisible && !this.isSticky) {
            this.position(event);
            return;
        }
        this.currentData = data;
        this.isSticky = false;
        const config = getConfig();
        const currencyInfo = getCurrencyInfo(config.currency);
        this.updateTooltipContent(data, node, currencyInfo.symbol);
        this.position(event);
        this.showElement();
        this.startFollowing();
    }
    showSticky(data, event, node) {
        if (!this.element || !data)
            return;
        if (this.hideTimeout !== null) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        this.hide();
        this.currentData = data;
        this.isSticky = true;
        const config = getConfig();
        const currencyInfo = getCurrencyInfo(config.currency);
        this.updateTooltipContent(data, node, currencyInfo.symbol);
        this.position(event);
        this.showElement();
    }
    showElement() {
        if (!this.element)
            return;
        this.element.style.visibility = 'visible';
        this.element.style.opacity = '1';
        this.isVisible = true;
    }
    updateTooltipContent(data, node, currencySign) {
        if (!this.element)
            return;
        const change = data?.priceChangePct || 0;
        const nodeColor = COLOR_SCALE(change);
        let percentParent = 100;
        let percentRoot = 100;
        if (node) {
            const nodeValue = node.value || 0;
            if (node.parent && node.parent.value) {
                percentParent = (nodeValue / node.parent.value) * 100;
            }
            let root = node;
            while (root.parent)
                root = root.parent;
            if (root.value) {
                percentRoot = (nodeValue / root.value) * 100;
            }
        }
        this.element.style.background = nodeColor;
        this.element.style.color = COLORS.TEXT_WHITE;
        this.element.style.border = '2px solid white';
        this.populateTooltipData(data, currencySign, percentParent, percentRoot, node);
    }
    populateTooltipData(data, currencySign, percentParent, percentRoot, node) {
        if (!this.element)
            return;
        const config = getConfig();
        const exchangeInfo = data.exchange ? EXCHANGE_INFO[data.exchange] : null;
        const displayName = exchangeInfo
            ? getDisplayName(data, config.language, exchangeInfo.language)
            : data.nameEng || data.ticker;
        const formatNumber = (num) => d3.format(',.0f')(num);
        const formatPercent = (num) => d3.format('.2f')(num);
        const ticker = this.element.querySelector('.tooltip-ticker');
        const name = this.element.querySelector('.tooltip-name');
        const price = this.element.querySelector('.tooltip-price');
        const position = this.element.querySelector('.tooltip-position');
        const marketcap = this.element.querySelector('.tooltip-marketcap');
        const value = this.element.querySelector('.tooltip-value');
        const volume = this.element.querySelector('.tooltip-volume');
        const trades = this.element.querySelector('.tooltip-trades');
        const exchange = this.element.querySelector('.tooltip-exchange');
        const industry = this.element.querySelector('.tooltip-industry');
        const sectorPercent = this.element.querySelector('.tooltip-sector-percent');
        const totalPercent = this.element.querySelector('.tooltip-total-percent');
        const items = this.element.querySelector('.tooltip-items');
        if (ticker)
            ticker.textContent = data.ticker;
        if (name)
            name.textContent = displayName;
        if (price) {
            price.textContent = `${formatPercent(data.priceLastSale || 0)} (${d3.format('+.2f')(data.priceChangePct || 0)}%)`;
        }
        if (position) {
            const positionValue = node?.value !== undefined && data.isPortfolio ? node.value : data.positionValue || 0;
            position.textContent = `Position: ${formatCurrency(positionValue, currencySign)}`;
        }
        if (marketcap) {
            marketcap.textContent = `MarketCap: ${formatCurrency(data.marketCap || 0, currencySign)}`;
        }
        if (value) {
            value.textContent = `Value: ${formatCurrency(data.value || 0, currencySign)}`;
        }
        if (volume)
            volume.textContent = `Volume: ${formatNumber(data.volume || 0)}`;
        if (trades)
            trades.textContent = `Trades: ${formatNumber(data.numTrades || 0)}`;
        if (exchange)
            exchange.textContent = `Exchange: ${data.exchange || 'N/A'}`;
        if (industry)
            industry.textContent = `Industry: ${data.industry || 'N/A'}`;
        if (sectorPercent)
            sectorPercent.textContent = `% of Sector: ${formatPercent(percentParent)}%`;
        if (totalPercent)
            totalPercent.textContent = `% of Total: ${formatPercent(percentRoot)}%`;
        if (items)
            items.textContent = `Items: ${formatNumber(data.nestedItemsCount || 0)}`;
    }
    position(event) {
        if (!this.element)
            return;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        this.element.style.visibility = 'hidden';
        this.element.style.opacity = '1';
        const { width: tooltipWidth, height: tooltipHeight } = this.element.getBoundingClientRect();
        const offset = LAYOUT.TOOLTIP_OFFSET;
        const left = event.clientX + tooltipWidth + offset > viewportWidth
            ? event.clientX - tooltipWidth - offset
            : event.clientX + offset;
        const top = event.clientY + tooltipHeight + offset > viewportHeight
            ? event.clientY - tooltipHeight - offset
            : event.clientY + offset;
        this.element.style.visibility = 'visible';
        this.element.style.left = `${Math.max(0, Math.min(left, viewportWidth - tooltipWidth))}px`;
        this.element.style.top = `${Math.max(0, Math.min(top, viewportHeight - tooltipHeight))}px`;
        this.element.style.opacity = '1';
    }
    hide() {
        if (!this.element || !this.isVisible)
            return;
        this.isVisible = false;
        this.isSticky = false;
        this.stopFollowing();
        this.element.style.opacity = '0';
        if (this.hideTimeout !== null) {
            clearTimeout(this.hideTimeout);
        }
        this.hideTimeout = window.setTimeout(() => {
            this.hideTimeout = null;
            if (this.element) {
                this.element.style.background = 'white';
                this.element.style.color = 'rgb(68, 68, 68)';
                this.element.style.border = '1px solid rgb(214, 214, 214)';
            }
        }, TRANSITIONS.TOOLTIP);
    }
    destroy() {
        if (this.hideTimeout !== null) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
        this.stopFollowing();
        if (this.container) {
            this.container.removeEventListener('contextmenu', this.handleRightClick);
            this.container.removeEventListener('click', this.handleClick);
        }
        if (this.element) {
            this.element.remove();
            this.element = null;
            this.isVisible = false;
            this.isSticky = false;
            this.currentData = null;
            this.container = null;
        }
    }
}
//# sourceMappingURL=tooltip.js.map
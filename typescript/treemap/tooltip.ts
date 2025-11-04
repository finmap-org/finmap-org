import { COLOR_SCALE, COLORS, LAYOUT, FONT, TRANSITIONS } from "./constants.js";
import { isLeafNode } from "./types.js";
import type { MarketData } from "./types.js";
import { formatCurrency } from "../utils.js";
import { getDisplayName } from "./types.js";
import { getConfig, EXCHANGE_INFO } from "../config.js";
import { getCurrencyInfo } from "../currency/index.js";

declare const d3: any;

export class TooltipComponent {
  private element: HTMLElement | null = null;
  private isVisible: boolean = false;
  private currentData: MarketData | null = null;
  private isFollowing: boolean = false;
  private isSticky: boolean = false;
  private rafId: number | null = null;
  private pendingMouseEvent: MouseEvent | null = null;
  private container: HTMLElement | null = null;

  init(container?: HTMLElement): void {
    this.destroy();
    this.container = container || null;
    this.createElement();
    this.setupEventListeners();
  }

  private createElement(): void {
    const template = document.getElementById("tooltip") as HTMLTemplateElement;
    const clone = template.content.cloneNode(true) as DocumentFragment;
    const div = document.createElement("div");
    div.className = "tooltip";
    div.appendChild(clone);
    document.body.appendChild(div);
    this.element = div;
  }

  private setupEventListeners(): void {
    if (this.container) {
      this.container.addEventListener("contextmenu", this.handleRightClick);
      this.container.addEventListener("click", this.handleClick);
    }
  }

  private handleRightClick = (event: MouseEvent): void => {
    event.preventDefault();
    const target = event.target as Element;
    const nodeData = (target as any).__data__;

    if (nodeData?.data) {
      this.showSticky(nodeData.data, event, nodeData);
    }
  };

  private handleClick = (event: MouseEvent): void => {
    if (this.isSticky && this.isVisible) {
      this.hide();
    }
  };

  private handleMouseMove = (event: MouseEvent): void => {
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

  private startFollowing(): void {
    if (!this.isFollowing && this.container) {
      this.isFollowing = true;
      this.container.addEventListener("mousemove", this.handleMouseMove);
    }
  }

  private stopFollowing(): void {
    if (this.isFollowing && this.container) {
      this.isFollowing = false;
      this.container.removeEventListener("mousemove", this.handleMouseMove);

      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }
  }

  show(data: MarketData, event: MouseEvent, node?: any): void {
    if (!this.element || !data) return;

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

  showSticky(data: MarketData, event: MouseEvent, node?: any): void {
    if (!this.element || !data) return;

    this.hide();
    this.currentData = data;
    this.isSticky = true;
    const config = getConfig();
    const currencyInfo = getCurrencyInfo(config.currency);

    this.updateTooltipContent(data, node, currencyInfo.symbol);
    this.position(event);
    this.showElement();
  }

  private showElement(): void {
    if (!this.element) return;

    this.element.style.visibility = "visible";
    this.element.style.opacity = "1";
    this.isVisible = true;
  }

  private updateTooltipContent(
    data: MarketData,
    node: any,
    currencySign: string,
  ): void {
    if (!this.element) return;

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
      while (root.parent) root = root.parent;

      if (root.value) {
        percentRoot = (nodeValue / root.value) * 100;
      }
    }

    this.element.style.background = nodeColor;
    this.element.style.color = COLORS.TEXT_WHITE;
    this.element.style.border = "2px solid white";

    this.populateTooltipData(
      data,
      currencySign,
      percentParent,
      percentRoot,
      node,
    );
  }

  private populateTooltipData(
    data: MarketData,
    currencySign: string,
    percentParent: number,
    percentRoot: number,
    node?: any,
  ): void {
    if (!this.element) return;

    const config = getConfig();
    const exchangeInfo = data.exchange ? EXCHANGE_INFO[data.exchange] : null;
    const displayName = exchangeInfo
      ? getDisplayName(data, config.language, exchangeInfo.language)
      : data.nameEng || data.ticker;

    const formatNumber = (num: number) => d3.format(",.0f")(num);
    const formatPercent = (num: number) => d3.format(".2f")(num);

    const ticker = this.element.querySelector(".tooltip-ticker") as HTMLElement;
    const name = this.element.querySelector(".tooltip-name") as HTMLElement;
    const price = this.element.querySelector(".tooltip-price") as HTMLElement;
    const position = this.element.querySelector(
      ".tooltip-position",
    ) as HTMLElement;
    const marketcap = this.element.querySelector(
      ".tooltip-marketcap",
    ) as HTMLElement;
    const value = this.element.querySelector(".tooltip-value") as HTMLElement;
    const volume = this.element.querySelector(".tooltip-volume") as HTMLElement;
    const trades = this.element.querySelector(".tooltip-trades") as HTMLElement;
    const exchange = this.element.querySelector(
      ".tooltip-exchange",
    ) as HTMLElement;
    const industry = this.element.querySelector(
      ".tooltip-industry",
    ) as HTMLElement;
    const sectorPercent = this.element.querySelector(
      ".tooltip-sector-percent",
    ) as HTMLElement;
    const totalPercent = this.element.querySelector(
      ".tooltip-total-percent",
    ) as HTMLElement;
    const items = this.element.querySelector(".tooltip-items") as HTMLElement;

    if (ticker) ticker.textContent = data.ticker;
    if (name) name.textContent = displayName;
    if (price) {
      price.textContent = `${formatPercent(data.priceLastSale || 0)} (${d3.format("+.2f")(data.priceChangePct || 0)}%)`;
    }
    if (position) {
      const positionValue =
        node?.value !== undefined && data.isPortfolio
          ? node.value
          : data.positionValue || 0;
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
    if (exchange) exchange.textContent = `Exchange: ${data.exchange || "N/A"}`;
    if (industry) industry.textContent = `Industry: ${data.industry || "N/A"}`;
    if (sectorPercent)
      sectorPercent.textContent = `% of Sector: ${formatPercent(percentParent)}%`;
    if (totalPercent)
      totalPercent.textContent = `% of Total: ${formatPercent(percentRoot)}%`;
    if (items)
      items.textContent = `Items: ${formatNumber(data.nestedItemsCount || 0)}`;
  }

  private position(event: MouseEvent): void {
    if (!this.element) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    this.element.style.visibility = "hidden";
    this.element.style.opacity = "1";

    const { width: tooltipWidth, height: tooltipHeight } =
      this.element.getBoundingClientRect();

    const offset = LAYOUT.TOOLTIP_OFFSET;
    const left =
      event.clientX + tooltipWidth + offset > viewportWidth
        ? event.clientX - tooltipWidth - offset
        : event.clientX + offset;

    const top =
      event.clientY + tooltipHeight + offset > viewportHeight
        ? event.clientY - tooltipHeight - offset
        : event.clientY + offset;

    this.element.style.visibility = "visible";
    this.element.style.left = `${Math.max(0, Math.min(left, viewportWidth - tooltipWidth))}px`;
    this.element.style.top = `${Math.max(0, Math.min(top, viewportHeight - tooltipHeight))}px`;
    this.element.style.opacity = "1";
  }

  hide(): void {
    if (!this.element || !this.isVisible) return;

    this.isVisible = false;
    this.isSticky = false;
    this.stopFollowing();

    this.element.style.opacity = "0";

    setTimeout(() => {
      if (this.element) {
        this.element.style.background = "white";
        this.element.style.color = "rgb(68, 68, 68)";
        this.element.style.border = "1px solid rgb(214, 214, 214)";
      }
    }, TRANSITIONS.TOOLTIP);
  }

  destroy(): void {
    this.stopFollowing();

    if (this.container) {
      this.container.removeEventListener("contextmenu", this.handleRightClick);
      this.container.removeEventListener("click", this.handleClick);
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

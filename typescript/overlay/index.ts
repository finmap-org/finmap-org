import type { OverlayTab } from './types.js';
import { getDisplayName, type MarketData } from '../treemap/types.js';
import { fetchNews, fetchCompanyInfo } from './data.js';
import { getConfig, EXCHANGE_INFO } from '../config.js';
import { getCurrencyInfo } from '../currency/index.js';

declare const d3: any;

export class OverlayComponent {
  private static instance: OverlayComponent | null = null;
  private overlay: HTMLElement | null = null;
  private currentTab: OverlayTab = 'news';
  private currentData: MarketData | null = null;
  private eventListeners: Map<
    string,
    { element: EventTarget; listener: EventListener; eventType: string }
  > = new Map();

  constructor() {
    this.overlay = document.getElementById('company-overlay');
    this.setupEventListeners();
  }

  static getInstance(): OverlayComponent {
    if (!OverlayComponent.instance) {
      OverlayComponent.instance = new OverlayComponent();
    }
    return OverlayComponent.instance;
  }

  show(data: MarketData): void {
    if (!this.overlay) return;

    this.currentData = data;
    this.currentTab = 'news';
    this.populate(data);
    this.showOverlay();
  }

  private setupEventListeners(): void {
    if (!this.overlay) return;

    const closeBtn = this.overlay.querySelector('.overlay-close') as HTMLElement;
    if (closeBtn) {
      const closeHandler = () => this.hide();
      this.addEventListenerWithCleanup('close-btn', closeBtn, 'click', closeHandler);
    }

    const tabs = this.overlay.querySelectorAll('.overlay-tab');
    tabs.forEach((tab, index) => {
      const tabHandler = (e: Event) => {
        const target = e.target as HTMLElement;
        const tabName = target.getAttribute('data-tab') as OverlayTab;
        if (tabName) this.switchTab(tabName);
      };
      this.addEventListenerWithCleanup(`tab-${index}`, tab, 'click', tabHandler);
    });

    const overlayClickHandler = (e: Event) => {
      if (e.target === this.overlay) this.hide();
    };
    this.addEventListenerWithCleanup('overlay-click', this.overlay, 'click', overlayClickHandler);

    const keydownHandler = (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === 'Escape' && this.overlay?.style.display !== 'none') {
        this.hide();
      }
    };
    this.addEventListenerWithCleanup('keydown', document, 'keydown', keydownHandler);
  }

  private addEventListenerWithCleanup(
    key: string,
    element: EventTarget,
    event: string,
    listener: EventListener,
  ): void {
    this.removeEventListener(key);
    element.addEventListener(event, listener);
    this.eventListeners.set(key, { element, listener, eventType: event });
  }

  private removeEventListener(key: string): void {
    const entry = this.eventListeners.get(key);
    if (entry) {
      entry.element.removeEventListener(entry.eventType, entry.listener);
      this.eventListeners.delete(key);
    }
  }

  private populate(data: MarketData): void {
    if (!this.overlay) return;

    const config = getConfig();
    const exchangeInfo = data.exchange ? EXCHANGE_INFO[data.exchange] : null;
    const displayName = getDisplayName(data, config.language, exchangeInfo?.language || null);

    const titleEl = this.overlay.querySelector('#overlay-title') as HTMLElement;
    titleEl.textContent = `${data.ticker} - ${displayName}`;

    const currencyInfo = getCurrencyInfo(config.currency);

    const priceLastEl = this.overlay.querySelector('#price-last') as HTMLElement;
    const priceChangeEl = this.overlay.querySelector('#price-change') as HTMLElement;
    const marketCapEl = this.overlay.querySelector('#market-cap') as HTMLElement;
    const valueEl = this.overlay.querySelector('#value') as HTMLElement;
    const numTradesEl = this.overlay.querySelector('#num-trades') as HTMLElement;

    priceLastEl.textContent = d3.format('.2f')(data.priceLastSale);

    const changeSign = (data.priceChangePct || 0) >= 0 ? '+' : '';
    priceChangeEl.textContent = `${changeSign}${d3.format('.2f')(data.priceChangePct || 0)}%`;
    priceChangeEl.className = `price-change ${(data.priceChangePct || 0) >= 0 ? 'positive' : 'negative'}`;

    marketCapEl.textContent = `${currencyInfo.symbol}${d3.format(',.0f')(data.marketCap / 1e6)}M`;
    valueEl.textContent = `${currencyInfo.symbol}${d3.format(',.0f')(data.value / 1e6)}M`;
    numTradesEl.textContent = d3.format(',.0f')(data.numTrades);

    this.switchTab('news');
  }

  private switchTab(tab: OverlayTab): void {
    if (!this.overlay) return;

    this.currentTab = tab;

    const tabs = this.overlay.querySelectorAll('.overlay-tab');
    tabs.forEach(tabEl => {
      const el = tabEl as HTMLElement;
      const isActive = el.getAttribute('data-tab') === tab;
      el.classList.toggle('active', isActive);
    });

    if (this.currentData) {
      this.loadTabContent(this.currentData);
    }
  }

  private async loadTabContent(data: MarketData): Promise<void> {
    if (!this.overlay) return;

    const content = this.overlay.querySelector('#overlay-content') as HTMLElement;

    switch (this.currentTab) {
      case 'news':
        await this.loadNewsContent(data, content);
        break;
      case 'info':
        await this.loadInfoContent(data, content);
        break;
      case 'buy':
        this.loadBuyContent(content);
        break;
    }
  }

  private async loadNewsContent(data: MarketData, container: HTMLElement): Promise<void> {
    container.innerHTML = '<div class="loading-message">Loading news...</div>';

    try {
      const config = getConfig();
      const exchangeInfo = data.exchange ? EXCHANGE_INFO[data.exchange] : null;
      const companyName = getDisplayName(data, config.language, exchangeInfo?.language || null);

      const newsItems = await fetchNews(data.ticker, companyName, config.date);

      if (newsItems.length === 0) {
        container.innerHTML =
          '<div class="error-message">Try checking back later for updates</div>';
        return;
      }

      const newsHtml = newsItems
        .map(
          item => `
        <article class="news-article">
          <h4 class="news-title">
            <a href="${item.link}" target="_blank" rel="noopener noreferrer">
              ${item.title}
            </a>
          </h4>
          <div class="news-meta">
            <a href="${item.sourceUrl}" target="_blank" rel="noopener">
              ${item.source}
            </a>, ${item.pubDate}
          </div>
        </article>
      `,
        )
        .join('');

      container.innerHTML = newsHtml;
    } catch (error) {
      container.innerHTML = '<div class="error-message">Try checking back later for updates</div>';
    }
  }

  private async loadInfoContent(data: MarketData, container: HTMLElement): Promise<void> {
    container.innerHTML = '<div class="loading-message">Loading company info...</div>';

    try {
      const companyInfo = await fetchCompanyInfo(
        data.exchange,
        data.ticker,
        data.wikiPageIdEng,
        data.wikiPageIdOriginal,
      );

      if (!companyInfo || !companyInfo.description) {
        container.innerHTML = '<div class="error-message">No company information available.</div>';
        return;
      }

      container.innerHTML = `
        <div class="company-info">
          <p>${companyInfo.description}</p>
          <p><strong>Link: <a href="${companyInfo.sourceLink}" target="_blank" rel="noopener">${companyInfo.sourceLink}</a></strong></p>
        </div>
      `;
    } catch (error) {
      container.innerHTML =
        '<div class="error-message">Company details are not available for this security.</div>';
    }
  }

  private loadBuyContent(container: HTMLElement): void {
    container.innerHTML = `
      <div class="buy-content">
        <h3>Interested in integration?</h3>
        <p>Contact us for API access, custom solutions, and enterprise partnerships.</p>
        <a href="mailto:contact@finmap.org">contact@finmap.org</a>
      </div>
    `;
  }

  private showOverlay(): void {
    if (!this.overlay) return;

    this.overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  private hide(): void {
    if (!this.overlay) return;

    this.overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  destroy(): void {
    this.eventListeners.forEach((entry, key) => {
      this.removeEventListener(key);
    });
    this.eventListeners.clear();
    document.body.style.overflow = 'auto';
  }

  static destroyInstance(): void {
    if (OverlayComponent.instance) {
      OverlayComponent.instance.destroy();
      OverlayComponent.instance = null;
    }
  }
}

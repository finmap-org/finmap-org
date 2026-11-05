import { getDisplayName } from '../treemap/types.js';
import { fetchNews, fetchCompanyInfo, escapeHtml } from './data.js';
import { getConfig, EXCHANGE_INFO } from '../config.js';
import { getCurrencyInfo } from '../currency/index.js';
export class OverlayComponent {
    static instance = null;
    overlay = null;
    currentTab = 'news';
    currentData = null;
    fetchController = null;
    eventListeners = new Map();
    constructor() {
        this.overlay = document.getElementById('company-overlay');
        this.setupEventListeners();
    }
    static getInstance() {
        if (!OverlayComponent.instance) {
            OverlayComponent.instance = new OverlayComponent();
        }
        return OverlayComponent.instance;
    }
    show(data) {
        if (!this.overlay)
            return;
        this.abortFetch();
        this.currentData = data;
        this.currentTab = 'news';
        this.populate(data);
        this.showOverlay();
    }
    abortFetch() {
        if (this.fetchController) {
            this.fetchController.abort();
            this.fetchController = null;
        }
    }
    setupEventListeners() {
        if (!this.overlay)
            return;
        const closeBtn = this.overlay.querySelector('.overlay-close');
        if (closeBtn) {
            const closeHandler = () => this.hide();
            this.addEventListenerWithCleanup('close-btn', closeBtn, 'click', closeHandler);
        }
        const tabs = this.overlay.querySelectorAll('.overlay-tab');
        tabs.forEach((tab, index) => {
            const tabHandler = (e) => {
                const target = e.target;
                const tabName = target.getAttribute('data-tab');
                if (tabName)
                    this.switchTab(tabName);
            };
            this.addEventListenerWithCleanup(`tab-${index}`, tab, 'click', tabHandler);
        });
        const overlayClickHandler = (e) => {
            if (e.target === this.overlay)
                this.hide();
        };
        this.addEventListenerWithCleanup('overlay-click', this.overlay, 'click', overlayClickHandler);
        const keydownHandler = (e) => {
            const keyEvent = e;
            if (keyEvent.key === 'Escape' && this.overlay?.style.display !== 'none') {
                this.hide();
            }
        };
        this.addEventListenerWithCleanup('keydown', document, 'keydown', keydownHandler);
    }
    addEventListenerWithCleanup(key, element, event, listener) {
        this.removeEventListener(key);
        element.addEventListener(event, listener);
        this.eventListeners.set(key, { element, listener, eventType: event });
    }
    removeEventListener(key) {
        const entry = this.eventListeners.get(key);
        if (entry) {
            entry.element.removeEventListener(entry.eventType, entry.listener);
            this.eventListeners.delete(key);
        }
    }
    populate(data) {
        if (!this.overlay)
            return;
        const config = getConfig();
        const exchangeInfo = data.exchange ? EXCHANGE_INFO[data.exchange] : null;
        const displayName = getDisplayName(data, config.language, exchangeInfo?.language || null);
        const titleEl = this.overlay.querySelector('#overlay-title');
        titleEl.textContent = `${data.ticker} - ${displayName}`;
        const currencyInfo = getCurrencyInfo(config.currency);
        const priceLastEl = this.overlay.querySelector('#price-last');
        const priceChangeEl = this.overlay.querySelector('#price-change');
        const marketCapEl = this.overlay.querySelector('#market-cap');
        const valueEl = this.overlay.querySelector('#value');
        const numTradesEl = this.overlay.querySelector('#num-trades');
        priceLastEl.textContent = d3.format('.2f')(data.priceLastSale);
        const changeSign = (data.priceChangePct || 0) >= 0 ? '+' : '';
        priceChangeEl.textContent = `${changeSign}${d3.format('.2f')(data.priceChangePct || 0)}%`;
        priceChangeEl.className = `price-change ${(data.priceChangePct || 0) >= 0 ? 'positive' : 'negative'}`;
        marketCapEl.textContent = `${currencyInfo.symbol}${d3.format(',.0f')(data.marketCap / 1e6)}M`;
        valueEl.textContent = `${currencyInfo.symbol}${d3.format(',.0f')(data.value / 1e6)}M`;
        numTradesEl.textContent = d3.format(',.0f')(data.numTrades);
        this.switchTab('news');
    }
    switchTab(tab) {
        if (!this.overlay)
            return;
        this.abortFetch();
        this.currentTab = tab;
        const tabs = this.overlay.querySelectorAll('.overlay-tab');
        tabs.forEach(tabEl => {
            const el = tabEl;
            const isActive = el.getAttribute('data-tab') === tab;
            el.classList.toggle('active', isActive);
        });
        if (this.currentData) {
            this.loadTabContent(this.currentData);
        }
    }
    async loadTabContent(data) {
        if (!this.overlay)
            return;
        const content = this.overlay.querySelector('#overlay-content');
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
    async loadNewsContent(data, container) {
        container.innerHTML = '<div class="loading-message">Loading news...</div>';
        this.fetchController = new AbortController();
        const signal = this.fetchController.signal;
        try {
            const config = getConfig();
            const exchangeInfo = data.exchange ? EXCHANGE_INFO[data.exchange] : null;
            const companyName = getDisplayName(data, config.language, exchangeInfo?.language || null);
            const newsItems = await fetchNews(data.ticker, companyName, config.date, signal);
            if (newsItems.length === 0) {
                container.innerHTML =
                    '<div class="error-message">Try checking back later for updates</div>';
                return;
            }
            const newsHtml = newsItems
                .map(item => `
        <article class="news-article">
          <h4 class="news-title">
            <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">
              ${escapeHtml(item.title)}
            </a>
          </h4>
          <div class="news-meta">
            <a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener">
              ${escapeHtml(item.source)}
            </a>, ${escapeHtml(item.pubDate)}
          </div>
        </article>
      `)
                .join('');
            container.innerHTML = newsHtml;
        }
        catch (error) {
            if (error?.name === 'AbortError') {
                return;
            }
            container.innerHTML = '<div class="error-message">Try checking back later for updates</div>';
        }
    }
    async loadInfoContent(data, container) {
        container.innerHTML = '<div class="loading-message">Loading company info...</div>';
        this.fetchController = new AbortController();
        const signal = this.fetchController.signal;
        try {
            const companyInfo = await fetchCompanyInfo(data.exchange, data.ticker, data.wikiPageIdEng, data.wikiPageIdOriginal, signal);
            if (!companyInfo || !companyInfo.description) {
                container.innerHTML = '<div class="error-message">No company information available.</div>';
                return;
            }
            const safeDescription = escapeHtml(companyInfo.description);
            const safeLink = escapeHtml(companyInfo.sourceLink);
            container.innerHTML = `
        <div class="company-info">
          <p>${safeDescription}</p>
          <p><strong>Link: <a href="${safeLink}" target="_blank" rel="noopener">${safeLink}</a></strong></p>
        </div>
      `;
        }
        catch (error) {
            if (error?.name === 'AbortError') {
                return;
            }
            container.innerHTML =
                '<div class="error-message">Company details are not available for this security.</div>';
        }
    }
    loadBuyContent(container) {
        container.innerHTML = `
      <div class="buy-content">
        <h3>Interested in integration?</h3>
        <p>Contact us for API access, custom solutions, and enterprise partnerships.</p>
        <a href="mailto:contact@finmap.org">contact@finmap.org</a>
      </div>
    `;
    }
    showOverlay() {
        if (!this.overlay)
            return;
        this.overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    hide() {
        if (!this.overlay)
            return;
        this.abortFetch();
        this.overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    destroy() {
        this.abortFetch();
        this.eventListeners.forEach((entry, key) => {
            this.removeEventListener(key);
        });
        this.eventListeners.clear();
        document.body.style.overflow = 'auto';
    }
    static destroyInstance() {
        if (OverlayComponent.instance) {
            OverlayComponent.instance.destroy();
            OverlayComponent.instance = null;
        }
    }
}
//# sourceMappingURL=index.js.map
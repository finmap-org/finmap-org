import { isSearchableChart } from './types.js';
import { fetchMarketData } from './treemap/data.js';
import { TreemapChart } from './treemap/index.js';
import { HistogramChart } from './histogram/index.js';
import { getConfig, updateConfig, onConfigChange, EXCHANGE_INFO, getDateRange, toggleLanguage, getFallbackDate, } from './config.js';
import { toggleCurrency } from './currency/data.js';
import { OverlayComponent } from './overlay/index.js';
import { getExchangeRate } from './currency/index.js';
import { formatDisplayDate } from './utils.js';
let currentRenderer = null;
let currentData = [];
let currentFetchController = null;
let activePortfolioCsv = null;
export function initializeUI() {
    onConfigChange(() => {
        updateUIState();
    });
    setupEventListeners();
    setupMenu();
    setupShareFeature();
    setupInstallFeature();
    renderChart();
}
function setupEventListeners() {
    const dateInput = document.getElementById('date');
    const searchInput = document.getElementById('search');
    const fileInput = document.getElementById('inputFile');
    if (dateInput) {
        dateInput.addEventListener('change', async () => {
            const dateParts = dateInput.value.split('-');
            if (dateParts.length === 3 && dateParts[0] && dateParts[1] && dateParts[2]) {
                const formattedDate = `${dateParts[0]}/${dateParts[1].padStart(2, '0')}/${dateParts[2].padStart(2, '0')}`;
                updateConfig({ date: formattedDate });
                const currentConfig = getConfig();
                const currentExchangeInfo = EXCHANGE_INFO[currentConfig.exchange];
                if (currentExchangeInfo) {
                    try {
                        const currencyExchangeRate = await getExchangeRate(currentExchangeInfo.nativeCurrency, 'USD', currentConfig.date);
                        updateConfig({ currencyExchangeRate });
                    }
                    catch (error) {
                        console.warn('Failed to fetch exchange rate:', error);
                    }
                }
                renderChart();
            }
        });
    }
    if (searchInput) {
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.trim();
                if (query && isSearchableChart(currentRenderer)) {
                    currentRenderer.searchAndHighlight(query);
                }
                e.target.value = '';
            }
        });
    }
    if (fileInput) {
        fileInput.addEventListener('change', event => {
            const file = event.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = e => {
                    const csvContent = e.target?.result;
                    if (csvContent) {
                        activePortfolioCsv = csvContent;
                        updateFilterVisibility();
                        renderChart();
                        const portfolioDialog = document.getElementById('portfolio-dialog');
                        if (portfolioDialog && portfolioDialog.open) {
                            portfolioDialog.close();
                        }
                    }
                };
                reader.readAsText(file);
            }
            event.target.value = '';
        });
    }
    const filterLabel = document.getElementById('inputFileLabel');
    const portfolioDialog = document.getElementById('portfolio-dialog');
    const portfolioSelectBtn = document.getElementById('portfolio-select-btn');
    const portfolioCloseBtn = document.getElementById('portfolio-close-btn');
    if (filterLabel) {
        filterLabel.addEventListener('click', event => {
            event.preventDefault();
            const hasFilter = activePortfolioCsv !== null;
            if (hasFilter) {
                activePortfolioCsv = null;
                updateFilterVisibility();
                renderChart();
            }
            else if (portfolioDialog) {
                portfolioDialog.showModal();
            }
        });
    }
    if (portfolioSelectBtn && fileInput) {
        portfolioSelectBtn.addEventListener('click', () => {
            fileInput.click();
        });
    }
    if (portfolioCloseBtn && portfolioDialog) {
        portfolioCloseBtn.addEventListener('click', () => {
            portfolioDialog.close();
        });
    }
    if (portfolioDialog) {
        portfolioDialog.addEventListener('click', event => {
            if (event.target === portfolioDialog) {
                portfolioDialog.close();
            }
        });
    }
    document.addEventListener('click', async (event) => {
        const target = event.target;
        if (target.dataset.chartType) {
            event.preventDefault();
            updateConfig({ chartType: target.dataset.chartType });
            renderChart();
            return;
        }
        if (target.dataset.exchange) {
            event.preventDefault();
            cleanupOnConfigChange();
            updateConfig({ exchange: target.dataset.exchange });
            const currentConfig = getConfig();
            const currentExchangeInfo = EXCHANGE_INFO[currentConfig.exchange];
            if (currentExchangeInfo) {
                try {
                    const currencyExchangeRate = await getExchangeRate(currentExchangeInfo.nativeCurrency, 'USD', currentConfig.date);
                    updateConfig({ currencyExchangeRate });
                }
                catch (error) {
                    console.warn('Failed to fetch exchange rate:', error);
                }
            }
            updateDateInputLimits();
            renderChart();
            return;
        }
        const currencyBtn = target.closest('[data-action="currency-toggle"]') ||
            (target.id === 'currencyToggle' ? target : null);
        if (currencyBtn) {
            event.preventDefault();
            if (currencyBtn.hasAttribute('currency-toggle-disabled')) {
                return;
            }
            const currentConfig = getConfig();
            const currentExchangeInfo = EXCHANGE_INFO[currentConfig.exchange];
            if (currentExchangeInfo && currentExchangeInfo.nativeCurrency !== 'USD') {
                cleanupOnConfigChange();
                toggleCurrency();
                const newConfig = getConfig();
                currencyBtn.textContent = newConfig.currency;
                try {
                    const currencyExchangeRate = await getExchangeRate(currentExchangeInfo.nativeCurrency, 'USD', newConfig.date);
                    updateConfig({ currencyExchangeRate });
                }
                catch (error) {
                    console.warn('Failed to fetch exchange rate:', error);
                }
                renderChart();
            }
            return;
        }
        if (target.id === 'langToggle') {
            event.preventDefault();
            cleanupOnConfigChange();
            toggleLanguage();
            const newConfig = getConfig();
            target.textContent = newConfig.language;
            renderChart();
            return;
        }
        if (target.dataset.action === 'erase-filter') {
            event.preventDefault();
            activePortfolioCsv = null;
            updateFilterVisibility();
            renderChart();
            return;
        }
    });
}
function setupMenu() {
    const menuButton = document.querySelector('.hamburger');
    const menu = document.querySelector('.menu');
    if (menuButton && menu) {
        menuButton.addEventListener('click', () => {
            const isOpen = menu.classList.contains('showMenu');
            if (isOpen) {
                menu.classList.remove('showMenu');
                menuButton.classList.remove('active');
            }
            else {
                menu.classList.add('showMenu');
                menuButton.classList.add('active');
            }
        });
        // Close menu when clicking on menu items
        menu.addEventListener('click', e => {
            const target = e.target;
            if (target.classList.contains('menuItem')) {
                menu.classList.remove('showMenu');
                menuButton.classList.remove('active');
            }
        });
        // Close menu when clicking outside
        document.addEventListener('click', e => {
            if (!menuButton.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.remove('showMenu');
                menuButton.classList.remove('active');
            }
        });
    }
}
export async function renderChart() {
    try {
        const container = document.getElementById('chart');
        if (!container)
            return;
        if (currentFetchController) {
            currentFetchController.abort();
        }
        currentFetchController = new AbortController();
        showLoadingState(container);
        currentData = await fetchMarketData(currentFetchController.signal);
        if (currentRenderer) {
            currentRenderer.destroy();
        }
        const config = getConfig();
        switch (config.chartType) {
            case 'treemap':
                currentRenderer = new TreemapChart();
                break;
            case 'histogram':
                currentRenderer = new HistogramChart();
                break;
            default:
                currentRenderer = new TreemapChart();
        }
        const filteredData = applyFilters(currentData);
        if (currentRenderer) {
            currentRenderer.render(filteredData, container);
        }
        updateUIState();
        hideLoadingState(container);
    }
    catch (error) {
        if (error?.name === 'AbortError') {
            return;
        }
        if (error?.name === 'HttpError' && error?.status === 404) {
            const config = getConfig();
            handle404Error(config.date, config.exchange);
            return;
        }
        showErrorState(error);
    }
}
function handle404Error(requestedDateStr, exchange) {
    const container = document.getElementById('chart');
    if (container) {
        container.innerHTML = '<div class="error">Data not available for this date.</div>';
    }
    const fallbackDateStr = getFallbackDate(requestedDateStr, exchange);
    const dialog = document.getElementById('fallback-dialog');
    const desc = document.getElementById('fallback-dialog-desc');
    const yesBtn = document.getElementById('fallback-yes-btn');
    const noBtn = document.getElementById('fallback-no-btn');
    if (dialog && desc && yesBtn && noBtn) {
        const formattedReq = formatDisplayDate(requestedDateStr);
        const formattedFallback = formatDisplayDate(fallbackDateStr);
        const isFutureOrLatest = requestedDateStr >= fallbackDateStr;
        const dateDesc = isFutureOrLatest ? 'the latest available date' : 'the nearest available date';
        desc.textContent = `No data is available for ${formattedReq}. Show the chart for ${formattedFallback}, ${dateDesc}?`;
        const onYes = () => {
            cleanupDialog();
            updateConfig({ date: fallbackDateStr });
            renderChart();
        };
        const onNo = () => {
            cleanupDialog();
        };
        const cleanupDialog = () => {
            yesBtn.removeEventListener('click', onYes);
            noBtn.removeEventListener('click', onNo);
            dialog.removeEventListener('cancel', onNo);
            if (typeof dialog.close === 'function') {
                dialog.close();
            }
            else {
                dialog.removeAttribute('open');
            }
        };
        yesBtn.addEventListener('click', onYes);
        noBtn.addEventListener('click', onNo);
        dialog.addEventListener('cancel', onNo, { once: true });
        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        }
        else {
            dialog.setAttribute('open', '');
        }
    }
}
function cleanupOnConfigChange() {
    if (currentFetchController) {
        currentFetchController.abort();
        currentFetchController = null;
    }
    OverlayComponent.destroyInstance();
    currentData.length = 0;
    if (currentRenderer) {
        currentRenderer.destroy();
        currentRenderer = null;
    }
}
function applyFilters(data) {
    const config = getConfig();
    const exchangeInfo = EXCHANGE_INFO[config.exchange];
    const csvData = activePortfolioCsv;
    if (!csvData)
        return data;
    try {
        const portfolioData = parsePortfolioCSV(csvData);
        if (portfolioData.length === 0)
            return data;
        const portfolioTickers = portfolioData.map(item => item.ticker.toUpperCase());
        const filteredData = data.filter(item => portfolioTickers.includes(item.ticker.toUpperCase()) || item.type === 'sector');
        return filteredData.map(item => {
            if (item.type === 'sector')
                return {
                    ...item,
                    isPortfolio: true,
                };
            const portfolioItem = portfolioData.find(p => p.ticker.toUpperCase() === item.ticker.toUpperCase());
            if (portfolioItem) {
                let positionValue = item.priceLastSale * portfolioItem.amount;
                if (config.currency !== exchangeInfo.nativeCurrency) {
                    positionValue = positionValue / config.currencyExchangeRate;
                }
                return {
                    ...item,
                    positionValue: positionValue,
                    isPortfolio: true,
                };
            }
            return item;
        });
    }
    catch (error) {
        console.warn('Failed to parse portfolio CSV:', error);
        return data;
    }
}
function parsePortfolioCSV(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const portfolioData = [];
    for (const line of lines) {
        const parts = line.split(',').map(part => part.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
            const ticker = parts[0];
            const amount = parseFloat(parts[1]);
            if (ticker && !isNaN(amount) && amount > 0) {
                portfolioData.push({ ticker, amount });
            }
        }
    }
    return portfolioData;
}
function updateUIState() {
    const config = getConfig();
    const exchangeSelect = document.getElementById('exchange');
    const chartTypeSelect = document.getElementById('chartType');
    const dateInput = document.getElementById('date');
    const currencyToggle = document.querySelector('[data-action="currency-toggle"]');
    const langToggle = document.getElementById('langToggle');
    if (exchangeSelect)
        exchangeSelect.value = config.exchange;
    if (chartTypeSelect)
        chartTypeSelect.value = config.chartType;
    if (dateInput && config.date) {
        const parts = config.date.split('/');
        if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
            dateInput.value = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
    }
    if (currencyToggle) {
        const exchangeInfo = EXCHANGE_INFO[config.exchange];
        currencyToggle.textContent = config.currency;
        currencyToggle.style.display = 'inline-block';
        if (!exchangeInfo || exchangeInfo.nativeCurrency === 'USD') {
            currencyToggle.setAttribute('currency-toggle-disabled', 'true');
        }
        else {
            currencyToggle.removeAttribute('currency-toggle-disabled');
        }
    }
    if (langToggle) {
        langToggle.textContent = config.language;
    }
    updateDateInputLimits();
    updateFilterVisibility();
}
function updateDateInputLimits() {
    const config = getConfig();
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const { min, max } = getDateRange(config.exchange);
        dateInput.min = min;
        dateInput.max = max;
        // Set current value if not already set or if it's outside the new range
        if (!dateInput.value || dateInput.value < min || dateInput.value > max) {
            dateInput.value = max;
            updateConfig({ date: max.replace(/-/g, '/') });
        }
    }
}
function updateFilterVisibility() {
    const filterLabel = document.getElementById('inputFileLabel');
    const eraseFilterLink = document.getElementById('linkEraseFilter');
    const hasFilter = activePortfolioCsv !== null;
    if (filterLabel) {
        filterLabel.style.display = 'inline-block';
        if (hasFilter) {
            filterLabel.textContent = 'My Portfolio (×)';
            filterLabel.title = 'Click to remove portfolio filter';
        }
        else {
            filterLabel.textContent = 'My Portfolio';
            filterLabel.title = 'Upload portfolio CSV';
        }
    }
    if (eraseFilterLink) {
        eraseFilterLink.style.display = 'none';
    }
}
function showLoadingState(container) {
    container.innerHTML = '<div class="loading">Loading...</div>';
}
function hideLoadingState(container) {
    const loading = container.querySelector('.loading');
    if (loading) {
        loading.remove();
    }
}
function showErrorState(error) {
    const container = document.getElementById('chart');
    if (container) {
        container.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}
function setupShareFeature() {
    const shareLink = document.getElementById('share');
    if (shareLink) {
        shareLink.addEventListener('click', handleShareClick);
    }
}
let installPrompt = null;
window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
window.addEventListener('appinstalled', handleAppInstalled);
function setupInstallFeature() {
    const installLink = document.getElementById('install');
    if (installLink) {
        installLink.addEventListener('click', handleInstallClick);
        if (installPrompt) {
            installLink.removeAttribute('hidden');
        }
    }
}
function handleShareClick() {
    if (navigator.share) {
        navigator
            .share({
            title: document.title,
            url: window.location.href,
        })
            .catch(console.error);
    }
}
function handleBeforeInstallPrompt(event) {
    event.preventDefault();
    installPrompt = event;
    const installLink = document.getElementById('install');
    if (installLink) {
        installLink.removeAttribute('hidden');
    }
}
function handleAppInstalled() {
    installPrompt = null;
    const installLink = document.getElementById('install');
    if (installLink) {
        installLink.setAttribute('hidden', '');
    }
}
async function handleInstallClick() {
    if (!installPrompt)
        return;
    await installPrompt.prompt();
    const choiceResult = await installPrompt.userChoice;
    console.log(`Install prompt result: ${choiceResult.outcome}`);
    installPrompt = null;
    const installLink = document.getElementById('install');
    if (installLink) {
        installLink.setAttribute('hidden', '');
    }
}
//# sourceMappingURL=ui.js.map
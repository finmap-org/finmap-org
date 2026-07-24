import { loadConfigFromURL, getConfig, updateConfig, EXCHANGE_INFO } from './config.js';
import { initializeUI } from './ui.js';

async function initialize(): Promise<void> {
  loadConfigFromURL();

  const config = getConfig();
  const exchangeInfo = EXCHANGE_INFO[config.exchange];

  if (!config.currency || config.currency === 'USD') {
    updateConfig({ currency: exchangeInfo.nativeCurrency });
  }

  initializeUI();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

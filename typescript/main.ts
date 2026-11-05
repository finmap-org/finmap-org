import { loadConfigFromURL } from './config.js';
import { initializeUI } from './ui.js';

async function initialize(): Promise<void> {
  loadConfigFromURL();
  initializeUI();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(console.error);
  });
}

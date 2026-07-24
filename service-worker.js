const CACHE_NAME = 'finmap-v2.3.3';
const STATIC_CACHE = 'finmap-static-v2.3.3';
const DATA_CACHE = 'finmap-data-v2.3.3';

const STATIC_FILES = [
  '/',
  '/index.html',
  '/js/main.js',
  '/js/types.js',
  '/js/config.js',
  '/js/ui.js',
  '/js/utils.js',
  '/manifest.json',
  '/images/icons/favicon.png',
  '/images/icons/ios/180.png',
  '/js/d3.v7.min.js',
  '/js/plotly-3.7.0.min.js',
];

const DATA_URLS = [
  'https://raw.githubusercontent.com/finmap-org/',
  'https://news.finmap.org/',
  'https://en.wikipedia.org',
  'https://ru.wikipedia.org',
  'https://tr.wikipedia.org',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (isStaticAsset(request.url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isDataRequest(request.url)) {
    event.respondWith(networkFirst(request, DATA_CACHE));
  } else {
    event.respondWith(fetch(request));
  }
});

function isStaticAsset(url) {
  return STATIC_FILES.some(file => url.includes(file)) ||
    url.includes('d3js.org') ||
    url.endsWith('.js') ||
    url.endsWith('.ts') ||
    url.endsWith('.css') ||
    url.endsWith('.png') ||
    url.endsWith('.svg');
}

function isDataRequest(url) {
  return DATA_URLS.some(dataUrl => url.includes(dataUrl)) ||
    url.includes('githubusercontent') ||
    url.includes('wikipedia') ||
    url.includes('news.finmap.org');
}

async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(cacheName);
    return cache.match(request);
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);

    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    throw error;
  }
}

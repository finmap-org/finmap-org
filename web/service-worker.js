"use strict";

const CACHE_NAME = "my-app-static-cache-v25.2.13.1";
const DATA_CACHE_NAME = "my-app-data-cache-v25.2.13.1";

const FILES_TO_CACHE = [
  "/",
  "/styles/style.css",
  "/styles/Material_Icons.woff2",
  "/index.html",
  "/images/icons/favicon.png",
  "/images/icons/patreon.png",
  "/images/icons/boosty.png",
  "/scripts/currency.js",
  "/scripts/histogram.js",
  "/scripts/install.js",
  "/scripts/main.js",
  "/scripts/menu.js",
  "/scripts/overlay.js",
  "/scripts/plotly-3.0.0.min.js",
  "/scripts/share.js",
  "/scripts/treemap.js",
];

self.addEventListener("install", async (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(FILES_TO_CACHE);
      } catch (error) {
        console.error("Failed to cache files:", error);
      }
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            return caches.delete(key);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evt) => {
  if (evt.request.url.includes("/data/") || evt.request.url.includes("wikipedia.org") || evt.request.url.includes("d3sk7vmzjz3uox.cloudfront.net")) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(evt.request);
          if (response.status === 200) {
            cache.put(evt.request, response.clone());
          }
          return response;
        } catch (error) {
          const cachedResponse = await cache.match(evt.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          console.error("Failed to fetch data:", error);
        }
      }),
    );
    return;
  }
  evt.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const response = await cache.match(evt.request);
      return response || fetch(evt.request);
    }),
  );
});

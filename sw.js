const CACHE_NAME = "sever-carwash-v13";
const APP_FILES = ["./?v=neon-v9", "./index.html?v=neon-v9", "./styles.css?v=neon-v5", "./app.js?v=neon-v2", "./manifest.webmanifest", "./icon.svg", "./public/mustang-cutout.png?v=neon-v5"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("sever-carwash-") && key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin) return;

  event.respondWith(caches.match(event.request).then((cached) => {
    if (cached) return cached;
    return fetch(event.request).then((response) => {
      if (!response.ok) return response;
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => {
      if (event.request.mode === "navigate") return caches.match("./index.html?v=neon-v9");
      throw new Error("Offline resource is not cached.");
    });
  }));
});

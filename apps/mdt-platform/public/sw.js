const CACHE_NAME = "bluecore-mdt-v1";
const OFFLINE_URLS = ["/", "/mdt", "/dispatch", "/calltaker", "/manifest.json"];

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)));
  (self as ServiceWorkerGlobalScope).skipWaiting();
});

self.addEventListener("fetch", (event: FetchEvent) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then((r) => r ?? caches.match("/")))
  );
});

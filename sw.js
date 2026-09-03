// Service worker do match.IA — estratégia "network-first" (sempre busca a versão
// mais nova primeiro; só usa o cache se a rede falhar). Isso dá suporte offline
// básico sem esconder alterações recentes durante o desenvolvimento do site.
const CACHE_NAME = 'matchia-v1';
const APP_SHELL = [
  './index.html',
  './assets/css/style.css',
  './assets/js/api.js',
  './assets/js/site.js',
  './assets/js/theme.js',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Nunca serve a API do localStorage/cache — sempre precisa estar atualizada.
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

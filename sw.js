/* Guardian EHS — service worker
   Strategy:
   - Navigations (opening the app): network-first, so updates you push are
     picked up immediately; the cached shell is used only when offline.
   - CDN assets (fonts, supabase-js): stale-while-revalidate runtime cache,
     so the app still looks right and can boot with no connection.
   Nothing sensitive is cached: org data lives in Supabase / localStorage,
   never in this cache. */

const CACHE = 'guardian-shell-v5';
const RUNTIME = 'guardian-runtime-v5';
const CORE = ['./', './index.html', './app.html', './site.css',
              './projects.html', './team.html', './blog.html'];   // site + app

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== RUNTIME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  /* Opening / reloading the app: fresh copy when online, shell when offline */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() =>
        caches.match(req)
          .then(r => r || caches.match('./app.html'))
          .then(r => r || caches.match('./index.html'))
          .then(r => r || caches.match('./'))
      )
    );
    return;
  }

  /* Never cache API traffic — auth, database and storage stay live-only */
  const url = new URL(req.url);
  if (url.hostname.endsWith('.supabase.co')) return;

  /* Fonts & CDN libraries: serve cached, refresh in background */
  e.respondWith(
    caches.match(req).then(cached => {
      const refresh = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(RUNTIME).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || refresh;
    })
  );
});

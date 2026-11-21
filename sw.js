// Offline-cache: schil en data worden vooraf opgehaald; daarna stale-while-revalidate voor same-origin GET.
const VERSION = "dezon-app-v1";
const CORE = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "public/fonts/bricolage.woff2",
  "public/icons/favicon.svg",
  "public/icons/icon-192.png",
  "config/app.json",
  "config/promos.json",
  "public/css/app.css",
  "public/css/screens.css",
  "public/css/tokens.css",
  "src/app.js",
  "src/components/confirm.js",
  "src/components/demo-code.js",
  "src/components/icons.js",
  "src/components/illustraties.js",
  "src/components/order.js",
  "src/components/product.js",
  "src/components/shell.js",
  "src/components/sundial.js",
  "src/data/fotos.json",
  "src/data/menu.json",
  "src/data/site.json",
  "src/lib/cart.mjs",
  "src/lib/datasource.mjs",
  "src/lib/dom.js",
  "src/lib/hours.mjs",
  "src/lib/loyalty.mjs",
  "src/lib/money.mjs",
  "src/lib/promos.mjs",
  "src/lib/search.mjs",
  "src/lib/slots.mjs",
  "src/lib/validate.mjs",
  "src/router.js",
  "src/screens/account.js",
  "src/screens/admin.js",
  "src/screens/admin/data.js",
  "src/screens/admin/info.js",
  "src/screens/admin/loyalty.js",
  "src/screens/admin/orders.js",
  "src/screens/admin/products.js",
  "src/screens/admin/promos.js",
  "src/screens/cart.js",
  "src/screens/checkout.js",
  "src/screens/contact.js",
  "src/screens/done.js",
  "src/screens/home.js",
  "src/screens/loyalty.js",
  "src/screens/menu.js",
  "src/screens/orders.js",
  "src/screens/privacy.js",
  "src/screens/promos.js",
  "src/state/app-state.js",
  "public/img/foto/frites-800.webp",
  "public/img/foto/hamburgers-800.webp",
  "public/img/foto/snacks-800.webp",
  "public/img/foto/vegetarisch-800.webp",
  "public/img/foto/ijs-800.webp",
  "public/img/foto/dranken-800.webp",
  "public/img/foto/sauzen-800.webp",
  "public/img/foto/band-800.webp",
  "public/img/foto/afhalen-800.webp",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || (req.mode === "navigate" ? cache.match("index.html") : Response.error());
  })());
});

/* The GED Academy · offline support.
   If you change the app files, change the CACHE name (for example ged-v2) so phones load the new version. */
const CACHE = "ged-v4";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icons/academy.svg", "./icons/icon-192.png",
  "./assets/academy.css", "./assets/hub.css", "./assets/i18n.js", "./assets/core.js", "./assets/subjects.js", "./assets/hub.js",
  "./rla/", "./rla/index.html", "./rla/config.js", "./rla/data.js",
  "./social-studies/", "./social-studies/index.html", "./social-studies/config.js", "./social-studies/data.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
/* Network first, so new sessions appear at once. The cache is the offline copy. Sessions you open are kept for offline use. */
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || u.pathname.includes("/teacher/")) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; })
    .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || (r.mode === "navigate" ? caches.match("./index.html") : undefined))));
});

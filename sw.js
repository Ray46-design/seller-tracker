/* Offline support. Bump CACHE when the app files change so phones pick up the new version. */
var CACHE = 'seller-tracker-v1';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-48.png'];
self.addEventListener('install', function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); })); });
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){ return Promise.all(keys.filter(function(k){ return k.indexOf('seller-tracker-') === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;
  var fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !fonts) return;
  if (req.mode === 'navigate'){
    e.respondWith(fetch(req).then(function(r){ var copy = r.clone(); caches.open(CACHE).then(function(c){ c.put('index.html', copy); }); return r; }).catch(function(){ return caches.match('index.html').then(function(r){ return r || caches.match('./'); }); }));
    return;
  }
  e.respondWith(caches.match(req).then(function(hit){
    var net = fetch(req).then(function(r){ if (r && (r.ok || r.type === 'opaque')){ var copy = r.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }); } return r; }).catch(function(){ return hit; });
    return hit || net;
  }));
});

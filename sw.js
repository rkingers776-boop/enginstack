/* ═══════════════════════════════════════════════════════════
   EnginStack — Service Worker v1
   Simple cache-then-network strategy for fast repeat visits
   ═══════════════════════════════════════════════════════════ */

var CACHE_NAME = 'enginstack-v3-20260729';
var urlsToCache = [
  // ── Core assets ─────────────────────────────────────────
  '/',
  '/style.css',
  '/main.js',
  '/favicon.svg',
  '/manifest.json',
  '/404',
  '/about',
  '/contact',
  '/privacy',

  // ── Category hubs ───────────────────────────────────────
  '/length',
  '/weight',
  '/temperature',
  '/speed',
  '/pressure',
  '/area',
  '/volume',
  '/time',
  '/data-storage',
  '/energy',
  '/angle',
  '/fuel-economy',

  // ── Guides ──────────────────────────────────────────────
  '/guides',
  '/guides/length-conversion-guide',
  '/guides/weight-mass-conversion-guide',
  '/guides/temperature-conversion-guide',
  '/guides/speed-conversion-guide',
  '/guides/pressure-conversion-guide',

  // ── Length converters (14) ──────────────────────────────
  '/inches-to-cm',
  '/cm-to-inches',
  '/feet-to-meters',
  '/meters-to-feet',
  '/miles-to-km',
  '/km-to-miles',
  '/cm-to-mm',
  '/mm-to-cm',
  '/yards-to-meters',
  '/meters-to-yards',
  '/inches-to-feet',
  '/feet-to-inches',
  '/feet-to-yards',
  '/yards-to-feet',

  // ── Weight / Mass converters (12) ───────────────────────
  '/lbs-to-kg',
  '/kg-to-lbs',
  '/grams-to-ounces',
  '/oz-to-grams',
  '/kg-to-g',
  '/g-to-kg',
  '/tons-to-lbs',
  '/lbs-to-tons',
  '/g-to-mg',
  '/mg-to-g',

  // ── Temperature converters (6) ──────────────────────────
  '/fahrenheit-to-celsius',
  '/celsius-to-fahrenheit',
  '/celsius-to-kelvin',
  '/kelvin-to-celsius',
  '/fahrenheit-to-kelvin',
  '/kelvin-to-fahrenheit',

  // ── Speed converters (8) ────────────────────────────────
  '/mph-to-kph',
  '/kph-to-mph',
  '/knots-to-mph',
  '/mph-to-knots',
  '/knots-to-kph',
  '/kph-to-knots',
  '/mph-to-fts',
  '/fts-to-mph',

  // ── Pressure converters (6) ─────────────────────────────
  '/psi-to-bar',
  '/bar-to-psi',
  '/kpa-to-psi',
  '/psi-to-kpa',
  '/atm-to-pa',
  '/pa-to-atm',

  // ── Area converters (6) ─────────────────────────────────
  '/sq-ft-to-sq-m',
  '/sq-m-to-sq-ft',
  '/acres-to-hectares',
  '/hectares-to-acres',
  '/acres-to-sq-ft',
  '/sq-ft-to-acres',

  // ── Volume converters (6) ───────────────────────────────
  '/gallons-to-liters',
  '/liters-to-gallons',
  '/cups-to-ml',
  '/ml-to-cups',
  '/liters-to-ml',
  '/ml-to-liters',

  // ── Time converters (6) ─────────────────────────────────
  '/minutes-to-hours',
  '/hours-to-minutes',
  '/seconds-to-minutes',
  '/minutes-to-seconds',
  '/hours-to-days',
  '/days-to-hours',

  // ── Data Storage converters (6) ─────────────────────────
  '/mb-to-gb',
  '/gb-to-mb',
  '/gb-to-tb',
  '/tb-to-gb',
  '/kb-to-mb',
  '/mb-to-kb',

  // ── Energy / Power converters (6) ───────────────────────
  '/hp-to-kw',
  '/kw-to-hp',
  '/watts-to-hp',
  '/hp-to-watts',
  '/joules-to-calories',
  '/calories-to-joules',

  // ── Angle converters (2) ────────────────────────────────
  '/degrees-to-radians',
  '/radians-to-degrees',

  // ── Fuel Economy converters (4) ─────────────────────────
  '/mpg-to-l-100km',
  '/l-100km-to-mpg',
  '/mpg-to-kml',
  '/kml-to-mpg'
];

// ── Install: pre-cache core assets ────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache).catch(function(err) {
        console.log('[SW] Pre-cache failed (non-critical):', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// ── Fetch: network-first, cache fallback ──────────────────
self.addEventListener('fetch', function(event) {
  // Only handle GET
  if (event.request.method !== 'GET') return;

  // Skip analytics
  if (event.request.url.indexOf('google-analytics') !== -1 ||
      event.request.url.indexOf('googletagmanager') !== -1) {
    return;
  }

  event.respondWith(
    fetch(event.request).then(function(response) {
      // Cache successful responses
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
      }
      return response;
    }).catch(function() {
      // Network failed → serve from cache
      return caches.match(event.request).then(function(cached) {
        return cached || caches.match('/404.html');
      });
    })
  );
});

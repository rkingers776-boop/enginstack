/* ═══════════════════════════════════════════════════════════
   EnginStack — Google Analytics 4 (GA4)
   Measurement ID: G-4KZVRQHGCK
   Analytics dashboard: analytics.google.com → Admin → Data Streams

   DEFERRED LOADING
   gtag.js is ~178 KB and was by far the largest transfer on every
   page — roughly seven times the rest of the site combined, and the
   only source of long tasks in the main thread. It is now loaded
   after the page is interactive: on the first real user interaction,
   or 2.5 s after the load event for readers who never touch anything.

   The pageview is queued in dataLayer immediately (before gtag.js
   exists), so once the library arrives it is sent with the correct
   page_location and page_title. Nothing about what is collected
   changes — only when the library is fetched.

   Disclosure note: privacy.html documents what GA4 receives and how
   to opt out. GA4 writes first-party cookies (_ga) by default; that
   behaviour is unchanged by this file.
   ═══════════════════════════════════════════════════════════ */

(function () {
  var GA_MEASUREMENT_ID = 'G-4KZVRQHGCK';

  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    console.log('[EnginStack] Analytics not configured — set GA_MEASUREMENT_ID in analytics.js');
    return;
  }

  // ── Queue the pageview now; gtag.js drains this later ───
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_location: window.location.href,
    page_title: document.title,
    send_page_view: true
  });

  // ── Fetch the library only after the page is usable ────
  var started = false;

  function start() {
    if (started) return;
    started = true;
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  function armFallback() {
    window.setTimeout(start, 2500);
  }

  if (document.readyState === 'complete') {
    armFallback();
  } else {
    window.addEventListener('load', armFallback, { once: true });
  }

  // Any real engagement loads it immediately — a converter needs typing,
  // so an actual visitor triggers this well before the fallback fires.
  var gestures = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
  for (var i = 0; i < gestures.length; i++) {
    window.addEventListener(gestures[i], start, { once: true, passive: true });
  }
})();

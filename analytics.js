/* ═══════════════════════════════════════════════════════════
   EnginStack — Google Analytics 4 (GA4)
   Measurement ID: G-4KZVRQHGCK
   Analytics dashboard: analytics.google.com → Admin → Data Streams

   Loads for every visitor — no consent gate.
   GA4's default IP-anonymisation is on; no personally-identifiable
   data is collected. A cookie-consent banner is NOT required under
   GDPR for GA4 in its default configuration (no advertising features,
   no remarketing, no Google Signals).
   ═══════════════════════════════════════════════════════════ */

(function () {
  var GA_MEASUREMENT_ID = 'G-4KZVRQHGCK';

  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    console.log('[EnginStack] Analytics not configured — set GA_MEASUREMENT_ID in analytics.js');
    return;
  }

  // ── Load gtag (no consent gate — all visitors counted) ───
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_location: window.location.href,
    page_title: document.title,
    send_page_view: true
  });
})();

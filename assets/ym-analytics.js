(function () {
  'use strict';

  var MEASUREMENT_ID = 'G-DCFLLT5D1K';
  var path = window.location.pathname || '/';
  var blocked = /^\/(?:CENTRAL|CRM|DASHBOARD|FINANCEIRO|MOTOR|VOS|Conteudos|Identidade|areadocliente|interno)(?:\/|$)/i;

  if (blocked.test(path)) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: false
  });

  var loader = document.createElement('script');
  loader.async = true;
  loader.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
  document.head.appendChild(loader);

  function cleanPageLocation() {
    return window.location.origin + window.location.pathname;
  }

  function sendPageView() {
    window.gtag('event', 'page_view', {
      page_title: document.title || '',
      page_location: cleanPageLocation(),
      page_path: window.location.pathname || '/'
    });
  }

  sendPageView();

  function textOf(el) {
    var text = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim();
    return text.slice(0, 80);
  }

  function isWhatsAppHref(href) {
    return /(?:wa\.me|whatsapp\.com|api\.whatsapp\.com)/i.test(href || '');
  }

  function isRaioxCta(el, href, label) {
    var onclick = el.getAttribute('onclick') || '';
    return /startNewRaiox/i.test(onclick) || /raio-x(?:\.html)?/i.test(href || '') || /raio[- ]?x/i.test(label || '');
  }

  function beginsCheckout(el, href) {
    var onclick = el.getAttribute('onclick') || '';
    return /startNewRaiox/i.test(onclick) || /(?:checkout=1|novo=1)/i.test(href || '');
  }

  function isEvaluationCta(href) {
    try {
      var url = new URL(href, window.location.href);
      return url.origin === window.location.origin && /^\/triagem\/?$/.test(url.pathname);
    } catch (_) {
      return false;
    }
  }

  document.addEventListener('click', function (event) {
    var el = event.target && event.target.closest ? event.target.closest('a,button') : null;
    if (!el) return;

    var href = el.getAttribute('href') || '';
    var label = textOf(el);

    if (isEvaluationCta(href)) {
      window.gtag('event', 'avaliacao_cta_click', {
        source_page: window.location.pathname || '/',
        cta_zone: el.closest('header') ? 'header' : el.closest('.hero') ? 'hero' : el.closest('footer') ? 'footer' : 'main',
        cta_text: label
      });
    }

    if (isWhatsAppHref(href)) {
      window.gtag('event', 'whatsapp_click', {
        source_page: window.location.pathname || '/',
        cta_text: label
      });
    }

    if (isRaioxCta(el, href, label)) {
      window.gtag('event', 'raiox_cta_click', {
        source_page: window.location.pathname || '/',
        cta_text: label
      });
    }

    if (beginsCheckout(el, href)) {
      window.gtag('event', 'begin_checkout', {
        currency: 'BRL',
        value: 97,
        items: [{ item_name: 'Raio-X Digital YM', item_category: 'Diagnostico', price: 97, quantity: 1 }]
      });
    }
  }, true);

  window.YMAnalytics = {
    measurementId: MEASUREMENT_ID,
    track: function (name, params) {
      if (!name) return;
      window.gtag('event', name, params || {});
    }
  };
})();

(function () {
  'use strict';

  var MEASUREMENT_ID = 'G-DCFLLT5D1K';
  var path = window.location.pathname || '/';
  var blocked = /^\/(?:CENTRAL|CRM|DASHBOARD|FINANCEIRO|MOTOR|VOS|Conteudos|Identidade|RAIOX|areadocliente|interno)(?:\/|$)/i;

  if (blocked.test(path)) return;

  // Algumas páginas legadas carregam este arquivo mais de uma vez.
  // Execute a inicialização, page_view e os ouvintes apenas uma vez por página.
  if (window.__YM_ANALYTICS_INITIALIZED__) return;
  window.__YM_ANALYTICS_INITIALIZED__ = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  // LGPD: medição começa sem cookies (Consent Mode). Cookies de análise só depois do aceite.
  var CONSENT_KEY = 'ym_consent_analytics';
  var stored = null;
  try { stored = window.localStorage.getItem(CONSENT_KEY); } catch (e) {}
  window.gtag('consent', 'default', {
    analytics_storage: stored === 'granted' ? 'granted' : 'denied',
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
    wait_for_update: 500
  });
  window.gtag('set', 'ads_data_redaction', true);

  function saveConsent(value) {
    try { window.localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
    window.gtag('consent', 'update', { analytics_storage: value });
  }

  function showConsentBanner() {
    if (stored === 'granted' || stored === 'denied') return;
    var bar = document.createElement('div');
    bar.id = 'ym-consent';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Aviso de cookies');
    bar.innerHTML = '<p>Usamos cookies de medição para entender como o site é usado e melhorá-lo. Nenhum dado pessoal é enviado. <a href="/termos/">Saiba mais</a></p>' +
      '<div><button type="button" data-c="denied">Recusar</button><button type="button" data-c="granted">Aceitar</button></div>';
    var st = document.createElement('style');
    st.textContent = '#ym-consent{position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:2147483000;max-width:620px;margin:0 auto;background:#0B1533;color:#fff;border-radius:16px;padding:14px 16px;display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap;box-shadow:0 18px 40px rgba(0,0,0,.3);font:14px/1.45 Inter,Arial,sans-serif}' +
      '#ym-consent p{margin:0;flex:1 1 280px;color:#DDE1F2}#ym-consent a{color:#FFB066}#ym-consent div{display:flex;gap:8px}' +
      '#ym-consent button{border:0;border-radius:999px;padding:10px 16px;font:700 14px Inter,Arial,sans-serif;cursor:pointer}' +
      '#ym-consent button[data-c=denied]{background:transparent;color:#fff;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.4)}#ym-consent button[data-c=granted]{background:#FF7A00;color:#0B1533}';
    document.head.appendChild(st);
    document.body.appendChild(bar);
    bar.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('button[data-c]');
      if (!b) return;
      saveConsent(b.getAttribute('data-c'));
      bar.remove();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showConsentBanner, { once: true });
  else showConsentBanner();

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

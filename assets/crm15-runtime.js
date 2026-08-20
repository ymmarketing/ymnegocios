(() => {
  function loadScript(src, key) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[data-${key}]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.dataset[key] = '1';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function startNativeClientDetails() {
    if (window.__ymNativeClientDetailsStarted) return;
    window.__ymNativeClientDetailsStarted = true;
    const expanded = new Set();

    if (!document.getElementById('crmNativeClientDetailsStyles')) {
      const style = document.createElement('style');
      style.id = 'crmNativeClientDetailsStyles';
      style.textContent = `
        details.client-card > summary.client-head {
          list-style: none;
          cursor: pointer;
          grid-template-columns: 30px 1.4fr .65fr .65fr auto !important;
        }
        details.client-card > summary.client-head::-webkit-details-marker { display:none; }
        .client-native-arrow {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: #EDF3F9;
          color: #47627B;
          display: grid;
          place-items: center;
          font-size: 16px;
          font-weight: 800;
          transition: .15s;
          padding: 0;
          user-select: none;
        }
        details.client-card[open] > summary .client-native-arrow {
          transform: rotate(90deg);
          background: var(--ym-indigo, #484DCF);
          color: #fff;
        }
        details.client-card[open] > summary.client-head {
          border-bottom: 1px solid #D9E5F3;
        }
        details.client-card > .client-body {
          display: block !important;
        }
        @media (max-width: 900px) {
          details.client-card > summary.client-head {
            grid-template-columns: 30px 1fr auto !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    function clientKey(card) {
      const button = [...card.querySelectorAll('button')].find((b) =>
        (b.getAttribute('onclick') || '').includes('CRMClients.openClient')
      );
      const match = (button?.getAttribute('onclick') || '').match(/openClient\('([^']+)'\)/);
      return match?.[1] || (card.querySelector('.client-title')?.textContent || '').trim();
    }

    function convert(card) {
      if (card.tagName === 'DETAILS' && card.dataset.nativeDetails === '1') return;

      const head = card.querySelector(':scope > .client-head');
      const body = card.querySelector(':scope > .client-body');
      if (!head || !body) return;

      const key = clientKey(card);
      const details = document.createElement('details');
      details.className = card.className;
      details.dataset.nativeDetails = '1';
      details.dataset.clientKey = key;
      if (expanded.has(key)) details.open = true;

      const summary = document.createElement('summary');
      summary.className = 'client-head';

      const arrow = document.createElement('span');
      arrow.className = 'client-native-arrow';
      arrow.textContent = '›';
      arrow.setAttribute('aria-hidden', 'true');
      summary.appendChild(arrow);
      while (head.firstChild) summary.appendChild(head.firstChild);

      delete body.dataset.collapsed;
      body.hidden = false;
      body.style.removeProperty('display');

      summary.addEventListener('click', (event) => {
        const action = event.target.closest('button,a,input,select,textarea');
        if (action) event.stopPropagation();
      });

      details.addEventListener('toggle', () => {
        if (!key) return;
        if (details.open) expanded.add(key);
        else expanded.delete(key);
      });

      details.append(summary, body);
      card.replaceWith(details);
    }

    function apply() {
      if (!document.getElementById('activeClientsTab')?.classList.contains('on')) return;
      document.querySelectorAll('.client-card').forEach(convert);
    }

    new MutationObserver(() => requestAnimationFrame(apply)).observe(document.getElementById('leadList') || document.body, {
      childList: true,
      subtree: false
    });
    setInterval(apply, 700);
    apply();
  }

  loadScript('/assets/crm15-runtime-core.js?v=20260813-1', 'ymRuntimeCore')
    .then(() => loadScript('/assets/crm15-kpi-click.js?v=20260819-1', 'ymPipelineKpi'))
    .then(() => loadScript('/assets/crm15-lead-sheet-v3.js?v=20260819-1', 'ymLeadSheetV3'))
    .then(() => loadScript('/assets/crm15-no-recommendation.js?v=20260819-1', 'ymNoRecommendation'))
    .then(() => loadScript('/assets/crm15-reading-prompt-v2.js?v=20260820-1', 'ymReadingPromptV2'))
    .then(() => loadScript('/assets/crm15-reading-copy-fix.js?v=20260820-1', 'ymReadingCopyFix'))
    .then(() => loadScript('/assets/crm15-copy-prospect-message-v1.js?v=20260820-1', 'ymProspectMessageV1'))
    .then(() => loadScript('/assets/central-ym-admin.js?v=20260820-1', 'ymCentralClientAdmin'))
    .then(() => loadScript('/assets/central-ym-shortcut.js?v=20260820-1', 'ymCentralAdminShortcut'))
    .then(startNativeClientDetails)
    .catch((error) => console.error('CRM interaction layer', error));
})();

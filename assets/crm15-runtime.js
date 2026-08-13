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
      document.head.append(script);
    });
  }

  function startClientFoldFix() {
    if (window.__ymClientFoldFixStarted) return;
    window.__ymClientFoldFixStarted = true;

    if (!document.getElementById('crmClientFoldFixStyles')) {
      const style = document.createElement('style');
      style.id = 'crmClientFoldFixStyles';
      style.textContent = `
        .client-head.client-fold-head {
          grid-template-columns: 30px 1.4fr .65fr .65fr auto !important;
        }
        .client-fold-arrow {
          width: 26px;
          height: 26px;
          border: 0;
          border-radius: 8px;
          background: #EDF3F9;
          color: #47627B;
          display: grid;
          place-items: center;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          transition: .15s;
          padding: 0;
        }
        .client-fold-arrow.is-open {
          transform: rotate(90deg);
          background: var(--ym-indigo, #484DCF);
          color: #fff;
        }
        .client-body[data-collapsed="1"] {
          display: none !important;
        }
        @media (max-width: 900px) {
          .client-head.client-fold-head {
            grid-template-columns: 30px 1fr auto !important;
          }
        }
      `;
      document.head.append(style);
    }

    function enhanceCard(card) {
      const head = card.querySelector('.client-head');
      const body = card.querySelector('.client-body');
      if (!head || !body) return;

      head.querySelectorAll('.client-view-btn').forEach((button) => button.remove());
      head.classList.add('client-fold-head');

      let arrow = head.querySelector('.client-fold-arrow');
      if (!arrow) {
        body.dataset.collapsed = '1';
        arrow = document.createElement('button');
        arrow.type = 'button';
        arrow.className = 'client-fold-arrow';
        arrow.textContent = '›';
        arrow.setAttribute('aria-label', 'Abrir detalhes do cliente');
        arrow.setAttribute('aria-expanded', 'false');
        head.prepend(arrow);

        arrow.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          const isClosed = body.dataset.collapsed === '1';

          if (isClosed) {
            delete body.dataset.collapsed;
            arrow.classList.add('is-open');
            arrow.setAttribute('aria-expanded', 'true');
            arrow.setAttribute('aria-label', 'Recolher detalhes do cliente');
          } else {
            body.dataset.collapsed = '1';
            arrow.classList.remove('is-open');
            arrow.setAttribute('aria-expanded', 'false');
            arrow.setAttribute('aria-label', 'Abrir detalhes do cliente');
          }
        });
      }

      const isOpen = body.dataset.collapsed !== '1';
      arrow.classList.toggle('is-open', isOpen);
      arrow.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    function apply() {
      document.querySelectorAll('.client-card').forEach(enhanceCard);
    }

    new MutationObserver(() => requestAnimationFrame(apply)).observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    setInterval(apply, 900);
    apply();
  }

  loadScript('/assets/crm15-runtime-core.js?v=20260813-1', 'ymRuntimeCore')
    .then(() => Promise.all([
      loadScript('/assets/crm15-kpi-click.js?v=20260813-5', 'ymPipelineKpi'),
      loadScript('/assets/crm15-clients-ui.js?v=20260813-3', 'ymClientsUi'),
      loadScript('/assets/crm15-client-kpi.js?v=20260813-1', 'ymClientKpi')
    ]))
    .then(startClientFoldFix)
    .catch((error) => console.error('CRM interaction layer', error));
})();

(() => {
  if (window.__crmUnifiedClientView) return;
  window.__crmUnifiedClientView = true;

  function clientId(card) {
    const source = [...card.querySelectorAll('button')].find((button) =>
      (button.getAttribute('onclick') || '').includes("CRMClients.openClient('")
    );
    return (source?.getAttribute('onclick') || '').match(/openClient\('([^']+)'\)/)?.[1] || null;
  }

  function open(clientId) {
    if (!clientId) return;
    window.location.assign('/CENTRAL/?client=' + encodeURIComponent(clientId));
  }

  function enhance(card) {
    const id = clientId(card);
    if (!id) return;

    const title = card.querySelector('.client-title');
    if (title && title.dataset.unifiedClient !== '1') {
      title.dataset.unifiedClient = '1';
      title.setAttribute('title', 'Abrir a visão completa e única deste cliente');
      title.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        open(id);
      };
    }

    const primary = card.querySelector('.central-ym-btn');
    if (primary) {
      primary.textContent = 'Visão completa do cliente';
      primary.setAttribute('title', 'Mesma visão oficial disponível na Central YM');
      primary.onclick = () => open(id);
    }
  }

  function apply() {
    document.querySelectorAll('.client-card').forEach(enhance);
  }

  new MutationObserver(() => requestAnimationFrame(apply)).observe(
    document.getElementById('leadList') || document.body,
    { childList: true, subtree: true }
  );
  setInterval(apply, 900);
  apply();

  window.CRMUnifiedClientView = { open };
})();

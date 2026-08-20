(() => {
  const BUILD = '2026-08-20-reading-copy-fix-1';
  let lastLeadId = null;

  function crmState() {
    try {
      if (typeof crm !== 'undefined') return crm;
    } catch {}
    return window.crm || null;
  }

  function value(id) {
    return document.getElementById(id)?.value ?? '';
  }

  function currentOpportunity(id) {
    const state = crmState();
    const original = state?.opportunities?.find((x) => x.id === id);
    if (!original) return null;

    const c = original.contact || {};
    const contact = {
      ...c,
      website_url: value('v3site_' + id) || c.website_url || '',
      instagram_url: value('v3ig_' + id) || c.instagram_url || '',
      linkedin_url: value('v3li_' + id) || c.linkedin_url || '',
      google_url: value('v3go_' + id) || c.google_url || '',
      other_url: value('v3ot_' + id) || c.other_url || ''
    };

    const observation = value('v3obs_' + id) || original.initial_reading_human_notes || original.notes || '';

    return {
      ...original,
      contact,
      notes: observation || original.notes || '',
      initial_reading_human_notes: observation
    };
  }

  async function copyNewPrompt(id) {
    const builder = window.YMReadingPromptV2?.buildReadingPrompt;
    if (typeof builder !== 'function') {
      window.YM?.toast?.('O novo prompt da Leitura ainda não carregou. Atualize a página e tente novamente.', true);
      return;
    }

    const opportunity = currentOpportunity(id);
    if (!opportunity) {
      window.YM?.toast?.('Não foi possível localizar os dados deste lead.', true);
      return;
    }

    const prompt = builder(opportunity);

    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const area = document.createElement('textarea');
      area.value = prompt;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }

    window.YM?.toast?.('Prompt correto copiado: mensagens + imagem final.');
  }

  document.addEventListener('click', (event) => {
    const card = event.target.closest?.('.lead-card[id^="lead_"]');
    if (card) lastLeadId = card.id.replace('lead_', '');

    const popupCopy = event.target.closest?.('#crmSavePop [data-copy]');
    if (!popupCopy) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const id = lastLeadId || document.querySelector('.lead-card[open]')?.id?.replace('lead_', '') || localStorage.getItem('ym.crm.lastLead');
    if (!id) {
      window.YM?.toast?.('Não foi possível identificar o lead desta leitura.', true);
      return;
    }

    copyNewPrompt(id).finally(() => document.getElementById('crmSavePop')?.remove());
  }, true);

  const observer = new MutationObserver(() => {
    const button = document.querySelector('#crmSavePop [data-copy]');
    if (button) {
      button.textContent = 'Copiar prompt imagem + mensagens';
      button.title = 'Copia o novo prompt oficial da Leitura Inicial';
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  window.YMReadingCopyFix = { version: BUILD, copyNewPrompt };
})();

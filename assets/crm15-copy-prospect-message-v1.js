(() => {
  const BUILD = '2026-08-20-prospect-message-v1';

  function getState() {
    try { return crm || null; } catch { return window.crm || null; }
  }

  function getOpportunity(id) {
    return (getState()?.opportunities || []).find((x) => x.id === id);
  }

  function firstName(fullName) {
    const clean = String(fullName || '').trim();
    return clean ? clean.split(/\s+/)[0] : '';
  }

  function buildMessage(o) {
    const c = o?.contact || {};
    const company = String(c.business_name || c.name || '').trim() || 'empresa';
    const decisionMaker = firstName(c.decision_maker);
    const greeting = decisionMaker ? `Oi, ${decisionMaker}! Tudo bem?` : 'Oi! Tudo bem?';

    return `${greeting} Sou Yasmin, fundadora da YM Marketing & Negócios.\n\nEstava conhecendo melhor a ${company} e me chamou atenção o que vocês já construíram em presença, autoridade e comunicação.\n\nFiz uma leitura rápida de 1 página olhando justamente para esses ativos e para como eles podem trabalhar ainda mais conectados ao longo da jornada de quem conhece a empresa, entende o que vocês entregam e decide avançar para uma conversa.\n\nEstou te enviando aqui. 👇\n\nDepois que olhar, queria te fazer só uma pergunta:\n\nvocê se reconhece nessa leitura?\n\nSe fizer sentido para o momento da ${company}, o Raio-X Estratégico aprofunda esse mapa e ajuda a enxergar com mais clareza o que já merece ser preservado, melhor aproveitado e priorizado daqui para frente.`;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
  }

  async function copyMessage(id) {
    const o = getOpportunity(id);
    if (!o) {
      window.YM?.toast?.('Não foi possível localizar os dados deste lead.', true);
      return;
    }
    await copyText(buildMessage(o));
    window.YM?.toast?.('Mensagem personalizada copiada.');
  }

  function addButton(card) {
    if (!card || card.dataset.prospectMessageV1 === '1') return;
    const id = card.id?.replace('lead_', '');
    if (!id) return;

    const reading = card.querySelector('.editor.reading');
    if (!reading) return;

    const wrap = document.createElement('div');
    wrap.className = 'ym-actions prospect-message-actions';
    wrap.style.marginTop = '8px';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ym-btn secondary';
    btn.textContent = 'Copiar mensagem de envio';
    btn.title = 'Copia a mensagem oficial da Leitura Inicial já personalizada';
    btn.addEventListener('click', () => copyMessage(id));

    wrap.appendChild(btn);
    reading.appendChild(wrap);
    card.dataset.prospectMessageV1 = '1';
  }

  function apply() {
    document.querySelectorAll('details.lead-card[id^="lead_"]').forEach(addButton);
  }

  function install() {
    window.YMProspectMessageV1 = { buildMessage, copyMessage, version: BUILD };
    apply();
    const list = document.getElementById('leadList');
    if (list) {
      new MutationObserver(() => requestAnimationFrame(apply)).observe(list, {
        childList: true,
        subtree: true
      });
    }
    setInterval(apply, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();

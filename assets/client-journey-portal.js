(() => {
  if (window.ClientJourneyPortal) return;
  const E = (value) => String(value ?? '').replace(/[&<>"']/g, '');
  const labels = { CONCLUIDA:'Concluída', EM_ANDAMENTO:'Em andamento', PULADA:'Etapa pulada', PLANEJADA:'Planejada', PAUSADA:'Pausada' };

  function styles() {
    if (document.getElementById('clientJourneyPortalStyles')) return;
    const style = document.createElement('style'); style.id = 'clientJourneyPortalStyles'; style.textContent = `
      .cpj-intro{margin-bottom:15px;padding:13px 15px;border-radius:14px;background:#eef2ff;color:#43506a;font-size:10px;line-height:1.6}.cpj-intro b{color:#0a2540}.cpj-track{display:flex;align-items:stretch;overflow-x:auto;padding:10px 2px 20px;scrollbar-width:thin}.cpj-step{position:relative;flex:0 0 220px;padding-right:26px}.cpj-step:not(:last-child):after{content:"";position:absolute;left:26px;right:0;top:20px;height:3px;background:#dce4ed}.cpj-node{position:relative;z-index:2;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;border:3px solid #aebcc9;background:#fff;color:#718294;font:900 11px Montserrat}.cpj-step.CONCLUIDA .cpj-node{background:#238a68;border-color:#238a68;color:#fff}.cpj-step.EM_ANDAMENTO .cpj-node{background:#484dcf;border-color:#484dcf;color:#fff;box-shadow:0 0 0 6px #eaebff}.cpj-step.PULADA .cpj-node{background:#fff8e9;border-color:#e2a600;color:#946500}.cpj-step.PAUSADA .cpj-node{background:#f2f5f7;border-color:#7a8b99}.cpj-step.future .cpj-node{border-style:dashed;background:#f8fafc}.cpj-copy{padding:10px 8px 0 0}.cpj-copy b{display:block;font:800 11px/1.35 Montserrat;color:#0a2540}.cpj-copy p{font-size:9px;line-height:1.5;color:#687b8e;margin:5px 0}.cpj-status{display:inline-flex;border-radius:999px;padding:5px 7px;background:#edf1f5;color:#5f7183;font-size:7px;font-weight:900}.cpj-step.CONCLUIDA .cpj-status{background:#e7f7f1;color:#187055}.cpj-step.EM_ANDAMENTO .cpj-status{background:#ebecff;color:#393fb4}.cpj-step.PULADA .cpj-status{background:#fff3d8;color:#946400}.cpj-empty{padding:25px;border:1px dashed #cbd6e1;border-radius:14px;text-align:center;color:#6e8194;font-size:10px}@media(max-width:700px){.cpj-step{flex-basis:185px}}
    `; document.head.append(style);
  }

  async function api(clientId) {
    const { data } = await window.CentralYMClientPortal.sb.auth.getSession();
    const session = data.session;
    if (!session) throw new Error('Sessão necessária.');
    const response = await fetch(window.CentralYMClientPortal.SUPABASE_URL + '/functions/v1/client-journey', { method:'POST', headers:{ Authorization:'Bearer ' + session.access_token, apikey:window.CentralYMClientPortal.PUBLISHABLE_KEY, 'Content-Type':'application/json' }, body:JSON.stringify({ action:'GET_JOURNEY', client_id:clientId }) });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.detail || json.error || 'Falha ao carregar a jornada.');
    return json;
  }

  function render(root, steps) {
    const rows = [...steps, { title:'Próxima etapa', description:'Ainda não mapeada. Ela será definida a partir das próximas decisões da jornada.', status:'PLANEJADA', future:true }];
    root.innerHTML = `<div class="cpj-intro"><b>Sua trilha com a YM.</b> Aqui você acompanha o que já aconteceu, o que está em andamento e etapas que não fizeram parte do caminho até agora. Nenhuma próxima etapa é presumida sem diagnóstico ou decisão conjunta.</div><article class="cp-card cp-panel"><div class="cpj-track">${rows.map((step, index) => `<div class="cpj-step ${E(step.status)} ${step.future ? 'future' : ''}"><div class="cpj-node">${step.future ? '?' : index + 1}</div><div class="cpj-copy"><b>${E(step.title)}</b><p>${E(step.description || '')}</p><span class="cpj-status">${step.future ? 'NÃO MAPEADA' : E(labels[step.status] || step.status)}</span></div></div>`).join('')}</div></article>`;
  }

  async function load() {
    styles();
    const root = document.getElementById('clientJourneyRoot');
    const portal = window.CentralYMClientPortal?.data;
    if (!root || !portal?.client?.id) return;
    root.innerHTML = '<div class="cpj-empty">Carregando sua jornada…</div>';
    try { const json = await api(portal.client.id); render(root, json.steps || []); }
    catch (error) { root.innerHTML = `<div class="cpj-empty">${E(error.message)}</div>`; }
  }

  let loadedClient = '', loading = false;
  const initialLoad = async () => { const id = window.CentralYMClientPortal?.data?.client?.id || ''; if (!id || loading || loadedClient === id) return; loading = true; await load(); loadedClient = id; loading = false; };
  const observer = new MutationObserver(initialLoad);
  observer.observe(document.body, { childList:true, subtree:true });
  document.addEventListener('click', (event) => { if (event.target.closest?.('[data-nav="jornada"]')) setTimeout(load, 0); });
  window.ClientJourneyPortal = { load };
  setTimeout(initialLoad, 500);
})();

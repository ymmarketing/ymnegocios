(() => {
  if (window.ClientJourneyAdmin) return;
  const E = (value) => window.YM?.esc ? YM.esc(value) : String(value ?? '').replace(/[&<>"']/g, '');
  const statusLabel = { CONCLUIDA:'Concluída', EM_ANDAMENTO:'Em andamento', PULADA:'Pulada', PLANEJADA:'Planejada', PAUSADA:'Pausada' };
  const sourceLabel = { SISTEMA:'Sistema', METODO_VOS:'Método VOS', SOLICITACAO_CLIENTE:'Solicitação do cliente', CONTRATO:'Contrato', MANUAL:'Manual' };
  const date = (value) => value ? new Date(value).toLocaleDateString('pt-BR') : '';
  const state = new Map();

  const CHECKLISTS = [
    { key:'RAIOX', label:'Raio-X Estratégico', match:['raio-x','raiox'], items:['Dados básicos e contexto do negócio','Produtos/serviços, ticket e objetivo atual','Jornada comercial e canais utilizados','Links públicos e ativos digitais','Prints ou evidências voluntárias quando existirem','Não solicitar senhas, tokens ou acessos administrativos'] },
    { key:'PROPOSTA', label:'Proposta Comercial', match:['proposta'], items:['Contexto encontrado no Raio-X','Escopo e limites da entrega','Prazo e próximos marcos','Responsabilidades da YM e do cliente','Investimento e condição comercial','Próximo passo para aceite'] },
    { key:'CONTRATO', label:'Contrato + D0', match:['contrato','d0','pagamento'], items:['Contrato assinado','Pagamento ou condição financeira validada','Autorização para acessos operacionais prevista','Regras de dados e confidencialidade contempladas','Cliente convertido para Cliente Ativo','D0 registrado como início oficial da Fundação'] },
    { key:'ONBOARDING', label:'Onboarding + Cadastro', match:['onboarding','cadastro'], items:['Ficha única do cliente criada','Área do Cliente liberada','Responsável e decisor identificados','Produtos/serviços e objetivo principal confirmados','Dados comerciais e financeiros solicitados','Projeto criado com prazo e marcos'] },
    { key:'ACESSOS', label:'Solicitação de acessos', match:['acesso','reportei','integra'], items:['Canais relevantes mapeados','Reportei vinculado ao projeto correto','Meta/Instagram/Facebook conectados quando aplicável','Google, site, CRM e demais fontes solicitados','Preferir convite, OAuth ou usuário revogável','Pendências e responsáveis registrados'] },
    { key:'KICKOFF', label:'Kickoff', match:['kickoff','kick-off'], items:['Onboarding revisado antes da reunião','Objetivo principal e meta confirmados','Jornada atual validada com o cliente','Dados faltantes e acessos pendentes identificados','Cronograma e responsabilidades alinhados','Kickoff não utilizado para fechar diagnóstico prematuro'] },
    { key:'BASELINE', label:'Baseline', match:['baseline'], items:['Período anterior à primeira intervenção definido','30 a 90 dias coletados quando disponíveis','Faturamento/vendas/leads/conversão registrados quando aplicáveis','Dados digitais sincronizados pelas fontes disponíveis','Qualidade e período dos dados conferidos','Fotografia inicial congelada antes da intervenção'] },
    { key:'VER', label:'VER', match:['ver','diagnóstico','diagnostico'], items:['Raio-X, onboarding e kickoff disponíveis','Dados internos mínimos do negócio validados','Canais e evidências relevantes analisados','8Ps cobertos com evidência e fonte','Hipóteses testadas quando houver disfunção','Limitações e dados ausentes explicitados antes da conclusão'] },
    { key:'ORDENAR', label:'ORDENAR', match:['ordenar','prioridade'], items:['Gate VER aprovado por decisão humana','Gargalo priorizado definido','Hipótese de intervenção registrada','Ação proposta vinculada ao problema','KPI primário, secundário e de negócio definidos','Janela esperada de avaliação registrada'] },
    { key:'IMPLEMENTACAO', label:'Implementação', match:['implement','execução','execucao','ação','acao'], items:['Ação priorizada no ORDENAR','Responsável e data definidos','Hipótese preservada no registro','KPIs relacionados vinculados','Evidência da implementação registrada','Mudança não contaminou o baseline original'] },
    { key:'SUSTENTAR', label:'SUSTENTAR', match:['sustentar','sustentação','sustentacao','acompanhamento'], items:['Medição pós-ação realizada na janela correta','Baseline comparado com período atual','KPI principal avaliado antes de métricas de vaidade','Resultado classificado: ganho/estável/atenção/em avaliação','Aprendizado e próxima decisão registrados','Performance individual alimentando a visão macro da carteira'] },
    { key:'PERFORMANCE', label:'Performance VOS', match:['performance','resultado','kpi'], items:['Baseline válido identificado','KPI principal do cliente definido','Última medição disponível','Ações relevantes vinculadas aos KPIs','Status de evolução atualizado','Visão individual e visão geral lendo a mesma base'] }
  ];

  const GENERIC_CHECKLIST = { label:'Checklist da etapa', items:['Objetivo da etapa está claro','Dados e evidências necessários estão disponíveis','Responsável e prazo estão definidos','Pendências foram registradas','Critério para concluir a etapa está claro','Próximo marco foi definido'] };

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  }

  function checklistFor(step) {
    const title = normalize(step?.title);
    return CHECKLISTS.find((group) => group.match.some((term) => title.includes(normalize(term)))) || GENERIC_CHECKLIST;
  }

  function styles() {
    if (document.getElementById('clientJourneyAdminStyles')) return;
    const style = document.createElement('style');
    style.id = 'clientJourneyAdminStyles';
    style.textContent = `
      .cja-head{display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:12px}.cja-head>div:first-child{flex:1;min-width:240px}.cja-head h3{font:800 13px Montserrat;color:#0a2540;margin:0 0 5px}.cja-head p{font-size:9px;line-height:1.5;color:#6b7c91;margin:0}.cja-actions{display:flex;gap:7px;flex-wrap:wrap}
      .cja-track{display:flex;align-items:stretch;gap:0;overflow-x:auto;padding:8px 2px 15px;scrollbar-width:thin}.cja-step{position:relative;flex:0 0 210px;padding-right:25px}.cja-step:not(:last-child):after{content:"";position:absolute;left:25px;right:0;top:18px;height:3px;background:#dce5ee}.cja-node{position:relative;z-index:2;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#fff;border:3px solid #aebdca;color:#6d7f91;font:900 10px Montserrat}.cja-step.CONCLUIDA .cja-node{background:#238a68;border-color:#238a68;color:#fff}.cja-step.EM_ANDAMENTO .cja-node{background:#484dcf;border-color:#484dcf;color:#fff;box-shadow:0 0 0 5px #e9eaff}.cja-step.PULADA .cja-node{background:#fff8ea;border-color:#e2a600;color:#936800}.cja-step.PAUSADA .cja-node{background:#f4f6f8;border-color:#7c8d9c;color:#526372}.cja-step.future .cja-node{border-style:dashed;background:#f8fafc;color:#9aa9b7}
      .cja-copy{padding:9px 8px 0 0}.cja-copy b{display:block;font:800 10px/1.3 Montserrat;color:#0a2540}.cja-copy small{display:block;font-size:7.5px;color:#718497;margin-top:4px;line-height:1.4}.cja-badge{display:inline-flex;margin-top:6px;border-radius:999px;padding:4px 6px;background:#eef2f6;color:#52697e;font-size:6.8px;font-weight:900}.cja-step.CONCLUIDA .cja-badge{background:#e7f7f1;color:#187055}.cja-step.EM_ANDAMENTO .cja-badge{background:#ebecff;color:#393fb4}.cja-step.PULADA .cja-badge{background:#fff3d8;color:#946400}.cja-step-tools{display:flex;gap:8px;flex-wrap:wrap;margin-top:7px}.cja-step-tools button{border:0;background:transparent;font-size:7.5px;font-weight:800;padding:0;cursor:pointer}.cja-step-tools .cja-checklist-link{color:#484dcf}.cja-step-tools .cja-delete-link{color:#a43c3c}
      .cja-summary{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}.cja-summary span{border-radius:9px;background:#eef3f8;color:#52697e;padding:7px 9px;font-size:8px}.cja-summary b{color:#0a2540}.cja-form{display:none;background:#fff;border:1px solid #dce5ee;border-radius:13px;padding:12px;margin-top:10px}.cja-form.on{display:block}.cja-formgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.cja-formgrid .wide{grid-column:1/-1}.cja-check{display:flex;align-items:center;gap:7px;font-size:9px;color:#0a2540}.cja-empty{padding:22px;border:1px dashed #c9d6e2;border-radius:12px;text-align:center;font-size:9px;color:#718497}
      .cja-checklist-back{position:fixed;inset:0;z-index:9999;background:rgba(10,37,64,.34);display:flex;justify-content:flex-end}.cja-checklist-panel{width:min(430px,94vw);height:100%;overflow:auto;background:#fff;box-shadow:-16px 0 45px rgba(10,37,64,.18);padding:18px}.cja-checklist-panel header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding-bottom:12px;border-bottom:1px solid #e2e8ef}.cja-checklist-panel h3{font:800 16px Montserrat;color:#0a2540;margin:3px 0}.cja-checklist-panel p{font-size:9px;line-height:1.5;color:#6b7c91;margin:0}.cja-checklist-close{border:0;background:#eef2f6;color:#0a2540;border-radius:9px;width:32px;height:32px;font-size:18px;cursor:pointer}.cja-checklist-status{display:inline-flex;border-radius:999px;background:#eef0ff;color:#3f45b9;padding:5px 8px;font-size:7px;font-weight:900;margin-top:9px}.cja-checklist-list{display:grid;gap:8px;margin-top:14px}.cja-checklist-item{display:grid;grid-template-columns:24px 1fr;gap:9px;align-items:flex-start;border:1px solid #e1e8ef;border-radius:10px;padding:10px;background:#fbfdff}.cja-checklist-mark{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#eef0ff;color:#484dcf;font-weight:900;font-size:10px}.cja-checklist-item b{display:block;font-size:9.5px;color:#17364f;line-height:1.45}.cja-checklist-note{margin-top:13px;border:1px solid #efd39f;background:#fff9ed;color:#75530d;border-radius:10px;padding:10px;font-size:9px;line-height:1.5}.cja-checklist-all-group{border:1px solid #dfe6ee;border-radius:12px;margin-top:10px;overflow:hidden}.cja-checklist-all-group h4{font:800 10px Montserrat;color:#0a2540;margin:0;padding:10px 11px;background:#f5f8fb}.cja-checklist-all-group ul{margin:0;padding:9px 12px 10px 28px}.cja-checklist-all-group li{font-size:8.6px;color:#52697e;line-height:1.5;margin:3px 0}
      @media(max-width:760px){.cja-formgrid{grid-template-columns:1fr}.cja-formgrid .wide{grid-column:auto}.cja-step{flex-basis:185px}.cja-checklist-panel{width:100vw}}
    `;
    document.head.append(style);
  }

  async function api(body) {
    const session = await YM.requireSession('/CENTRAL');
    if (!session) throw new Error('Sessão necessária.');
    const response = await fetch(YM.SUPABASE_URL + '/functions/v1/client-journey', {
      method:'POST',
      headers:{ Authorization:'Bearer ' + session.access_token, apikey:YM.PUBLISHABLE_KEY, 'Content-Type':'application/json' },
      body:JSON.stringify(body),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.detail || json.error || 'Falha ao carregar a jornada.');
    return json;
  }

  function closeChecklist() {
    document.getElementById('cjaChecklistBack')?.remove();
  }

  function openChecklist(step) {
    closeChecklist();
    const data = checklistFor(step);
    const back = document.createElement('div');
    back.id = 'cjaChecklistBack';
    back.className = 'cja-checklist-back';
    back.innerHTML = `<aside class="cja-checklist-panel"><header><div><div class="ym-eyebrow">CONSULTA DO APLICADOR</div><h3>${E(data.label)}</h3><p>Use esta lista como lembrete antes de concluir a etapa. Ela não substitui os gates automáticos do MOTOR VOS.</p>${step ? `<span class="cja-checklist-status">${E(statusLabel[step.status] || step.status || 'Etapa')}</span>` : ''}</div><button class="cja-checklist-close" data-checklist-close>×</button></header><div class="cja-checklist-list">${data.items.map((item) => `<div class="cja-checklist-item"><span class="cja-checklist-mark">✓</span><div><b>${E(item)}</b></div></div>`).join('')}</div><div class="cja-checklist-note"><b>Antes de avançar:</b> se um item crítico estiver ausente, registre a pendência e não trate a etapa como concluída apenas para seguir o cronograma.</div></aside>`;
    document.body.append(back);
    back.querySelector('[data-checklist-close]').onclick = closeChecklist;
    back.onclick = (event) => { if (event.target === back) closeChecklist(); };
  }

  function openAllChecklists() {
    closeChecklist();
    const back = document.createElement('div');
    back.id = 'cjaChecklistBack';
    back.className = 'cja-checklist-back';
    back.innerHTML = `<aside class="cja-checklist-panel"><header><div><div class="ym-eyebrow">JORNADA OFICIAL YM</div><h3>Checklist geral dos gates</h3><p>Consulta rápida da sequência Raio-X → Fundação → Performance VOS.</p></div><button class="cja-checklist-close" data-checklist-close>×</button></header>${CHECKLISTS.map((group) => `<section class="cja-checklist-all-group"><h4>${E(group.label)}</h4><ul>${group.items.map((item) => `<li>${E(item)}</li>`).join('')}</ul></section>`).join('')}</aside>`;
    document.body.append(back);
    back.querySelector('[data-checklist-close]').onclick = closeChecklist;
    back.onclick = (event) => { if (event.target === back) closeChecklist(); };
  }

  function timeline(steps) {
    const rows = [...steps, { id:'NEXT_UNMAPPED', title:'Próxima etapa', description:'Ainda não mapeada. Será definida a partir do Motor VOS ou de uma nova solicitação do cliente.', status:'PLANEJADA', source_type:'SISTEMA', future:true }];
    return `<div class="cja-track">${rows.map((step, index) => `<article class="cja-step ${E(step.status)} ${step.future ? 'future' : ''}"><div class="cja-node">${step.future ? '?' : index + 1}</div><div class="cja-copy"><b>${E(step.title)}</b><small>${E(step.description || '')}</small>${step.started_at ? `<small>${date(step.started_at)}${step.completed_at && step.completed_at !== step.started_at ? ' → ' + date(step.completed_at) : ''}</small>` : ''}<span class="cja-badge">${step.future ? 'NÃO MAPEADA' : E(statusLabel[step.status] || step.status)}</span>${!step.future ? `<small>Origem: ${E(sourceLabel[step.source_type] || step.source_type)}</small><div class="cja-step-tools"><button class="cja-checklist-link" data-journey-checklist="${E(step.id)}">Consultar checklist</button>${['MANUAL','SOLICITACAO_CLIENTE'].includes(step.source_type) ? `<button class="cja-delete-link" data-journey-delete="${step.id}">Excluir marco manual</button>` : ''}</div>` : ''}</div></article>`).join('')}</div>`;
  }

  function form(steps) {
    const nextOrder = Math.max(100, ...steps.map((step) => Number(step.sequence_order) || 0)) + 10;
    return `<section class="cja-form" data-journey-form><div class="cja-formgrid"><div><label class="ym-label">Título da etapa</label><input class="ym-input" data-jf="title" placeholder="Ex.: Nova campanha de aquisição"></div><div><label class="ym-label">Tipo</label><select class="ym-select" data-jf="step_type"><option value="MARCO">Marco</option><option value="SOLUCAO">Solução</option><option value="OUTRO">Outro</option></select></div><div><label class="ym-label">Status</label><select class="ym-select" data-jf="status"><option value="PLANEJADA">Planejada</option><option value="EM_ANDAMENTO">Em andamento</option><option value="CONCLUIDA">Concluída</option><option value="PAUSADA">Pausada</option><option value="PULADA">Pulada</option></select></div><div><label class="ym-label">Origem</label><select class="ym-select" data-jf="source_type"><option value="SOLICITACAO_CLIENTE">Solicitação do cliente</option><option value="MANUAL">Decisão interna / manual</option></select></div><div><label class="ym-label">Início</label><input class="ym-input" type="date" data-jf="started_at"></div><div><label class="ym-label">Ordem na trilha</label><input class="ym-input" type="number" data-jf="sequence_order" value="${nextOrder}"></div><div class="wide"><label class="ym-label">Descrição</label><textarea class="ym-textarea" data-jf="description" placeholder="O que foi solicitado, decidido ou entregue nesta etapa?"></textarea></div><div class="wide"><label class="cja-check"><input type="checkbox" data-jf="visible_to_client" checked> Exibir esta etapa na Área do Cliente</label></div><div class="wide"><button class="ym-btn" data-journey-save>Salvar etapa na trilha</button></div></div></section>`;
  }

  function render(clientId, root, steps) {
    state.set(clientId, steps);
    const current = [...steps].reverse().find((step) => step.status === 'EM_ANDAMENTO') || [...steps].reverse().find((step) => !['PULADA','PLANEJADA'].includes(step.status));
    root.innerHTML = `<div class="cja-head"><div><h3>Trilha de jornada do cliente</h3><p>Combina as etapas do método VOS com soluções contratadas e solicitações do cliente. Etapas não realizadas permanecem visíveis como puladas; a próxima só aparece quando for de fato mapeada.</p></div><div class="cja-actions"><button class="ym-btn secondary" data-journey-checklist-all>Checklist geral</button><button class="ym-btn secondary" data-journey-sync>Sincronizar dados reais</button><button class="ym-btn" data-journey-add>＋ Nova etapa</button></div></div><div class="cja-summary"><span>Etapa atual: <b>${E(current?.title || 'Ainda não definida')}</b></span><span>${steps.length} etapa(s) mapeada(s)</span></div>${steps.length ? timeline(steps) : '<div class="cja-empty">Nenhuma etapa registrada. Sincronize os dados reais do cliente para iniciar a trilha.</div>'}${form(steps)}`;
    root.querySelector('[data-journey-checklist-all]').onclick = openAllChecklists;
    root.querySelector('[data-journey-add]').onclick = () => root.querySelector('[data-journey-form]').classList.toggle('on');
    root.querySelectorAll('[data-journey-checklist]').forEach((button) => { button.onclick = () => openChecklist(steps.find((step) => String(step.id) === String(button.dataset.journeyChecklist))); });
    root.querySelector('[data-journey-sync]').onclick = async (event) => {
      const button = event.currentTarget; button.disabled = true; button.textContent = 'Sincronizando…';
      try { const json = await api({ action:'SYNC_JOURNEY', client_id:clientId }); render(clientId, root, json.steps || []); YM.toast('Jornada sincronizada com CRM, Motor VOS e contratos.'); }
      catch (error) { YM.toast(error.message, true); button.disabled = false; button.textContent = 'Sincronizar dados reais'; }
    };
    root.querySelector('[data-journey-save]').onclick = async (event) => {
      const button = event.currentTarget; const get = (name) => root.querySelector(`[data-jf="${name}"]`); const title = get('title').value.trim();
      if (!title) { YM.toast('Informe o título da nova etapa.', true); return; }
      button.disabled = true;
      try {
        const json = await api({ action:'UPSERT_STEP', client_id:clientId, title, step_type:get('step_type').value, status:get('status').value, source_type:get('source_type').value, started_at:get('started_at').value || null, sequence_order:get('sequence_order').value, description:get('description').value, visible_to_client:get('visible_to_client').checked });
        render(clientId, root, json.steps || []); YM.toast('Etapa adicionada à jornada.');
      } catch (error) { YM.toast(error.message, true); button.disabled = false; }
    };
    root.querySelectorAll('[data-journey-delete]').forEach((button) => { button.onclick = async () => {
      if (!confirm('Excluir este marco manual da jornada?')) return;
      try { const json = await api({ action:'DELETE_STEP', client_id:clientId, id:button.dataset.journeyDelete }); render(clientId, root, json.steps || []); YM.toast('Marco manual removido.'); }
      catch (error) { YM.toast(error.message, true); }
    }; });
  }

  async function mount(clientId, pane) {
    styles();
    const root = pane?.querySelector?.('[data-client-journey-root]') || pane;
    if (!root || !clientId) return;
    root.innerHTML = '<div class="cja-empty">Carregando trilha da jornada…</div>';
    try {
      let json = await api({ action:'GET_JOURNEY', client_id:clientId });
      if (!(json.steps || []).length) json = await api({ action:'SYNC_JOURNEY', client_id:clientId });
      render(clientId, root, json.steps || []);
    } catch (error) { root.innerHTML = `<div class="cja-empty">${E(error.message)}</div>`; }
  }

  styles();
  window.ClientJourneyAdmin = { mount, api, openChecklist, openAllChecklists };
})();
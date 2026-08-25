(() => {
  if (window.ClientPerformanceAdmin) return;
  const E = (value) => window.YM?.esc ? YM.esc(value) : String(value ?? '').replace(/[&<>"']/g, '');
  const today = () => new Date().toISOString().slice(0, 10);
  const monthStart = () => today().slice(0, 7) + '-01';
  const monthEnd = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10); };
  const num = (value) => value == null || value === '' ? null : Number(value);
  const pretty = (value) => String(value || '—').replaceAll('_', ' ').toLowerCase().replace(/^./, (x) => x.toUpperCase());
  const options = (rows, selected = '') => rows.map(([value, label]) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${E(label)}</option>`).join('');
  let current = null;

  function injectStyles() {
    if (document.getElementById('perfAdminStyles')) return;
    const style = document.createElement('style');
    style.id = 'perfAdminStyles';
    style.textContent = `
      .perf-back{position:fixed;inset:0;background:rgba(4,22,38,.7);z-index:900;display:grid;place-items:center;padding:14px}
      .perf-modal{width:min(1180px,100%);max-height:95vh;background:#f5f8fc;border-radius:21px;overflow:hidden;box-shadow:0 35px 90px rgba(0,0,0,.3)}
      .perf-modal>header{background:linear-gradient(135deg,#0a2540,#17466f 72%,#484dcf);color:#fff;padding:16px 18px;display:flex;justify-content:space-between;gap:12px;align-items:center}
      .perf-modal h2{font:800 17px Montserrat;margin:0}.perf-modal header small{display:block;color:#bdd0e0;font-size:8.5px;margin-top:4px}
      .perf-close{width:34px;height:34px;border:0;border-radius:9px;background:rgba(255,255,255,.13);color:#fff;font-size:21px;cursor:pointer}
      .perf-body{padding:14px;overflow:auto;max-height:calc(95vh - 72px)}.perf-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
      .perf-tabs button{border:1px solid #dce5f0;background:#fff;color:#617489;border-radius:9px;padding:8px 11px;font-size:9px;font-weight:800;cursor:pointer}.perf-tabs button.on{background:#0a2540;color:#fff;border-color:#0a2540}
      .perf-pane{display:none}.perf-pane.on{display:block}.perf-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:10px}
      .perf-stat,.perf-card,.perf-form{background:#fff;border:1px solid #dce5f0;border-radius:13px;padding:12px}.perf-stat b{display:block;font:800 20px Montserrat;color:#0a2540}.perf-stat span{font-size:8.5px;color:#6b7c91}
      .perf-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.perf-card h3,.perf-form h3{font:800 11px Montserrat;color:#0a2540;margin:0}.perf-card p{font-size:8.7px;line-height:1.5;color:#6b7c91;margin:5px 0}
      .perf-card-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.perf-badge{display:inline-flex;padding:5px 7px;border-radius:999px;background:#eef0ff;color:#4148a8;font-size:7.7px;font-weight:900;white-space:nowrap}.perf-badge.ok{background:#eaf8f2;color:#137a5b}.perf-badge.warn{background:#fff5df;color:#8b5b12}.perf-badge.muted{background:#eef2f6;color:#657689}
      .perf-values{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:9px}.perf-values div{background:#f3f6fa;border-radius:9px;padding:8px}.perf-values small{display:block;font-size:7px;text-transform:uppercase;color:#8998a7;font-weight:900}.perf-values b{display:block;font-size:9px;color:#0a2540;margin-top:3px}
      .perf-progress{height:6px;background:#e9edf4;border-radius:99px;overflow:hidden;margin-top:8px}.perf-progress i{display:block;height:100%;background:linear-gradient(90deg,#484dcf,#137a5b)}
      .perf-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.perf-btn{border:0;border-radius:9px;padding:8px 10px;background:#484dcf;color:#fff;font-size:8.5px;font-weight:800;cursor:pointer}.perf-btn.secondary{background:#fff;color:#0a2540;border:1px solid #dce5f0}.perf-btn:disabled{opacity:.5}
      .perf-form{margin-bottom:10px}.perf-formgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:9px}.perf-wide{grid-column:1/-1}.perf-label{display:block;font-size:8px;font-weight:800;color:#0a2540;margin-bottom:4px}.perf-input,.perf-select,.perf-textarea{width:100%;border:1px solid #dce5f0;border-radius:9px;background:#fff;padding:9px;font-size:9.5px;color:#20384d}.perf-textarea{min-height:70px;resize:vertical}
      .perf-empty{padding:24px;text-align:center;border:1px dashed #c9d5e0;border-radius:12px;color:#6b7c91;font-size:9.5px;background:rgba(255,255,255,.7)}.perf-timeline{display:grid;gap:8px}.perf-action{border-left:4px solid #484dcf}.perf-note{font-size:8.5px;line-height:1.5;color:#6b7c91;background:#eef3f8;border-radius:9px;padding:9px;margin-bottom:9px}
      @media(max-width:800px){.perf-kpis,.perf-grid{grid-template-columns:1fr 1fr}.perf-formgrid{grid-template-columns:1fr}.perf-wide{grid-column:auto}}@media(max-width:520px){.perf-kpis,.perf-grid{grid-template-columns:1fr}.perf-values{grid-template-columns:1fr}}
    `;
    document.head.append(style);
  }

  async function api(body) {
    const session = await YM.requireSession();
    if (!session) throw new Error('Sessão necessária.');
    const response = await fetch(YM.SUPABASE_URL + '/functions/v1/performance-admin', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + session.access_token, apikey: YM.PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.detail || json.error || 'Não foi possível atualizar a performance.');
    return json;
  }

  function clientName(data) {
    const contact = data?.client?.contact || {};
    return contact.business_name || contact.name || 'Cliente';
  }
  function latest(kpi, data) {
    return [...(data.measurements || [])].filter((x) => x.kpi_id === kpi.id && !x.is_baseline).sort((a, b) => String(b.period_start).localeCompare(String(a.period_start)))[0] || null;
  }
  function format(value, unit) {
    if (value == null || value === '') return '—';
    if (unit === 'MOEDA') return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (unit === 'PERCENTUAL') return Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%';
    if (unit === 'BOOLEANO') return Number(value) ? 'Sim' : 'Não';
    return Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }
  function status(kpi, value) {
    if (value == null) return ['Sem medição', 'muted'];
    if (kpi.direction === 'FAIXA_IDEAL') {
      const ok = kpi.ideal_min_value != null && kpi.ideal_max_value != null && Number(value) >= Number(kpi.ideal_min_value) && Number(value) <= Number(kpi.ideal_max_value);
      return [ok ? 'Na faixa' : 'Fora da faixa', ok ? 'ok' : 'warn'];
    }
    if (kpi.target_value == null) return ['Medido', 'muted'];
    const ok = kpi.direction === 'MENOR_MELHOR' ? Number(value) <= Number(kpi.target_value) : Number(value) >= Number(kpi.target_value);
    return [ok ? 'Meta atingida' : 'Em evolução', ok ? 'ok' : 'warn'];
  }
  function progress(kpi, value) {
    if (value == null || kpi.target_value == null || Number(kpi.target_value) === 0) return 0;
    if (kpi.direction === 'MENOR_MELHOR') return Math.max(0, Math.min(100, (Number(kpi.target_value) / Math.max(Number(value), .0001)) * 100));
    return Math.max(0, Math.min(100, (Number(value) / Number(kpi.target_value)) * 100));
  }

  function summaryPane(data) {
    const measured = data.kpis.filter((k) => latest(k, data)).length;
    const targets = data.kpis.filter((k) => status(k, latest(k, data)?.value)[0] === 'Meta atingida' || status(k, latest(k, data)?.value)[0] === 'Na faixa').length;
    return `<div class="perf-kpis"><div class="perf-stat"><b>${data.kpis.length}</b><span>KPIs ativos</span></div><div class="perf-stat"><b>${measured}</b><span>KPIs com medição mensal</span></div><div class="perf-stat"><b>${targets}</b><span>Metas atingidas</span></div><div class="perf-stat"><b>${data.actions.length}</b><span>Ações registradas</span></div></div><div class="perf-note">A leitura conecta baseline, evolução mensal e ações implantadas. A proximidade temporal sustenta uma hipótese de contribuição, não prova causalidade isolada.</div>${kpiCards(data)}`;
  }
  function kpiCards(data) {
    if (!data.kpis.length) return '<div class="perf-empty">Cadastre o primeiro KPI de negócio deste cliente e registre o baseline atual.</div>';
    return `<div class="perf-grid">${data.kpis.map((kpi) => {
      const last = latest(kpi, data), s = status(kpi, last?.value);
      return `<article class="perf-card"><div class="perf-card-top"><div><div class="perf-badge muted">${E(pretty(kpi.category))} · ${E(pretty(kpi.periodicity))}</div><h3 style="margin-top:7px">${E(kpi.name)}</h3></div><span class="perf-badge ${s[1]}">${E(s[0])}</span></div><p>${E(kpi.description || 'Indicador de negócio acompanhado pela YM.')}</p><div class="perf-values"><div><small>Baseline</small><b>${format(kpi.baseline_value, kpi.unit)}</b></div><div><small>Atual</small><b>${format(last?.value, kpi.unit)}</b></div><div><small>Meta</small><b>${format(kpi.target_value, kpi.unit)}</b></div></div><div class="perf-progress"><i style="width:${progress(kpi, last?.value)}%"></i></div><div class="perf-actions"><button class="perf-btn" data-measure="${kpi.id}">＋ Medição mensal</button><button class="perf-btn secondary" data-edit-kpi="${kpi.id}">Editar KPI</button></div></article>`;
    }).join('')}</div>`;
  }
  function actionCards(data) {
    if (!data.actions.length) return '<div class="perf-empty">Nenhuma ação implantada registrada. Cadastre conteúdos, mudanças de perfil, site, CRM ou campanhas para formar a linha de evidências.</div>';
    return `<div class="perf-timeline">${data.actions.map((action) => `<article class="perf-card perf-action"><div class="perf-card-top"><div><span class="perf-badge">${E(pretty(action.action_type))}</span><h3 style="margin-top:7px">${E(action.title)}</h3></div><span class="perf-badge ${action.status === 'IMPLEMENTADA' ? 'ok' : 'muted'}">${E(pretty(action.status))}</span></div><p>${E(action.description || '')}</p>${action.hypothesis ? `<div class="perf-note"><b>Hipótese:</b> ${E(action.hypothesis)}</div>` : ''}<div class="perf-values"><div><small>Data</small><b>${E(new Date(action.action_date + 'T12:00:00').toLocaleDateString('pt-BR'))}</b></div><div><small>KPIs ligados</small><b>${action.kpi_links?.length || 0}</b></div><div><small>Janela</small><b>${action.kpi_links?.[0]?.attribution_window_days || action.expected_lag_days || 0} dias</b></div></div></article>`).join('')}</div>`;
  }
  function sourcesPane(data) {
    const reportei = data.sources.find((x) => x.provider === 'REPORTEI');
    return `<div class="perf-note"><b>Base técnica pronta:</b> fontes, mapeamento de métricas, histórico de sincronizações e referência segura de credenciais já estão separados dos KPIs. O Reportei será conectado na etapa final, sem trocar a fonte de verdade da Central YM.</div><div class="perf-grid"><article class="perf-card"><div class="perf-card-top"><h3>Entrada manual</h3><span class="perf-badge ok">Ativa</span></div><p>Baseline, metas e medições mensais podem ser preenchidos imediatamente.</p></article><article class="perf-card"><div class="perf-card-top"><h3>Reportei</h3><span class="perf-badge ${reportei?.status === 'ATIVO' ? 'ok' : 'muted'}">${E(pretty(reportei?.status || 'Planejado'))}</span></div><p>Conector desacoplado. Tokens nunca serão persistidos nas tabelas operacionais.</p></article></div>`;
  }

  function modalHtml(data, tab = 'resumo') {
    return `<div class="perf-back"><section class="perf-modal"><header><div><h2>Performance e Evidências · ${E(clientName(data))}</h2><small>Baseline → medições → ações → evolução observada</small></div><button class="perf-close">×</button></header><div class="perf-body"><div class="perf-tabs">${[['resumo','Resumo'],['kpis','KPIs e histórico'],['acoes','Ações implantadas'],['fontes','Fontes de dados']].map(([id, label]) => `<button data-perf-tab="${id}" class="${tab === id ? 'on' : ''}">${label}</button>`).join('')}</div><section id="perf_resumo" class="perf-pane ${tab === 'resumo' ? 'on' : ''}">${summaryPane(data)}</section><section id="perf_kpis" class="perf-pane ${tab === 'kpis' ? 'on' : ''}">${kpiForm()}${kpiCards(data)}</section><section id="perf_acoes" class="perf-pane ${tab === 'acoes' ? 'on' : ''}">${actionForm(data)}${actionCards(data)}</section><section id="perf_fontes" class="perf-pane ${tab === 'fontes' ? 'on' : ''}">${sourcesPane(data)}</section></div></section></div>`;
  }
  function field(id, label, type = 'text', value = '', extra = '') { return `<div><label class="perf-label" for="${id}">${label}</label><input id="${id}" class="perf-input" type="${type}" value="${E(value)}" ${extra}></div>`; }
  function kpiForm(kpi = {}) {
    return `<div class="perf-form"><h3>${kpi.id ? 'Editar KPI' : 'Novo KPI e baseline'}</h3><div class="perf-formgrid">${field('pkName','Nome do KPI','text',kpi.name || '', 'placeholder="Ex.: Leads qualificados"')}<div><label class="perf-label">Categoria</label><select id="pkCategory" class="perf-select">${options([['NEGOCIO','Negócio'],['COMERCIAL','Comercial'],['MARKETING','Marketing'],['CONTEUDO','Conteúdo'],['SITE','Site'],['REDES_SOCIAIS','Redes sociais'],['ATENDIMENTO','Atendimento'],['FINANCEIRO','Financeiro'],['OPERACAO','Operação'],['OUTRO','Outro']], kpi.category || 'NEGOCIO')}</select></div><div><label class="perf-label">Formato</label><select id="pkUnit" class="perf-select">${options([['NUMERO','Número'],['MOEDA','Moeda'],['PERCENTUAL','Percentual'],['QUANTIDADE','Quantidade'],['TEMPO_MINUTOS','Tempo em minutos'],['NOTA','Nota'],['INDICE','Índice']], kpi.unit || 'NUMERO')}</select></div><div><label class="perf-label">Direção desejada</label><select id="pkDirection" class="perf-select">${options([['MAIOR_MELHOR','Quanto maior, melhor'],['MENOR_MELHOR','Quanto menor, melhor'],['FAIXA_IDEAL','Faixa ideal']], kpi.direction || 'MAIOR_MELHOR')}</select></div>${field('pkBaseline','Baseline atual','number',kpi.baseline_value ?? '', 'step="any"')}${field('pkTarget','Meta','number',kpi.target_value ?? '', 'step="any"')}${field('pkBaseStart','Início do baseline','date',kpi.baseline_period_start || monthStart())}${field('pkBaseEnd','Fim do baseline','date',kpi.baseline_period_end || monthEnd())}${field('pkTargetEnd','Prazo da meta','date',kpi.target_period_end || '')}<div class="perf-wide"><label class="perf-label">Descrição / regra de cálculo</label><textarea id="pkDesc" class="perf-textarea">${E(kpi.description || '')}</textarea></div><div class="perf-wide"><label><input id="pkVisible" type="checkbox" ${kpi.visible_to_client === false ? '' : 'checked'}> <span style="font-size:9px">Visível na Área do Cliente</span></label></div></div><div class="perf-actions"><button id="pkSave" class="perf-btn" data-kpi-id="${kpi.id || ''}">Salvar KPI e baseline</button>${kpi.id ? '<button id="pkCancel" class="perf-btn secondary">Cancelar edição</button>' : ''}</div></div>`;
  }
  function actionForm(data) {
    return `<div class="perf-form"><h3>Registrar ação implantada</h3><div class="perf-formgrid">${field('paTitle','Ação','text','', 'placeholder="Ex.: Nova bio do Instagram"')}<div><label class="perf-label">Tipo</label><select id="paType" class="perf-select">${options([['CONTEUDO','Conteúdo'],['BIO_PERFIL','Bio / perfil'],['HOME_SITE','Home do site'],['SITE','Site'],['CTA','CTA'],['FUNIL','Funil'],['CRM','CRM'],['AUTOMACAO','Automação'],['OFERTA','Oferta'],['CAMPANHA','Campanha'],['MIDIA_PAGA','Mídia paga'],['PROCESSO','Processo'],['ATENDIMENTO','Atendimento'],['OUTRO','Outro']])}</select></div>${field('paDate','Data da implantação','date',today())}<div class="perf-wide"><label class="perf-label">KPIs que esperamos afetar</label><select id="paKpis" class="perf-select" multiple size="${Math.min(5, Math.max(2, data.kpis.length))}">${data.kpis.map((k) => `<option value="${k.id}">${E(k.name)}</option>`).join('')}</select></div><div class="perf-wide"><label class="perf-label">O que foi alterado</label><textarea id="paDesc" class="perf-textarea"></textarea></div><div class="perf-wide"><label class="perf-label">Hipótese verificável</label><textarea id="paHypothesis" class="perf-textarea" placeholder="Ex.: reduzir atrito deve elevar a taxa de conversão no período seguinte."></textarea></div>${field('paWindow','Janela de observação (dias)','number','30','min="1" max="365"')}${field('paEvidence','Link da evidência','url','', 'placeholder="https://..."')}<div><label class="perf-label">Visibilidade</label><label><input id="paVisible" type="checkbox" checked> <span style="font-size:9px">Mostrar ao cliente</span></label></div></div><button id="paSave" class="perf-btn" style="margin-top:9px">Registrar ação</button></div>`;
  }

  async function open(clientId, tab = 'resumo') {
    injectStyles();
    try {
      const json = await api({ action: 'GET_CLIENT', client_id: clientId });
      current = { clientId, data: json.data };
      render(tab);
    } catch (error) { YM.toast(error.message, true); }
  }
  function render(tab = 'resumo') {
    document.getElementById('perfAdminModal')?.remove();
    const shell = document.createElement('div'); shell.id = 'perfAdminModal'; shell.innerHTML = modalHtml(current.data, tab); document.body.append(shell);
    const close = () => shell.remove(); shell.querySelector('.perf-close').onclick = close; shell.querySelector('.perf-back').onclick = (e) => { if (e.target === e.currentTarget) close(); };
    shell.querySelectorAll('[data-perf-tab]').forEach((button) => button.onclick = () => setTab(button.dataset.perfTab));
    bindKpiForm(shell); bindActions(shell);
  }
  function setTab(tab) { document.querySelectorAll('[data-perf-tab]').forEach((x) => x.classList.toggle('on', x.dataset.perfTab === tab)); document.querySelectorAll('.perf-pane').forEach((x) => x.classList.toggle('on', x.id === 'perf_' + tab)); }
  async function refresh(tab) { const json = await api({ action: 'GET_CLIENT', client_id: current.clientId }); current.data = json.data; render(tab); }
  function bindKpiForm(root) {
    root.querySelector('#pkSave')?.addEventListener('click', async (event) => {
      const button = event.currentTarget; button.disabled = true;
      try {
        await api({ action:'UPSERT_KPI', client_id:current.clientId, id:button.dataset.kpiId || undefined, name:root.querySelector('#pkName').value, category:root.querySelector('#pkCategory').value, unit:root.querySelector('#pkUnit').value, direction:root.querySelector('#pkDirection').value, baseline_value:num(root.querySelector('#pkBaseline').value), target_value:num(root.querySelector('#pkTarget').value), baseline_period_start:root.querySelector('#pkBaseStart').value, baseline_period_end:root.querySelector('#pkBaseEnd').value, target_period_end:root.querySelector('#pkTargetEnd').value, description:root.querySelector('#pkDesc').value, visible_to_client:root.querySelector('#pkVisible').checked });
        YM.toast('KPI, baseline e meta salvos.'); await refresh('kpis');
      } catch (error) { YM.toast(error.message, true); button.disabled = false; }
    });
    root.querySelector('#pkCancel')?.addEventListener('click', () => refresh('kpis'));
    root.querySelectorAll('[data-edit-kpi]').forEach((button) => button.onclick = () => {
      const form = root.querySelector('#perf_kpis .perf-form'); const kpi = current.data.kpis.find((x) => x.id === button.dataset.editKpi); form.outerHTML = kpiForm(kpi); bindKpiForm(root); root.querySelector('#perf_kpis').scrollIntoView({ behavior:'smooth', block:'start' });
    });
    root.querySelectorAll('[data-measure]').forEach((button) => button.onclick = () => measurementModal(button.dataset.measure));
  }
  function measurementModal(kpiId) {
    const kpi = current.data.kpis.find((x) => x.id === kpiId); if (!kpi) return;
    const layer = document.createElement('div'); layer.id = 'perfMeasurement'; layer.innerHTML = `<div class="perf-back" style="z-index:920"><section class="perf-modal" style="width:min(620px,100%);max-height:90vh"><header><div><h2>Nova medição · ${E(kpi.name)}</h2><small>Registre o valor apurado e a evidência do período.</small></div><button class="perf-close">×</button></header><div class="perf-body"><div class="perf-formgrid">${field('pmValue','Valor apurado','number','', 'step="any"')}${field('pmStart','Início do período','date',monthStart())}${field('pmEnd','Fim do período','date',monthEnd())}${field('pmEvidence','Link da evidência','url','', 'placeholder="https://..."')}<div class="perf-wide"><label class="perf-label">Notas da medição</label><textarea id="pmNotes" class="perf-textarea"></textarea></div></div><button id="pmSave" class="perf-btn" style="margin-top:10px">Salvar medição</button></div></section></div>`; document.body.append(layer);
    const close = () => layer.remove(); layer.querySelector('.perf-close').onclick = close; layer.querySelector('.perf-back').onclick = (e) => { if (e.target === e.currentTarget) close(); };
    layer.querySelector('#pmSave').onclick = async (event) => { const button = event.currentTarget; button.disabled = true; try { await api({ action:'UPSERT_MEASUREMENT', client_id:current.clientId, kpi_id:kpi.id, value:num(layer.querySelector('#pmValue').value), period_start:layer.querySelector('#pmStart').value, period_end:layer.querySelector('#pmEnd').value, evidence_url:layer.querySelector('#pmEvidence').value, notes:layer.querySelector('#pmNotes').value }); close(); YM.toast('Medição mensal registrada.'); await refresh('kpis'); } catch (error) { YM.toast(error.message, true); button.disabled = false; } };
  }
  function bindActions(root) {
    root.querySelector('#paSave')?.addEventListener('click', async (event) => { const button = event.currentTarget; button.disabled = true; try { await api({ action:'UPSERT_ACTION', client_id:current.clientId, title:root.querySelector('#paTitle').value, action_type:root.querySelector('#paType').value, action_date:root.querySelector('#paDate').value, description:root.querySelector('#paDesc').value, hypothesis:root.querySelector('#paHypothesis').value, kpi_ids:[...root.querySelector('#paKpis').selectedOptions].map((x) => x.value), attribution_window_days:num(root.querySelector('#paWindow').value), evidence_url:root.querySelector('#paEvidence').value, visible_to_client:root.querySelector('#paVisible').checked }); YM.toast('Ação implantada registrada.'); await refresh('acoes'); } catch (error) { YM.toast(error.message, true); button.disabled = false; } });
  }

  function enhance() {
    document.querySelectorAll('.client-card').forEach((card) => {
      if (card.querySelector('[data-client-performance]')) return;
      const source = [...card.querySelectorAll('button')].find((x) => (x.getAttribute('onclick') || '').includes('CRMClients.openClient'));
      const id = (source?.getAttribute('onclick') || '').match(/openClient\('([^']+)'\)/)?.[1]; const actions = card.querySelector('.client-actions');
      if (!id || !actions) return; const button = document.createElement('button'); button.className = 'ym-btn secondary'; button.dataset.clientPerformance = id; button.textContent = 'Performance e evidências'; button.onclick = () => open(id); actions.append(button);
    });
    document.querySelectorAll('.ca-client').forEach((card) => {
      if (card.querySelector('[data-client-performance]')) return; const source = card.querySelector('[data-open-client]'); if (!source) return;
      const button = document.createElement('button'); button.className = 'ym-btn secondary'; button.dataset.clientPerformance = source.dataset.openClient; button.textContent = 'Performance'; button.style.marginLeft = '6px'; button.onclick = () => open(source.dataset.openClient); source.after(button);
    });
  }
  injectStyles(); new MutationObserver(() => requestAnimationFrame(enhance)).observe(document.body, { childList:true, subtree:true }); setInterval(enhance, 900); enhance();
  window.ClientPerformanceAdmin = { open, api };
})();

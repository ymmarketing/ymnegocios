(() => {
  const { STEPS, STATUS, STATUS_HELP } = window.RX_CONFIG;
  const SUPABASE_URL = 'https://srzdikgztpdtwbggwniz.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_OGZsWJSj2noU3Dd78pk48g__eEKE3xT';
  const sb = window.YM?.sb || window.supabase.createClient(SUPABASE_URL, PUBLISHABLE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const E = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const root = $('#rxRoot');
  let A = null, D = null, step = 'prep', saveTimer = null, saving = false, dirty = false, clients = [];

  /* ---------- números ---------- */
  const parse = (v) => { if (v == null) return null; let s = String(v).trim(); if (!s) return null; s = s.replace(/[R$\s%h]/gi, '').replace(/dias?/i, ''); if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.'); else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); const n = Number(s); return Number.isFinite(n) ? n : null; };
  const fmt = (n, unit) => { if (n == null || !Number.isFinite(n)) return '—'; if (unit === 'BRL') return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: Math.abs(n) >= 1000 ? 0 : 2 }); if (unit === 'PCT') return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%'; if (unit === 'DIAS') return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' dias'; if (unit === 'HORAS') return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' h'; return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 }); };
  const UNIT_HINT = { BRL: 'R$', PCT: '%', NUM: 'nº', DIAS: 'dias', HORAS: 'horas' };
  const allKpis = STEPS.flatMap((s) => (s.kpis || []).map((k) => ({ ...k, step: s.id })));
  const kpiByCode = Object.fromEntries(allKpis.map((k) => [k.code, k]));
  const kv = (code) => (D.kpis[code] ||= {});
  const getter = (col) => (code) => { const r = D.kpis[code]; if (!r || r[col + '_st'] === 'NAO_MONITORADO') return null; const k = kpiByCode[code]; const raw = parse(r[col]); if (raw != null) return raw; return k?.calc ? k.calc(getter(col)) : null; };
  const val = (code, col) => getter(col)(code);

  /* ---------- estado e salvamento ---------- */
  function blank() { return { meta: {}, kpis: {}, notes: {}, diag: {}, lists: {}, checks: {}, done: {}, calc: {}, published: {} }; }
  function normalize(d) { const b = blank(); d = d && typeof d === 'object' ? d : {}; for (const k of Object.keys(b)) b[k] = d[k] && typeof d[k] === 'object' ? d[k] : b[k]; return b; }
  function setStatus(t, cls = '') { const el = $('#rxSave'); if (el) { el.textContent = t; el.className = 'rx-save ' + cls; } }
  function touch() { dirty = true; setStatus('Alterações não salvas…', 'pending'); try { localStorage.setItem('rx-backup-' + A.id, JSON.stringify({ at: Date.now(), data: D })); } catch (e) {} clearTimeout(saveTimer); saveTimer = setTimeout(save, 900); }
  async function save() {
    if (!A || !dirty || saving) return; saving = true; dirty = false; setStatus('Salvando…', 'pending');
    const { error } = await sb.from('raiox_analyses').update({ data: D, title: A.title, status: A.status, client_id: A.client_id || null }).eq('id', A.id);
    saving = false;
    if (error) { dirty = true; setStatus('Não foi possível salvar. Tentando de novo…', 'err'); clearTimeout(saveTimer); saveTimer = setTimeout(save, 4000); return; }
    setStatus('Salvo às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), 'ok');
    if (dirty) { clearTimeout(saveTimer); saveTimer = setTimeout(save, 600); }
  }
  addEventListener('beforeunload', (e) => { if (dirty) { save(); e.preventDefault(); e.returnValue = ''; } });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });

  /* ---------- lista de análises ---------- */
  async function boot() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { location.replace('/interno?next=' + encodeURIComponent('/RAIOX' + location.search)); return; }
    const cq = await sb.from('crm_clients').select('id,status,contact:crm_contacts(name,business_name)').order('created_at', { ascending: false });
    clients = (cq.data || []).map((c) => ({ id: c.id, name: c.contact?.business_name || c.contact?.name || 'Cliente sem nome', status: c.status }));
    const id = new URLSearchParams(location.search).get('id');
    if (id) return open(id);
    listView();
  }
  const progressOf = (d) => { d = normalize(d); return Math.round(STEPS.filter((s) => d.done[s.id]).length / STEPS.length * 100); };
  const ST_LABEL = { EM_ANDAMENTO: 'Em andamento', EM_REVISAO: 'Em revisão', CONCLUIDO: 'Concluído', ARQUIVADO: 'Arquivado' };
  async function listView() {
    history.replaceState({}, '', '/RAIOX/');
    root.innerHTML = '<div class="rx-loading">Carregando análises…</div>';
    const { data, error } = await sb.from('raiox_analyses').select('id,title,status,client_id,updated_at,data').neq('status', 'ARQUIVADO').order('updated_at', { ascending: false });
    if (error) { root.innerHTML = `<div class="rx-empty">Não foi possível carregar as análises (${E(error.message)}).</div>`; return; }
    root.innerHTML = `
    <section class="rx-hero"><div><div class="ym-eyebrow">Raio-X Estratégico · Uso interno</div><h1>Análise do Raio-X</h1><p>Roteiro guiado para analisar receita, margem, produtos, clientes, funil, campanhas e redes sociais em três camadas: <b>Antes</b>, <b>Agora</b> e <b>Meta</b>. Tudo o que você preenche é salvo automaticamente.</p></div></section>
    <div class="rx-home">
      <article class="rx-card"><h2>Nova análise</h2><p class="rx-muted">Vincule a um cliente do CRM para depois levar os indicadores para a Área do Cliente.</p>
        <label class="rx-field"><span>Cliente do CRM</span><select id="rxNewClient"><option value="">— Sem vínculo (nome livre) —</option>${clients.map((c) => `<option value="${E(c.id)}">${E(c.name)}</option>`).join('')}</select></label>
        <label class="rx-field"><span>Nome da análise</span><input id="rxNewTitle" placeholder="Ex.: Raio-X Estratégico — Empresa X — out/2026"></label>
        <button class="ym-btn" id="rxCreate">Começar análise</button></article>
      <article class="rx-card"><h2>Análises em andamento</h2>${data.length ? `<div class="rx-list">${data.map((a) => { const p = progressOf(a.data); const cl = clients.find((c) => c.id === a.client_id); return `<button class="rx-item" data-open="${E(a.id)}"><div><b>${E(a.title || cl?.name || 'Análise sem nome')}</b><small>${cl ? E(cl.name) + ' · ' : ''}${E(ST_LABEL[a.status] || a.status)} · atualizada ${E(new Date(a.updated_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }))}</small></div><span class="rx-prog"><i style="width:${p}%"></i></span><em>${p}%</em></button>`; }).join('')}</div>` : '<div class="rx-empty">Nenhuma análise ainda. Comece a primeira ao lado.</div>'}</article>
    </div>`;
    $('#rxNewClient').onchange = (e) => { const c = clients.find((x) => x.id === e.target.value); if (c && !$('#rxNewTitle').value) $('#rxNewTitle').value = `Raio-X Estratégico — ${c.name} — ${new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '')}`; };
    $('#rxCreate').onclick = create;
    $$('[data-open]').forEach((b) => b.onclick = () => open(b.dataset.open));
  }
  async function create() {
    const client_id = $('#rxNewClient').value || null; const c = clients.find((x) => x.id === client_id);
    const title = $('#rxNewTitle').value.trim() || (c ? `Raio-X Estratégico — ${c.name}` : 'Raio-X Estratégico');
    const d = blank(); d.lists.map = STEPS[0].map.map(([area, dado]) => ({ area, dado, existe: '', onde: '', qualidade: '', resp: '' }));
    const b = $('#rxCreate'); b.disabled = true; b.textContent = 'Criando…';
    const { data, error } = await sb.from('raiox_analyses').insert({ title, client_id, data: d }).select('id').single();
    if (error) { b.disabled = false; b.textContent = 'Começar análise'; alertBox('Não foi possível criar: ' + error.message); return; }
    open(data.id);
  }
  function alertBox(msg) { const t = document.createElement('div'); t.className = 'rx-toast'; t.textContent = msg; document.body.append(t); setTimeout(() => t.remove(), 4500); }

  async function open(id) {
    root.innerHTML = '<div class="rx-loading">Abrindo análise…</div>';
    const { data, error } = await sb.from('raiox_analyses').select('*').eq('id', id).single();
    if (error || !data) { root.innerHTML = '<div class="rx-empty">Análise não encontrada. <a href="/RAIOX/">Voltar</a></div>'; return; }
    A = data; D = normalize(data.data);
    try { const bk = JSON.parse(localStorage.getItem('rx-backup-' + id) || 'null'); if (bk && bk.at > new Date(data.updated_at).getTime() + 2000) { D = normalize(bk.data); dirty = true; setTimeout(() => { alertBox('Recuperei alterações locais que não tinham sido salvas.'); save(); }, 300); } } catch (e) {}
    history.replaceState({}, '', '/RAIOX/?id=' + id + (location.hash || ''));
    const h = (location.hash || '').slice(1); if (STEPS.some((s) => s.id === h)) step = h;
    shell();
  }

  /* ---------- casca da análise ---------- */
  function shell() {
    const cl = clients.find((c) => c.id === A.client_id);
    root.innerHTML = `
    <div class="rx-top">
      <button class="rx-back" id="rxBack">‹ Análises</button>
      <input class="rx-title" id="rxTitle" value="${E(A.title)}" aria-label="Nome da análise">
      <div class="rx-top-r"><select id="rxClient" aria-label="Cliente vinculado"><option value="">Sem cliente vinculado</option>${clients.map((c) => `<option value="${E(c.id)}" ${c.id === A.client_id ? 'selected' : ''}>${E(c.name)}</option>`).join('')}</select>
      <select id="rxStatus" aria-label="Status">${Object.entries(ST_LABEL).map(([k, v]) => `<option value="${k}" ${A.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <span id="rxSave" class="rx-save ok">Tudo salvo</span></div>
    </div>
    <div class="rx-periods">
      ${field('meta', 'antes', 'Período do ANTES', 'Ex.: jan–jun/2026 (média mensal)')}
      ${field('meta', 'agora', 'Período do AGORA', 'Ex.: setembro/2026')}
      ${field('meta', 'prazo', 'Prazo da META', 'Ex.: março/2027 (90 dias)')}
      ${field('meta', 'segmento', 'Segmento / modelo', 'Ex.: serviço local, ticket alto')}
    </div>
    <div class="rx-layout"><nav class="rx-steps" id="rxSteps" aria-label="Etapas do roteiro"></nav><main class="rx-main" id="rxMain"></main></div>`;
    $('#rxBack').onclick = async () => { await save(); A = null; listView(); };
    $('#rxTitle').oninput = (e) => { A.title = e.target.value; touch(); };
    $('#rxClient').onchange = (e) => { A.client_id = e.target.value || null; touch(); };
    $('#rxStatus').onchange = (e) => { A.status = e.target.value; touch(); };
    bindInputs($('.rx-periods')); bindInputs($('#rxMain'));
    renderSteps(); renderStep();
  }
  function field(group, key, label, ph, multiline) { const v = (D[group] || {})[key] || ''; return `<label class="rx-field"><span>${E(label)}</span>${multiline ? `<textarea data-g="${group}" data-k="${key}" rows="${multiline}" placeholder="${E(ph || '')}">${E(v)}</textarea>` : `<input data-g="${group}" data-k="${key}" value="${E(v)}" placeholder="${E(ph || '')}">`}</label>`; }
  function stepFill(s) { const ks = s.kpis || []; if (!ks.length) return null; const n = ks.filter((k) => { const r = D.kpis[k.code] || {}; return r.agora || r.agora_st || r.antes || r.antes_st; }).length; return [n, ks.length]; }
  function renderSteps() {
    $('#rxSteps').innerHTML = `<div class="rx-steps-h"><b>Roteiro</b><span>${progressOf(D)}% concluído</span><span class="rx-prog"><i style="width:${progressOf(D)}%"></i></span></div>` + STEPS.map((s, i) => { const f = stepFill(s); return `<button class="rx-step ${s.id === step ? 'on' : ''} ${D.done[s.id] ? 'done' : ''}" data-step="${s.id}"><i>${D.done[s.id] ? '✓' : i}</i><span>${E(s.short)}${f ? `<small>${f[0]}/${f[1]} indicadores</small>` : ''}</span></button>`; }).join('');
    $$('#rxSteps [data-step]').forEach((b) => b.onclick = () => { step = b.dataset.step; history.replaceState({}, '', location.pathname + location.search + '#' + step); renderSteps(); renderStep(); $('#rxMain').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }

  /* ---------- etapa ---------- */
  function renderStep() {
    const s = STEPS.find((x) => x.id === step), i = STEPS.indexOf(s);
    const prev = STEPS[i - 1], next = STEPS[i + 1];
    $('#rxMain').innerHTML = `
    <header class="rx-step-head"><div class="ym-eyebrow">Etapa ${i} de ${STEPS.length - 1}</div><h2>${E(s.title)}</h2><p class="rx-q">${E(s.question)}</p></header>
    <details class="rx-guide" ${D.done[s.id] ? '' : 'open'}><summary>Guia da etapa</summary><div class="rx-guide-b"><p>${E(s.goal)}</p><b>Como conduzir</b><ol>${s.how.map((h) => `<li>${E(h)}</li>`).join('')}</ol><div class="rx-care"><b>Cuidado</b>${E(s.care)}</div></div></details>
    ${body(s)}
    ${s.diagnosis ? `<section class="rx-block"><h3>Perguntas de diagnóstico</h3><div class="rx-qs">${s.diagnosis.map((q, k) => field('notes', s.id + '_q' + k, q, 'Sua leitura…', 2)).join('')}</div></section>` : ''}
    <section class="rx-block"><h3>Diagnóstico da etapa</h3><p class="rx-muted">O que esses números dizem? Registre achados, hipóteses e o que precisa ser confirmado com o cliente.</p>${field('diag', s.id, '', 'Escreva aqui o seu diagnóstico desta etapa…', 5)}</section>
    <footer class="rx-step-foot">${prev ? `<button class="ym-btn secondary" data-go="${prev.id}">‹ ${E(prev.short)}</button>` : '<span></span>'}<label class="rx-done"><input type="checkbox" id="rxDone" ${D.done[s.id] ? 'checked' : ''}> Etapa concluída</label>${next ? `<button class="ym-btn" data-go="${next.id}">${E(next.short)} ›</button>` : '<span></span>'}</footer>`;
    $('#rxDone').onchange = (e) => { D.done[s.id] = e.target.checked; touch(); renderSteps(); };
    $$('[data-go]').forEach((b) => b.onclick = () => { step = b.dataset.go; history.replaceState({}, '', location.pathname + location.search + '#' + step); renderSteps(); renderStep(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    refresh();
  }
  function body(s) {
    let h = '';
    if (s.id === 'prep') h += sourcesBlock(s) + listBlock('map', 'Mapa de dados', 'Antes de criar painéis, faça o inventário.', [['area', 'Área'], ['dado', 'Dado desejado'], ['existe', 'Existe?', ['', 'Sim', 'Parcial', 'Não']], ['onde', 'Onde está'], ['qualidade', 'Qualidade', ['', 'Alta', 'Média', 'Baixa']], ['resp', 'Responsável']], 'Adicionar dado');
    if (s.kpis) h += kpiBlock(s);
    if (s.id === 'prod') h += productBlock(s);
    if (s.id === 'cli') h += segmentBlock(s);
    if (s.id === 'funil') h += funnelBlock(s);
    if (s.id === 'camp') h += checkBlock('symptoms', 'Diagnóstico por sintoma', 'Marque o que você observa nos números.', s.symptoms.map(([a, b]) => [a, b]));
    if (s.id === 'rel') h += momentsBlock(s) + checkBlock('audiences', 'Públicos de remarketing configurados', 'Marque os públicos que já existem nos anúncios.', s.audiences);
    if (s.id === 'cal') h += listBlock('events', 'Eventos do nicho (próximos 12 meses)', 'Evento, janela, oferta, meta e capacidade.', [['evento', 'Evento'], ['tipo', 'Tipo', ['', 'Sazonal', 'Setorial', 'Comercial', 'Contextual']], ['janela', 'Janela (aquecer → vender)'], ['publico', 'Público'], ['oferta', 'Oferta'], ['meta', 'Meta (leads/vendas/R$)'], ['cap', 'Capacidade ok?', ['', 'Sim', 'Atenção', 'Não']]], 'Adicionar evento');
    if (s.id === 'dados') h += maturityBlock(s);
    if (s.id === 'metas') h += goalsBlock();
    if (s.id === 'plano') h += planBlock();
    if (s.id === 'resumo') h += summaryBlock();
    return h;
  }

  /* KPIs Antes/Agora/Meta */
  function kpiBlock(s) {
    const st = (code, col) => `<select data-kpi="${code}" data-col="${col}_st" class="rx-st" title="Confiabilidade do dado">${STATUS.map(([k, v]) => `<option value="${k}" ${(D.kpis[code] || {})[col + '_st'] === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
    const inp = (k, col) => { const r = D.kpis[k.code] || {}; const nm = r[col + '_st'] === 'NAO_MONITORADO'; return `<div class="rx-cell"><input data-kpi="${k.code}" data-col="${col}" value="${E(r[col] || '')}" inputmode="decimal" placeholder="${nm ? 'não medido' : UNIT_HINT[k.unit]}" ${nm ? 'disabled' : ''}><small data-sug="${k.code}:${col}"></small>${col !== 'meta' ? st(k.code, col) : ''}</div>`; };
    return `<section class="rx-block"><h3>Indicadores: Antes, Agora e Meta</h3><p class="rx-muted">Digite os valores como vierem (ex.: 12.500 ou 18,5). Em cada valor, marque a confiabilidade. Use <b>Não monitorado</b> em vez de zero quando o dado não existe.</p>
    <div class="rx-legend">${STATUS.slice(1).map(([k, v]) => `<span class="rx-tag st-${k}" title="${E(STATUS_HELP[k])}">${v}</span>`).join('')}</div>
    <div class="rx-kpis"><div class="rx-kh"><span>Indicador</span><span>Antes</span><span>Agora</span><span>Meta</span><span>Variação</span></div>
    ${s.kpis.map((k) => `<div class="rx-k"><div class="rx-kn"><b>${E(k.name)}</b><small>${E(k.def)}${k.dir === 'down' ? ' · menor é melhor' : ''}</small><input class="rx-src" data-kpi="${k.code}" data-col="fonte" value="${E((D.kpis[k.code] || {}).fonte || '')}" placeholder="Fonte (ex.: extrato, CRM, Reportei)"></div>${inp(k, 'antes')}${inp(k, 'agora')}${inp(k, 'meta')}<div class="rx-var" data-var="${k.code}"></div></div>`).join('')}</div></section>`;
  }
  function variation(k) {
    const a = val(k.code, 'antes'), n = val(k.code, 'agora'), m = val(k.code, 'meta');
    const pp = k.unit === 'PCT';
    const d = (x, y) => x == null || y == null ? null : pp ? y - x : x === 0 ? null : (y - x) / Math.abs(x) * 100;
    const v1 = d(a, n), v2 = d(n, m);
    const good = (v) => v == null ? '' : (v * (k.dir === 'down' ? -1 : 1)) > 0 ? 'up' : (v === 0 ? '' : 'down');
    const t = (v) => v == null ? '' : (v > 0 ? '+' : '') + v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + (pp ? ' p.p.' : '%');
    const r = D.kpis[k.code] || {};
    if (r.antes_st === 'NAO_MONITORADO' && n != null) return `<span class="rx-chip info">Linha de base</span>${v2 != null ? `<small>até a meta ${t(v2)}</small>` : ''}`;
    return `${v1 != null ? `<span class="rx-chip ${good(v1)}">${t(v1)}</span><small>antes → agora</small>` : '<small>—</small>'}${v2 != null ? `<small>falta ${t(v2)} até a meta</small>` : ''}`;
  }

  /* Fontes */
  function sourcesBlock(s) {
    const c = D.checks.sources || {};
    return `<section class="rx-block"><h3>Fontes solicitadas ao cliente</h3><p class="rx-muted">Marque o que foi recebido. O que não existir já é um achado de maturidade.</p><div class="rx-src-grid">${s.sources.map((x, i) => `<label class="rx-src-i"><span>${E(x)}</span><select data-check="sources" data-i="${i}">${['', 'Recebido', 'Parcial', 'Não existe', 'Não se aplica'].map((o) => `<option ${c[i] === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`).join('')}</div></section>`;
  }
  function checkBlock(id, title, sub, items) {
    const c = D.checks[id] || {};
    return `<section class="rx-block"><h3>${E(title)}</h3><p class="rx-muted">${E(sub)}</p><div class="rx-checks">${items.map(([a, b], i) => `<label class="rx-ck"><input type="checkbox" data-check="${id}" data-i="${i}" ${c[i] ? 'checked' : ''}><span><b>${E(a)}</b><small>${E(b)}</small></span></label>`).join('')}</div></section>`;
  }
  function momentsBlock(s) {
    const c = D.checks.moments || {};
    return `<section class="rx-block"><h3>Régua de relacionamento: o que existe hoje</h3><div class="rx-table"><table><thead><tr><th>Momento</th><th>Público</th><th>Objetivo</th><th>KPI principal</th><th>Existe?</th><th>Canal</th></tr></thead><tbody>${s.moments.map(([m, p, o, k], i) => `<tr><td><b>${E(m)}</b></td><td>${E(p)}</td><td>${E(o)}</td><td>${E(k)}</td><td><select data-check="moments" data-i="${i}">${['', 'Sim', 'Parcial', 'Não'].map((x) => `<option ${c[i] === x ? 'selected' : ''}>${x}</option>`).join('')}</select></td><td><input data-check="moments_canal" data-i="${i}" value="${E((D.checks.moments_canal || {})[i] || '')}" placeholder="WhatsApp, e-mail…"></td></tr>`).join('')}</tbody></table></div></section>`;
  }

  /* Listas genéricas */
  function listBlock(id, title, sub, cols, addLabel, extraHead = '', computed) {
    const rows = D.lists[id] ||= [];
    return `<section class="rx-block" data-list="${id}"><h3>${E(title)}</h3>${sub ? `<p class="rx-muted">${E(sub)}</p>` : ''}${extraHead}<div class="rx-table"><table><thead><tr>${cols.map((c) => `<th>${E(c[1])}</th>`).join('')}${computed ? computed.head.map((x) => `<th>${E(x)}</th>`).join('') : ''}<th></th></tr></thead><tbody>${rows.map((r, i) => `<tr>${cols.map(([k, , opts]) => `<td>${opts ? `<select data-list="${id}" data-i="${i}" data-k="${k}">${opts.map((o) => `<option ${r[k] === o ? 'selected' : ''}>${E(o)}</option>`).join('')}</select>` : `<input data-list="${id}" data-i="${i}" data-k="${k}" value="${E(r[k] || '')}">`}</td>`).join('')}${computed ? computed.cells(r, i) : ''}<td><button class="rx-x" data-del="${id}" data-i="${i}" aria-label="Remover linha">×</button></td></tr>`).join('')}</tbody></table></div><button class="ym-btn secondary rx-add" data-add="${id}">+ ${E(addLabel)}</button></section>`;
  }
  function productBlock(s) {
    const head = `<div class="rx-matrix">${s.matrix.map(([t, c, d]) => `<div><b>${E(t)}</b><small>${E(c)}</small><span>${E(d)}</span></div>`).join('')}</div>`;
    return listBlock('products', 'Matriz de produtos e serviços', 'Receita e quantidade do período AGORA. Margem de contribuição em %.', [['nome', 'Produto/serviço'], ['receita', 'Receita (R$)'], ['qtd', 'Qtd. vendida'], ['mc', 'Margem contrib. %'], ['recompra', 'Recompra', ['', 'Alta', 'Média', 'Baixa']], ['esforco', 'Esforço operac.', ['', 'Baixo', 'Médio', 'Alto']], ['tipo', 'Tipo', ['', 'Campeão', 'Entrada', 'Premium', 'Problema', 'Complementar', 'Sazonal']], ['decisao', 'Decisão']], 'Adicionar produto', head,
      { head: ['Contribuição (R$)', 'Sugestão'], cells: (r, i) => `<td data-out="pc_${i}"></td><td data-out="ps_${i}"></td>` });
  }
  function productCalc() {
    const rows = D.lists.products || []; const v = rows.map((r) => ({ rec: parse(r.receita), q: parse(r.qtd), mc: parse(r.mc) }));
    const med = (a) => { a = a.filter((x) => x != null).sort((x, y) => x - y); return a.length ? a[Math.floor((a.length - 1) / 2)] : null; };
    const mq = med(v.map((x) => x.q)), mm = med(v.map((x) => x.mc));
    v.forEach((x, i) => {
      const c = x.rec != null && x.mc != null ? x.rec * x.mc / 100 : null;
      let sug = '—';
      if (x.mc != null && x.q != null && rows.length > 1) { const hv = x.q >= mq, hm = x.mc >= mm; sug = x.mc < 15 ? 'Problema' : hv && hm ? 'Campeão' : hv ? 'Entrada' : hm ? (x.rec != null && x.q && x.rec / x.q > 0 ? 'Premium ou Complementar' : 'Premium') : 'Problema'; }
      out('pc_' + i, fmt(c, 'BRL')); out('ps_' + i, sug);
    });
  }
  function segmentBlock(s) {
    if (!D.lists.segments || !D.lists.segments.length) D.lists.segments = s.segments.map(([seg, crit, acao]) => ({ seg, crit, qtd: '', receita: '', acao }));
    return listBlock('segments', 'Segmentação da base', 'Quantos clientes/leads há em cada grupo e quanto cada um gera.', [['seg', 'Segmento'], ['crit', 'Critério'], ['qtd', 'Quantidade'], ['receita', 'Receita (R$)'], ['acao', 'Ação recomendada']], 'Adicionar segmento');
  }
  function funnelBlock(s) {
    return `<section class="rx-block"><h3>Conversão entre etapas</h3><p class="rx-muted">Calculado a partir dos volumes acima. A etapa com maior perda aparece destacada.</p><div class="rx-table"><table class="rx-funnel"><thead><tr><th>Passagem</th><th>Antes</th><th>Agora</th><th>Variação</th><th>Se esta for a maior perda…</th></tr></thead><tbody>${s.stages.map(([a, b, label, sym], i) => `<tr data-out-row="fs_${i}"><td><b>${E(label)}</b></td><td data-out="fa_${i}"></td><td data-out="fn_${i}"></td><td data-out="fv_${i}"></td><td class="rx-sym">${E(sym)}</td></tr>`).join('')}</tbody></table></div><div class="rx-callout" data-out="fgarg"></div></section>`;
  }
  function funnelCalc() {
    const s = STEPS.find((x) => x.id === 'funil'); let worst = null;
    s.stages.forEach(([a, b], i) => {
      const r = (col) => { const x = val(a, col), y = val(b, col); return x && y != null ? y / x * 100 : null; };
      const ra = r('antes'), rn = r('agora');
      out('fa_' + i, ra == null ? '—' : fmt(ra, 'PCT')); out('fn_' + i, rn == null ? '—' : fmt(rn, 'PCT'));
      out('fv_' + i, ra != null && rn != null ? `<span class="rx-chip ${rn > ra ? 'up' : rn < ra ? 'down' : ''}">${(rn - ra > 0 ? '+' : '') + (rn - ra).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} p.p.</span>` : '—', true);
      if (i >= 1 && rn != null && (worst == null || rn < worst.v)) worst = { i, v: rn };
    });
    $$('[data-out-row]').forEach((tr) => tr.classList.toggle('rx-worst', worst && tr.dataset.outRow === 'fs_' + worst.i));
    out('fgarg', worst ? `<b>Maior perda no AGORA: ${E(s.stages[worst.i][2])} (${fmt(worst.v, 'PCT')})</b><br>${E(s.stages[worst.i][3])}` : 'Preencha os volumes do funil para ver onde está a maior perda.', true);
  }
  function maturityBlock(s) {
    return `<section class="rx-block"><h3>Confiabilidade dos dados preenchidos</h3><p class="rx-muted">Resumo automático de todos os indicadores do roteiro.</p><div data-out="mat" class="rx-mat"></div></section>
    <section class="rx-block"><h3>Linha de base oficial</h3>${field('meta', 'baseline', 'Data de início do acompanhamento padronizado', 'Ex.: outubro de 2026')}<p class="rx-muted">Frase sugerida para o relatório: “A partir de [mês/ano], a empresa inicia o acompanhamento padronizado de marketing, vendas, receita e margem.”</p></section>
    <section class="rx-block"><h3>Dicionário de métricas</h3><p class="rx-muted">Ajuste as definições para a realidade desta empresa. É isso que evita cada pessoa entender “lead” ou “venda” de um jeito.</p><div class="rx-qs">${s.dictionary.map(([k, t, def]) => field('notes', 'dic_' + k, t, def, 2)).join('')}</div>
    <div class="rx-qs">${field('notes', 'dic_periodo', 'Período de apuração e frequência de atualização', 'Ex.: mensal, fechamento até o dia 5')}${field('notes', 'dic_resp', 'Responsável pelo preenchimento', 'Nome e função')}${field('notes', 'dic_atrib', 'Regra de atribuição de vendas', 'Ex.: primeiro contato registrado no CRM')}</div></section>`;
  }
  function maturityCalc() {
    const c = {}; let total = 0;
    allKpis.forEach((k) => ['antes', 'agora'].forEach((col) => { const st = (D.kpis[k.code] || {})[col + '_st']; if (st) { c[col + st] = (c[col + st] || 0) + 1; total++; } }));
    const row = (col, lbl) => { const n = STATUS.slice(1).reduce((s, [k]) => s + (c[col + k] || 0), 0); return `<div class="rx-mat-row"><b>${lbl}</b><div class="rx-mat-bar">${STATUS.slice(1).map(([k, v]) => c[col + k] ? `<i class="st-${k}" style="flex:${c[col + k]}" title="${v}: ${c[col + k]}">${c[col + k]}</i>` : '').join('') || '<em>Nenhum status marcado ainda</em>'}</div><small>${n} marcados</small></div>`; };
    const nm = (c.antesNAO_MONITORADO || 0), est = (c.antesESTIMADO || 0);
    out('mat', `${row('antes', 'Antes')}${row('agora', 'Agora')}<div class="rx-legend">${STATUS.slice(1).map(([k, v]) => `<span class="rx-tag st-${k}">${v}</span>`).join('')}</div>${total ? `<p class="rx-callout">${nm + est > (c.antesVALIDADO || 0) + (c.antesRECONCILIADO || 0) ? '<b>Leitura:</b> a maior parte do ANTES é estimada ou não monitorada. Trate o primeiro mês como implantação e registre a linha de base; a primeira meta estratégica é criar confiabilidade para decidir.' : '<b>Leitura:</b> a base histórica é razoavelmente confiável. Dá para comparar tendências e definir metas de resultado.'}</p>` : ''}`, true);
  }
  function goalsBlock() {
    const c = D.calc;
    const inp = (k, label, ph) => `<label class="rx-field"><span>${label}</span><input data-g="calc" data-k="${k}" value="${E(c[k] || '')}" inputmode="decimal" placeholder="${ph}"></label>`;
    return `<section class="rx-block"><h3>Calculadora reversa</h3><p class="rx-muted">Os campos já trazem os números do AGORA quando existirem. Você pode sobrescrever com as taxas desejadas.</p>
    <div class="rx-calc">${inp('fat', 'Meta de faturamento mensal (R$)', 'Ex.: 60.000')}${inp('ticket', 'Ticket médio (R$)', 'Ex.: 2.000')}${inp('fech', 'Taxa de fechamento das oportunidades (%)', 'Ex.: 20')}${inp('opp', 'Leads qualificados que viram oportunidade (%)', 'Ex.: 40')}${inp('qual', 'Leads que se qualificam (%)', 'Ex.: 50')}</div>
    <div class="rx-calc-out" data-out="calc"></div></section>
    <section class="rx-block"><h3>Metas em três níveis</h3><p class="rx-muted">Sem histórico confiável, comece pela instrumentação.</p><div class="rx-qs">${field('notes', 'meta_instr', 'Meta de instrumentação', 'Ex.: 100% das vendas registradas; 100% dos leads com origem; painel atualizado toda semana', 3)}${field('notes', 'meta_comp', 'Meta de comportamento', 'Ex.: responder leads em até 1h; follow-up de toda proposta em 48h', 3)}${field('notes', 'meta_res', 'Meta de resultado', 'Ex.: +20% de receita com margem de contribuição ≥ 35%', 3)}</div></section>
    <section class="rx-block"><h3>Painel de metas (vem das colunas META)</h3><div data-out="goals"></div></section>`;
  }
  function goalsCalc() {
    const c = D.calc; const g = (k, code, col = 'agora') => { const v = parse(c[k]); return v != null ? v : (code ? val(code, col) : null); };
    const fat = g('fat', 'fat_bruto', 'meta'), ticket = g('ticket', 'ticket'), fech = g('fech'), opp = g('opp'), qual = g('qual');
    const sug = { fat: val('fat_bruto', 'meta'), ticket: val('ticket', 'agora') };
    $$('[data-g="calc"]').forEach((el) => { const k = el.dataset.k; if (!c[k] && sug[k] != null) el.placeholder = 'Do roteiro: ' + fmt(sug[k], 'NUM'); });
    if (!fat || !ticket) { out('calc', '<p class="rx-muted">Preencha ao menos a meta de faturamento e o ticket médio.</p>', true); }
    else {
      const vendas = fat / ticket, oppN = fech ? vendas / (fech / 100) : null, qualN = oppN && opp ? oppN / (opp / 100) : null, leads = qualN && qual ? qualN / (qual / 100) : null;
      const curLeads = val('f_leads', 'agora');
      out('calc', `<div class="rx-chain"><div><small>Vendas/mês</small><b>${fmt(Math.ceil(vendas), 'NUM')}</b></div><span>←</span><div><small>Oportunidades</small><b>${oppN ? fmt(Math.ceil(oppN), 'NUM') : '—'}</b></div><span>←</span><div><small>Leads qualificados</small><b>${qualN ? fmt(Math.ceil(qualN), 'NUM') : '—'}</b></div><span>←</span><div><small>Leads/mês</small><b>${leads ? fmt(Math.ceil(leads), 'NUM') : '—'}</b></div></div>${leads && curLeads ? `<p class="rx-callout">Hoje a empresa gera <b>${fmt(curLeads, 'NUM')}</b> leads/mês. A meta exige <b>${fmt(Math.ceil(leads), 'NUM')}</b> (${(leads / curLeads).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}×). ${leads / curLeads > 2 ? 'Se esse volume for inviável, trabalhe ticket, conversão ou recompra antes de aumentar anúncios.' : 'O volume parece alcançável com ajustes de conversão e constância.'}</p>` : ''}`, true);
    }
    const rows = allKpis.filter((k) => val(k.code, 'meta') != null);
    out('goals', rows.length ? `<div class="rx-table"><table><thead><tr><th>Indicador</th><th>Agora</th><th>Meta</th><th>Distância</th></tr></thead><tbody>${rows.map((k) => { const n = val(k.code, 'agora'), m = val(k.code, 'meta'); const d = n == null ? null : k.unit === 'PCT' ? m - n : n ? (m - n) / Math.abs(n) * 100 : null; return `<tr><td>${E(k.name)}</td><td>${fmt(n, k.unit)}</td><td><b>${fmt(m, k.unit)}</b></td><td>${d == null ? '—' : (d > 0 ? '+' : '') + d.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + (k.unit === 'PCT' ? ' p.p.' : '%')}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="rx-muted">Nenhuma meta preenchida ainda nas etapas anteriores.</p>', true);
  }
  const PRIO = (imp, esf) => { if (!imp || !esf) return ''; if (imp === 'Baixo') return 'Baixa'; if (imp === 'Alto') return esf === 'Baixo' ? 'Imediata' : esf === 'Médio' ? 'Alta' : 'Planejar'; if (imp === 'Médio') return esf === 'Baixo' ? 'Alta' : esf === 'Médio' ? 'Média' : 'Baixa'; return 'Investigar'; };
  function planBlock() {
    if (!D.lists.plan || !D.lists.plan.length) D.lists.plan = [{ acao: 'Recuperar propostas em aberto', bloco: 'Funil', impacto: '', esforco: '', prazo: '', resp: '' }, { acao: 'Reativar clientes inativos', bloco: 'Clientes', impacto: '', esforco: '', prazo: '', resp: '' }];
    return listBlock('plan', 'Ações recomendadas', 'A prioridade é sugerida a partir de impacto × esforço.', [['acao', 'Ação'], ['bloco', 'Bloco', ['', 'Financeiro', 'Produtos', 'Clientes', 'Funil', 'Campanhas', 'Relacionamento', 'Calendário', 'Redes sociais', 'Dados']], ['impacto', 'Impacto', ['', 'Alto', 'Médio', 'Baixo', 'Incerto']], ['esforco', 'Esforço', ['', 'Baixo', 'Médio', 'Alto']], ['prazo', 'Prazo', ['', '30 dias', '60 dias', '90 dias']], ['resp', 'Responsável']], 'Adicionar ação', '', { head: ['Prioridade'], cells: (r, i) => `<td data-out="pp_${i}"></td>` });
  }
  function planCalc() { (D.lists.plan || []).forEach((r, i) => { const p = PRIO(r.impacto, r.esforco); out('pp_' + i, p ? `<span class="rx-chip ${p === 'Imediata' ? 'up' : p === 'Alta' ? 'info' : ''}">${p}</span>` : '—', true); }); }
  function summaryBlock() {
    return publishBlock() + `<section class="rx-block"><h3>Destaques automáticos</h3><div data-out="hl"></div></section>
    <section class="rx-block"><h3>Leitura para o cliente</h3><div class="rx-qs">${field('notes', 'sum_problemas', 'Principais problemas (até 3)', '1.\n2.\n3.', 4)}${field('notes', 'sum_oport', 'Principais oportunidades (até 3)', '1.\n2.\n3.', 4)}${field('notes', 'sum_prior', 'Prioridades dos próximos 90 dias', '30 dias:\n60 dias:\n90 dias:', 4)}${field('notes', 'sum_frase', 'Frase-síntese do Raio-X', 'Ex.: O negócio não precisa de mais tráfego agora; precisa converter e cobrar melhor o que já atrai.', 2)}</div></section>`;
  }
  function summaryCalc() {
    const items = [];
    const moves = allKpis.map((k) => { const a = val(k.code, 'antes'), n = val(k.code, 'agora'); if (a == null || n == null) return null; const d = k.unit === 'PCT' ? n - a : a ? (n - a) / Math.abs(a) * 100 : null; return d == null ? null : { k, d, g: d * (k.dir === 'down' ? -1 : 1) }; }).filter(Boolean).sort((x, y) => y.g - x.g);
    const t = (m) => `${E(m.k.name)} (${(m.d > 0 ? '+' : '') + m.d.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}${m.k.unit === 'PCT' ? ' p.p.' : '%'})`;
    if (moves[0] && moves[0].g > 0) items.push(['up', 'Maior avanço', t(moves[0])]);
    const w = moves[moves.length - 1]; if (w && w.g < 0) items.push(['down', 'Maior piora', t(w)]);
    const nm = allKpis.filter((k) => (D.kpis[k.code] || {}).antes_st === 'NAO_MONITORADO').map((k) => k.name);
    if (nm.length) items.push(['info', `${nm.length} ${nm.length === 1 ? 'indicador' : 'indicadores'} sem histórico`, nm.slice(0, 6).join(', ') + (nm.length > 6 ? '…' : '')]);
    funnelCalcSilent(items);
    const imm = (D.lists.plan || []).filter((r) => PRIO(r.impacto, r.esforco) === 'Imediata').map((r) => r.acao).filter(Boolean);
    if (imm.length) items.push(['up', 'Ações imediatas', imm.join(' · ')]);
    const pend = STEPS.filter((s) => !D.done[s.id] && s.id !== 'resumo').map((s) => s.short);
    if (pend.length) items.push(['', 'Etapas ainda abertas', pend.join(', ')]);
    out('hl', items.length ? `<div class="rx-hl">${items.map(([c, a, b]) => `<div class="rx-hl-i ${c}"><b>${E(a)}</b><span>${b}</span></div>`).join('')}</div>` : '<p class="rx-muted">Os destaques aparecem conforme você preenche as etapas.</p>', true);
  }
  function funnelCalcSilent(items) { const s = STEPS.find((x) => x.id === 'funil'); let worst = null; s.stages.forEach(([a, b], i) => { const x = val(a, 'agora'), y = val(b, 'agora'); if (i >= 1 && x && y != null) { const r = y / x * 100; if (!worst || r < worst.v) worst = { i, v: r }; } }); if (worst) items.push(['down', 'Gargalo do funil', `${E(s.stages[worst.i][2])} (${fmt(worst.v, 'PCT')})`]); }


  /* ---------- levar para a Área do Cliente ---------- */
  const CAT_BY_STEP = { fin: 'FINANCEIRO', prod: 'NEGOCIO', cli: 'NEGOCIO', funil: 'COMERCIAL', camp: 'MARKETING', rel: 'MARKETING', cal: 'MARKETING', social: 'REDES_SOCIAIS', dados: 'OPERACAO' };
  const UNIT_MAP = { BRL: 'MOEDA', PCT: 'PERCENTUAL', NUM: 'NUMERO', DIAS: 'NUMERO', HORAS: 'NUMERO' };
  const okStatus = (st) => (st === 'VALIDADO' || st === 'RECONCILIADO' || !st) ? 'VALIDADO' : 'PRELIMINAR';
  function publishable() { return allKpis.filter((k) => val(k.code, 'antes') != null || val(k.code, 'agora') != null); }
  function publishBlock() {
    const cl = clients.find((c) => c.id === A.client_id); const list = publishable(); const pub = D.published || {}; const sel = D.meta.pub_sel || {};
    const dt = (k, label) => `<label class="rx-field"><span>${label}</span><input type="date" data-g="meta" data-k="${k}" value="${E(D.meta[k] || '')}"></label>`;
    return `<section class="rx-block rx-pub"><h3>Levar para a Área do Cliente</h3>
      ${!cl ? '<p class="rx-callout">Vincule esta análise a um cliente do CRM (no topo da página) para enviar os indicadores para a aba <b>Resultados</b> dele.</p>' : `
      <p class="rx-muted">Os indicadores marcados viram o painel de <b>Resultados</b> de <b>${E(cl.name)}</b>: o ANTES vira o ponto de partida, o AGORA vira a medição atual e a META vira a meta. Dados estimados entram como preliminares. Se o ANTES não foi monitorado, o AGORA vira a linha de base.${pub.at ? `<br><b>Último envio:</b> ${E(new Date(pub.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }))} · ${E(pub.count)} indicadores.` : ''}</p>
      <div class="rx-calc rx-dates">${dt('pub_antes_ini', 'Antes: início')}${dt('pub_antes_fim', 'Antes: fim')}${dt('pub_agora_ini', 'Agora: início')}${dt('pub_agora_fim', 'Agora: fim')}${dt('pub_meta', 'Meta: até')}</div>
      ${list.length ? `<div class="rx-checks">${list.map((k) => { const on = sel[k.code] !== false; return `<label class="rx-ck"><input type="checkbox" data-pubsel="${k.code}" ${on ? 'checked' : ''}><span><b>${E(k.name)}</b><small>${E(fmt(val(k.code, 'antes'), k.unit))} → ${E(fmt(val(k.code, 'agora'), k.unit))}${val(k.code, 'meta') != null ? ' · meta ' + E(fmt(val(k.code, 'meta'), k.unit)) : ''}</small></span></label>`; }).join('')}</div>` : '<p class="rx-muted">Nenhum indicador com valor preenchido ainda.</p>'}
      <div class="rx-pub-act"><label class="rx-done"><input type="checkbox" id="rxPubVisible" ${D.meta.pub_hidden ? '' : 'checked'}> Visível para o cliente</label><button class="ym-btn" id="rxPublish" ${list.length ? '' : 'disabled'}>Enviar para Resultados do cliente</button></div>`}
    </section>`;
  }
  async function publish() {
    const m = D.meta, b = $('#rxPublish');
    const need = ['pub_antes_ini', 'pub_antes_fim', 'pub_agora_ini', 'pub_agora_fim'];
    if (need.some((k) => !m[k])) { alertBox('Preencha as datas de início e fim do ANTES e do AGORA.'); return; }
    if (m.pub_antes_fim < m.pub_antes_ini || m.pub_agora_fim < m.pub_agora_ini) { alertBox('A data de fim precisa ser depois da data de início.'); return; }
    const sel = m.pub_sel || {};
    const items = publishable().filter((k) => sel[k.code] !== false).map((k) => {
      const r = D.kpis[k.code] || {}; const a = val(k.code, 'antes'), n = val(k.code, 'agora'), t = val(k.code, 'meta');
      const noBefore = a == null; const base = noBefore ? n : a;
      return {
        code: 'RX_' + k.code.toUpperCase(), name: k.name, description: k.def, category: CAT_BY_STEP[k.step] || 'OUTRO', unit: UNIT_MAP[k.unit] || 'NUMERO', direction: k.dir === 'down' ? 'MENOR_MELHOR' : 'MAIOR_MELHOR',
        baseline: base, baseline_start: noBefore ? m.pub_agora_ini : m.pub_antes_ini, baseline_end: noBefore ? m.pub_agora_fim : m.pub_antes_fim, baseline_status: okStatus(noBefore ? r.agora_st : r.antes_st),
        current: noBefore ? null : n, current_start: m.pub_agora_ini, current_end: m.pub_agora_fim, current_status: okStatus(r.agora_st),
        target: t, target_end: m.pub_meta || null,
        notes: [noBefore ? 'Linha de base iniciada no período do AGORA (antes não monitorado).' : '', r.antes_st === 'ESTIMADO' ? 'Ponto de partida estimado.' : '', r.fonte ? 'Fonte: ' + r.fonte : ''].filter(Boolean).join(' '),
      };
    }).filter((x) => x.baseline != null);
    if (!items.length) { alertBox('Selecione ao menos um indicador com valor.'); return; }
    b.disabled = true; b.textContent = 'Enviando…';
    await save();
    const { data, error } = await sb.rpc('raiox_publish_kpis', { p_analysis_id: A.id, p_items: items, p_visible: !D.meta.pub_hidden });
    b.disabled = false; b.textContent = 'Enviar para Resultados do cliente';
    if (error) { alertBox('Não foi possível enviar: ' + error.message); return; }
    D.published = { at: new Date().toISOString(), count: data?.published || items.length };
    alertBox(`${D.published.count} indicadores enviados para a aba Resultados do cliente.`);
    renderStep();
  }

  /* ---------- binding e cálculos ---------- */
  function out(key, html, raw) { const el = $(`[data-out="${key}"]`); if (el) el[raw ? 'innerHTML' : 'textContent'] = html; }
  function refresh() {
    allKpis.forEach((k) => {
      const v = $(`[data-var="${k.code}"]`); if (v) v.innerHTML = variation(k);
      ['antes', 'agora', 'meta'].forEach((col) => { const el = $(`[data-sug="${k.code}:${col}"]`); if (!el) return; const r = D.kpis[k.code] || {}; el.textContent = k.calc && !r[col] && r[col + '_st'] !== 'NAO_MONITORADO' ? (() => { const c = k.calc(getter(col)); return c == null ? '' : 'calc.: ' + fmt(c, k.unit); })() : ''; });
    });
    if (step === 'prod') productCalc();
    if (step === 'funil') funnelCalc();
    if (step === 'dados') maturityCalc();
    if (step === 'metas') goalsCalc();
    if (step === 'plano') planCalc();
    if (step === 'resumo') summaryCalc();
  }
  function bindInputs(scope) {
    scope.addEventListener('input', onEdit); scope.addEventListener('change', onEdit);
    scope.addEventListener('click', (e) => {
      if (e.target.closest('#rxPublish')) { publish(); return; }
      const add = e.target.closest('[data-add]'); const del = e.target.closest('[data-del]');
      if (add) { const id = add.dataset.add; (D.lists[id] ||= []).push({}); touch(); renderStep(); setTimeout(() => { const ins = $$(`[data-list="${id}"] tbody tr:last-child input, [data-list="${id}"] tbody tr:last-child select`); ins[0]?.focus(); }, 30); }
      if (del) { const id = del.dataset.del; D.lists[id].splice(+del.dataset.i, 1); touch(); renderStep(); }
    });
  }
  function onEdit(e) {
    const t = e.target; if (!t.matches('input,select,textarea') || t.id === 'rxTitle' || t.id === 'rxClient' || t.id === 'rxStatus' || t.id === 'rxDone') return;
    if (t.id === 'rxPubVisible' && e.type !== 'change') return;
    if (e.type === 'change' && t.tagName !== 'SELECT' && t.type !== 'checkbox') return;
    const v = t.type === 'checkbox' ? t.checked : t.value;
    if (t.dataset.pubsel) { (D.meta.pub_sel ||= {})[t.dataset.pubsel] = t.checked; touch(); return; }
    if (t.id === 'rxPubVisible') { D.meta.pub_hidden = !t.checked; touch(); return; }
    if (t.dataset.kpi) { const r = kv(t.dataset.kpi); r[t.dataset.col] = v; if (t.dataset.col.endsWith('_st')) { const col = t.dataset.col.slice(0, -3); const inp = $(`input[data-kpi="${t.dataset.kpi}"][data-col="${col}"]`); if (inp) { inp.disabled = v === 'NAO_MONITORADO'; inp.placeholder = v === 'NAO_MONITORADO' ? 'não medido' : UNIT_HINT[kpiByCode[t.dataset.kpi].unit]; if (v === 'NAO_MONITORADO') { inp.value = ''; r[col] = ''; } } t.className = 'rx-st ' + (v ? 'st-' + v : ''); t.title = STATUS_HELP[v] || 'Confiabilidade do dado'; } }
    else if (t.dataset.g) { (D[t.dataset.g] ||= {})[t.dataset.k] = v; }
    else if (t.dataset.list) { const row = (D.lists[t.dataset.list] ||= [])[+t.dataset.i] ||= {}; row[t.dataset.k] = v; }
    else if (t.dataset.check) { (D.checks[t.dataset.check] ||= {})[t.dataset.i] = v; }
    else return;
    touch(); refresh();
    if (t.dataset.kpi && (e.type === 'change' || t.dataset.col.endsWith('_st'))) renderStepsLight();
  }
  function renderStepsLight() { const s = STEPS.find((x) => x.id === step); const f = stepFill(s); const b = $(`#rxSteps [data-step="${step}"] small`); if (b && f) b.textContent = `${f[0]}/${f[1]} indicadores`; }
  // colore os seletores de status já existentes
  new MutationObserver(() => $$('.rx-st').forEach((s) => { if (!s.dataset.c) { s.dataset.c = 1; if (s.value) s.classList.add('st-' + s.value); s.title = STATUS_HELP[s.value] || 'Confiabilidade do dado'; } })).observe(root, { childList: true, subtree: true });

  boot().catch((e) => { root.innerHTML = `<div class="rx-empty">Erro ao iniciar: ${E(e.message)}</div>`; });
})();

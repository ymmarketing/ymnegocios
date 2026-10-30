/* Central YM · Visão geral v2 (cópia de teste, lote 1 · 30/10/2026)
   Indicadores: clientes ativos, valores a receber, oportunidades em proposta e em prospecção,
   temperatura dos contatos e pendências agrupadas por cliente (um card por cliente). */
(() => {
  if (window.CentralOverviewV2) return;
  const E = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const BRL = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const TZ = 'America/Sao_Paulo';
  const dShort = (v) => { if (!v) return ''; const d = new Date(String(v).length === 10 ? v + 'T12:00:00-03:00' : v); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit' }); };
  const CLOSED = new Set(['GANHO', 'PERDIDO', 'DESQUALIFICADO', 'IMPLANTACAO']);
  const TEMP = { QUENTE: 'Quente', MORNO: 'Morno', FRIO: 'Frio' };
  let data = null, loading = false;

  const css = document.createElement('style');
  css.textContent = `
  .ov2-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
  .ov2-kpi{text-align:left;font:inherit;cursor:pointer;transition:border-color .15s,box-shadow .15s;display:flex;flex-direction:column;background:#fff;border:1px solid var(--ym-line,#DCE5F0);border-radius:14px;padding:14px 16px}
  .ov2-kpi b{display:block;font:800 26px/1.1 Montserrat,sans-serif;color:var(--ym-navy,#0A2540);font-variant-numeric:tabular-nums}
  .ov2-kpi span{display:block;font-size:13px;color:#52667A;margin-top:4px}
  .ov2-kpi:hover,.ov2-kpi:focus-visible{border-color:#484DCF;box-shadow:0 6px 18px rgba(72,77,207,.12);outline:none}.ov2-kpi i{font-style:normal;font-size:12.5px;font-weight:700;color:#484DCF;margin-top:auto;padding-top:8px}.ov2-pill{cursor:pointer;font-family:inherit}.ov2-pill:hover{filter:brightness(.97)}
  .ov2-kpi small{display:block;font-size:12px;color:#7A8B9B;margin-top:6px;line-height:1.45}
  .ov2-temp{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 2px;align-items:center}
  .ov2-temp > span{font-size:12px;font-weight:800;color:#52667A;margin-right:2px}
  .ov2-pill{border:1px solid #DCE5F0;background:#fff;border-radius:999px;padding:7px 12px;font-size:13px;font-weight:700;color:#0A2540}
  .ov2-pill.q{border-color:#F3C3B5;background:#FFF2EE;color:#A63A1C}.ov2-pill.m{border-color:#F1DEB5;background:#FFF8EA;color:#8A5300}.ov2-pill.f{border-color:#CFE0F5;background:#F1F6FF;color:#24507F}.ov2-pill.n{color:#6B7C91}
  .ov2-tasks{margin:14px 0}.ov2-tasks h2{font:800 16px Montserrat,sans-serif;color:#0A2540;margin:0 0 8px}
  .ov2-tgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
  .ov2-tcard{background:#fff;border:1px solid #DCE5F0;border-left:4px solid #484DCF;border-radius:12px;padding:12px 14px}
  .ov2-tcard.late{border-left-color:#C53B3B}
  .ov2-tcard header{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:6px}
  .ov2-tcard header b{font-size:14px;color:#0A2540}.ov2-tcard header span{font-size:12px;font-weight:800;color:#52667A;white-space:nowrap}
  .ov2-tcard ul{margin:0;padding:0;list-style:none;display:grid;gap:6px}
  .ov2-tcard li{font-size:13px;color:#33495E;line-height:1.45}.ov2-tcard li small{display:block;color:#7A8B9B;font-size:12px}
  .ov2-tcard li.late small{color:#A52A2A;font-weight:700}
  .ov2-thead{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}.ov2-thead h2{margin:0!important}
  .ov2-click{cursor:pointer;border-radius:8px;padding:6px 7px;margin:0 -7px;transition:background .12s}.ov2-click:hover,.ov2-click:focus-visible{background:#F1F5FB;outline:none}
  .ov2-back{position:fixed;inset:0;z-index:500;background:rgba(4,22,38,.6);display:grid;place-items:center;padding:16px}
  .ov2-modal{width:min(640px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.28)}
  .ov2-modal header{display:flex;justify-content:space-between;align-items:center;background:#0A2540;color:#fff;padding:14px 18px;position:sticky;top:0}
  .ov2-modal header h2{font:800 17px Montserrat,sans-serif;margin:0}.ov2-modal header button{width:36px;height:36px;border:0;border-radius:9px;background:rgba(255,255,255,.12);color:#fff;font-size:20px;cursor:pointer}
  .ov2-form{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:16px 18px 4px}.ov2-wide{grid-column:1/-1}
  .ov2-hint{font-size:12px;color:#7A8B9B;margin:6px 18px 0;line-height:1.5}.ov2-actions{display:flex;justify-content:flex-end;gap:8px;padding:12px 18px 18px}
  @media(max-width:560px){.ov2-form{grid-template-columns:1fr}}
  @media(min-width:1181px){.ca-client{grid-template-columns:minmax(170px,1.2fr) minmax(170px,1fr) minmax(110px,.6fr) minmax(100px,.55fr) minmax(110px,.6fr) auto!important}}
  .ov2-sub{display:block;font-size:12.5px;color:#BED1E3;margin-top:3px;font-weight:500}
  .ov2-list{padding:10px 12px 16px;display:grid;gap:6px}
  .ov2-row{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;text-align:left;font:inherit;background:#fff;border:1px solid #DCE5F0;border-radius:12px;padding:11px 13px;cursor:pointer}
  .ov2-row:hover,.ov2-row:focus-visible{border-color:#484DCF;background:#F7F8FF;outline:none}
  .ov2-row b{display:block;font-size:14px;color:#0A2540}.ov2-row small{display:block;font-size:12.5px;color:#6B7C91;margin-top:2px;line-height:1.45}
  .ov2-right{display:flex;align-items:center;gap:10px;flex:none}.ov2-right i{font-style:normal;font-size:12px;font-weight:700;color:#484DCF}
  .ov2-money{font-size:13.5px;font-weight:800;color:#137A5B;white-space:nowrap}
  .ov2-tag{font-style:normal;font-size:11px;font-weight:700;color:#8A5300;background:#FFF1DC;border-radius:6px;padding:2px 6px;margin-left:6px}
  .ov2-links{display:flex;gap:14px;flex-wrap:wrap}.ov2-links a{font-size:13px;font-weight:700;color:#484DCF;text-decoration:none}
  @media(max-width:560px){.ov2-row{flex-direction:column;align-items:flex-start}.ov2-right{flex-wrap:wrap}}
  .ov2-li{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.ov2-done{flex:none;border:1px solid #CFE6DA;background:#F0FAF5;color:#137A5B;border-radius:8px;font-size:12px;font-weight:800;padding:5px 8px;cursor:pointer}.ov2-done:hover{background:#DFF3E8}.ov2-done:disabled{opacity:.6;cursor:wait}
  .ov2-empty{padding:13px;border:1px dashed #CFD9E4;border-radius:11px;background:#F8FAFC;color:#637487;font-size:13px}
  @media(max-width:900px){.ov2-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:520px){.ov2-kpis{grid-template-columns:1fr}}`;
  document.head.append(css);

  async function load() {
    if (loading) return; loading = true;
    try {
      const sb = window.YM?.sb; if (!sb) throw new Error('Sessão não iniciada.');
      const { data: d, error } = await sb.rpc('central_ym_overview_v2');
      if (error) throw error;
      data = d; render(); try { document.getElementById('caClientSearch')?.dispatchEvent(new Event('input')); } catch {}
    } catch (e) {
      const k = document.getElementById('caKpis'); if (k) k.innerHTML = `<div class="ov2-empty">Não foi possível carregar a visão geral: ${E(e.message || e)}</div>`;
    } finally { loading = false; }
  }

  function render() {
    const k = document.getElementById('caKpis'); if (!k || !data) return;
    k.className = 'ov2-kpis';
    const clients = (data.clients || []).filter((c) => c.kind === 'CLIENTE');
    const internal = (data.clients || []).filter((c) => c.kind !== 'CLIENTE');
    const receivable = (data.clients || []).reduce((n, c) => n + Number(c.monthly || 0), 0);
    const next = (data.clients || []).filter((c) => c.next_billing && Number(c.monthly) > 0).sort((a, b) => a.next_billing.localeCompare(b.next_billing))[0];
    const open = (data.opportunities || []).filter((o) => !CLOSED.has(o.stage));
    const proposal = open.filter((o) => o.stage === 'PROPOSTA');
    const prospect = open.filter((o) => o.stage !== 'PROPOSTA');
    k.innerHTML = `
      <button type="button" class="ov2-kpi" data-kpi="clients"><b>${clients.length}</b><span>Clientes ativos</span><small>${internal.length ? `Fora da contagem: ${internal.map((c) => E(c.name)).join(', ')} (prestação interna)` : 'Carteira de clientes recorrentes e avulsos'}</small><i>Ver clientes →</i></button>
      <button type="button" class="ov2-kpi" data-kpi="receivable"><b>${BRL(receivable)}</b><span>A receber por mês</span><small>${next ? `Próximo vencimento: ${dShort(next.next_billing)} · ${E(next.name)}` : 'Sem vencimento cadastrado'}</small><i>Ver de quem →</i></button>
      <button type="button" class="ov2-kpi" data-kpi="proposal"><b>${proposal.length}</b><span>Em proposta</span><small>${proposal.map((o) => E(o.name)).join(' · ') || 'Nenhuma proposta em aberto'}</small><i>Ver propostas →</i></button>
      <button type="button" class="ov2-kpi" data-kpi="prospect"><b>${prospect.length}</b><span>Em prospecção</span><small>Contatos em aberto antes da proposta</small><i>Ver contatos →</i></button>`;
    let t = document.getElementById('ov2Temp');
    if (!t) { t = document.createElement('div'); t.id = 'ov2Temp'; t.className = 'ov2-temp'; k.after(t); }
    const cnt = (x) => open.filter((o) => o.temperature === x).length, none = open.filter((o) => !o.temperature).length;
    t.innerHTML = `<span>Temperatura dos contatos em aberto:</span><button type="button" class="ov2-pill q" data-temp="QUENTE">Quente ${cnt('QUENTE')}</button><button type="button" class="ov2-pill m" data-temp="MORNO">Morno ${cnt('MORNO')}</button><button type="button" class="ov2-pill f" data-temp="FRIO">Frio ${cnt('FRIO')}</button>${none ? `<button type="button" class="ov2-pill n" data-temp="">Sem temperatura ${none}</button>` : ''}`;
    k.querySelectorAll('[data-kpi]').forEach((b) => (b.onclick = () => drill(b.dataset.kpi)));
    t.querySelectorAll('[data-temp]').forEach((b) => (b.onclick = () => drill('temp', b.dataset.temp)));
    renderTasks();
  }

  function renderTasks() {
    const view = document.getElementById('caView_dashboard'); if (!view) return;
    let root = document.getElementById('ov2Tasks');
    if (!root) { root = document.createElement('section'); root.id = 'ov2Tasks'; root.className = 'ov2-tasks'; const t = document.getElementById('ov2Temp'); (t || document.getElementById('caKpis')).after(root); }
    const groups = new Map();
    for (const task of data.tasks || []) {
      const key = task.client_id || 'SEM_CLIENTE';
      if (!groups.has(key)) groups.set(key, { id: task.client_id, name: task.client_name || 'Leads e YM (sem cliente vinculado)', items: [] });
      groups.get(key).items.push(task);
    }
    const now = Date.now();
    const cards = [...groups.values()].sort((a, b) => (a.id ? 0 : 1) - (b.id ? 0 : 1) || a.name.localeCompare(b.name, 'pt-BR'));
    root.innerHTML = `<div class="ov2-thead"><h2>Pendências</h2><button class="ym-btn secondary" data-new-task>＋ Nova pendência</button></div>${cards.length ? `<div class="ov2-tgrid">${cards.map((g) => {
      const late = g.items.some((i) => i.due_at && new Date(i.due_at).getTime() < now);
      return `<article class="ov2-tcard ${late ? 'late' : ''}"><header><b>${E(g.name)}</b><span>${g.items.length} pendência${g.items.length > 1 ? 's' : ''}</span></header><ul>${g.items.map((i) => { const l = i.due_at && new Date(i.due_at).getTime() < now; return `<li class="${l ? 'late' : ''} ov2-click" data-edit-task="${E(i.id)}" tabindex="0" title="Abrir para editar"><div class="ov2-li"><span>${E(i.title)}</span><button class="ov2-done" data-done="${E(i.id)}" title="Dar baixa">✓ Concluir</button></div><small>${i.due_at ? (l ? 'Atrasada · ' : 'Prazo · ') + dShort(i.due_at) : 'Sem prazo'}${i.priority === 'ALTA' ? ' · prioridade alta' : ''}</small></li>`; }).join('')}</ul>${g.id ? `<button class="ym-btn secondary" style="margin-top:9px" data-open-client="${E(g.id)}">Abrir cliente</button>` : ''}</article>`;
    }).join('')}</div>` : '<div class="ov2-empty">Nenhuma pendência aberta.</div>'}`;
    root.querySelectorAll('[data-open-client]').forEach((b) => { b.onclick = () => window.CentralYMConsole?.openClient(b.dataset.openClient); });
    root.querySelector('[data-new-task]').onclick = () => editTask(null);
    root.querySelectorAll('[data-edit-task]').forEach((li) => {
      const open = (e) => { if (e.target.closest('[data-done]')) return; editTask((data.tasks || []).find((t) => t.id === li.dataset.editTask)); };
      li.onclick = open; li.onkeydown = (e) => { if (e.key === 'Enter') open(e); };
    });
    root.querySelectorAll('[data-done]').forEach((b) => { b.onclick = async (ev) => { ev.stopPropagation();
      const task = (data.tasks || []).find((t) => t.id === b.dataset.done);
      const note = prompt(`Dar baixa em "${task?.title || 'pendência'}".\n\nObservação (opcional):`);
      if (note === null) return;
      b.disabled = true; b.textContent = 'Salvando…';
      const { error } = await window.YM.sb.rpc('central_ym_set_task_status', { p_task_id: b.dataset.done, p_status: 'CONCLUIDA', p_note: note || null });
      if (error) { b.disabled = false; b.textContent = '✓ Concluir'; return window.YM.toast?.(error.message, true); }
      window.YM.toast?.('Pendência concluída. Ela continua guardada no histórico.'); load();
    }; });
  }

  const TYPES = { TAREFA: 'Tarefa', VISITA: 'Visita', REUNIAO: 'Reunião', ENTREGA: 'Entrega', RELATORIO: 'Relatório', PUBLICACAO: 'Publicação', OUTRO: 'Outro' };
  const PRIOS = { ALTA: 'Alta', NORMAL: 'Normal', BAIXA: 'Baixa' };
  const STATUS = { ABERTA: 'Aberta', CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada' };
  const toLocalInput = (v) => { if (!v) return ''; const d = new Date(v); if (Number.isNaN(d.getTime())) return ''; const p = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(d); return p.replace(' ', 'T').slice(0, 16); };
  const fromLocalInput = (v) => (v ? new Date(v + ':00-03:00').toISOString() : null);
  const opts = (map, cur) => Object.entries(map).map(([k, l]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${l}</option>`).join('');

  function editTask(t) {
    const isNew = !t; t = t || { type: 'TAREFA', priority: 'NORMAL', status: 'ABERTA' };
    document.getElementById('ov2TaskModal')?.remove();
    const m = document.createElement('div'); m.id = 'ov2TaskModal'; m.className = 'ov2-back';
    m.innerHTML = `<section class="ov2-modal" role="dialog" aria-modal="true" aria-label="Pendência"><header><h2>${isNew ? 'Nova pendência' : 'Pendência'}</h2><button type="button" data-x aria-label="Fechar">×</button></header>
      <div class="ov2-form">
        <div class="ov2-wide"><label class="ym-label" for="tkTitle">O que precisa ser feito</label><input id="tkTitle" class="ym-input" value="${E(t.title || '')}"></div>
        <div><label class="ym-label" for="tkClient">Cliente</label><select id="tkClient" class="ym-select"><option value="">Sem cliente (lead ou YM)</option>${(data?.clients || []).map((c) => `<option value="${E(c.id)}" ${c.id === t.client_id ? 'selected' : ''}>${E(c.name)}</option>`).join('')}</select></div>
        <div><label class="ym-label" for="tkDue">Prazo</label><input id="tkDue" type="datetime-local" class="ym-input" value="${E(toLocalInput(t.due_at))}"></div>
        <div><label class="ym-label" for="tkType">Tipo</label><select id="tkType" class="ym-select">${opts(TYPES, t.type)}</select></div>
        <div><label class="ym-label" for="tkPrio">Prioridade</label><select id="tkPrio" class="ym-select">${opts(PRIOS, t.priority)}</select></div>
        <div><label class="ym-label" for="tkStatus">Status</label><select id="tkStatus" class="ym-select">${opts(STATUS, t.status || 'ABERTA')}</select></div>
        <div class="ov2-wide"><label class="ym-label" for="tkDetail">Detalhes e anotações</label><textarea id="tkDetail" class="ym-textarea" rows="6">${E(t.detail || '')}</textarea></div>
      </div>
      <p class="ov2-hint">Ao mudar o prazo, o compromisso ligado a esta pendência no calendário da Central acompanha a nova data. O Google Agenda não é alterado por aqui.</p>
      <div class="ov2-actions"><button class="ym-btn secondary" data-x>Cancelar</button><button class="ym-btn" data-save>${isNew ? 'Criar pendência' : 'Salvar'}</button></div></section>`;
    document.body.append(m);
    const close = () => m.remove();
    m.querySelectorAll('[data-x]').forEach((b) => (b.onclick = close));
    m.onclick = (e) => { if (e.target === m) close(); };
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
    m.querySelector('#tkTitle').focus();
    m.querySelector('[data-save]').onclick = async (e) => {
      const b = e.currentTarget, title = m.querySelector('#tkTitle').value.trim();
      if (!title) return window.YM.toast?.('Escreva o que precisa ser feito.', true);
      b.disabled = true; b.textContent = 'Salvando…';
      const { error } = await window.YM.sb.rpc('central_ym_upsert_task', {
        p_id: isNew ? null : t.id, p_title: title, p_detail: m.querySelector('#tkDetail').value,
        p_type: m.querySelector('#tkType').value, p_priority: m.querySelector('#tkPrio').value,
        p_due_at: fromLocalInput(m.querySelector('#tkDue').value), p_client_id: m.querySelector('#tkClient').value || null,
        p_status: m.querySelector('#tkStatus').value });
      if (error) { b.disabled = false; b.textContent = isNew ? 'Criar pendência' : 'Salvar'; return window.YM.toast?.(error.message, true); }
      close(); window.YM.toast?.(isNew ? 'Pendência criada.' : 'Pendência atualizada.'); load();
    };
  }

  const STAGE = { LEAD_MAPEADO: 'Lead mapeado', LEITURA_EM_PRODUCAO: 'Leitura em produção', LEITURA_ENVIADA: 'Leitura enviada', FOLLOW_UP: 'Follow-up', CONVERSA_AGENDADA: 'Conversa agendada', RAIOX_OFERTADO: 'Raio-X ofertado', RAIOX_PAGO: 'Raio-X pago', RAIOX_ENTREGUE: 'Raio-X entregue', PROPOSTA: 'Proposta', GANHO: 'Serviço contratado', PERDIDO: 'Perdido', DESQUALIFICADO: 'Desqualificado', ROTA_RECOMENDADA: 'Recomendação humana', IMPLANTACAO: 'Implantação' };
  const EDITABLE_STAGES = ['LEAD_MAPEADO', 'LEITURA_EM_PRODUCAO', 'LEITURA_ENVIADA', 'FOLLOW_UP', 'CONVERSA_AGENDADA', 'RAIOX_OFERTADO', 'RAIOX_PAGO', 'RAIOX_ENTREGUE', 'PROPOSTA'];
  const contractLabel = (c) => {
    const parts = [];
    if (Number(c.monthly) > 0) parts.push(`${BRL(c.monthly)}/mês · Recorrente`);
    if (Number(c.one_off) > 0) parts.push(`${BRL(c.one_off)} · Avulso`);
    if (!parts.length) parts.push((c.types || []).includes('RECORRENTE') ? 'Recorrente · sem valor' : (c.types || []).includes('AVULSO') ? 'Avulso · sem valor' : 'Sem serviço ativo');
    return parts.join(' + ');
  };

  function sheet(title, subtitle, rowsHtml, onBind) {
    document.getElementById('ov2Sheet')?.remove();
    const m = document.createElement('div'); m.id = 'ov2Sheet'; m.className = 'ov2-back';
    m.innerHTML = `<section class="ov2-modal" role="dialog" aria-modal="true" aria-label="${E(title)}"><header><div><h2>${E(title)}</h2>${subtitle ? `<small class="ov2-sub">${subtitle}</small>` : ''}</div><button type="button" data-x aria-label="Fechar">×</button></header><div class="ov2-list">${rowsHtml || '<div class="ov2-empty">Nada para mostrar.</div>'}</div></section>`;
    document.body.append(m);
    m.querySelector('[data-x]').onclick = () => m.remove();
    m.onclick = (e) => { if (e.target === m) m.remove(); };
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { m.remove(); document.removeEventListener('keydown', esc); } });
    onBind?.(m);
    return m;
  }
  const row = (attrs, main, sub, right) => `<button type="button" class="ov2-row" ${attrs}><span><b>${main}</b><small>${sub || ''}</small></span><span class="ov2-right">${right || ''}<i>Abrir →</i></span></button>`;

  function drill(kind, temp) {
    const open = (data.opportunities || []).filter((o) => !CLOSED.has(o.stage));
    const bindClient = (tab) => (m) => m.querySelectorAll('[data-client]').forEach((b) => (b.onclick = () => { m.remove(); window.CentralYMConsole?.openClient(b.dataset.client, tab); }));
    const bindOpp = (m) => m.querySelectorAll('[data-opp]').forEach((b) => (b.onclick = () => editOpp((data.opportunities || []).find((o) => o.id === b.dataset.opp))));
    const oppRow = (o) => row(`data-opp="${E(o.id)}"`, E(o.name), `${E(STAGE[o.stage] || o.stage)}${o.next_action ? ' · ' + E(o.next_action) : ''}`, o.temperature ? `<span class="ov2-pill ${o.temperature === 'QUENTE' ? 'q' : o.temperature === 'MORNO' ? 'm' : 'f'}">${TEMP[o.temperature]}</span>` : '<span class="ov2-pill n">Sem temperatura</span>');
    if (kind === 'clients') {
      const list = (data.clients || []).slice().sort((a, b) => (a.kind === 'CLIENTE' ? 0 : 1) - (b.kind === 'CLIENTE' ? 0 : 1) || a.name.localeCompare(b.name, 'pt-BR'));
      return sheet('Clientes ativos', 'Clique para abrir a ficha do cliente.', list.map((c) => row(`data-client="${E(c.id)}"`, E(c.name) + (c.kind !== 'CLIENTE' ? ' <em class="ov2-tag">prestação interna · fora da contagem</em>' : ''), E(c.contact_name || ''), `<span class="ov2-money">${E(contractLabel(c))}</span>`)).join(''), bindClient('resumo'));
    }
    if (kind === 'receivable') {
      const list = (data.clients || []).filter((c) => Number(c.monthly) > 0).sort((a, b) => Number(b.monthly) - Number(a.monthly));
      const total = list.reduce((n, c) => n + Number(c.monthly), 0);
      return sheet('A receber por mês', `Total ${BRL(total)} · mensalidades recorrentes ativas. Clique para abrir o financeiro do cliente.`, list.map((c) => row(`data-client="${E(c.id)}"`, E(c.name), c.next_billing ? `Próximo vencimento: ${dShort(c.next_billing)}` : 'Sem vencimento cadastrado', `<span class="ov2-money">${BRL(c.monthly)}/mês</span>`)).join(''), bindClient('financeiro'));
    }
    if (kind === 'proposal') return sheet('Em proposta', 'Clique para editar a oportunidade.', open.filter((o) => o.stage === 'PROPOSTA').map(oppRow).join(''), bindOpp);
    if (kind === 'prospect') return sheet('Em prospecção', 'Contatos em aberto antes da proposta. Clique para editar.', open.filter((o) => o.stage !== 'PROPOSTA').map(oppRow).join(''), bindOpp);
    if (kind === 'temp') return sheet(temp ? `Contatos ${TEMP[temp].toLowerCase()}s` : 'Contatos sem temperatura', 'Clique para editar a oportunidade.', open.filter((o) => (o.temperature || '') === temp).map(oppRow).join(''), bindOpp);
  }

  function editOpp(o) {
    if (!o) return;
    document.getElementById('ov2Sheet')?.remove();
    const stageOpts = (EDITABLE_STAGES.includes(o.stage) ? EDITABLE_STAGES : [o.stage, ...EDITABLE_STAGES]).map((s) => `<option value="${s}" ${s === o.stage ? 'selected' : ''}>${E(STAGE[s] || s)}</option>`).join('');
    const link = (v, l) => (v ? `<a href="${E(v)}" target="_blank" rel="noopener">${l} ↗</a>` : '');
    const m = document.createElement('div'); m.id = 'ov2TaskModal'; m.className = 'ov2-back';
    m.innerHTML = `<section class="ov2-modal" role="dialog" aria-modal="true" aria-label="Oportunidade"><header><div><h2>${E(o.name)}</h2><small class="ov2-sub">${E(o.contact_name || '')}${o.source ? ' · origem: ' + E(o.source) : ''}</small></div><button type="button" data-x aria-label="Fechar">×</button></header>
      <div class="ov2-form">
        <div><label class="ym-label" for="opStage">Status</label><select id="opStage" class="ym-select">${stageOpts}</select></div>
        <div><label class="ym-label" for="opTemp">Temperatura</label><select id="opTemp" class="ym-select"><option value="">Sem temperatura</option>${opts(TEMP, o.temperature || '')}</select></div>
        <div class="ov2-wide"><label class="ym-label" for="opNext">Próxima ação</label><input id="opNext" class="ym-input" value="${E(o.next_action || '')}"></div>
        <div><label class="ym-label" for="opFollow">Data do follow-up</label><input id="opFollow" type="date" class="ym-input" value="${E(o.follow_up || '')}"></div>
        <div><label class="ym-label" for="opValue">Valor da proposta (R$)</label><input id="opValue" type="number" step="0.01" min="0" class="ym-input" value="${o.proposal_value ?? ''}"></div>
        <div><label class="ym-label" for="opProposal">Link da proposta</label><input id="opProposal" class="ym-input" placeholder="https://…" value="${E(o.proposal_url || '')}"></div>
        <div><label class="ym-label" for="opPage">Link da página / pré-análise</label><input id="opPage" class="ym-input" placeholder="https://…" value="${E(o.page_url || '')}"></div>
        <div class="ov2-wide"><label class="ym-label" for="opNote">Nova observação (fica no histórico)</label><textarea id="opNote" class="ym-textarea" rows="3"></textarea></div>
        <div class="ov2-wide ov2-links">${link(o.proposal_url, 'Abrir proposta')}${link(o.page_url, 'Abrir página')}${link(o.reading_url, 'Abrir leitura inicial')}<a href="/CRM">Abrir CRM completo →</a></div>
      </div>
      <p class="ov2-hint">Para marcar como contratado ou perdido, use o CRM, porque essas etapas criam o cliente ou pedem o motivo da perda.</p>
      <div class="ov2-actions"><button class="ym-btn secondary" data-x>Cancelar</button><button class="ym-btn" data-save>Salvar</button></div></section>`;
    document.body.append(m);
    m.querySelectorAll('[data-x]').forEach((b) => (b.onclick = () => m.remove()));
    m.onclick = (e) => { if (e.target === m) m.remove(); };
    m.querySelector('[data-save]').onclick = async (e) => {
      const b = e.currentTarget;
      for (const id of ['opProposal', 'opPage']) { const v = m.querySelector('#' + id).value.trim(); if (v && !/^https?:\/\//i.test(v)) return window.YM.toast?.('Os links precisam começar com https://', true); }
      b.disabled = true; b.textContent = 'Salvando…';
      const val = m.querySelector('#opValue').value;
      const { error } = await window.YM.sb.rpc('central_ym_update_opportunity', {
        p_id: o.id, p_stage: m.querySelector('#opStage').value, p_temperature: m.querySelector('#opTemp').value,
        p_next_action: m.querySelector('#opNext').value, p_follow_up: m.querySelector('#opFollow').value || null,
        p_proposal_url: m.querySelector('#opProposal').value, p_page_url: m.querySelector('#opPage').value,
        p_proposal_value: val === '' ? null : Number(val), p_note: m.querySelector('#opNote').value });
      if (error) { b.disabled = false; b.textContent = 'Salvar'; return window.YM.toast?.(error.message, true); }
      m.remove(); window.YM.toast?.('Oportunidade atualizada.'); load();
    };
  }

  window.CentralOverviewV2 = { load, render, editTask, drill, editOpp, contractLabel, get data() { return data; } };
  function boot() {
    const wait = () => (window.YM?.sb ? load() : setTimeout(wait, 150)); wait();
    document.addEventListener('click', (e) => { if (e.target?.id === 'refreshAdmin') setTimeout(load, 300); });
    const meta = document.getElementById('ov2Clock');
    if (meta) { const tick = () => { meta.textContent = new Date().toLocaleString('pt-BR', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' }); }; tick(); setInterval(tick, 30000); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();

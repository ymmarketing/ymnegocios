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
  .ov2-kpi{background:#fff;border:1px solid var(--ym-line,#DCE5F0);border-radius:14px;padding:14px 16px}
  .ov2-kpi b{display:block;font:800 26px/1.1 Montserrat,sans-serif;color:var(--ym-navy,#0A2540);font-variant-numeric:tabular-nums}
  .ov2-kpi span{display:block;font-size:13px;color:#52667A;margin-top:4px}
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
      data = d; render();
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
      <div class="ov2-kpi"><b>${clients.length}</b><span>Clientes ativos</span><small>${internal.length ? `Fora da contagem: ${internal.map((c) => E(c.name)).join(', ')} (prestação interna)` : 'Carteira de clientes recorrentes e avulsos'}</small></div>
      <div class="ov2-kpi"><b>${BRL(receivable)}</b><span>A receber por mês</span><small>${next ? `Próximo vencimento: ${dShort(next.next_billing)} · ${E(next.name)}` : 'Sem vencimento cadastrado'}</small></div>
      <div class="ov2-kpi"><b>${proposal.length}</b><span>Em proposta</span><small>${proposal.map((o) => E(o.name)).join(' · ') || 'Nenhuma proposta em aberto'}</small></div>
      <div class="ov2-kpi"><b>${prospect.length}</b><span>Em prospecção</span><small>Contatos em aberto antes da proposta</small></div>`;
    let t = document.getElementById('ov2Temp');
    if (!t) { t = document.createElement('div'); t.id = 'ov2Temp'; t.className = 'ov2-temp'; k.after(t); }
    const cnt = (x) => open.filter((o) => o.temperature === x).length, none = open.filter((o) => !o.temperature).length;
    t.innerHTML = `<span>Temperatura dos contatos em aberto:</span><span class="ov2-pill q">Quente ${cnt('QUENTE')}</span><span class="ov2-pill m">Morno ${cnt('MORNO')}</span><span class="ov2-pill f">Frio ${cnt('FRIO')}</span>${none ? `<span class="ov2-pill n">Sem temperatura ${none}</span>` : ''}`;
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
    root.innerHTML = `<h2>Pendências</h2>${cards.length ? `<div class="ov2-tgrid">${cards.map((g) => {
      const late = g.items.some((i) => i.due_at && new Date(i.due_at).getTime() < now);
      return `<article class="ov2-tcard ${late ? 'late' : ''}"><header><b>${E(g.name)}</b><span>${g.items.length} pendência${g.items.length > 1 ? 's' : ''}</span></header><ul>${g.items.map((i) => { const l = i.due_at && new Date(i.due_at).getTime() < now; return `<li class="${l ? 'late' : ''}">${E(i.title)}<small>${i.due_at ? (l ? 'Atrasada · ' : 'Prazo · ') + dShort(i.due_at) : 'Sem prazo'}${i.priority === 'ALTA' ? ' · prioridade alta' : ''}</small></li>`; }).join('')}</ul>${g.id ? `<button class="ym-btn secondary" style="margin-top:9px" data-open-client="${E(g.id)}">Abrir cliente</button>` : ''}</article>`;
    }).join('')}</div>` : '<div class="ov2-empty">Nenhuma pendência aberta.</div>'}`;
    root.querySelectorAll('[data-open-client]').forEach((b) => { b.onclick = () => window.CentralYMConsole?.openClient(b.dataset.openClient); });
  }

  window.CentralOverviewV2 = { load, render, get data() { return data; } };
  function boot() {
    const wait = () => (window.YM?.sb ? load() : setTimeout(wait, 150)); wait();
    document.addEventListener('click', (e) => { if (e.target?.id === 'refreshAdmin') setTimeout(load, 300); });
    const meta = document.getElementById('ov2Clock');
    if (meta) { const tick = () => { meta.textContent = new Date().toLocaleString('pt-BR', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' }); }; tick(); setInterval(tick, 30000); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();

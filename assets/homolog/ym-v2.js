/* Central YM v2 · utilitários comuns da cópia de teste (30/10/2026)
   Datas sem fuso (YYYY-MM-DD) são tratadas como data de calendário, nunca convertidas por fuso. */
(() => {
  if (window.YMV2) return;
  const TZ = 'America/Sao_Paulo';
  const E = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const BRL = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const isDateOnly = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));
  const date = (v) => { if (!v) return '—'; if (isDateOnly(v)) { const [y, m, d] = String(v).split('-'); return `${d}/${m}/${y}`; } const d = new Date(v); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR', { timeZone: TZ }); };
  const dateShort = (v) => { const s = date(v); return s === '—' ? s : s.slice(0, 5); };
  const dateTime = (v) => { if (!v) return '—'; if (isDateOnly(v)) return date(v); const d = new Date(v); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' }); };
  const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(new Date());
  const monthKey = (v) => String(v || today()).slice(0, 7);
  const toLocalInput = (v) => { if (!v) return ''; const d = new Date(v); if (Number.isNaN(d.getTime())) return ''; return new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(d).replace(' ', 'T').slice(0, 16); };
  const fromLocalInput = (v) => (v ? new Date(v + ':00-03:00').toISOString() : null);
  const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1).replace('.', ',')}%` : 'sem base');
  const opts = (map, cur, empty) => (empty !== undefined ? `<option value="">${E(empty)}</option>` : '') + Object.entries(map).map(([k, l]) => `<option value="${E(k)}" ${k === cur ? 'selected' : ''}>${E(l)}</option>`).join('');
  const isHttp = (v) => /^https?:\/\//i.test(String(v || '').trim());

  const css = document.createElement('style');
  css.textContent = `
  .v2-back{position:fixed;inset:0;z-index:500;background:rgba(4,22,38,.6);display:grid;place-items:center;padding:16px}
  .v2-modal{width:min(680px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.28)}
  .v2-modal.wide{width:min(980px,100%)}
  .v2-modal>header{display:flex;justify-content:space-between;align-items:center;gap:10px;background:#0A2540;color:#fff;padding:14px 18px;position:sticky;top:0;z-index:2}
  .v2-modal>header h2{font:800 17px Montserrat,sans-serif;margin:0}.v2-modal>header small{display:block;font-size:12.5px;color:#BED1E3;margin-top:3px}
  .v2-modal>header button{width:36px;height:36px;border:0;border-radius:9px;background:rgba(255,255,255,.12);color:#fff;font-size:20px;cursor:pointer;flex:none}
  .v2-body{padding:16px 18px}.v2-form{display:grid;grid-template-columns:1fr 1fr;gap:10px}.v2-wide{grid-column:1/-1}
  .v2-hint{font-size:12.5px;color:#7A8B9B;line-height:1.5;margin:8px 0 0}
  .v2-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;padding:0 18px 18px}
  .v2-list{display:grid;gap:6px}
  .v2-row{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;text-align:left;font:inherit;background:#fff;border:1px solid #DCE5F0;border-radius:12px;padding:11px 13px;cursor:pointer;color:inherit;text-decoration:none}
  .v2-row:hover,.v2-row:focus-visible{border-color:#484DCF;background:#F7F8FF;outline:none}
  .v2-row b{display:block;font-size:14px;color:#0A2540}.v2-row small{display:block;font-size:12.5px;color:#6B7C91;margin-top:2px;line-height:1.45}
  .v2-right{display:flex;align-items:center;gap:10px;flex:none;flex-wrap:wrap;justify-content:flex-end}
  .v2-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin:12px 0}
  .v2-kpi{text-align:left;font:inherit;cursor:pointer;display:flex;flex-direction:column;background:#fff;border:1px solid #DCE5F0;border-radius:14px;padding:14px 16px;transition:border-color .15s,box-shadow .15s}
  .v2-kpi:hover,.v2-kpi:focus-visible{border-color:#484DCF;box-shadow:0 6px 18px rgba(72,77,207,.12);outline:none}
  .v2-kpi b{font:800 26px/1.1 Montserrat,sans-serif;color:#0A2540;font-variant-numeric:tabular-nums}.v2-kpi span{font-size:13px;color:#52667A;margin-top:4px}
  .v2-kpi small{font-size:12px;color:#7A8B9B;margin-top:6px;line-height:1.45}.v2-kpi i{font-style:normal;font-size:12.5px;font-weight:700;color:#484DCF;margin-top:auto;padding-top:8px}
  .v2-chip{display:inline-flex;align-items:center;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:800;background:#EEF2F6;color:#52667A;white-space:nowrap}
  .v2-chip.ok{background:#E7F6EE;color:#137A5B}.v2-chip.warn{background:#FFF4E0;color:#8A5300}.v2-chip.bad{background:#FDECEC;color:#A52A2A}.v2-chip.info{background:#EEF0FF;color:#3B40B5}
  .v2-chip.q{background:#FFF2EE;color:#A63A1C}.v2-chip.m{background:#FFF8EA;color:#8A5300}.v2-chip.f{background:#F1F6FF;color:#24507F}
  .v2-toolbar{display:grid;grid-template-columns:minmax(220px,1.4fr) repeat(auto-fit,minmax(150px,1fr));gap:9px;margin:12px 0}
  .v2-empty{padding:14px;border:1px dashed #CFD9E4;border-radius:11px;background:#F8FAFC;color:#637487;font-size:13px}
  .v2-section{background:#fff;border:1px solid #DCE5F0;border-radius:16px;padding:16px;margin:12px 0}
  .v2-section>h2{font:800 16px Montserrat,sans-serif;color:#0A2540;margin:0 0 4px}.v2-section>p{font-size:13px;color:#6B7C91;margin:0 0 10px;line-height:1.5}
  .v2-table{width:100%;border-collapse:collapse;font-size:13px}.v2-table th{text-align:left;font-size:11.5px;text-transform:uppercase;letter-spacing:.04em;color:#6B7C91;padding:8px 8px;border-bottom:1px solid #DCE5F0}
  .v2-table td{padding:9px 8px;border-bottom:1px solid #EDF2F6;color:#22394F;vertical-align:top}.v2-table tr.click{cursor:pointer}.v2-table tr.click:hover td{background:#F7F8FF}
  .v2-table .num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
  .v2-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 4px}.v2-tabs button{border:1px solid #DCE5F0;background:#fff;color:#52667A;border-radius:10px;padding:9px 14px;font:700 13px Inter,sans-serif;cursor:pointer}
  .v2-tabs button.on{background:#0A2540;color:#fff;border-color:#0A2540}
  .v2-scroll{overflow-x:auto}
  @media(max-width:600px){.v2-toolbar{grid-template-columns:1fr!important}.v2-toolbar>*{min-width:0}.v2-form{grid-template-columns:1fr}.v2-row{flex-direction:column;align-items:flex-start}.v2-right{justify-content:flex-start}}`;
  document.head.append(css);

  function modal({ title, subtitle = '', body = '', actions = '', wide = false, onClose }) {
    const m = document.createElement('div'); m.className = 'v2-back';
    m.innerHTML = `<section class="v2-modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${E(title)}"><header><div><h2>${E(title)}</h2>${subtitle ? `<small>${subtitle}</small>` : ''}</div><button type="button" data-x aria-label="Fechar">×</button></header><div class="v2-body">${body}</div>${actions ? `<div class="v2-actions">${actions}</div>` : ''}</section>`;
    document.body.append(m);
    const close = () => { m.remove(); document.removeEventListener('keydown', esc); onClose?.(); };
    function esc(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', esc);
    m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-x]')) close(); });
    m.close = close; return m;
  }
  const row = (attrs, main, sub, right, open = 'Abrir →') => `<button type="button" class="v2-row" ${attrs}><span><b>${main}</b>${sub ? `<small>${sub}</small>` : ''}</span><span class="v2-right">${right || ''}${open ? `<i style="font-style:normal;font-size:12px;font-weight:700;color:#484DCF">${open}</i>` : ''}</span></button>`;
  async function rpc(name, args) { const { data, error } = await window.YM.sb.rpc(name, args || {}); if (error) throw new Error(error.message); return data; }
  async function ready() { while (!window.YM?.sb) await new Promise((r) => setTimeout(r, 100)); const s = await window.YM.requireSession(location.pathname); return s; }
  const toast = (m, err) => window.YM?.toast?.(m, err);
  function clock(id) { const el = document.getElementById(id); if (!el) return; const t = () => { el.textContent = new Date().toLocaleString('pt-BR', { timeZone: TZ, dateStyle: 'short', timeStyle: 'short' }); }; t(); setInterval(t, 30000); }
  async function busy(btn, label, fn) { const old = btn.textContent; btn.disabled = true; btn.textContent = label; try { return await fn(); } finally { btn.disabled = false; btn.textContent = old; } }

  window.YMV2 = { TZ, E, BRL, date, dateShort, dateTime, today, monthKey, toLocalInput, fromLocalInput, pct, opts, isHttp, modal, row, rpc, ready, toast, clock, busy };
})();

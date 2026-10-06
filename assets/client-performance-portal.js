(() => {
  if (window.__ymClientPerformancePortal) return; window.__ymClientPerformancePortal = true;
  const E = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const CAT = { NEGOCIO:'Negócio', COMERCIAL:'Comercial', MARKETING:'Marketing', SITE:'Site', REDES_SOCIAIS:'Redes sociais', ATENDIMENTO:'Atendimento', FINANCEIRO:'Financeiro', OPERACAO:'Operação' };
  const CAT_ORDER = ['NEGOCIO','COMERCIAL','FINANCEIRO','MARKETING','SITE','REDES_SOCIAIS','ATENDIMENTO','OPERACAO'];
  const SRC = { CRM:'CRM YM', REPORTEI:'Reportei', MANUAL:'Registro manual', GA4:'Google Analytics', META:'Meta' };
  const catName = (c) => CAT[c] || String(c || 'Outros').replaceAll('_',' ').toLowerCase().replace(/^./, (x) => x.toUpperCase());
  const pretty = (v) => String(v || '—').replaceAll('_',' ').toLowerCase().replace(/^./, (x) => x.toUpperCase());
  const num = (v, unit, compact) => { if (v == null || !Number.isFinite(Number(v))) return '—'; const n = Number(v); if (unit === 'MOEDA') return n.toLocaleString('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits: compact ? 0 : 2 }); if (unit === 'PERCENTUAL') return n.toLocaleString('pt-BR', { maximumFractionDigits:2 }) + '%'; if (compact && Math.abs(n) >= 10000) return n.toLocaleString('pt-BR', { notation:'compact', maximumFractionDigits:1 }); return n.toLocaleString('pt-BR', { maximumFractionDigits:2 }); };
  const pct = (d) => (d > 0 ? '+' : '') + d.toLocaleString('pt-BR', { maximumFractionDigits: Math.abs(d) < 10 ? 1 : 0 }) + '%';
  const dBR = (iso, opt) => iso ? new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', opt || { day:'2-digit', month:'2-digit', year:'numeric' }) : '—';
  const state = { cat:'TODAS', sit:'TODAS', cmp:'BASE' };
  try { const s = JSON.parse(localStorage.getItem('ymPerfFilters') || '{}'); Object.assign(state, s); } catch (e) {}
  const save = () => { try { localStorage.setItem('ymPerfFilters', JSON.stringify(state)); } catch (e) {} };

  /* ---------- modelo ---------- */
  function series(kpi) {
    const rows = (kpi.measurements || []).filter((m) => m.validation_status !== 'DESCARTADO' && (m.validation_status === 'VALIDADO' || m.validation_status == null) && m.value != null);
    const byEnd = new Map();
    rows.forEach((m) => { const k = m.period_end; const prev = byEnd.get(k); if (!prev || (!m.is_baseline && prev.is_baseline) || String(m.observed_at || '') > String(prev.observed_at || '')) byEnd.set(k, m); });
    if (kpi.baseline_value != null && kpi.baseline_period_end && !byEnd.has(kpi.baseline_period_end)) byEnd.set(kpi.baseline_period_end, { period_end: kpi.baseline_period_end, period_start: kpi.baseline_period_start, value: kpi.baseline_value, is_baseline: true, source_type: kpi.source_type });
    return [...byEnd.values()].sort((a, b) => String(a.period_end).localeCompare(String(b.period_end))).map((m) => ({ ...m, value: Number(m.value) }));
  }
  function model(kpi) {
    const s = series(kpi);
    const baseEnd = kpi.baseline_period_end || s[0]?.period_end || null;
    const base = kpi.baseline_value != null ? Number(kpi.baseline_value) : (s[0]?.value ?? null);
    const after = s.filter((m) => !baseEnd || m.period_end > baseEnd);
    const last = after[after.length - 1] || null;
    const prev = after.length > 1 ? after[after.length - 2] : (last ? { value: base, period_end: baseEnd } : null);
    const ref = state.cmp === 'PREV' ? prev : { value: base, period_end: baseEnd };
    const better = kpi.direction === 'MENOR_MELHOR' ? -1 : 1;
    let delta = null, abs = null;
    if (last && ref && ref.value != null) { abs = last.value - ref.value; delta = ref.value === 0 ? (last.value === 0 ? 0 : null) : (abs / Math.abs(ref.value)) * 100; }
    const signed = abs == null ? null : abs * better;
    const tol = ref && ref.value != null ? Math.max(Math.abs(ref.value) * 0.02, 1e-9) : 1e-9;
    const sit = !last ? 'SEM' : signed > tol ? 'MELHOROU' : signed < -tol ? 'PIOROU' : 'ESTAVEL';
    const target = kpi.target_value != null ? Number(kpi.target_value) : null;
    let progress = null;
    if (target != null && base != null && target !== base) { const cur = last ? last.value : base; progress = Math.max(0, Math.min(1.2, (cur - base) / (target - base))); }
    const lastDate = last?.period_end || baseEnd;
    const stale = lastDate ? (Date.now() - new Date(lastDate + 'T12:00:00').getTime()) / 864e5 > 40 : true;
    return { kpi, s, base, baseEnd, last, prev, ref, delta, abs, sit, target, progress, stale, better };
  }

  /* ---------- gráficos (SVG) ---------- */
  function spark(m, w = 300, h = 86) {
    const pts = m.s; const unit = m.kpi.unit;
    if (pts.length < 2) return `<div class="pf-spark-empty">${pts.length ? 'Só o ponto de partida até agora. A linha aparece a partir da próxima medição.' : 'Aguardando primeira medição.'}</div>`;
    const vals = pts.map((p) => p.value).concat(m.target != null ? [m.target] : []);
    let lo = Math.min(...vals), hi = Math.max(...vals); if (lo === hi) { lo -= 1; hi += 1; } const pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
    const L = 6, R = w - 6, T = 8, B = h - 6;
    const x = (i) => L + (R - L) * (pts.length === 1 ? 0.5 : i / (pts.length - 1));
    const y = (v) => B - (B - T) * ((v - lo) / (hi - lo));
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join('');
    const area = `${path}L${x(pts.length - 1).toFixed(1)},${B}L${x(0).toFixed(1)},${B}Z`;
    const col = m.sit === 'PIOROU' ? 'var(--pf-down)' : m.sit === 'MELHOROU' ? 'var(--pf-up)' : 'var(--pf-flat)';
    const baseY = m.base != null ? y(m.base) : null, tY = m.target != null ? y(m.target) : null;
    const lastP = pts[pts.length - 1];
    return `<svg class="pf-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Evolução de ${E(m.kpi.name)}: de ${E(num(pts[0].value, unit))} para ${E(num(lastP.value, unit))}">
      <path d="${area}" fill="${col}" opacity=".10"/>
      ${baseY != null ? `<line x1="${L}" x2="${R}" y1="${baseY.toFixed(1)}" y2="${baseY.toFixed(1)}" stroke="var(--pf-axis)" stroke-dasharray="3 4" stroke-width="1" vector-effect="non-scaling-stroke"/>` : ''}
      ${tY != null ? `<line x1="${L}" x2="${R}" y1="${tY.toFixed(1)}" y2="${tY.toFixed(1)}" stroke="var(--pf-target)" stroke-dasharray="6 4" stroke-width="1.4" vector-effect="non-scaling-stroke"/>` : ''}
      <path d="${path}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      ${pts.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="${i === pts.length - 1 ? 3.6 : 2.2}" fill="${i === pts.length - 1 ? col : '#fff'}" stroke="${col}" stroke-width="1.6" vector-effect="non-scaling-stroke"><title>${E(dBR(p.period_end))}: ${E(num(p.value, unit))}</title></circle>`).join('')}

    </svg><div class="pf-axl"><span>${E(dBR(pts[0].period_end, { day:'2-digit', month:'short' }))}</span><span>${E(dBR(lastP.period_end, { day:'2-digit', month:'short' }))}</span></div>`;
  }
  function diverging(ms) {
    const rows = ms.filter((m) => m.delta != null).sort((a, b) => (b.delta * b.better) - (a.delta * a.better));
    if (!rows.length) return '<div class="pf-empty">Os comparativos aparecem assim que houver uma medição nova depois do ponto de partida.</div>';
    const cap = Math.max(25, Math.min(100, Math.ceil(Math.max(...rows.map((m) => Math.abs(m.delta))) / 25) * 25));
    return `<div class="pf-div" role="list">${rows.map((m) => { const d = m.delta, good = d * m.better; const w = Math.min(Math.abs(d), cap) / cap * 50; const cls = Math.abs(good) < 0.0001 ? 'flat' : good > 0 ? 'up' : 'down'; const left = d < 0; return `<div class="pf-div-row" role="listitem"><div class="pf-div-name"><b>${E(m.kpi.name)}</b><small>${E(catName(m.kpi.category))} · ${E(num(m.ref?.value, m.kpi.unit, true))} → ${E(num(m.last?.value, m.kpi.unit, true))}</small></div><div class="pf-div-track"><span class="pf-div-mid"></span><span class="pf-div-bar ${cls}" style="${left ? `right:50%` : `left:50%`};width:${Math.max(w, 0.8).toFixed(2)}%"></span></div><div class="pf-div-val ${cls}">${E(pct(d))}${Math.abs(d) > cap ? '<i>›</i>' : ''}</div></div>`; }).join('')}<div class="pf-div-row pf-div-scale"><span></span><span class="pf-div-ticks"><i>−${cap}%</i><i>0</i><i>+${cap}%</i></span><span></span></div></div>`;
  }

  /* ---------- leitura executiva ---------- */
  function narrative(ms) {
    const measured = ms.filter((m) => m.sit !== 'SEM');
    const up = ms.filter((m) => m.sit === 'MELHOROU'), down = ms.filter((m) => m.sit === 'PIOROU'), flat = ms.filter((m) => m.sit === 'ESTAVEL'), none = ms.filter((m) => m.sit === 'SEM');
    const best = [...up].sort((a, b) => (b.delta ?? 0) * b.better - (a.delta ?? 0) * a.better)[0];
    const worst = [...down].sort((a, b) => (a.delta ?? 0) * a.better - (b.delta ?? 0) * b.better)[0];
    const ref = state.cmp === 'PREV' ? 'à medição anterior' : 'ao ponto de partida';
    const parts = [];
    if (!measured.length) parts.push(`Temos o ponto de partida de <b>${ms.length}</b> ${ms.length === 1 ? 'indicador' : 'indicadores'}. A primeira comparação aparece aqui assim que a próxima medição for validada.`);
    else {
      parts.push(`Em relação ${ref}, <b>${up.length}</b> de ${measured.length} ${measured.length === 1 ? 'indicador medido melhorou' : 'indicadores medidos melhoraram'}${down.length ? `, <b>${down.length}</b> ${down.length === 1 ? 'piorou' : 'pioraram'}` : ''}${flat.length ? ` e <b>${flat.length}</b> ${flat.length === 1 ? 'ficou estável' : 'ficaram estáveis'}` : ''}.`);
      if (best) parts.push(`O maior avanço está em <b>${E(best.kpi.name)}</b> (${E(pct(best.delta))}).`);
      if (worst) parts.push(`O ponto de atenção é <b>${E(worst.kpi.name)}</b> (${E(pct(worst.delta))}), que já está no radar da YM.`);
    }
    if (none.length && measured.length) parts.push(`${none.length} ${none.length === 1 ? 'indicador ainda aguarda' : 'indicadores ainda aguardam'} nova medição.`);
    return parts.join(' ');
  }

  /* ---------- UI ---------- */
  function inject() {
    const nav = document.querySelector('.cp-nav'); const content = document.querySelector('.cp-content'); if (!nav || !content || document.getElementById('view_resultados')) return false;
    const button = document.createElement('button'); button.dataset.performanceNav = '1'; button.dataset.nav = 'resultados'; button.innerHTML = '<i>R</i>Resultados';
    const finance = nav.querySelector('[data-nav="financeiro"]'); nav.insertBefore(button, finance || nav.lastElementChild);
    const section = document.createElement('section'); section.id = 'view_resultados'; section.className = 'cp-view';
    section.innerHTML = `<div class="cp-head"><div><div class="cp-ey">Acompanhamento de resultados</div><h1>Resultados</h1><p>A história do seu negócio em números: de onde partimos, onde estamos agora e o que mudou no caminho.</p></div></div><div id="cpPerformanceRoot"><div class="pf-empty">Carregando seus indicadores…</div></div>`;
    content.append(section);
    button.onclick = () => { document.querySelectorAll('.cp-view').forEach((x) => x.classList.remove('on')); document.querySelectorAll('.cp-nav button').forEach((x) => x.classList.remove('on')); section.classList.add('on'); button.classList.add('on'); history.replaceState({}, '', location.pathname + '#resultados'); document.getElementById('cpSidebar')?.classList.remove('open'); render(true); };
    section.addEventListener('click', (e) => { const b = e.target.closest('[data-pf]'); if (!b) return; state[b.dataset.pf] = b.dataset.v; save(); render(true); });
    const style = document.createElement('style'); style.id = 'pfStyle'; style.textContent = `
    #view_resultados{--pf-up:#117A5B;--pf-up-bg:#E7F6EF;--pf-down:#B42318;--pf-down-bg:#FDEEEC;--pf-flat:#5B6E81;--pf-flat-bg:#EEF2F6;--pf-axis:#9AA9B8;--pf-target:#FF7A00;--pf-line:var(--line,#DDE6EF);--pf-ink:var(--navy,#0A2540);--pf-muted:var(--muted,#6D7F91)}
    .pf-empty{padding:26px;text-align:center;color:var(--pf-muted);font-size:13px;border:1px dashed #ccd7e1;border-radius:14px;background:#fff}
    .pf-bar{display:flex;flex-wrap:wrap;gap:10px 20px;align-items:center;background:#fff;border:1px solid var(--pf-line);border-radius:14px;padding:12px 14px;margin-bottom:14px}
    .pf-group{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.pf-group>small{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#7A8CA0;margin-right:2px}
    .pf-pill{border:1px solid #DCE4EE;background:#fff;color:#33495E;border-radius:999px;padding:7px 12px;font:600 12px Inter,sans-serif;cursor:pointer}
    .pf-pill.on{background:var(--pf-ink);border-color:var(--pf-ink);color:#fff}
    .pf-pill b{font-weight:800;margin-left:4px;opacity:.7}
    .pf-story{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:12px;margin-bottom:12px}
    .pf-read{background:linear-gradient(135deg,#0A2540,#17466F 72%,#484DCF);color:#fff;border-radius:16px;padding:20px 22px;position:relative;overflow:hidden}
    .pf-read:after{content:"";position:absolute;width:220px;height:220px;border:1px solid rgba(255,255,255,.12);border-radius:50%;right:-80px;top:-90px}
    .pf-read small{font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#FFB36D}
    .pf-read p{font-size:15px;line-height:1.65;margin:10px 0 0;max-width:62ch;color:#E6EDF6}.pf-read p b{color:#fff}
    .pf-read .pf-legal{font-size:11.5px;line-height:1.5;color:#AFC0D3;margin-top:14px}
    .pf-big{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .pf-bn{background:#fff;border:1px solid var(--pf-line);border-radius:14px;padding:14px 16px;min-width:0}
    .pf-bn small{display:block;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#7A8CA0}
    .pf-bn b{display:block;font:800 26px/1.1 Montserrat,sans-serif;color:var(--pf-ink);margin-top:8px;font-variant-numeric:tabular-nums}
    .pf-bn b.up{color:var(--pf-up)}.pf-bn b.down{color:var(--pf-down)}
    .pf-bn span{display:block;font-size:12px;line-height:1.4;color:var(--pf-muted);margin-top:4px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
    .pf-meter{height:8px;border-radius:8px;background:#EEF2F6;overflow:hidden;display:flex;margin-top:10px}.pf-meter i{display:block;height:100%}
    .pf-sec{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;margin:20px 0 10px}
    .pf-sec h2{font:800 18px Montserrat,sans-serif;color:var(--pf-ink);margin:0}.pf-sec span{font-size:12px;color:var(--pf-muted)}
    .pf-heroes{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
    .pf-hero{background:#fff;border:1px solid var(--pf-line);border-radius:16px;padding:16px 18px;box-shadow:0 10px 30px rgba(7,26,46,.05);min-width:0}
    .pf-hero-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
    .pf-cat{display:inline-block;font-size:10.5px;font-weight:800;border-radius:999px;padding:4px 9px;background:#EEF0FF;color:#3E44B8}
    .pf-hero h3,.pf-card h3{font:800 15px/1.3 Montserrat,sans-serif;color:var(--pf-ink);margin:8px 0 0;text-wrap:balance}
    .pf-now{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-top:10px}
    .pf-now b{font:800 30px/1 Montserrat,sans-serif;color:var(--pf-ink);font-variant-numeric:tabular-nums}
    .pf-chip{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:4px 9px;font-size:11.5px;font-weight:800;background:var(--pf-flat-bg);color:var(--pf-flat);white-space:nowrap}
    .pf-chip.up{background:var(--pf-up-bg);color:var(--pf-up)}.pf-chip.down{background:var(--pf-down-bg);color:var(--pf-down)}.pf-chip.wait{background:#FFF5E8;color:#A4510A}
    .pf-from{font-size:12px;color:var(--pf-muted);margin-top:6px}
    .pf-spark{width:100%;height:86px;display:block;margin-top:10px;overflow:visible}.pf-ax{font:600 10px Inter,sans-serif;fill:var(--pf-muted)}
    .pf-spark-empty{font-size:12px;line-height:1.45;color:var(--pf-muted);background:#F7F9FC;border-radius:10px;padding:12px;margin-top:10px}
    .pf-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:11px;color:var(--pf-muted);margin-top:6px}.pf-legend i{display:inline-block;width:16px;border-top:2px dashed var(--pf-axis);vertical-align:middle;margin-right:5px}.pf-legend i.t{border-color:var(--pf-target)}
    .pf-panel{background:#fff;border:1px solid var(--pf-line);border-radius:16px;padding:16px 18px}
    .pf-div{display:grid;gap:4px}
    .pf-div-row{display:grid;grid-template-columns:minmax(150px,1.1fr) minmax(0,1.6fr) 76px;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid #EEF2F6}
    .pf-div-name{min-width:0}.pf-div-name b{display:block;font-size:13px;color:var(--pf-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pf-div-name small{display:block;font-size:11px;color:var(--pf-muted);margin-top:2px;font-variant-numeric:tabular-nums}
    .pf-div-track{position:relative;height:18px;background:#F4F7FA;border-radius:6px}
    .pf-div-mid{position:absolute;left:50%;top:-3px;bottom:-3px;width:2px;background:#B8C5D2;transform:translateX(-1px)}
    .pf-div-bar{position:absolute;top:3px;height:12px;border-radius:4px;background:var(--pf-flat)}.pf-div-bar.up{background:var(--pf-up)}.pf-div-bar.down{background:var(--pf-down)}
    .pf-div-val{font:800 13px Inter,sans-serif;text-align:right;font-variant-numeric:tabular-nums;color:var(--pf-flat)}.pf-div-val.up{color:var(--pf-up)}.pf-div-val.down{color:var(--pf-down)}.pf-div-val i{font-style:normal;margin-left:2px}
    .pf-div-scale{border-bottom:0;padding-top:2px}.pf-div-ticks{display:flex;justify-content:space-between;font-size:10px;color:var(--pf-muted);font-variant-numeric:tabular-nums}.pf-div-ticks i{font-style:normal}.pf-axl{display:flex;justify-content:space-between;font-size:10.5px;color:var(--pf-muted);margin-top:4px}
    .pf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}
    .pf-card{background:#fff;border:1px solid var(--pf-line);border-radius:16px;padding:16px 18px;min-width:0;display:flex;flex-direction:column}
    .pf-card p.desc{font-size:12px;line-height:1.5;color:var(--pf-muted);margin:6px 0 0}
    .pf-trio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:12px}
    .pf-trio div{background:#F7F9FC;border-radius:10px;padding:8px 10px;min-width:0}.pf-trio small{display:block;font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#7A8CA0}
    .pf-trio b{display:block;font:800 16px/1.2 Montserrat,sans-serif;color:var(--pf-ink);margin-top:4px;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .pf-trio div.cur{background:#EEF0FF}.pf-trio div.cur b{color:#3E44B8}
    .pf-prog{margin-top:10px}.pf-prog small{display:flex;justify-content:space-between;font-size:11px;color:var(--pf-muted)}.pf-prog div{height:7px;border-radius:7px;background:#EEF2F6;margin-top:4px;overflow:hidden}.pf-prog i{display:block;height:100%;background:linear-gradient(90deg,#484DCF,#FF7A00);border-radius:7px}
    .pf-meta{font-size:11px;color:var(--pf-muted);margin-top:auto;padding-top:10px}
    .pf-stale{color:#A4510A;font-weight:700}
    .pf-tl{position:relative;padding-left:22px;display:grid;gap:10px}.pf-tl:before{content:"";position:absolute;left:7px;top:6px;bottom:6px;width:2px;background:#E1E7EF}
    .pf-tl-item{position:relative;background:#fff;border:1px solid var(--pf-line);border-radius:14px;padding:12px 14px}
    .pf-tl-item:before{content:"";position:absolute;left:-20px;top:16px;width:12px;height:12px;border-radius:50%;background:#fff;border:3px solid #484DCF}
    .pf-tl-item.done:before{border-color:var(--pf-up);background:var(--pf-up)}
    .pf-tl-item b{font-size:13.5px;color:var(--pf-ink)}.pf-tl-item p{font-size:12px;line-height:1.5;color:var(--pf-muted);margin:4px 0 0}.pf-tl-item small{font-size:11px;color:#7A8CA0}
    .pf-note{font-size:11.5px;line-height:1.55;color:var(--pf-muted);margin-top:14px}
    @media(max-width:1100px){.pf-story{grid-template-columns:1fr}}
    @media(max-width:700px){.pf-big{grid-template-columns:1fr 1fr}.pf-bn b{font-size:22px}.pf-div-row{grid-template-columns:1fr 64px}.pf-div-track{grid-column:1/-1;grid-row:2}.pf-div-scale{display:none}.pf-div-ticks{display:none}.pf-grid{grid-template-columns:1fr}.pf-trio b{font-size:14px}}
    `; document.head.append(style);
    if ((location.hash || '') === '#resultados') setTimeout(() => button.click(), 0); return true;
  }

  function contentMetrics(portal) { return (portal.contents || []).flatMap((c) => (c.performance_metrics || []).map((m) => ({ ...m, content_title: c.title || c.theme || 'Conteúdo' }))); }
  const chip = (m) => m.sit === 'SEM' ? '<span class="pf-chip wait">Aguardando medição</span>' : m.delta == null ? `<span class="pf-chip ${m.sit === 'MELHOROU' ? 'up' : m.sit === 'PIOROU' ? 'down' : ''}">${m.sit === 'MELHOROU' ? '▲ Melhorou' : m.sit === 'PIOROU' ? '▼ Piorou' : '■ Estável'}</span>` : `<span class="pf-chip ${m.sit === 'MELHOROU' ? 'up' : m.sit === 'PIOROU' ? 'down' : ''}">${m.abs > 0 ? '▲' : m.abs < 0 ? '▼' : '■'} ${E(pct(m.delta))}</span>`;

  function render(force) {
    const portal = window.CentralYMClientPortal?.data; const root = document.getElementById('cpPerformanceRoot'); if (!root || !portal) return;
    if (!force && root.__data === portal) return;
    root.__data = portal;
    const kpis = portal.performance?.kpis || [], actions = portal.performance?.actions || [], cms = contentMetrics(portal);
    if (!kpis.length) { root.innerHTML = '<div class="pf-empty">Os indicadores combinados com a YM aparecerão aqui assim que o ponto de partida for validado.</div>'; return; }
    const all = kpis.map(model);
    const cats = [...new Set(all.map((m) => m.kpi.category))].sort((a, b) => (CAT_ORDER.indexOf(a) + 99) % 199 - (CAT_ORDER.indexOf(b) + 99) % 199);
    if (state.cat !== 'TODAS' && !cats.includes(state.cat)) state.cat = 'TODAS';
    const byCat = all.filter((m) => state.cat === 'TODAS' || m.kpi.category === state.cat);
    const ms = byCat.filter((m) => state.sit === 'TODAS' || m.sit === state.sit);
    const count = (s) => byCat.filter((m) => m.sit === s).length;
    const measured = byCat.filter((m) => m.sit !== 'SEM');
    const up = count('MELHOROU'), down = count('PIOROU'), flat = count('ESTAVEL'), none = count('SEM');
    const best = byCat.filter((m) => m.sit === 'MELHOROU' && m.delta != null).sort((a, b) => b.delta * b.better - a.delta * a.better)[0];
    const worst = byCat.filter((m) => m.sit === 'PIOROU' && m.delta != null).sort((a, b) => a.delta * a.better - b.delta * b.better)[0];
    const fresh = byCat.filter((m) => !m.stale).length;
    const lastUpd = byCat.map((m) => m.last?.period_end || m.baseEnd).filter(Boolean).sort().pop();
    const pill = (k, v, t, n) => `<button class="pf-pill ${state[k] === v ? 'on' : ''}" data-pf="${k}" data-v="${v}">${t}${n != null ? `<b>${n}</b>` : ''}</button>`;
    const heroes = ms.filter((m) => ['NEGOCIO', 'COMERCIAL', 'FINANCEIRO'].includes(m.kpi.category));
    const rest = ms.filter((m) => !heroes.includes(m));
    const W = (n) => byCat.length ? (n / byCat.length * 100).toFixed(2) + '%' : '0';

    root.innerHTML = `
    <div class="pf-bar">
      <div class="pf-group"><small>Área</small>${pill('cat', 'TODAS', 'Todas')}${cats.map((c) => pill('cat', c, E(catName(c)))).join('')}</div>
      <div class="pf-group"><small>Situação</small>${pill('sit', 'TODAS', 'Todas')}${pill('sit', 'MELHOROU', 'Melhorou', up)}${pill('sit', 'PIOROU', 'Piorou', down)}${pill('sit', 'ESTAVEL', 'Estável', flat)}${pill('sit', 'SEM', 'Sem nova medição', none)}</div>
      <div class="pf-group"><small>Comparar com</small>${pill('cmp', 'BASE', 'Ponto de partida')}${pill('cmp', 'PREV', 'Medição anterior')}</div>
    </div>
    <div class="pf-story">
      <article class="pf-read"><small>Leitura executiva${state.cat !== 'TODAS' ? ' · ' + E(catName(state.cat)) : ''}</small><p>${narrative(byCat)}</p><div class="pf-legal">Os resultados mostram a evolução observada. Uma melhora depois de uma ação é compatível com o trabalho feito, mas outros fatores também influenciam os números.${lastUpd ? ` Última atualização: ${E(dBR(lastUpd))}.` : ''}</div></article>
      <div class="pf-big">
        <div class="pf-bn"><small>Indicadores em evolução</small><b class="${up ? 'up' : ''}">${up}<span style="display:inline;font-size:15px;color:var(--pf-muted);font-weight:700"> de ${measured.length || byCat.length}</span></b><div class="pf-meter" aria-hidden="true"><i style="width:${W(up)};background:var(--pf-up)"></i><i style="width:${W(flat)};background:#9AA9B8"></i><i style="width:${W(down)};background:var(--pf-down)"></i><i style="width:${W(none)};background:#F3D9B8"></i></div><span>${up} melhoraram · ${flat} estáveis · ${down} pioraram · ${none} sem medição</span></div>
        <div class="pf-bn"><small>Maior avanço</small><b class="up">${best ? E(pct(best.delta)) : '—'}</b><span>${best ? E(best.kpi.name) : 'Nenhum avanço registrado neste filtro'}</span></div>
        <div class="pf-bn"><small>Ponto de atenção</small><b class="${worst ? 'down' : ''}">${worst ? E(pct(worst.delta)) : '—'}</b><span>${worst ? E(worst.kpi.name) : 'Nenhuma queda registrada neste filtro'}</span></div>
        <div class="pf-bn"><small>Medição em dia</small><b>${fresh}<span style="display:inline;font-size:15px;color:var(--pf-muted);font-weight:700"> de ${byCat.length}</span></b><span>indicadores com dado dos últimos 40 dias</span></div>
      </div>
    </div>
    ${heroes.length ? `<div class="pf-sec"><h2>O que move o negócio</h2><span>Indicadores de negócio e comercial</span></div><div class="pf-heroes">${heroes.map((m) => `<article class="pf-hero"><div class="pf-hero-top"><span class="pf-cat">${E(catName(m.kpi.category))}</span>${chip(m)}</div><h3>${E(m.kpi.name)}</h3><div class="pf-now"><b>${E(num(m.last ? m.last.value : m.base, m.kpi.unit))}</b><span style="font-size:12px;color:var(--pf-muted)">${m.last ? 'agora' : 'ponto de partida'}</span></div><div class="pf-from">${m.last ? `Partimos de <b>${E(num(m.base, m.kpi.unit))}</b>${m.target != null ? ` · meta <b>${E(num(m.target, m.kpi.unit))}</b>` : ''}` : 'Aguardando a próxima medição'}</div>${spark(m)}<div class="pf-legend"><span><i></i>ponto de partida</span>${m.target != null ? '<span><i class="t"></i>meta</span>' : ''}</div></article>`).join('')}</div>` : ''}
    <div class="pf-sec"><h2>Comparativo de evolução</h2><span>Variação de cada indicador ${state.cmp === 'PREV' ? 'versus a medição anterior' : 'versus o ponto de partida'}</span></div>
    <div class="pf-panel">${diverging(ms)}</div>
    ${rest.length ? `<div class="pf-sec"><h2>Todos os indicadores</h2><span>Ponto de partida → agora → meta</span></div><div class="pf-grid">${rest.map(card).join('')}</div>` : ''}
    ${!ms.length ? '<div class="pf-empty" style="margin-top:12px">Nenhum indicador com esses filtros.</div>' : ''}
    <div class="pf-sec"><h2>O que foi feito</h2><span>Ações da YM que podem explicar as mudanças</span></div>
    ${actions.length ? `<div class="pf-tl">${[...actions].sort((a, b) => String(b.action_date || '').localeCompare(String(a.action_date || ''))).map((a) => `<div class="pf-tl-item ${a.status === 'IMPLEMENTADA' ? 'done' : ''}"><small>${E(dBR(a.action_date))} · ${E(pretty(a.action_type))} · ${E(pretty(a.status))}${Number(a.expected_lag_days || 0) > 0 ? ` · efeito esperado em ~${Number(a.expected_lag_days)} dias` : ''}</small><br><b>${E(a.title)}</b>${a.description ? `<p>${E(a.description)}</p>` : ''}${a.evidence_url ? `<a class="cp-btn secondary" style="display:inline-flex;margin-top:8px" target="_blank" rel="noopener" href="${E(a.evidence_url)}">Ver referência</a>` : ''}</div>`).join('')}</div>` : '<div class="pf-empty">As ações registradas pela YM aparecerão aqui, ligadas aos indicadores que elas devem mover.</div>'}
    ${cms.length ? `<div class="pf-sec"><h2>Resultados de conteúdos</h2><span>Meta versus realizado</span></div><div class="pf-grid">${cms.map((x) => { const hit = x.target_value != null && x.result_value != null ? (x.direction === 'MENOR_MELHOR' ? Number(x.result_value) <= Number(x.target_value) : Number(x.result_value) >= Number(x.target_value)) : null; return `<article class="pf-card"><span class="pf-cat">${E(x.metric_label)}</span><h3>${E(x.content_title)}</h3><div class="pf-trio"><div><small>Base</small><b>${E(num(x.baseline_value, x.unit))}</b></div><div class="cur"><small>Resultado</small><b>${E(num(x.result_value, x.unit))}</b></div><div><small>Meta</small><b>${E(num(x.target_value, x.unit))}</b></div></div>${hit == null ? '' : `<div class="pf-meta"><span class="pf-chip ${hit ? 'up' : 'down'}">${hit ? 'Meta atingida' : 'Abaixo da meta'}</span></div>`}</article>`; }).join('')}</div>` : ''}
    `;
  }
  function card(m) {
    const k = m.kpi, cur = m.last ? m.last.value : null;
    return `<article class="pf-card"><div class="pf-hero-top"><span class="pf-cat">${E(catName(k.category))}</span>${chip(m)}</div><h3>${E(k.name)}</h3>${k.description ? `<p class="desc">${E(k.description)}</p>` : ''}
    <div class="pf-trio"><div><small>Partida</small><b>${E(num(m.base, k.unit))}</b></div><div class="cur"><small>Agora</small><b>${E(num(cur, k.unit))}</b></div><div><small>Meta</small><b>${E(num(m.target, k.unit))}</b></div></div>
    ${m.progress != null ? `<div class="pf-prog"><small><span>Caminho até a meta</span><span>${Math.round(m.progress * 100)}%</span></small><div><i style="width:${Math.min(100, m.progress * 100).toFixed(1)}%"></i></div></div>` : ''}
    ${spark(m, 300, 70)}
    <div class="pf-meta">${m.last ? `Última medição: ${E(dBR(m.last.period_end))}` : `Ponto de partida: ${E(dBR(m.baseEnd))}`} · fonte ${E(SRC[m.last?.source_type || k.source_type] || pretty(m.last?.source_type || k.source_type))}${m.stale ? ' · <span class="pf-stale">atualização pendente</span>' : ''}</div></article>`;
  }

  window.ClientPerformancePortal = { render: () => render(true) };
  let attempts = 0; const timer = setInterval(() => { attempts += 1; inject(); render(); if (attempts > 120) clearInterval(timer); }, 500); inject();
})();

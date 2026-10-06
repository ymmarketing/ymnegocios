/* Central YM · Radar: newsletter, análises do Raio-X e conteúdos postados pelos clientes. */
(() => {
  const E = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const style = document.createElement('style');
  style.textContent = `.cr-radar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:12px 0 4px}
  .cr-card{display:flex;flex-direction:column;gap:6px;background:#fff;border:1px solid var(--ym-line,#DCE5F0);border-radius:16px;padding:16px 18px;text-decoration:none;color:inherit;box-shadow:var(--ym-shadow);transition:border-color .15s}
  .cr-card:hover{border-color:#484DCF}
  .cr-card small{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#6B7C91}
  .cr-card b{font:800 28px/1 Montserrat,sans-serif;color:var(--ym-navy,#0A2540);font-variant-numeric:tabular-nums}
  .cr-card span{font-size:13px;color:#6B7C91;line-height:1.45}.cr-card em{font-style:normal;color:#137A5B;font-weight:700}
  .cr-card i{font-style:normal;font-size:12.5px;font-weight:700;color:#484DCF;margin-top:auto}
  @media(max-width:900px){.cr-radar{grid-template-columns:1fr}}`;
  document.head.append(style);
  const since = (d) => new Date(Date.now() - d * 864e5).toISOString();
  async function load() {
    const sb = window.YM?.sb; const k = document.getElementById('caKpis');
    if (!sb || !k || document.getElementById('crRadar')) return false;
    const { data: { session } } = await sb.auth.getSession(); if (!session) return false;
    const box = document.createElement('section'); box.id = 'crRadar'; box.className = 'cr-radar'; box.setAttribute('aria-label', 'Radar de crescimento');
    box.innerHTML = '<div class="cr-card"><small>Carregando radar…</small></div>';
    k.after(box);
    const [nl, nl7, rx, ct] = await Promise.all([
      sb.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
      sb.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('status', 'ativo').gte('created_at', since(7)),
      sb.from('raiox_analyses').select('id,title,status,updated_at').neq('status', 'ARQUIVADO').order('updated_at', { ascending: false }).limit(20),
      sb.from('central_ym_content_items').select('id,client_posted,visible_to_client,publish_date').eq('visible_to_client', true).not('caption_instagram', 'eq', ''),
    ]);
    const open = (rx.data || []).filter((a) => a.status !== 'CONCLUIDO');
    const bank = ct.data || []; const posted = bank.filter((x) => x.client_posted && Object.keys(x.client_posted).length).length;
    const today = new Date().toLocaleDateString('en-CA'); const due = bank.filter((x) => x.publish_date && x.publish_date <= today && !(x.client_posted && Object.keys(x.client_posted).length)).length;
    box.innerHTML = `
      <a class="cr-card" href="https://resend.com/audiences" target="_blank" rel="noopener"><small>Newsletter</small><b>${nl.error ? '—' : nl.count ?? 0}</b><span>inscritos ativos${nl7.count ? ` · <em>+${nl7.count} nos últimos 7 dias</em>` : ''}</span><i>Abrir no Resend ↗</i></a>
      <a class="cr-card" href="/RAIOX/"><small>Análises do Raio-X</small><b>${rx.error ? '—' : open.length}</b><span>${open.length ? 'em andamento · última: ' + E(open[0].title || 'sem nome') : 'nenhuma em andamento'}</span><i>Abrir análises →</i></a>
      <a class="cr-card" href="/Conteudos"><small>Banco de conteúdos dos clientes</small><b>${ct.error ? '—' : `${posted}/${bank.length}`}</b><span>marcados como postados pelos clientes${due ? ` · <em style="color:#B7791F">${due} com data vencida sem marcação</em>` : ''}</span><i>Abrir Conteúdos →</i></a>`;
    return true;
  }
  let n = 0; const t = setInterval(async () => { n++; try { if (await load() || n > 40) clearInterval(t); } catch (e) { clearInterval(t); console.warn('Radar', e); } }, 500);
})();

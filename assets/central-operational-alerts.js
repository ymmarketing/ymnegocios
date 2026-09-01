(()=>{
  if(window.__centralOperationalAlerts)return;window.__centralOperationalAlerts=true;
  const E=v=>window.YM?.esc?YM.esc(v):String(v??'').replace(/[&<>"']/g,'');
  let loading=false,last=null;
  const labels={CRITICO:'Crítico',ALTO:'Alto',MEDIO:'Atenção',BAIXO:'Baixo'};
  function injectStyles(){if(document.getElementById('coaStyles'))return;const s=document.createElement('style');s.id='coaStyles';s.textContent=`
    .coa-wrap{margin:12px 0}.coa-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:8px}.coa-head h2{margin:0;font:800 14px Montserrat;color:#0a2540}.coa-head p{margin:3px 0 0;color:#718296;font-size:8.5px}.coa-summary{display:flex;gap:6px;flex-wrap:wrap}.coa-chip{border-radius:999px;padding:5px 8px;background:#eef2f6;color:#52667a;font-size:7.5px;font-weight:900}.coa-chip.critical{background:#fdecec;color:#a52a2a}.coa-chip.high{background:#fff1dc;color:#9a5b00}.coa-list{display:grid;gap:7px}.coa-item{background:#fff;border:1px solid #dce5f0;border-left:4px solid #9aa8b7;border-radius:11px;padding:10px 11px;display:flex;align-items:center;justify-content:space-between;gap:10px}.coa-item.critical{border-left-color:#c53b3b}.coa-item.high{border-left-color:#e28b22}.coa-item.medium{border-left-color:#d1a62d}.coa-item b{display:block;color:#0a2540;font-size:9px}.coa-item small{display:block;color:#6b7c91;font-size:7.8px;line-height:1.45;margin-top:3px}.coa-sev{font-size:7px;font-weight:900;text-transform:uppercase;white-space:nowrap}.coa-empty{padding:13px;border:1px dashed #cfd9e4;border-radius:11px;background:#f8fafc;color:#637487;font-size:8.5px}@media(max-width:680px){.coa-head,.coa-item{align-items:flex-start;flex-direction:column}.coa-item button{width:100%}}`;
    document.head.append(s);
  }
  async function api(){const session=await YM.requireSession('/CENTRAL');if(!session)throw new Error('Sessão necessária.');const r=await fetch(YM.SUPABASE_URL+'/functions/v1/central-operational-alerts',{method:'POST',headers:{Authorization:'Bearer '+session.access_token,apikey:YM.PUBLISHABLE_KEY,'Content-Type':'application/json'},body:'{}'});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.detail||j.error||'Não foi possível carregar alertas.');return j;}
  function ensure(){injectStyles();const view=document.getElementById('caView_dashboard'),kpis=document.getElementById('caKpis');if(!view||!kpis)return null;let root=document.getElementById('caOperationalAlerts');if(root){const grid=view.querySelector(':scope > .ca-grid2');if(grid&&root.previousElementSibling!==grid)grid.after(root);return root}root=document.createElement('section');root.id='caOperationalAlerts';root.className='coa-wrap';root.innerHTML='<div class="coa-empty">Carregando pendências operacionais…</div>';const grid=view.querySelector(':scope > .ca-grid2');if(grid)grid.after(root);else kpis.after(root);return root;}
  function render(data){const root=ensure();if(!root)return;const s=data?.summary||{},alerts=data?.alerts||[];root.innerHTML=`<div class="coa-head"><div><h2>Pendências operacionais da jornada</h2><p>Gates, prazos, acessos e fontes de dados que exigem atenção agora.</p></div><div class="coa-summary"><span class="coa-chip critical">${s.critical||0} crítico(s)</span><span class="coa-chip high">${s.overdue||0} atrasado(s)</span><span class="coa-chip">${s.due_soon||0} prazo(s) próximo(s)</span><span class="coa-chip">${s.blocked||0} bloqueado(s)</span></div></div>${alerts.length?`<div class="coa-list">${alerts.slice(0,12).map(a=>`<div class="coa-item ${a.severity==='CRITICO'?'critical':a.severity==='ALTO'?'high':'medium'}"><div><span class="coa-sev">${E(labels[a.severity]||a.severity)}</span><b>${E(a.client_name)} · ${E(a.title)}</b><small>${E(a.detail||'')}${a.due_at?` · Prazo: ${new Date(a.due_at).toLocaleDateString('pt-BR')}`:''}</small></div><button class="ym-btn secondary" data-coa-client="${E(a.client_id)}">Abrir cliente</button></div>`).join('')}</div>`:'<div class="coa-empty">Nenhuma pendência crítica de jornada neste momento.</div>'}`;
    root.querySelectorAll('[data-coa-client]').forEach(b=>b.onclick=()=>document.querySelector(`[data-open-client="${CSS.escape(b.dataset.coaClient)}"]`)?.click()||location.assign('/CENTRAL?client='+encodeURIComponent(b.dataset.coaClient)));
  }
  async function load(){if(loading)return;loading=true;const root=ensure();try{last=await api();render(last)}catch(e){if(root)root.innerHTML=`<div class="coa-empty">${E(e.message)}</div>`}finally{loading=false}}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(load,250));
  document.addEventListener('click',e=>{if(e.target?.id==='refreshAdmin')setTimeout(load,500)});

  // Observa apenas a eventual reconstrução do dashboard. Não renderiza novamente
  // quando o próprio conteúdo dos alertas muda, evitando um loop infinito de DOM.
  const obs=new MutationObserver(()=>{
    const view=document.getElementById('caView_dashboard');
    if(!view)return;
    if(!document.getElementById('caOperationalAlerts')){
      const root=ensure();
      if(root&&last)render(last);
    }
  });
  obs.observe(document.body,{childList:true,subtree:true});

  setInterval(load,60000);
})();
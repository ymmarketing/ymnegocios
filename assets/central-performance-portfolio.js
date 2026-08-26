(() => {
  if (window.__centralPerformancePortfolio) return;
  window.__centralPerformancePortfolio = true;
  const E = (v) => window.YM?.esc ? YM.esc(v) : String(v ?? '').replace(/[&<>"']/g, '');
  const root = () => document.getElementById('caPerformanceRoot');
  let snapshot = null;

  function injectStyles(){
    if(document.getElementById('caPerfPortfolioStyles')) return;
    const s=document.createElement('style');s.id='caPerfPortfolioStyles';s.textContent=`
      .cap-kpis{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:9px;margin-bottom:14px}
      .cap-kpi{background:#fff;border:1px solid #dce5f0;border-radius:14px;padding:13px}.cap-kpi b{display:block;font:800 21px Montserrat;color:#0a2540}.cap-kpi span{display:block;font-size:8px;color:#6b7c91;margin-top:4px;line-height:1.35}.cap-kpi.good{border-top:4px solid #1b8f68}.cap-kpi.warn{border-top:4px solid #d49a24}.cap-kpi.bad{border-top:4px solid #c94d4d}.cap-kpi.info{border-top:4px solid #484dcf}.cap-kpi.muted{border-top:4px solid #a7b3bf}
      .cap-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}.cap-toolbar .ym-input,.cap-toolbar .ym-select{max-width:250px}
      .cap-panel{background:#fff;border:1px solid #dce5f0;border-radius:15px;padding:13px;margin-bottom:12px}.cap-panel h2{font:800 13px Montserrat;color:#0a2540;margin:0}.cap-note{font-size:8.5px;color:#6b7c91;line-height:1.5;margin:5px 0 10px}
      .cap-tablewrap{overflow:auto}.cap-table{width:100%;border-collapse:collapse;min-width:950px}.cap-table th,.cap-table td{padding:10px 8px;border-bottom:1px solid #edf1f5;text-align:left;font-size:8.7px;vertical-align:middle}.cap-table th{font-size:7.5px;text-transform:uppercase;letter-spacing:.05em;color:#7b8b9a}.cap-table td b{color:#0a2540}.cap-sub{display:block;color:#7b8b9a;font-size:7.7px;margin-top:3px}
      .cap-status{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:7.5px;font-weight:900}.cap-status.gain{background:#e8f7f0;color:#187557}.cap-status.stable{background:#eef0ff;color:#3e47a2}.cap-status.attention{background:#fff0ee;color:#aa403a}.cap-status.evaluation{background:#fff5df;color:#8b5b12}.cap-status.nodata{background:#eef2f6;color:#657689}
      .cap-interventions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.cap-int{border:1px solid #e2e9f0;border-radius:12px;padding:10px;background:#f9fbfd}.cap-int b{display:block;color:#0a2540;font-size:9px}.cap-int span{display:block;color:#6b7c91;font-size:8px;margin-top:4px}
      @media(max-width:1100px){.cap-kpis{grid-template-columns:repeat(4,1fr)}}@media(max-width:700px){.cap-kpis{grid-template-columns:repeat(2,1fr)}.cap-interventions{grid-template-columns:repeat(2,1fr)}}
    `;document.head.appendChild(s);
  }
  async function api(){
    const session=await YM.requireSession('/CENTRAL');if(!session)throw new Error('Sessão necessária.');
    const r=await fetch(YM.SUPABASE_URL+'/functions/v1/performance-portfolio',{method:'POST',headers:{Authorization:'Bearer '+session.access_token,apikey:YM.PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({action:'OVERVIEW'})});
    const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.detail||j.error||'Falha ao carregar Performance VOS.');return j;
  }
  const statusMeta={GANHO:['Ganho','gain'],ESTAVEL:['Estável','stable'],ATENCAO:['Atenção','attention'],EM_AVALIACAO:['Em avaliação','evaluation'],SEM_DADOS:['Sem dados suficientes','nodata']};
  const reasonLabel={KPI_PRINCIPAL_NAO_DEFINIDO:'KPI principal ainda não definido',BASELINE_NAO_VALIDADO:'Baseline ainda não validado',SEM_MEDICAO_COMPARAVEL:'Sem medição comparável',JANELA_DE_AVALIACAO_ABERTA:'Intervenção ainda dentro da janela de avaliação',MELHORA_RELEVANTE:'Melhora relevante versus baseline',PIORA_RELEVANTE:'Piora relevante versus baseline',SEM_RESPOSTA_APOS_JANELA:'Sem resposta relevante após a janela esperada',DENTRO_DA_TOLERANCIA:'Variação dentro da tolerância',ENTROU_NA_FAIXA_IDEAL:'Entrou na faixa ideal',MANTEVE_FAIXA_IDEAL:'Manteve a faixa ideal',FORA_DA_FAIXA_IDEAL:'Fora da faixa ideal',FAIXA_IDEAL_NAO_CONFIGURADA:'Faixa ideal não configurada'};
  function fmt(v,unit){if(v==null)return '—';if(unit==='MOEDA')return Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});if(unit==='PERCENTUAL')return Number(v).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';return Number(v).toLocaleString('pt-BR',{maximumFractionDigits:2});}
  function render(){
    const el=root();if(!el||!snapshot)return;const s=snapshot.summary||{};
    el.innerHTML=`<div class="cap-kpis">
      <div class="cap-kpi"><b>${s.active_clients||0}</b><span>Clientes ativos</span></div>
      <div class="cap-kpi info"><b>${s.evaluable_clients||0}</b><span>Com baseline + medição comparável</span></div>
      <div class="cap-kpi good"><b>${s.with_gain||0}</b><span>Com ganho mensurável</span></div>
      <div class="cap-kpi info"><b>${s.stable||0}</b><span>Estáveis</span></div>
      <div class="cap-kpi bad"><b>${s.attention||0}</b><span>Pedem atenção</span></div>
      <div class="cap-kpi warn"><b>${s.in_evaluation||0}</b><span>Em avaliação</span></div>
      <div class="cap-kpi muted"><b>${s.gain_pct_evaluable||0}%</b><span>Ganho entre clientes avaliáveis</span></div>
    </div>
    <div class="cap-toolbar"><input id="capSearch" class="ym-input" placeholder="Buscar cliente ou KPI..."><select id="capStatus" class="ym-select"><option value="">Todos os status</option><option value="GANHO">Ganho</option><option value="ESTAVEL">Estável</option><option value="ATENCAO">Atenção</option><option value="EM_AVALIACAO">Em avaliação</option><option value="SEM_DADOS">Sem dados</option></select><button id="capRefresh" class="ym-btn secondary">Atualizar</button></div>
    <section class="cap-panel"><h2>Carteira · Performance VOS</h2><div class="cap-note">A porcentagem usa somente clientes avaliáveis. Clientes sem KPI principal, baseline validado ou medição comparável não entram no denominador.</div><div id="capTable"></div></section>
    <section class="cap-panel"><h2>Resultado observado por tipo de intervenção</h2><div class="cap-note">Mostra quantos clientes receberam cada tipo de ação e quantos deles estão atualmente classificados com ganho. É evidência de associação temporal, não prova de causalidade.</div><div class="cap-interventions">${(snapshot.intervention_summary||[]).length?(snapshot.intervention_summary||[]).map(x=>`<div class="cap-int"><b>${E(String(x.action_type||'Outro').replaceAll('_',' '))}</b><span>${x.clients} cliente(s) · ${x.clients_with_gain} com ganho</span></div>`).join(''):'<div class="ca-empty">Ainda não há ações suficientes para leitura agregada.</div>'}</div></section>`;
    document.getElementById('capSearch').oninput=renderTable;document.getElementById('capStatus').onchange=renderTable;document.getElementById('capRefresh').onclick=load;renderTable();
  }
  function renderTable(){
    const q=(document.getElementById('capSearch')?.value||'').toLowerCase(),st=document.getElementById('capStatus')?.value||'';let rows=snapshot?.clients||[];
    if(st)rows=rows.filter(x=>x.status===st);if(q)rows=rows.filter(x=>[x.client_name,x.segment,x.primary_kpi?.name].join(' ').toLowerCase().includes(q));
    const host=document.getElementById('capTable');if(!host)return;
    host.innerHTML=`<div class="cap-tablewrap"><table class="cap-table"><thead><tr><th>Cliente</th><th>Status</th><th>KPI principal</th><th>Baseline</th><th>Atual</th><th>Evolução</th><th>Última ação</th><th></th></tr></thead><tbody>${rows.length?rows.map(x=>{const sm=statusMeta[x.status]||statusMeta.SEM_DADOS,k=x.primary_kpi,delta=k?.delta_pct;return `<tr><td><b>${E(x.client_name)}</b><span class="cap-sub">${E(x.segment||'')}</span></td><td><span class="cap-status ${sm[1]}">${sm[0]}</span><span class="cap-sub">${E(reasonLabel[x.reason]||x.reason||'')}</span>${x.evaluation_due?`<span class="cap-sub">Avaliar após ${new Date(x.evaluation_due+'T12:00:00').toLocaleDateString('pt-BR')}</span>`:''}</td><td><b>${E(k?.name||'—')}</b><span class="cap-sub">${k?'Prioridade '+k.priority:'Definir no VER'}</span></td><td>${k?fmt(k.baseline_value,k.unit):'—'}<span class="cap-sub">${k?.baseline_period_end?new Date(k.baseline_period_end+'T12:00:00').toLocaleDateString('pt-BR'):''}</span></td><td>${k?fmt(k.current_value,k.unit):'—'}<span class="cap-sub">${k?.current_period_end?new Date(k.current_period_end+'T12:00:00').toLocaleDateString('pt-BR'):''}</span></td><td>${delta==null?'—':(delta>0?'+':'')+Number(delta).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%'}</td><td>${E(x.latest_action?.title||'—')}<span class="cap-sub">${x.latest_action?.action_date?new Date(x.latest_action.action_date+'T12:00:00').toLocaleDateString('pt-BR'):''}</span></td><td><button class="ym-btn secondary" data-cap-open="${x.client_id}">Performance</button></td></tr>`}).join(''):'<tr><td colspan="8">Nenhum cliente neste filtro.</td></tr>'}</tbody></table></div>`;
    host.querySelectorAll('[data-cap-open]').forEach(b=>b.onclick=()=>window.ClientPerformanceAdmin?.open(b.dataset.capOpen));
  }
  async function load(){const el=root();if(el)el.innerHTML='<div class="ca-empty">Carregando Performance VOS…</div>';try{snapshot=await api();render();}catch(e){if(el)el.innerHTML=`<div class="ca-empty">${E(e.message)}</div>`;}}
  function wireNav(){const perf=document.querySelector('[data-perf-view="portfolio"]'),view=document.getElementById('caView_performance');if(!perf||!view)return;
    perf.addEventListener('click',(ev)=>{ev.preventDefault();document.querySelectorAll('.ca-subnav button').forEach(x=>x.classList.remove('on'));perf.classList.add('on');document.querySelectorAll('.ca-view').forEach(x=>x.classList.remove('on'));view.classList.add('on');load();},true);
    document.querySelectorAll('.ca-subnav [data-ca-view]').forEach(btn=>btn.addEventListener('click',()=>{view.classList.remove('on');perf.classList.remove('on');},true));
  }
  injectStyles();wireNav();
  window.CentralPerformancePortfolio={load};
})();
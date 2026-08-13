(()=>{
  let active=null;
  const KEYS=['TOTAL','LEAD_MAPEADO','LEITURA_ENVIADA','RAIOX_ENTREGUE','GANHO'];
  const LABELS={TOTAL:'Total visível',LEAD_MAPEADO:'Leads mapeados',LEITURA_ENVIADA:'Leituras enviadas',RAIOX_ENTREGUE:'Raio-X entregues',GANHO:'Serviços contratados'};

  function clientsMode(){return document.getElementById('activeClientsTab')?.classList.contains('on')}
  function el(id){return document.getElementById(id)}
  function cards(){return [...(document.querySelector('.ym-grid.ym-kpis')?.querySelectorAll('.ym-kpi')||[])]}

  function ensureStyles(){
    if(document.getElementById('pipelineKpiClickStyles'))return;
    const s=document.createElement('style');
    s.id='pipelineKpiClickStyles';
    s.textContent=`
      .ym-kpi.pipeline-kpi-clickable{cursor:pointer;transition:.15s;touch-action:manipulation;position:relative}
      .ym-kpi.pipeline-kpi-clickable:active{transform:scale(.985)}
      .ym-kpi.pipeline-kpi-active{outline:2px solid #484DCF;background:#F5F5FF!important;box-shadow:0 8px 22px rgba(72,77,207,.12)}
      .ym-kpi.pipeline-kpi-active::after{content:'Filtro ativo';display:block;margin-top:5px;font-size:7.5px;font-weight:800;color:#484DCF;text-transform:uppercase;letter-spacing:.05em}
    `;
    document.head.append(s);
  }

  function clearDrillFilters(){
    if(el('search'))el('search').value='';
    if(el('stageFilter'))el('stageFilter').value='';
    if(el('readingFilter'))el('readingFilter').value='';
    if(el('classFilter'))el('classFilter').value='';
  }

  function applyKey(key){
    clearDrillFilters();
    if(key==='LEAD_MAPEADO'&&el('stageFilter'))el('stageFilter').value='LEAD_MAPEADO';
    if(key==='LEITURA_ENVIADA'&&el('readingFilter'))el('readingFilter').value='ENVIADA';
    if(key==='RAIOX_ENTREGUE'&&el('stageFilter'))el('stageFilter').value='RAIOX_ENTREGUE';
    if(key==='GANHO'&&el('stageFilter'))el('stageFilter').value='GANHO';

    if(typeof window.render==='function')window.render();
    else{
      el('stageFilter')?.dispatchEvent(new Event('change',{bubbles:true}));
      el('readingFilter')?.dispatchEvent(new Event('change',{bubbles:true}));
      el('classFilter')?.dispatchEvent(new Event('change',{bubbles:true}));
      el('search')?.dispatchEvent(new Event('input',{bubbles:true}));
    }

    requestAnimationFrame(()=>{
      paint();
      const meta=el('resultMeta');
      if(meta){
        meta.scrollIntoView({behavior:'smooth',block:'start'});
        const count=(el(key==='TOTAL'?'kTotal':key==='LEAD_MAPEADO'?'kLead':key==='LEITURA_ENVIADA'?'kReading':key==='RAIOX_ENTREGUE'?'kRx':'kWon')?.textContent||'').trim();
        if(window.YM?.toast)YM.toast(key==='TOTAL'?'Filtros do pipeline limpos.':`${LABELS[key]}: ${count} registro(s) exibido(s).`);
      }
    });
  }

  function clickKey(key){
    if(clientsMode()||!key)return;
    if(key==='TOTAL'){active=null;applyKey('TOTAL');return}
    if(active===key){active=null;applyKey('TOTAL');return}
    active=key;
    applyKey(key);
  }

  function paint(){
    if(clientsMode())return;
    ensureStyles();
    cards().forEach((card,i)=>{
      const key=KEYS[i];if(!key)return;
      card.classList.add('pipeline-kpi-clickable');
      card.classList.toggle('pipeline-kpi-active',active===key);
      card.dataset.pipelineKpi=key;
      card.setAttribute('role','button');
      card.setAttribute('tabindex','0');
      card.setAttribute('aria-label',`${LABELS[key]}. Toque para filtrar o pipeline.`);
      card.setAttribute('aria-pressed',active===key?'true':'false');
    });
  }

  document.addEventListener('click',e=>{
    if(clientsMode())return;
    const card=e.target?.closest?.('.ym-grid.ym-kpis .ym-kpi[data-pipeline-kpi]');
    if(!card)return;
    e.preventDefault();
    clickKey(card.dataset.pipelineKpi);
  },true);

  document.addEventListener('keydown',e=>{
    if(clientsMode()||!['Enter',' '].includes(e.key))return;
    const card=e.target?.closest?.('.ym-grid.ym-kpis .ym-kpi[data-pipeline-kpi]');
    if(!card)return;
    e.preventDefault();
    clickKey(card.dataset.pipelineKpi);
  });

  ['stageFilter','readingFilter','classFilter','search'].forEach(id=>{
    document.addEventListener(id==='search'?'input':'change',e=>{
      if(e.target?.id!==id||clientsMode())return;
      const stage=el('stageFilter')?.value||'',reading=el('readingFilter')?.value||'',search=el('search')?.value||'',cl=el('classFilter')?.value||'';
      if(search||cl){active=null}
      else if(reading==='ENVIADA'&&!stage)active='LEITURA_ENVIADA';
      else if(stage==='LEAD_MAPEADO'&&!reading)active='LEAD_MAPEADO';
      else if(stage==='RAIOX_ENTREGUE'&&!reading)active='RAIOX_ENTREGUE';
      else if(stage==='GANHO'&&!reading)active='GANHO';
      else if(!stage&&!reading)active=null;
      setTimeout(paint,0);
    },true);
  });

  new MutationObserver(()=>requestAnimationFrame(paint)).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(paint,700);
  paint();
})();
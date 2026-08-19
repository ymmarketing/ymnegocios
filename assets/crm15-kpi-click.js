(()=>{
 let active=null;
 function clients(){return document.getElementById('activeClientsTab')?.classList.contains('on')}
 function clearFilters(){const sf=document.getElementById('stageFilter'),rf=document.getElementById('readingFilter');if(sf)sf.value='';if(rf)rf.value=''}
 function applyKey(key){const sf=document.getElementById('stageFilter'),rf=document.getElementById('readingFilter');if(!sf||!rf)return;clearFilters();if(key==='LEAD_MAPEADO')sf.value='LEAD_MAPEADO';else if(key==='LEITURA_ENVIADA')rf.value='ENVIADA';else if(key==='RAIOX_ENTREGUE')sf.value='RAIOX_ENTREGUE';else if(key==='GANHO')sf.value='GANHO';(key==='LEITURA_ENVIADA'?rf:sf).dispatchEvent(new Event('change',{bubbles:true}))}
 function paint(){
  if(clients())return;
  const box=document.querySelector('.ym-grid.ym-kpis');if(!box)return;
  const keys=['TOTAL','LEAD_MAPEADO','LEITURA_ENVIADA','RAIOX_ENTREGUE','GANHO'];
  [...box.querySelectorAll('.ym-kpi')].forEach((card,i)=>{
   const key=keys[i];if(!key)return;
   card.classList.add('kpi-clickable-pipeline');
   card.classList.toggle('kpi-active-pipeline',active===key);
   card.setAttribute('role','button');card.setAttribute('tabindex','0');
   if(card.dataset.clickFilter)return;
   card.dataset.clickFilter='1';
   const go=()=>{
    if(key==='TOTAL'||active===key){active=null;clearFilters();document.getElementById('stageFilter')?.dispatchEvent(new Event('change',{bubbles:true}))}
    else{active=key;applyKey(key)}
    if(window.YM?.toast)YM.toast(active?'Filtro do indicador aplicado.':'Filtro dos indicadores removido.');
    setTimeout(()=>{paint();document.getElementById('resultMeta')?.scrollIntoView({behavior:'smooth',block:'start'})},80)
   };
   card.onclick=go;
   card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}
  })
 }
 function css(){
  if(document.getElementById('pipelineKpiClickCss'))return;
  const s=document.createElement('style');s.id='pipelineKpiClickCss';s.textContent=`.ym-kpi.kpi-clickable-pipeline{cursor:pointer;transition:.15s;touch-action:manipulation}.ym-kpi.kpi-clickable-pipeline:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(15,42,67,.08)}.ym-kpi.kpi-active-pipeline{outline:2px solid #484DCF;background:#F5F5FF!important}.ym-kpi.kpi-active-pipeline:after{content:'Filtro ativo';display:block;margin-top:5px;font-size:7.5px;font-weight:800;color:#484DCF;text-transform:uppercase;letter-spacing:.05em}`;document.head.append(s)
 }
 document.addEventListener('click',e=>{
  const arrow=e.target?.closest?.('.client-fold-arrow');
  if(!arrow)return;
  const card=arrow.closest('.client-card'),body=card?.querySelector('.client-body');
  if(!card||!body)return;
  e.preventDefault();e.stopImmediatePropagation();
  const opening=body.dataset.collapsed==='1';
  if(opening){delete body.dataset.collapsed;arrow.classList.add('is-open');arrow.setAttribute('aria-expanded','true');arrow.setAttribute('aria-label','Recolher detalhes do cliente')}
  else{body.dataset.collapsed='1';arrow.classList.remove('is-open');arrow.setAttribute('aria-expanded','false');arrow.setAttribute('aria-label','Abrir detalhes do cliente')}
 },true);
 css();
 const o=new MutationObserver(()=>setTimeout(paint,20));o.observe(document.documentElement,{childList:true,subtree:true});
 setInterval(paint,800);paint()
})();

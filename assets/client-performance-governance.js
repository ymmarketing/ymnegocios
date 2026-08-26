(() => {
  if (window.__clientPerformanceGovernance) return;
  window.__clientPerformanceGovernance = true;
  let clientId = null, cache = null, enhancing = false;
  const E = (v) => window.YM?.esc ? YM.esc(v) : String(v ?? '').replace(/[&<>"']/g, '');
  const pretty = (v) => String(v || '').replaceAll('_',' ').replace(/^./,x=>x.toUpperCase());

  async function authApi(path, body){
    const session=await YM.requireSession('/CENTRAL');if(!session)throw new Error('Sessão necessária.');
    const r=await fetch(YM.SUPABASE_URL+'/functions/v1/'+path,{method:'POST',headers:{Authorization:'Bearer '+session.access_token,apikey:YM.PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(j.detail||j.error||'Falha na operação.');e.code=j.error;throw e}return j;
  }
  const semantic=(body)=>authApi('performance-semantic-admin',body);
  const reportei=(body)=>authApi('reportei-admin',body);
  async function data(){if(!clientId)throw new Error('Cliente não identificado.');if(cache?.clientId===clientId)return cache.data;const j=await window.ClientPerformanceAdmin.api({action:'GET_CLIENT',client_id:clientId});cache={clientId,data:j.data};return j.data;}
  function captureClient(event){const el=event.target.closest?.('[data-client-performance],[data-cap-open]');if(!el)return;clientId=el.dataset.clientPerformance||el.dataset.capOpen||null;cache=null;}
  document.addEventListener('click',captureClient,true);

  function wrapOpen(){if(!window.ClientPerformanceAdmin||window.ClientPerformanceAdmin.__govWrapped)return;const old=window.ClientPerformanceAdmin.open;window.ClientPerformanceAdmin.open=(id,tab)=>{clientId=id;cache=null;return old(id,tab)};window.ClientPerformanceAdmin.__govWrapped=true;}

  async function enhanceKpiForm(){
    const save=document.getElementById('pkSave'),grid=save?.closest('.perf-form')?.querySelector('.perf-formgrid');if(!save||!grid||document.getElementById('pkVosRole')||!clientId)return;
    let kpi={};const id=save.dataset.kpiId;if(id){try{kpi=(await data()).kpis.find(x=>x.id===id)||{}}catch{}}
    const holder=document.createElement('div');holder.className='perf-wide';holder.id='pkGovernance';holder.innerHTML=`<div class="perf-note"><b>Governança VOS</b> · define como este indicador participa da leitura geral da carteira.</div><div class="perf-formgrid" style="margin-top:0"><div><label class="perf-label">Papel do KPI</label><select id="pkVosRole" class="perf-select"><option value="PRINCIPAL" ${kpi.vos_role==='PRINCIPAL'?'selected':''}>Principal — classifica o resultado do cliente</option><option value="SECUNDARIO" ${!kpi.vos_role||kpi.vos_role==='SECUNDARIO'?'selected':''}>Secundário — ajuda a explicar a evolução</option><option value="CONTEXTO" ${kpi.vos_role==='CONTEXTO'?'selected':''}>Contexto — não classifica resultado</option></select></div><div><label class="perf-label">Prioridade</label><input id="pkVosPriority" class="perf-input" type="number" min="1" max="999" value="${E(kpi.vos_priority||100)}"><small style="font-size:7px;color:#7b8b9a">Menor número = maior prioridade entre KPIs principais.</small></div><div><label class="perf-label">Mudança relevante (%)</label><input id="pkTolerance" class="perf-input" type="number" min="0" max="100" step="0.1" value="${E(kpi.meaningful_change_pct??5)}"></div><div><label class="perf-label">Janela padrão de avaliação (dias)</label><input id="pkEvalWindow" class="perf-input" type="number" min="1" max="365" value="${E(kpi.evaluation_window_days||30)}"></div></div><div style="margin-top:9px">${kpi.baseline_locked_at?`<span class="perf-badge ok">Baseline travado em ${new Date(kpi.baseline_locked_at).toLocaleDateString('pt-BR')}</span><div style="font-size:8px;color:#6b7c91;margin-top:5px">O valor e o período não podem mais ser sobrescritos.</div>`:`<label><input id="pkLockBaseline" type="checkbox"> <span style="font-size:8.5px;font-weight:700;color:#0a2540">Confirmo que este baseline foi validado e quero travá-lo após salvar.</span></label>`}</div>`;
    grid.append(holder);
    if(kpi.baseline_locked_at){['pkBaseline','pkBaseStart','pkBaseEnd'].forEach(x=>{const f=document.getElementById(x);if(f){f.readOnly=true;f.title='Baseline travado';f.style.background='#eef2f6'}})}
  }

  document.addEventListener('click',async(event)=>{
    const btn=event.target.closest?.('#pkSave');if(!btn||!document.getElementById('pkVosRole')||!clientId)return;
    event.preventDefault();event.stopImmediatePropagation();btn.disabled=true;
    try{
      const q=(id)=>document.getElementById(id);const existingId=btn.dataset.kpiId||undefined;
      const saved=await window.ClientPerformanceAdmin.api({action:'UPSERT_KPI',client_id:clientId,id:existingId,name:q('pkName').value,category:q('pkCategory').value,unit:q('pkUnit').value,direction:q('pkDirection').value,baseline_value:q('pkBaseline').value===''?null:Number(q('pkBaseline').value),target_value:q('pkTarget').value===''?null:Number(q('pkTarget').value),baseline_period_start:q('pkBaseStart').value,baseline_period_end:q('pkBaseEnd').value,target_period_end:q('pkTargetEnd').value,description:q('pkDesc').value,visible_to_client:q('pkVisible').checked});
      const kpiId=saved.kpi.id;
      await semantic({action:'UPDATE_META',client_id:clientId,kpi_id:kpiId,vos_role:q('pkVosRole').value,vos_priority:Number(q('pkVosPriority').value||100),meaningful_change_pct:Number(q('pkTolerance').value||0),evaluation_window_days:Number(q('pkEvalWindow').value||30)});
      if(q('pkLockBaseline')?.checked)await semantic({action:'LOCK_BASELINE',client_id:clientId,kpi_id:kpiId});
      cache=null;YM.toast(q('pkLockBaseline')?.checked?'KPI salvo e baseline travado.':'KPI salvo. Baseline permanece provisório até validação.');await window.ClientPerformanceAdmin.open(clientId,'kpis');
    }catch(e){YM.toast(e.message,true);btn.disabled=false;}
  },true);

  async function renderReporteiPanel(){
    const pane=document.getElementById('perf_fontes');if(!pane||document.getElementById('reporteiAdminPanel')||!clientId)return;
    const panel=document.createElement('div');panel.id='reporteiAdminPanel';panel.className='perf-form';panel.innerHTML='<h3>Reportei · conexão VOS</h3><div id="repBody" class="perf-note" style="margin-top:9px">Validando conexão segura…</div>';pane.append(panel);
    const body=panel.querySelector('#repBody');
    try{
      const health=await reportei({action:'HEALTH'});let integrations=null;
      try{integrations=await reportei({action:'INTEGRATIONS',client_id:clientId})}catch(e){if(e.code!=='reportei_project_not_linked')throw e}
      if(integrations){
        const active=(integrations.integrations||[]).filter(x=>String(x.status).toLowerCase()==='active');body.innerHTML=`<div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><div><b>Conectado à API Reportei</b><br><span>${E(health.company?.name||'Conta Reportei')} · projeto ${E(String(integrations.project_id))}</span></div><span class="perf-badge ok">${active.length} integração(ões) ativa(s)</span></div><div class="perf-grid" style="margin-top:9px">${(integrations.integrations||[]).map(i=>`<div class="perf-card" style="padding:9px"><b>${E(i.name)}</b><p>${E(pretty(i.slug))}</p><span class="perf-badge ${String(i.status).toLowerCase()==='active'?'ok':'warn'}">${E(i.status)}</span></div>`).join('')||'<div class="perf-empty">Nenhuma integração encontrada.</div>'}</div><div style="font-size:8px;color:#6b7c91;margin-top:8px">A conexão valida a fonte. Os KPIs são escolhidos no VER; o Reportei não decide sozinho o que é indicador principal.</div>`;
      }else{
        const projects=await reportei({action:'PROJECTS'});body.className='';body.innerHTML=`<div class="perf-note"><b>Token validado.</b> Agora vincule este cliente ao projeto correspondente no Reportei.</div><div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap"><div style="flex:1;min-width:260px"><label class="perf-label">Projeto no Reportei</label><select id="repProject" class="perf-select"><option value="">Selecione…</option>${(projects.projects||[]).map(p=>`<option value="${p.id}">${E(p.name)}</option>`).join('')}</select></div><button id="repLink" class="perf-btn">Vincular projeto</button></div>`;
        panel.querySelector('#repLink').onclick=async()=>{const pid=Number(panel.querySelector('#repProject').value);if(!pid)return YM.toast('Selecione o projeto do cliente no Reportei.',true);const b=panel.querySelector('#repLink');b.disabled=true;try{await reportei({action:'LINK_PROJECT',client_id:clientId,project_id:pid});panel.remove();cache=null;await renderReporteiPanel();YM.toast('Reportei vinculado e integrações validadas.')}catch(e){YM.toast(e.message,true);b.disabled=false}};
      }
    }catch(e){body.innerHTML=`<b>Não foi possível validar o Reportei.</b><br>${E(e.message)}`;}
  }

  async function enhance(){if(enhancing)return;enhancing=true;try{wrapOpen();await enhanceKpiForm();await renderReporteiPanel();}finally{enhancing=false}}
  new MutationObserver(()=>setTimeout(enhance,0)).observe(document.body,{childList:true,subtree:true});setInterval(enhance,1200);enhance();
})();
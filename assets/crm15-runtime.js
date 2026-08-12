(()=>{
  function histHas(o,stage){return (window.crm?.stage_history||[]).some(h=>h.opportunity_id===o.id&&h.to_stage===stage)}
  window.readingSent=function(o){return o?.initial_reading_status==='ENVIADA'||o?.current_stage==='LEITURA_ENVIADA'||histHas(o,'LEITURA_ENVIADA')};
  window.rxDelivered=function(o){return o?.current_stage==='RAIOX_ENTREGUE'||histHas(o,'RAIOX_ENTREGUE')};
  window.raioxPaid=function(o){return o?.current_stage==='RAIOX_PAGO'||histHas(o,'RAIOX_PAGO')};
  window.won=function(o){return o?.current_stage==='GANHO'||histHas(o,'GANHO')};
  window.stageMatch=function(o,stage){
    if(!stage)return true;
    if(stage==='LEITURA_ENVIADA')return window.readingSent(o);
    if(stage==='RAIOX_PAGO')return window.raioxPaid(o);
    if(stage==='RAIOX_ENTREGUE')return window.rxDelivered(o);
    if(stage==='GANHO')return window.won(o);
    return o?.current_stage===stage;
  };
  window.updateKpis=function(items){
    if(!window.crm)return;
    const totalAll=Math.max(window.crm.opportunities?.length||0,1);
    const pct=n=>`${((n/totalAll)*100).toFixed(1).replace('.',',')}% do total`;
    const leads=items.filter(o=>o.current_stage==='LEAD_MAPEADO').length;
    const read=items.filter(window.readingSent).length;
    const rx=items.filter(window.rxDelivered).length;
    const w=items.filter(window.won).length;
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
    set('kTotal',items.length);set('kLead',leads);set('kReading',read);set('kRx',rx);set('kWon',w);
    set('pLead',pct(leads));set('pReading',pct(read));set('pRx',pct(rx));set('pWon',pct(w));
  };
  function rerender(){try{if(typeof window.render==='function'&&window.crm)window.render()}catch(e){console.warn('CRM 1.5 runtime',e)}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(rerender,0),{once:true});else setTimeout(rerender,0);
})();
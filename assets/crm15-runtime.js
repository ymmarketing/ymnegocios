(()=>{
  function histHas(o,stage){try{return typeof window.historyFor==='function'&&window.historyFor(o.id).some(h=>h.to_stage===stage)}catch{return false}}
  window.readingSent=function(o){return o?.initial_reading_status==='ENVIADA'||o?.current_stage==='LEITURA_ENVIADA'||histHas(o,'LEITURA_ENVIADA')};
  window.rxDelivered=function(o){return o?.current_stage==='RAIOX_ENTREGUE'||histHas(o,'RAIOX_ENTREGUE')};
  window.raioxPaid=function(o){return o?.current_stage==='RAIOX_PAGO'||histHas(o,'RAIOX_PAGO')};
  window.won=function(o){return o?.current_stage==='GANHO'||histHas(o,'GANHO')};
  window.stageMatch=function(o,stage){if(!stage)return true;if(stage==='LEITURA_ENVIADA')return window.readingSent(o);if(stage==='RAIOX_PAGO')return window.raioxPaid(o);if(stage==='RAIOX_ENTREGUE')return window.rxDelivered(o);if(stage==='GANHO')return window.won(o);return o?.current_stage===stage};
  window.updateKpis=function(items){
    const raw=document.getElementById('totalChip')?.textContent||'';
    const parsed=Number((raw.match(/\d+/)||[])[0]||0);
    const totalAll=Math.max(parsed,items.length,1);
    const pct=n=>`${((n/totalAll)*100).toFixed(1).replace('.',',')}% do total`;
    const leads=items.filter(o=>o.current_stage==='LEAD_MAPEADO').length,read=items.filter(window.readingSent).length,rx=items.filter(window.rxDelivered).length,w=items.filter(window.won).length;
    const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
    set('kTotal',items.length);set('kLead',leads);set('kReading',read);set('kRx',rx);set('kWon',w);set('pLead',pct(leads));set('pReading',pct(read));set('pRx',pct(rx));set('pWon',pct(w));
  };
  let tries=0;const timer=setInterval(()=>{tries++;try{if(typeof window.render==='function'){window.render();if(document.getElementById('resultMeta')?.textContent){clearInterval(timer)}}}catch{}if(tries>30)clearInterval(timer)},150);
})();
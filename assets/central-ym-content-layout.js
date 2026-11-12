/* Conteúdos · abre direto nos dados dos clientes (11/11/2026)
   - Some com o cabeçalho longo (hero + "Regra central") no desktop e no celular.
   - O ICP da YM é estratégia: sai do topo e passa a ficar dentro da aba "ICP & Aprendizados".
   - A aba "Clientes" vira a primeira e a aba aberta por padrão; "Calendário" passa a se chamar "Calendário YM".
   - No celular, a lista de próximos conteúdos do cliente vem antes do calendário mensal. */
(()=>{
  if(window.__ctLayout)return;window.__ctLayout=true;
  const st=document.createElement('style');st.id='ctLayoutStyle';st.textContent=`
  .ct-hero{display:none!important}
  #tab-icp #ctIcpBar{margin-top:0}
  @media(max-width:760px){
    .cca-grid{display:flex!important;flex-direction:column;gap:10px}
    .cca-grid>aside{order:-1}
    .cca-grid>aside .cca-panel:first-child .cca-note{display:none}
    #ccaRoot>.cca-head>div:first-child{display:none}
    #ccaRoot>.cca-head .cca-scope{flex:1 1 100%;min-width:0;width:100%}
    #ccaRoot>.cca-head .ym-btn{flex:1 1 calc(50% - 6px)}
    .ct-tabs{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto;gap:7px;margin:0 -14px 12px!important;padding:0 14px 4px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
    .ct-tabs::-webkit-scrollbar{display:none}
    .ct-tabs .ct-tab{flex:0 0 auto;width:auto;white-space:nowrap}
  }`;
  document.head.append(st);
  function arrange(){
    const icp=document.getElementById('ctIcpBar'),pane=document.getElementById('tab-icp');
    if(icp&&pane&&icp.parentElement!==pane)pane.prepend(icp);
    const cal=document.querySelector('.ct-tab[data-tab="calendar"]');if(cal)cal.textContent='Calendário YM';
  }
  function promoteClients(tries=0){
    const tabs=document.querySelector('.ct-tabs'),btn=tabs?.querySelector('.ct-tab[data-tab="clientes"]');
    if(!btn){if(tries<60)setTimeout(()=>promoteClients(tries+1),150);return}
    tabs.prepend(btn);
    const want=new URLSearchParams(location.search).get('tab');
    if(!want||want==='clientes')btn.click();
    else tabs.querySelector(`.ct-tab[data-tab="${CSS.escape(want)}"]`)?.click();
  }
  function boot(){arrange();promoteClients()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

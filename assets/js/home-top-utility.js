/* YM Home · atalhos institucionais no topo */
(function(){
  if(window.__YM_HOME_TOP_UTILITY__) return;
  window.__YM_HOME_TOP_UTILITY__=true;

  function mount(){
    var navin=document.querySelector('.nav .navin');
    if(!navin || navin.querySelector('.home-utility-links')) return;

    var group=document.createElement('div');
    group.className='home-utility-links';
    group.setAttribute('aria-label','Acessos rápidos');
    group.innerHTML='\
      <a class="home-utility-link" href="/quemsomos" aria-label="Conhecer a YM">\
        <span class="home-utility-icon" aria-hidden="true">◇</span><span>Quem somos</span>\
      </a>\
      <a class="home-utility-link client" href="/areadocliente" aria-label="Acessar Área do Cliente">\
        <span class="home-utility-icon" aria-hidden="true">○</span><span>Área do cliente</span>\
      </a>';
    navin.appendChild(group);

    if(!document.getElementById('ymHomeUtilityStyle')){
      var style=document.createElement('style');
      style.id='ymHomeUtilityStyle';
      style.textContent='\
        .home-utility-links{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex:0 0 auto}\
        .home-utility-link{min-height:38px;padding:0 12px;border:1px solid #DDE3EE;border-radius:999px;background:#F7F8FC;color:#34405D;display:inline-flex;align-items:center;justify-content:center;gap:7px;font-size:.78rem;font-weight:800;white-space:nowrap;transition:.2s ease;box-shadow:0 4px 14px rgba(18,30,74,.04)}\
        .home-utility-link:hover{border-color:#9EA7E8;background:#EEF1FF;color:#343AA7;transform:translateY(-1px)}\
        .home-utility-link.client{border-color:rgba(72,77,207,.22);background:#EEF1FF;color:#343AA7}\
        .home-utility-link.client:hover{background:#E5E8FF;border-color:#7A82DA}\
        .home-utility-icon{font-size:1rem;line-height:1;color:#484DCF}\
        @media(max-width:1180px){.navin{gap:14px}.links{gap:13px}.home-utility-link{padding:0 10px;font-size:.73rem}}\
        @media(max-width:950px){.home-utility-links{margin-left:auto}.home-utility-link{min-height:36px}}\
        @media(max-width:650px){.navin{gap:8px}.home-utility-links{gap:5px}.home-utility-link{min-height:34px;padding:0 8px;font-size:.67rem;gap:4px}.home-utility-icon{font-size:.85rem}}\
        @media(max-width:390px){.home-utility-link{padding:0 7px}.home-utility-link span:last-child{font-size:.62rem}}';
      document.head.appendChild(style);
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();

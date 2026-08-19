/* YM Home Raio-X V4 · runtime oficial dos 4 depoimentos completos via YouTube. */
(function(){
  var videos=[
    {id:'CuSLKnGcAlQ',name:'Nayara Cortez',caption:'Fisioterapeuta'},
    {id:'txEiXWxCIJI',name:'Rose Menezes',caption:'Fundadora Sunshine Oráculos'},
    {id:'jRdsKtvCogg',name:'Karina Capozzi',caption:'Fundadora e Sócia proprietária H2PL'},
    {id:'RhcWRrUR0FA',name:'Janaina Gomes',caption:'Consultora de RH · LUMOS'}
  ];

  function ensureStyle(){
    if(document.getElementById('ym-video-runtime-v4-css')) return;
    var style=document.createElement('style');
    style.id='ym-video-runtime-v4-css';
    style.textContent='.video-frame iframe{width:100%;height:100%;border:0;display:block;background:#0B1533}.video-frame{background:#0B1533}.video-runtime-badge{position:absolute;top:12px;left:12px;z-index:2;padding:6px 9px;border-radius:999px;background:rgba(11,21,51,.76);color:#fff;font-size:.66rem;font-weight:850;pointer-events:none}';
    document.head.appendChild(style);
  }

  function mount(){
    ensureStyle();
    var cards=document.querySelectorAll('.video-card');
    cards.forEach(function(card,i){
      var item=videos[i];
      if(!item) return;
      var frame=card.querySelector('.video-frame');
      if(!frame) return;
      frame.innerHTML='<span class="video-runtime-badge">Depoimento em vídeo</span><iframe loading="lazy" title="Depoimento de '+item.name.replace(/"/g,'&quot;')+'" src="https://www.youtube-nocookie.com/embed/'+item.id+'?rel=0&playsinline=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
      var label=card.querySelector('.video-label');
      if(label) label.innerHTML='<b>'+item.name+'</b><span>'+item.caption+'</span>';
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();

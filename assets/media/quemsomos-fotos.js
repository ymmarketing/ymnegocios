/* YM Quem Somos · fotos exclusivas desta página · 2026-08-16 */
(function(){
  var items={
    'quemsomos-hero':{url:'/assets/media/quemsomos-hero.txt',alt:'Yasmin Menezes em foto institucional',fit:'contain',pos:'center center',eager:true},
    'quemsomos-historia':{url:'/assets/media/quemsomos-historia.txt',alt:'Yasmin Menezes em seu ambiente de trabalho',fit:'cover',pos:'center center'},
    'quemsomos-fundadora':{url:'/assets/media/quemsomos-fundadora.txt',alt:'Yasmin Menezes, fundadora da YM Marketing & Negócios',fit:'contain',pos:'center center'},
    'quemsomos-bastidores':{url:'/assets/media/quemsomos-bastidores.txt',alt:'Yasmin Menezes trabalhando na operação da YM',fit:'cover',pos:'center center'}
  };
  function addStyle(){
    if(document.getElementById('ym-quemsomos-fotos-style')) return;
    var s=document.createElement('style');
    s.id='ym-quemsomos-fotos-style';
    s.textContent='.photo-slot.ym-real-photo{border-style:solid;background:#fff}.photo-slot.ym-real-photo img{position:absolute;inset:0;width:100%;height:100%;z-index:1}.photo-slot.ym-real-photo:before,.photo-slot.ym-real-photo:after{z-index:2;pointer-events:none}.photo-slot.ym-real-photo .slot-label{display:none}';
    document.head.appendChild(s);
  }
  function loadOne(key,cfg){
    var slot=document.querySelector('[data-photo-slot="'+key+'"]');
    if(!slot) return Promise.resolve();
    return fetch(cfg.url,{cache:'force-cache'}).then(function(r){if(!r.ok) throw new Error(cfg.url);return r.text();}).then(function(b64){
      addStyle();
      var img=document.createElement('img');
      img.src='data:image/webp;base64,'+b64.trim();
      img.alt=cfg.alt;
      img.decoding='async';
      img.loading=cfg.eager?'eager':'lazy';
      img.style.objectFit=cfg.fit;
      img.style.objectPosition=cfg.pos;
      slot.classList.add('ym-real-photo');
      slot.innerHTML='';
      slot.appendChild(img);
    });
  }
  function boot(){Promise.all(Object.keys(items).map(function(k){return loadOne(k,items[k]);})).catch(function(e){console.error('YM Quem Somos fotos:',e);});}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();

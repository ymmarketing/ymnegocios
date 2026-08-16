/* YM Quem Somos · fotos exclusivas desta página · 2026-08-16 · v2 */
(function(){
  var VERSION='20260816-2';
  var items={
    'quemsomos-hero':{url:'/assets/media/quemsomos-hero.txt',alt:'Yasmin Menezes em foto institucional',fit:'cover',pos:'center 30%',eager:true},
    'quemsomos-historia':{url:'/assets/media/quemsomos-historia.txt',alt:'Yasmin Menezes em seu ambiente de trabalho',fit:'cover',pos:'center center'},
    'quemsomos-fundadora':{url:'/assets/media/quemsomos-fundadora.txt',alt:'Yasmin Menezes, fundadora da YM Marketing & Negócios',fit:'cover',pos:'center 24%'},
    'quemsomos-bastidores':{url:'/assets/media/quemsomos-bastidores.txt',alt:'Yasmin Menezes trabalhando na operação da YM',fit:'cover',pos:'center center'}
  };

  function addStyle(){
    if(document.getElementById('ym-quemsomos-fotos-style')) return;
    var s=document.createElement('style');
    s.id='ym-quemsomos-fotos-style';
    s.textContent=[
      '.photo-slot.ym-real-photo{border-style:solid;background:#fff}',
      '.photo-slot.ym-real-photo img{position:absolute;inset:0;width:100%;height:100%;z-index:1;display:block}',
      '.photo-slot.ym-real-photo:before,.photo-slot.ym-real-photo:after{z-index:2;pointer-events:none}',
      '.photo-slot.ym-real-photo .slot-label{display:none}',
      '@media(max-width:720px){',
        '[data-photo-slot="quemsomos-hero"]{min-height:520px}',
        '[data-photo-slot="quemsomos-hero"] img{object-position:center 28%!important}',
        '[data-photo-slot="quemsomos-fundadora"] img{object-position:center 20%!important}',
        '[data-photo-slot="quemsomos-historia"] img,[data-photo-slot="quemsomos-bastidores"] img{object-position:center center!important}',
      '}'
    ].join('');
    document.head.appendChild(s);
  }

  function loadOne(key,cfg){
    var slot=document.querySelector('[data-photo-slot="'+key+'"]');
    if(!slot) return Promise.resolve();
    var requestUrl=cfg.url+'?v='+VERSION;
    return fetch(requestUrl,{cache:'reload'})
      .then(function(r){if(!r.ok) throw new Error('Falha ao carregar '+requestUrl);return r.text();})
      .then(function(b64){
        addStyle();
        return new Promise(function(resolve,reject){
          var img=document.createElement('img');
          img.alt=cfg.alt;
          img.decoding='async';
          img.loading=cfg.eager?'eager':'lazy';
          img.fetchPriority=cfg.eager?'high':'auto';
          img.style.objectFit=cfg.fit;
          img.style.objectPosition=cfg.pos;
          img.onload=function(){
            slot.classList.add('ym-real-photo');
            slot.innerHTML='';
            slot.appendChild(img);
            resolve();
          };
          img.onerror=function(){reject(new Error('Imagem inválida em '+requestUrl));};
          img.src='data:image/webp;base64,'+b64.trim();
        });
      });
  }

  function boot(){
    addStyle();
    Promise.all(Object.keys(items).map(function(k){return loadOne(k,items[k]);}))
      .catch(function(e){console.error('YM Quem Somos fotos:',e);});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();

/* YM Quem Somos · fotos restauradas · v3 · 2026-08-16 */
(function(){
  var VERSION='20260816-restore3';
  var items={
    'quemsomos-hero':{
      parts:[
        '/assets/media/quemsomos-v3/hero-1.txt',
        '/assets/media/quemsomos-v3/hero-2.txt'
      ],
      alt:'Yasmin Menezes em foto institucional',
      fit:'cover',pos:'center center',eager:true
    },
    'quemsomos-historia':{
      parts:[
        '/assets/media/quemsomos-v3/historia-1.txt',
        '/assets/media/quemsomos-v3/historia-2.txt',
        '/assets/media/quemsomos-v3/historia-3.txt'
      ],
      alt:'Yasmin Menezes em seu ambiente de trabalho',
      fit:'cover',pos:'center center'
    },
    'quemsomos-fundadora':{
      parts:['/assets/media/quemsomos-v3/fundadora.txt'],
      alt:'Yasmin Menezes, fundadora da YM Marketing & Negócios',
      fit:'cover',pos:'center center'
    },
    'quemsomos-bastidores':{
      parts:['/assets/media/quemsomos-v3/bastidores.txt'],
      alt:'Yasmin Menezes trabalhando na operação da YM',
      fit:'cover',pos:'center center'
    }
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
        '[data-photo-slot="quemsomos-hero"]{min-height:470px}',
        '[data-photo-slot="quemsomos-hero"] img{object-position:center center!important}',
        '[data-photo-slot="quemsomos-fundadora"] img{object-position:center 34%!important}',
        '[data-photo-slot="quemsomos-historia"] img{object-position:center center!important}',
        '[data-photo-slot="quemsomos-bastidores"] img{object-position:center center!important}',
      '}'
    ].join('');
    document.head.appendChild(s);
  }

  function getPart(url){
    return fetch(url+'?v='+VERSION,{cache:'reload'}).then(function(r){
      if(!r.ok) throw new Error('Falha ao carregar '+url+' ('+r.status+')');
      return r.text();
    });
  }

  function loadOne(key,cfg){
    var slot=document.querySelector('[data-photo-slot="'+key+'"]');
    if(!slot) return Promise.resolve();
    return Promise.all(cfg.parts.map(getPart)).then(function(chunks){
      var b64=chunks.join('').replace(/\s+/g,'');
      if(b64.slice(0,5)!=='UklGR') throw new Error('WebP inválido em '+key);
      addStyle();
      return new Promise(function(resolve,reject){
        var img=document.createElement('img');
        img.alt=cfg.alt;
        img.decoding='async';
        img.loading=cfg.eager?'eager':'lazy';
        img.fetchPriority=cfg.eager?'high':'auto';
        img.style.objectFit=cfg.fit||'cover';
        img.style.objectPosition=cfg.pos||'center center';
        img.onload=function(){
          slot.classList.add('ym-real-photo');
          slot.innerHTML='';
          slot.appendChild(img);
          resolve();
        };
        img.onerror=function(){reject(new Error('Imagem inválida em '+key));};
        img.src='data:image/webp;base64,'+b64;
      });
    }).catch(function(e){
      console.error('YM Quem Somos:',key,e);
    });
  }

  function boot(){
    addStyle();
    Object.keys(items).forEach(function(k){loadOne(k,items[k]);});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();

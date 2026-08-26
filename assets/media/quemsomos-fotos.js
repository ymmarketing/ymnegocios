/* YM Quem Somos · fotos + estado público validado · 2026-08-26 */
(function(){
  var VERSION='20260826-public-header';
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
      '.portfolio-band{display:none!important}',
      '.navlinks a[href="#portfolio"]{display:none!important}',
      '.ym-public-topbar{height:47px;display:flex;align-items:center;justify-content:center;padding:0 16px;background:#ff7a00;color:#fff;font:800 14px Inter,Arial,sans-serif;text-align:center;position:relative;z-index:90}',
      '.ym-public-nav{position:sticky!important;top:0!important;z-index:89!important;background:rgba(255,255,255,.98)!important;box-shadow:0 8px 26px rgba(7,26,46,.045)}',
      '.ym-public-nav .navin{max-width:1280px;min-height:80px;padding:10px 22px;gap:24px}',
      '.ym-public-nav .logo{width:155px;max-width:34vw}',
      '.ym-public-nav .navlinks{gap:21px;flex:1;justify-content:flex-end}',
      '.ym-public-nav .navlinks>a:not(.btn):not(.ym-public-pill){font-size:13px;color:#344462;white-space:nowrap}',
      '.ym-public-nav .ym-public-cta{min-height:48px;border-radius:999px;padding:12px 22px;font-size:13px;background:#ff7a00;color:#fff;box-shadow:0 12px 26px rgba(255,122,0,.20);white-space:nowrap}',
      '.ym-public-pill{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:9px 16px;border:1px solid #dbe2ed;border-radius:999px;background:#fff;color:#30405e!important;font-size:12px!important;font-weight:800!important;white-space:nowrap;box-shadow:0 5px 18px rgba(7,26,46,.035)}',
      '.ym-public-pill:before{content:"";width:9px;height:9px;border:1.7px solid #6366ef;transform:rotate(45deg);border-radius:1px}',
      '.ym-public-pill.client{background:#f5f5ff;border-color:#cfd2ff;color:#3f43bd!important}',
      '.ym-public-pill.client:before{border-radius:50%;transform:none}',
      '.ym-public-pill.current{background:#f8faff}',
      '.qm-local-nav{background:#fff;border-bottom:1px solid #e6ebf2;position:relative;z-index:20}',
      '.qm-local-nav-inner{max-width:1180px;margin:auto;min-height:44px;padding:6px 22px;display:flex;align-items:center;justify-content:center;gap:8px;overflow-x:auto;scrollbar-width:none}',
      '.qm-local-nav-inner::-webkit-scrollbar{display:none}',
      '.qm-local-nav a{flex:0 0 auto;padding:7px 11px;border-radius:999px;font-size:9.5px;font-weight:800;color:#607181;background:#f6f8fb;border:1px solid #e6ebf2}',
      '.qm-local-nav a:hover{background:#eef1ff;color:#484dcf}',
      '@media(max-width:1100px){',
        '.ym-public-nav .navlinks{gap:9px}',
        '.ym-public-nav .navlinks>a:not(.btn):not(.ym-public-pill){display:none}',
        '.ym-public-nav .ym-public-pill{padding:9px 12px}',
      '}',
      '@media(max-width:720px){',
        '[data-photo-slot="quemsomos-hero"]{min-height:470px}',
        '[data-photo-slot="quemsomos-hero"] img{object-position:center center!important}',
        '[data-photo-slot="quemsomos-fundadora"] img{object-position:center 34%!important}',
        '[data-photo-slot="quemsomos-historia"] img{object-position:center center!important}',
        '[data-photo-slot="quemsomos-bastidores"]{min-height:300px!important}',
        '[data-photo-slot="quemsomos-bastidores"] img{object-position:center center!important}',
        '.ym-public-topbar{height:42px;font-size:11px}',
        '.ym-public-nav .navin{min-height:68px;padding:8px 12px;gap:8px}',
        '.ym-public-nav .logo{width:132px;max-width:36vw}',
        '.ym-public-nav .navlinks{gap:6px}',
        '.ym-public-nav .ym-public-cta{min-height:42px;padding:9px 12px;font-size:10px}',
        '.ym-public-nav .ym-public-pill{min-height:40px;padding:8px 10px;font-size:9.5px!important}',
        '.ym-public-nav .ym-public-pill.current{display:none}',
        '.qm-local-nav-inner{justify-content:flex-start;padding:6px 12px}',
      '}',
      '@media(max-width:520px){',
        '.ym-public-nav .ym-public-pill.client{display:none}',
      '}'
    ].join('');
    document.head.appendChild(s);
  }

  function buildPublicHeader(){
    if(document.querySelector('.ym-public-topbar')) return;
    var oldNav=document.querySelector('nav.nav');
    if(!oldNav) return;

    var top=document.createElement('div');
    top.className='ym-public-topbar';
    top.textContent='Raio-X Estratégico · diagnóstico por R$ 97';
    oldNav.parentNode.insertBefore(top,oldNav);

    var oldLinks=[];
    oldNav.querySelectorAll('.navlinks a').forEach(function(a){
      var href=a.getAttribute('href')||'';
      var label=(a.textContent||'').trim();
      if(href.charAt(0)==='#' && href!=='#portfolio' && label) oldLinks.push({href:href,label:label});
    });

    oldNav.classList.add('ym-public-nav');
    oldNav.innerHTML=''+
      '<div class="navin">'+
        '<a href="/" aria-label="Voltar para a página inicial da YM"><img class="logo" src="/assets/img/logo-ym-horizontal.webp" alt="YM Marketing & Negócios"></a>'+
        '<div class="navlinks">'+
          '<a href="/#ganhos">O Raio-X</a>'+
          '<a href="/#depoimentos">Depoimentos</a>'+
          '<a href="/#sobre">Sobre mim</a>'+
          '<a href="/#como">Como funciona</a>'+
          '<a class="btn ym-public-cta" href="/raio-x.html?checkout=1">Fazer meu Raio-X</a>'+
          '<a class="ym-public-pill current" href="/quemsomos" aria-current="page">Quem somos</a>'+
          '<a class="ym-public-pill client" href="/areadocliente">Área do cliente</a>'+
        '</div>'+
      '</div>';

    if(oldLinks.length){
      var local=document.createElement('div');
      local.className='qm-local-nav';
      var inner=document.createElement('div');
      inner.className='qm-local-nav-inner';
      oldLinks.forEach(function(item){
        var a=document.createElement('a');a.href=item.href;a.textContent=item.label;inner.appendChild(a);
      });
      local.appendChild(inner);
      oldNav.insertAdjacentElement('afterend',local);
    }
  }

  function normalizePublicPortfolio(){
    document.querySelectorAll('.navlinks a[href="#portfolio"]').forEach(function(a){a.style.display='none';});
    document.querySelectorAll('.hero-actions a[href="#portfolio"]').forEach(function(a){
      a.setAttribute('href','#construimos');
      if(/conhecer nosso trabalho/i.test(a.textContent||'')) a.textContent='Ver o que construímos';
    });
    var portfolio=document.getElementById('portfolio');
    if(portfolio) portfolio.setAttribute('aria-hidden','true');
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
    buildPublicHeader();
    normalizePublicPortfolio();
    Object.keys(items).forEach(function(k){loadOne(k,items[k]);});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();

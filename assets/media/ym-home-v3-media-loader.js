/* YM Home V4 · fotos + depoimentos completos via YouTube + provas escritas */
(function(){
  var videos=['CuSLKnGcAlQ','txEiXWxCIJI','jRdsKtvCogg','RhcWRrUR0FA'];

  var writtenProofs=[
    {
      initial:'A',
      name:'Ana',
      caption:'negócio comercial',
      tone:'blue',
      messages:[
        ['Yas, acabei de ver o diagnóstico 😍','14:02'],
        ['Abriu minha visão em relação ao que é importante pra obter um crescimento digital objetivo.','14:02'],
        ['Super recomendo 🙌','14:03']
      ]
    },
    {
      initial:'B',
      name:'Boas Bronze e Estética',
      caption:'estética',
      tone:'orange',
      messages:[
        ['Não tenho palavras pra te agradecer 🥹','10:47'],
        ['Essa análise desbloqueou minha mente.','10:47'],
        ['Tudo que eu precisava!','10:48']
      ]
    },
    {
      initial:'G',
      name:'Geise',
      caption:'cliente exigente',
      tone:'green',
      messages:[
        ['O material ficou excelente, adorei! ✨','18:21'],
        ['Já pensando em tudo que está lá...','18:21'],
        ['Você sabe o quanto sou exigente, e ficou muito bom mesmo 👏','18:22']
      ]
    }
  ];

  function ensureStyles(){
    if(document.getElementById('ym-testimonials-v4-css')) return;
    var link=document.createElement('link');
    link.id='ym-testimonials-v4-css';
    link.rel='stylesheet';
    link.href='/assets/home-v4-testimonials.css';
    document.head.appendChild(link);
  }

  function applyPhotos(){
    var hero=document.querySelector('[data-ym-photo="hero"]');
    var sobre=document.querySelector('[data-ym-photo="sobre"]');
    if(hero&&window.YM_HERO_V3) hero.src=window.YM_HERO_V3;
    if(sobre&&window.YM_SOBRE_V3) sobre.src=window.YM_SOBRE_V3;
  }

  function renderWrittenProofs(section){
    if(!section || section.querySelector('.written-proof-block')) return;

    var block=document.createElement('div');
    block.className='written-proof-block';
    block.innerHTML='<div class="written-proof-head">'+
      '<span class="written-proof-kicker">MAIS PROVA REAL</span>'+
      '<h3>Prova acima de promessa.</h3>'+
      '<p>Depois do vídeo, ficam também as mensagens que chegaram de quem viveu o diagnóstico na prática.</p>'+
      '</div>'+
      '<div class="written-proofs">'+writtenProofs.map(function(item){
        var msgs=item.messages.map(function(m){
          return '<div class="wa-bubble"><span>'+m[0]+'</span><small>'+m[1]+'</small></div>';
        }).join('');
        return '<article class="wa-proof">'+
          '<header class="wa-header"><span class="wa-back">‹</span><span class="wa-avatar '+item.tone+'">'+item.initial+'</span>'+
          '<span class="wa-person"><b>'+item.name+'</b><small><i></i> online</small></span></header>'+
          '<div class="wa-chat">'+msgs+'</div>'+
          '<footer><b>'+item.name+'</b><span> · '+item.caption+'</span></footer>'+
          '</article>';
      }).join('')+'</div>';

    var grid=section.querySelector('.testimonials');
    if(grid && grid.parentNode) grid.parentNode.insertBefore(block,grid.nextSibling);
  }

  function renderTestimonials(){
    var section=document.getElementById('depoimentos')||document.querySelector('.testimonial-band');
    if(!section) return;
    section.style.display='';
    var nav=document.querySelector('.links a[href="#depoimentos"]');
    if(nav) nav.style.display='';

    var intro=section.querySelector('.intro');
    if(intro) intro.textContent='Depoimentos completos, com o mesmo espaço e a mesma importância.';

    var grid=section.querySelector('.testimonials');
    if(!grid) return;
    grid.className='testimonials yt-testimonials';
    grid.innerHTML=videos.map(function(id,i){
      return '<button class="yt-card" type="button" data-youtube-id="'+id+'" aria-label="Assistir depoimento completo '+(i+1)+'">'+
        '<img src="https://i.ytimg.com/vi/'+id+'/hqdefault.jpg" alt="Depoimento de cliente da YM" loading="lazy">'+
        '<span class="yt-shade"></span><span class="yt-play" aria-hidden="true">▶</span>'+
        '<span class="yt-label"><b>Depoimento de cliente</b><small>Assistir completo</small></span></button>';
    }).join('');

    renderWrittenProofs(section);

    if(!document.getElementById('yt-modal')){
      var modal=document.createElement('div');
      modal.className='yt-modal';
      modal.id='yt-modal';
      modal.hidden=true;
      modal.setAttribute('aria-hidden','true');
      modal.setAttribute('role','dialog');
      modal.setAttribute('aria-modal','true');
      modal.setAttribute('aria-label','Depoimento em vídeo');
      modal.innerHTML='<button class="yt-modal-backdrop" type="button" data-yt-close aria-label="Fechar vídeo"></button>'+
        '<div class="yt-modal-panel"><button class="yt-modal-close" type="button" data-yt-close aria-label="Fechar vídeo">×</button>'+
        '<div class="yt-player-shell"><iframe id="yt-player" title="Depoimento completo de cliente da YM" src="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div></div>';
      document.body.appendChild(modal);
    }
  }

  function initTestimonials(){
    var modal=document.getElementById('yt-modal');
    var player=document.getElementById('yt-player');
    if(!modal||!player) return;
    function close(){
      player.src='';
      modal.hidden=true;
      modal.setAttribute('aria-hidden','true');
      document.body.classList.remove('yt-modal-open');
    }
    document.querySelectorAll('[data-youtube-id]').forEach(function(card){
      card.addEventListener('click',function(){
        var id=card.getAttribute('data-youtube-id');
        if(!id) return;
        player.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)+'?autoplay=1&playsinline=1&rel=0';
        modal.hidden=false;
        modal.setAttribute('aria-hidden','false');
        document.body.classList.add('yt-modal-open');
      });
    });
    modal.querySelectorAll('[data-yt-close]').forEach(function(btn){btn.addEventListener('click',close)});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!modal.hidden) close()});
  }

  function boot(){
    ensureStyles();
    applyPhotos();
    renderTestimonials();
    initTestimonials();
    if(window.lucide) window.lucide.createIcons();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();

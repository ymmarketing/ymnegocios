/* YM Home V4 · fotos + depoimentos completos via YouTube */
(function(){
  function applyPhotos(){
    var hero=document.querySelector('[data-ym-photo="hero"]');
    var sobre=document.querySelector('[data-ym-photo="sobre"]');
    if(hero&&window.YM_HERO_V3) hero.src=window.YM_HERO_V3;
    if(sobre&&window.YM_SOBRE_V3) sobre.src=window.YM_SOBRE_V3;
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
  function boot(){applyPhotos();initTestimonials();if(window.lucide) window.lucide.createIcons();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();

/* YM Home V3 · carrega fotos e trechos públicos autorizados */
(function(){
  function apply(){
    var hero=document.querySelector('[data-ym-photo="hero"]');
    var sobre=document.querySelector('[data-ym-photo="sobre"]');
    if(hero&&window.YM_HERO_V3) hero.src=window.YM_HERO_V3;
    if(sobre&&window.YM_SOBRE_V3) sobre.src=window.YM_SOBRE_V3;
    [1,2,3,4].forEach(function(i){
      var el=document.querySelector('[data-ym-video="'+i+'"]');
      var src=window['YM_VIDEO_'+i];
      if(el&&src){ el.src=src; el.load(); }
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
})();
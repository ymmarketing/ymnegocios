/* YM Home V3 · hotfix de depoimentos
 * 2026-08-12: remove temporariamente os cortes não homologados da Home.
 * As fotos permanecem ativas. Os depoimentos voltam somente com os vídeos
 * completos, em hospedagem adequada e após validação visual.
 */
(function(){
  function apply(){
    var hero=document.querySelector('[data-ym-photo="hero"]');
    var sobre=document.querySelector('[data-ym-photo="sobre"]');
    if(hero&&window.YM_HERO_V3) hero.src=window.YM_HERO_V3;
    if(sobre&&window.YM_SOBRE_V3) sobre.src=window.YM_SOBRE_V3;

    var section=document.getElementById('depoimentos') || document.querySelector('.testimonial-band');
    if(section) section.style.display='none';

    var nav=document.querySelector('.links a[href="#depoimentos"]');
    if(nav) nav.style.display='none';

    [1,2,3,4].forEach(function(i){
      var el=document.querySelector('[data-ym-video="'+i+'"]');
      if(el){
        try{ el.pause(); }catch(e){}
        el.removeAttribute('src');
        try{ el.load(); }catch(e){}
      }
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
})();
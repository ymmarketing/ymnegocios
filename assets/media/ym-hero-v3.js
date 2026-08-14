/* YM Home V4 · hero atualizada em 2026-08-14 · WebP centralizado e otimizado. */
(function(){
  var parts=[
    '/assets/media/ym-hero-v4-part1.txt',
    '/assets/media/ym-hero-v4-part2.txt',
    '/assets/media/ym-hero-v4-part3.txt',
    '/assets/media/ym-hero-v4-part4.txt'
  ];

  function applyHero(src){
    var hero=document.querySelector('[data-ym-photo="hero"]');
    if(hero&&src) hero.src=src;
  }

  window.YM_HERO_V3_READY=Promise.all(parts.map(function(url){
    return fetch(url,{cache:'force-cache'}).then(function(response){
      if(!response.ok) throw new Error('Falha ao carregar '+url);
      return response.text();
    });
  })).then(function(chunks){
    var src='data:image/webp;base64,'+chunks.join('');
    window.YM_HERO_V3=src;
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',function(){applyHero(src);},{once:true});
    }else{
      applyHero(src);
    }
    return src;
  }).catch(function(error){
    console.error('YM hero:',error);
  });
})();

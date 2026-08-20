(()=>{
 function inject(){
  const actions=document.querySelector('.ym-header .ym-actions');
  if(!actions||document.getElementById('centralYmConsoleLink'))return;
  const a=document.createElement('a');a.id='centralYmConsoleLink';a.href='/CRM/CENTRAL';a.className='ym-btn';a.textContent='Central YM · Administração';actions.prepend(a);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject,{once:true});else inject();
 new MutationObserver(()=>requestAnimationFrame(inject)).observe(document.body,{childList:true,subtree:true});
})();
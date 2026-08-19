(()=>{
  function applyNoneOption(){
    document.querySelectorAll('select[id^="rt_"]').forEach(sel=>{
      if(sel.dataset.noneRecommendation==='1')return;
      sel.dataset.noneRecommendation='1';
      const blank=[...sel.options].find(o=>o.value==='');
      if(blank){blank.textContent='Nenhuma recomendação';blank.dataset.none='1'}
      else{
        const o=document.createElement('option');
        o.value='';
        o.textContent='Nenhuma recomendação';
        o.dataset.none='1';
        sel.prepend(o);
      }
      sel.addEventListener('change',()=>{
        if(sel.value!=='')return;
        const id=sel.id.replace('rt_','');
        const rationale=document.getElementById('rr_'+id);
        if(rationale&&rationale.value){
          rationale.value='';
          rationale.dispatchEvent(new Event('input',{bubbles:true}));
          rationale.dispatchEvent(new Event('change',{bubbles:true}));
        }
      });
    });
  }
  const root=document.getElementById('leadList')||document.body;
  new MutationObserver(()=>requestAnimationFrame(applyNoneOption)).observe(root,{childList:true,subtree:true});
  setInterval(applyNoneOption,800);
  applyNoneOption();
})();

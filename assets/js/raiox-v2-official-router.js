(function(root){
  'use strict';
  const BACKEND='https://ym-raiox-backend.vercel.app';
  const TARGET='/raio-x-app.html';
  let redirecting=false;

  // O quiz/relatório legado continua somente como arquivo histórico da página de checkout.
  // Nunca deve piscar ou ser exibido no fluxo oficial V2.2.
  try{
    const style=document.createElement('style');
    style.id='ym-v22-production-guard';
    style.textContent='#view-quiz,#view-proc,#view-report{display:none!important}';
    document.head.appendChild(style);
  }catch{}

  function getRef(){
    try{
      const q=new URLSearchParams(location.search);
      return q.get('ref')||localStorage.getItem('ym_raiox_ref')||'';
    }catch{return'';}
  }
  function go(ref){
    if(redirecting||!ref)return false;
    redirecting=true;
    try{localStorage.setItem('ym_raiox_ref',ref);}catch{}
    location.replace(TARGET+'?ref='+encodeURIComponent(ref));
    return true;
  }
  async function resumeIfApproved(){
    const ref=getRef();
    if(!ref)return;
    try{
      const r=await fetch(BACKEND+'/api/pagamento/status?ref='+encodeURIComponent(ref),{cache:'no-store'});
      const d=await r.json();
      if(r.ok&&d&&d.status==='approved')go(ref);
    }catch{}
  }
  function patch(){
    root.renderQuiz=function(){
      const ref=getRef();
      return ref ? go(ref) : false;
    };
  }
  patch();
  let attempts=0;
  const timer=setInterval(()=>{patch();if(++attempts>=20)clearInterval(timer);},500);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',resumeIfApproved,{once:true});
  else resumeIfApproved();
})(window);

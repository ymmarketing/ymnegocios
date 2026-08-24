(function(root){
  'use strict';
  const BACKEND='https://ym-raiox-backend.vercel.app';
  const TARGET='/raio-x-app.html';
  let redirecting=false;
  function getRef(){
    try{
      const q=new URLSearchParams(location.search);
      return q.get('ref')||localStorage.getItem('ym_raiox_ref')||'';
    }catch{return'';}
  }
  function go(ref){
    if(redirecting||!ref)return;
    redirecting=true;
    try{localStorage.setItem('ym_raiox_ref',ref);}catch{}
    location.replace(TARGET+'?ref='+encodeURIComponent(ref));
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
      if(ref) return go(ref);
      return false;
    };
  }
  patch();
  let attempts=0;
  const timer=setInterval(()=>{patch();if(++attempts>=20)clearInterval(timer);},500);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',resumeIfApproved,{once:true});
  else resumeIfApproved();
})(window);

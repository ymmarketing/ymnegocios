(()=>{
 const SUPABASE_URL='https://srzdikgztpdtwbggwniz.supabase.co';
 const PUBLISHABLE_KEY='sb_publishable_OGZsWJSj2noU3Dd78pk48g__eEKE3xT';
 const replacements=new Map([
  ['Prazo operacional: D+2','Você pode salvar e continuar depois'],
  ['Dados do VER começam aqui','Essas informações serão a base do nosso trabalho'],
  ['Concluir onboarding','Concluir informações iniciais'],
  ['Onboarding concluído. A YM já pode validar os dados e preparar o kickoff.','Informações enviadas. A equipe YM vai revisar o que você compartilhou e preparar os próximos passos.']
 ]);
 function humanize(root=document){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){
    const value=node.nodeValue||'';let next=value;
    for(const [from,to] of replacements)next=next.replaceAll(from,to);
    if(next!==value)node.nodeValue=next;
  }
  const submit=document.getElementById('coSubmit');
  if(submit&&/onboarding/i.test(submit.textContent||''))submit.textContent='Concluir informações iniciais';
 }
 const observer=new MutationObserver(records=>{for(const r of records){if(r.type==='characterData')humanize(r.target.parentNode||document);else for(const n of r.addedNodes){if(n.nodeType===1||n.nodeType===3)humanize(n.nodeType===1?n:n.parentNode||document);}}});
 observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
 humanize();

 async function fastBootstrap(){
  try{
   if(!window.supabase)return;
   const sb=window.supabase.createClient(SUPABASE_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});
   const {data:{session}}=await sb.auth.getSession();
   if(!session)return;
   const response=await fetch(SUPABASE_URL+'/functions/v1/central-ym-client-bootstrap',{headers:{Authorization:'Bearer '+session.access_token,apikey:PUBLISHABLE_KEY}});
   if(!response.ok)return;
   const json=await response.json();const boot=json.bootstrap;if(!boot?.access)return;
   window.__ymClientBootstrap=boot;
   if(boot.access.onboarding_completed_at)return;
   const contact=boot.client?.contact||{};
   const business=contact.business_name||contact.name||'seu negócio';
   const businessEl=document.getElementById('onboardingBusiness');if(businessEl)businessEl.textContent=business;
   const projectsEl=document.getElementById('onboardingProjects');if(projectsEl)projectsEl.textContent=String(boot.services_count||0);
   document.getElementById('authScreen')?.classList.add('hidden');
   document.getElementById('portalScreen')?.classList.remove('hidden');
   document.getElementById('onboardingOverlay')?.classList.remove('hidden');
   window.dispatchEvent(new CustomEvent('centralym:initial-info-open',{detail:boot}));
  }catch(_){/* o carregamento completo assume em caso de falha */}
 }
 fastBootstrap();
})();
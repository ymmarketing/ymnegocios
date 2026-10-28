(()=>{
 const SUPABASE_URL='https://srzdikgztpdtwbggwniz.supabase.co';
 const PUBLISHABLE_KEY='sb_publishable_OGZsWJSj2noU3Dd78pk48g__eEKE3xT';
 const replacements=new Map([
  ['Prazo operacional: D+2','Você pode salvar e continuar depois'],
  ['Dados do VER começam aqui','Essas informações serão a base do nosso trabalho'],
  ['Concluir onboarding','Concluir informações iniciais'],
  ['Onboarding concluído. A YM já pode validar os dados e preparar o kickoff.','Informações enviadas. A equipe YM vai revisar o que você compartilhou e preparar os próximos passos.'],
  ['Histórico mínimo','Histórico dos últimos meses'],
  ['Qualidade dos dados','Disponibilidade das informações'],
  ['Ativos digitais e evidências','Canais, materiais e links'],
  ['Links de materiais ou evidências','Links de materiais ou referências'],
  ['Jornada comercial atual','Como funciona sua venda hoje'],
  ['Sazonalidade','Períodos de maior ou menor movimento'],
  ['Capacidade operacional','Capacidade de atendimento'],
  ['Ticket médio','Valor médio por venda/cliente'],
  ['Mídia paga','Investimento em anúncios']
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


})();

(function(){
  var $=function(i){return document.getElementById(i)};
  var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* menu no celular */
  var mb=document.querySelector("#pg-home .nav .menu"), mn=document.querySelector("#pg-home .mnav");
  if(mb&&mn){mb.addEventListener("click",function(){var o=mn.classList.toggle("open");mb.setAttribute("aria-expanded",o)});
    mn.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){mn.classList.remove("open");mb.setAttribute("aria-expanded","false")})});}

  /* Casa do Marketing */
  var D={"man": ["Andar 06", "Sustentar", "Manutenção", "medir, comparar e ajustar", "Todo mês, os números do conteúdo e dos anúncios são cruzados com o financeiro para decidir o próximo passo.", ["Relatório conteúdo × financeiro", "Testes e otimização", "Antes × depois com a mesma régua", "Reunião mensal de resultados"], "ROI, receita por canal e por conteúdo"], "tel": ["Andar 05", "Sustentar", "Telhado", "aparecer para quem compra", "Conteúdo, anúncios e campanhas entram quando a base está pronta para receber o cliente.", ["Planejamento e programação de posts", "Tráfego pago", "Copy e roteiros de vídeo", "Campanhas sazonais"], "custo por contato, taxa de conversão"], "par": ["Andar 04", "Ordenar", "Paredes", "o caminho até a compra", "Sistemas e páginas que levam o cliente do primeiro contato à venda, sem depender de você.", ["Site e landing pages", "CRM e automações", "ERP e sistemas sob medida", "Área do Cliente e e-commerce"], "tempo de resposta, horas manuais economizadas"], "pil": ["Andar 03", "Ordenar", "Pilares", "aquisição, posicionamento e operação", "Organizamos como o cliente chega, como a oferta é apresentada e como a operação entrega.", ["Canais de aquisição", "Processo comercial e atendimento", "Esteira de produtos e preço", "Processos operacionais"], "leads qualificados, taxa de fechamento"], "fun": ["Andar 02", "Ver", "Fundação", "estratégia e marca", "Definimos o que a empresa é, para quem fala e por que alguém deveria escolhê-la.", ["Estratégia e posicionamento", "Brand book e identidade", "Proposta única de valor", "Missão, visão e valores"], "clareza de oferta, ticket médio"], "ter": ["Andar 01", "Ver", "Terreno", "entender onde o negócio está", "Antes de qualquer investimento, lemos os números, a jornada do cliente e a concorrência para saber o que está travando o resultado.", ["Avaliação inicial e Raio-X", "Leitura de concorrência e SWOT", "Linha de base com números reais", "Definição dos indicadores"], "linha de base de faturamento, leads e conversão"]}, F={"ter": "<a href=\"/triagem/\">Avaliação gratuita</a> · <a href=\"/raio-x-digital/\">Raio-X Digital</a>", "fun": "<a href=\"#caminhos\">Projeto</a>", "pil": "<a href=\"#caminhos\">Projeto</a> · <a href=\"#caminhos\">Pontual (Job)</a>", "par": "<a href=\"#caminhos\">Projeto</a> · <a href=\"#caminhos\">Pontual (Job)</a>", "tel": "<a href=\"#caminhos\">Mensal</a> · <a href=\"#caminhos\">Pontual (Job)</a>", "man": "<a href=\"#caminhos\">Mensal</a>"};
  var ORDER=["ter","fun","pil","par","tel","man"], VC={"Ver":"v-ver","Ordenar":"v-ord","Sustentar":"v-sus"};
  var cur="ter", casa=$("casa");
  function show(k,focus){
    cur=k; var d=D[k];
    casa.querySelectorAll(".ly,.lb,.orbit").forEach(function(e){e.classList.toggle("on",e.getAttribute("data-k")===k)});
    casa.querySelectorAll(".tab").forEach(function(t){var on=t.dataset.k===k;t.setAttribute("aria-selected",on);t.tabIndex=on?0:-1;if(on&&focus)t.focus()});
    var p=$("panel"); p.className="panel "+VC[d[1]];
    $("p-n").textContent=String(ORDER.indexOf(k)+1).padStart(2,"0");
    $("p-v").textContent=d[1];
    $("p-t").innerHTML=d[2]+": <span>"+d[3]+"</span>";
    $("p-d").textContent=d[4];
    $("p-l").innerHTML=d[5].map(function(t){return "<li>"+t+"</li>"}).join("");
    $("p-k").textContent=d[6];
    $("p-f").innerHTML=F[k];
    $("p-prev").disabled=k==="ter"; $("p-next").disabled=k==="man";
    p.classList.remove("in"); void p.offsetWidth; p.classList.add("in");
  }
  casa.querySelectorAll(".ly,.lb,.orbit").forEach(function(e){
    e.addEventListener("click",function(){show(e.getAttribute("data-k"))});
    e.addEventListener("mouseenter",function(){casa.querySelectorAll('[data-k="'+e.getAttribute("data-k")+'"]').forEach(function(x){x.classList.add("hov")})});
    e.addEventListener("mouseleave",function(){casa.querySelectorAll(".hov").forEach(function(x){x.classList.remove("hov")})});
  });
  casa.querySelectorAll(".tab").forEach(function(t){t.addEventListener("click",function(){show(t.dataset.k)})});
  casa.querySelector(".tabs").addEventListener("keydown",function(e){
    var i=ORDER.indexOf(cur);
    if(e.key==="ArrowRight"||e.key==="ArrowUp"){e.preventDefault();if(i<5)show(ORDER[i+1],true)}
    if(e.key==="ArrowLeft"||e.key==="ArrowDown"){e.preventDefault();if(i>0)show(ORDER[i-1],true)}
  });
  $("p-prev").onclick=function(){var i=ORDER.indexOf(cur);if(i>0)show(ORDER[i-1])};
  $("p-next").onclick=function(){var i=ORDER.indexOf(cur);if(i<5)show(ORDER[i+1])};
  var q=new URLSearchParams(location.search); show(q.get("andar")||"ter");

  /* o ponto: do símbolo da abertura até o terreno da casa */
  var tv=document.querySelector(".trav"), hd=document.querySelector(".h7 .sym .dot"), root=document.documentElement;
  var noTrav=q.get("ponto")==="fixo";
  function vis(e){var r=e.getBoundingClientRect();return r.width>0&&r.height>0}
  function trav(){
    if(reduce||noTrav||!tv||!hd){root.classList.remove("js-trav");return}
    var cd=[].slice.call(casa.querySelectorAll(".start .core")).filter(vis)[0]; if(!cd)return;
    root.classList.add("js-trav");
    var sy=window.scrollY, sx=window.scrollX;
    var a=hd.getBoundingClientRect(), b=cd.getBoundingClientRect();
    var ax=a.left+a.width/2+sx, ay=a.top+a.height/2+sy, bx=b.left+b.width/2+sx, by=b.top+b.height/2+sy;
    var cTop=casa.getBoundingClientRect().top+sy, head=(document.querySelector('#pg-home .nav')||{offsetHeight:76}).offsetHeight;
    var s0=Math.max(0,ay-window.innerHeight*0.62), s1=Math.max(s0+1,cTop-head-60);
    var t=Math.min(1,Math.max(0,(sy-s0)/(s1-s0)));
    var e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    var x=ax+(bx-ax)*e, y=ay+(by-ay)*e, d=a.width+(b.width-a.width)*e;
    tv.style.width=tv.style.height=d+"px";
    tv.style.transform="translate("+(x-d/2)+"px,"+(y-d/2)+"px)";
    root.classList.toggle("landed",t>=0.995);
  }
  var tick=false;
  window.addEventListener("scroll",function(){if(!tick){tick=true;requestAnimationFrame(function(){tick=false;trav()})}},{passive:true});
  window.addEventListener("resize",trav);
  window.addEventListener("load",trav);

  /* projetos: contexto, desafio e solução */
  var dlg=$("case-dlg"), body=$("case-body"), opener=null;
  function openCase(k,btn){
    var tpl=$("case-"+k); if(!tpl)return; opener=btn||null;
    body.innerHTML=""; body.appendChild(tpl.content.cloneNode(true));
    if(dlg.showModal)dlg.showModal(); else dlg.setAttribute("open","");
    dlg.scrollTop=0; document.body.style.overflow="hidden";
  }
  document.querySelectorAll("[data-case]").forEach(function(el){
    el.addEventListener("click",function(ev){if(ev.target.closest("a"))return;ev.preventDefault();openCase(el.getAttribute("data-case"),el.querySelector?el.querySelector(".more7")||el:el)});
  });
  body.addEventListener("click",function(e){var bt=e.target.closest(".ptabs button");if(!bt)return;var cm=bt.closest(".cm");
    cm.querySelectorAll(".ptabs button").forEach(function(x){x.setAttribute("aria-selected",x===bt?"true":"false")});
    cm.querySelectorAll(".pair").forEach(function(pp){pp.classList.toggle("on",pp.dataset.p===bt.dataset.p)});});
  dlg.querySelector(".x").addEventListener("click",function(){dlg.close()});
  dlg.addEventListener("click",function(e){if(e.target===dlg)dlg.close()});
  dlg.addEventListener("close",function(){document.body.style.overflow="";if(opener)opener.focus()});

  trav();
})();

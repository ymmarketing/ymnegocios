/* YM INTERNAL TYPOGRAPHY GUARD 20260901 v3
   Regra oficial do ambiente: corpo 15px, UI 14px, apoio 13px, meta 12px.
   Mede o tamanho COMPUTADO e corrige CSS legado, estilos inline, modais e
   componentes inseridos dinamicamente depois do carregamento da página. */
(()=>{
  if(window.__YM_INTERNAL_TYPOGRAPHY_GUARD__) return;
  window.__YM_INTERNAL_TYPOGRAPHY_GUARD__=true;

  /* O arquivo só é carregado nas telas internas, então body é o escopo correto.
     Isso inclui sidebar, conteúdo, drawers, modais e componentes criados fora de .ym-main. */
  const ROOT_SELECTOR='body';
  const SKIP='script,style,svg,path,canvas,template,noscript,iframe,option';
  const META_RE=/(^|[-_])(meta|eyebrow|badge|tag|status|kicker|helper|help|sub|caption|hint|note|date|label|pill|chip)([-_]|$)/i;
  const CONTROL_RE=/^(BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/;
  const TEXT_RE=/^(P|LI|TD|A|B|STRONG|LABEL|LEGEND)$/;
  const HEADING_MIN={H1:28,H2:18,H3:15,H4:14,H5:13,H6:13};

  function hasDirectText(el){
    return [...el.childNodes].some(n=>n.nodeType===Node.TEXT_NODE && n.textContent.trim());
  }

  function minimumFor(el){
    const tag=el.tagName;
    const cls=typeof el.className==='string'?el.className:'';
    if(HEADING_MIN[tag]) return HEADING_MIN[tag];
    if(tag==='SMALL' || META_RE.test(cls)) return 12;
    if(tag==='TH') return 12;
    if(CONTROL_RE.test(tag)) return (tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA') ? (innerWidth<=760?16:14) : 14;
    if(TEXT_RE.test(tag)) return 13;
    if(tag==='SPAN') return 12;
    if(tag==='DIV' && hasDirectText(el)) return META_RE.test(cls)?12:13;
    return 0;
  }

  function enforceElement(el){
    if(!(el instanceof Element) || el.matches(SKIP) || !el.closest(ROOT_SELECTOR)) return;
    const min=minimumFor(el);
    if(!min) return;
    const cs=getComputedStyle(el);
    const current=parseFloat(cs.fontSize)||0;
    if(current+0.01<min){
      el.style.setProperty('font-size',`${min}px`,'important');
      const lh=parseFloat(cs.lineHeight);
      if(min>=13 && Number.isFinite(lh) && lh<min*1.25){
        el.style.setProperty('line-height','1.45','important');
      }
      el.dataset.ymTypeGuard=String(min);
    }
  }

  function scan(root=document){
    if(root instanceof Element) enforceElement(root);
    const scope=root.querySelectorAll?root:document;
    scope.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,td,th,a,b,strong,label,legend,button,input,select,textarea,summary,small,span,div').forEach(enforceElement);
  }

  let scheduled=false;
  const pending=new Set();
  function schedule(root){
    pending.add(root instanceof Element?root:document);
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      pending.forEach(scan);
      pending.clear();
    });
  }

  const style=document.createElement('style');
  style.id='ymTypographyPseudoGuard';
  style.textContent=`
    body *::before,body *::after{font-size:inherit}
    @media(max-width:760px){
      body button,body summary{min-height:44px}
      body input,body select,body textarea{font-size:16px!important}
    }
  `;
  document.head.appendChild(style);

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>scan(document),{once:true});
  else scan(document);

  const observer=new MutationObserver(mutations=>{
    for(const m of mutations){
      if(m.type==='attributes') schedule(m.target);
      if(m.type==='characterData' && m.target.parentElement) schedule(m.target.parentElement);
      if(m.type==='childList'){
        schedule(m.target);
        m.addedNodes.forEach(n=>{
          if(n.nodeType===Node.ELEMENT_NODE) schedule(n);
          else if(n.nodeType===Node.TEXT_NODE && n.parentElement) schedule(n.parentElement);
        });
      }
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style']});

  addEventListener('resize',()=>schedule(document),{passive:true});
  setTimeout(()=>scan(document),250);
  setTimeout(()=>scan(document),900);
  setTimeout(()=>scan(document),1800);
})();
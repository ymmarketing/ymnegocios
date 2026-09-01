/* YM INTERNAL TYPOGRAPHY GUARD 20260901
   Regra oficial do ambiente: corpo 15px, UI 14px, apoio 13px, meta 12px.
   Esta camada mede o tamanho COMPUTADO, portanto cobre CSS legado, estilos inline
   e componentes criados dinamicamente depois do carregamento da página. */
(()=>{
  if(window.__YM_INTERNAL_TYPOGRAPHY_GUARD__) return;
  window.__YM_INTERNAL_TYPOGRAPHY_GUARD__=true;

  const ROOT_SELECTOR='.ym-main, .ym-sidebar, .ym-modal-back, .crm-modal-back, .dash-modal-back, .target-back, .ca-drawer-back, .ca-new-back, .ct-modal-back';
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
    if(CONTROL_RE.test(tag)) return tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA' ? (innerWidth<=760?16:14) : 14;
    if(TEXT_RE.test(tag)) return 13;
    if(tag==='SPAN') return 12;
    if(tag==='DIV' && hasDirectText(el)) return META_RE.test(cls)?12:13;
    return 0;
  }

  function enforceElement(el){
    if(!(el instanceof Element) || el.matches(SKIP)) return;
    if(!el.closest(ROOT_SELECTOR)) return;
    const min=minimumFor(el);
    if(!min) return;
    const current=parseFloat(getComputedStyle(el).fontSize)||0;
    if(current+0.01<min){
      el.style.setProperty('font-size',`${min}px`,'important');
      if(min>=13 && parseFloat(getComputedStyle(el).lineHeight)<min*1.25){
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
    ${ROOT_SELECTOR} *::before,${ROOT_SELECTOR} *::after{font-size:inherit}
    @media(max-width:760px){
      ${ROOT_SELECTOR} button,${ROOT_SELECTOR} summary{min-height:44px}
      ${ROOT_SELECTOR} input,${ROOT_SELECTOR} select,${ROOT_SELECTOR} textarea{font-size:16px!important}
    }
  `;
  document.head.appendChild(style);

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>scan(document),{once:true});
  else scan(document);

  const observer=new MutationObserver(mutations=>{
    for(const m of mutations){
      if(m.type==='attributes') schedule(m.target);
      m.addedNodes.forEach(n=>{if(n.nodeType===Node.ELEMENT_NODE)schedule(n)});
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});

  addEventListener('resize',()=>schedule(document),{passive:true});
  setTimeout(()=>scan(document),300);
  setTimeout(()=>scan(document),1200);
})();
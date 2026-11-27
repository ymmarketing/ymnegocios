/* Área do Cliente · "Revisar post a post" (26/11/2026)
   A cliente vê um post por vez, do jeito que vai aparecer no Instagram, e aprova ou pede ajuste.
   As respostas usam a mesma ação APPROVAL_ACTION das Aprovações: caem na Central YM com histórico.
   Depende de window.CentralYMClientPortal (data, api, toast, reload). Expõe window.CentralYMReview.open(). */
(()=>{
  if(window.CentralYMReview)return;
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const P=()=>window.CentralYMClientPortal;
  const ORDER=['A Vivian','Medalhas e premiados','Quem faz','Tem no Divino','Corte da Jurada','A Jurada responde','Par perfeito','A mesa e presentes','Como pedir e onde fica'];
  const FMT={CARROSSEL:'Carrossel',ESTATICO:'Post',REEL:'Reels',STORIES:'Stories'};
  const FORD={CARROSSEL:0,ESTATICO:1,REEL:2};
  const subject=a=>(String(a.description||'').match(/^Assunto:\s*([^.]+)\./)||[])[1]||'';
  const ask=a=>String(a.description||'').replace(/^Assunto:\s*[^.]+\.\s*/,'').trim();

  function css(){if(document.getElementById('cpRvCss'))return;const s=document.createElement('style');s.id='cpRvCss';s.textContent=`
  .cp-rv-hero{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;background:#0A2540;color:#fff;border-radius:18px;padding:18px 20px;margin:0 0 18px}
  .cp-rv-hero b{display:block;font:800 18px/1.25 Montserrat,Arial,sans-serif}.cp-rv-hero span{display:block;margin-top:4px;font-size:14px;color:#cfe0f2}
  .cp-rv-hero button{background:#FF7A00;color:#fff;border:0;border-radius:12px;min-height:48px;padding:0 20px;font:800 15px Inter,Arial,sans-serif;cursor:pointer}
  .rv-back{position:fixed;inset:0;z-index:9998;background:#e9edf2;overflow:auto;-webkit-overflow-scrolling:touch}
  .rv-wrap{max-width:470px;margin:0 auto;min-height:100%;background:#fff;display:flex;flex-direction:column;box-shadow:0 0 40px rgba(7,26,46,.12)}
  .rv-top{position:sticky;top:0;z-index:3;background:#fff;border-bottom:1px solid #eceff3;padding:10px 12px 0}
  .rv-top-row{display:flex;align-items:center;gap:10px}
  .rv-x{width:40px;height:40px;border:0;background:#f1f4f8;border-radius:999px;font-size:24px;line-height:1;cursor:pointer;color:#0A2540}
  .rv-top h2{margin:0;flex:1;font:800 16px Montserrat,Arial,sans-serif;color:#0A2540}.rv-top small{font:700 13px Inter,Arial,sans-serif;color:#5d7186}
  .rv-bar{height:4px;background:#eef2f6;border-radius:9px;margin:10px 0 0;overflow:hidden}.rv-bar i{display:block;height:100%;background:#117A5B;border-radius:9px;transition:width .3s}
  .rv-chips{display:flex;gap:6px;overflow-x:auto;padding:10px 0;scrollbar-width:none}.rv-chips::-webkit-scrollbar{display:none}
  .rv-chip{flex:0 0 auto;border:1px solid #dce5f0;background:#fff;border-radius:999px;padding:7px 12px;font:700 13px Inter,Arial,sans-serif;color:#33475b;cursor:pointer}
  .rv-chip.on{background:#0A2540;border-color:#0A2540;color:#fff}
  .rv-tag{padding:12px 14px 0;font:700 12px Inter,Arial,sans-serif;color:#7a5a37;letter-spacing:.04em;text-transform:uppercase}
  .ig-head{display:flex;align-items:center;gap:10px;padding:10px 14px}
  .ig-av{flex:0 0 34px;width:34px;height:34px;border-radius:999px;background:#C9A57A;color:#2E2C2A;display:flex;align-items:center;justify-content:center;line-height:1;font:700 16px/1 Georgia,serif;box-shadow:0 0 0 2px #fff,0 0 0 3.5px #d6b48a}
  .ig-head b{font:700 14px Inter,Arial,sans-serif;color:#111}.ig-head div span{display:block;font:500 12px Inter,Arial,sans-serif;color:#666}
  .ig-more{margin-left:auto;font:900 18px Inter;color:#111;letter-spacing:1px}
  .ig-media{position:relative;background:#111}
  .ig-track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-webkit-overflow-scrolling:touch}.ig-track::-webkit-scrollbar{display:none}
  .ig-slide{flex:0 0 100%;scroll-snap-align:center;display:grid;place-items:center;background:#111}
  .ig-slide img{width:100%;height:auto;display:block;max-height:max(360px,calc(100vh - 230px));object-fit:contain}
  .ig-count{position:absolute;top:12px;right:12px;background:rgba(17,17,17,.7);color:#fff;font:700 12px Inter,Arial,sans-serif;border-radius:999px;padding:4px 9px}
  .ig-reel{position:absolute;top:12px;left:12px;background:rgba(17,17,17,.7);color:#fff;font:700 12px Inter,Arial,sans-serif;border-radius:999px;padding:4px 9px}
  .ig-nav{position:absolute;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:999px;border:0;background:rgba(255,255,255,.85);font-size:20px;cursor:pointer;color:#111}
  .ig-nav.p{left:8px}.ig-nav.n{right:8px}
  .ig-icons{display:flex;align-items:center;gap:14px;padding:10px 14px 4px}.ig-icons svg{width:24px;height:24px}.ig-icons .bm{margin-left:auto}
  .ig-dots{display:flex;gap:4px;justify-content:center;position:absolute;left:0;right:0;margin-top:-2px}.ig-dots i{width:6px;height:6px;border-radius:9px;background:#c7c7c7}.ig-dots i.on{background:#0095f6}
  .ig-cap{padding:6px 14px 4px;font:400 14px/1.45 Inter,Arial,sans-serif;color:#111;white-space:pre-wrap;word-wrap:break-word}
  .ig-cap b{font-weight:700}.ig-more-btn{border:0;background:none;color:#737373;font:500 14px Inter,Arial,sans-serif;padding:0;cursor:pointer}
  .rv-script{margin:8px 14px 0;border:1px solid #e4e8ee;border-radius:12px;padding:10px 12px;font:500 14px/1.5 Inter,Arial,sans-serif;color:#26384a}
  .rv-script summary{cursor:pointer;font-weight:800}
  .rv-ask{margin:12px 14px 0;background:#FFF6E5;border:1px solid #F3D9A6;border-radius:12px;padding:11px 13px;font:500 14.5px/1.5 Inter,Arial,sans-serif;color:#5b3d0a}
  .rv-ask b{display:block;font-weight:800;margin-bottom:2px}
  .rv-done-msg{margin:10px 14px 0;border-radius:12px;padding:12px 13px;font:600 14.5px/1.5 Inter,Arial,sans-serif}
  .rv-done-msg.ok{background:#EAF7EF;border:1px solid #BFE6CD;color:#0F5132}.rv-done-msg.warn{background:#FFF1E6;border:1px solid #FFD2AE;color:#8a3b00}
  .rv-act{background:#fff;border-top:1px solid #eceff3;padding:10px 14px calc(12px + env(safe-area-inset-bottom));margin-top:auto}
  .rv-act textarea{width:100%;min-height:52px;max-height:160px;resize:vertical;border:1px solid #d5dee8;border-radius:12px;padding:10px 12px;font:500 16px Inter,Arial,sans-serif;color:#1b2a3a}
  .rv-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
  .rv-btns button{min-height:50px;border-radius:12px;border:0;font:800 15.5px Inter,Arial,sans-serif;cursor:pointer}
  .rv-ok{background:#117A5B;color:#fff}.rv-adj{background:#FF7A00;color:#fff}.rv-btns button:disabled{opacity:.55;cursor:wait}
  .rv-move{display:flex;justify-content:space-between;margin-top:6px}.rv-move button{border:0;background:none;color:#52667a;font:700 14px Inter,Arial,sans-serif;padding:8px 2px;cursor:pointer}
  .rv-end{padding:40px 22px;text-align:center;font:500 15px/1.6 Inter,Arial,sans-serif;color:#26384a}
  .rv-end h3{font:800 24px Montserrat,Arial,sans-serif;color:#0A2540;margin:8px 0}
  .rv-end .n{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:16px 0}.rv-end .n span{background:#f1f4f8;border-radius:12px;padding:10px 14px;font-weight:700}
  .rv-end button{margin-top:10px;min-height:48px;padding:0 22px;border-radius:12px;border:0;background:#0A2540;color:#fff;font:800 15px Inter,Arial,sans-serif;cursor:pointer}
  `;document.head.append(s)}

  const ICONS=`<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.8"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg><svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.8"><path d="M20.5 12a8.5 8.5 0 1 1-3.1-6.6L21 4l-1.1 3.9A8.4 8.4 0 0 1 20.5 12z"/></svg><svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.8"><path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7z"/></svg><svg class="bm" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.8"><path d="M6 3.5h12v17l-6-4.5-6 4.5z"/></svg>`;

  const st={list:[],i:0,filter:'',done:{},busy:false};
  function content(a){return a.content_id?(P().data.contents||[]).find(c=>c.id===a.content_id)||null:null}
  function build(){
    const aps=(P().data.approvals||[]).filter(a=>a.status==='AGUARDANDO_APROVACAO');
    const rank=s=>{const i=ORDER.indexOf(s);return i<0?99:i};
    return aps.map(a=>({a,c:content(a),s:subject(a)})).sort((x,y)=>rank(x.s)-rank(y.s)||((FORD[x.c?.format]??3)-(FORD[y.c?.format]??3))||String(x.a.title).localeCompare(String(y.a.title),'pt-BR'));
  }
  function visible(){return st.filter?st.list.filter(x=>x.s===st.filter):st.list}
  function pendingCount(){return st.list.filter(x=>!st.done[x.a.id]).length}

  function open(){
    const p=P();if(!p?.data)return;css();st.list=build();st.done={};st.filter='';st.i=0;
    if(!st.list.length){p.toast?.('Não há posts esperando sua revisão agora.');return}
    document.getElementById('rvBack')?.remove();
    const b=document.createElement('div');b.id='rvBack';b.className='rv-back';b.setAttribute('role','dialog');b.setAttribute('aria-modal','true');b.setAttribute('aria-label','Revisão de posts');
    b.innerHTML='<div class="rv-wrap"></div>';document.body.append(b);document.documentElement.style.overflow='hidden';
    try{history.pushState({rv:1},'','#revisar')}catch{}
    paint();
  }
  function close(){
    const b=document.getElementById('rvBack');if(!b)return;b.remove();document.documentElement.style.overflow='';
    if(location.hash==='#revisar')history.replaceState(null,'','#aprovacoes');
    if(Object.keys(st.done).length)P().reload?.().then(()=>{try{location.hash='#aprovacoes'}catch{}});
  }
  addEventListener('popstate',()=>{if(document.getElementById('rvBack'))close()});
  addEventListener('keydown',e=>{if(!document.getElementById('rvBack')||/TEXTAREA|INPUT/.test(document.activeElement?.tagName||''))return;if(e.key==='Escape')close();if(e.key==='ArrowRight')slide(1);if(e.key==='ArrowLeft')slide(-1)});

  function paint(){
    const w=document.querySelector('#rvBack .rv-wrap');if(!w)return;
    const vis=visible(),total=st.list.length,decided=Object.keys(st.done).length;
    const subjects=[...new Set(st.list.map(x=>x.s).filter(Boolean))];
    const chips=subjects.length>1?`<div class="rv-chips"><button type="button" class="rv-chip ${st.filter?'':'on'}" data-rv-f="">Todos (${total})</button>${subjects.map(s=>`<button type="button" class="rv-chip ${st.filter===s?'on':''}" data-rv-f="${E(s)}">${E(s)} (${st.list.filter(x=>x.s===s).length})</button>`).join('')}</div>`:'<div style="height:10px"></div>';
    const head=`<div class="rv-top"><div class="rv-top-row"><button type="button" class="rv-x" data-rv-close aria-label="Fechar">×</button><h2>Revisão de posts</h2><small>${vis.length?Math.min(st.i+1,vis.length):0} de ${vis.length}</small></div><div class="rv-bar"><i style="width:${total?Math.round(decided/total*100):0}%"></i></div>${chips}</div>`;
    if(!vis.length||st.i>=vis.length){w.innerHTML=head+endScreen();bind(w);return}
    const it=vis[st.i],a=it.a,c=it.c||{},imgs=(c.images?.instagram||[]).filter(Boolean),fmt=FMT[c.format]||a.content_type||'Post',reel=c.format==='REEL';
    const cap=String(c.caption_instagram||'').trim(),short=cap.length>140||cap.split('\n').length>2;
    const capHtml=cap?`<div class="ig-cap" id="rvCap"><b>divinoarmazembhz</b> ${E(short?cap.split('\n')[0].slice(0,120):cap)}${short?` <button type="button" class="ig-more-btn" data-rv-more>… mais</button>`:''}</div>`:'';
    const script=(c.reel_script||[]).filter(r=>r&&(r.cena||r.fala||r.texto));
    const askTxt=c.notes||ask(a);
    const d=st.done[a.id];
    const media=imgs.length?`<div class="ig-media"><div class="ig-track" id="rvTrack">${imgs.map((u,i)=>`<div class="ig-slide"><img src="${E(u)}" alt="Imagem ${i+1} de ${imgs.length}" ${i>1?'loading="lazy"':''}></div>`).join('')}</div>${imgs.length>1?`<span class="ig-count" id="rvCount">1/${imgs.length}</span><button type="button" class="ig-nav p" data-rv-s="-1" aria-label="Imagem anterior">‹</button><button type="button" class="ig-nav n" data-rv-s="1" aria-label="Próxima imagem">›</button>`:''}${reel?'<span class="ig-reel">▶ Reels · capa</span>':''}</div>`:'<div class="rv-end">Este post ainda não tem imagem.</div>';
    const dots=imgs.length>1?`<div style="position:relative;height:0"><div class="ig-dots" style="top:-2px">${imgs.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div></div>`:'';
    const decided_html=d?`<div class="rv-done-msg ${d.act==='APROVADO'?'ok':'warn'}">${d.act==='APROVADO'?'✓ Você aprovou este post':'✎ Você pediu ajuste'}${d.comment?`: “${E(d.comment)}”`:'.'}</div>`:'';
    const act=d?`<div class="rv-act"><div class="rv-move"><button type="button" data-rv-go="-1">‹ Voltar</button><button type="button" data-rv-go="1">Próximo ›</button></div></div>`:
      `<div class="rv-act"><textarea id="rvComment" placeholder="Quer mudar algo? Escreva aqui (palavra, foto, legenda…)" aria-label="Seu comentário"></textarea><div class="rv-btns"><button type="button" class="rv-ok" data-rv-act="APROVADO">✓ Aprovar</button><button type="button" class="rv-adj" data-rv-act="AJUSTE_SOLICITADO">✎ Pedir ajuste</button></div><div class="rv-move"><button type="button" data-rv-go="-1" ${st.i?'':'disabled style="visibility:hidden"'}>‹ Voltar</button><button type="button" data-rv-go="1">Pular ›</button></div></div>`;
    w.innerHTML=head+`<div class="rv-tag">${E([it.s,fmt].filter(Boolean).join(' · '))}</div>${decided_html}<div class="ig-head"><span class="ig-av">D</span><div><b>divinoarmazembhz</b><span>${E(a.title)}</span></div><span class="ig-more">···</span></div>${media}<div class="ig-icons">${ICONS}</div>${dots}${capHtml}${script.length?`<details class="rv-script"><summary>Roteiro do vídeo</summary>${script.map(r=>`<div style="margin-top:6px"><b>${E(r.tempo||'')}</b> ${E(r.texto||r.cena||'')}${r.fala&&r.fala!=='Gancho'&&r.fala!=='Fecho'?` <i>“${E(r.fala)}”</i>`:''}</div>`).join('')}</details>`:''}${askTxt?`<div class="rv-ask"><b>Me confirma:</b>${E(askTxt)}</div>`:''}<div style="height:14px"></div>`+act;
    w.scrollTop=0;document.getElementById('rvBack').scrollTop=0;
    bind(w,it,imgs.length);
  }
  function endScreen(){
    const vals=Object.values(st.done),ok=vals.filter(v=>v.act==='APROVADO').length,adj=vals.length-ok,left=pendingCount();
    return `<div class="rv-end"><div style="font-size:40px">${left?'👏':'🎉'}</div><h3>${left?(st.filter?'Fim deste assunto':'Você chegou ao fim'):'Tudo revisado!'}</h3><p>${left?`Ainda ${left===1?'falta 1 post':'faltam '+left+' posts'} para revisar${st.filter?' nos outros assuntos':''}.`:'Obrigada! A Yasmin já recebe suas respostas.'}</p><div class="n"><span>✓ ${ok} aprovado${ok===1?'':'s'}</span><span>✎ ${adj} com ajuste</span></div>${left?`<button type="button" data-rv-next>Continuar revisando</button><br>`:''}<button type="button" data-rv-close style="background:#f1f4f8;color:#0A2540">Fechar</button></div>`;
  }
  function slide(d){const t=document.getElementById('rvTrack');if(t)t.scrollBy({left:d*t.clientWidth,behavior:'smooth'})}
  function bind(w,it,n){
    w.querySelectorAll('[data-rv-close]').forEach(x=>x.onclick=close);
    w.querySelectorAll('[data-rv-f]').forEach(x=>x.onclick=()=>{st.filter=x.dataset.rvF;const vis=visible();const k=vis.findIndex(v=>!st.done[v.a.id]);st.i=k<0?vis.length:k;paint()});
    w.querySelectorAll('[data-rv-go]').forEach(x=>x.onclick=()=>{st.i=Math.max(0,st.i+Number(x.dataset.rvGo));paint()});
    w.querySelector('[data-rv-next]')?.addEventListener('click',()=>{st.filter='';const k=st.list.findIndex(v=>!st.done[v.a.id]);st.i=k<0?st.list.length:k;paint()});
    w.querySelectorAll('[data-rv-s]').forEach(x=>x.onclick=()=>slide(Number(x.dataset.rvS)));
    w.querySelector('[data-rv-more]')?.addEventListener('click',()=>{const c=it?.c?.caption_instagram||'';document.getElementById('rvCap').innerHTML=`<b>divinoarmazembhz</b> ${E(c)}`});
    const t=document.getElementById('rvTrack');
    if(t&&n>1){const dots=[...w.querySelectorAll('.ig-dots i')],cnt=document.getElementById('rvCount');t.addEventListener('scroll',()=>{const i=Math.round(t.scrollLeft/Math.max(1,t.clientWidth));dots.forEach((d,j)=>d.classList.toggle('on',i===j));if(cnt)cnt.textContent=(i+1)+'/'+n},{passive:true})}
    w.querySelectorAll('[data-rv-act]').forEach(x=>x.onclick=()=>decide(it,x.dataset.rvAct));
  }
  async function decide(it,act){
    if(st.busy)return;const p=P();const comment=(document.getElementById('rvComment')?.value||'').trim();
    if(act==='AJUSTE_SOLICITADO'&&!comment){p.toast?.('Escreva o que você quer mudar e toque em Pedir ajuste.',true);document.getElementById('rvComment')?.focus();return}
    st.busy=true;document.querySelectorAll('.rv-btns button').forEach(b=>b.disabled=true);
    try{
      await p.api('POST',{action:'APPROVAL_ACTION',approval_id:it.a.id,approval_action:act,comment});
      st.done[it.a.id]={act,comment};it.a.status=act;
      p.toast?.(act==='APROVADO'?'Aprovado ✓':'Ajuste enviado para a Yasmin.');
      const vis=visible();let k=vis.findIndex((v,j)=>j>st.i&&!st.done[v.a.id]);if(k<0)k=vis.findIndex(v=>!st.done[v.a.id]);st.i=k<0?vis.length:k;
      setTimeout(paint,250);
    }catch(e){p.toast?.(e.message||'Não foi possível salvar. Tente de novo.',true);document.querySelectorAll('.rv-btns button').forEach(b=>b.disabled=false)}
    finally{st.busy=false}
  }

  /* Faixa no topo das Aprovações e no Início */
  function hero(){
    const p=P();if(!p?.data)return '';const n=(p.data.approvals||[]).filter(a=>a.status==='AGUARDANDO_APROVACAO').length;if(!n)return '';css();
    return `<div class="cp-rv-hero"><div><b>${n===1?'1 post esperando você':n+' posts esperando você'}</b><span>Veja um por vez, do jeito que vai sair no Instagram, e aprove ou peça ajuste.</span></div><button type="button" data-review-start>Revisar post a post</button></div>`;
  }
  document.addEventListener('click',e=>{if(e.target.closest('[data-review-start]')){e.preventDefault();open()}});
  window.CentralYMReview={open,hero};
  if(location.hash==='#revisar'){const t=setInterval(()=>{if(P()?.data){clearInterval(t);open()}},300);setTimeout(()=>clearInterval(t),15000)}
})();

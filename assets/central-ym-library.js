/* Central YM · Biblioteca de conteúdos (26/11/2026)
   A YM vê os conteúdos do jeito que o cliente vê: por assunto, em grade como o perfil do Instagram,
   e cada post aberto igual ao Instagram. Sem datas. Arquivados não aparecem.
   Situação: Para ajustar · Com o cliente · Liberado para postar · Publicado.
   Fonte: função central-ym-inbox (LIBRARY; enquanto a função não tiver LIBRARY, carrega peça a peça com POST).
   Expõe window.CentralYMLibrary.mount(el,{clientId?,approvals?}). */
(()=>{
  if(window.CentralYMLibrary)return;
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast=(m,e)=>window.YM?.toast?.(m,e);
  const ORDER=['A Vivian','Medalhas e premiados','Quem faz','Tem no Divino','Corte da Jurada','A Jurada responde','Par perfeito','A mesa e presentes','Como pedir e onde fica'];
  const ST={AJUSTE_SOLICITADO:['Para ajustar','adj'],AGUARDANDO_APROVACAO:['Com o cliente','wait'],APROVADO:['Liberado para postar','ok'],PUBLICADO:['Publicado','pub'],EM_PRODUCAO:['Em produção','prod']};
  const FILTERS=[['','Todos'],['AJUSTE_SOLICITADO','Para ajustar'],['AGUARDANDO_APROVACAO','Com o cliente'],['APROVADO','Liberados'],['PUBLICADO','Publicados']];
  const FMT={CARROSSEL:'Carrossel',ESTATICO:'Post',REEL:'Reels',STORIES:'Stories'};
  const ACT={APROVADO:'Aprovou',AJUSTE_SOLICITADO:'Pediu ajuste',COMENTARIO:'Comentou'};
  const subject=p=>(String(p.description||'').match(/^Assunto:\s*([^.]+)\./)||[])[1]||'Outros';
  const ask=p=>p.client_notes||String(p.description||'').replace(/^Assunto:\s*[^.]+\.\s*/,'').trim();
  const fmtOf=p=>FMT[p.format]||String(p.content_type||'Post').split(' · ')[0];
  const when=v=>{try{return v?new Date(v).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):''}catch{return ''}};

  async function api(action,extra={}){
    for(let attempt=0;attempt<2;attempt++){
      const s=await YM.requireSession('/CENTRAL');if(!s)throw new Error('Sessão necessária.');
      const r=await fetch(YM.SUPABASE_URL+'/functions/v1/central-ym-inbox',{method:'POST',headers:{Authorization:'Bearer '+s.access_token,apikey:YM.PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({action,...extra})});
      const j=await r.json().catch(()=>({}));
      if(r.status===401&&attempt===0){try{await YM.sb.auth.refreshSession()}catch{}continue}
      if(!r.ok||!j.ok){const e=new Error(j.detail||j.error||'Não foi possível carregar.');e.code=j.error;throw e}
      return j;
    }
  }
  async function adminApi(body){const s=await YM.requireSession('/CENTRAL');const r=await fetch(YM.SUPABASE_URL+'/functions/v1/central-ym-admin',{method:'POST',headers:{Authorization:'Bearer '+s.access_token,apikey:YM.PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw new Error(j.detail||j.error||'Falha');return j}

  function css(){if(document.getElementById('cylCss'))return;const s=document.createElement('style');s.id='cylCss';s.textContent=`
  .cyl{background:#fff;border:1px solid #dce5f0;border-radius:16px;padding:16px;margin-bottom:16px}
  .cyl h2{margin:0;font:800 19px Montserrat,Arial,sans-serif;color:#0A2540}.cyl>p{margin:4px 0 12px;font:500 13.5px/1.5 Inter,Arial,sans-serif;color:#5d7186}
  .cyl-chips{display:flex;gap:6px;overflow-x:auto;padding:2px 0 8px;scrollbar-width:none}.cyl-chips::-webkit-scrollbar{display:none}
  .cyl-chip{flex:0 0 auto;border:1px solid #dce5f0;background:#fff;border-radius:999px;padding:8px 13px;font:700 13px Inter,Arial,sans-serif;color:#33475b;cursor:pointer;white-space:nowrap}
  .cyl-chip.on{background:#0A2540;border-color:#0A2540;color:#fff}.cyl-chip.adj:not(.on){border-color:#FFD2AE;color:#B54700}.cyl-chip.ok:not(.on){border-color:#BFE6CD;color:#117A5B}
  .cyl-chip b{font-weight:800}
  .cyl-h{margin:16px 0 8px;font:800 12px Inter,Arial,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:#7a5a37}
  .cyl-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3px}@media(min-width:900px){.cyl-grid{grid-template-columns:repeat(5,1fr);gap:6px}}
  .cyl-t{position:relative;aspect-ratio:4/5;border:0;padding:0;background:#eef2f6;cursor:pointer;overflow:hidden;border-radius:4px}
  .cyl-t img{width:100%;height:100%;object-fit:cover;display:block}
  .cyl-t .nm{position:absolute;inset:auto 0 0 0;padding:16px 6px 5px;background:linear-gradient(transparent,rgba(0,0,0,.62));color:#fff;font:700 11px/1.25 Inter,Arial,sans-serif;text-align:left}
  .cyl-t .ph{display:flex;align-items:center;justify-content:center;height:100%;padding:8px;font:700 12px Inter,Arial,sans-serif;color:#52667a;text-align:center}
  .cyl-t .ic{position:absolute;top:5px;right:6px;color:#fff;font:800 12px Inter;text-shadow:0 1px 3px rgba(0,0,0,.6)}
  .cyl-dot{position:absolute;top:6px;left:6px;padding:2px 7px;border-radius:999px;font:800 10.5px Inter,Arial,sans-serif;background:#fff;color:#0A2540;box-shadow:0 1px 4px rgba(0,0,0,.2)}
  .cyl-dot.adj{background:#FF7A00;color:#fff}.cyl-dot.ok{background:#117A5B;color:#fff}.cyl-dot.pub{background:#5d7186;color:#fff}.cyl-dot.wait{background:#fff;color:#7a5a37}
  .cyl-empty{padding:26px 10px;text-align:center;font:600 14px Inter,Arial,sans-serif;color:#5d7186}
  .cyl-back{position:fixed;inset:0;z-index:10050;background:#e9edf2;overflow:auto;-webkit-overflow-scrolling:touch}
  .cyl-wrap{max-width:470px;margin:0 auto;min-height:100%;background:#fff;display:flex;flex-direction:column;box-shadow:0 0 40px rgba(7,26,46,.12)}
  .cyl-top{position:sticky;top:0;z-index:3;background:#fff;border-bottom:1px solid #eceff3;padding:10px 12px;display:flex;align-items:center;gap:8px}
  .cyl-top button{width:40px;height:40px;border:0;background:#f1f4f8;border-radius:999px;font-size:22px;line-height:1;cursor:pointer;color:#0A2540}
  .cyl-top h3{margin:0;flex:1;font:800 15px Montserrat,Arial,sans-serif;color:#0A2540}.cyl-top small{font:700 12.5px Inter,Arial,sans-serif;color:#5d7186}
  .cyl-ban{margin:10px 14px 0;border-radius:12px;padding:10px 12px;font:700 14px/1.45 Inter,Arial,sans-serif}
  .cyl-ban.adj{background:#FFF1E6;border:1px solid #FFD2AE;color:#8a3b00}.cyl-ban.ok{background:#EAF7EF;border:1px solid #BFE6CD;color:#0F5132}.cyl-ban.wait{background:#FFF8EC;border:1px solid #F3D9A6;color:#6b4a0c}.cyl-ban.pub{background:#f1f4f8;border:1px solid #dce5f0;color:#33475b}.cyl-ban.prod{background:#f1f4f8;border:1px solid #dce5f0;color:#33475b}
  .cyl-tag{padding:12px 14px 0;font:700 12px Inter,Arial,sans-serif;color:#7a5a37;letter-spacing:.04em;text-transform:uppercase}
  .ig-head{display:flex;align-items:center;gap:10px;padding:10px 14px}
  .ig-av{flex:0 0 34px;width:34px;height:34px;border-radius:999px;background:#C9A57A;color:#2E2C2A;display:flex;align-items:center;justify-content:center;font:700 16px/1 Georgia,serif;box-shadow:0 0 0 2px #fff,0 0 0 3.5px #d6b48a}
  .ig-head b{font:700 14px Inter,Arial,sans-serif;color:#111}.ig-head div span{display:block;font:500 12px Inter,Arial,sans-serif;color:#666}.ig-more{margin-left:auto;font:900 18px Inter;color:#111}
  .ig-media{position:relative;background:#111}.ig-track{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}.ig-track::-webkit-scrollbar{display:none}
  .ig-slide{flex:0 0 100%;scroll-snap-align:center;display:grid;place-items:center;background:#111}.ig-slide img{width:100%;height:auto;display:block;max-height:max(360px,calc(100vh - 230px));object-fit:contain}
  .ig-count,.ig-reel{position:absolute;top:12px;background:rgba(17,17,17,.7);color:#fff;font:700 12px Inter,Arial,sans-serif;border-radius:999px;padding:4px 9px}.ig-count{right:12px}.ig-reel{left:12px}
  .ig-nav{position:absolute;top:50%;transform:translateY(-50%);width:34px;height:34px;border-radius:999px;border:0;background:rgba(255,255,255,.85);font-size:20px;cursor:pointer;color:#111}.ig-nav.p{left:8px}.ig-nav.n{right:8px}
  .ig-icons{display:flex;align-items:center;gap:14px;padding:10px 14px 4px}.ig-icons svg{width:24px;height:24px}.ig-icons .bm{margin-left:auto}
  .ig-dots{display:flex;gap:4px;justify-content:center;margin-top:-18px;height:14px}.ig-dots i{width:6px;height:6px;border-radius:9px;background:#c7c7c7}.ig-dots i.on{background:#0095f6}
  .ig-cap{padding:6px 14px 4px;font:400 14px/1.45 Inter,Arial,sans-serif;color:#111;white-space:pre-wrap;word-wrap:break-word}.ig-cap b{font-weight:700}
  .cyl-box{margin:12px 14px 0;border:1px solid #e4e8ee;border-radius:12px;padding:10px 12px;font:500 14px/1.5 Inter,Arial,sans-serif;color:#26384a}
  .cyl-box summary{cursor:pointer;font-weight:800}.cyl-ask{background:#FFF6E5;border-color:#F3D9A6;color:#5b3d0a}
  .cyl-hist div{padding:7px 0;border-top:1px solid #eef2f6}.cyl-hist div:first-child{border-top:0}.cyl-hist small{display:block;color:#7b8a9a;font-size:12px}
  .cyl-act{padding:12px 14px calc(14px + env(safe-area-inset-bottom));display:grid;gap:8px}
  .cyl-act textarea{width:100%;min-height:52px;border:1px solid #d5dee8;border-radius:12px;padding:10px 12px;font:500 16px Inter,Arial,sans-serif}
  .cyl-act button{min-height:48px;border-radius:12px;border:0;font:800 15px Inter,Arial,sans-serif;cursor:pointer;background:#f1f4f8;color:#0A2540}
  .cyl-act .pri{background:#0A2540;color:#fff}.cyl-act .ok{background:#117A5B;color:#fff}
  .cyl-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .cyl-move{display:flex;justify-content:space-between}.cyl-move button{background:none;min-height:40px;color:#52667a;font-size:14px}
  `;document.head.append(s)}
  const ICONS=`<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.8"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg><svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.8"><path d="M20.5 12a8.5 8.5 0 1 1-3.1-6.6L21 4l-1.1 3.9A8.4 8.4 0 0 1 20.5 12z"/></svg><svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.8"><path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7z"/></svg><svg class="bm" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.8"><path d="M6 3.5h12v17l-6-4.5-6 4.5z"/></svg>`;

  /* ---------- carregamento ---------- */
  const cache=new Map(),states=new Map();// clientKey -> dados e filtros escolhidos
  async function load(key,opts,onProgress){
    const c={posts:[],canRespond:false,loading:true};cache.set(key,c);
    try{const j=await api('LIBRARY',opts.clientId?{client_id:opts.clientId}:{});c.posts=j.posts||[];c.canRespond=true;c.loading=false;onProgress();return}
    catch(e){if(e.code!=='unsupported_action'){c.loading=false;c.error=e.message;onProgress();return}}
    /* função ainda sem LIBRARY: lista as peças pela ficha do cliente e busca cada uma */
    try{
      let aps=opts.approvals;
      if(!aps){const ov=await adminApi({action:'LIST_CLIENTS'});const ids=(ov.clients||[]).filter(x=>x.pending_approvals>0||x.id===opts.clientId).map(x=>x.id);aps=[];for(const id of ids){const d=await adminApi({action:'GET_CLIENT_PORTAL',client_id:id});aps.push(...(d.data?.approvals||[]))}}
      aps=aps.filter(a=>a.status!=='CANCELADO'&&a.visible_to_client!==false);
      c.posts=aps.map(a=>({approval_id:a.id,client_id:a.client_id,title:a.title,content_type:a.content_type,description:a.description,status:a.status,images:[],history:[],_pending:true}));onProgress();
      let i=0;const worker=async()=>{while(i<c.posts.length){const k=i++;try{const j=await api('POST',{approval_id:c.posts[k].approval_id});c.posts[k]=j.post}catch{}if(k%6===5)onProgress()}};
      await Promise.all([1,2,3,4,5,6].map(worker));
    }catch(e){c.error=e.message}
    c.loading=false;onProgress();
  }

  /* ---------- grade ---------- */
  function mount(el,opts={}){
    if(!el)return;css();const key=opts.clientId||'all';
    const st=states.get(key)||{f:opts.filter||'',s:'',client:''};states.set(key,st);
    const paint=()=>{const c=cache.get(key);el.innerHTML=html(c,st,opts);bindGrid(el,c,st,opts,paint)};
    if(!cache.has(key)||opts.reload)load(key,opts,paint);
    paint();
  }
  function visibleList(c,st){
    let l=(c?.posts||[]);if(st.client)l=l.filter(p=>p.client_id===st.client);if(st.f)l=l.filter(p=>p.status===st.f);if(st.s)l=l.filter(p=>subject(p)===st.s);
    const r=s=>{const i=ORDER.indexOf(s);return i<0?99:i};const so={AJUSTE_SOLICITADO:0,APROVADO:1,AGUARDANDO_APROVACAO:2,EM_PRODUCAO:3,PUBLICADO:4};
    return [...l].sort((a,b)=>r(subject(a))-r(subject(b))||(so[a.status]??5)-(so[b.status]??5)||String(a.title).localeCompare(String(b.title),'pt-BR'));
  }
  function html(c,st,opts){
    const head=`<h2>Biblioteca de conteúdos</h2><p>Do jeito que ${opts.clientId?'o cliente vê':'os clientes veem'} na Área do Cliente. Toque num post para abrir como no Instagram.</p>`;
    if(!c||(c.loading&&!c.posts.length))return `<section class="cyl">${head}<div class="cyl-empty">Carregando os conteúdos…</div></section>`;
    if(c.error&&!c.posts.length)return `<section class="cyl">${head}<div class="cyl-empty">${E(c.error)}</div></section>`;
    let base=c.posts;const clients=[...new Map(base.map(p=>[p.client_id,p.client_name||'Cliente'])).entries()];
    const clientChips=!opts.clientId&&clients.length>1?`<div class="cyl-chips">${[['','Todos os clientes'],...clients].map(([id,n])=>`<button type="button" class="cyl-chip ${st.client===id?'on':''}" data-cyl-c="${E(id)}">${E(n)}</button>`).join('')}</div>`:'';
    if(st.client)base=base.filter(p=>p.client_id===st.client);
    const cnt=s=>base.filter(p=>!s||p.status===s).length;
    const fchips=`<div class="cyl-chips">${FILTERS.filter(([s])=>!s||cnt(s)).map(([s,l])=>`<button type="button" class="cyl-chip ${st.f===s?'on':''} ${ST[s]?.[1]||''}" data-cyl-f="${s}">${l} <b>${cnt(s)}</b></button>`).join('')}</div>`;
    const inF=base.filter(p=>!st.f||p.status===st.f);
    const subs=[...new Set(inF.map(subject))].sort((a,b)=>(ORDER.indexOf(a)<0?99:ORDER.indexOf(a))-(ORDER.indexOf(b)<0?99:ORDER.indexOf(b)));
    const schips=subs.length>1?`<div class="cyl-chips">${[['','Todos os assuntos'],...subs.map(s=>[s,s])].map(([s,l])=>`<button type="button" class="cyl-chip ${st.s===s?'on':''}" data-cyl-s="${E(s)}">${E(l)}${s?` <b>${inF.filter(p=>subject(p)===s).length}</b>`:''}</button>`).join('')}</div>`:'';
    const list=visibleList(c,st);
    let body='';const groups=new Map();for(const p of list){const k=subject(p);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p)}
    for(const [k,ps] of groups)body+=`<div class="cyl-h">${E(k)} · ${ps.length}</div><div class="cyl-grid">${ps.map(p=>{const s=ST[p.status]||[p.status,'wait'];const im=(p.images||[])[0];return `<button type="button" class="cyl-t" data-cyl-open="${E(p.approval_id)}" aria-label="${E(p.title)}">${im?.url?`<img src="${E(im.url)}" alt="" loading="lazy">`:`<span class="ph">${p._pending?'Carregando…':E(p.title)}</span>`}${p.status==='AGUARDANDO_APROVACAO'?'':`<span class="cyl-dot ${s[1]}">${E(s[0])}</span>`}${(p.images||[]).length>1?'<span class="ic">❐</span>':p.format==='REEL'?'<span class="ic">▶</span>':''}<span class="nm">${E(p.title)}</span></button>`}).join('')}</div>`;
    return `<section class="cyl">${head}${clientChips}${fchips}${schips}${body||'<div class="cyl-empty">Nada neste filtro.</div>'}${c.loading?'<div class="cyl-empty">Carregando as imagens…</div>':''}</section>`;
  }
  function bindGrid(el,c,st,opts,paint){
    el.querySelectorAll('[data-cyl-f]').forEach(b=>b.onclick=()=>{st.f=b.dataset.cylF;st.s='';paint()});
    el.querySelectorAll('[data-cyl-s]').forEach(b=>b.onclick=()=>{st.s=b.dataset.cylS;paint()});
    el.querySelectorAll('[data-cyl-c]').forEach(b=>b.onclick=()=>{st.client=b.dataset.cylC;paint()});
    el.querySelectorAll('[data-cyl-open]').forEach(b=>b.onclick=()=>{const list=visibleList(c,st);const i=list.findIndex(p=>p.approval_id===b.dataset.cylOpen);openViewer(list,i<0?0:i,c,()=>paint())});
  }

  /* ---------- post aberto (igual ao Instagram) ---------- */
  const vw={list:[],i:0,c:null,after:null};
  function openViewer(list,i,c,after){
    vw.list=list;vw.i=i;vw.c=c;vw.after=after;
    document.getElementById('cylBack')?.remove();const b=document.createElement('div');b.id='cylBack';b.className='cyl-back';b.setAttribute('role','dialog');b.setAttribute('aria-modal','true');b.innerHTML='<div class="cyl-wrap"></div>';document.body.append(b);document.documentElement.style.overflow='hidden';
    try{history.pushState({cyl:1},'','#post')}catch{}
    paintViewer();
    if(vw.list[vw.i]?._pending)refreshOne(vw.list[vw.i].approval_id);
  }
  function closeViewer(){const b=document.getElementById('cylBack');if(!b)return;b.remove();document.documentElement.style.overflow='';if(location.hash==='#post')history.replaceState(null,'',location.pathname+location.search);vw.after?.()}
  addEventListener('popstate',()=>{if(document.getElementById('cylBack'))closeViewer()});
  addEventListener('keydown',e=>{if(!document.getElementById('cylBack')||/TEXTAREA|INPUT/.test(document.activeElement?.tagName||''))return;if(e.key==='Escape')closeViewer();if(e.key==='ArrowRight')go(1);if(e.key==='ArrowLeft')go(-1)});
  function go(d){const n=vw.i+d;if(n<0||n>=vw.list.length)return;vw.i=n;paintViewer();if(vw.list[n]?._pending)refreshOne(vw.list[n].approval_id)}
  async function refreshOne(id){try{const j=await api('POST',{approval_id:id});replace(j.post);paintViewer()}catch{}}
  function replace(p){if(!p)return;for(const arr of [vw.list,vw.c?.posts||[]]){const k=arr.findIndex(x=>x.approval_id===p.approval_id);if(k>=0)arr[k]=p}}
  function banner(p){
    const lastC=(p.history||[]).find(h=>h.actor_type==='CLIENTE');
    if(p.status==='AJUSTE_SOLICITADO')return ['adj',`✎ O cliente pediu ajuste${lastC?.comment?`: “${lastC.comment}”`:'.'}`];
    if(p.status==='APROVADO')return ['ok',`✓ Aprovado pelo cliente${lastC?' em '+when(lastC.created_at):''}. Liberado para postar.`];
    if(p.status==='PUBLICADO')return ['pub','Publicado.'];
    if(p.status==='EM_PRODUCAO')return ['prod','Em produção: o cliente ainda não vê.'];
    return ['wait','Com o cliente: esperando a aprovação.'];
  }
  function paintViewer(){
    const w=document.querySelector('#cylBack .cyl-wrap');if(!w)return;const p=vw.list[vw.i];if(!p)return closeViewer();
    const imgs=(p.images||[]).filter(x=>x?.url),reel=p.format==='REEL'||/reels/i.test(p.content_type||''),cap=String(p.caption||'').trim();
    const tags=(p.hashtags||[]).filter(t=>t&&!cap.includes(t));const fullCap=cap+(tags.length?(cap?'\n\n':'')+tags.join(' '):'');
    const script=(p.reel_script||[]).filter(r=>r&&(r.cena||r.fala||r.texto));const bn=banner(p);const q=ask(p);
    const hist=(p.history||[]);
    w.innerHTML=`<div class="cyl-top"><button type="button" data-cyl-x aria-label="Fechar">×</button><h3>${E(p.client_name||'')}</h3><small>${vw.i+1} de ${vw.list.length}</small></div>
      <div class="cyl-ban ${bn[0]}">${E(bn[1])}</div>
      <div class="cyl-tag">${E([subject(p),fmtOf(p)].join(' · '))}</div>
      <div class="ig-head"><span class="ig-av">${E((p.client_name||'D').trim()[0]||'D')}</span><div><b>${E(p.client_name==='Divino Armazém'?'divinoarmazembhz':(p.client_name||''))}</b><span>${E(p.title)}</span></div><span class="ig-more">···</span></div>
      ${imgs.length?`<div class="ig-media"><div class="ig-track" id="cylTrack">${imgs.map((im,i)=>`<div class="ig-slide"><img src="${E(im.url)}" alt="Imagem ${i+1} de ${imgs.length}"></div>`).join('')}</div>${imgs.length>1?`<span class="ig-count" id="cylCount">1/${imgs.length}</span><button type="button" class="ig-nav p" data-cyl-s="-1" aria-label="Imagem anterior">‹</button><button type="button" class="ig-nav n" data-cyl-s="1" aria-label="Próxima imagem">›</button>`:''}${reel?'<span class="ig-reel">▶ Reels · capa</span>':''}</div>`:`<div class="cyl-empty">${p._pending?'Carregando a arte…':'Sem imagem.'}</div>`}
      <div class="ig-icons">${ICONS}</div>${imgs.length>1?`<div class="ig-dots">${imgs.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>`:''}
      ${fullCap?`<div class="ig-cap"><b>${E(p.client_name==='Divino Armazém'?'divinoarmazembhz':'')}</b> ${E(fullCap)}</div>`:''}
      ${script.length?`<details class="cyl-box" open><summary>Roteiro do vídeo</summary>${script.map(r=>`<div style="margin-top:6px"><b>${E(r.tempo||'')}</b> ${E(r.texto||r.cena||'')}${r.fala&&!/^(Gancho|Fecho)$/.test(r.fala)?` <i>“${E(r.fala)}”</i>`:''}</div>`).join('')}</details>`:''}
      ${q?`<div class="cyl-box cyl-ask"><b>Pergunta para o cliente:</b> ${E(q)}</div>`:''}
      ${hist.length?`<div class="cyl-box cyl-hist"><b>Conversa com o cliente</b>${hist.map(h=>`<div><b>${E(h.actor_type==='CLIENTE'?'Cliente · '+(ACT[h.action]||h.action):'YM · '+(ACT[h.action]||h.action).replace('Comentou','Respondeu'))}</b>${h.comment?` “${E(h.comment)}”`:''}<small>${E(when(h.created_at))}${h.version_number?` · versão ${E(h.version_number)}`:''}</small></div>`).join('')}</div>`:''}
      <div class="cyl-act">
        ${vw.c?.canRespond?`<textarea id="cylReply" placeholder="Responder ao cliente (aparece na Área do Cliente)"></textarea><button type="button" class="pri" data-cyl-reply>Enviar resposta</button>`:''}
        ${p.status==='APROVADO'?`<div class="cyl-2">${imgs.length?`<button type="button" data-cyl-dl>⬇ Baixar ${imgs.length>1?'imagens':'imagem'}</button>`:''}${fullCap?'<button type="button" data-cyl-copy>📋 Copiar legenda</button>':''}</div><button type="button" class="ok" data-cyl-pub>✓ Marcar como publicado</button>`:''}
        <div class="cyl-move"><button type="button" data-cyl-go="-1" ${vw.i?'':'style="visibility:hidden"'}>‹ Anterior</button><button type="button" data-cyl-go="1" ${vw.i<vw.list.length-1?'':'style="visibility:hidden"'}>Próximo ›</button></div>
      </div>`;
    document.getElementById('cylBack').scrollTop=0;
    w.querySelector('[data-cyl-x]').onclick=closeViewer;
    w.querySelectorAll('[data-cyl-go]').forEach(b=>b.onclick=()=>go(Number(b.dataset.cylGo)));
    const t=w.querySelector('#cylTrack');w.querySelectorAll('[data-cyl-s]').forEach(b=>b.onclick=()=>t?.scrollBy({left:Number(b.dataset.cylS)*t.clientWidth,behavior:'smooth'}));
    if(t&&imgs.length>1){const dots=[...w.querySelectorAll('.ig-dots i')],cnt=w.querySelector('#cylCount');t.addEventListener('scroll',()=>{const i=Math.round(t.scrollLeft/Math.max(1,t.clientWidth));dots.forEach((d,j)=>d.classList.toggle('on',i===j));if(cnt)cnt.textContent=(i+1)+'/'+imgs.length},{passive:true})}
    w.querySelector('[data-cyl-copy]')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(fullCap);toast('Legenda copiada.')}catch{toast('Não consegui copiar. Segure o texto para copiar.',true)}});
    w.querySelector('[data-cyl-dl]')?.addEventListener('click',async e=>{const btn=e.currentTarget;btn.disabled=true;for(const [i,im] of imgs.entries()){const a=document.createElement('a');a.href=im.download_url||im.url;a.download=im.name||'';a.rel='noopener';document.body.append(a);a.click();a.remove();if(i<imgs.length-1)await new Promise(r=>setTimeout(r,900))}btn.disabled=false;toast('Imagens enviadas para Downloads, na ordem do carrossel.')});
    w.querySelector('[data-cyl-pub]')?.addEventListener('click',async e=>{const btn=e.currentTarget;btn.disabled=true;try{const j=await api('MARK_PUBLISHED',{approval_id:p.approval_id});replace(j.post);toast('Marcado como publicado.');paintViewer()}catch(err){toast(err.message,true);btn.disabled=false}});
    w.querySelector('[data-cyl-reply]')?.addEventListener('click',async e=>{const txt=(w.querySelector('#cylReply')?.value||'').trim();if(!txt){toast('Escreva a resposta.',true);return}const btn=e.currentTarget;btn.disabled=true;try{const j=await api('RESPOND',{approval_id:p.approval_id,comment:txt});replace(j.post);toast('Resposta enviada. O cliente vê na Área do Cliente.');paintViewer()}catch(err){toast(err.message,true);btn.disabled=false}});
  }

  window.CentralYMLibrary={mount,open:openViewer,invalidate:k=>cache.delete(k||'all')};
})();

/* Central YM · "Postar hoje" e visualizador de peça (12/11/2026)
   Jornada da Yasmin: abrir a Central → ver o que vai ao ar no dia → tocar na peça → ver a ARTE primeiro,
   baixar em alta qualidade, copiar a legenda e só depois as informações.
   Fonte: função central-ym-inbox (POSTS, POST, MARK_PUBLISHED), na versão que o cliente vê.
   Expõe window.CentralYMPosting = { attach(slot), open(approvalId), dashboard(slot) }. */
(()=>{
  if(window.CentralYMPosting)return;
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const TZ='America/Sao_Paulo';
  const ST={
    APROVADO:['Aprovado · pode postar','ok'],
    PUBLICADO:['Publicado','pub'],
    AGUARDANDO_APROVACAO:['Aguardando a cliente · não postar','wait'],
    AJUSTE_SOLICITADO:['Ajuste pendente · não postar','warn'],
    EM_PRODUCAO:['Em produção','wait'],
    CANCELADO:['Cancelado','wait']
  };
  const ACT={APROVADO:'Aprovou',AJUSTE_SOLICITADO:'Pediu ajuste',COMENTARIO:'Comentou',ENVIADO:'Enviado'};
  const dayKey=d=>new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
  const today=()=>dayKey(new Date());
  const addDays=(k,n)=>{const d=new Date(k+'T12:00:00-03:00');d.setDate(d.getDate()+n);return dayKey(d)};
  const dayLabel=k=>{const d=new Date(k+'T12:00:00-03:00');const t=today();const rel=k===t?'Hoje':k===addDays(t,1)?'Amanhã':k===addDays(t,-1)?'Ontem':'';const s=d.toLocaleDateString('pt-BR',{timeZone:TZ,weekday:'long',day:'2-digit',month:'2-digit'});return rel?`${rel} · ${s}`:s.replace(/^./,c=>c.toUpperCase())};
  const chipLabel=k=>{const d=new Date(k+'T12:00:00-03:00');return {w:d.toLocaleDateString('pt-BR',{timeZone:TZ,weekday:'short'}).replace('.',''),n:d.toLocaleDateString('pt-BR',{timeZone:TZ,day:'2-digit'})}};
  const when=v=>{try{return v?new Date(v).toLocaleString('pt-BR',{timeZone:TZ,day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):''}catch{return ''}};
  const pubDate=v=>{try{return v?new Date(v).toLocaleDateString('pt-BR',{timeZone:TZ,weekday:'short',day:'2-digit',month:'2-digit'}):''}catch{return ''}};
  const toast=(m,e)=>window.YM?.toast?.(m,e);

  /* ---------- API (renova sessão vencida e tenta de novo uma vez) ---------- */
  async function api(action,extra={}){
    for(let attempt=0;attempt<2;attempt++){
      const s=await YM.requireSession('/CENTRAL');if(!s)throw new Error('Sessão necessária.');
      const r=await fetch(YM.SUPABASE_URL+'/functions/v1/central-ym-inbox',{method:'POST',headers:{Authorization:'Bearer '+s.access_token,apikey:YM.PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({action,...extra})});
      const j=await r.json().catch(()=>({}));
      if(r.status===401&&attempt===0){try{await YM.sb.auth.refreshSession()}catch{}continue}
      if(!r.ok||!j.ok)throw new Error(j.detail||(j.error==='invalid_session'?'Sua sessão expirou. Entre de novo na Central.':j.error)||'Não foi possível carregar as peças.');
      return j;
    }
  }

  /* ---------- Estilos ---------- */
  function styles(){if(document.getElementById('cypStyles'))return;const s=document.createElement('style');s.id='cypStyles';s.textContent=`
  .cyp-panel{background:#fff;border:1px solid #dce5f0;border-radius:16px;padding:14px;margin:0 0 16px}
  .cyp-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
  .cyp-top h2{margin:0;font:800 18px Montserrat,Arial,sans-serif;color:#0A2540}
  .cyp-top small{display:block;font:600 13px Inter,Arial,sans-serif;color:#5d7186;margin-top:2px}
  .cyp-nav{display:flex;gap:6px}
  .cyp-nav button{min-width:42px;height:42px;border-radius:12px;border:1px solid #dce5f0;background:#fff;color:#0A2540;font:800 16px Inter,Arial,sans-serif;cursor:pointer;padding:0 10px}
  .cyp-nav button.today{font-size:13px}
  .cyp-days{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin:0 0 12px}
  .cyp-day{border:1px solid #dce5f0;background:#fff;border-radius:12px;padding:6px 0 6px;text-align:center;cursor:pointer;color:#52667a;min-height:62px;display:flex;flex-direction:column;align-items:center;gap:1px}
  .cyp-day b{display:block;font:800 16px Montserrat,Arial,sans-serif;color:#0A2540}
  .cyp-day span{font:700 10.5px Inter,Arial,sans-serif;text-transform:uppercase;letter-spacing:.03em}
  .cyp-day i{min-width:18px;height:16px;padding:0 4px;border-radius:999px;background:#0066FF;color:#fff;font:800 10px/16px Inter,Arial,sans-serif;font-style:normal}.cyp-day.on i{background:#fff;color:#0A2540}.cyp-day i.z{visibility:hidden}
  .cyp-day.on{background:#0A2540;border-color:#0A2540}.cyp-day.on b,.cyp-day.on span{color:#fff}
  .cyp-day.is-today:not(.on){border-color:#0066FF}
  .cyp-list{display:grid;gap:10px}
  .cyp-card{display:grid;grid-template-columns:96px 1fr;gap:12px;align-items:center;width:100%;text-align:left;background:#fff;border:1px solid #dce5f0;border-left:4px solid #9aa8b7;border-radius:14px;padding:10px;cursor:pointer;font:inherit;color:inherit}
  .cyp-card.ok{border-left-color:#12A150}.cyp-card.warn{border-left-color:#E28B22}.cyp-card.pub{border-left-color:#3B6FE0}.cyp-card.wait{border-left-color:#9aa8b7}
  .cyp-thumb{width:96px;aspect-ratio:4/5;border-radius:10px;background:#EEF2F6 center/cover no-repeat;position:relative;overflow:hidden}
  .cyp-thumb em{position:absolute;right:5px;bottom:5px;background:rgba(10,37,64,.82);color:#fff;font:800 11px Inter,Arial,sans-serif;font-style:normal;border-radius:6px;padding:2px 6px}
  .cyp-card h3{margin:3px 0 4px;font:800 15.5px/1.3 Montserrat,Arial,sans-serif;color:#0A2540}
  .cyp-card .cl{font:700 12.5px Inter,Arial,sans-serif;color:#5d7186}
  .cyp-card .go{display:inline-block;margin-top:6px;font:800 13px Inter,Arial,sans-serif;color:#0066FF}
  .cyp-st{display:inline-block;font:800 10.5px Inter,Arial,sans-serif;letter-spacing:.03em;text-transform:uppercase;padding:3px 8px;border-radius:999px}
  .cyp-st.ok{background:#E3F5EA;color:#0F7A3D}.cyp-st.warn{background:#FEF0E1;color:#B54708}.cyp-st.pub{background:#E5EDFF;color:#1D4ED8}.cyp-st.wait{background:#EEF2F6;color:#52667a}
  .cyp-empty{padding:16px;border:1px dashed #cfd9e4;border-radius:12px;background:#f8fafc;color:#637487;font:500 14px Inter,Arial,sans-serif}
  .cyp-sub{margin:16px 0 8px;font:800 14px Montserrat,Arial,sans-serif;color:#B54708}
  .cyp-dash{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px;padding:13px 15px;border-radius:14px;background:#EAF7EF;border:1px solid #A7DDBB;color:#0F5132}
  .cyp-dash .ym-btn{white-space:nowrap;flex:0 0 auto}.cyp-dash b{font:800 14px Montserrat,Arial,sans-serif}.cyp-dash span{display:block;font-size:12.5px;margin-top:2px}
  /* visualizador */
  .cyp-back{position:fixed;inset:0;z-index:700;background:rgba(4,22,38,.72);display:flex;align-items:stretch;justify-content:center}
  .cyp-view{width:min(760px,100%);background:#F5F8FC;display:flex;flex-direction:column;max-height:100%;overflow:hidden}
  @media(min-width:761px){.cyp-back{align-items:center;padding:20px}.cyp-view{border-radius:18px;max-height:94vh}}
  .cyp-vhead{display:flex;align-items:center;gap:10px;background:#0A2540;color:#fff;padding:12px 14px;padding-top:max(12px,env(safe-area-inset-top))}
  .cyp-vhead div{flex:1;min-width:0}.cyp-vhead small{display:block;font:600 12px Inter,Arial,sans-serif;opacity:.8}
  .cyp-vhead h2{margin:1px 0 0;font:800 16px/1.25 Montserrat,Arial,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cyp-vhead button{flex:0 0 42px;height:42px;border:0;border-radius:12px;background:rgba(255,255,255,.14);color:#fff;font-size:22px;cursor:pointer}
  .cyp-vbody{overflow:auto;-webkit-overflow-scrolling:touch;padding:12px 12px 28px}
  .cyp-banner{border-radius:12px;padding:10px 12px;font:700 13.5px/1.4 Inter,Arial,sans-serif;margin-bottom:10px}
  .cyp-banner.ok{background:#E3F5EA;color:#0F5132}.cyp-banner.warn{background:#FEF0E1;color:#7A3E00}.cyp-banner.pub{background:#E5EDFF;color:#1D3A8A}.cyp-banner.wait{background:#EEF2F6;color:#33475b}
  .cyp-art{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding-bottom:4px}
  .cyp-slide{flex:0 0 100%;scroll-snap-align:center;margin:0}
  .cyp-slide .im{background:#1b2633;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:200px}
  .cyp-slide img{display:block;width:100%;height:auto;max-height:56vh;object-fit:contain}
  .cyp-slide figcaption{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:7px;font:700 13px Inter,Arial,sans-serif;color:#52667a}
  .cyp-slide figcaption a{font:800 13px Inter,Arial,sans-serif;color:#0066FF;text-decoration:none;padding:8px 10px;border:1px solid #cfe0f7;border-radius:10px;background:#fff}
  .cyp-dots{display:flex;justify-content:center;gap:6px;margin:8px 0 2px}.cyp-dots i{width:7px;height:7px;border-radius:50%;background:#c4d0dd}.cyp-dots i.on{background:#0A2540}
  .cyp-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0 4px}
  .cyp-btns .ym-btn,.cyp-btns button{min-height:46px;font-size:14.5px}
  .cyp-btns .full{grid-column:1/-1}
  .cyp-box{background:#fff;border:1px solid #dce5f0;border-radius:14px;padding:12px 13px;margin-top:12px}
  .cyp-box h3{margin:0 0 8px;font:800 14px Montserrat,Arial,sans-serif;color:#0A2540;display:flex;align-items:center;justify-content:space-between;gap:8px}
  .cyp-cap{white-space:pre-wrap;overflow-wrap:anywhere;font:500 15px/1.55 Inter,Arial,sans-serif;color:#17324a}
  .cyp-note{background:#FFF6EA;border:1px solid #F5C58A;color:#7A3E00;border-radius:12px;padding:10px 12px;font:600 14px/1.5 Inter,Arial,sans-serif;margin-top:12px;white-space:pre-wrap}
  .cyp-kv{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;font:500 14px/1.45 Inter,Arial,sans-serif;color:#17324a}
  .cyp-kv dt{font-weight:800;color:#5d7186}.cyp-kv dd{margin:0}
  .cyp-hist{display:grid;gap:8px}.cyp-hist div{font:500 13.5px/1.45 Inter,Arial,sans-serif;color:#17324a;padding:8px 10px;border-radius:10px;background:#F5F8FC}
  .cyp-hist b{color:#0A2540}.cyp-hist small{display:block;color:#6b7c91;font-size:12px}
  .cyp-script{width:100%;border-collapse:collapse;font:500 13px/1.4 Inter,Arial,sans-serif}.cyp-script td{border-top:1px solid #e6edf3;padding:6px 4px;vertical-align:top}
  .cyp-rows{display:grid;gap:8px}
  .cyp-row{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;text-align:left;background:#fff;border:1px solid #dce5f0;border-radius:12px;padding:12px;cursor:pointer;font:inherit}
  .cyp-row b{display:block;font:800 14.5px/1.3 Montserrat,Arial,sans-serif;color:#0A2540}.cyp-row small{display:block;margin-top:3px;font:600 12.5px Inter,Arial,sans-serif;color:#5d7186}
  .cyp-row:after{content:'›';font:800 22px Inter,Arial,sans-serif;color:#9aa8b7;margin-left:4px}
  .cyp-more{margin-top:12px;background:#fff;border:1px solid #dce5f0;border-radius:12px;padding:0 12px}
  .cyp-more summary{cursor:pointer;padding:13px 0;font:800 13.5px Inter,Arial,sans-serif;color:#52667a}
  .cyp-more[open]{padding-bottom:12px}
  .cyp-loading{padding:40px 16px;text-align:center;color:#5d7186;font:600 14px Inter,Arial,sans-serif}
  `;document.head.append(s)}

  /* ---------- Postar hoje ---------- */
  const st={day:today(),from:null,to:null,posts:[],overdue:[],loading:false,error:''};
  let panel=null;
  function ensurePanel(){if(panel)return panel;styles();panel=document.createElement('section');panel.id='cypPanel';panel.className='cyp-panel';return panel}
  function inRange(k){return st.from&&k>=st.from&&k<st.to}
  async function loadRange(k){
    st.from=k;st.to=addDays(k,7);st.loading=true;st.error='';renderPanel();
    try{const j=await api('POSTS',{from:st.from+'T00:00:00-03:00',to:st.to+'T00:00:00-03:00'});st.posts=j.posts||[];st.overdue=j.overdue||[];}
    catch(e){st.error=e.message;st.posts=[];st.overdue=[]}
    finally{st.loading=false;renderPanel();renderDash()}
  }
  function postsOn(k){return st.posts.filter(p=>p.scheduled_at&&dayKey(new Date(p.scheduled_at))===k)}
  function card(p){
    const s=ST[p.status]||[p.status,'wait'];const im=(p.images||[])[0];
    return `<button type="button" class="cyp-card ${s[1]}" data-cyp-open="${E(p.approval_id)}">
      <span class="cyp-thumb" style="${im?.url?`background-image:url('${E(im.url)}')`:''}">${(p.images||[]).length>1?`<em>1/${p.images.length}</em>`:''}</span>
      <span><span class="cyp-st ${s[1]}">${E(s[0])}</span><h3>${E(p.title)}</h3><span class="cl">${E(p.client_name)} · ${E(p.content_type||'Conteúdo')}</span><br><span class="go">Abrir arte e legenda →</span></span></button>`;
  }
  function renderPanel(){
    if(!panel)return;const k=st.day;const list=postsOn(k);
    const days=st.from?[...Array(7)].map((_,i)=>addDays(st.from,i)):[];
    panel.innerHTML=`<div class="cyp-top"><div><h2>Postar</h2><small>${E(dayLabel(k))}</small></div>
      <div class="cyp-nav"><button type="button" data-cyp-step="-1" aria-label="Dia anterior">‹</button>${k!==today()?'<button type="button" class="today" data-cyp-today>Hoje</button>':''}<button type="button" data-cyp-step="1" aria-label="Próximo dia">›</button></div></div>
      ${days.length?`<div class="cyp-days">${days.map(d=>{const c=chipLabel(d),n=postsOn(d).length;return `<button type="button" class="cyp-day ${d===k?'on':''} ${d===today()?'is-today':''}" data-cyp-day="${d}"><span>${E(c.w)}</span><b>${E(c.n)}</b><i class="${n?'':'z'}">${n||0}</i></button>`}).join('')}</div>`:''}
      ${st.loading?'<div class="cyp-empty">Carregando as peças…</div>':st.error?`<div class="cyp-empty">${E(st.error)} <button type="button" class="ym-btn secondary" data-cyp-retry style="margin-top:8px">Tentar de novo</button></div>`:
        list.length?`<div class="cyp-list">${list.map(card).join('')}</div>`:'<div class="cyp-empty">Nada programado para este dia.</div>'}
      ${!st.loading&&st.overdue.length&&k===today()?`<div class="cyp-sub">Aprovados de dias anteriores, ainda não marcados como publicados</div><div class="cyp-list">${st.overdue.map(card).join('')}</div>`:''}`;
  }
  function go(k){st.day=k;if(inRange(k))renderPanel();else loadRange(k)}
  function attach(slot){if(!slot)return;const p=ensurePanel();slot.replaceWith(p);if(!st.from&&!st.loading)loadRange(st.day);else renderPanel()}
  function refresh(){if(st.from)loadRange(st.from)}

  /* resumo na Visão geral */
  function renderDash(){
    const dash=document.getElementById('caView_dashboard');if(!dash)return;
    let el=document.getElementById('cypDash');if(!el){el=document.createElement('div');el.id='cypDash';const after=document.getElementById('cyiBanner');after?after.after(el):dash.prepend(el)}
    const t=postsOn(today()),ready=t.filter(p=>p.status==='APROVADO'),late=st.overdue.length;
    if(!(st.from&&inRange(today()))||(!t.length&&!late)){el.hidden=true;return}
    el.hidden=false;el.className='cyp-dash';
    el.innerHTML=`<div><b>📲 Postar hoje: ${ready.length} peça(s) pronta(s)</b><span>${E([...new Set(t.map(p=>p.client_name))].join(', '))}${t.length>ready.length?` · ${t.length-ready.length} ainda sem aprovação`:''}${late?` · ${late} atrasada(s)`:''}</span></div><button class="ym-btn" type="button">Ver peças</button>`;
    el.querySelector('button').onclick=()=>{st.day=today();document.getElementById('cyiTab')?.click()};
  }

  /* ---------- Visualizador ---------- */
  let current=null;
  function viewer(){document.getElementById('cypView')?.remove();styles();const b=document.createElement('div');b.id='cypView';b.className='cyp-back';b.innerHTML=`<section class="cyp-view" role="dialog" aria-modal="true"><header class="cyp-vhead"><div><small>Carregando…</small><h2>Peça</h2></div><button type="button" data-cyp-close aria-label="Fechar">×</button></header><div class="cyp-vbody"><div class="cyp-loading">Carregando a arte…</div></div></section>`;document.body.append(b);document.documentElement.style.overflow='hidden';
    const close=()=>{b.remove();document.documentElement.style.overflow='';if(location.hash==='#peca')history.back()};
    b.querySelector('[data-cyp-close]').onclick=close;b.addEventListener('click',e=>{if(e.target===b)close()});
    try{history.pushState({cyp:1},'','#peca')}catch{}
    return b}
  addEventListener('popstate',()=>{const v=document.getElementById('cypView');if(v){v.remove();document.documentElement.style.overflow=''}});
  async function open(id){
    const known=[...st.posts,...st.overdue].find(p=>p.approval_id===id);
    const b=viewer();
    if(known)renderViewer(b,known);
    try{const j=await api('POST',{approval_id:id});if(document.body.contains(b))renderViewer(b,j.post)}
    catch(e){if(!known&&document.body.contains(b))b.querySelector('.cyp-vbody').innerHTML=`<div class="cyp-loading">${E(e.message)}</div>`}
  }
  function bannerFor(p){
    const last=(p.history||[]).find(h=>h.actor_type==='CLIENTE');
    if(p.status==='APROVADO')return ['ok',`✓ Aprovado pela cliente${last&&last.action==='APROVADO'?' em '+when(last.created_at):''}${p.version_number?` (versão ${p.version_number})`:''}. Pode postar.`];
    if(p.status==='PUBLICADO')return ['pub','Já marcada como publicada.'];
    if(p.status==='AJUSTE_SOLICITADO')return ['warn',`Não postar: a cliente pediu ajuste${last?.comment?` — “${last.comment}”`:''}.`];
    if(p.status==='AGUARDANDO_APROVACAO')return ['wait','Não postar ainda: aguardando a aprovação da cliente.'];
    return ['wait',ST[p.status]?.[0]||p.status];
  }
  function fullCaption(p){const cap=String(p.caption||'').trim();const tags=(p.hashtags||[]).filter(t=>t&&!cap.includes(t));return cap+(tags.length?(cap?'\n\n':'')+tags.join(' '):'')}
  function renderViewer(b,p){
    current=p;const imgs=p.images||[];const s=ST[p.status]||[p.status,'wait'];const bn=bannerFor(p);const cap=fullCaption(p);
    b.querySelector('.cyp-vhead div').innerHTML=`<small>${E(p.client_name)} · ${E(p.content_type||'Conteúdo')} · ${E(pubDate(p.scheduled_at))}</small><h2>${E(p.title)}</h2>`;
    const script=(p.reel_script||[]).filter(r=>r&&(r.cena||r.fala||r.texto));
    b.querySelector('.cyp-vbody').innerHTML=`
      <div class="cyp-banner ${bn[0]}">${E(bn[1])}</div>
      ${imgs.length?`<div class="cyp-art" id="cypArt">${imgs.map((im,i)=>`<figure class="cyp-slide"><div class="im">${im.url?`<img src="${E(im.url)}" alt="Imagem ${i+1}" loading="${i<2?'eager':'lazy'}">`:'<div class="cyp-loading" style="color:#fff">Imagem indisponível</div>'}</div><figcaption><span>Imagem ${i+1} de ${imgs.length}</span>${im.download_url?`<a href="${E(im.download_url)}" download="${E(im.name)}" rel="noopener">⬇ Baixar</a>`:''}</figcaption></figure>`).join('')}</div>${imgs.length>1?`<div class="cyp-dots">${imgs.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>`:''}`:'<div class="cyp-empty">Esta peça não tem imagem cadastrada (ex.: Reels ainda em roteiro).</div>'}
      <div class="cyp-btns">
        ${imgs.length?`<button type="button" class="ym-btn" data-cyp-dlall>⬇ Baixar ${imgs.length>1?`todas (${imgs.length})`:'imagem'}</button>`:''}
        ${cap?`<button type="button" class="ym-btn ${imgs.length?'secondary':''}" data-cyp-copy>📋 Copiar legenda</button>`:''}
        ${imgs.length&&navigator.canShare?'<button type="button" class="ym-btn secondary full" data-cyp-share>Enviar para o Instagram / galeria</button>':''}
      </div>
      ${p.client_notes?`<div class="cyp-note"><b>Antes de postar:</b> ${E(p.client_notes)}</div>`:''}
      <div class="cyp-box"><h3>Legenda ${cap?'<button type="button" class="ym-btn secondary" data-cyp-copy style="min-height:36px;padding:6px 12px;font-size:13px">Copiar</button>':''}</h3>${cap?`<div class="cyp-cap">${E(cap)}</div>`:'<div class="cyp-cap" style="color:#6b7c91">Sem legenda (normal em stories e destaques).</div>'}</div>
      ${script.length?`<div class="cyp-box"><h3>Roteiro do Reels</h3><table class="cyp-script">${script.map(r=>`<tr><td><b>${E(r.tempo||'')}</b></td><td>${E(r.cena||'')}${r.fala?`<br><i>“${E(r.fala)}”</i>`:''}${r.texto?`<br><b>Tela:</b> ${E(r.texto)}`:''}</td></tr>`).join('')}</table></div>`:''}
      <div class="cyp-box"><h3>Informações</h3><dl class="cyp-kv">
        <dt>Situação</dt><dd><span class="cyp-st ${s[1]}">${E(s[0])}</span></dd>
        <dt>Cliente</dt><dd>${E(p.client_name)}</dd>
        <dt>Formato</dt><dd>${E(p.content_type||'—')}</dd>
        <dt>Publicação</dt><dd>${E(pubDate(p.scheduled_at)||'—')}</dd>
        <dt>Versão</dt><dd>${p.version_number?`${E(p.version_number)}${p.version_count>1?` (de ${E(p.version_count)} enviadas)`:''}`:'—'}</dd>
        ${p.change_summary?`<dt>O que mudou</dt><dd>${E(p.change_summary)}</dd>`:''}
        ${p.hook?`<dt>Gancho</dt><dd>${E(p.hook)}</dd>`:''}
        ${p.cta_text?`<dt>Chamada</dt><dd>${E(p.cta_text)}</dd>`:''}
        ${p.recording_notes?`<dt>Gravação</dt><dd>${E(p.recording_notes)}</dd>`:''}
        ${p.description?`<dt>Orientação</dt><dd>${E(p.description)}</dd>`:''}
      </dl></div>
      ${(p.history||[]).length?`<div class="cyp-box"><h3>Histórico com a cliente</h3><div class="cyp-hist">${p.history.map(h=>`<div><b>${E(h.actor_type==='CLIENTE'?(ACT[h.action]||h.action):'YM · '+(ACT[h.action]||h.action))}</b>${h.version_number?` · versão ${E(h.version_number)}`:''}<small>${E(when(h.created_at))}</small>${h.comment?`“${E(h.comment)}”`:''}</div>`).join('')}</div></div>`:''}
      <div class="cyp-btns">
        ${p.status==='APROVADO'?'<button type="button" class="ym-btn full" data-cyp-published>✓ Marcar como publicado</button>':''}
        <button type="button" class="ym-btn secondary full" data-cyp-client="${E(p.client_id)}">Abrir ficha do cliente</button>
      </div>`;
    bindViewer(b,p);
  }
  function bindViewer(b,p){
    const art=b.querySelector('#cypArt'),dots=[...b.querySelectorAll('.cyp-dots i')];
    if(art&&dots.length)art.addEventListener('scroll',()=>{const i=Math.round(art.scrollLeft/Math.max(1,art.clientWidth));dots.forEach((d,j)=>d.classList.toggle('on',i===j))},{passive:true});
    b.querySelectorAll('[data-cyp-copy]').forEach(x=>x.onclick=async()=>{const t=fullCaption(p);try{await navigator.clipboard.writeText(t);toast('Legenda copiada. É só colar no Instagram.')}catch{const ta=document.createElement('textarea');ta.value=t;document.body.append(ta);ta.select();try{document.execCommand('copy');toast('Legenda copiada.')}catch{toast('Não consegui copiar. Segure o texto da legenda para copiar.',true)}ta.remove()}});
    b.querySelector('[data-cyp-dlall]')?.addEventListener('click',async e=>{const btn=e.currentTarget;btn.disabled=true;const list=(p.images||[]).filter(i=>i.download_url);for(const [i,im] of list.entries()){const a=document.createElement('a');a.href=im.download_url;a.download=im.name;a.rel='noopener';document.body.append(a);a.click();a.remove();if(i<list.length-1)await new Promise(r=>setTimeout(r,900))}btn.disabled=false;toast(list.length>1?`${list.length} imagens enviadas para Downloads (na ordem de postagem). Se o navegador perguntar, permita vários downloads.`:'Imagem enviada para Downloads.')});
    b.querySelector('[data-cyp-share]')?.addEventListener('click',async e=>{const btn=e.currentTarget;btn.disabled=true;const old=btn.textContent;btn.textContent='Preparando as imagens…';try{const files=[];for(const im of p.images||[]){if(!im.url)continue;const r=await fetch(im.url);const bl=await r.blob();files.push(new File([bl],im.name,{type:bl.type||'image/jpeg'}))}if(!files.length)throw new Error('Sem imagens');if(!navigator.canShare({files}))throw new Error('Este navegador não compartilha imagens. Use “Baixar”.');await navigator.share({files,title:p.title})}catch(err){if(err?.name!=='AbortError')toast(err.message||'Não foi possível compartilhar. Use “Baixar”.',true)}finally{btn.disabled=false;btn.textContent=old}});
    b.querySelector('[data-cyp-published]')?.addEventListener('click',async e=>{const btn=e.currentTarget;btn.disabled=true;btn.textContent='Marcando…';try{const j=await api('MARK_PUBLISHED',{approval_id:p.approval_id});toast('Peça marcada como publicada.');if(j.post)renderViewer(b,j.post);refresh()}catch(err){toast(err.message,true);btn.disabled=false;btn.textContent='✓ Marcar como publicado'}});
    b.querySelector('[data-cyp-client]')?.addEventListener('click',async e=>{const id=e.currentTarget.dataset.cypClient;b.remove();document.documentElement.style.overflow='';if(window.CentralYMConsole?.openClient)await CentralYMConsole.openClient(id,'aprovacoes');else location.assign('/CENTRAL/?client='+encodeURIComponent(id))});
  }

  /* ---------- Cliques em qualquer lugar da Central ---------- */
  document.addEventListener('click',e=>{
    const o=e.target.closest('[data-cyp-open]');if(o){e.preventDefault();open(o.dataset.cypOpen);return}
    const d=e.target.closest('[data-cyp-day]');if(d){go(d.dataset.cypDay);return}
    const s=e.target.closest('[data-cyp-step]');if(s){go(addDays(st.day,+s.dataset.cypStep));return}
    if(e.target.closest('[data-cyp-today]')){go(today());return}
    if(e.target.closest('[data-cyp-retry]')){loadRange(st.day);return}
    if(e.target?.id==='refreshAdmin')setTimeout(refresh,400);
  });

  window.CentralYMPosting={attach,open,refresh,go};
  /* carrega o resumo do dia na Visão geral assim que a Central abre */
  let tries=0;(function boot(){if(window.YM?.requireSession&&document.getElementById('caView_dashboard')){styles();if(!st.from)loadRange(st.day)}else if(tries++<40)setTimeout(boot,200)})();
})();

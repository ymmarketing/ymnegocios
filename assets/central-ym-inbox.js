/* Central YM · sino e aba "Aprovações" com as respostas dos clientes (11/11/2026)
   Fonte: tabela central_ym_inbox (preenchida por gatilho quando o cliente aprova, pede ajuste ou comenta
   na Área do Cliente), lida pela função central-ym-inbox. Funciona igual no desktop e no celular. */
(()=>{
  if(window.__centralYmInbox)return;window.__centralYmInbox=true;
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const KIND={APROVADO:['Aprovado','ok'],AJUSTE_SOLICITADO:['Pediu ajuste','warn'],COMENTARIO:['Comentário','info']};
  const STATUS={AGUARDANDO_APROVACAO:'Aguardando aprovação',AJUSTE_SOLICITADO:'Ajuste pendente',APROVADO:'Aprovado',PUBLICADO:'Publicado',EM_PRODUCAO:'Em produção',CANCELADO:'Cancelado'};
  let data={unread:0,items:[],revisions:[],metrics:{clients:[],items:[]}},filter='unread',busy=false;
  const when=v=>{try{return new Date(v).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch{return ''}};
  const pubDay=v=>{try{return v?new Date(v).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'}):''}catch{return ''}};

  function styles(){if(document.getElementById('cyiStyles'))return;const s=document.createElement('style');s.id='cyiStyles';s.textContent=`
  .cyi-bell{position:relative;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;border:1px solid #dce5f0;background:#fff;color:#0A2540;cursor:pointer;margin-right:8px;flex:0 0 40px}
  .cyi-bell svg{width:20px;height:20px}
  .ym-topbar-meta.cyi-meta-row{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;gap:6px}
  .ym-topbar-meta.cyi-meta-row .cyi-bell{margin-right:0}
  .cyi-bell.has{border-color:#E28B22;background:#FFF6EA}
  .cyi-dot{position:absolute;top:-6px;right:-6px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#D92D20;color:#fff;font:800 11px/20px Inter,Arial,sans-serif;text-align:center;box-shadow:0 0 0 2px #fff}
  .cyi-tabcount{display:inline-block;min-width:18px;margin-left:6px;padding:1px 6px;border-radius:999px;background:#D92D20;color:#fff;font-size:10px;font-weight:800;line-height:16px}
  .cyi-banner{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px;padding:13px 15px;border-radius:14px;background:#FFF6EA;border:1px solid #F5C58A;color:#7A3E00}
  .cyi-banner b{font-size:14px}.cyi-banner span{display:block;font-size:12px;margin-top:2px;color:#9A5B00}
  .cyi-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px}
  .cyi-head h2{margin:0;font:800 18px Montserrat,Arial,sans-serif;color:#0A2540}
  .cyi-head p{margin:3px 0 0;color:#5d7186;font-size:12px}
  .cyi-filters{display:flex;gap:6px;flex-wrap:wrap}
  .cyi-filters button{border:1px solid #dce5f0;background:#fff;color:#52667a;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:800;cursor:pointer;min-height:38px}
  .cyi-filters button.on{background:#0A2540;border-color:#0A2540;color:#fff}
  .cyi-list{display:grid;gap:10px}
  .cyi-card{background:#fff;border:1px solid #dce5f0;border-left:4px solid #9aa8b7;border-radius:13px;padding:13px 14px}
  .cyi-card.ok{border-left-color:#12A150}.cyi-card.warn{border-left-color:#E28B22}.cyi-card.info{border-left-color:#3B6FE0}
  .cyi-card.new{box-shadow:0 0 0 2px rgba(226,139,34,.18)}
  .cyi-top{display:flex;align-items:center;gap:7px;flex-wrap:wrap;font-size:11px;color:#6b7c91}
  .cyi-kind{font-weight:800;font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;padding:3px 8px;border-radius:999px}
  .cyi-kind.ok{background:#E3F5EA;color:#0F7A3D}.cyi-kind.warn{background:#FEF0E1;color:#B54708}.cyi-kind.info{background:#E5EDFF;color:#1D4ED8}
  .cyi-new{font-weight:800;color:#D92D20}
  .cyi-card h3{margin:7px 0 2px;font:800 15px Montserrat,Arial,sans-serif;color:#0A2540;line-height:1.3}
  .cyi-meta{font-size:12px;color:#5d7186}
  .cyi-msg{margin-top:9px;padding:10px 12px;border-radius:10px;background:#F5F8FC;color:#17324a;font-size:14px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}
  .cyi-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
  .cyi-actions .ym-btn{min-height:40px}
  .cyi-empty{padding:18px;border:1px dashed #cfd9e4;border-radius:12px;background:#f8fafc;color:#637487;font-size:13px}
  .cyi-sec{margin:18px 0 10px;font:800 14px Montserrat,Arial,sans-serif;color:#0A2540;display:flex;align-items:center;gap:8px}
  .cyi-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:0 0 6px}
  .cyi-metric{background:#fff;border:1px solid #dce5f0;border-radius:12px;padding:11px 12px}
  .cyi-metric b{display:block;font:800 20px Montserrat,Arial,sans-serif;color:#0A2540}
  .cyi-metric span{font-size:12px;color:#5d7186;line-height:1.35}
  .cyi-mnote{font-size:12px;color:#5d7186;margin:2px 0 4px}
  .cyi-rev{background:#fff;border:1px solid #cfe0f7;border-left:4px solid #0066FF;border-radius:13px;padding:13px 14px;margin-bottom:10px}
  .cyi-rev h3{margin:6px 0 2px;font:800 15px Montserrat,Arial,sans-serif;color:#0A2540}
  .cyi-req{margin-top:9px;padding:9px 11px;border-radius:10px;background:#FFF6EA;color:#7A3E00;font-size:13px;line-height:1.45;white-space:pre-wrap}
  .cyi-chg{margin-top:8px;padding:9px 11px;border-radius:10px;background:#EAF7EF;color:#0F5132;font-size:13px;line-height:1.45}
  .cyi-pairs{display:grid;gap:10px;margin-top:10px}
  .cyi-pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .cyi-pair figure{margin:0}.cyi-pair img{width:100%;border-radius:8px;border:1px solid #dce5f0;display:block;background:#f2f5f8;aspect-ratio:4/5;object-fit:cover}
  .cyi-pair figcaption{font-size:11px;font-weight:800;margin-bottom:4px;color:#6b7c91}.cyi-pair figure.new figcaption{color:#0F7A3D}
  .cyi-cap{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
  .cyi-cap div{font-size:12.5px;line-height:1.45;white-space:pre-wrap;background:#F5F8FC;border-radius:10px;padding:9px 10px;color:#17324a;max-height:220px;overflow:auto}
  .cyi-cap small{display:block;font-weight:800;color:#6b7c91;margin-bottom:4px}
  @media(max-width:760px){.cyi-cap{grid-template-columns:1fr}}
  @media(max-width:760px){.ym-topbar-meta.cyi-meta-row .ym-chip.stage{display:none}.cyi-banner{flex-direction:column;align-items:stretch}.cyi-banner .ym-btn,.cyi-actions .ym-btn{width:100%}.cyi-head{align-items:flex-start;flex-direction:column}.cyi-msg{font-size:15px}}
  `;document.head.append(s)}

  async function api(action='LIST',extra={}){
    const s=await YM.requireSession('/CENTRAL');if(!s)throw new Error('Sessão necessária.');
    const r=await fetch(YM.SUPABASE_URL+'/functions/v1/central-ym-inbox',{method:'POST',headers:{Authorization:'Bearer '+s.access_token,apikey:YM.PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({action,...extra})});
    const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw new Error(j.detail||j.error||'Não foi possível carregar as respostas dos clientes.');return j;
  }

  function mount(){
    styles();
    const top=document.querySelector('.ym-topbar');
    if(top&&!document.getElementById('cyiBell')){let meta=top.querySelector('.ym-topbar-meta');if(!meta){meta=document.createElement('div');meta.className='ym-topbar-meta';[...top.children].filter(x=>x.classList?.contains('ym-chip')).forEach(x=>meta.append(x));top.append(meta)}
      const b=document.createElement('button');b.id='cyiBell';b.type='button';b.className='cyi-bell';b.setAttribute('aria-label','Respostas dos clientes');b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg><span class="cyi-dot" hidden></span>';b.onclick=()=>open();meta.prepend(b);meta.classList.add('cyi-meta-row')}
    const nav=document.querySelector('.ca-subnav');
    if(nav&&!document.getElementById('cyiTab')){const t=document.createElement('button');t.id='cyiTab';t.type='button';t.innerHTML='Aprovações<span class="cyi-tabcount" hidden></span>';t.onclick=()=>open();const dash=nav.querySelector('[data-ca-view="dashboard"]');dash?dash.after(t):nav.prepend(t);
      nav.addEventListener('click',e=>{const btn=e.target.closest('button');if(btn&&btn!==t)hideView()});
      document.querySelectorAll('[data-go]').forEach(x=>x.addEventListener('click',hideView));}
    const main=document.querySelector('.ym-content');
    if(main&&!document.getElementById('caView_approvals')){const sec=document.createElement('section');sec.id='caView_approvals';sec.className='ca-view';main.append(sec)}
    const dash=document.getElementById('caView_dashboard');
    if(dash&&!document.getElementById('cyiBanner')){const bn=document.createElement('div');bn.id='cyiBanner';bn.hidden=true;dash.prepend(bn)}
  }
  function hideView(){document.getElementById('caView_approvals')?.classList.remove('on');document.getElementById('cyiTab')?.classList.remove('on')}
  const onCentral=()=>!!document.querySelector('.ca-subnav');
  function open(){
    if(!onCentral()){location.assign('/CENTRAL/?view=aprovacoes');return}
    mount();
    document.querySelectorAll('.ca-view').forEach(v=>v.classList.remove('on'));
    document.querySelectorAll('.ca-subnav button').forEach(b=>b.classList.remove('on'));
    document.getElementById('caView_approvals')?.classList.add('on');document.getElementById('cyiTab')?.classList.add('on');
    if(innerWidth<=760)document.getElementById('ymSidebar')?.classList.remove('open');
    render();setTimeout(()=>document.getElementById('caView_approvals')?.scrollIntoView({behavior:'smooth',block:'start'}),60);load();
  }

  function badges(){
    const n=data.unread||0;
    const dot=document.querySelector('#cyiBell .cyi-dot'),bell=document.getElementById('cyiBell'),tc=document.querySelector('#cyiTab .cyi-tabcount'),bn=document.getElementById('cyiBanner');
    if(dot){dot.hidden=!n;dot.textContent=n>99?'99+':String(n)}bell?.classList.toggle('has',!!n);
    if(tc){tc.hidden=!n;tc.textContent=String(n)}
    const side=document.querySelector('#ymSidebar a[href="/CENTRAL"]');if(side){let sd=side.querySelector('.cyi-tabcount');if(!sd){sd=document.createElement('span');sd.className='cyi-tabcount';side.append(sd)}sd.hidden=!n;sd.textContent=String(n)}
    const nd=(data.revisions||[]).length;if(bn){if(n||nd){const ajustes=(data.items||[]).filter(x=>!x.read_at&&x.kind==='AJUSTE_SOLICITADO').length,ok=(data.items||[]).filter(x=>!x.read_at&&x.kind==='APROVADO').length;const clients=[...new Set((data.items||[]).filter(x=>!x.read_at).map(x=>x.client_name))];bn.hidden=false;bn.className='cyi-banner';bn.innerHTML=`<div><b>🔔 ${n?`${n} resposta(s) nova(s) de cliente`:''}${n&&nd?' · ':''}${nd?`${nd} versão(ões) pronta(s) para enviar`:''}</b><span>${E(clients.join(', '))}${ajustes?` · ${ajustes} pedido(s) de ajuste`:''}${ok?` · ${ok} aprovado(s)`:''}</span></div><button class="ym-btn" type="button">Ver respostas</button>`;bn.querySelector('button').onclick=()=>open()}else bn.hidden=true}
    document.title=(n?`(${n}) `:'')+document.title.replace(/^\(\d+\) /,'');
    try{if(navigator.setAppBadge){n?navigator.setAppBadge(n):navigator.clearAppBadge?.()}}catch{}
  }

  function render(){
    const root=document.getElementById('caView_approvals');if(!root)return;
    const items=(data.items||[]).filter(x=>filter==='all'||(filter==='unread'?!x.read_at:x.kind===filter));
    root.innerHTML=`<div class="cyi-head"><div><h2>Aprovações dos clientes</h2><p>Tudo o que os clientes aprovaram, pediram de ajuste ou comentaram na Área do Cliente.</p></div>${data.unread?'<button class="ym-btn secondary" type="button" id="cyiAll">Marcar todas como vistas</button>':''}</div>
      ${metricsHtml()}${revisionsHtml()}<div class="cyi-sec">Respostas dos clientes</div>
      <div class="cyi-filters" style="margin-bottom:12px">${[['unread',`Novas (${data.unread||0})`],['AJUSTE_SOLICITADO','Ajustes'],['APROVADO','Aprovados'],['all','Todas']].map(f=>`<button type="button" data-f="${f[0]}" class="${filter===f[0]?'on':''}">${f[1]}</button>`).join('')}</div>
      <div class="cyi-list">${items.length?items.map(card).join(''):`<div class="cyi-empty">${filter==='unread'?'Nenhuma resposta nova. Tudo visto por aqui.':'Nenhuma resposta neste filtro.'}</div>`}</div>`;
    root.querySelectorAll('[data-send]').forEach(b=>b.onclick=()=>{const r=(data.revisions||[]).find(x=>x.version_id===b.dataset.send);if(!r)return;if(!confirm(`Enviar a versão ${r.version_number} de "${r.title}" para ${r.client_name}?\n\nA versão ${r.previous_version||1} continua guardada no histórico.`))return;b.disabled=true;act('SEND_REVISION',{version_id:r.version_id}).then(()=>YM.toast?.('Nova versão enviada. O cliente já vê o que mudou.'))});
    root.querySelectorAll('[data-discard]').forEach(b=>b.onclick=()=>{if(!confirm('Descartar este rascunho? O cliente nunca viu esta versão.'))return;act('DISCARD_REVISION',{version_id:b.dataset.discard})});
    root.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{filter=b.dataset.f;render()});
    root.querySelector('#cyiAll')?.addEventListener('click',()=>act('MARK_ALL_READ'));
    root.querySelectorAll('[data-read]').forEach(b=>b.onclick=()=>act('MARK_READ',{id:b.dataset.read}));
    root.querySelectorAll('[data-client]').forEach(b=>b.onclick=async()=>{const it=(data.items||[]).find(x=>x.id===b.dataset.id);if(it&&!it.read_at)act('MARK_READ',{id:it.id});if(window.CentralYMConsole?.openClient)await CentralYMConsole.openClient(b.dataset.client,'aprovacoes');else location.assign('/CENTRAL/?client='+encodeURIComponent(b.dataset.client))});
  }
  function metricsHtml(){
    const cs=(data.metrics?.clients||[]).filter(c=>Number(c.items_reviewed)>0);if(!cs.length)return '';
    return `<div class="cyi-sec">Ajustes por cliente</div>`+cs.map(c=>`<div class="cyi-mnote"><b style="color:#0A2540">${E(c.client_name)}</b> · conteúdos que já passaram pelo cliente</div><div class="cyi-metrics">
      <div class="cyi-metric"><b>${E(c.items_reviewed)}</b><span>enviados para aprovação</span></div>
      <div class="cyi-metric"><b>${E(c.first_version_rate_pct??0)}%</b><span>aprovados de primeira (${E(c.approved_first_version)})</span></div>
      <div class="cyi-metric"><b>${E(c.items_with_adjustments)}</b><span>com pedido de ajuste</span></div>
      <div class="cyi-metric"><b>${E(c.adjustment_requests)}</b><span>rodadas de ajuste no total</span></div>
      <div class="cyi-metric"><b>${E(String(c.avg_versions??'—').replace('.',','))}</b><span>versões por conteúdo (média)</span></div></div>`).join('');
  }
  function revisionsHtml(){
    const rs=data.revisions||[];if(!rs.length)return '';
    return `<div class="cyi-sec">Novas versões prontas para enviar <span class="cyi-tabcount">${rs.length}</span></div>`+rs.map(r=>{
      const b=r.before||{},a=r.after||{},n=Math.max((b.images||[]).length,(a.images||[]).length),pairs=[];let same=0;
      for(let i=0;i<n;i++){if((b.images||[])[i]===(a.images||[])[i]){same++;continue}pairs.push(`<div class="cyi-pair"><figure><figcaption>Imagem ${i+1} · versão ${E(r.previous_version||1)}</figcaption>${b.urls?.[i]?`<img src="${E(b.urls[i])}" alt="" loading="lazy">`:'<div class="cyi-empty">Sem imagem</div>'}</figure><figure class="new"><figcaption>Imagem ${i+1} · versão ${E(r.version_number)}</figcaption>${a.urls?.[i]?`<img src="${E(a.urls[i])}" alt="" loading="lazy">`:'<div class="cyi-empty">Removida</div>'}</figure></div>`)}
      const capChanged=(b.caption||'')!==(a.caption||'');
      return `<article class="cyi-rev"><div class="cyi-top"><span class="cyi-kind info">Versão ${E(r.version_number)} · rascunho</span><b style="color:#0A2540">${E(r.client_name)}</b>${r.scheduled_at?`<span>· publicação ${E(pubDay(r.scheduled_at))}</span>`:''}</div>
      <h3>${E(r.title)}</h3><div class="cyi-meta">O cliente ainda não vê esta versão. A versão ${E(r.previous_version||1)} fica guardada.</div>
      ${r.request?.comment?`<div class="cyi-req"><b>Pedido do cliente:</b> ${E(r.request.comment)}</div>`:''}
      ${r.change_summary?`<div class="cyi-chg"><b>O que mudou:</b> ${E(r.change_summary)}</div>`:''}
      ${pairs.length?`<div class="cyi-pairs">${pairs.join('')}</div>`:''}${same&&pairs.length?`<div class="cyi-meta" style="margin-top:6px">${same} imagem(ns) sem mudança.</div>`:''}
      ${capChanged?`<div class="cyi-cap"><div><small>Legenda · versão ${E(r.previous_version||1)}</small>${E(b.caption)}</div><div><small style="color:#0F7A3D">Legenda · versão ${E(r.version_number)}</small>${E(a.caption)}</div></div>`:''}
      <div class="cyi-actions"><button class="ym-btn" type="button" data-send="${E(r.version_id)}">Enviar ao cliente</button><button class="ym-btn secondary" type="button" data-discard="${E(r.version_id)}">Descartar rascunho</button></div></article>`}).join('');
  }
  function card(x){const k=KIND[x.kind]||KIND.COMENTARIO;const pub=pubDay(x.scheduled_at);
    return `<article class="cyi-card ${k[1]} ${x.read_at?'':'new'}"><div class="cyi-top"><span class="cyi-kind ${k[1]}">${k[0]}</span><b style="color:#0A2540">${E(x.client_name)}</b><span>· ${E(when(x.created_at))}</span>${x.read_at?'':'<span class="cyi-new">● nova</span>'}${x.has_draft?'<span class="cyi-kind info">versão nova pronta</span>':''}</div>
    <h3>${E(x.title)}</h3><div class="cyi-meta">${pub?`Publicação prevista: ${E(pub)} · `:''}Situação atual: ${E(STATUS[x.item_status]||x.item_status||'—')}</div>
    ${x.message?`<div class="cyi-msg">${E(x.message)}</div>`:''}
    <div class="cyi-actions"><button class="ym-btn" type="button" data-client="${E(x.client_id)}" data-id="${E(x.id)}">Abrir no cliente</button>${x.read_at?'':`<button class="ym-btn secondary" type="button" data-read="${E(x.id)}">Marcar como vista</button>`}</div></article>`}

  async function act(action,extra){try{data=await api(action,extra);badges();render()}catch(e){YM.toast?.(e.message,true)}}
  async function load(){if(busy)return;busy=true;try{data=await api('LIST');badges();if(document.getElementById('caView_approvals')?.classList.contains('on'))render()}catch(e){console.warn('Central YM inbox',e)}finally{busy=false}}

  function boot(){
    const go=()=>{mount();load();if(new URLSearchParams(location.search).get('view')==='aprovacoes')setTimeout(open,600)};
    let tries=0;const wait=()=>{if(window.YM?.requireSession&&document.querySelector('.ym-topbar'))go();else if(tries++<40)setTimeout(wait,150)};wait();
    setInterval(()=>{if(document.visibilityState==='visible')load()},60000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')load()});
    document.addEventListener('click',e=>{if(e.target?.id==='refreshAdmin')setTimeout(load,400)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

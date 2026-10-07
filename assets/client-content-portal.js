(()=>{
  const SUPABASE_URL='https://srzdikgztpdtwbggwniz.supabase.co';
  const PUBLISHABLE_KEY='sb_publishable_OGZsWJSj2noU3Dd78pk48g__eEKE3xT';
  const sb=window.supabase.createClient(SUPABASE_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let portal=null,cursor=new Date(),mode=null;
  const filt={net:'instagram',fmt:'TODOS',st:'TODOS',q:''};
  const label={IDEIA:'Ideia',PLANEJADO:'Planejado',ROTEIRO:'Roteiro',EM_PRODUCAO:'Em produção',REVISAO:'Em revisão',APROVADO:'Aprovado',AGENDADO:'Agendado',PUBLICADO:'Publicado',ANALISADO:'Analisado'};
  const FMT={REEL:'Reels',CARROSSEL:'Carrossel',ESTATICO:'Post estático',POST_ESTATICO:'Post estático',STORIES:'Stories',VIDEO_CURTO:'Vídeo curto'};
  const NET={instagram:'Instagram',linkedin:'LinkedIn'};
  const WD=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  try{const n=localStorage.getItem('ccpNet');if(n&&NET[n])filt.net=n}catch(e){}

  function injectStyle(){if($('#ccPortalStyle'))return;const s=document.createElement('style');s.id='ccPortalStyle';s.textContent=`
  .ccp-sub{font-size:11px;line-height:1.55;color:#657b8f;max-width:760px}
  .ccp-grid{display:grid;grid-template-columns:1.4fr .6fr;gap:12px}
  .ccp-cal{background:#fff;border:1px solid #dfe7ef;border-radius:16px;overflow:hidden}
  .ccp-cal-head{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #e6edf3}
  .ccp-cal-head button{border:1px solid #dce5ee;background:#fff;color:#0A2540;border-radius:9px;width:32px;height:32px;cursor:pointer}
  .ccp-week,.ccp-days{display:grid;grid-template-columns:repeat(7,1fr)}
  .ccp-week div{padding:8px;text-align:center;background:#f4f7fa;font-size:10px;font-weight:800;color:#71869a}
  .ccp-day{min-height:106px;padding:6px;border-right:1px solid #e7edf3;border-bottom:1px solid #e7edf3}
  .ccp-day.other{background:#fbfcfd}
  .ccp-num{font:800 10px Montserrat;color:#0A2540;margin-bottom:4px}
  .ccp-event{display:block;width:100%;border:0;border-radius:6px;padding:5px 6px;margin:3px 0;text-align:left;font:700 9px/1.25 Inter;color:#fff;cursor:pointer}
  .ccp-event small{display:block;font-size:8px;font-weight:500;opacity:.86;margin-top:2px}
  .ccp-ATRACAO{background:#484DCF}.ccp-EXPLICACAO{background:#2176AE}.ccp-PROVA{background:#E56A20}.ccp-CONVERSAO{background:#238A68}
  .ccp-panel{background:#fff;border:1px solid #dfe7ef;border-radius:16px;padding:14px}
  .ccp-panel h2{font:800 14px Montserrat;color:#0A2540;margin:0 0 8px}
  .ccp-row{padding:10px 0;border-top:1px solid #e8eef3}.ccp-row:first-child{border-top:0}
  .ccp-row b{display:block;font-size:11px;color:#0A2540}.ccp-row small{display:block;font-size:10px;line-height:1.45;color:#6b7f92;margin-top:3px}
  .ccp-badge{display:inline-block;font-size:9px;font-weight:800;background:#eef3f8;color:#567086;border-radius:999px;padding:4px 7px;margin-top:5px}
  .ccp-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}
  .ccp-empty{padding:28px;text-align:center;color:#73879a;font-size:13px;border:1px dashed #ccd7e1;border-radius:12px;background:#fff}
  .ccp-strategy{background:#f5f7ff;border:1px solid #dce2ff;border-radius:12px;padding:10px 12px;margin-bottom:14px}
  .ccp-strategy b{font-size:11px;color:#0A2540}.ccp-strategy span{display:block;font-size:10px;line-height:1.45;color:#697b8d;margin-top:3px}

  .ccp-tabs{display:inline-flex;gap:4px;padding:4px;background:#E9EEF5;border-radius:12px;margin-bottom:14px}
  .ccp-tabs button{border:0;background:transparent;border-radius:9px;padding:9px 16px;font:700 13px Inter;color:#4E6377;cursor:pointer}
  .ccp-tabs button.on{background:#fff;color:#0A2540;box-shadow:0 2px 8px rgba(10,37,64,.08)}
  .ccp-tabs button span{display:inline-block;margin-left:6px;font-size:11px;font-weight:800;background:#EEF0FF;color:#454CB5;border-radius:999px;padding:2px 7px}

  .bk-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:12px}
  .bk-stat{background:#fff;border:1px solid var(--line,#DDE6EF);border-radius:14px;padding:14px 16px;border-left:4px solid var(--indigo,#484DCF)}
  .bk-stat b{display:block;font:800 24px/1 Montserrat;color:#0A2540;font-variant-numeric:tabular-nums}
  .bk-stat span{display:block;font-size:12px;color:#6D7F91;margin-top:6px}
  .bk-stat.o{border-left-color:#FF7A00}.bk-stat.g{border-left-color:#117A5B}.bk-stat.b{border-left-color:#2176AE}
  .bk-bar{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;background:#fff;border:1px solid var(--line,#DDE6EF);border-radius:14px;padding:12px 14px;margin-bottom:14px}
  .bk-group{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .bk-group>small{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#7A8CA0;margin-right:2px}
  .bk-pill{border:1px solid #DCE4EE;background:#fff;color:#33495E;border-radius:999px;padding:7px 12px;font:600 12px Inter;cursor:pointer}
  .bk-pill.on{background:#0A2540;border-color:#0A2540;color:#fff}
  .bk-search{flex:1;min-width:180px}
  .bk-search input{width:100%;border:1px solid #DCE4EE;border-radius:10px;padding:9px 12px;font-size:13px;color:#0A2540;background:#F7F9FC}
  .bk-list{display:grid;gap:12px}
  .bk-card{background:#fff;border:1px solid var(--line,#DDE6EF);border-radius:16px;box-shadow:0 10px 30px rgba(7,26,46,.06);overflow:hidden;scroll-margin-top:90px}
  .bk-card.done{opacity:.72}
  .bk-card.flash{outline:3px solid #484DCF;outline-offset:2px}
  .bk-top{display:flex;gap:14px;align-items:flex-start;padding:16px 18px 12px;flex-wrap:wrap}
  .bk-date{flex:0 0 auto;width:62px;text-align:center;background:#F3F6FA;border-radius:12px;padding:8px 0}
  .bk-date small{display:block;font-size:10px;font-weight:800;color:#6D7F91;text-transform:uppercase;letter-spacing:.08em}
  .bk-date b{display:block;font:800 22px/1.1 Montserrat;color:#0A2540}
  .bk-date i{display:block;font-style:normal;font-size:10px;color:#6D7F91}
  .bk-head{flex:1;min-width:220px}
  .bk-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px}
  .bk-tag{font-size:10.5px;font-weight:800;border-radius:999px;padding:4px 9px;background:#EEF3F8;color:#4F6880}
  .bk-tag.REEL{background:#EEF0FF;color:#3E44B8}.bk-tag.CARROSSEL{background:#FFF1E3;color:#A4510A}.bk-tag.ESTATICO{background:#E6F2FA;color:#1D628F}
  .bk-tag.cta{background:#E9F7F0;color:#0F6B4F}
  .bk-tag.ok{background:#117A5B;color:#fff}
  .bk-head h3{font:800 17px/1.25 Montserrat;color:#0A2540;margin:0;text-wrap:balance}
  .bk-head p{font-size:12.5px;color:#6D7F91;margin:4px 0 0}
  .bk-body{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:0;border-top:1px solid #EEF2F6}
  .bk-col{padding:14px 18px;min-width:0}
  .bk-col+.bk-col{border-left:1px solid #EEF2F6}
  .bk-lbl{font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#484DCF;margin:0 0 8px;display:flex;justify-content:space-between;align-items:center;gap:8px}
  .bk-strip{display:flex;gap:8px;overflow-x:auto;padding-bottom:6px;scroll-snap-type:x mandatory}
  .bk-strip button{flex:0 0 auto;width:132px;aspect-ratio:4/5;border:1px solid #E1E7EF;border-radius:10px;padding:0;overflow:hidden;cursor:zoom-in;background:#F3F6FA;scroll-snap-align:start;position:relative}
  .bk-strip img{width:100%;height:100%;object-fit:cover;display:block}
  .bk-strip button em{position:absolute;left:6px;bottom:6px;font:800 10px Inter;font-style:normal;background:rgba(10,37,64,.78);color:#fff;border-radius:6px;padding:2px 6px}
  .bk-hook{background:#FFF6EC;border:1px solid #FFE0BF;border-radius:12px;padding:10px 12px;font-size:13.5px;line-height:1.5;color:#5B3A12;margin-bottom:10px}
  .bk-hook b{display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#B45309;margin-bottom:3px}
  .bk-script{overflow-x:auto;border:1px solid #E6ECF3;border-radius:12px}
  .bk-script table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:480px}
  .bk-script th{background:#F3F6FA;color:#5F7387;font-size:10px;letter-spacing:.08em;text-transform:uppercase;text-align:left;padding:8px 10px}
  .bk-script td{padding:9px 10px;border-top:1px solid #EEF2F6;vertical-align:top;color:#20384D;line-height:1.45}
  .bk-script td:first-child{white-space:nowrap;font-weight:800;color:#0A2540;font-variant-numeric:tabular-nums}
  .bk-script td.tx{font-weight:700;color:#3E44B8}
  .bk-note{font-size:12px;line-height:1.5;color:#5F7387;background:#F7F9FC;border-radius:10px;padding:9px 11px;margin-top:10px}
  .bk-cap{white-space:pre-wrap;font-size:13px;line-height:1.6;color:#20384D;background:#F7F9FC;border:1px solid #E6ECF3;border-radius:12px;padding:12px 14px;max-height:280px;overflow:auto}
  .bk-mini{border:1px solid #DCE4EE;background:#fff;color:#0A2540;border-radius:9px;padding:6px 10px;font:700 11.5px Inter;cursor:pointer;white-space:nowrap}
  .bk-mini:hover{border-color:#484DCF;color:#3E44B8}
  .bk-foot{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;padding:12px 18px;border-top:1px solid #EEF2F6;background:#FBFCFE}
  .bk-links{display:flex;gap:8px;flex-wrap:wrap}
  .bk-done{display:inline-flex;align-items:center;gap:8px;border:1px solid #CFE3DA;background:#fff;color:#0F6B4F;border-radius:10px;padding:8px 12px;font:700 12.5px Inter;cursor:pointer}
  .bk-done.on{background:#117A5B;border-color:#117A5B;color:#fff}
  .bk-done i{width:16px;height:16px;border-radius:5px;border:2px solid currentColor;display:inline-grid;place-items:center;font-style:normal;font-size:11px;line-height:1}
  .bk-zoom{position:fixed;inset:0;z-index:400;background:rgba(7,26,46,.86);display:flex;align-items:center;justify-content:center;padding:20px}
  .bk-zoom[hidden]{display:none}
  .bk-zoom img{max-width:min(92vw,620px);max-height:84vh;border-radius:12px;box-shadow:0 30px 80px rgba(0,0,0,.4);background:#fff}
  .bk-zoom button{position:absolute;border:0;background:#fff;color:#0A2540;border-radius:999px;width:44px;height:44px;font-size:20px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25)}
  .bk-zoom .zx{top:18px;right:18px}.bk-zoom .zp{left:18px;top:50%}.bk-zoom .zn{right:18px;top:50%}
  .bk-zoom .zc{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);color:#fff;font:700 13px Inter;display:flex;gap:10px;align-items:center}
  .bk-zoom .zc a,.bk-zoom .zc button{position:static;width:auto;height:auto;border-radius:9px;padding:8px 12px;font:700 12px Inter}
  @media(max-width:1100px){.bk-body{grid-template-columns:1fr}.bk-col+.bk-col{border-left:0;border-top:1px solid #EEF2F6}}
  @media(max-width:900px){.ccp-grid{grid-template-columns:1fr}.bk-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
  @media(max-width:760px){.ccp-cal{overflow:auto}.ccp-week,.ccp-days{min-width:800px}.bk-top,.bk-col,.bk-foot{padding-left:14px;padding-right:14px}.bk-strip button{width:112px}.ccp-tabs{display:flex}.ccp-tabs button{flex:1;padding:9px 8px}}
  `;document.head.append(s)}

  async function token(){const {data:{session}}=await sb.auth.getSession();return session?.access_token||null}
  async function readPortal(){const t=await token();if(!t)return null;const r=await fetch(SUPABASE_URL+'/functions/v1/central-ym-client',{headers:{Authorization:'Bearer '+t,apikey:PUBLISHABLE_KEY,'Content-Type':'application/json'}});if(!r.ok)return null;const j=await r.json();return j.portal||null}
  async function post(body){const t=await token();const r=await fetch(SUPABASE_URL+'/functions/v1/central-ym-client',{method:'POST',headers:{Authorization:'Bearer '+t,apikey:PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok||!j.ok)throw new Error(j.error||'Falha ao salvar');return j}
  function toast(msg,err){const t=$('#cpToast');if(!t)return;t.textContent=msg;t.className='cp-toast'+(err?' err':'');t.style.display='block';clearTimeout(window.__ccpt);window.__ccpt=setTimeout(()=>t.style.display='none',3600)}

  function install(){injectStyle();if($('#view_conteudos'))return;const nav=$('.cp-nav');if(!nav)return;const ref=nav.querySelector('[data-nav="calendario"]');const b=document.createElement('button');b.dataset.nav='conteudos';b.innerHTML='<i>CT</i>Conteúdos';ref?.after(b);const view=document.createElement('section');view.id='view_conteudos';view.className='cp-view';view.innerHTML=`<div class="cp-head"><div><div class="cp-ey">Planejamento editorial</div><h1>Conteúdos</h1><p>Seu banco de conteúdos e calendário, configurados exclusivamente para o seu negócio a partir da estratégia definida com a YM.</p></div></div><div id="ccpStrategy"></div>
    <div class="ccp-tabs" role="tablist"><button data-mode="banco" role="tab">Banco de conteúdos<span id="ccpBankCount">0</span></button><button data-mode="calendario" role="tab">Calendário</button></div>
    <div id="ccpBank"></div>
    <div id="ccpCalendar" hidden><div class="ccp-grid"><div><div class="ccp-cal"><div class="ccp-cal-head"><button id="ccpPrev" aria-label="Mês anterior">‹</button><b id="ccpMonth"></b><button id="ccpNext" aria-label="Próximo mês">›</button></div><div class="ccp-week"><div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div></div><div id="ccpDays" class="ccp-days"></div></div></div><aside class="ccp-panel"><h2>Próximos conteúdos</h2><div id="ccpUpcoming"></div></aside></div></div>
    <div class="bk-zoom" id="bkZoom" hidden><button class="zx" aria-label="Fechar">×</button><button class="zp" aria-label="Anterior">‹</button><img alt=""><button class="zn" aria-label="Próxima">›</button><div class="zc"><span id="bkZoomCount"></span><button id="bkZoomDl">Baixar imagem</button></div></div>`;$('#view_calendario')?.after(view);
    b.addEventListener('click',()=>show());
    $('#ccpPrev').onclick=()=>{cursor=new Date(cursor.getFullYear(),cursor.getMonth()-1,1);renderCalendar()};
    $('#ccpNext').onclick=()=>{cursor=new Date(cursor.getFullYear(),cursor.getMonth()+1,1);renderCalendar()};
    view.querySelectorAll('.ccp-tabs button').forEach(x=>x.onclick=()=>setMode(x.dataset.mode));
    view.addEventListener('click',onClick);
    view.addEventListener('input',e=>{if(e.target.id==='bkQ'){filt.q=e.target.value;renderList()}});
    const z=$('#bkZoom');z.addEventListener('click',e=>{if(e.target===z||e.target.classList.contains('zx'))closeZoom();else if(e.target.classList.contains('zp'))stepZoom(-1);else if(e.target.classList.contains('zn'))stepZoom(1);else if(e.target.id==='bkZoomDl')download(zoom.list[zoom.i],zoom.name(zoom.i))});
    document.addEventListener('keydown',e=>{if($('#bkZoom').hidden)return;if(e.key==='Escape')closeZoom();if(e.key==='ArrowLeft')stepZoom(-1);if(e.key==='ArrowRight')stepZoom(1)});
    window.addEventListener('hashchange',()=>{if(location.hash==='#conteudos')show(false)});
  }
  async function show(push=true){$$('.cp-view').forEach(x=>x.classList.toggle('on',x.id==='view_conteudos'));$$('[data-nav]').forEach(x=>x.classList.toggle('on',x.dataset.nav==='conteudos'));$('#cpSidebar')?.classList.remove('open');if(push)history.replaceState({},'',location.pathname+'#conteudos');if(!portal){$('#ccpBank').innerHTML='<div class="ccp-empty">Carregando seus conteúdos…</div>';portal=await readPortal()}render()}

  const contents=()=>portal?.contents||[];
  const isBank=x=>!!(x.caption_instagram||x.caption_linkedin||x.reel_script?.length||x.images?.instagram?.length||x.images?.linkedin?.length);
  function setMode(m){mode=m;$$('.ccp-tabs button').forEach(b=>{b.classList.toggle('on',b.dataset.mode===m);b.setAttribute('aria-selected',b.dataset.mode===m)});$('#ccpBank').hidden=m!=='banco';$('#ccpCalendar').hidden=m!=='calendario';if(m==='calendario')renderCalendar();else renderBank()}

  function render(){const strategy=portal?.content_strategy||null,business=portal?.client?.contact?.business_name||portal?.client?.contact?.name||'seu negócio';const st=$('#ccpStrategy');if(st)st.innerHTML=strategy?`<div class="ccp-strategy"><b>Calendário orientado pela estratégia ${E(strategy.version)}</b><span>Planejamento exclusivo para ${E(business)}${strategy.channels?.length?' · canais: '+strategy.channels.map(E).join(', '):''}.</span></div>`:`<div class="ccp-strategy"><b>Calendário exclusivo de ${E(business)}</b><span>A YM libera aqui apenas os conteúdos planejados para o seu negócio.</span></div>`;
    const n=contents().filter(isBank).length;$('#ccpBankCount').textContent=n;
    setMode(mode||(n?'banco':'calendario'))}

  function renderCalendar(){const list=contents();const y=cursor.getFullYear(),m=cursor.getMonth();$('#ccpMonth').textContent=cursor.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase());const first=new Date(y,m,1),start=new Date(y,m,1-first.getDay());let html='';for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const iso=d.toLocaleDateString('en-CA'),rows=list.filter(x=>x.publish_date===iso);html+=`<div class="ccp-day ${d.getMonth()===m?'':'other'}"><div class="ccp-num">${d.getDate()}</div>${rows.map(x=>`<button class="ccp-event ccp-${E(x.function)}" data-open="${E(x.id)}" ${isBank(x)?'':'disabled'}>${E(x.title)}<small>${E(FMT[x.format]||x.format)}${x.publish_time?' · '+String(x.publish_time).slice(0,5):''}</small></button>`).join('')}</div>`}$('#ccpDays').innerHTML=html;
    const today=new Date().toLocaleDateString('en-CA');const upcoming=[...list].filter(x=>x.publish_date&&x.publish_date>=today).sort((a,b)=>String(a.publish_date).localeCompare(String(b.publish_date))).slice(0,12);$('#ccpUpcoming').innerHTML=upcoming.length?upcoming.map(x=>`<div class="ccp-row"><b>${E(x.title)}</b><small>${new Date(x.publish_date+'T12:00:00').toLocaleDateString('pt-BR')} · ${E(x.channel)} · ${E(FMT[x.format]||x.format)}${x.objective?'<br>'+E(x.objective):''}</small><span class="ccp-badge">${E(label[x.status]||x.status)}</span><div class="ccp-actions">${isBank(x)?`<button class="cp-btn secondary" data-open="${E(x.id)}">Abrir no banco</button>`:''}${x.script_url?`<a class="cp-btn secondary" href="${E(x.script_url)}" target="_blank" rel="noopener">Ver roteiro</a>`:''}${x.asset_url?`<a class="cp-btn secondary" href="${E(x.asset_url)}" target="_blank" rel="noopener">Ver material</a>`:''}${x.published_url?`<a class="cp-btn secondary" href="${E(x.published_url)}" target="_blank" rel="noopener">Ver publicado</a>`:''}</div></div>`).join(''):'<div class="ccp-empty">Seu calendário de conteúdos aparecerá aqui quando a YM liberar o planejamento do seu ciclo.</div>'}

  function renderBank(){const bank=contents().filter(isBank);const root=$('#ccpBank');
    if(!bank.length){root.innerHTML='<div class="ccp-empty">Seu banco de conteúdos aparecerá aqui quando a YM liberar os conteúdos do seu contrato: roteiros, imagens prontas e legendas para copiar e postar.</div>';return}
    const net=filt.net,posted=bank.filter(x=>x.client_posted?.[net]).length,today=new Date().toLocaleDateString('en-CA'),wk=new Date(Date.now()+7*864e5).toLocaleDateString('en-CA');
    const next7=bank.filter(x=>x.publish_date>=today&&x.publish_date<=wk&&!x.client_posted?.[net]).length;
    const nextOne=bank.filter(x=>!x.client_posted?.[net]).sort((a,b)=>String(a.publish_date).localeCompare(String(b.publish_date)))[0];
    const pill=(k,v,t)=>`<button class="bk-pill ${filt[k]===v?'on':''}" data-f="${k}" data-v="${v}">${t}</button>`;
    root.innerHTML=`<div class="bk-stats"><div class="bk-stat"><b>${bank.length}</b><span>conteúdos no banco</span></div><div class="bk-stat g"><b>${posted}/${bank.length}</b><span>postados no ${NET[net]}</span></div><div class="bk-stat o"><b>${next7}</b><span>para postar nos próximos 7 dias</span></div><div class="bk-stat b"><b>${nextOne?fmtDate(nextOne.publish_date).short:'—'}</b><span>${nextOne?'próximo: '+E(nextOne.title):'tudo postado'}</span></div></div>
    <div class="bk-bar"><div class="bk-group"><small>Rede</small>${pill('net','instagram','Instagram')}${pill('net','linkedin','LinkedIn')}</div><div class="bk-group"><small>Formato</small>${pill('fmt','TODOS','Todos')}${pill('fmt','REEL','Reels')}${pill('fmt','CARROSSEL','Carrossel')}${pill('fmt','ESTATICO','Estático')}</div><div class="bk-group"><small>Status</small>${pill('st','TODOS','Todos')}${pill('st','PENDENTE','A postar')}${pill('st','POSTADO','Postados')}</div><label class="bk-search"><input id="bkQ" type="search" placeholder="Buscar por tema ou pergunta…" value="${E(filt.q)}" aria-label="Buscar conteúdo"></label></div>
    <div id="bkList" class="bk-list"></div>`;renderList()}

  function fmtDate(iso){const d=new Date(iso+'T12:00:00');return {wd:WD[d.getDay()],day:String(d.getDate()).padStart(2,'0'),mon:d.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''),short:d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}}
  function renderList(){const el=$('#bkList');if(!el)return;const net=filt.net,q=filt.q.trim().toLowerCase();
    const list=contents().filter(isBank).filter(x=>filt.fmt==='TODOS'||x.format===filt.fmt||(filt.fmt==='ESTATICO'&&x.format==='POST_ESTATICO')).filter(x=>filt.st==='TODOS'||(filt.st==='POSTADO')===!!x.client_posted?.[net]).filter(x=>!q||[x.title,x.question,x.theme,x.hook].join(' ').toLowerCase().includes(q)).sort((a,b)=>String(a.publish_date).localeCompare(String(b.publish_date)));
    el.innerHTML=list.length?list.map(x=>card(x,net)).join(''):'<div class="ccp-empty">Nenhum conteúdo com esses filtros.</div>'}

  function card(x,net){const d=fmtDate(x.publish_date),done=!!x.client_posted?.[net],imgs=x.images?.[net]||[],cap=net==='linkedin'?x.caption_linkedin:x.caption_instagram;
    let media='';
    if(x.format==='REEL'){media=`<div class="bk-lbl">Roteiro de gravação lo-fi</div>${x.hook?`<div class="bk-hook"><b>Gancho (primeiros 3s)</b>${E(x.hook)}</div>`:''}${x.reel_script?.length?`<div class="bk-script"><table><thead><tr><th>Tempo</th><th>Cena</th><th>Fala</th><th>Texto na tela</th></tr></thead><tbody>${x.reel_script.map(r=>`<tr><td>${E(r.tempo)}</td><td>${E(r.cena)}</td><td>${E(r.fala)}</td><td class="tx">${E(r.texto)}</td></tr>`).join('')}</tbody></table></div>`:''}${x.recording_notes?`<div class="bk-note"><b>Como gravar:</b> ${E(x.recording_notes)}</div>`:''}`}
    else{media=`<div class="bk-lbl"><span>${imgs.length>1?imgs.length+' imagens · '+NET[net]:'Imagem · '+NET[net]}</span>${imgs.length?`<button class="bk-mini" data-dlall="${E(x.id)}">Baixar ${imgs.length>1?'todas':'imagem'}</button>`:''}</div>${imgs.length?`<div class="bk-strip">${imgs.map((u,i)=>`<button data-zoom="${E(x.id)}" data-i="${i}" aria-label="Ampliar imagem ${i+1}"><img src="${E(u)}" alt="${E(x.title)} — imagem ${i+1}" loading="lazy">${imgs.length>1?`<em>${i+1}/${imgs.length}</em>`:''}</button>`).join('')}</div>`:'<div class="ccp-empty">Imagens em produção pela YM.</div>'}`}
    return `<article class="bk-card ${done?'done':''}" id="bk-${E(x.id)}"><div class="bk-top"><div class="bk-date"><small>${d.wd}</small><b>${d.day}</b><i>${d.mon}</i></div><div class="bk-head"><div class="bk-tags"><span class="bk-tag ${E(x.format)}">${E(FMT[x.format]||x.format)}</span>${x.cta?`<span class="bk-tag cta">CTA: ${E(x.cta)}</span>`:''}${done?`<span class="bk-tag ok">✓ Postado no ${NET[net]}</span>`:''}</div><h3>${E(x.title)}</h3>${x.question?`<p>Responde: “${E(x.question)}”</p>`:''}</div></div>
    <div class="bk-body"><div class="bk-col">${media}</div><div class="bk-col"><div class="bk-lbl"><span>Legenda · ${NET[net]}</span>${cap?`<button class="bk-mini" data-copy="${E(x.id)}">Copiar legenda</button>`:''}</div>${cap?`<div class="bk-cap">${E(cap)}</div>`:'<div class="ccp-empty">Legenda em produção pela YM.</div>'}</div></div>
    <div class="bk-foot"><div class="bk-links">${x.article_url?`<a class="bk-mini" href="${E(x.article_url)}" target="_blank" rel="noopener">Ver guia no site ↗</a>`:''}${x.script_url?`<a class="bk-mini" href="${E(x.script_url)}" target="_blank" rel="noopener">Roteiro no Drive ↗</a>`:''}${x.asset_url?`<a class="bk-mini" href="${E(x.asset_url)}" target="_blank" rel="noopener">Material no Drive ↗</a>`:''}</div><button class="bk-done ${done?'on':''}" data-done="${E(x.id)}" aria-pressed="${done}"><i>${done?'✓':''}</i>${done?'Postado no '+NET[net]:'Marcar como postado no '+NET[net]}</button></div></article>`}

  const zoom={list:[],i:0,name:()=>''};
  function openZoom(x,i){const net=filt.net;zoom.list=x.images?.[net]||[];zoom.i=i;zoom.name=k=>`${(x.publish_date||'').replace(/-/g,'')}-${slug(x.title)}-${net}-${String(k+1).padStart(2,'0')}.jpg`;$('#bkZoom').hidden=false;paintZoom()}
  function paintZoom(){const z=$('#bkZoom');z.querySelector('img').src=zoom.list[zoom.i];$('#bkZoomCount').textContent=zoom.list.length>1?`${zoom.i+1} de ${zoom.list.length}`:'';z.querySelector('.zp').hidden=z.querySelector('.zn').hidden=zoom.list.length<2}
  function stepZoom(d){zoom.i=(zoom.i+d+zoom.list.length)%zoom.list.length;paintZoom()}
  function closeZoom(){$('#bkZoom').hidden=true}
  const slug=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40);
  async function download(url,name){try{const r=await fetch(url);const b=await r.blob();const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}catch(e){window.open(url,'_blank','noopener')}}
  async function copy(text){try{await navigator.clipboard.writeText(text);return true}catch(e){const t=document.createElement('textarea');t.value=text;document.body.append(t);t.select();let ok=false;try{ok=document.execCommand('copy')}catch(_){}t.remove();return ok}}
  const byId=id=>contents().find(x=>x.id===id);

  async function onClick(e){const t=e.target.closest('button');if(!t)return;
    if(t.dataset.f){filt[t.dataset.f]=t.dataset.v;if(t.dataset.f==='net'){try{localStorage.setItem('ccpNet',t.dataset.v)}catch(_){}}renderBank();return}
    if(t.dataset.open){setMode('banco');filt.fmt='TODOS';filt.st='TODOS';filt.q='';renderBank();const c=document.getElementById('bk-'+t.dataset.open);if(c){c.scrollIntoView({behavior:'smooth',block:'start'});c.classList.add('flash');setTimeout(()=>c.classList.remove('flash'),1800)}return}
    if(t.dataset.zoom){openZoom(byId(t.dataset.zoom),+t.dataset.i);return}
    if(t.dataset.copy){const x=byId(t.dataset.copy);const ok=await copy(filt.net==='linkedin'?x.caption_linkedin:x.caption_instagram);const old=t.textContent;t.textContent=ok?'Copiada ✓':'Selecione e copie';setTimeout(()=>t.textContent=old,1800);return}
    if(t.dataset.dlall){const x=byId(t.dataset.dlall),net=filt.net,list=x.images?.[net]||[];t.disabled=true;t.textContent='Baixando…';for(let i=0;i<list.length;i++){await download(list[i],`${(x.publish_date||'').replace(/-/g,'')}-${slug(x.title)}-${net}-${String(i+1).padStart(2,'0')}.jpg`);await new Promise(r=>setTimeout(r,350))}t.disabled=false;t.textContent='Baixado ✓';return}
    if(t.dataset.done){const x=byId(t.dataset.done),net=filt.net,next=!x.client_posted?.[net];t.disabled=true;try{const j=await post({action:'CONTENT_MARK_POSTED',content_id:x.id,channel:net,posted:next});x.client_posted=j.client_posted||{};toast(next?`Marcado como postado no ${NET[net]}.`:'Marcação removida.');renderBank()}catch(err){toast('Não foi possível salvar agora. Tente novamente.',true);t.disabled=false}return}
  }

  function boot(){install();if(location.hash==='#conteudos')setTimeout(()=>show(false),350)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

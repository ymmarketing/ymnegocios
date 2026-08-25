(()=>{
  const $=id=>document.getElementById(id);
  const E=v=>window.YM?.esc?YM.esc(v):String(v??'').replace(/[&<>"']/g,'');
  let manualEvents=[];

  async function calendarApi(body){
    const s=await YM.requireSession('/CENTRAL');
    if(!s)throw new Error('Sessão necessária');
    const r=await fetch(YM.SUPABASE_URL+'/functions/v1/central-ym-calendar-admin',{
      method:'POST',
      headers:{Authorization:'Bearer '+s.access_token,apikey:YM.PUBLISHABLE_KEY,'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.detail||j.error||'Falha ao salvar evento');
    return j;
  }

  function selectedDate(){
    const selected=document.querySelector('.ca-day.selected')?.dataset?.day;
    return /^\d{4}-\d{2}-\d{2}$/.test(selected||'')?selected:new Date().toISOString().slice(0,10);
  }

  function defaultStart(){return `${selectedDate()}T09:00`;}
  function defaultEnd(){return `${selectedDate()}T10:00`;}

  function toInput(v){
    if(!v)return '';
    const d=new Date(v);
    if(Number.isNaN(d.getTime()))return '';
    const p=n=>String(n).padStart(2,'0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function dayKey(v){
    const d=new Date(v);
    if(Number.isNaN(d.getTime()))return '';
    const p=n=>String(n).padStart(2,'0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
  }

  function displayDateTime(v){
    if(!v)return '';
    try{return new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}catch{return ''}
  }

  function clientOptions(){
    const select=$('caCalendarClient');
    if(!select)return '';
    return [...select.options].filter(o=>o.value).map(o=>`<option value="${E(o.value)}">${E(o.textContent||'Cliente')}</option>`).join('');
  }

  function clientLabel(event){
    if(!event?.client_id)return 'YM · Interno';
    const opt=[...($('caCalendarClient')?.options||[])].find(o=>o.value===event.client_id);
    return (opt?.textContent||'Cliente').trim();
  }

  function toast(msg,err=false){
    const el=$('caToast');
    if(!el)return alert(msg);
    el.textContent=msg;
    el.className='ym-toast'+(err?' err':'');
    el.style.display='block';
    clearTimeout(window.__ymCalToast);
    window.__ymCalToast=setTimeout(()=>el.style.display='none',4200);
  }

  async function loadManualEvents(){
    try{
      const j=await calendarApi({action:'LIST_EVENTS'});
      manualEvents=Array.isArray(j.events)?j.events:[];
      decorateEditableEvents();
    }catch(e){
      console.warn('Central YM calendar list',e);
    }
  }

  function openEventModal(event=null){
    document.getElementById('caEventModal')?.remove();
    const editing=!!event?.id;
    const linked=!!event?.client_id;
    const m=document.createElement('div');
    m.id='caEventModal';
    m.innerHTML=`<div class="ca-new-back"><section class="ca-new"><header><h2>${editing?'Editar evento':'Adicionar evento'}</h2><button id="caEventClose">×</button></header><div class="ca-new-body">
      <div class="ca-note" style="margin-bottom:10px">${editing?'Edite os dados deste evento ou exclua-o se ele não for mais necessário.':'Crie compromissos diretamente no Calendário Geral. O vínculo com cliente é opcional. Eventos sem cliente ficam somente na visão administrativa da YM.'}</div>
      <div class="ca-form"><h3>Evento</h3><div class="ca-formgrid">
        <div><label class="ym-label">Título</label><input id="ceTitle" class="ym-input" value="${E(event?.title||'')}" placeholder="Ex.: Reunião de alinhamento"></div>
        <div><label class="ym-label">Tipo</label><select id="ceType" class="ym-select"><option value="REUNIAO">Reunião</option><option value="ENTREGA">Entrega</option><option value="PUBLICACAO">Publicação</option><option value="APROVACAO">Aprovação</option><option value="FINANCEIRO">Financeiro</option><option value="MARCO">Marco</option><option value="OUTRO">Outro</option></select></div>
        <div><label class="ym-label">Início</label><input id="ceStart" class="ym-input" type="datetime-local" value="${E(editing?toInput(event.starts_at):defaultStart())}"></div>
        <div><label class="ym-label">Fim — opcional</label><input id="ceEnd" class="ym-input" type="datetime-local" value="${E(editing?toInput(event.ends_at):defaultEnd())}"></div>
        <div class="ca-wide"><label class="ym-label">Link — opcional</label><input id="ceUrl" class="ym-input" value="${E(event?.external_url||'')}" placeholder="https://..."></div>
        <div class="ca-wide"><label class="ym-label">Descrição / observação</label><textarea id="ceDesc" class="ym-textarea" placeholder="Contexto, pauta, orientação...">${E(event?.description||'')}</textarea></div>
      </div></div>
      <div class="ca-form"><h3>Vínculo</h3>
        <label style="display:flex;align-items:flex-start;gap:9px;font-size:10px;color:#38546D;font-weight:700"><input id="ceHasClient" type="checkbox" ${linked?'checked':''} style="margin-top:2px"> Vincular este evento a um cliente</label>
        <div id="ceClientBox" style="display:${linked?'block':'none'};margin-top:10px"><label class="ym-label">Cliente</label><select id="ceClient" class="ym-select"><option value="">Selecione o cliente</option>${clientOptions()}</select>
          <label style="display:flex;align-items:flex-start;gap:9px;font-size:10px;color:#38546D;font-weight:700;margin-top:10px"><input id="ceVisible" type="checkbox" ${event?.visible_to_client===false?'':'checked'} style="margin-top:2px"> Exibir também no calendário da Área do Cliente</label>
        </div>
        <div id="ceInternalNote" class="ca-note" style="display:${linked?'none':'block'};margin-top:10px">Sem cliente vinculado: este compromisso será interno da YM e não aparecerá para nenhum cliente.</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button id="ceSave" class="ym-btn" style="flex:1;min-width:180px">${editing?'Salvar alterações':'Salvar evento'}</button>
        ${editing?'<button id="ceDelete" class="ym-btn secondary" style="min-width:150px;border-color:#E8B4B4;color:#9D2E2E">Excluir evento</button>':''}
      </div>
    </div></section></div>`;
    document.body.append(m);

    m.querySelector('#ceType').value=event?.event_type||'REUNIAO';
    if(linked)m.querySelector('#ceClient').value=event.client_id;

    const hasClient=m.querySelector('#ceHasClient');
    const clientBox=m.querySelector('#ceClientBox');
    const internalNote=m.querySelector('#ceInternalNote');
    hasClient.onchange=()=>{
      clientBox.style.display=hasClient.checked?'block':'none';
      internalNote.style.display=hasClient.checked?'none':'block';
    };
    m.querySelector('#caEventClose').onclick=()=>m.remove();
    m.querySelector('.ca-new-back').onclick=e=>{if(e.target===e.currentTarget)m.remove()};

    m.querySelector('#ceSave').onclick=async()=>{
      const title=m.querySelector('#ceTitle').value.trim();
      const starts=m.querySelector('#ceStart').value;
      if(!title)return toast('Informe o título do evento.',true);
      if(!starts)return toast('Informe a data e hora de início.',true);
      const isLinked=hasClient.checked;
      const clientId=isLinked?m.querySelector('#ceClient').value:'';
      if(isLinked&&!clientId)return toast('Selecione o cliente ou desmarque o vínculo.',true);
      const btn=m.querySelector('#ceSave');
      btn.disabled=true;btn.textContent=editing?'Salvando alterações…':'Salvando…';
      try{
        const saved=await calendarApi({
          action:'UPSERT_EVENT',
          id:editing?event.id:null,
          client_id:clientId||null,
          title,
          event_type:m.querySelector('#ceType').value,
          starts_at:starts,
          ends_at:m.querySelector('#ceEnd').value||null,
          external_url:m.querySelector('#ceUrl').value.trim()||null,
          description:m.querySelector('#ceDesc').value.trim()||null,
          visible_to_client:isLinked&&m.querySelector('#ceVisible').checked
        });
        m.remove();
        const delivery=saved?.email_delivery?.status;
        const feedback=delivery==='SENT'?'Evento salvo e e-mail enviado ao cliente.':delivery==='FAILED'?'Evento salvo, mas o e-mail não pôde ser enviado.':delivery==='SKIPPED'?'Evento salvo; o cliente não possui e-mail transacional cadastrado.':delivery==='DUPLICATE'?'Evento salvo; este aviso já havia sido enviado.':'';
        toast(feedback||(editing?'Evento atualizado.':(isLinked?'Evento salvo e vinculado ao cliente.':'Evento interno da YM salvo.')),delivery==='FAILED');
        await loadManualEvents();
        $('refreshAdmin')?.click();
      }catch(e){
        toast(e.message,true);btn.disabled=false;btn.textContent=editing?'Salvar alterações':'Salvar evento';
      }
    };

    m.querySelector('#ceDelete')?.addEventListener('click',async()=>{
      if(!window.confirm(`Excluir o evento “${event.title}”? Esta ação não pode ser desfeita.`))return;
      const btn=m.querySelector('#ceDelete');
      btn.disabled=true;btn.textContent='Excluindo…';
      try{
        await calendarApi({action:'DELETE_EVENT',id:event.id});
        m.remove();
        toast('Evento excluído.');
        await loadManualEvents();
        $('refreshAdmin')?.click();
      }catch(e){
        toast(e.message,true);btn.disabled=false;btn.textContent='Excluir evento';
      }
    });
  }

  function findEventForRow(row){
    const who=(row.querySelector('b')?.textContent||'').trim();
    const small=row.querySelector('small');
    const text=(small?.innerText||small?.textContent||'').trim();
    const first=(text.split(/\n|\r/)[0]||'').trim();
    return manualEvents.filter(ev=>clientLabel(ev)===who&&ev.title===first&&text.includes(displayDateTime(ev.starts_at)));
  }

  function findEventForChip(chip){
    const day=chip.closest('.ca-day')?.dataset?.day||'';
    const text=(chip.textContent||'').trim();
    return manualEvents.filter(ev=>dayKey(ev.starts_at)===day&&`${clientLabel(ev)} · ${ev.title}`===text);
  }

  function decorateEditableEvents(root=document){
    normalizeInternalLabels(root);

    root.querySelectorAll?.('#caDayEvents .ca-row').forEach(row=>{
      if(row.dataset.ymEditDecorated==='1')return;
      const matches=findEventForRow(row);
      if(matches.length!==1)return;
      const ev=matches[0];
      row.dataset.ymEditDecorated='1';
      const btn=document.createElement('button');
      btn.className='ym-btn secondary';
      btn.textContent='Editar';
      btn.dataset.editEvent=ev.id;
      btn.onclick=e=>{e.preventDefault();e.stopPropagation();openEventModal(ev)};
      row.append(btn);
    });

    root.querySelectorAll?.('.ca-day .ca-event').forEach(chip=>{
      if(chip.dataset.ymEditDecorated==='1')return;
      const matches=findEventForChip(chip);
      if(matches.length!==1)return;
      const ev=matches[0];
      chip.dataset.ymEditDecorated='1';
      chip.style.cursor='pointer';
      chip.setAttribute('title',`${chip.getAttribute('title')||chip.textContent} · Clique para editar`);
      chip.onclick=e=>{e.preventDefault();e.stopPropagation();openEventModal(ev)};
    });
  }

  function normalizeInternalLabels(root=document){
    root.querySelectorAll?.('[data-open-client="null"],[data-open-client="undefined"],[data-open-client=""]').forEach(btn=>{
      const row=btn.closest('.ca-row');
      if(row){const b=row.querySelector('b');if(b&&(b.textContent||'').trim()==='Cliente')b.textContent='YM · Interno';}
      btn.remove();
    });
    root.querySelectorAll?.('.ca-event[title^="Cliente · "]').forEach(el=>{
      const current=el.textContent||'';
      if(current.startsWith('Cliente · '))el.textContent='YM · '+current.slice(10);
      const title=el.getAttribute('title')||'';
      if(title.startsWith('Cliente · '))el.setAttribute('title','YM · '+title.slice(10));
    });
  }

  async function boot(){
    if(!window.ClientJourneyAdmin&&!document.querySelector('script[data-client-journey-admin]')){
      const script=document.createElement('script');
      script.src='/assets/client-journey-admin.js?v=20260825-1';
      script.dataset.clientJourneyAdmin='1';
      document.head.append(script);
    }
    const btn=$('caAddEvent');
    if(btn)btn.onclick=()=>openEventModal();
    await loadManualEvents();
    normalizeInternalLabels();
    new MutationObserver(muts=>muts.forEach(x=>decorateEditableEvents(x.target))).observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',e=>{
      if(e.target?.id==='refreshAdmin')setTimeout(loadManualEvents,450);
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

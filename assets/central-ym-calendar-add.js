(()=>{
  const $=id=>document.getElementById(id);
  const E=v=>window.YM?.esc?YM.esc(v):String(v??'').replace(/[&<>"']/g,'');
  const pad=n=>String(n).padStart(2,'0');

  async function calendarApi(body){
    const s=await YM.requireSession('/CRM/CENTRAL');
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

  function defaultStart(){
    const d=selectedDate();
    return `${d}T09:00`;
  }

  function defaultEnd(){
    const d=selectedDate();
    return `${d}T10:00`;
  }

  function clientOptions(){
    const select=$('caCalendarClient');
    if(!select)return '';
    return [...select.options].filter(o=>o.value).map(o=>`<option value="${E(o.value)}">${E(o.textContent||'Cliente')}</option>`).join('');
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

  function openEventModal(){
    document.getElementById('caEventModal')?.remove();
    const m=document.createElement('div');
    m.id='caEventModal';
    m.innerHTML=`<div class="ca-new-back"><section class="ca-new"><header><h2>Adicionar evento</h2><button id="caEventClose">×</button></header><div class="ca-new-body">
      <div class="ca-note" style="margin-bottom:10px">Crie compromissos diretamente no Calendário Geral. O vínculo com cliente é opcional. Eventos sem cliente ficam somente na visão administrativa da YM.</div>
      <div class="ca-form"><h3>Evento</h3><div class="ca-formgrid">
        <div><label class="ym-label">Título</label><input id="ceTitle" class="ym-input" placeholder="Ex.: Reunião de alinhamento"></div>
        <div><label class="ym-label">Tipo</label><select id="ceType" class="ym-select"><option value="REUNIAO">Reunião</option><option value="ENTREGA">Entrega</option><option value="PUBLICACAO">Publicação</option><option value="APROVACAO">Aprovação</option><option value="FINANCEIRO">Financeiro</option><option value="MARCO">Marco</option><option value="OUTRO">Outro</option></select></div>
        <div><label class="ym-label">Início</label><input id="ceStart" class="ym-input" type="datetime-local" value="${defaultStart()}"></div>
        <div><label class="ym-label">Fim — opcional</label><input id="ceEnd" class="ym-input" type="datetime-local" value="${defaultEnd()}"></div>
        <div class="ca-wide"><label class="ym-label">Link — opcional</label><input id="ceUrl" class="ym-input" placeholder="https://..."></div>
        <div class="ca-wide"><label class="ym-label">Descrição / observação</label><textarea id="ceDesc" class="ym-textarea" placeholder="Contexto, pauta, orientação..."></textarea></div>
      </div></div>
      <div class="ca-form"><h3>Vínculo</h3>
        <label style="display:flex;align-items:flex-start;gap:9px;font-size:10px;color:#38546D;font-weight:700"><input id="ceHasClient" type="checkbox" style="margin-top:2px"> Vincular este evento a um cliente</label>
        <div id="ceClientBox" style="display:none;margin-top:10px"><label class="ym-label">Cliente</label><select id="ceClient" class="ym-select"><option value="">Selecione o cliente</option>${clientOptions()}</select>
          <label style="display:flex;align-items:flex-start;gap:9px;font-size:10px;color:#38546D;font-weight:700;margin-top:10px"><input id="ceVisible" type="checkbox" checked style="margin-top:2px"> Exibir também no calendário da Área do Cliente</label>
        </div>
        <div id="ceInternalNote" class="ca-note" style="margin-top:10px">Sem cliente vinculado: este compromisso será interno da YM e não aparecerá para nenhum cliente.</div>
      </div>
      <button id="ceSave" class="ym-btn" style="width:100%">Salvar evento</button>
    </div></section></div>`;
    document.body.append(m);

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
      const linked=hasClient.checked;
      const clientId=linked?m.querySelector('#ceClient').value:'';
      if(linked&&!clientId)return toast('Selecione o cliente ou desmarque o vínculo.',true);
      const btn=m.querySelector('#ceSave');
      btn.disabled=true;btn.textContent='Salvando…';
      try{
        await calendarApi({
          action:'UPSERT_EVENT',
          client_id:clientId||null,
          title,
          event_type:m.querySelector('#ceType').value,
          starts_at:starts,
          ends_at:m.querySelector('#ceEnd').value||null,
          external_url:m.querySelector('#ceUrl').value.trim()||null,
          description:m.querySelector('#ceDesc').value.trim()||null,
          visible_to_client:linked&&m.querySelector('#ceVisible').checked
        });
        m.remove();
        toast(linked?'Evento salvo e vinculado ao cliente.':'Evento interno da YM salvo.');
        $('refreshAdmin')?.click();
      }catch(e){
        toast(e.message,true);btn.disabled=false;btn.textContent='Salvar evento';
      }
    };
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

  function boot(){
    const btn=$('caAddEvent');
    if(btn)btn.onclick=openEventModal;
    normalizeInternalLabels();
    new MutationObserver(muts=>muts.forEach(x=>normalizeInternalLabels(x.target))).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

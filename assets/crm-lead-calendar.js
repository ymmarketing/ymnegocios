(()=>{
  const E=v=>window.YM?.esc?YM.esc(v):String(v??'').replace(/[&<>"']/g,'');
  const qs=(sel,root=document)=>root.querySelector(sel);
  const pad=n=>String(n).padStart(2,'0');

  function localInput(date){
    return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  function suggestedStart(){
    const base=new Date(Date.now()+60*60*1000),d=new Date(base);
    if(base.getMinutes()<30)d.setMinutes(30,0,0);else{d.setHours(d.getHours()+1);d.setMinutes(0,0,0)}
    return localInput(d);
  }
  function asIso(localValue){
    if(!localValue)return null;
    const d=new Date(localValue);
    return Number.isNaN(d.getTime())?null:d.toISOString();
  }
  function leadState(id){
    try{return (crm?.opportunities||[]).find(x=>x.id===id)||null}catch{return null}
  }
  function leadLabel(id,card){
    const o=leadState(id),c=o?.contact||{};
    return c.business_name||c.name||qs('.visual-profile h3',card)?.textContent?.trim()||qs('.lead-name b',card)?.textContent?.trim()||'Lead';
  }
  async function calendarApi(body){
    const s=await YM.requireSession('/CRM');
    if(!s)throw new Error('Sessão necessária');
    const r=await fetch(YM.SUPABASE_URL+'/functions/v1/crm-lead-calendar-admin',{
      method:'POST',
      headers:{Authorization:'Bearer '+s.access_token,apikey:YM.PUBLISHABLE_KEY,'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.detail||j.error||'Não foi possível agendar a reunião');
    return j;
  }
  function ensureCss(){
    if(document.getElementById('ymLeadCalendarCss'))return;
    const s=document.createElement('style');s.id='ymLeadCalendarCss';s.textContent=`
      .ym-lead-cal-back{position:fixed;inset:0;z-index:950;background:rgba(4,22,38,.68);display:grid;place-items:center;padding:16px}
      .ym-lead-cal{width:min(620px,100%);max-height:92vh;overflow:hidden;background:#f7f9fc;border-radius:20px;box-shadow:0 30px 80px rgba(0,0,0,.28)}
      .ym-lead-cal>header{display:flex;align-items:center;justify-content:space-between;background:#0A2540;color:#fff;padding:15px 18px}
      .ym-lead-cal>header h2{font:800 17px Montserrat;margin:0}.ym-lead-cal>header button{width:38px;height:38px;border:0;border-radius:9px;background:rgba(255,255,255,.12);color:#fff;font-size:20px}
      .ym-lead-cal-body{padding:16px;overflow:auto;max-height:calc(92vh - 68px)}
      .ym-lead-cal-note{font-size:12px;line-height:1.55;color:#496176;background:#eef4fb;border:1px solid #d9e5f3;border-radius:12px;padding:10px 12px;margin-bottom:12px}
      .ym-lead-cal-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ym-lead-cal-wide{grid-column:1/-1}
      .ym-lead-cal-save{width:100%;margin-top:12px;min-height:44px}
      @media(max-width:760px){.ym-lead-cal-back{padding:0}.ym-lead-cal{width:100%;height:100%;max-height:100vh;border-radius:0}.ym-lead-cal-body{max-height:calc(100vh - 68px);padding:14px}.ym-lead-cal-grid{grid-template-columns:1fr}.ym-lead-cal-wide{grid-column:auto}}
    `;document.head.append(s);
  }
  function openModal(id,card){
    ensureCss();document.getElementById('ymLeadCalendarModal')?.remove();
    const label=leadLabel(id,card),m=document.createElement('div');m.id='ymLeadCalendarModal';m.innerHTML=`<div class="ym-lead-cal-back"><section class="ym-lead-cal"><header><h2>Agendar reunião · ${E(label)}</h2><button type="button" data-close>×</button></header><div class="ym-lead-cal-body"><div class="ym-lead-cal-note">Este compromisso ficará no Calendário Geral da Central YM como uma agenda de <b>lead</b>. O lead não precisa virar cliente para aparecer nos seus próximos compromissos.</div><div class="ym-lead-cal-grid"><div class="ym-lead-cal-wide"><label class="ym-label">Título</label><input id="ylcTitle" class="ym-input" value="Reunião / conversa"></div><div><label class="ym-label">Início</label><input id="ylcStart" type="datetime-local" class="ym-input" value="${suggestedStart()}"></div><div><label class="ym-label">Fim — opcional</label><input id="ylcEnd" type="datetime-local" class="ym-input"></div><div class="ym-lead-cal-wide"><label class="ym-label">Link — opcional</label><input id="ylcUrl" class="ym-input" placeholder="https://meet.google.com/... ou outro link"></div><div class="ym-lead-cal-wide"><label class="ym-label">Observação / pauta</label><textarea id="ylcNotes" class="ym-textarea" placeholder="Contexto da conversa, pauta ou lembrete interno"></textarea></div></div><button id="ylcSave" class="ym-btn ym-lead-cal-save">Salvar na Central YM</button></div></section></div>`;
    document.body.append(m);
    const close=()=>m.remove();m.querySelector('[data-close]').onclick=close;m.querySelector('.ym-lead-cal-back').onclick=e=>{if(e.target===e.currentTarget)close()};
    m.querySelector('#ylcSave').onclick=async()=>{
      const title=m.querySelector('#ylcTitle').value.trim(),starts=m.querySelector('#ylcStart').value,ends=m.querySelector('#ylcEnd').value,url=m.querySelector('#ylcUrl').value.trim(),notes=m.querySelector('#ylcNotes').value.trim();
      if(!title)return YM.toast('Informe o título da reunião.',true);if(!starts)return YM.toast('Informe a data e o horário.',true);if(url&&!/^https?:\/\//i.test(url))return YM.toast('O link precisa começar com http:// ou https://.',true);
      const startsIso=asIso(starts),endsIso=asIso(ends);if(!startsIso)return YM.toast('Data e horário inválidos.',true);if(ends&&(!endsIso||new Date(endsIso)<new Date(startsIso)))return YM.toast('O horário final precisa ser posterior ao início.',true);
      const b=m.querySelector('#ylcSave');b.disabled=true;b.textContent='Agendando…';
      try{
        await calendarApi({action:'UPSERT_LEAD_MEETING',opportunity_id:id,title,starts_at:startsIso,ends_at:endsIso,external_url:url||null,description:notes||null});
        close();YM.toast(`Reunião com ${label} agendada na Central YM.`);
        if(typeof window.load==='function'){try{await window.load()}catch{}}
      }catch(e){YM.toast(e.message,true);b.disabled=false;b.textContent='Salvar na Central YM'}
    };
  }
  function enhance(){
    document.querySelectorAll('details.lead-card[id^="lead_"]').forEach(card=>{
      const id=card.id.replace('lead_',''),bar=card.querySelector('.profile-actions');if(!bar||bar.querySelector('[data-lead-meeting]'))return;
      const b=document.createElement('button');b.type='button';b.className='ym-btn';b.dataset.leadMeeting='1';b.textContent='Agendar reunião';b.onclick=e=>{e.preventDefault();e.stopPropagation();openModal(id,card)};
      const make=bar.querySelector('[data-make-client]');if(make)make.after(b);else bar.prepend(b);
    });
    focusRequestedLead();
  }
  let focused=false;
  function focusRequestedLead(){
    if(focused)return;const id=new URLSearchParams(location.search).get('lead');if(!id)return;const card=document.getElementById('lead_'+id);if(!card)return;focused=true;card.open=true;setTimeout(()=>card.scrollIntoView({behavior:'smooth',block:'start'}),120);
  }
  const boot=()=>{ensureCss();enhance();new MutationObserver(()=>requestAnimationFrame(enhance)).observe(document.getElementById('leadList')||document.body,{childList:true,subtree:true});setInterval(enhance,900)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

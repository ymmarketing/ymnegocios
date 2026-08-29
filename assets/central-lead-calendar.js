(()=>{
  const RX=/^\[\[YM_LEAD\|([0-9a-f-]{36})\|([^\]]+)\]\](?:\r?\n)?/i;
  let leadEvents=[];
  const E=v=>window.YM?.esc?YM.esc(v):String(v??'');
  function parseDescription(v){
    const s=String(v||''),m=s.match(RX);if(!m)return null;
    let label='Lead';try{label=decodeURIComponent(m[2]||'Lead')}catch{label=m[2]||'Lead'}
    return {opportunity_id:m[1],label,clean:s.replace(RX,'')};
  }
  function dateTime(v){try{return new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}catch{return''}}
  function dayKey(v){const d=new Date(v);if(Number.isNaN(d.getTime()))return'';const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`}
  async function api(body){
    const s=await YM.requireSession('/CENTRAL');if(!s)throw new Error('Sessão necessária');
    const r=await fetch(YM.SUPABASE_URL+'/functions/v1/central-ym-calendar-admin',{method:'POST',headers:{Authorization:'Bearer '+s.access_token,apikey:YM.PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.detail||j.error||'Falha ao ler agenda');return j;
  }
  async function load(){
    try{const j=await api({action:'LIST_EVENTS'});leadEvents=(j.events||[]).map(ev=>{const lead=parseDescription(ev.description);return lead?{...ev,...lead}:null}).filter(Boolean);apply()}catch(e){console.warn('Central lead calendar',e)}
  }
  function leadButton(row,ev){
    row.querySelectorAll('[data-open-client="null"],[data-open-client="undefined"],[data-open-client=""]').forEach(x=>x.remove());
    let b=row.querySelector('[data-open-lead]');if(!b){b=document.createElement('button');b.type='button';b.className='ym-btn secondary';b.dataset.openLead='1';b.textContent='Abrir lead';row.append(b)}
    b.onclick=e=>{e.preventDefault();e.stopPropagation();location.href='/CRM?lead='+encodeURIComponent(ev.opportunity_id)};
  }
  function matchRow(row,ev){
    const text=(row.innerText||row.textContent||'');return text.includes(ev.title)&&text.includes(dateTime(ev.starts_at));
  }
  function applyRows(root,kind){
    root?.querySelectorAll?.('.ca-row').forEach(row=>{
      const ev=leadEvents.find(x=>matchRow(row,x));if(!ev)return;row.dataset.leadEvent='1';
      const b=row.querySelector('b');if(b){if(kind==='upcoming')b.textContent=`Lead · ${ev.label} · ${ev.title}`;else b.textContent=`Lead · ${ev.label}`}
      leadButton(row,ev);
    });
  }
  function applyChips(){
    document.querySelectorAll('.ca-day .ca-event').forEach(chip=>{
      const key=chip.closest('.ca-day')?.dataset?.day||'',txt=chip.textContent||'';
      const ev=leadEvents.find(x=>dayKey(x.starts_at)===key&&txt.includes(x.title));if(!ev)return;
      chip.dataset.leadEvent='1';chip.textContent=`Lead · ${ev.label} · ${ev.title}`;chip.setAttribute('title',`Lead · ${ev.label} · ${ev.title}`);
    });
  }
  function cleanLeadModal(){
    const modal=document.getElementById('caEventModal');if(!modal||modal.dataset.leadCleaned==='1')return;const ta=modal.querySelector('#ceDesc');if(!ta)return;const lead=parseDescription(ta.value);if(!lead)return;
    modal.dataset.leadCleaned='1';modal.dataset.leadMarker=`[[YM_LEAD|${lead.opportunity_id}|${encodeURIComponent(lead.label)}]]`;ta.value=lead.clean;
    const note=modal.querySelector('.ca-note');if(note)note.innerHTML=`Este compromisso está vinculado ao <b>lead ${E(lead.label)}</b>. Ele aparece na agenda administrativa da YM e não exige cadastro como cliente.`;
    const has=modal.querySelector('#ceHasClient'),box=modal.querySelector('#ceClientBox'),internal=modal.querySelector('#ceInternalNote');if(has){has.checked=false;has.disabled=true}if(box)box.style.display='none';if(internal){internal.style.display='block';internal.textContent=`Vínculo atual: Lead · ${lead.label}`}
    const save=modal.querySelector('#ceSave');if(save)save.addEventListener('click',()=>{if(!ta.value.startsWith('[[YM_LEAD|'))ta.value=modal.dataset.leadMarker+(ta.value.trim()?'\n'+ta.value.trim():'')},{capture:true});
  }
  function apply(){applyRows(document.getElementById('caUpcoming'),'upcoming');applyRows(document.getElementById('caDayEvents'),'day');applyChips();cleanLeadModal()}
  function boot(){load();new MutationObserver(()=>requestAnimationFrame(apply)).observe(document.body,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target?.id==='refreshAdmin')setTimeout(load,500);setTimeout(cleanLeadModal,0)});setInterval(apply,1000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

(()=>{
  if(window.__centralD0Ui)return;window.__centralD0Ui=true;
  const style=document.createElement('style');style.textContent=`
    .d0-pending-banner{margin:0 0 12px;border:1px solid #efd29a;border-left:4px solid #e28b22;background:#fff9ec;border-radius:12px;padding:11px 13px;color:#704d0a;font-size:9px;line-height:1.5}.d0-pending-banner b{display:block;font:800 10px Montserrat;color:#0a2540;margin-bottom:3px}.d0-status-chip{display:inline-flex;margin-top:5px;border-radius:999px;background:#fff0ce;color:#865b09;padding:4px 7px;font-size:7px;font-weight:900}`;document.head.append(style);

  async function admin(body){
    const s=await YM.requireSession('/CENTRAL');if(!s)throw new Error('Sessão necessária');
    const r=await fetch(YM.SUPABASE_URL+'/functions/v1/central-ym-admin',{method:'POST',headers:{Authorization:'Bearer '+s.access_token,apikey:YM.PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.detail||j.error||'Falha na Central YM');return j;
  }

  function patchFilter(){
    const sel=document.getElementById('caClientStatus');if(!sel||[...sel.options].some(o=>o.value==='PENDENTE_D0'))return;
    const opt=document.createElement('option');opt.value='PENDENTE_D0';opt.textContent='Aguardando D0';
    const inactive=[...sel.options].find(o=>o.value==='INATIVO');if(inactive)sel.insertBefore(opt,inactive);else sel.append(opt);
  }

  function patchNewClientModal(){
    const modal=document.getElementById('caNewModal');if(!modal||modal.dataset.d0Patched)return;modal.dataset.d0Patched='1';
    const h=modal.querySelector('header h2');if(h)h.textContent='Pré-cadastro do cliente';
    const note=modal.querySelector('.ca-new-body > .ca-note');if(note)note.innerHTML='<b>Este cadastro ainda não torna o cliente ativo.</b> Ele cria a ficha em <b>Aguardando D0</b>. A ativação e a liberação da Área do Cliente acontecem automaticamente somente após contrato assinado, condição financeira validada e cláusulas operacionais confirmadas.';
    const became=modal.querySelector('#ncBecame');if(became?.parentElement)became.parentElement.style.display='none';
    const serviceForm=[...modal.querySelectorAll('.ca-form')].find(x=>x.querySelector('#ncService'));const serviceNote=serviceForm?.querySelector('.ca-note');if(serviceNote)serviceNote.textContent='Se o serviço já estiver definido, você pode registrá-lo agora. A execução e o relógio da Fundação só começam após o D0.';
    const btn=modal.querySelector('#ncSave');if(btn&&!btn.disabled)btn.textContent='Criar pré-cadastro';
  }

  let checkingDrawer=false,lastPendingId='';
  async function patchDrawer(){
    const drawer=document.getElementById('caDrawer');if(!drawer||checkingDrawer)return;
    const id=new URLSearchParams(location.search).get('client');if(!id||drawer.dataset.d0Checked===id)return;
    checkingDrawer=true;drawer.dataset.d0Checked=id;
    try{
      const j=await admin({action:'GET_CLIENT_PORTAL',client_id:id});const c=j?.data?.client;if(!c||c.status!=='PENDENTE_D0')return;
      const body=drawer.querySelector('.ca-drawer-body');if(body&&!body.querySelector('.d0-pending-banner')){
        const banner=document.createElement('div');banner.className='d0-pending-banner';banner.innerHTML='<b>Cliente aguardando D0</b>Este registro ainda não é um cliente ativo. Abra a Jornada para registrar o contrato. A Área do Cliente permanecerá bloqueada até o D0 ser liberado.<br><span class="d0-status-chip">AGUARDANDO D0</span>';body.prepend(banner);
      }
      if(lastPendingId!==id){lastPendingId=id;setTimeout(()=>drawer.querySelector('[data-client-tab="jornada"]')?.click(),80);}
    }catch(e){console.warn('D0 UI',e)}finally{checkingDrawer=false;}
  }

  function delayed(fn){setTimeout(fn,50);setTimeout(fn,250);setTimeout(fn,700)}
  function boot(){
    patchFilter();delayed(patchDrawer);
    document.addEventListener('click',e=>{
      const t=e.target;
      if(t?.closest?.('#newClient,#newClientTop'))delayed(patchNewClientModal);
      if(t?.closest?.('[data-open-client]'))delayed(patchDrawer);
      if(t?.id==='refreshAdmin'){setTimeout(patchFilter,300);setTimeout(patchDrawer,650)}
    },true);
    window.addEventListener('popstate',()=>delayed(patchDrawer));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
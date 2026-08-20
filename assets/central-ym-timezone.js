(()=>{
  if(window.__ymCentralTimezoneFix)return;
  window.__ymCentralTimezoneFix=true;

  const originalFetch=window.fetch.bind(window);
  const naive=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;
  const fieldsByAction={
    UPSERT_EVENT:['starts_at','ends_at'],
    UPSERT_PROJECT_META:['next_step_due_at'],
    CREATE_APPROVAL:['due_at','scheduled_at'],
    UPDATE_APPROVAL:['due_at','scheduled_at']
  };

  function localToIso(value){
    if(typeof value!=='string'||!value||!naive.test(value))return value;
    const d=new Date(value);
    return Number.isNaN(d.getTime())?value:d.toISOString();
  }

  window.fetch=(input,init)=>{
    try{
      const url=typeof input==='string'?input:(input?.url||'');
      const isCentral=url.includes('/functions/v1/central-ym-admin')||url.includes('/functions/v1/central-ym-calendar-admin');
      if(isCentral&&typeof init?.body==='string'){
        const body=JSON.parse(init.body);
        const fields=fieldsByAction[body?.action]||[];
        let changed=false;
        for(const field of fields){
          const next=localToIso(body[field]);
          if(next!==body[field]){body[field]=next;changed=true;}
        }
        if(changed)init={...init,body:JSON.stringify(body)};
      }
    }catch(error){
      console.warn('Central YM timezone normalization',error);
    }
    return originalFetch(input,init);
  };
})();
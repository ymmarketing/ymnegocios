(()=>{
 function inject(){
  document.getElementById('centralYmConsoleLink')?.remove();

  const sidebar=document.getElementById('ymSidebar');
  if(!sidebar)return;

  const internal=[...sidebar.querySelectorAll('.ym-nav-group')].find(g=>g.querySelector('.ym-nav-label')?.textContent?.trim().toLowerCase()==='interno');
  if(!internal)return;

  let link=internal.querySelector('a[href="/CENTRAL"]');
  if(!link){
   link=document.createElement('a');
   link.href='/CENTRAL';
   link.id='centralYmSidebarLink';
   link.innerHTML='<span class="nav-icon">CY</span><span>Central YM</span>';
   const crm=internal.querySelector('a[href="/CRM"]');
   if(crm)internal.insertBefore(link,crm);else internal.appendChild(link);
  }

  if(location.pathname.startsWith('/CENTRAL')){
   internal.querySelectorAll('a.active').forEach(a=>a.classList.remove('active'));
   link.classList.add('active');
  }
 }

 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject,{once:true});else inject();
 new MutationObserver(()=>requestAnimationFrame(inject)).observe(document.body,{childList:true,subtree:true});
 setTimeout(inject,150);
 setTimeout(inject,700);
})();
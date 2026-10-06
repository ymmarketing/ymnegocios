(()=>{
  if(window.YM?.__centralShell)return;
  const SUPABASE_URL='https://srzdikgztpdtwbggwniz.supabase.co';
  const PUBLISHABLE_KEY='sb_publishable_OGZsWJSj2noU3Dd78pk48g__eEKE3xT';
  const sb=window.supabase.createClient(SUPABASE_URL,PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isHttp=v=>/^https?:\/\//i.test(String(v||''));
  const safeLink=(v,label)=>isHttp(v)?`<a href="${esc(v)}" target="_blank" rel="noopener">${esc(label)}</a>`:`<span class="ym-meta">${esc(v||'Não informado')}</span>`;
  const datePt=v=>{if(!v)return '—';try{return new Date(v).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})}catch{return '—'}};
  const toast=(msg,err=false)=>{let el=document.getElementById('ymToast')||document.getElementById('caToast');if(!el){el=document.createElement('div');el.id='ymToast';document.body.append(el)}el.textContent=msg;el.className='ym-toast'+(err?' err':'');el.style.display='block';clearTimeout(window.__ymtoast);window.__ymtoast=setTimeout(()=>el.style.display='none',4200)};
  const safeNext=v=>/^\/(CENTRAL|CRM|MOTOR|DASHBOARD|FINANCEIRO|Identidade|Conteudos|RAIOX)(?:[/?#]|$)/.test(v||'')?v:'/CENTRAL';
  async function requireSession(next=location.pathname+location.search){const {data:{session}}=await sb.auth.getSession();if(!session){location.replace('/interno?next='+encodeURIComponent(safeNext(next)));return null}return session}
  async function signOut(){await sb.auth.signOut();location.replace('/interno')}
  function shell(user){
    const existing=document.getElementById('ymSidebar');if(existing)return existing;
    const nav=(href,label,icon,active=false,ideia='')=>`<a href="${href}" class="${active?'active':''}"><span class="nav-icon">${icon}</span><span>${label}</span>${ideia?`<span class="ideia">${ideia}</span>`:''}</a>`;
    const aside=document.createElement('aside');aside.className='ym-sidebar';aside.id='ymSidebar';
    aside.innerHTML=`<a class="ym-logo-link" href="/" aria-label="Ir para o site"><img class="ym-logo" src="/assets/img/logo-ym-horizontal.webp" alt="YM Marketing & Negócios"></a><div class="ym-nav"><div class="ym-nav-group"><div class="ym-nav-label">Interno</div>${nav('/CENTRAL','Central YM','CY',true)}${nav('/CRM','CRM','C')}${nav('/MOTOR','MOTOR VOS','MV')}${nav('/RAIOX/','Análise Raio-X','AX')}${nav('/Conteudos','Conteúdos','CT')}${nav('/DASHBOARD','Dashboard','D')}${nav('/FINANCEIRO','Financeiro','F')}${nav('/Identidade','Identidade','ID')}</div><div class="ym-nav-group"><div class="ym-nav-label">Site público</div>${nav('/','Site YM','YM')}${nav('/raio-x-digital/','Raio-X Digital','RX')}${nav('/triagem/','Avaliação gratuita','AG')}${nav('/conteudos/','Guias e perguntas','G')}${nav('/areadocliente','Área do Cliente','AC')}</div></div><div class="ym-account"><strong>${esc(user?.email||'')}</strong><span>${esc(user?.role||'ÁREA INTERNA')}</span><div class="ym-account-actions"><a href="/interno/redefinir?change=1&next=${encodeURIComponent(location.pathname)}">Senha</a><button id="ymLogout">Sair</button></div></div>`;
    document.body.prepend(aside);
    document.getElementById('ymLogout')?.addEventListener('click',signOut);
    const menu=document.getElementById('ymMenu');menu?.addEventListener('click',()=>aside.classList.toggle('open'));
    document.addEventListener('click',e=>{if(innerWidth<=760&&aside.classList.contains('open')&&!aside.contains(e.target)&&e.target!==menu)aside.classList.remove('open')});
    return aside;
  }
  async function boot(){try{const s=await requireSession('/CENTRAL'+location.search);if(s)shell(s.user)}catch(e){console.warn('YM Central shell',e)}}
  window.YM={...(window.YM||{}),__centralShell:true,SUPABASE_URL,PUBLISHABLE_KEY,sb,esc,isHttp,safeLink,datePt,toast,safeNext,requireSession,signOut,shell};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
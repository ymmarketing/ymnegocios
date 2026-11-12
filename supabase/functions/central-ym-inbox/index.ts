import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/* Central YM · respostas dos clientes, novas versões e métricas de ajustes (11/11/2026)
   LIST                      → respostas recentes + total não lido + versões em rascunho (antes × depois) + métricas
   MARK_READ {id}            → marca uma resposta como vista
   MARK_ALL_READ             → marca todas como vistas
   SEND_REVISION {version_id}→ libera a nova versão para o cliente (a anterior fica guardada)
   DISCARD_REVISION {version_id} → descarta um rascunho que ainda não foi enviado
   POSTS {from,to}           → peças com publicação no intervalo (todos os clientes) + aprovadas atrasadas, na versão que o cliente vê,
                               com links de visualização e de download em alta qualidade (12/11/2026)
   POST {approval_id}        → uma peça só, no mesmo formato (abre direto do aviso ou da aba do cliente)
   MARK_PUBLISHED {approval_id} → marca uma peça aprovada como publicada (não notifica o cliente)
   Tabela central_ym_inbox é preenchida pelo gatilho trg_central_ym_client_approval_alert. */
const PROD='https://ymnegocios.com.br';
const ORIGINS=new Set([PROD,'https://www.ymnegocios.com.br','http://localhost:3000','http://localhost:5173']);
const BUCKET='client-content';
const headers=(o:string|null)=>({'Access-Control-Allow-Origin':o&&ORIGINS.has(o)?o:PROD,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',Vary:'Origin'});
const reply=(s:number,b:unknown,o:string|null)=>new Response(JSON.stringify(b),{status:s,headers:headers(o)});
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const one=(x:any)=>Array.isArray(x)?x[0]:x;

Deno.serve(async(req:Request)=>{
  const origin=req.headers.get('origin');
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:headers(origin)});
  if(origin&&!ORIGINS.has(origin))return reply(403,{ok:false,error:'origin_not_allowed'},origin);
  if(req.method!=='POST')return reply(405,{ok:false,error:'method_not_allowed'},origin);
  const su=Deno.env.get('SUPABASE_URL'),sk=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!su||!sk)return reply(503,{ok:false,error:'storage_not_configured'},origin);
  const sb=createClient(su,sk,{auth:{persistSession:false,autoRefreshToken:false}});
  const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  const {data:{user},error:ue}=await sb.auth.getUser(token);
  if(ue||!user?.email)return reply(401,{ok:false,error:'invalid_session'},origin);
  const email=user.email.toLowerCase();
  const ia=await sb.from('vos_internal_access').select('role,active').eq('email',email).maybeSingle();
  if(ia.error||!ia.data?.active)return reply(403,{ok:false,error:'forbidden'},origin);
  let b:any={};try{b=await req.json();}catch{}
  const action=String(b.action||'LIST').toUpperCase();

  async function revisions(){
    const dq=await sb.from('client_approval_versions').select('id,approval_id,version_number,content_snapshot,change_summary,responds_to_action_id,created_at,created_by').eq('visible_to_client',false).order('created_at',{ascending:true}).limit(40);
    if(dq.error)throw dq.error;
    const drafts=dq.data||[];if(!drafts.length)return [];
    const ids=[...new Set(drafts.map((d:any)=>d.approval_id))];
    const [iq,vq,aq]=await Promise.all([
      sb.from('client_approval_items').select('id,client_id,title,content_type,scheduled_at,status,client:crm_clients(contact:crm_contacts(name,business_name))').in('id',ids),
      sb.from('client_approval_versions').select('approval_id,version_number,content_snapshot,visible_to_client').in('approval_id',ids).eq('visible_to_client',true),
      sb.from('client_approval_actions').select('id,approval_id,action,comment,created_at,actor_type').in('approval_id',ids).eq('actor_type','CLIENTE').order('created_at',{ascending:false})
    ]);
    if(iq.error)throw iq.error;if(vq.error)throw vq.error;if(aq.error)throw aq.error;
    const paths=new Set<string>();
    const out=drafts.map((d:any)=>{
      const it:any=(iq.data||[]).find((x:any)=>x.id===d.approval_id)||{};
      const prev:any=(vq.data||[]).filter((v:any)=>v.approval_id===d.approval_id).sort((a:any,b:any)=>b.version_number-a.version_number)[0]||null;
      const req:any=(aq.data||[]).find((a:any)=>a.id===d.responds_to_action_id)||(aq.data||[]).find((a:any)=>a.approval_id===d.approval_id&&a.action==='AJUSTE_SOLICITADO')||null;
      const before=prev?.content_snapshot?.asset_images?.instagram||[],after=d.content_snapshot?.asset_images?.instagram||[];
      [...before,...after].forEach((p:string)=>typeof p==='string'&&paths.add(p));
      const ct=one(one(it.client)?.contact);
      return {version_id:d.id,approval_id:d.approval_id,version_number:d.version_number,previous_version:prev?.version_number||null,client_id:it.client_id,client_name:ct?.business_name||ct?.name||'Cliente',title:it.title,content_type:it.content_type,scheduled_at:it.scheduled_at,item_status:it.status,change_summary:d.change_summary,request:req?{comment:req.comment,created_at:req.created_at}:null,
        before:{images:before,caption:prev?.content_snapshot?.caption_instagram||''},after:{images:after,caption:d.content_snapshot?.caption_instagram||''},created_at:d.created_at};
    });
    const signed=new Map<string,string>();
    if(paths.size){const s=await sb.storage.from(BUCKET).createSignedUrls([...paths],60*60*6);if(!s.error)for(const x of s.data||[])if(x.path&&x.signedUrl)signed.set(x.path,x.signedUrl);}
    for(const r of out){for(const k of ['before','after']){(r as any)[k].urls=(r as any)[k].images.map((p:string)=>signed.get(p)||'');}}
    return out;
  }
  async function metrics(){
    const [c,i]=await Promise.all([
      sb.from('central_ym_client_approval_metrics').select('*'),
      sb.from('central_ym_approval_metrics').select('approval_id,client_id,title,versions_sent,adjustment_requests,approved_first_version,approved_at,reviewed_by_client,scheduled_at').eq('reviewed_by_client',true).order('scheduled_at',{ascending:true}).limit(200)
    ]);
    if(c.error)throw c.error;if(i.error)throw i.error;
    const names=new Map<string,string>();
    const ids=[...new Set((c.data||[]).map((x:any)=>x.client_id))];
    if(ids.length){const n=await sb.from('crm_clients').select('id,contact:crm_contacts(name,business_name)').in('id',ids);for(const x of n.data||[]){const ct=one((x as any).contact);names.set((x as any).id,ct?.business_name||ct?.name||'Cliente');}}
    return {clients:(c.data||[]).map((x:any)=>({...x,client_name:names.get(x.client_id)||'Cliente'})),items:i.data||[]};
  }

  const slug=(v:unknown)=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'peca';
  async function posts(filter:(q:any)=>any){
    const iq=await filter(sb.from('client_approval_items').select('id,client_id,title,content_type,description,status,due_at,scheduled_at,content_id,client:crm_clients(contact:crm_contacts(name,business_name))')).limit(80);
    if(iq.error)throw iq.error;
    const items=iq.data||[];if(!items.length)return [];
    const ids=items.map((x:any)=>x.id);
    const [vq,aq]=await Promise.all([
      sb.from('client_approval_versions').select('id,approval_id,version_number,content_snapshot,change_summary,notes,sent_at,created_at,visible_to_client').in('approval_id',ids).eq('visible_to_client',true),
      sb.from('client_approval_actions').select('approval_id,version_id,action,comment,created_at,actor_type,actor_email').in('approval_id',ids).order('created_at',{ascending:false})
    ]);
    if(vq.error)throw vq.error;if(aq.error)throw aq.error;
    const out=items.map((it:any)=>{
      const vs=(vq.data||[]).filter((v:any)=>v.approval_id===it.id).sort((a:any,b:any)=>b.version_number-a.version_number);
      const v:any=vs[0]||null,s:any=v?.content_snapshot||{};
      const ct=one(one(it.client)?.contact);const client_name=ct?.business_name||ct?.name||'Cliente';
      const paths=(s.asset_images?.instagram||[]).filter((p:unknown)=>typeof p==='string');
      const vnum=new Map(vs.map((x:any)=>[x.id,x.version_number]));
      const seen=new Set<string>();
      const history=(aq.data||[]).filter((a:any)=>a.approval_id===it.id).filter((a:any)=>{const k=[a.version_id,a.action,a.comment||''].join('|');if(seen.has(k))return false;seen.add(k);return true}).map((a:any)=>({action:a.action,comment:a.comment,created_at:a.created_at,actor_type:a.actor_type,version_number:vnum.get(a.version_id)||null}));
      return {approval_id:it.id,client_id:it.client_id,client_name,title:it.title,content_type:it.content_type,description:it.description,status:it.status,due_at:it.due_at,scheduled_at:it.scheduled_at,
        version_number:v?.version_number||null,version_count:vs.length,change_summary:v?.change_summary||null,sent_at:v?.sent_at||null,
        caption:s.caption_instagram||'',hook:s.hook||'',cta_text:s.cta_text||'',hashtags:Array.isArray(s.hashtags)?s.hashtags:[],client_notes:s.client_notes||'',recording_notes:s.recording_notes||'',reel_script:Array.isArray(s.reel_script)?s.reel_script:[],
        images:paths.map((p:string,i:number)=>({path:p,name:`${slug(client_name)}-${slug(it.title)}-${String(i+1).padStart(2,'0')}.${(p.split('.').pop()||'jpg').toLowerCase()}`})),
        history};
    });
    const all=[...new Set(out.flatMap((r:any)=>r.images.map((x:any)=>x.path)))];
    const signed=new Map<string,string>();
    if(all.length){const s=await sb.storage.from(BUCKET).createSignedUrls(all,60*60*12);if(!s.error)for(const x of s.data||[])if(x.path&&x.signedUrl)signed.set(x.path,x.signedUrl);}
    for(const r of out as any[])for(const im of r.images){const u=signed.get(im.path)||'';im.url=u;im.download_url=u?u+(u.includes('?')?'&':'?')+'download='+encodeURIComponent(im.name):'';}
    return out;
  }

  try{
    if(action==='POSTS'){
      const from=new Date(String(b.from||'')),to=new Date(String(b.to||''));
      if(isNaN(+from)||isNaN(+to)||+to<=+from||+to-+from>40*86400000)return reply(400,{ok:false,error:'invalid_range'},origin);
      const late=new Date(+from-21*86400000);
      const [day,overdue]=await Promise.all([
        posts((q:any)=>q.gte('scheduled_at',from.toISOString()).lt('scheduled_at',to.toISOString()).neq('status','CANCELADO').order('scheduled_at',{ascending:true})),
        posts((q:any)=>q.eq('status','APROVADO').gte('scheduled_at',late.toISOString()).lt('scheduled_at',from.toISOString()).order('scheduled_at',{ascending:true}))
      ]);
      return reply(200,{ok:true,posts:day,overdue},origin);
    }
    if(action==='POST'){
      if(!uuid(b.approval_id))return reply(400,{ok:false,error:'approval_id_required'},origin);
      const r=await posts((q:any)=>q.eq('id',b.approval_id));
      if(!r.length)return reply(404,{ok:false,error:'not_found'},origin);
      return reply(200,{ok:true,post:r[0]},origin);
    }
    if(action==='MARK_PUBLISHED'){
      if(!uuid(b.approval_id))return reply(400,{ok:false,error:'approval_id_required'},origin);
      const q=await sb.from('client_approval_items').update({status:'PUBLICADO',updated_by:email}).eq('id',b.approval_id).eq('status','APROVADO').select('id');
      if(q.error)throw q.error;if(!(q.data||[]).length)return reply(409,{ok:false,error:'not_approved',detail:'Só peças aprovadas podem ser marcadas como publicadas.'},origin);
      await sb.from('vos_access_audit').insert({email,role:ia.data.role,event:'CENTRAL_YM_POST_PUBLISHED',metadata:{approval_id:b.approval_id}});
      const r=await posts((q:any)=>q.eq('id',b.approval_id));
      return reply(200,{ok:true,post:r[0]||null},origin);
    }
    if(action==='MARK_READ'){
      if(!uuid(b.id))return reply(400,{ok:false,error:'id_required'},origin);
      const q=await sb.from('central_ym_inbox').update({read_at:new Date().toISOString(),read_by:email}).eq('id',b.id).is('read_at',null);if(q.error)throw q.error;
    }else if(action==='MARK_ALL_READ'){
      const q=await sb.from('central_ym_inbox').update({read_at:new Date().toISOString(),read_by:email}).is('read_at',null);if(q.error)throw q.error;
    }else if(action==='SEND_REVISION'){
      if(!uuid(b.version_id))return reply(400,{ok:false,error:'version_id_required'},origin);
      const q=await sb.rpc('central_ym_send_revision',{p_version_id:b.version_id,p_actor:email});if(q.error)throw q.error;
      await sb.from('vos_access_audit').insert({email,role:ia.data.role,event:'CENTRAL_YM_REVISION_SENT',metadata:{version_id:b.version_id,result:q.data}});
    }else if(action==='DISCARD_REVISION'){
      if(!uuid(b.version_id))return reply(400,{ok:false,error:'version_id_required'},origin);
      const q=await sb.from('client_approval_versions').delete().eq('id',b.version_id).eq('visible_to_client',false);if(q.error)throw q.error;
      await sb.from('vos_access_audit').insert({email,role:ia.data.role,event:'CENTRAL_YM_REVISION_DISCARDED',metadata:{version_id:b.version_id}});
    }else if(action!=='LIST')return reply(400,{ok:false,error:'unsupported_action'},origin);
    const since=new Date(Date.now()-60*86400000).toISOString();
    const [list,unread,revs,mets]=await Promise.all([
      sb.from('central_ym_inbox').select('id,client_id,approval_id,kind,title,message,actor_email,created_at,read_at,client:crm_clients(contact:crm_contacts(name,business_name)),item:client_approval_items(status,scheduled_at)').gte('created_at',since).order('created_at',{ascending:false}).limit(150),
      sb.from('central_ym_inbox').select('id',{count:'exact',head:true}).is('read_at',null),
      revisions(),
      metrics()
    ]);
    if(list.error)throw list.error;if(unread.error)throw unread.error;
    const items=(list.data||[]).map((x:any)=>{const c=one(x.client);const ct=one(c?.contact);const it=one(x.item);return {id:x.id,client_id:x.client_id,approval_id:x.approval_id,kind:x.kind,title:x.title,message:x.message,actor_email:x.actor_email,created_at:x.created_at,read_at:x.read_at,client_name:ct?.business_name||ct?.name||'Cliente',item_status:it?.status||null,scheduled_at:it?.scheduled_at||null,has_draft:revs.some((r:any)=>r.approval_id===x.approval_id)};});
    return reply(200,{ok:true,unread:unread.count||0,items,revisions:revs,metrics:mets},origin);
  }catch(e:any){console.error('central-ym-inbox',action,e?.message||e);return reply(409,{ok:false,error:'inbox_failed',detail:String(e?.message||e).slice(0,400)},origin);}
});

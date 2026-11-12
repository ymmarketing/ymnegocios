import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/* Central YM · respostas dos clientes, novas versões e métricas de ajustes (11/11/2026)
   LIST                      → respostas recentes + total não lido + versões em rascunho (antes × depois) + métricas
   MARK_READ {id}            → marca uma resposta como vista
   MARK_ALL_READ             → marca todas como vistas
   SEND_REVISION {version_id}→ libera a nova versão para o cliente (a anterior fica guardada)
   DISCARD_REVISION {version_id} → descarta um rascunho que ainda não foi enviado
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

  try{
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

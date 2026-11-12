import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/* Central YM · sino de respostas dos clientes (11/11/2026)
   LIST           → respostas recentes + total não lido
   MARK_READ {id} → marca uma como vista
   MARK_ALL_READ  → marca todas como vistas
   Tabela central_ym_inbox é preenchida pelo gatilho trg_central_ym_client_approval_alert
   (client_approval_actions, actor_type = CLIENTE). */
const PROD='https://ymnegocios.com.br';
const ORIGINS=new Set([PROD,'https://www.ymnegocios.com.br','http://localhost:3000','http://localhost:5173']);
const headers=(o:string|null)=>({'Access-Control-Allow-Origin':o&&ORIGINS.has(o)?o:PROD,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',Vary:'Origin'});
const reply=(s:number,b:unknown,o:string|null)=>new Response(JSON.stringify(b),{status:s,headers:headers(o)});
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

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
  try{
    if(action==='MARK_READ'){
      if(!uuid(b.id))return reply(400,{ok:false,error:'id_required'},origin);
      const q=await sb.from('central_ym_inbox').update({read_at:new Date().toISOString(),read_by:email}).eq('id',b.id).is('read_at',null);if(q.error)throw q.error;
    }else if(action==='MARK_ALL_READ'){
      const q=await sb.from('central_ym_inbox').update({read_at:new Date().toISOString(),read_by:email}).is('read_at',null);if(q.error)throw q.error;
    }else if(action!=='LIST')return reply(400,{ok:false,error:'unsupported_action'},origin);
    const since=new Date(Date.now()-60*86400000).toISOString();
    const [list,unread]=await Promise.all([
      sb.from('central_ym_inbox').select('id,client_id,approval_id,kind,title,message,actor_email,created_at,read_at,client:crm_clients(contact:crm_contacts(name,business_name)),item:client_approval_items(status,scheduled_at)').gte('created_at',since).order('created_at',{ascending:false}).limit(150),
      sb.from('central_ym_inbox').select('id',{count:'exact',head:true}).is('read_at',null)
    ]);
    if(list.error)throw list.error;if(unread.error)throw unread.error;
    const items=(list.data||[]).map((x:any)=>{const c=Array.isArray(x.client)?x.client[0]:x.client;const ct=Array.isArray(c?.contact)?c.contact[0]:c?.contact;const it=Array.isArray(x.item)?x.item[0]:x.item;return {id:x.id,client_id:x.client_id,approval_id:x.approval_id,kind:x.kind,title:x.title,message:x.message,actor_email:x.actor_email,created_at:x.created_at,read_at:x.read_at,client_name:ct?.business_name||ct?.name||'Cliente',item_status:it?.status||null,scheduled_at:it?.scheduled_at||null};});
    return reply(200,{ok:true,unread:unread.count||0,items},origin);
  }catch(e:any){console.error('central-ym-inbox',action,e?.message||e);return reply(409,{ok:false,error:'inbox_failed',detail:String(e?.message||e).slice(0,400)},origin);}
});

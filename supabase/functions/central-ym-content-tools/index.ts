import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

/* Central YM · ferramentas internas de arte e versões (chave x-ym-cron-key = ym_team_alert_key)
   SIGN {paths[], ttl?}                         → links assinados temporários (bucket client-content)
   IMPORT {items:[{url,path}]}                  → copia artes novas do repositório ymmarketing para o bucket (nunca sobrescreve)
   PREPARE_REVISION {approval_id, patch, change_summary, responds_to_action_id?, actor?}
                                                → cria a próxima versão como RASCUNHO interno (cliente não vê)
   COMPOSE {src_path, overlay_url, x, y, dest_path} → aplica um recorte (PNG do repositório) sobre uma arte e salva como arquivo NOVO
   TRANSFORM {src_path, dest_path, crop:{x,y,w,h}, out_w, out_h} → recorta e reenquadra (preenche out_w×out_h, corte centralizado) em arquivo NOVO
   PROFILE {src_path, x, y, w, h, thr?}          → mapa de tinta (linhas/colunas com texto) para alinhar ajustes com precisão
   SEND_REVISION {version_id, actor?}           → aplica a versão ao conteúdo e libera para o cliente
   As versões anteriores ficam guardadas em client_approval_versions.content_snapshot. */
const BUCKET='client-content';
const json=(s:number,b:unknown)=>new Response(JSON.stringify(b),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
Deno.serve(async(req:Request)=>{
  if(req.method!=='POST')return json(405,{ok:false});
  const su=Deno.env.get('SUPABASE_URL')!,sk=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const sb=createClient(su,sk,{auth:{persistSession:false,autoRefreshToken:false}});
  const ok=await sb.rpc('central_ym_check_team_alert_key',{p_key:req.headers.get('x-ym-cron-key')||''});
  if(ok.error||ok.data!==true)return json(401,{ok:false,error:'invalid_key'});
  let b:any={};try{b=await req.json();}catch{return json(400,{ok:false,error:'invalid_json'});}
  const action=String(b.action||'').toUpperCase();
  const actor=typeof b.actor==='string'&&b.actor?b.actor.slice(0,200):'claude:central-ym';
  try{
    if(action==='SIGN'){
      const paths=(Array.isArray(b.paths)?b.paths:[]).filter((p:any)=>typeof p==='string').slice(0,60);
      const ttl=Math.min(Math.max(Number(b.ttl)||3600,60),86400);
      const {data,error}=await sb.storage.from(BUCKET).createSignedUrls(paths,ttl);if(error)throw error;
      return json(200,{ok:true,urls:(data||[]).map((d:any)=>({path:d.path,url:d.signedUrl}))});
    }
    if(action==='IMPORT'){
      const out:any[]=[];
      for(const it of (Array.isArray(b.items)?b.items:[]).slice(0,30)){
        const url=String(it?.url||''),path=String(it?.path||'');
        if(!/^https:\/\/raw\.githubusercontent\.com\/ymmarketing\//.test(url)||!/^[0-9a-f-]{36}\/[\w\-./]+\.(jpg|jpeg|png)$/i.test(path)||path.includes('..')){out.push({path,error:'invalid'});continue;}
        const r=await fetch(url);if(!r.ok){out.push({path,error:'fetch_'+r.status});continue;}
        const bytes=new Uint8Array(await r.arrayBuffer());
        const up=await sb.storage.from(BUCKET).upload(path,bytes,{contentType:/\.png$/i.test(path)?'image/png':'image/jpeg',upsert:false});
        out.push({path,size:bytes.length,error:up.error?.message||null});
      }
      return json(200,{ok:true,items:out});
    }
    if(action==='COMPOSE'){
      const src=String(b.src_path||''),dest=String(b.dest_path||''),ov=String(b.overlay_url||'');
      const okPath=(p:string)=>/^[0-9a-f-]{36}\/[\w\-./]+\.(jpg|jpeg)$/i.test(p)&&!p.includes('..');
      if(!okPath(src)||!okPath(dest)||src===dest||!/^https:\/\/raw\.githubusercontent\.com\/ymmarketing\//.test(ov))return json(400,{ok:false,error:'invalid_params'});
      const dl=await sb.storage.from(BUCKET).download(src);if(dl.error)throw dl.error;
      const base=await Image.decode(new Uint8Array(await dl.data.arrayBuffer()));
      const r=await fetch(ov);if(!r.ok)return json(400,{ok:false,error:'overlay_fetch_'+r.status});
      const over=await Image.decode(new Uint8Array(await r.arrayBuffer()));
      base.composite(over,Math.round(Number(b.x)||0),Math.round(Number(b.y)||0));
      const out=await base.encodeJPEG(92);
      const up=await sb.storage.from(BUCKET).upload(dest,out,{contentType:'image/jpeg',upsert:false});if(up.error)throw up.error;
      return json(200,{ok:true,dest,size:out.length,width:base.width,height:base.height});
    }
    if(action==='TRANSFORM'){
      const src=String(b.src_path||''),dest=String(b.dest_path||'');
      const okPath=(p:string)=>/^[0-9a-f-]{36}\/[\w\-./]+\.(jpg|jpeg)$/i.test(p)&&!p.includes('..');
      if(!okPath(src)||!okPath(dest)||src===dest)return json(400,{ok:false,error:'invalid_params'});
      const dl=await sb.storage.from(BUCKET).download(src);if(dl.error)throw dl.error;
      const img=await Image.decode(new Uint8Array(await dl.data.arrayBuffer()));
      const c=b.crop||{};const cx=Math.max(0,Math.round(c.x||0)),cy=Math.max(0,Math.round(c.y||0));
      const cw=Math.min(img.width-cx,Math.round(c.w||img.width)),ch=Math.min(img.height-cy,Math.round(c.h||img.height));
      img.crop(cx,cy,cw,ch);
      const ow=Math.round(Number(b.out_w)||img.width),oh=Math.round(Number(b.out_h)||img.height);
      const sc=Math.max(ow/img.width,oh/img.height);img.resize(Math.ceil(img.width*sc),Math.ceil(img.height*sc));
      img.crop(Math.floor((img.width-ow)/2),Math.floor((img.height-oh)/2),ow,oh);
      const out=await img.encodeJPEG(92);
      const up=await sb.storage.from(BUCKET).upload(dest,out,{contentType:'image/jpeg',upsert:false});if(up.error)throw up.error;
      return json(200,{ok:true,dest,size:out.length,width:img.width,height:img.height});
    }
    if(action==='PROFILE'){
      const src=String(b.src_path||'');if(!/^[0-9a-f-]{36}\/[\w\-./]+\.(jpg|jpeg)$/i.test(src))return json(400,{ok:false,error:'invalid_params'});
      const dl=await sb.storage.from(BUCKET).download(src);if(dl.error)throw dl.error;
      const img=await Image.decode(new Uint8Array(await dl.data.arrayBuffer()));const W=img.width,H=img.height,bm=img.bitmap;
      const x0=Math.max(0,Math.round(b.x||0)),y0=Math.max(0,Math.round(b.y||0)),w=Math.min(W-x0,Math.round(b.w||W)),h=Math.min(H-y0,Math.round(b.h||H));
      const lum=(x:number,y:number)=>{const i=(y*W+x)*4;return 0.299*bm[i]+0.587*bm[i+1]+0.114*bm[i+2];};
      const bi=(y0*W+x0)*4;const bg=[bm[bi],bm[bi+1],bm[bi+2]];const bgl=lum(x0,y0);const thr=Number(b.thr)||60;
      const rows:any[]=[];const cols=new Array(w).fill(0);
      const core=[0,0,0,0];for(let y=y0;y<y0+h;y++){let mn=-1,mx=-1,n=0;for(let x=x0;x<x0+w;x++){const d=bgl-lum(x,y);if(d>thr){if(mn<0)mn=x;mx=x;n++;cols[x-x0]++;}if(d>thr*2.2){const i=(y*W+x)*4;core[0]+=bm[i];core[1]+=bm[i+1];core[2]+=bm[i+2];core[3]++;}}if(n)rows.push([y,mn,mx,n]);}
      const ink=core[3]?[Math.round(core[0]/core[3]),Math.round(core[1]/core[3]),Math.round(core[2]/core[3]),core[3]]:null;
      const runs:any[]=[];let st=-1;for(let i=0;i<=w;i++){const on=i<w&&cols[i]>0;if(on&&st<0)st=i;if(!on&&st>=0){runs.push([x0+st,x0+i-1]);st=-1;}}
      return json(200,{ok:true,width:W,height:H,bg,ink,rows:b.no_rows?[]:rows,col_runs:runs});
    }
    if(action==='PREPARE_REVISION'){
      if(!uuid(b.approval_id))return json(400,{ok:false,error:'approval_id_required'});
      const q=await sb.rpc('central_ym_prepare_revision',{p_approval_id:b.approval_id,p_patch:b.patch||{},p_change_summary:String(b.change_summary||'').slice(0,4000)||null,p_responds_to:uuid(b.responds_to_action_id)?b.responds_to_action_id:null,p_actor:actor});
      if(q.error)throw q.error;return json(200,{ok:true,version_id:q.data});
    }
    if(action==='SEND_REVISION'){
      if(!uuid(b.version_id))return json(400,{ok:false,error:'version_id_required'});
      const q=await sb.rpc('central_ym_send_revision',{p_version_id:b.version_id,p_actor:actor});if(q.error)throw q.error;
      return json(200,{ok:true,result:q.data});
    }
    return json(400,{ok:false,error:'unsupported_action'});
  }catch(e:any){return json(500,{ok:false,error:String(e?.message||e).slice(0,400)});}
});

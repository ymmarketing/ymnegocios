/* YM Raio-X Digital 2.0 — cliente de evidências
 * Reencoda a imagem via canvas (remove EXIF), limita dimensão/peso e prepara upload.
 */
(function(root){
  'use strict';
  var cfg=function(){return root.RX_DIGITAL_V2&&root.RX_DIGITAL_V2.evidence||{};};
  var ACCEPT=['image/jpeg','image/png','image/webp'];

  function uuid(){
    if(root.crypto&&root.crypto.randomUUID)return root.crypto.randomUUID();
    return 'ev_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,10);
  }
  function loadImage(file){
    return new Promise(function(resolve,reject){
      var url=URL.createObjectURL(file),img=new Image();
      img.onload=function(){URL.revokeObjectURL(url);resolve(img);};
      img.onerror=function(){URL.revokeObjectURL(url);reject(new Error('imagem_invalida'));};
      img.src=url;
    });
  }
  function canvasBlob(canvas,type,quality){
    return new Promise(function(resolve,reject){canvas.toBlob(function(blob){blob?resolve(blob):reject(new Error('falha_reencode'));},type,quality);});
  }
  async function prepare(file,channel){
    if(!file)throw new Error('arquivo_ausente');
    var c=cfg(),accepted=c.accepted_types||ACCEPT;
    if(accepted.indexOf(file.type)<0)throw new Error('tipo_nao_permitido');
    var hardMax=Math.max(Number(c.client_target_bytes||2000000)*4,8000000);
    if(file.size>hardMax)throw new Error('arquivo_grande_demais');
    var img=await loadImage(file),max=Number(c.client_max_dimension||1800);
    var scale=Math.min(1,max/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
    var w=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));
    var h=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
    var canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    var ctx=canvas.getContext('2d',{alpha:false});
    ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(img,0,0,w,h);
    var target=Number(c.client_target_bytes||2000000),quality=.88,blob=null;
    var outType=file.type==='image/png'?'image/jpeg':file.type;
    for(var i=0;i<5;i++){
      blob=await canvasBlob(canvas,outType,quality);
      if(blob.size<=target||quality<=.55)break;
      quality-=.09;
    }
    var id=uuid(),preview=URL.createObjectURL(blob);
    return {
      evidence_id:id,
      channel:channel,
      blob:blob,
      local_preview_url:preview,
      mime_type:blob.type,
      size_bytes:blob.size,
      width:w,
      height:h,
      original_name:file.name||null,
      upload_status:'local_preview',
      storage_provider:null,
      storage_file_id:null,
      vision_analysis:null,
      vision_confidence:null
    };
  }
  function revoke(e){try{if(e&&e.local_preview_url)URL.revokeObjectURL(e.local_preview_url);}catch(x){}}
  function formData(e,ref){
    var fd=new FormData();
    fd.append('file',e.blob,'evidence.'+(e.mime_type==='image/webp'?'webp':'jpg'));
    fd.append('channel',e.channel||'');
    if(ref)fd.append('ref',ref);
    fd.append('evidence_id',e.evidence_id||uuid());
    fd.append('width',String(e.width||''));fd.append('height',String(e.height||''));
    return fd;
  }
  async function upload(e,opts){
    opts=opts||{};var endpoint=opts.endpoint||'https://ym-raiox-backend.vercel.app/api/raiox/evidence/upload';
    var resp=await fetch(endpoint,{method:'POST',body:formData(e,opts.ref),cache:'no-store',credentials:'omit'});
    var data=await resp.json().catch(function(){return {};});
    if(!resp.ok||!data.ok)throw new Error(data.error||('upload_'+resp.status));
    return Object.assign({},e,data.evidence||{}, {blob:null,upload_status:'uploaded'});
  }
  root.RX_DIGITAL_EVIDENCE={prepare:prepare,revoke:revoke,formData:formData,upload:upload};
})(window);

/* YM Raio-X Digital 2.0 — driver agrupado
 * Mantém as perguntas e respostas intactas; altera apenas a paginação de UX.
 */
(function(root){
  'use strict';
  function esc(v){return String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}
  function selectedChannels(A){return Array.isArray(A.RXD07)?A.RXD07:[];}
  function byId(cfg,id){return cfg.questions.find(function(q){return q.id===id;});}
  function qVisible(q,A){if(!q)return false;if(!q.depends_on)return true;var dep=A[q.depends_on];return Array.isArray(dep)?dep.length>0:!!dep;}
  function pageDefs(cfg){return Array.isArray(cfg.pages)&&cfg.pages.length?cfg.pages:cfg.questions.map(function(q){return {id:q.id,stage:q.block||'',title:'',question_ids:[q.id]};});}
  function visiblePages(cfg,A){return pageDefs(cfg).map(function(p){var qs=(p.question_ids||[]).map(function(id){return byId(cfg,id);}).filter(function(q){return qVisible(q,A);});return {id:p.id,stage:p.stage,title:p.title,questions:qs};}).filter(function(p){return p.questions.length>0;});}
  function evidenceSteps(cfg,A){var rules=cfg.evidence&&cfg.evidence.channel_rules||{},out=[];selectedChannels(A).forEach(function(c){if(rules[c])out.push({kind:'evidence',channel:c,rule:rules[c]});});return out;}
  function sel(rootEl,selector){return rootEl.querySelector(selector);}
  function selAll(rootEl,selector){return Array.from(rootEl.querySelectorAll(selector));}

  function renderText(q,v){var tag=q.t==='textarea'?'textarea':'input',close=q.t==='textarea'?'</textarea>':'';var value=q.t==='textarea'?esc(v||''):'';var valAttr=q.t==='textarea'?'':' value="'+esc(v||'')+'"';return '<'+tag+' class="rxd-input '+(q.t==='textarea'?'rxd-area':'')+'" data-input-qid="'+esc(q.id)+'"'+valAttr+' placeholder="'+esc(q.ph||'')+'">'+value+close;}
  function renderScore(q,v,naLabel){var h='<div class="rxd-options">';(q.options||[]).forEach(function(o,i){h+='<button type="button" class="rxd-opt '+(v===i?'sel':'')+'" data-score-qid="'+esc(q.id)+'" data-score-value="'+i+'"><span class="rxd-radio"></span><span>'+esc(o)+'</span></button>';});if(q.allow_na)h+='<button type="button" class="rxd-opt '+(v==='nao_sei'?'sel':'')+'" data-score-qid="'+esc(q.id)+'" data-score-value="nao_sei"><span class="rxd-radio"></span><span>'+esc(naLabel)+'</span></button>';return h+'</div>';}
  function renderMulti(q,v){v=Array.isArray(v)?v:[];return '<div class="rxd-checks">'+(q.options||[]).map(function(o){return '<label class="rxd-check"><input type="checkbox" data-multi-qid="'+esc(q.id)+'" value="'+esc(o)+'" '+(v.indexOf(o)>=0?'checked':'')+'><span>'+esc(o)+'</span></label>';}).join('')+'</div>';}
  function renderChannelLinks(q,A){var old=A[q.id]&&typeof A[q.id]==='object'?A[q.id]:{};return '<div class="rxd-linkgrid">'+selectedChannels(A).map(function(c){return '<label><span>'+esc(c)+'</span><input class="rxd-input rxd-link" data-links-qid="'+esc(q.id)+'" data-channel="'+esc(c)+'" value="'+esc(old[c]||'')+'" placeholder="Link ou @"></label>';}).join('')+'</div>';}
  function renderPrimary(q,A,naLabel){var v=A[q.id];return '<div class="rxd-options">'+selectedChannels(A).map(function(c){return '<button type="button" class="rxd-opt '+(v===c?'sel':'')+'" data-primary-qid="'+esc(q.id)+'" data-primary-value="'+esc(c)+'"><span class="rxd-radio"></span><span>'+esc(c)+'</span></button>';}).join('')+(q.allow_na?'<button type="button" class="rxd-opt '+(v==='nao_sei'?'sel':'')+'" data-primary-qid="'+esc(q.id)+'" data-primary-value="nao_sei"><span class="rxd-radio"></span><span>'+esc(naLabel)+'</span></button>':'')+'</div>';}
  function renderGroup(q,v){v=v&&typeof v==='object'?v:{};return '<div class="rxd-group">'+(q.fields||[]).map(function(f){return '<label><span>'+esc(f.label)+'</span><textarea class="rxd-input rxd-area rxd-group-input" data-group-qid="'+esc(q.id)+'" data-key="'+esc(f.key)+'">'+esc(v[f.key]||'')+'</textarea></label>';}).join('')+'</div>';}
  function renderQuestion(q,A,cfg){var v=A[q.id],h='<section class="rxd-question" data-question="'+esc(q.id)+'"><h2>'+esc(q.q)+'</h2>';if(q.ph)h+='<p class="rxd-hint">'+esc(q.ph)+'</p>';if(q.t==='text'||q.t==='textarea')h+=renderText(q,v);else if(q.t==='score')h+=renderScore(q,v,cfg.na_label);else if(q.t==='multi')h+=renderMulti(q,v);else if(q.t==='channel_links')h+=renderChannelLinks(q,A);else if(q.t==='channel_primary')h+=renderPrimary(q,A,cfg.na_label);else if(q.t==='group_textarea')h+=renderGroup(q,v);return h+'</section>';}

  function mount(el,opts){
    opts=opts||{};var cfg=root.RX_DIGITAL_V2;if(!cfg)throw new Error('RX_DIGITAL_V2_ausente');
    var A=opts.answers||{},evidence=opts.evidence||[],pidx=0,phase='questions',eidx=0,busy=false;
    var realUpload=!!opts.ref&&opts.uploadEvidence!==false;

    function pages(){return visiblePages(cfg,A);}
    function currentPage(){var list=pages();if(pidx>=list.length)pidx=Math.max(0,list.length-1);return list[pidx];}
    function progress(){var pn=pages().length,evn=evidenceSteps(cfg,A).length,total=pn+evn,done=phase==='questions'?pidx:pn+eidx;return total?Math.round(done/total*100):0;}

    function saveQuestion(q){
      if(q.t==='text'||q.t==='textarea'){var x=sel(el,'[data-input-qid="'+q.id+'"]');A[q.id]=(x&&x.value||'').trim();}
      else if(q.t==='multi'){A[q.id]=selAll(el,'[data-multi-qid="'+q.id+'"]:checked').map(function(x){return x.value;});}
      else if(q.t==='channel_links'){var o={};selAll(el,'[data-links-qid="'+q.id+'"]').forEach(function(x){if(x.value.trim())o[x.dataset.channel]=x.value.trim();});A[q.id]=o;}
      else if(q.t==='group_textarea'){var g={};selAll(el,'[data-group-qid="'+q.id+'"]').forEach(function(x){g[x.dataset.key]=x.value.trim();});A[q.id]=g;}
    }
    function savePage(page){(page.questions||[]).forEach(saveQuestion);}
    function validQuestion(q){var v=A[q.id];if(!q.required&&!q.obrig)return true;if(q.t==='multi')return Array.isArray(v)&&v.length>0;if(q.t==='channel_links')return selectedChannels(A).every(function(c){return !!(v&&v[c]);});if(q.t==='channel_primary')return !!v;if(q.t==='score')return typeof v==='number'||v==='nao_sei';if(q.t==='group_textarea')return (q.fields||[]).every(function(f){return !!(v&&v[f.key]&&v[f.key].trim());});return !!String(v||'').trim();}
    function validPage(page){return (page.questions||[]).every(validQuestion);}
    function selectedEvidence(channel){return evidence.filter(function(e){return e.channel===channel;});}
    function evidenceRequired(step){return !!step.rule.required_if_selected;}
    function replaceEvidence(channel,next){evidence.filter(function(e){return e.channel===channel&&e!==next;}).forEach(root.RX_DIGITAL_EVIDENCE.revoke);evidence=evidence.filter(function(e){return e.channel!==channel;});evidence.push(next);}

    async function onFile(step,file){
      if(busy)return;busy=true;
      try{
        var prepared=await root.RX_DIGITAL_EVIDENCE.prepare(file,step.channel);prepared.source_url=(A.RXD08&&A.RXD08[step.channel])||null;replaceEvidence(step.channel,prepared);render();
        if(realUpload){prepared.upload_status='uploading';render();try{var uploaded=await root.RX_DIGITAL_EVIDENCE.upload(prepared,{ref:opts.ref,token_endpoint:opts.token_endpoint});uploaded.local_preview_url=prepared.local_preview_url;replaceEvidence(step.channel,uploaded);}catch(uploadErr){prepared.upload_status='failed';prepared.upload_error=uploadErr&&uploadErr.message||'upload_failed';replaceEvidence(step.channel,prepared);}render();}
      }finally{busy=false;}
    }
    function finish(){
      if(busy)return;if(realUpload&&evidence.some(function(e){return e.upload_status==='uploading';})){alert('Aguarde o envio dos prints terminar.');return;}if(realUpload&&evidence.some(function(e){return e.upload_status==='failed';})){alert('Existe um print que não foi armazenado. Tente reenviar antes de gerar o Raio-X.');return;}
      var packet=root.RX_DIGITAL_ENGINE.buildPacket(A,evidence,{source_system:opts.source_system||'rxd2_preview'});if(typeof opts.onFinish==='function')opts.onFinish(packet,A,evidence);else if(root.RX_DIGITAL_REPORT){el.innerHTML='<div id="repbody"></div>';root.RX_DIGITAL_REPORT.render(packet,document.getElementById('repbody'));}
    }
    function next(){
      if(busy)return;
      if(phase==='questions'){
        var page=currentPage();savePage(page);if(!validPage(page)){alert('Preencha todas as perguntas desta etapa para continuar.');return;}
        var list=pages();if(pidx<list.length-1){pidx++;render();return;}phase='evidence';eidx=0;if(!evidenceSteps(cfg,A).length){finish();return;}render();return;
      }
      var evs=evidenceSteps(cfg,A),step=evs[eidx],found=selectedEvidence(step.channel)[0];if(evidenceRequired(step)&&!found){alert('Envie o print solicitado para este canal.');return;}if(realUpload&&found&&found.upload_status!=='uploaded'){alert('O print deste canal ainda não foi armazenado com segurança. Reenvie e aguarde a confirmação.');return;}if(eidx<evs.length-1){eidx++;render();}else finish();
    }
    function back(){if(busy)return;if(phase==='evidence'){if(eidx>0){eidx--;render();return;}phase='questions';pidx=Math.max(0,pages().length-1);render();return;}if(pidx>0){savePage(currentPage());pidx--;render();}}
    function evidenceStatus(e){if(!e)return '';if(e.upload_status==='uploading')return ' · enviando com segurança…';if(e.upload_status==='uploaded')return ' · armazenado ✓';if(e.upload_status==='failed')return ' · falha no envio';return realUpload?' · pronto para enviar':' · preview local';}

    function render(){
      var p=progress(),h='<div class="rxd-form"><div class="rxd-progress"><i style="width:'+p+'%"></i></div>';
      if(phase==='questions'){
        var page=currentPage(),list=pages();h+='<div class="rxd-stage">'+esc(page.stage||'Raio-X Digital')+'</div><div class="rxd-count">Etapa '+(pidx+1)+' de '+list.length+'</div>';
        if(page.title)h+='<div class="rxd-page-title">'+esc(page.title)+'</div>';
        (page.questions||[]).forEach(function(q){h+=renderQuestion(q,A,cfg);});
      }else{
        var step=evidenceSteps(cfg,A)[eidx],existing=selectedEvidence(step.channel)[0];h+='<div class="rxd-stage">Evidências da presença digital</div><div class="rxd-count">Print '+(eidx+1)+' de '+evidenceSteps(cfg,A).length+'</div><div class="rxd-page-title">'+esc(step.rule.label)+'</div><p class="rxd-hint">'+esc(step.rule.instruction)+'</p><div class="rxd-privacy">'+esc(cfg.evidence.privacy_notice)+'</div>';h+='<label class="rxd-upload"><input id="rxdfile" type="file" accept="image/jpeg,image/png,image/webp" '+(busy?'disabled':'')+'><b>'+(existing?'Trocar print':'Selecionar print')+'</b><span>JPEG, PNG ou WebP · a imagem será comprimida e reencodada antes do envio</span></label>';if(existing)h+='<div class="rxd-preview"><img src="'+esc(existing.local_preview_url||'')+'"><div><b>'+esc(step.channel)+'</b><span>'+Math.round((existing.size_bytes||0)/1024)+' KB · '+esc(existing.width||'—')+'×'+esc(existing.height||'—')+esc(evidenceStatus(existing))+'</span>'+(existing.upload_status==='failed'?'<span style="color:#b42318">'+esc(existing.upload_error||'Falha no envio')+'</span>':'')+'</div></div>';if(!step.rule.required_if_selected)h+='<button class="rxd-skip" type="button" id="rxdskip">Seguir sem print deste canal</button>';
      }
      h+='<div class="rxd-nav"><button type="button" class="rxd-back" id="rxdback" '+(phase==='questions'&&pidx===0?'disabled':'')+'>Voltar</button><button type="button" class="rxd-next" id="rxdnext" '+(busy?'disabled':'')+'>'+(busy?'Enviando…':(phase==='evidence'&&eidx===evidenceSteps(cfg,A).length-1?'Gerar Raio-X':'Continuar'))+'</button></div></div>';el.innerHTML=h;
      document.getElementById('rxdback').onclick=back;document.getElementById('rxdnext').onclick=next;
      selAll(el,'[data-score-qid]').forEach(function(b){b.onclick=function(){savePage(currentPage());A[b.dataset.scoreQid]=b.dataset.scoreValue==='nao_sei'?'nao_sei':Number(b.dataset.scoreValue);render();};});
      selAll(el,'[data-primary-qid]').forEach(function(b){b.onclick=function(){savePage(currentPage());A[b.dataset.primaryQid]=b.dataset.primaryValue;render();};});
      var file=document.getElementById('rxdfile');if(file)file.onchange=function(){if(file.files&&file.files[0])onFile(evidenceSteps(cfg,A)[eidx],file.files[0]).catch(function(e){busy=false;alert('Não foi possível preparar o print: '+e.message);render();});};var skip=document.getElementById('rxdskip');if(skip)skip.onclick=function(){if(eidx<evidenceSteps(cfg,A).length-1){eidx++;render();}else finish();};
    }
    render();return {answers:A,getEvidence:function(){return evidence.slice();},finish:finish,render:render,getPages:pages};
  }
  root.RX_DIGITAL_DRIVER={mount:mount};
})(window);

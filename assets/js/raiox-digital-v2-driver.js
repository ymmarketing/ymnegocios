/* YM Raio-X Digital 2.0 — driver de formulário adaptativo
 * Homologação: suporta tipos V2 e evidências condicionais em memória.
 */
(function(root){
  'use strict';
  function esc(v){return String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}
  function qs(id){return document.getElementById(id);}
  function selectedChannels(A){return Array.isArray(A.RXD07)?A.RXD07:[];}
  function stageLabel(q){return ({BASE_NEGOCIO:'Base do negócio',PRESENCA_DIGITAL:'Presença digital',CONTEUDO_AUTORIDADE:'Conteúdo, autoridade e confiança',CONVERSAO_RELACIONAMENTO:'Conversão, relacionamento e medição',CONTEXTO_DESTINO:'Contexto e destino'})[q.block]||q.block||'';}
  function visibleQuestions(cfg,A){return cfg.questions.filter(function(q){if(!q.depends_on)return true;var dep=A[q.depends_on];return Array.isArray(dep)?dep.length>0:!!dep;});}
  function evidenceSteps(cfg,A){
    var rules=cfg.evidence&&cfg.evidence.channel_rules||{},channels=selectedChannels(A),out=[];
    channels.forEach(function(c){if(rules[c])out.push({kind:'evidence',channel:c,rule:rules[c]});});
    return out;
  }
  function renderText(q,v){return q.t==='textarea'?'<textarea id="rxdinput" class="rxd-input rxd-area" placeholder="'+esc(q.ph||'')+'">'+esc(v||'')+'</textarea>':'<input id="rxdinput" class="rxd-input" value="'+esc(v||'')+'" placeholder="'+esc(q.ph||'')+'">';}
  function renderScore(q,v,naLabel){
    var h='<div class="rxd-options">';(q.options||[]).forEach(function(o,i){h+='<button type="button" class="rxd-opt '+(v===i?'sel':'')+'" data-score="'+i+'"><span class="rxd-radio"></span><span>'+esc(o)+'</span></button>';});
    if(q.allow_na)h+='<button type="button" class="rxd-opt '+(v==='nao_sei'?'sel':'')+'" data-score="nao_sei"><span class="rxd-radio"></span><span>'+esc(naLabel)+'</span></button>';
    return h+'</div>';
  }
  function renderMulti(q,v){
    v=Array.isArray(v)?v:[];return '<div class="rxd-checks">'+(q.options||[]).map(function(o){return '<label class="rxd-check"><input type="checkbox" value="'+esc(o)+'" '+(v.indexOf(o)>=0?'checked':'')+'><span>'+esc(o)+'</span></label>';}).join('')+'</div>';
  }
  function renderChannelLinks(q,A){
    var old=A[q.id]&&typeof A[q.id]==='object'?A[q.id]:{};return '<div class="rxd-linkgrid">'+selectedChannels(A).map(function(c){return '<label><span>'+esc(c)+'</span><input class="rxd-input rxd-link" data-channel="'+esc(c)+'" value="'+esc(old[c]||'')+'" placeholder="Link ou @"></label>';}).join('')+'</div>';
  }
  function renderPrimary(q,A,naLabel){
    var v=A[q.id];return '<div class="rxd-options">'+selectedChannels(A).map(function(c){return '<button type="button" class="rxd-opt '+(v===c?'sel':'')+'" data-primary="'+esc(c)+'"><span class="rxd-radio"></span><span>'+esc(c)+'</span></button>';}).join('')+(q.allow_na?'<button type="button" class="rxd-opt '+(v==='nao_sei'?'sel':'')+'" data-primary="nao_sei"><span class="rxd-radio"></span><span>'+esc(naLabel)+'</span></button>':'')+'</div>';
  }
  function renderGroup(q,v){v=v&&typeof v==='object'?v:{};return '<div class="rxd-group">'+(q.fields||[]).map(function(f){return '<label><span>'+esc(f.label)+'</span><textarea class="rxd-input rxd-area rxd-group-input" data-key="'+esc(f.key)+'">'+esc(v[f.key]||'')+'</textarea></label>';}).join('')+'</div>';}

  function mount(el,opts){
    opts=opts||{};var cfg=root.RX_DIGITAL_V2;if(!cfg)throw new Error('RX_DIGITAL_V2_ausente');
    var A=opts.answers||{},evidence=opts.evidence||[],idx=0,phase='questions',eidx=0;

    function allSteps(){return visibleQuestions(cfg,A);}
    function current(){var list=allSteps();if(idx>=list.length)idx=Math.max(0,list.length-1);return list[idx];}
    function progress(){var qn=allSteps().length,evn=evidenceSteps(cfg,A).length,total=qn+evn,done=phase==='questions'?idx:qn+eidx;return total?Math.round(done/total*100):0;}
    function saveQuestion(q){
      if(q.t==='text'||q.t==='textarea'){A[q.id]=(qs('rxdinput')&&qs('rxdinput').value||'').trim();}
      else if(q.t==='multi'){A[q.id]=Array.from(el.querySelectorAll('.rxd-check input:checked')).map(function(x){return x.value;});}
      else if(q.t==='channel_links'){var o={};el.querySelectorAll('.rxd-link').forEach(function(x){if(x.value.trim())o[x.dataset.channel]=x.value.trim();});A[q.id]=o;}
      else if(q.t==='group_textarea'){var g={};el.querySelectorAll('.rxd-group-input').forEach(function(x){g[x.dataset.key]=x.value.trim();});A[q.id]=g;}
    }
    function validQuestion(q){
      var v=A[q.id];if(!q.required&&!q.obrig)return true;
      if(q.t==='multi')return Array.isArray(v)&&v.length>0;
      if(q.t==='channel_links')return selectedChannels(A).every(function(c){return !!(v&&v[c]);});
      if(q.t==='channel_primary')return !!v;
      if(q.t==='score')return typeof v==='number'||v==='nao_sei';
      if(q.t==='group_textarea')return (q.fields||[]).every(function(f){return !!(v&&v[f.key]&&v[f.key].trim());});
      return !!String(v||'').trim();
    }
    function selectedEvidence(channel){return evidence.filter(function(e){return e.channel===channel;});}
    function evidenceRequired(step){return !!step.rule.required_if_selected;}

    async function onFile(step,file){
      var prepared=await root.RX_DIGITAL_EVIDENCE.prepare(file,step.channel);
      evidence.filter(function(e){return e.channel===step.channel;}).forEach(root.RX_DIGITAL_EVIDENCE.revoke);
      evidence=evidence.filter(function(e){return e.channel!==step.channel;});evidence.push(prepared);render();
    }
    function finish(){
      var packet=root.RX_DIGITAL_ENGINE.buildPacket(A,evidence,{source_system:opts.source_system||'rxd2_preview'});
      if(typeof opts.onFinish==='function')opts.onFinish(packet,A,evidence);
      else if(root.RX_DIGITAL_REPORT){el.innerHTML='<div id="repbody"></div>';root.RX_DIGITAL_REPORT.render(packet,qs('repbody'));}
    }
    function next(){
      if(phase==='questions'){
        var q=current();saveQuestion(q);if(!validQuestion(q)){alert('Preencha esta etapa para continuar.');return;}
        var list=allSteps();if(idx<list.length-1){idx++;render();return;}
        phase='evidence';eidx=0;if(!evidenceSteps(cfg,A).length){finish();return;}render();return;
      }
      var evs=evidenceSteps(cfg,A),step=evs[eidx];
      if(evidenceRequired(step)&&!selectedEvidence(step.channel).length){alert('Envie o print solicitado para este canal.');return;}
      if(eidx<evs.length-1){eidx++;render();}else finish();
    }
    function back(){
      if(phase==='evidence'){if(eidx>0){eidx--;render();return;}phase='questions';idx=Math.max(0,allSteps().length-1);render();return;}
      if(idx>0){saveQuestion(current());idx--;render();}
    }
    function render(){
      var p=progress(),h='<div class="rxd-form"><div class="rxd-progress"><i style="width:'+p+'%"></i></div>';
      if(phase==='questions'){
        var q=current(),v=A[q.id];h+='<div class="rxd-stage">'+esc(stageLabel(q))+'</div><div class="rxd-count">'+(idx+1)+' de '+allSteps().length+'</div><h2>'+esc(q.q)+'</h2>';
        if(q.ph)h+='<p class="rxd-hint">'+esc(q.ph)+'</p>';
        if(q.t==='text'||q.t==='textarea')h+=renderText(q,v);
        else if(q.t==='score')h+=renderScore(q,v,cfg.na_label);
        else if(q.t==='multi')h+=renderMulti(q,v);
        else if(q.t==='channel_links')h+=renderChannelLinks(q,A);
        else if(q.t==='channel_primary')h+=renderPrimary(q,A,cfg.na_label);
        else if(q.t==='group_textarea')h+=renderGroup(q,v);
      } else {
        var step=evidenceSteps(cfg,A)[eidx],existing=selectedEvidence(step.channel)[0];
        h+='<div class="rxd-stage">Evidências da presença digital</div><div class="rxd-count">Print '+(eidx+1)+' de '+evidenceSteps(cfg,A).length+'</div><h2>'+esc(step.rule.label)+'</h2><p class="rxd-hint">'+esc(step.rule.instruction)+'</p><div class="rxd-privacy">'+esc(cfg.evidence.privacy_notice)+'</div>';
        h+='<label class="rxd-upload"><input id="rxdfile" type="file" accept="image/jpeg,image/png,image/webp"><b>'+(existing?'Trocar print':'Selecionar print')+'</b><span>JPEG, PNG ou WebP · a imagem será comprimida e reencodada antes do envio</span></label>';
        if(existing)h+='<div class="rxd-preview"><img src="'+esc(existing.local_preview_url)+'"><div><b>'+esc(step.channel)+'</b><span>'+Math.round(existing.size_bytes/1024)+' KB · '+existing.width+'×'+existing.height+'</span></div></div>';
        if(!step.rule.required_if_selected)h+='<button class="rxd-skip" type="button" id="rxdskip">Seguir sem print deste canal</button>';
      }
      h+='<div class="rxd-nav"><button type="button" class="rxd-back" id="rxdback" '+(phase==='questions'&&idx===0?'disabled':'')+'>Voltar</button><button type="button" class="rxd-next" id="rxdnext">'+(phase==='evidence'&&eidx===evidenceSteps(cfg,A).length-1?'Gerar Raio-X':'Continuar')+'</button></div></div>';
      el.innerHTML=h;
      qs('rxdback').onclick=back;qs('rxdnext').onclick=next;
      el.querySelectorAll('[data-score]').forEach(function(b){b.onclick=function(){A[current().id]=b.dataset.score==='nao_sei'?'nao_sei':Number(b.dataset.score);render();};});
      el.querySelectorAll('[data-primary]').forEach(function(b){b.onclick=function(){A[current().id]=b.dataset.primary;render();};});
      var file=qs('rxdfile');if(file)file.onchange=function(){if(file.files&&file.files[0])onFile(evidenceSteps(cfg,A)[eidx],file.files[0]).catch(function(e){alert('Não foi possível preparar o print: '+e.message);});};
      var skip=qs('rxdskip');if(skip)skip.onclick=function(){if(eidx<evidenceSteps(cfg,A).length-1){eidx++;render();}else finish();};
    }
    render();
    return {answers:A,getEvidence:function(){return evidence.slice();},finish:finish,render:render};
  }
  root.RX_DIGITAL_DRIVER={mount:mount};
})(window);

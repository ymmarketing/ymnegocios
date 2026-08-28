/* YM Raio-X Digital 2.0 — motor determinístico
 * Contratos: RX_DIGITAL_2.0 -> RX_DIGITAL_SCORE_2.0 -> VOS_DIGITAL_INTAKE_2.0
 * Evidência visual NÃO altera score na fase 1.
 */
(function(root){
  'use strict';

  var SCORING_VERSION='RX_DIGITAL_SCORE_2.0';
  var PACKET_VERSION='VOS_DIGITAL_INTAKE_2.0';
  var REPORT_VERSION='RX_REPORT_2.0';

  var AXES={
    'Posicionamento digital':['RXD13'],
    'Presença e canais':['RXD11','RXD12'],
    'Clareza da mensagem':['RXD10','RXD21'],
    'Conteúdo e autoridade':['RXD15','RXD16','RXD17','RXD20'],
    'Prova e confiança':['RXD18','RXD19'],
    'Conversão e pontos de entrada':['RXD14','RXD22'],
    'Relacionamento e follow-up':['RXD23','RXD24'],
    'Medição e organização':['RXD25','RXD26']
  };

  var JOURNEY={
    'Encontrar':['RXD12','RXD15'],
    'Entender':['RXD10','RXD11','RXD13','RXD16','RXD21'],
    'Confiar':['RXD17','RXD18','RXD19'],
    'Avançar':['RXD14','RXD20','RXD22','RXD23'],
    'Sustentar':['RXD24','RXD25','RXD26']
  };

  function isNum(v){ return typeof v==='number' && isFinite(v); }
  function scoreValue(v){ return isNum(v) && v>=0 && v<=4 ? v : null; }
  function avg(xs){ return xs.length ? xs.reduce(function(a,b){return a+b;},0)/xs.length : null; }
  function pctFromValues(xs){ var a=avg(xs); return a==null ? null : Math.round((a/4)*1000)/10; }
  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

  function questionMap(){
    var cfg=root.RX_DIGITAL_V2;
    var map={};
    (cfg&&cfg.questions||[]).forEach(function(q){map[q.id]=q;});
    return map;
  }

  function scoreIds(){
    var cfg=root.RX_DIGITAL_V2;
    return (cfg&&cfg.questions||[]).filter(function(q){return q.score===true;}).map(function(q){return q.id;});
  }

  function scoreGroup(ids,answers){
    var vals=ids.map(function(id){return scoreValue(answers[id]);}).filter(function(v){return v!==null;});
    return {
      score:pctFromValues(vals),
      valid:vals.length,
      total:ids.length,
      coverage_pct:ids.length?Math.round((vals.length/ids.length)*100):0
    };
  }

  function classify(score,coverage){
    if(!coverage) return 'SEM_DADOS';
    if(score==null) return 'SEM_DADOS';
    if(score>=80) return 'FORTE';
    if(score>=60) return 'ESTRUTURADO';
    if(score>=40) return 'PARCIAL';
    return 'INICIAL';
  }

  function normalizedChannels(answers){
    var v=answers.RXD07;
    if(!Array.isArray(v)) return [];
    var allowed=(root.RX_DIGITAL_V2&&root.RX_DIGITAL_V2.channels)||[];
    return v.filter(function(x){return allowed.indexOf(x)>=0;});
  }

  function normalizeEvidence(evidence,channels){
    if(!Array.isArray(evidence)) return [];
    return evidence.map(function(e){
      return {
        evidence_id:e&&e.evidence_id||null,
        channel:e&&e.channel||null,
        source_url:e&&e.source_url||null,
        storage_provider:e&&e.storage_provider||null,
        storage_file_id:e&&e.storage_file_id||null,
        mime_type:e&&e.mime_type||null,
        width:e&&e.width||null,
        height:e&&e.height||null,
        size_bytes:e&&e.size_bytes||null,
        upload_status:e&&e.upload_status||'local_preview',
        vision_version:e&&e.vision_version||null,
        vision_analysis:e&&e.vision_analysis||null,
        vision_confidence:e&&e.vision_confidence||null,
        selected_channel:channels.indexOf(e&&e.channel)>=0
      };
    });
  }

  function declaredSignals(answers,qmap){
    return scoreIds().map(function(id){
      var q=qmap[id]||{};
      var raw=scoreValue(answers[id]);
      return {
        question_id:id,
        field_id:q.field_id||null,
        axis:q.axis||null,
        journey:q.journey||null,
        raw_level:raw,
        score_pct:raw==null?null:Math.round((raw/4)*100),
        answer_label:(raw!=null && q.options && q.options[raw]!=null)?q.options[raw]:null,
        source:'DECLARED'
      };
    });
  }

  function buildDigitalMap(answers,evidence){
    var channels=normalizedChannels(answers);
    var links=answers.RXD08&&typeof answers.RXD08==='object'?answers.RXD08:{};
    var primary=typeof answers.RXD09==='string'?answers.RXD09:null;
    var ev=normalizeEvidence(evidence,channels);
    return channels.map(function(channel){
      var matches=ev.filter(function(e){return e.channel===channel;});
      return {
        channel:channel,
        active:true,
        link:links[channel]||null,
        primary:primary===channel,
        evidence_ids:matches.map(function(e){return e.evidence_id;}).filter(Boolean),
        evidence_count:matches.length,
        vision_available:matches.some(function(e){return !!e.vision_analysis;})
      };
    });
  }

  function buildPacket(answers,evidence,meta){
    answers=answers||{};meta=meta||{};
    var qmap=questionMap();
    var ids=scoreIds();
    var overall=scoreGroup(ids,answers);
    var axes={};
    Object.keys(AXES).forEach(function(k){
      var g=scoreGroup(AXES[k],answers);
      axes[k]={score:g.score,coverage_pct:g.coverage_pct,valid:g.valid,total:g.total,classification:classify(g.score,g.coverage_pct)};
    });
    var journey={};
    Object.keys(JOURNEY).forEach(function(k){
      var g=scoreGroup(JOURNEY[k],answers);
      journey[k]={score:g.score,coverage_pct:g.coverage_pct,valid:g.valid,total:g.total,classification:classify(g.score,g.coverage_pct)};
    });
    var channels=normalizedChannels(answers);
    var normalizedEv=normalizeEvidence(evidence,channels);
    var visualCoverage=channels.length?Math.round(channels.filter(function(c){return normalizedEv.some(function(e){return e.channel===c;});}).length/channels.length*100):0;

    return {
      packet_version:PACKET_VERSION,
      questionnaire_version:(root.RX_DIGITAL_V2&&root.RX_DIGITAL_V2.questionnaire_version)||'RX_DIGITAL_2.0',
      scoring_version:SCORING_VERSION,
      evidence_version:(root.RX_DIGITAL_V2&&root.RX_DIGITAL_V2.evidence_version)||'RX_EVIDENCE_1.0',
      report_version:REPORT_VERSION,
      source_product:'RAIO_X_JORNADA_DIGITAL',
      source_system:meta.source_system||'ym_raiox_digital_v2_preview',
      collected_at:meta.collected_at||new Date().toISOString(),
      client_ref:answers.RXD02||meta.client_ref||null,
      score:{
        overall:overall.score==null?null:Math.round(overall.score),
        coverage_pct:overall.coverage_pct,
        status:overall.coverage_pct===100?'FINAL':'PARCIAL',
        axes:axes,
        journey:journey
      },
      digital_presence:{
        channels:buildDigitalMap(answers,normalizedEv),
        primary_channel:answers.RXD09||null,
        evidence_coverage_pct:visualCoverage
      },
      declared_signals:declaredSignals(answers,qmap),
      evidence:normalizedEv,
      business_context:{
        client_name:answers.RXD01||null,
        business_name:answers.RXD02||null,
        business_summary:answers.RXD03||null,
        service_mode_location:answers.RXD04||null,
        main_offers:answers.RXD05||null,
        target_audience:answers.RXD06||null,
        capacity_current_use:answers.RXD27||null,
        patrimony_strengths:answers.RXD28||null,
        difficulty:answers.RXD29&&answers.RXD29.difficulty||null,
        attempts:answers.RXD29&&answers.RXD29.attempts||null,
        destination_90d:answers.RXD30&&answers.RXD30.destination||null,
        success_signal:answers.RXD30&&answers.RXD30.success_signal||null
      },
      interpretation:null,
      limitations:[
        'Na fase 1, evidências visuais enriquecem a leitura, mas não alteram automaticamente o Score.',
        'Ausência de print não significa ausência de qualidade no canal; reduz apenas a cobertura de evidência visual.',
        'O Raio-X identifica sinais e hipóteses. Não fecha causa-raiz nem define sequência obrigatória de implantação.'
      ],
      human_validation_required:true,
      route_signal:null
    };
  }

  root.RX_DIGITAL_ENGINE={
    versions:{scoring:SCORING_VERSION,packet:PACKET_VERSION,report:REPORT_VERSION},
    axes:AXES,
    journey:JOURNEY,
    classify:classify,
    buildPacket:buildPacket,
    scoreGroup:scoreGroup,
    _internal:{clamp:clamp,scoreValue:scoreValue,normalizedChannels:normalizedChannels}
  };
})(window);

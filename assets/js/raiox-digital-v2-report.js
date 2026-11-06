/* YM Raio-X Digital 2.0 — renderer de homologação
 * Consome VOS_DIGITAL_INTAKE_2.0. Funciona mesmo sem visão multimodal.
 */
(function(root){
  'use strict';
  function esc(v){return String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}
  function score(v){return v==null?'—':Math.round(v);}
  function tone(v){if(v==null)return 'muted';if(v>=80)return 'good';if(v>=60)return 'ok';if(v>=40)return 'mid';return 'low';}
  function label(c){return ({FORTE:'Forte',ESTRUTURADO:'Estruturado',PARCIAL:'Parcial',INICIAL:'Inicial',SEM_DADOS:'Sem dados'})[c]||c||'—';}
  function injectStyles(){
    if(document.getElementById('rxd2styles'))return;
    var st=document.createElement('style');st.id='rxd2styles';st.textContent=`
      .rxd2{--n:#0b1533;--t:#26384f;--s:#6b7c91;--l:#e4e8f1;--b:#436cff;--i:#6356e5;--p:#ff8a62;--g:#13956f;--a:#c98b13;font-family:Inter,Arial,sans-serif;color:var(--t)}
      .rxd2 *{box-sizing:border-box}.rxd2 h1,.rxd2 h2,.rxd2 h3,.rxd2 p{margin:0}.rxd2 h1,.rxd2 h2,.rxd2 h3{font-family:Montserrat,Inter,sans-serif;color:var(--n)}
      .rxd2-hero{border-radius:28px;padding:34px;background:radial-gradient(circle at 88% 12%,rgba(255,138,98,.24),transparent 22%),linear-gradient(135deg,#0d1730,#27427e 47%,#6356e5 82%,#ff8a62 145%);color:#fff;box-shadow:0 24px 60px rgba(20,37,75,.18)}
      .rxd2-hero-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:24px;align-items:center}.rxd2-eyebrow{font-size:10px;font-weight:850;letter-spacing:.15em;text-transform:uppercase;color:#d9e2ff;margin-bottom:10px}.rxd2-hero h1{color:#fff;font-size:clamp(30px,5vw,52px);line-height:1.02;letter-spacing:-.04em}.rxd2-hero p{margin-top:13px;line-height:1.65;color:rgba(255,255,255,.84);font-size:14px}.rxd2-scorebox{background:#fff;border-radius:22px;padding:21px;color:var(--t)}.rxd2-score{font:900 44px Montserrat;color:var(--n);line-height:1}.rxd2-score small{font:700 12px Inter;color:var(--s)}.rxd2-k{font-size:9px;font-weight:850;letter-spacing:.1em;text-transform:uppercase;color:#7b8ca0}.rxd2-main{font:800 16px Montserrat;color:var(--n);margin-top:5px}.rxd2-sec{margin-top:44px}.rxd2-num{font-size:9px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:var(--i);margin-bottom:6px}.rxd2-sec h2{font-size:clamp(23px,3.6vw,32px);line-height:1.08}.rxd2-lead{font-size:14px;color:var(--s);line-height:1.65;margin-top:8px;max-width:780px}.rxd2-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}.rxd2-grid5{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:18px}.rxd2-card{background:#fff;border:1px solid var(--l);border-radius:17px;padding:17px;box-shadow:0 8px 24px rgba(22,39,76,.055)}.rxd2-card h3{font-size:14px;margin-bottom:6px}.rxd2-card p{font-size:12.5px;color:var(--s);line-height:1.55}.rxd2-v{font:900 27px Montserrat;color:var(--n);margin:4px 0}.rxd2-pill{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.rxd2-pill.good{background:#e8f8f1;color:#0f8563}.rxd2-pill.ok{background:#eef3ff;color:#315ad2}.rxd2-pill.mid{background:#fff7e5;color:#996912}.rxd2-pill.low{background:#fff0f3;color:#b64d68}.rxd2-pill.muted{background:#f1f4f7;color:#718195}.rxd2-bar{height:7px;background:#edf1f5;border-radius:999px;overflow:hidden;margin-top:9px}.rxd2-bar>i{display:block;height:100%;background:linear-gradient(90deg,#436cff,#6356e5,#ff8a62)}
      .rxd2-channels{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.rxd2-channel{padding:9px 11px;border-radius:12px;background:#fff;border:1px solid var(--l);font-size:11px;font-weight:750;color:var(--n)}.rxd2-channel.primary{border-color:#8d83ef;background:#f6f4ff}.rxd2-channel small{display:block;color:var(--s);font-weight:500;margin-top:3px}.rxd2-context{background:linear-gradient(145deg,#fff,#f8f9ff);border:1px solid var(--l);border-radius:18px;padding:20px;margin-top:18px}.rxd2-context p{font-size:13.5px;line-height:1.7;color:var(--t)}.rxd2-list{margin:8px 0 0;padding-left:18px}.rxd2-list li{font-size:13px;line-height:1.55;margin:6px 0}.rxd2-evidence{display:grid;grid-template-columns:120px 1fr;gap:14px;align-items:start}.rxd2-thumb{width:120px;height:180px;border-radius:13px;background:#f2f4f8;border:1px dashed #ccd5e1;overflow:hidden;display:grid;place-items:center;color:#8b98a9;font-size:10px;text-align:center}.rxd2-thumb img{width:100%;height:100%;object-fit:cover}.rxd2-warning{padding:12px 14px;border-radius:12px;background:#fff8e8;border:1px solid #f0d492;color:#7d5a12;font-size:11.5px;margin-top:14px}.rxd2-footer{margin:46px 0 10px;padding-top:18px;border-top:1px solid var(--l);font-size:10px;color:#8290a1;text-align:center}
      @media(max-width:850px){.rxd2-hero-grid{grid-template-columns:1fr}.rxd2-grid5{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.rxd2-grid,.rxd2-grid5{grid-template-columns:1fr}.rxd2-hero{border-radius:20px;padding:23px}.rxd2-evidence{grid-template-columns:1fr}.rxd2-thumb{width:100%;height:220px}}
      @media print{.rxd2-card,.rxd2-context,.rxd2-scorebox{box-shadow:none;break-inside:avoid}.rxd2-sec{break-inside:avoid-page}}
    `;document.head.appendChild(st);
  }

  function axisCards(pkt){
    var axes=pkt.score&&pkt.score.axes||{};
    return Object.keys(axes).map(function(k){var a=axes[k]||{};return '<div class="rxd2-card"><div class="rxd2-k">'+esc(k)+'</div><div class="rxd2-v">'+score(a.score)+'</div><span class="rxd2-pill '+tone(a.score)+'">'+esc(label(a.classification))+'</span><div class="rxd2-bar"><i style="width:'+Math.max(0,Math.min(100,a.score||0))+'%"></i></div><p style="margin-top:8px">Cobertura '+esc(a.coverage_pct||0)+'%</p></div>';}).join('');
  }
  function journeyCards(pkt){
    var j=pkt.score&&pkt.score.journey||{};
    return ['Encontrar','Entender','Confiar','Avançar','Sustentar'].map(function(k){var a=j[k]||{};return '<div class="rxd2-card"><div class="rxd2-k">'+k+'</div><div class="rxd2-v">'+score(a.score)+'</div><span class="rxd2-pill '+tone(a.score)+'">'+esc(label(a.classification))+'</span></div>';}).join('');
  }
  function channels(pkt){
    var xs=pkt.digital_presence&&pkt.digital_presence.channels||[];
    if(!xs.length)return '<div class="rxd2-warning">Nenhum canal digital foi informado nesta execução.</div>';
    return '<div class="rxd2-channels">'+xs.map(function(c){return '<div class="rxd2-channel '+(c.primary?'primary':'')+'">'+esc(c.channel)+(c.primary?' · principal':'')+'<small>'+(c.evidence_count?c.evidence_count+' evidência(s) enviada(s)':'sem print analisado')+'</small></div>';}).join('')+'</div>';
  }
  function evidenceBlocks(pkt){
    var ev=pkt.evidence||[];
    if(!ev.length)return '<div class="rxd2-warning">Nenhuma evidência visual foi anexada. O relatório segue válido com base nas respostas declaradas, mas a cobertura visual fica reduzida.</div>';
    return '<div class="rxd2-grid">'+ev.map(function(e){var v=e.vision_analysis||null;var img=e.local_preview_url?'<img src="'+esc(e.local_preview_url)+'" alt="Print de '+esc(e.channel)+'">':'Print privado';var observed=v&&v.observed?Object.keys(v.observed).slice(0,5).map(function(k){return '<li><b>'+esc(k.replace(/_/g,' '))+':</b> '+esc(v.observed[k])+'</li>';}).join(''):'';return '<div class="rxd2-card rxd2-evidence"><div class="rxd2-thumb">'+img+'</div><div><div class="rxd2-k">Evidência visual</div><h3>'+esc(e.channel||'Canal')+'</h3><p>Status: '+esc(e.upload_status||'—')+'</p>'+(observed?'<ul class="rxd2-list">'+observed+'</ul>':'<div class="rxd2-warning">Print recebido, mas ainda sem análise multimodal. Ele não altera o Score.</div>')+'</div></div>';}).join('')+'</div>';
  }
  function fallbackReadings(pkt){
    var axes=pkt.score&&pkt.score.axes||{};
    var ranked=Object.keys(axes).filter(function(k){return axes[k].score!=null;}).sort(function(a,b){return axes[b].score-axes[a].score;});
    var strong=ranked.slice(0,2), attention=ranked.slice(-2).reverse();
    return {
      synthesis:'O Score organiza o retrato declarado da jornada digital. A leitura final deve cruzar essa percepção com os canais utilizados, as evidências visuais disponíveis e o contexto do negócio antes de transformar qualquer sinal em conclusão.',
      strengths:strong.map(function(k){return k+' aparece entre as dimensões mais estruturadas desta execução ('+score(axes[k].score)+'/100).';}),
      attention:attention.map(function(k){return k+' aparece entre as dimensões que mais pedem aprofundamento ('+score(axes[k].score)+'/100).';})
    };
  }

  function render(pkt,target){
    injectStyles();target=target||document.getElementById('repbody');if(!target)throw new Error('repbody_ausente');
    var b=pkt.business_context||{}, interp=pkt.interpretation||{}, fb=fallbackReadings(pkt), overall=pkt.score&&pkt.score.overall;
    var synth=interp.executive_synthesis||fb.synthesis;
    var strengths=interp.strengths||fb.strengths, attention=interp.attention||fb.attention;
    var h='<div class="rxd2">';
    h+='<section class="rxd2-hero"><div class="rxd2-hero-grid"><div><div class="rxd2-eyebrow">Raio-X da Jornada Digital</div><h1>'+esc(b.business_name||'Seu negócio')+'</h1><p>Uma leitura conectando presença digital, conteúdo, confiança, conversão e sustentação ao contexto real do negócio.</p></div><div class="rxd2-scorebox"><div class="rxd2-k">Score da Jornada Digital</div><div class="rxd2-score">'+score(overall)+'<small>/100</small></div><div class="rxd2-main">Cobertura '+esc(pkt.score&&pkt.score.coverage_pct||0)+'% · Evidência visual '+esc(pkt.digital_presence&&pkt.digital_presence.evidence_coverage_pct||0)+'%</div></div></div></section>';
    h+='<section class="rxd2-sec"><div class="rxd2-num">01 · Retrato executivo</div><h2>O negócio por trás da presença digital</h2><p class="rxd2-lead">A leitura digital precisa entender oferta, público, operação e destino sem transformar o relatório em um diagnóstico puramente de negócio.</p><div class="rxd2-context"><p><b>'+esc(b.business_summary||'Contexto não informado')+'</b></p><p style="margin-top:8px">Público: '+esc(b.target_audience||'—')+'</p><p>Ofertas: '+esc(b.main_offers||'—')+'</p></div></section>';
    h+='<section class="rxd2-sec"><div class="rxd2-num">02 · Dimensões digitais</div><h2>Oito eixos que formam a presença e a jornada</h2><div class="rxd2-grid">'+axisCards(pkt)+'</div></section>';
    h+='<section class="rxd2-sec"><div class="rxd2-num">03 · Jornada</div><h2>Encontrar → Entender → Confiar → Avançar → Sustentar</h2><div class="rxd2-grid5">'+journeyCards(pkt)+'</div></section>';
    h+='<section class="rxd2-sec"><div class="rxd2-num">04 · Presença digital</div><h2>Mapa dos canais usados hoje</h2><p class="rxd2-lead">O relatório só analisa como canal específico aquilo que o negócio declarou utilizar.</p>'+channels(pkt)+'</section>';
    h+='<section class="rxd2-sec"><div class="rxd2-num">05 · Evidências visuais</div><h2>O que os prints ajudam a confirmar</h2><p class="rxd2-lead">Prints são evidências temporais do canal. Eles enriquecem e podem contrastar a percepção declarada, mas não mudam a nota automaticamente nesta versão.</p>'+evidenceBlocks(pkt)+'</section>';
    h+='<section class="rxd2-sec"><div class="rxd2-num">06 · Síntese</div><h2>O que a combinação dos dados sugere</h2><div class="rxd2-context"><p>'+esc(synth)+'</p></div><div class="rxd2-grid"><div class="rxd2-card"><h3>O que já funciona</h3><ul class="rxd2-list">'+strengths.map(function(x){return '<li>'+esc(typeof x==='string'?x:(x.reading||x.title||''))+'</li>';}).join('')+'</ul></div><div class="rxd2-card"><h3>Onde vale aprofundar</h3><ul class="rxd2-list">'+attention.map(function(x){return '<li>'+esc(typeof x==='string'?x:(x.reading||x.title||''))+'</li>';}).join('')+'</ul></div></div></section>';
    h+='<section class="rxd2-sec"><div class="rxd2-num">07 · Destino</div><h2>Para onde o negócio quer mover a jornada</h2><div class="rxd2-grid"><div class="rxd2-card"><div class="rxd2-k">Próximos 90 dias</div><p>'+esc(b.destination_90d||'—')+'</p></div><div class="rxd2-card"><div class="rxd2-k">Como reconhecer melhora</div><p>'+esc(b.success_signal||'—')+'</p></div></div></section>';
    h+='<div class="rxd2-warning">Este Raio-X identifica sinais, relações e hipóteses. Não substitui investigação aprofundada e não fecha causa-raiz, prioridade final ou plano obrigatório de implantação.</div><div class="rxd2-footer">RX_REPORT_2.0 · '+esc(pkt.questionnaire_version)+' · '+esc(pkt.scoring_version)+'</div></div>';
    target.innerHTML=h;return target;
  }
  root.RX_DIGITAL_REPORT={render:render,version:'RX_REPORT_2.0'};
})(window);

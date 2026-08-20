/* YM Raio-X — camada interpretativa + visual oficial aprovado
 * Contrato: RX_REPORT_1.1
 * Regra-mãe: cliente fornece dados -> Raio-X devolve significado.
 */
(function (root) {
  'use strict';

  if (root.YM_RX_REPORT_11_INSTALLED) return;
  root.YM_RX_REPORT_11_INSTALLED = true;

  var API_BASE = root.YM_RAIOX_INTERPRET_API_BASE || 'https://ym-raiox-backend.vercel.app';
  var Q = root.RX_QUESTIONS || [];
  var NA_LABEL = root.RX_NA_LABEL || 'Não sei / não tenho essa informação';
  var baseRender = root.renderReport;
  var preparePromise = null;

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>\"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c];
    });
  }

  function getRawAnswer(id) {
    try { return root.A ? root.A[id] : null; } catch (e) { return null; }
  }

  function humanResponses() {
    return Q.map(function (q) {
      var raw = getRawAnswer(q.id);
      var answer = raw;
      var responseType = q.t === 'score' ? 'scale' : 'open';
      if (q.t === 'score') {
        if (raw === 'nao_sei' || raw === null || raw === undefined || raw === '') {
          answer = raw === 'nao_sei' ? NA_LABEL : null;
          responseType = raw === 'nao_sei' ? 'na' : 'missing';
        } else {
          var idx = Number(raw);
          answer = Array.isArray(q.o) && q.o[idx] != null ? q.o[idx] : String(raw);
        }
      }
      return {
        question_id: q.id,
        field_id: q.field_id || null,
        block: q.bloco || null,
        p8: q.p8 || null,
        journey: q.visao || null,
        question: q.q || '',
        answer: answer == null ? null : String(answer),
        response_type: responseType
      };
    });
  }

  async function requestInterpretation(pkt) {
    var ref = typeof root.lerRef === 'function' ? root.lerRef() : '';
    if (!ref) throw new Error('ref_ausente');
    var r = await fetch(API_BASE + '/api/raiox/interpretar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ packet: pkt, responses: humanResponses(), ref: ref })
    });
    var d = await r.json().catch(function () { return {}; });
    if (!r.ok || !d.ok || !d.interpretation) {
      throw new Error((d && d.error) || ('interpretacao_' + r.status));
    }
    return d.interpretation;
  }

  root.YMPrepareRaioXInterpretation = async function YMPrepareRaioXInterpretation(pkt) {
    if (!pkt || typeof pkt !== 'object') throw new Error('packet_ausente');
    if (pkt.interpretation) return pkt.interpretation;
    if (preparePromise) return preparePromise;
    preparePromise = requestInterpretation(pkt)
      .then(function (interpretation) {
        pkt.interpretation = interpretation;
        pkt.report_version = 'RX_REPORT_1.1';
        return interpretation;
      })
      .finally(function () { preparePromise = null; });
    return preparePromise;
  };

  function injectStyles() {
    if (document.getElementById('rx-v2-approved-styles')) return;
    var st = document.createElement('style');
    st.id = 'rx-v2-approved-styles';
    st.textContent = `
      #repbody{max-width:1140px!important;padding-top:18px!important}
      .rx2{--n:#101a34;--t:#2b3a52;--s:#687a91;--l:#e8ecf3;--b:#436cff;--i:#6356e5;--v:#8e63ff;--p:#ff8a62;--g:#12926e;--ga:#f0b33c;--pk:#d95a97;color:var(--t);font-family:'Inter',sans-serif}
      .rx2 *{box-sizing:border-box}.rx2 h1,.rx2 h2,.rx2 h3,.rx2 p{margin:0}.rx2 h2,.rx2 h3{font-family:'Montserrat',sans-serif;color:var(--n);letter-spacing:-.025em}
      .rx2-hero{position:relative;overflow:hidden;border-radius:30px;padding:clamp(26px,5vw,46px);background:radial-gradient(circle at 18% 22%,rgba(255,255,255,.16),transparent 25%),radial-gradient(circle at 90% 18%,rgba(255,183,139,.22),transparent 18%),linear-gradient(135deg,#0f1932 0%,#253b80 38%,#684fef 72%,#ff8a62 124%);box-shadow:0 28px 70px rgba(26,41,80,.2);color:#fff;margin-bottom:42px}
      .rx2-hero:before{content:'';position:absolute;inset:18px;border:1px dashed rgba(255,255,255,.16);border-radius:23px;pointer-events:none}.rx2-hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:1.08fr .92fr;gap:26px;align-items:center}
      .rx2-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:10px;font-weight:850;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.85);margin-bottom:13px}.rx2-eyebrow:before{content:'';width:8px;height:8px;border-radius:50%;background:#ffd7a7;box-shadow:0 0 0 6px rgba(255,215,167,.14)}
      .rx2-hero h1{font-family:'Montserrat',sans-serif;font-size:clamp(31px,5vw,56px);line-height:1.02;font-weight:900;letter-spacing:-.04em;color:#fff}.rx2-hero-copy{font-size:15px;line-height:1.65;color:rgba(255,255,255,.88);margin-top:14px;max-width:630px}
      .rx2-scorebox{background:rgba(255,255,255,.98);border-radius:24px;padding:22px;color:var(--t);box-shadow:0 18px 46px rgba(17,25,46,.18)}.rx2-scoretop{display:flex;gap:18px;align-items:center}.rx2-ring{width:122px;height:122px;border-radius:50%;display:grid;place-items:center;position:relative;flex:0 0 auto}.rx2-ring:after{content:'';position:absolute;inset:11px;border-radius:50%;background:#fff}.rx2-score{position:relative;z-index:1;text-align:center;color:var(--n);font:900 36px/1 'Montserrat',sans-serif}.rx2-score small{display:block;margin-top:5px;font:700 12px 'Inter',sans-serif;color:var(--s)}
      .rx2-k{font-size:9px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;color:#7f90a6}.rx2-main{font:850 18px/1.22 'Montserrat',sans-serif;color:var(--n);margin:4px 0 9px}.rx2-pill{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}.rx2-pill.ok{background:#eaf8f2;color:#12926e}.rx2-pill.mid{background:#fff8e6;color:#946500}.rx2-pill.low{background:#fff0f7;color:#b24d82}
      .rx2-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px}.rx2-meta>div{padding:11px;border:1px solid var(--l);border-radius:12px;background:linear-gradient(145deg,#f8fbff,#fff8f4)}.rx2-meta b{display:block;color:var(--n);font-size:12.5px;margin-top:3px}
      .rx2-section{margin-top:50px}.rx2-num{font-size:9px;font-weight:850;letter-spacing:.17em;text-transform:uppercase;color:var(--v);margin-bottom:7px}.rx2-section h2{font-size:clamp(23px,3.6vw,34px);line-height:1.08}.rx2-lead{font-size:14.5px;color:var(--s);margin-top:9px;max-width:760px}
      .rx2-panel,.rx2-card,.rx2-p8{background:#fff;border:1px solid var(--l);border-radius:19px;box-shadow:0 10px 28px rgba(24,38,68,.07)}.rx2-panel{padding:22px}.rx2-panel.hi{background:radial-gradient(circle at top right,rgba(255,138,98,.10),transparent 22%),radial-gradient(circle at bottom left,rgba(142,99,255,.08),transparent 18%),linear-gradient(145deg,#fff,#fbf8ff);border-color:#e4ddf6}.rx2-panel.hi .rx2-text{font-size:17px;line-height:1.5;color:var(--n);font-weight:650}
      .rx2-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}.rx2-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.rx2-card{padding:19px;position:relative;overflow:hidden}.rx2-card:before{content:'';position:absolute;left:0;top:0;right:0;height:4px;background:linear-gradient(90deg,var(--b),var(--v),var(--p))}.rx2-card.purple{background:linear-gradient(145deg,#fff,#fbf8ff)}.rx2-card.peach{background:linear-gradient(145deg,#fff,#fff8f3)}.rx2-card.green{background:linear-gradient(145deg,#fff,#f5fffb)}.rx2-card.gold{background:linear-gradient(145deg,#fff,#fffcef)}.rx2-card h3{font-size:15px;line-height:1.28;margin-bottom:7px}.rx2-text,.rx2-card p{font-size:14px;line-height:1.65;color:var(--s)}
      .rx2-conf{display:inline-flex;margin-bottom:9px;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:850;letter-spacing:.07em;text-transform:uppercase}.rx2-conf.alta{background:#eaf8f2;color:#12926e}.rx2-conf.media{background:#fff8e6;color:#996a06}.rx2-conf.baixa{background:#fff0f7;color:#b24d82}
      .rx2-impact{margin-top:10px;padding-top:10px;border-top:1px dashed #dfe5ef;font-size:12.5px;color:var(--s)}.rx2-impact b{color:var(--t)}
      .rx2-trace{margin-top:12px}.rx2-trace summary{cursor:pointer;color:#8391a4;font-size:10px;font-weight:750;list-style:none}.rx2-trace summary::-webkit-details-marker{display:none}.rx2-sources{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.rx2-source{font-size:9px;font-weight:800;padding:4px 7px;border-radius:999px;background:#eef2ff;color:#6356e5}
      .rx2-p8grid{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-top:19px}.rx2-p8{padding:16px}.rx2-p8:nth-child(1){background:linear-gradient(145deg,#fff,#f5f8ff)}.rx2-p8:nth-child(2){background:linear-gradient(145deg,#fff,#faf6ff)}.rx2-p8:nth-child(3){background:linear-gradient(145deg,#fff,#fff8f2)}.rx2-p8:nth-child(4){background:linear-gradient(145deg,#fff,#fff7fb)}.rx2-p8:nth-child(5){background:linear-gradient(145deg,#fff,#fffcef)}.rx2-p8:nth-child(6){background:linear-gradient(145deg,#fff,#f6fffb)}.rx2-p8:nth-child(7){background:linear-gradient(145deg,#fff,#fff5fa)}.rx2-p8:nth-child(8){background:linear-gradient(145deg,#fff,#f5faff)}.rx2-p8 .v{font:900 25px 'Montserrat',sans-serif;color:var(--n);margin:5px 0}.rx2-p8 .d{font-size:11.5px;color:var(--s);margin-top:6px}
      .rx2-journey{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-top:19px}.rx2-journey .rx2-card{padding:17px}.rx2-js{font:900 25px 'Montserrat',sans-serif;color:var(--b);margin:4px 0 7px}.rx2-jd{font-size:13px;line-height:1.58;color:var(--s)}
      .rx2-list{margin:10px 0 0;padding-left:18px}.rx2-list li{font-size:13.5px;color:var(--t);margin:7px 0;line-height:1.55}.rx2-empty{padding:16px;border:1px dashed #cfd8e3;border-radius:13px;background:#f8fafc;color:var(--s);font-size:13px}.rx2-warning{padding:13px 15px;border-radius:13px;background:#fff8e7;border:1px solid #f2d99a;color:#7c5a12;font-size:12px;margin-bottom:16px}
      .rx2-actions{display:flex;justify-content:center;gap:9px;flex-wrap:wrap;margin:34px 0 8px}.rx2-btn{border:none;border-radius:11px;padding:11px 15px;background:linear-gradient(145deg,#436cff,#6356e5);color:#fff;font-weight:800;cursor:pointer}.rx2-btn.alt{background:#fff;color:#436cff;border:1px solid var(--l)}
      @media(max-width:820px){.rx2-hero-grid{grid-template-columns:1fr}.rx2-p8grid,.rx2-journey{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:620px){#repbody{padding-left:12px!important;padding-right:12px!important}.rx2-hero{border-radius:22px;padding:21px;margin-bottom:30px}.rx2-hero:before{inset:12px;border-radius:16px}.rx2-scoretop{align-items:flex-start}.rx2-ring{width:102px;height:102px}.rx2-score{font-size:30px}.rx2-meta,.rx2-grid2,.rx2-cards,.rx2-p8grid,.rx2-journey{grid-template-columns:1fr}.rx2-section{margin-top:40px}}
      @media print{.rx2-actions{display:none!important}.rx2-card,.rx2-panel,.rx2-p8,.rx2-scorebox{box-shadow:none!important;break-inside:avoid}.rx2-section{break-inside:avoid-page}}
    `;
    document.head.appendChild(st);
  }

  var P8_FRIENDLY = {
    'Produto': 'Produto',
    'Preço': 'Preço',
    'Praça': 'Canais de entrada',
    'Promoção': 'Comunicação',
    'Pessoas': 'Pessoas',
    'Processos': 'Processo comercial',
    'Evidências físicas': 'Prova e confiança',
    'Produtividade e Qualidade': 'Números e controle'
  };

  function sourcesHtml(xs) {
    if (!Array.isArray(xs) || !xs.length) return '';
    return '<details class="rx2-trace"><summary>Como chegamos a esta leitura</summary><div class="rx2-sources">' +
      xs.filter(function (x) { return /^RX(?:0[1-9]|[12][0-9]|30)$/.test(String(x)); })
        .map(function (x) { return '<span class="rx2-source">' + esc(x) + '</span>'; }).join('') +
      '</div></details>';
  }

  function confHtml(c) {
    c = ['alta','media','baixa'].indexOf(c) >= 0 ? c : 'baixa';
    var label = c === 'alta' ? 'Confiança alta' : c === 'media' ? 'Confiança média' : 'Confiança baixa';
    return '<span class="rx2-conf ' + c + '">' + label + '</span>';
  }

  function sectionStart(n, title, lead) {
    return '<section class="rx2-section"><div class="rx2-num">' + esc(n) + '</div><h2>' + esc(title) + '</h2>' + (lead ? '<p class="rx2-lead">' + esc(lead) + '</p>' : '');
  }

  function fallbackExecutive(pkt) {
    var pcs = pkt && pkt.p8_coverage || [];
    var assets = pcs.filter(function (p) { return p.classification === 'ATIVO'; }).map(function (p) { return P8_FRIENDLY[p.p8] || p.p8; });
    var partial = pcs.filter(function (p) { return p.classification === 'PARCIAL' || p.classification === 'MISTA' || p.classification === 'PONTO_ATENCAO'; }).map(function (p) { return P8_FRIENDLY[p.p8] || p.p8; });
    var out = 'Seu negócio apresenta diferentes níveis de maturidade ao longo da jornada.';
    if (assets.length) out += ' Há boa base em ' + assets.join(', ') + '.';
    if (partial.length) out += ' Alguns pontos ainda pedem observação em ' + partial.join(', ') + '.';
    return out;
  }

  function fallbackJourney(name, full) {
    var j = full && full.journey_views ? full.journey_views[name] : null;
    if (!j || j.score == null) return 'Ainda não há informação suficiente para uma leitura segura deste momento da jornada.';
    if (j.score >= 75) return 'Esta parte da jornada aparece mais estruturada. O valor está em preservar o que funciona e observar como ela se conecta às demais etapas.';
    if (j.score >= 50) return 'Há elementos funcionando, mas a leitura ainda é mista. Vale observar onde a experiência depende de esforço adicional para avançar.';
    return 'As respostas mostram menor estrutura neste momento da jornada. Isso indica onde olhar com mais cuidado, não uma causa fechada.';
  }

  function p8Status(classification) {
    if (classification === 'ATIVO') return { cls:'ok', label:'Bem estruturado' };
    if (classification === 'PONTO_ATENCAO') return { cls:'low', label:'Pede atenção' };
    if (classification === 'MISTA' || classification === 'PARCIAL') return { cls:'mid', label:'Pode amadurecer' };
    if (classification === 'COBERTURA_PARCIAL') return { cls:'mid', label:'Leitura parcial' };
    return { cls:'mid', label:'Ainda sem base completa' };
  }

  function renderCards(items, kind) {
    if (!Array.isArray(items) || !items.length) return '<div class="rx2-empty">Nenhum sinal adicional foi gerado nesta parte da leitura.</div>';
    var tones = ['purple','green','peach','gold'];
    return '<div class="rx2-cards" style="margin-top:19px">' + items.map(function (it, idx) {
      var title = it.title || (kind === 'hyp' ? 'Hipótese a investigar' : 'Leitura');
      var body = it.reading || it.hypothesis || it.test || '';
      var extra = '';
      if (it.possible_impact) extra = '<div class="rx2-impact"><b>O que isso pode gerar:</b> ' + esc(it.possible_impact) + '</div>';
      if (it.what_to_validate) extra = '<div class="rx2-impact"><b>Vale observar:</b> ' + esc(it.what_to_validate) + '</div>';
      if (it.why && kind === 'quick') extra = '<div class="rx2-impact"><b>O que esse teste ajuda a enxergar:</b> ' + esc(it.why) + '</div>';
      return '<article class="rx2-card ' + tones[idx % tones.length] + '">' +
        (it.confidence ? confHtml(it.confidence) : '') +
        '<h3>' + esc(title) + '</h3><p>' + esc(body) + '</p>' + extra + sourcesHtml(it.sources) + '</article>';
    }).join('') + '</div>';
  }

  function renderReportV2(pkt, interp, interpretError) {
    injectStyles();
    var s = pkt && pkt.score || {};
    var full = pkt && pkt._score_full || {};
    var b = interp && interp.business_reading || {};
    var d = interp && interp.destination || {};
    var j = interp && interp.journey_reading || {};
    var businessName = getRawAnswer('RX02') || pkt.client_ref || 'Seu negócio';
    var score = s.status === 'FINAL' && s.overall != null ? Number(s.overall) : null;
    var pct = score == null ? 0 : Math.max(0, Math.min(100, score));
    var ring = score == null ? '#edf1f7' : 'conic-gradient(#436cff 0 ' + pct + '%,#edf1f7 ' + pct + '% 100%)';
    var h = '<div class="rx2">';

    h += '<section class="rx2-hero"><div class="rx2-hero-grid"><div><div class="rx2-eyebrow">Raio-X Estratégico</div><h1>Seu Raio-X da Jornada Digital</h1><p class="rx2-hero-copy">Uma leitura para entender o que já sustenta o negócio, o que ainda pede atenção e quais sinais valem ser observados antes de uma decisão maior.</p></div>';
    h += '<div class="rx2-scorebox"><div class="rx2-scoretop"><div class="rx2-ring" style="background:' + ring + '"><div class="rx2-score">' + (score == null ? '—' : esc(score)) + '<small>/100</small></div></div><div><div class="rx2-k">Visão geral</div><div class="rx2-main">' + (score == null ? 'Ainda não há base suficiente para publicar um Score geral' : 'Seu negócio já tem base construída — o valor agora está em entender onde ela é mais forte e onde ainda precisa amadurecer') + '</div><span class="rx2-pill ' + (s.status === 'FINAL' ? 'ok' : 'mid') + '">' + (s.status === 'FINAL' ? 'Leitura completa' : 'Leitura parcial') + '</span></div></div>';
    h += '<div class="rx2-meta"><div><span class="rx2-k">Negócio</span><b>' + esc(businessName) + '</b></div><div><span class="rx2-k">Cobertura</span><b>' + esc(s.coverage_pct == null ? '—' : s.coverage_pct + '%') + '</b></div><div><span class="rx2-k">Leitura</span><b>Interpretativa</b></div></div></div></div></section>';

    if (interpretError) h += '<div class="rx2-warning">A leitura avançada ficou temporariamente indisponível. O Score e os sinais estruturados continuam disponíveis, sem transformar respostas abertas em conclusões automáticas.</div>';

    h += sectionStart('01 — O que esse resultado conta','O número é só o começo. O valor real está no desenho do negócio por trás dele.','A leitura abaixo conecta os dados em vez de apenas repetir o que foi respondido.');
    h += '<div class="rx2-panel hi" style="margin-top:19px"><div class="rx2-text">' + esc((interp && interp.executive_synthesis) || fallbackExecutive(pkt)) + '</div></div></section>';

    h += sectionStart('02 — Seu negócio em uma leitura', b.headline || 'O que entendemos sobre o modelo atual','Aqui o Raio-X transforma contexto, oferta e público em uma síntese de alto nível.');
    h += '<div class="rx2-grid2" style="margin-top:19px"><div class="rx2-card purple"><h3>Como o negócio se apresenta</h3><p>' + esc(b.summary || 'O contexto do negócio foi registrado para compor uma leitura integrada da oferta, do público e da jornada atual.') + '</p>' + sourcesHtml(['RX03','RX07','RX08']) + '</div><div class="rx2-card peach"><h3>Como o negócio funciona hoje</h3><p>' + esc(b.operating_context || 'A forma de atendimento, o estágio do negócio e os canais foram considerados como contexto da análise.') + '</p>' + sourcesHtml(['RX04','RX05','RX06']) + '</div></div></section>';

    h += sectionStart('03 — O que você quer construir agora','Seu objetivo atual como mudança de estado','O destino é interpretado para mostrar para onde o negócio quer evoluir — não como cópia da resposta.');
    h += '<div class="rx2-grid2" style="margin-top:19px"><div class="rx2-card purple"><h3>Para onde o negócio quer ir</h3><p>' + esc(d.strategic_destination || 'O objetivo dos próximos meses foi registrado e será usado como referência para validar avanço.') + '</p>' + sourcesHtml(['RX29']) + '</div><div class="rx2-card green"><h3>Como perceber melhora</h3><p>' + esc(d.success_signal || 'O sinal de melhora foi registrado para ser observado por evidências, números e comportamento real da jornada.') + '</p>' + sourcesHtml(['RX30']) + '</div></div></section>';

    h += sectionStart('04 — Áreas do negócio','Onde a estrutura aparece mais forte e onde ainda existem pontos que podem amadurecer','As oito áreas têm o mesmo peso no Score. Elas mostram cobertura, não uma ordem automática de correção.');
    h += '<div class="rx2-p8grid">';
    (pkt.p8_coverage || []).forEach(function (p) {
      var st = p8Status(p.classification);
      var scoreVal = p.score == null ? '—' : p.score;
      h += '<div class="rx2-p8"><div class="rx2-k">' + esc(P8_FRIENDLY[p.p8] || p.p8) + '</div><div class="v">' + esc(scoreVal) + '</div><span class="rx2-pill ' + st.cls + '">' + esc(st.label) + '</span></div>';
    });
    h += '</div></section>';

    h += sectionStart('05 — Leitura da jornada','O que acontece entre ser encontrada, ser entendida, fazer alguém avançar e sustentar o negócio','Cada momento combina respostas diferentes e ajuda a enxergar tensões que uma nota isolada não mostra.');
    h += '<div class="rx2-journey">';
    ['Encontrar','Entender','Avançar','Sustentar'].forEach(function (name, idx) {
      var x = full && full.journey_views ? full.journey_views[name] : null;
      var sc = x && x.score != null ? x.score : '—';
      var tone = ['purple','peach','green','gold'][idx];
      h += '<div class="rx2-card ' + tone + '"><h3>' + name + '</h3><div class="rx2-js">' + esc(sc) + '</div><div class="rx2-jd">' + esc(j[name] || fallbackJourney(name,full)) + '</div></div>';
    });
    h += '</div></section>';

    h += sectionStart('06 — O que já sustenta o negócio','Seus pontos fortes mostram o que deve ser preservado','O Raio-X começa pelo patrimônio para evitar que uma melhoria destrua algo que já funciona.');
    h += renderCards((interp && interp.patrimony_readings) || [], 'asset') + '</section>';

    h += sectionStart('07 — O que merece atenção','Pontos que valem ser observados com mais cuidado','Atenção não significa causa fechada. É um sinal para investigar melhor antes de uma decisão maior.');
    h += renderCards((interp && interp.attention_readings) || [], 'attn') + '</section>';

    h += sectionStart('08 — Sinais importantes','Leituras que aparecem quando várias respostas são observadas juntas','Aqui está uma das partes mais valiosas do Raio-X: conectar informações que isoladamente parecem simples.');
    h += renderCards((interp && interp.cross_readings) || [], 'cross') + '</section>';

    h += sectionStart('09 — O que vale investigar','Hipóteses iniciais, sem transformar percepção em certeza','As hipóteses abaixo já podem seguir para o Método VOS como ponto de partida — sempre aguardando validação humana.');
    h += renderCards((interp && interp.hypotheses) || [], 'hyp') + '</section>';

    h += sectionStart('10 — Testes simples','Pequenos movimentos que podem gerar clareza','São testes seguros para observar comportamento e criar evidência. Não formam um plano obrigatório nem uma sequência de implantação.');
    h += renderCards((interp && interp.quick_wins) || [], 'quick') + '</section>';

    var nd = interp && Array.isArray(interp.not_to_decide) ? interp.not_to_decide : [];
    if (nd.length) {
      h += sectionStart('11 — O que ainda não decidir','Decisões que seriam prematuras com os dados atuais','Saber o que ainda não concluir também faz parte de uma boa leitura.');
      h += '<div class="rx2-panel"><ul class="rx2-list">' + nd.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></section>';
    }

    var route = interp && interp.route_to_validate || {};
    h += sectionStart('12 — Próxima conversa','Que tipo de aprofundamento parece fazer mais sentido agora','A rota continua sendo validada por uma pessoa. O Raio-X organiza a conversa — não escolhe sozinho o serviço.');
    h += '<div class="rx2-panel hi" style="margin-top:19px"><div class="rx2-text">' + esc(route.reading || 'A próxima conversa deve validar os principais sinais, esclarecer lacunas e decidir se a necessidade é pontual ou envolve frentes conectadas.') + '</div></div>';
    if (Array.isArray(route.validation_questions) && route.validation_questions.length) h += '<div class="rx2-card" style="margin-top:14px"><h3>Perguntas que podem orientar a próxima etapa</h3><ul class="rx2-list">' + route.validation_questions.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    h += '</section>';

    h += sectionStart('13 — Limites desta leitura','O que o Raio-X não pretende fechar sozinho','Esses limites preservam a qualidade do diagnóstico e deixam a etapa profunda para o Método VOS.');
    h += '<div class="rx2-panel"><ul class="rx2-list"><li>O Score mostra maturidade declarada; não comprova sozinho a causa de um problema.</li><li>As leituras da jornada não são uma ordem automática de correção.</li><li>Hipóteses precisam ser confirmadas ou descartadas com evidências e validação humana.</li><li>O Raio-X não escolhe sozinho investimento, serviço ou sequência de implantação.</li></ul></div></section>';

    h += '<div class="rx2-actions"><button class="rx2-btn" onclick="window.print()">Imprimir / salvar PDF</button><button class="rx2-btn alt" onclick="window.scrollTo({top:0,behavior:\'smooth\'})">Voltar ao início</button></div>';
    h += '</div>';

    var target = document.getElementById('repbody');
    if (!target) throw new Error('repbody_ausente');
    target.innerHTML = h;
    if (typeof root.go === 'function') root.go('report');
    else { var v = document.getElementById('view-report'); if (v) v.classList.add('active'); }
  }

  root.renderReport = function renderReportApproved(pkt) {
    if (!pkt || typeof pkt !== 'object') {
      if (typeof baseRender === 'function') return baseRender(pkt);
      return;
    }
    if (pkt.interpretation) return renderReportV2(pkt, pkt.interpretation, null);
    root.YMPrepareRaioXInterpretation(pkt)
      .then(function (interpretation) { renderReportV2(pkt, interpretation, null); })
      .catch(function (err) {
        console.warn('[YM RX] interpretação avançada indisponível:', err && err.message);
        renderReportV2(pkt, null, err);
      });
  };
})(window);

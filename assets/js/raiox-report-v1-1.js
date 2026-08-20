/* YM Raio-X — RX_REPORT_1.1 interpretativo
 * Cliente fornece dados -> Raio-X devolve significado.
 *
 * Esta camada NÃO altera Score, 8Ps ou classificações do motor canônico.
 * Ela solicita ao backend uma interpretação auditável e renderiza uma entrega
 * mais rica, sem causa-raiz, prioridade final, roadmap ou escolha de produto.
 */
(function (root) {
  'use strict';

  if (root.YM_RX_REPORT_11_INSTALLED) return;
  root.YM_RX_REPORT_11_INSTALLED = true;

  var API_BASE = root.YM_RAIOX_INTERPRET_API_BASE || 'https://ym-raiox-backend.vercel.app';
  var Q = root.RX_QUESTIONS || [];
  var NA_LABEL = root.RX_NA_LABEL || 'Não sei / não tenho essa informação';
  var baseRender = root.renderReport;

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>\"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c];
    });
  }

  function injectStyles() {
    if (document.getElementById('rx-report-11-styles')) return;
    var st = document.createElement('style');
    st.id = 'rx-report-11-styles';
    st.textContent = `
      .rx11-version{display:inline-flex;align-items:center;gap:6px;margin-top:12px;padding:5px 10px;border:1px solid rgba(255,255,255,.2);border-radius:999px;font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.7)}
      .rx11-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}.rx11-grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
      .rx11-box{background:#fff;border:1px solid var(--borda);border-radius:14px;padding:22px}.rx11-box.soft{background:var(--fundo)}
      .rx11-k{font-size:10px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:var(--azul);margin-bottom:8px}.rx11-title{font-family:'Montserrat',sans-serif;font-size:16px;font-weight:800;color:var(--escuro);line-height:1.35;margin-bottom:8px}.rx11-text{font-size:14px;line-height:1.7;color:var(--texto)}
      .rx11-headline{font-family:'Montserrat',sans-serif;font-size:clamp(19px,2.8vw,27px);font-weight:800;line-height:1.25;letter-spacing:-.02em;color:var(--escuro);margin-bottom:12px}
      .rx11-source-row{display:flex;gap:5px;flex-wrap:wrap;margin-top:11px}.rx11-source{font-size:9px;font-weight:700;letter-spacing:.06em;color:#60738a;background:#eef3f8;border:1px solid #dce4ec;border-radius:999px;padding:3px 7px}
      .rx11-conf{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;border-radius:999px;padding:4px 8px}.rx11-conf.alta{background:var(--verde-bg);color:var(--verde);border:1px solid var(--verde-bd)}.rx11-conf.media{background:var(--amarelo-bg);color:var(--amarelo);border:1px solid var(--amarelo-bd)}.rx11-conf.baixa{background:#f1f5f9;color:#64748b;border:1px solid #dbe3ec}
      .rx11-topline{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}.rx11-list{display:grid;gap:12px}.rx11-card{background:#fff;border:1px solid var(--borda);border-radius:14px;padding:20px}.rx11-card.asset{border-left:4px solid var(--verde)}.rx11-card.attn{border-left:4px solid var(--amarelo)}.rx11-card.cross{border-left:4px solid var(--azul)}.rx11-card.hyp{border-left:4px dashed #64748b}.rx11-card.quick{border-left:4px solid #4f46e5}
      .rx11-journey{background:#fff;border:1px solid var(--borda);border-radius:14px;padding:18px}.rx11-journey-score{font-family:'Montserrat',sans-serif;font-size:25px;font-weight:900;color:var(--escuro);margin:5px 0}.rx11-journey-label{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--sub);font-weight:800}
      .rx11-gap{background:#f8fafc;border:1px dashed #cfd8e3;border-radius:12px;padding:16px;font-size:13px;line-height:1.65;color:var(--sub)}
      .rx11-warning{background:#fff8e7;border:1px solid #f2d99a;border-radius:12px;padding:14px 16px;color:#7c5a12;font-size:12px;line-height:1.6;margin-bottom:18px}
      .rx11-no{display:flex;gap:10px;align-items:flex-start;background:#fff;border:1px solid var(--borda);border-radius:12px;padding:15px 17px}.rx11-no:before{content:'—';font-weight:900;color:var(--azul)}.rx11-route{background:linear-gradient(145deg,#eef4ff,#f8fbff);border:1px solid #cadbfa;border-radius:16px;padding:24px}.rx11-questions{margin:12px 0 0;padding-left:19px}.rx11-questions li{font-size:13px;line-height:1.55;color:var(--texto);margin:6px 0}
      .rx11-print{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:36px}
      @media(max-width:760px){.rx11-grid2,.rx11-grid4{grid-template-columns:1fr}.rx11-box{padding:18px}}
      @media print{.rx11-print{display:none!important}}
    `;
    document.head.appendChild(st);
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
        response_type: responseType,
      };
    });
  }

  async function requestInterpretation(pkt) {
    var ref = typeof root.lerRef === 'function' ? root.lerRef() : '';
    if (!ref) throw new Error('ref_ausente');
    var r = await fetch(API_BASE + '/api/raiox/interpretar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packet: pkt, responses: humanResponses(), ref: ref }),
    });
    var d = await r.json().catch(function () { return {}; });
    if (!r.ok || !d.ok || !d.interpretation) throw new Error((d && d.error) || ('interpretacao_' + r.status));
    return d.interpretation;
  }

  function sourcesHtml(xs) {
    if (!Array.isArray(xs) || !xs.length) return '';
    return '<div class="rx11-source-row">' + xs.map(function (s) { return '<span class="rx11-source">Origem · ' + esc(s) + '</span>'; }).join('') + '</div>';
  }

  function confidenceHtml(c) {
    c = ['alta', 'media', 'baixa'].indexOf(c) >= 0 ? c : 'baixa';
    var label = c === 'alta' ? 'Confiança alta' : c === 'media' ? 'Confiança média' : 'Confiança baixa';
    return '<span class="rx11-conf ' + c + '">' + label + '</span>';
  }

  function p8Class(p) {
    return p === 'ATIVO' ? 'st-ok' : p === 'PONTO_ATENCAO' ? 'st-wn' : p === 'PARCIAL' ? 'st-partial' : p === 'MISTA' ? 'st-mix' : 'st-gap';
  }

  var P8_LABEL = { ATIVO: 'Ativo observado', PONTO_ATENCAO: 'Ponto de atenção', PARCIAL: 'Parcial / validar', MISTA: 'Leitura mista', LACUNA: 'Lacuna', COBERTURA_PARCIAL: 'Cobertura parcial' };

  function fallbackJourney(name, full) {
    var j = full && full.journey_views ? full.journey_views[name] : null;
    if (!j || j.score == null) return 'Ainda não há cobertura suficiente para interpretar esta parte da jornada.';
    if (j.score >= 75) return 'Os dados mostram estrutura mais consistente nesta parte da jornada. O valor está em preservar o que funciona e verificar como isso se conecta às demais etapas.';
    if (j.score >= 50) return 'Há elementos funcionando, mas a leitura ainda é mista. Vale observar onde a experiência depende de explicação, improviso ou esforço adicional para avançar.';
    return 'As respostas apontam menor estrutura nesta parte da jornada. O Score indica onde aprofundar; ele não define sozinho a causa nem a correção.';
  }

  function fallbackExecutive(pkt) {
    var assets = (pkt.p8_coverage || []).filter(function (p) { return p.classification === 'ATIVO'; }).map(function (p) { return p.p8; });
    var attn = (pkt.p8_coverage || []).filter(function (p) { return p.classification === 'PONTO_ATENCAO'; }).map(function (p) { return p.p8; });
    var txt = 'O Raio-X encontrou uma jornada com diferentes níveis de maturidade entre os 8Ps.';
    if (assets.length) txt += ' Há patrimônio observável em ' + assets.join(', ') + '.';
    if (attn.length) txt += ' Também existem sinais que merecem aprofundamento em ' + attn.join(', ') + '.';
    txt += ' A leitura abaixo separa o que já é evidência, o que é atenção e o que ainda precisa ser validado.';
    return txt;
  }

  function renderReport11(pkt, interp, interpretError) {
    injectStyles();
    var s = pkt.score || {};
    var full = pkt._score_full || {};
    var business = interp && interp.business_reading || {};
    var dest = interp && interp.destination || {};
    var journey = interp && interp.journey_reading || {};
    var h = '';

    // 0 — manchete / ponto de partida
    h += '<section class="rep-hero">';
    h += '<div class="rep-eyebrow">Seu Score da Jornada Digital</div>';
    if (s.status === 'FINAL') h += '<div class="rep-score"><span class="rep-score-num">' + esc(s.overall) + '</span><span class="rep-score-max">/100</span></div>';
    else h += '<div class="rep-score rep-score-insuf"><span class="rep-score-num">—</span></div><div class="rep-insuf-tag">Dados insuficientes para publicar o Score geral</div>';
    h += '<div class="rep-meta">' + esc(getRawAnswer('RX02') || 'Seu negócio') + ' · ' + new Date().toLocaleDateString('pt-BR') + ' · Cobertura ' + esc(s.coverage_pct) + '%</div>';
    h += '<div class="rx11-version">RX_REPORT_1.1 · leitura interpretativa</div></section>';

    if (interpretError) {
      h += '<div class="rx11-warning">A leitura interpretativa avançada não carregou nesta geração. O Score, a cobertura, o patrimônio e os pontos de atenção abaixo continuam válidos; nenhuma resposta aberta será reproduzida como conclusão.</div>';
    }

    // 1 — Ponto de partida
    h += '<section class="rep-sec"><div class="sec-num">01 — Ponto de partida</div><h3 class="rep-h">O que esta leitura mostra</h3>';
    h += '<div class="rx11-box soft"><div class="rx11-text">' + esc((interp && interp.executive_synthesis) || fallbackExecutive(pkt)) + '</div></div></section>';

    // 2 — negócio em uma leitura
    h += '<section class="rep-sec"><div class="sec-num">02 — Seu negócio em uma leitura</div><h3 class="rep-h">O que entendemos do modelo atual</h3>';
    if (business.headline || business.summary || business.operating_context) {
      h += '<div class="rx11-box"><div class="rx11-headline">' + esc(business.headline || 'Leitura do modelo de negócio') + '</div>';
      if (business.summary) h += '<div class="rx11-text">' + esc(business.summary) + '</div>';
      if (business.operating_context) h += '<div class="rx11-text" style="margin-top:10px;color:var(--sub)">' + esc(business.operating_context) + '</div>';
      h += sourcesHtml(['RX03','RX04','RX05','RX07','RX08']) + '</div>';
    } else {
      h += '<div class="rx11-box soft"><div class="rx11-text">O contexto, a oferta, o público, a forma de atendimento e o estágio do negócio foram registrados para compor a leitura. A versão de contingência não reproduz essas respostas como se fossem diagnóstico.</div></div>';
    }
    h += '</section>';

    // 3 — Hoje -> Destino
    h += '<section class="rep-sec"><div class="sec-num">03 — Hoje → Destino</div><h3 class="rep-h">Onde você quer chegar e como reconhecer avanço</h3><div class="rx11-grid2">';
    h += '<div class="rx11-box"><div class="rx11-k">Destino estratégico</div><div class="rx11-text">' + esc(dest.strategic_destination || 'O destino foi registrado para interpretação estratégica; a resposta original não é usada como conclusão por simples cópia.') + '</div>' + sourcesHtml(['RX29']) + '</div>';
    h += '<div class="rx11-box"><div class="rx11-k">Sinal de sucesso</div><div class="rx11-text">' + esc(dest.success_signal || 'O critério de melhora foi registrado para validar avanço com evidências, sem transformar a declaração original em texto automático.') + '</div>' + sourcesHtml(['RX30']) + '</div>';
    h += '</div></section>';

    // 4 — 8Ps
    h += '<section class="rep-sec"><div class="sec-num">04 — Cobertura do negócio</div><h3 class="rep-h">Os 8Ps da jornada</h3><p class="rep-p">As notas organizam maturidade e cobertura. Elas não definem sozinhas causa, prioridade ou solução.</p><div class="rep-p8grid">';
    (pkt.p8_coverage || []).forEach(function (p) {
      var sc = p.score;
      h += '<div class="p8card"><div class="p8top"><span class="p8name">' + esc(p.p8) + '</span><span class="p8tag ' + p8Class(p.classification) + '">' + esc(P8_LABEL[p.classification] || p.classification) + '</span></div>';
      h += '<div class="p8score">' + (sc == null ? '<span class="p8na">Sem dados</span>' : '<b>' + esc(sc) + '</b><span>/100</span>') + '</div><div class="p8bar"><i style="width:' + (sc == null ? 0 : sc) + '%"></i></div><div class="p8cov">Cobertura ' + esc(p.coverage && p.coverage.pct) + '%</div></div>';
    });
    h += '</div></section>';

    // 5 — jornada interpretada
    h += '<section class="rep-sec"><div class="sec-num">05 — Jornada</div><h3 class="rep-h">Encontrar → Entender → Avançar → Sustentar</h3><p class="rep-p">Aqui o valor está no cruzamento entre áreas, não em repetir cada resposta isoladamente.</p><div class="rx11-grid4">';
    ['Encontrar','Entender','Avançar','Sustentar'].forEach(function (name) {
      var j = full.journey_views && full.journey_views[name] || {};
      h += '<div class="rx11-journey"><div class="rx11-journey-label">' + name + '</div><div class="rx11-journey-score">' + (j.score == null ? '—' : esc(j.score)) + '</div><div class="rx11-text" style="font-size:12.5px">' + esc(journey[name] || fallbackJourney(name, full)) + '</div></div>';
    });
    h += '</div></section>';

    // 6 — patrimônio
    h += '<section class="rep-sec"><div class="sec-num">06 — Patrimônio</div><h3 class="rep-h">O que já existe e merece ser preservado</h3><div class="rx11-list">';
    var assets = interp && Array.isArray(interp.patrimony_readings) ? interp.patrimony_readings : [];
    if (assets.length) {
      assets.forEach(function (x) { h += '<div class="rx11-card asset"><div class="rx11-title">' + esc(x.title) + '</div><div class="rx11-text">' + esc(x.reading) + '</div>' + sourcesHtml(x.sources) + '</div>'; });
    } else if (pkt.patrimony && pkt.patrimony.length) {
      pkt.patrimony.slice(0,5).forEach(function (x) { h += '<div class="rx11-card asset"><div class="rx11-title">' + esc(x.what || 'Ativo observado') + '</div><div class="rx11-text">' + esc(x.why || 'Este elemento já existe e deve ser considerado antes de qualquer mudança.') + '</div><div class="rx11-source-row"><span class="rx11-source">' + esc(x.origin || 'Origem registrada') + '</span></div></div>'; });
    } else h += '<div class="rx11-gap">Ainda não há evidência suficiente para descrever ativos específicos com segurança.</div>';
    h += '</div></section>';

    // 7 — pontos de atenção interpretados
    h += '<section class="rep-sec"><div class="sec-num">07 — Pontos de atenção</div><h3 class="rep-h">O que merece ser observado com mais cuidado</h3><div class="rx11-list">';
    var att = interp && Array.isArray(interp.attention_readings) ? interp.attention_readings : [];
    if (att.length) {
      att.forEach(function (x) { h += '<div class="rx11-card attn"><div class="rx11-topline"><div class="rx11-title">' + esc(x.title) + '</div>' + confidenceHtml(x.confidence) + '</div><div class="rx11-text">' + esc(x.reading) + '</div>' + (x.possible_impact ? '<div class="rx11-text" style="margin-top:9px;color:var(--sub)"><b>Possível impacto:</b> ' + esc(x.possible_impact) + '</div>' : '') + sourcesHtml(x.sources) + '</div>'; });
    } else if (pkt.attention_points && pkt.attention_points.length) {
      pkt.attention_points.slice(0,5).forEach(function (x) { h += '<div class="rx11-card attn"><div class="rx11-title">' + esc(x.p8 || 'Ponto de atenção') + '</div><div class="rx11-text">' + esc(x.possible_reading || x.observation) + '</div><div class="rx11-text" style="margin-top:9px;color:var(--sub)">' + esc(x.probable_impact || '') + '</div><div class="rx11-source-row"><span class="rx11-source">' + esc(x.origin || '') + '</span></div></div>'; });
    } else h += '<div class="rx11-gap">Nenhum ponto de atenção sustentado foi identificado nas respostas scoreáveis.</div>';
    h += '</div></section>';

    // 8 — leituras cruzadas
    h += '<section class="rep-sec"><div class="sec-num">08 — Leituras cruzadas</div><h3 class="rep-h">O que aparece quando os dados conversam entre si</h3><div class="rx11-list">';
    var cross = interp && Array.isArray(interp.cross_readings) ? interp.cross_readings : [];
    if (cross.length) cross.forEach(function (x) { h += '<div class="rx11-card cross"><div class="rx11-topline"><div class="rx11-title">' + esc(x.title) + '</div>' + confidenceHtml(x.confidence) + '</div><div class="rx11-text">' + esc(x.reading) + '</div>' + sourcesHtml(x.sources) + '</div>'; });
    else h += '<div class="rx11-gap">As leituras cruzadas dependem da camada interpretativa. O relatório-base preserva os dados sem inventar conexões.</div>';
    h += '</div></section>';

    // 9 — lacunas e hipóteses
    h += '<section class="rep-sec"><div class="sec-num">09 — Lacunas e hipóteses</div><h3 class="rep-h">O que ainda não sabemos — e o que vale testar</h3><div class="rx11-grid2"><div><div class="rx11-k">Lacunas</div><div class="rx11-list">';
    if (pkt.gaps && pkt.gaps.length) pkt.gaps.slice(0,5).forEach(function (g) { h += '<div class="rx11-gap"><b>Não sabemos ainda:</b> ' + esc(g.unknown) + '<br><b>Para validar:</b> ' + esc(g.validate) + '</div>'; });
    else h += '<div class="rx11-gap">Não foram registradas lacunas nos itens scoreáveis.</div>';
    h += '</div></div><div><div class="rx11-k">Hipóteses iniciais</div><div class="rx11-list">';
    var hy = interp && Array.isArray(interp.hypotheses) ? interp.hypotheses : [];
    if (hy.length) hy.forEach(function (x) { h += '<div class="rx11-card hyp"><div class="rx11-topline"><div class="rx11-title">' + esc(x.title) + '</div>' + confidenceHtml(x.confidence) + '</div><div class="rx11-text"><b>Hipótese:</b> ' + esc(x.hypothesis) + '</div><div class="rx11-text" style="margin-top:8px"><b>O que validar:</b> ' + esc(x.what_to_validate) + '</div>' + sourcesHtml(x.sources) + '</div>'; });
    else h += '<div class="rx11-gap">Nenhuma hipótese automática será criada sem base suficiente. Isso é deliberado.</div>';
    h += '</div></div></div></section>';

    // 10 — ganhos rápidos
    h += '<section class="rep-sec"><div class="sec-num">10 — Ganhos rápidos</div><h3 class="rep-h">Pequenos testes que podem gerar informação útil</h3><p class="rep-p">Não é um plano de implantação. São movimentos simples para observar melhor a jornada.</p><div class="rx11-list">';
    var qw = interp && Array.isArray(interp.quick_wins) ? interp.quick_wins : [];
    if (qw.length) qw.forEach(function (x) { h += '<div class="rx11-card quick"><div class="rx11-title">' + esc(x.title) + '</div><div class="rx11-text">' + esc(x.test) + '</div><div class="rx11-text" style="margin-top:8px;color:var(--sub)"><b>Para quê:</b> ' + esc(x.why) + '</div>' + sourcesHtml(x.sources) + '</div>'; });
    else (pkt.tips || []).slice(0,4).forEach(function (t) { h += '<div class="rx11-card quick"><div class="rx11-text">' + esc(t) + '</div></div>'; });
    h += '</div></section>';

    // 11 — não decidir ainda
    h += '<section class="rep-sec"><div class="sec-num">11 — O que ainda não decidir</div><h3 class="rep-h">Decisões que seriam prematuras agora</h3><div class="rx11-list">';
    var nd = interp && Array.isArray(interp.not_to_decide) ? interp.not_to_decide : [
      'Não escolher uma causa única apenas pelo Score.',
      'Não definir uma sequência completa de implantação sem validar as hipóteses e lacunas.',
      'Não escolher um serviço automaticamente a partir da menor nota.'
    ];
    nd.forEach(function (x) { h += '<div class="rx11-no"><div class="rx11-text">' + esc(x) + '</div></div>'; });
    h += '</div></section>';

    // 12 — rota a validar
    var route = interp && interp.route_to_validate || {};
    h += '<section class="rep-sec"><div class="sec-num">12 — Rota a validar</div><h3 class="rep-h">Qual aprofundamento faz sentido daqui para frente</h3><div class="rx11-route"><div class="rx11-text">' + esc(route.reading || 'O Score mostra áreas de maturidade e atenção, mas a natureza da necessidade ainda deve ser validada antes de qualquer recomendação.') + '</div>';
    var qs = Array.isArray(route.validation_questions) ? route.validation_questions : [];
    if (qs.length) h += '<ul class="rx11-questions">' + qs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    h += '</div></section>';

    // limites / ações
    h += '<section class="rep-sec"><div class="sec-num">13 — Limites da leitura</div><h3 class="rep-h">O que este Raio-X não pretende concluir sozinho</h3><ul class="rep-lims">';
    (pkt.limitations || []).forEach(function (l) { h += '<li>' + esc(l) + '</li>'; });
    h += '<li>Respostas abertas são usadas como matéria-prima para interpretação; não são tratadas como diagnóstico por simples repetição.</li></ul>';
    h += '<div class="rx11-print"><button class="btn btn-ghost" onclick="window.print()">Imprimir / salvar PDF</button><a class="btn" target="_blank" href="https://wa.me/5531975073862?text=' + encodeURIComponent('Olá! Fiz meu Raio-X Estratégico e quero validar a leitura antes de decidir o próximo passo.') + '">Validar minha leitura →</a></div></section>';

    var body = document.getElementById('repbody');
    if (!body) {
      if (typeof baseRender === 'function') return baseRender(pkt);
      return;
    }
    body.innerHTML = h;
    if (typeof root.go === 'function') root.go('report');
  }

  root.renderReport = async function renderReportV11(pkt) {
    try {
      var interpretation = await requestInterpretation(pkt);
      // o packet permanece canônico; a camada interpretativa é anexada só para a UI.
      pkt.interpretation = interpretation;
      pkt.report_version = 'RX_REPORT_1.1';
      return renderReport11(pkt, interpretation, false);
    } catch (e) {
      console.warn('[YM][RX_REPORT_1.1] interpretação avançada indisponível:', e && e.message);
      pkt.report_version = 'RX_REPORT_1.1';
      return renderReport11(pkt, null, true);
    }
  };

  root.YM_RX_REPORT_11 = {
    version: 'RX_REPORT_1.1',
    humanResponses: humanResponses,
    requestInterpretation: requestInterpretation,
    render: renderReport11,
  };
})(window);

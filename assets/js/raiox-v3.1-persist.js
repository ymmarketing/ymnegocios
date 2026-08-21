/* YM Raio-X — persistência VOS_INTAKE_1.0 + RX_REPORT_1.1
 * A interpretação é anexada ao packet ANTES da persistência, quando disponível.
 * Hipóteses continuam sugestões e exigem validação humana no Motor VOS.
 */
(function (root) {
  'use strict';

  var ENDPOINT = 'https://srzdikgztpdtwbggwniz.supabase.co/functions/v1/save-raiox-intake';
  var TEST_ACCESS_ENDPOINT = 'https://ym-raiox-backend.vercel.app/api/acesso/teste';
  var REF_STORAGE_KEY = 'ym_raiox_ref';

  /*
   * Bootstrap de teste end-to-end.
   * O link de teste troca um token de uso único por uma referência aprovada no
   * mesmo mecanismo usado pelo fluxo real. Depois, a própria camada de pagamento
   * valida a ref normalmente. Não há bypass client-side nem cobrança no Asaas.
   */
  (function bootTestAccess() {
    var p;
    try { p = new URLSearchParams(root.location.search); } catch (e) { return; }
    var token = p.get('token');
    if (p.get('teste') !== '1' || !token || root.__YM_RX_TEST_BOOTSTRAP__) return;
    root.__YM_RX_TEST_BOOTSTRAP__ = true;

    fetch(TEST_ACCESS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ token: token })
    }).then(function (resp) {
      return resp.json().catch(function () { return {}; }).then(function (data) {
        if (!resp.ok || !data || data.ok !== true || !data.ref) {
          var msg = data && data.error ? data.error : ('http_' + resp.status);
          throw new Error(msg);
        }
        try { if (root.localStorage) root.localStorage.setItem(REF_STORAGE_KEY, data.ref); } catch (e) {}
        root.location.replace('/raio-x.html?ref=' + encodeURIComponent(data.ref) + '&teste=1');
      });
    }).catch(function (e) {
      console.error('[YM RX] falha ao iniciar acesso de teste:', e && e.message);
      try { document.documentElement.classList.remove('ym-flow-booting'); } catch (x) {}
      root.setTimeout(function () {
        var alert = document.getElementById('payx-alert');
        if (alert) {
          alert.style.display = 'block';
          alert.innerHTML = '<b>Não foi possível iniciar este teste.</b><br>' + String((e && e.message) || 'Tente gerar um novo link de teste.');
        }
      }, 250);
    });
  })();

  function getRef() {
    try {
      if (typeof root.lerRef === 'function') {
        var byApp = root.lerRef();
        if (byApp) return byApp;
      }
    } catch (e) {}
    try {
      var byQuery = new URLSearchParams(root.location.search).get('ref');
      if (byQuery) return byQuery;
    } catch (e) {}
    try { return root.localStorage ? root.localStorage.getItem(REF_STORAGE_KEY) : null; }
    catch (e) { return null; }
  }

  function assertPacket(packet) {
    if (!packet || typeof packet !== 'object') throw new Error('VOS Intake ausente.');
    if (packet.packet_version !== 'VOS_INTAKE_1.0') throw new Error('Versão de packet incompatível.');
    if (packet.questionnaire_version !== 'RX_CANONICO_1.0') throw new Error('Versão de questionário incompatível.');
    if (packet.scoring_version !== 'RX_SCORE_1.0') throw new Error('Versão de Score incompatível.');
    if (packet.report_version !== 'RX_REPORT_1.1') throw new Error('Versão de relatório incompatível.');
    if (packet.human_validation_required !== true) throw new Error('Validação humana obrigatória ausente.');
    if (packet.route_signal !== null) throw new Error('Rota automática não permitida.');
  }

  root.persistRaioX = async function persistRaioX(packet) {
    assertPacket(packet);
    var ref = getRef();
    if (!ref) throw new Error('Referência de acesso/pagamento não encontrada.');

    // O relatório enriquecido precisa viajar junto com o intake para o CRM/Motor.
    // Se a IA estiver temporariamente indisponível, preservamos o packet canônico
    // e deixamos o fallback visual cuidar da entrega, sem perder respostas/Score.
    if (!packet.interpretation && typeof root.YMPrepareRaioXInterpretation === 'function') {
      try { await root.YMPrepareRaioXInterpretation(packet); }
      catch (e) { console.warn('[YM RX] persistindo sem interpretação avançada:', e && e.message); }
    }

    var resp = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ ref: ref, packet: packet })
    });

    var data = null;
    try { data = await resp.json(); } catch (e) {}
    if (!resp.ok || !data || data.ok !== true) {
      var code = data && data.error ? data.error : ('http_' + resp.status);
      throw new Error('Persistência não confirmada: ' + code);
    }

    root.__YM_RAIOX_LAST_INTAKE__ = {
      intake_id: data.intake_id || null,
      case_id: data.case_id || null,
      opportunity_id: data.opportunity_id || null,
      created_at: data.created_at || null
    };
    return data;
  };
})(window);

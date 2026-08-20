/* YM Raio-X — persistência VOS_INTAKE_1.0 + RX_REPORT_1.1
 * A interpretação é anexada ao packet ANTES da persistência, quando disponível.
 * Hipóteses continuam sugestões e exigem validação humana no Motor VOS.
 */
(function (root) {
  'use strict';

  var ENDPOINT = 'https://srzdikgztpdtwbggwniz.supabase.co/functions/v1/save-raiox-intake';
  var REF_STORAGE_KEY = 'ym_raiox_ref';

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

/* YM Raio-X — shell de pagamento/sessão v1
 * ETAPA 3 · integração do RX v3.1 aprovado com backend existente.
 * Responsabilidade exclusiva: pagamento, ref, gate e contingência de acesso.
 * NÃO calcula Score, NÃO interpreta respostas, NÃO define rota, NÃO chama IA.
 */
(function (root) {
  'use strict';

  /* Produção assistida · 2026-08-08
   * A VSL ainda não está homologada. Remove apenas o bloco visual provisório,
   * sem alterar checkout, questionário, Score, relatório ou integrações.
   */
  function removeProvisionalVsl() {
    var vsl = document.querySelector('.vsl');
    if (vsl) vsl.remove();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', removeProvisionalVsl, { once: true });
  else removeProvisionalVsl();

  var API_BASE = 'https://ym-raiox-backend.vercel.app';
  var WHATSAPP_YM = 'https://wa.me/5531975073862';
  var REF_STORAGE_KEY = 'ym_raiox_ref';
  var PROTECTED = ['quiz', 'proc', 'report'];
  var paymentStatus = 'pending';
  var pollId = null;
  var pollAttempts = 0;

  var originalGo = root.go;
  var originalRunAnalysis = root.runAnalysis;
  if (typeof originalGo !== 'function' || typeof originalRunAnalysis !== 'function') {
    throw new Error('RX v3.1 não carregado antes do shell de pagamento.');
  }

  function saveRef(ref) {
    if (!ref) return;
    try { root.localStorage && root.localStorage.setItem(REF_STORAGE_KEY, ref); } catch (e) {}
  }
  function getRef() {
    try { var q = new URLSearchParams(root.location.search).get('ref'); if (q) { saveRef(q); return q; } } catch (e) {}
    try { return root.localStorage ? (root.localStorage.getItem(REF_STORAGE_KEY) || '') : ''; } catch (e) { return ''; }
  }
  function showPaymentMessage(html) {
    var box = document.getElementById('payx-alert');
    if (!box) return;
    box.style.display = 'block'; box.innerHTML = html;
  }
  function clearPaymentMessage() {
    var box = document.getElementById('payx-alert');
    if (box) { box.style.display = 'none'; box.innerHTML = ''; }
  }

  async function authorizedOnServer() {
    var ref = getRef();
    if (!ref) return false;
    try {
      var r = await fetch(API_BASE + '/api/pagamento/status?ref=' + encodeURIComponent(ref), { cache: 'no-store' });
      if (!r.ok) return false;
      var d = await r.json();
      return !!(d && d.status === 'approved');
    } catch (e) { return false; }
  }
  function goPayment(message) {
    originalGo('payment');
    if (message) showPaymentMessage(message);
  }

  root.go = function guardedGo(v) {
    if (PROTECTED.indexOf(v) !== -1 && paymentStatus !== 'approved') {
      goPayment('<b>Acesso protegido.</b><br>Confirme o pagamento para abrir o questionário.');
      return;
    }
    originalGo(v);
    if (PROTECTED.indexOf(v) !== -1) {
      authorizedOnServer().then(function (ok) {
        if (!ok) {
          paymentStatus = 'pending';
          var active = document.querySelector('.view.active');
          if (active && PROTECTED.indexOf(active.id.replace('view-', '')) !== -1) {
            goPayment('<b>Não conseguimos confirmar este acesso.</b><br>Se você já pagou, tente verificar novamente ou use o código recebido pelo WhatsApp.');
          }
        }
      });
    }
  };

  async function createPayment() {
    clearPaymentMessage();
    var buttons = document.querySelectorAll('[data-payx-start]');
    buttons.forEach(function (b) { b.disabled = true; b.dataset.oldText = b.textContent; b.textContent = 'Preparando pagamento…'; });
    try {
      var r = await fetch(API_BASE + '/api/pagamento/criar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
      });
      var d = await r.json().catch(function () { return {}; });
      if (!r.ok || !d.ok || !d.ref || !d.paymentUrl) throw new Error((d && d.error) || 'Não foi possível criar a cobrança.');
      saveRef(d.ref);
      paymentStatus = d.status || 'pending';
      originalGo('payment');
      root.location.href = d.paymentUrl;
    } catch (e) {
      goPayment('<b>Não foi possível iniciar o pagamento automático agora.</b><br>Fale com a YM pelo WhatsApp para concluir o acesso sem perder o atendimento.');
    } finally {
      buttons.forEach(function (b) { b.disabled = false; if (b.dataset.oldText) b.textContent = b.dataset.oldText; });
    }
  }

  async function checkPayment() {
    clearPaymentMessage();
    var btn = document.getElementById('payx-check');
    if (btn) { btn.disabled = true; btn.textContent = 'Verificando…'; }
    try {
      var ref = getRef();
      if (!ref) { showPaymentMessage('<b>Não encontramos uma referência de pagamento neste navegador.</b><br>Se você já pagou, use o código recebido pelo WhatsApp ou fale com a YM.'); return false; }
      var r = await fetch(API_BASE + '/api/pagamento/status?ref=' + encodeURIComponent(ref), { cache: 'no-store' });
      if (!r.ok) throw new Error('status_' + r.status);
      var d = await r.json();
      paymentStatus = d.status || 'pending';
      if (paymentStatus === 'approved') {
        stopPolling(); clearPaymentMessage(); originalGo('quiz'); root.renderQuiz(); return true;
      }
      var map = {
        awaiting_pix: '<b>Aguardando a confirmação do Pix.</b><br>Normalmente isso leva poucos segundos.',
        refused: '<b>O pagamento não foi aprovado.</b><br>Você pode tentar novamente ou falar com a YM.',
        canceled: '<b>A cobrança foi cancelada.</b><br>Inicie um novo pagamento para continuar.',
        expired: '<b>A cobrança expirou.</b><br>Inicie um novo pagamento para continuar.',
        refunded: '<b>Este pagamento foi estornado.</b><br>Fale com a YM se precisar de ajuda.'
      };
      showPaymentMessage(map[paymentStatus] || '<b>Pagamento ainda não confirmado.</b><br>Assim que o Asaas confirmar, o questionário será liberado.');
      return false;
    } catch (e) {
      showPaymentMessage('<b>Não foi possível verificar agora.</b><br>Tente novamente em instantes ou fale com a YM.'); return false;
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Verificar pagamento'; }
    }
  }

  function startPolling() {
    stopPolling(); pollAttempts = 0;
    if (!getRef()) return;
    pollId = root.setInterval(async function () {
      pollAttempts += 1; if (pollAttempts > 60) { stopPolling(); return; }
      var ok = await checkPayment(); if (ok) stopPolling();
    }, 5000);
  }
  function stopPolling() { if (pollId) { root.clearInterval(pollId); pollId = null; } }

  function formatCode(el) {
    var v = String(el.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.indexOf('YM') === 0) v = v.slice(2);
    var out = 'YM'; if (v.length) out += '-' + v.slice(0, 4); if (v.length > 4) out += '-' + v.slice(4, 8); el.value = out;
  }
  async function validateManualCode() {
    clearPaymentMessage();
    var inp = document.getElementById('payx-code'); var btn = document.getElementById('payx-code-btn');
    var code = inp ? String(inp.value || '').trim().toUpperCase() : '';
    if (code.length < 6) { showPaymentMessage('<b>Digite o código completo.</b>'); return; }
    if (code.indexOf('YM-MASTER') === 0) { showPaymentMessage('<b>Código não reconhecido.</b>'); return; }
    if (btn) { btn.disabled = true; btn.textContent = 'Validando…'; }
    try {
      var r = await fetch(API_BASE + '/api/acesso/manual', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codigo: code }) });
      var d = await r.json().catch(function () { return {}; });
      if (r.ok && d.ok && d.ref && d.status === 'approved') {
        saveRef(d.ref); paymentStatus = 'approved'; stopPolling(); originalGo('quiz'); root.renderQuiz(); return;
      }
      if (r.status === 429) showPaymentMessage('<b>Muitas tentativas.</b><br>Aguarde um minuto e tente novamente.');
      else if (d && d.jaUsado) showPaymentMessage('<b>Este código já foi utilizado.</b><br>Fale com a YM para verificar seu acesso.');
      else showPaymentMessage('<b>Código não reconhecido.</b><br>Confira a digitação ou fale com a YM.');
    } catch (e) { showPaymentMessage('<b>Não foi possível validar o código agora.</b><br>Tente novamente ou fale com a YM.'); }
    finally { if (btn) { btn.disabled = false; btn.textContent = 'Liberar meu Raio-X'; } }
  }

  root.startCheckout = createPayment;
  root.irParaPagamento = createPayment;
  root.checkPayment = checkPayment;
  root.validarCodigo = validateManualCode;
  root.formatarCodigo = formatCode;
  root.lerRef = getRef;
  root.salvarRef = saveRef;
  root.autorizadoNoServidor = authorizedOnServer;

  root.runAnalysis = async function paymentProtectedRunAnalysis() {
    var ok = await authorizedOnServer();
    if (!ok) { paymentStatus = 'pending'; goPayment('<b>Não conseguimos confirmar seu acesso para gerar o relatório.</b><br>Suas respostas continuam salvas neste navegador.'); return; }
    paymentStatus = 'approved'; return originalRunAnalysis();
  };

  function resumeFromPayment() {
    var ref = getRef(); if (!ref) return;
    originalGo('payment'); checkPayment(); startPolling();
    try { if (new URLSearchParams(root.location.search).get('ref')) root.history.replaceState(null, '', root.location.pathname + root.location.hash); } catch (e) {}
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      var active = document.querySelector('.view.active'); if (active && active.id === 'view-payment' && getRef()) startPolling();
    }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resumeFromPayment); else resumeFromPayment();
  var wa = document.getElementById('payx-whatsapp');
  if (wa) wa.href = WHATSAPP_YM + '?text=' + encodeURIComponent('Olá! Preciso de ajuda com o acesso ao Raio-X Estratégico.');
})(window);

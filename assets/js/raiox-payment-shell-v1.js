/* YM Raio-X — shell de pagamento/sessão v1.3
 * Fluxo público alinhado ao template visual do index.
 * Contingência permanece oculta e só aparece após falha técnica real de acesso/confirmação.
 * NÃO calcula Score, NÃO interpreta respostas, NÃO define rota, NÃO chama IA.
 */
(function (root) {
  'use strict';

  function preflightRoute() {
    try {
      var p = new URLSearchParams(root.location.search);
      var shouldShowPayment = p.get('checkout') === '1' || p.get('novo') === '1' || !!p.get('ref');
      if (!shouldShowPayment) {
        try { shouldShowPayment = !!(root.localStorage && root.localStorage.getItem('ym_raiox_ref')); } catch (e) {}
      }
      if (!shouldShowPayment) return;
      var intro = document.getElementById('view-intro');
      var payment = document.getElementById('view-payment');
      if (intro) intro.classList.remove('active');
      if (payment) payment.classList.add('active');
    } catch (e) {}
  }
  preflightRoute();

  function installPublicFunnelTemplate() {
    if (document.getElementById('ym-public-funnel-template-v1')) return;
    var st = document.createElement('style');
    st.id = 'ym-public-funnel-template-v1';
    st.textContent = `
      :root{--ym-navy:#0B1533;--ym-navy2:#111F4A;--ym-ink:#18213B;--ym-blue:#484DCF;--ym-blue2:#6B73E8;--ym-orange:#FF7A00;--ym-orange2:#FF963F;--ym-soft:#F7F8FC;--ym-soft2:#EEF1FF;--ym-line:#E4E8F1;--ym-muted:#68748E;--ym-shadow:0 20px 60px rgba(18,30,74,.12)}
      #view-payment,#view-quiz,#view-proc{min-height:100vh;background:radial-gradient(circle at 8% 8%,rgba(72,77,207,.08),transparent 27%),radial-gradient(circle at 92% 12%,rgba(255,122,0,.07),transparent 24%),#F7F8FC}
      #view-payment .payx-wrap{max-width:650px;padding-top:104px}
      #view-payment .payx-card{border:1px solid var(--ym-line);border-radius:28px;box-shadow:var(--ym-shadow);background:#fff}
      #view-payment .payx-head{position:relative;overflow:hidden;padding:34px 30px;background:radial-gradient(circle at 14% 12%,rgba(72,77,207,.35),transparent 33%),radial-gradient(circle at 88% 14%,rgba(255,122,0,.20),transparent 27%),linear-gradient(145deg,#08122E 0%,#101F4E 58%,#111F4A 100%)}
      #view-payment .payx-head:after{content:'';position:absolute;left:8%;right:8%;bottom:0;height:1px;background:repeating-linear-gradient(90deg,rgba(255,122,0,.55) 0 7px,transparent 7px 15px)}
      #view-payment .payx-k{color:#FFB278;font-weight:900;letter-spacing:.13em}
      #view-payment .payx-title{font-size:24px;letter-spacing:-.03em}
      #view-payment .payx-price{font-size:38px}
      #view-payment .payx-body{padding:32px 30px 30px}
      #view-payment .payx-lock{background:#FFF1E8;color:var(--ym-orange);width:54px;height:54px}
      #view-payment .payx-body h2{color:var(--ym-navy);font-size:24px;letter-spacing:-.03em}
      #view-payment .payx-body>p{max-width:500px;margin-left:auto;margin-right:auto;color:var(--ym-muted)}
      #view-payment .payx-actions{gap:11px}
      #view-payment .btn[data-payx-start]{min-height:54px;border-radius:999px;background:var(--ym-orange)!important;color:#fff!important;border:0!important;font-weight:850;box-shadow:0 12px 28px rgba(255,122,0,.24)}
      #view-payment #payx-check{min-height:50px;border-radius:999px;border:1px solid var(--ym-line)!important;background:#fff!important;color:var(--ym-blue)!important;font-weight:800}
      #view-payment #payx-customer-fields{max-width:none!important;margin:20px 0!important;padding:19px!important;border:1px solid var(--ym-line)!important;border-radius:18px!important;background:linear-gradient(145deg,#F9FAFD,#F2F4FF)!important}
      #view-payment #payx-customer-fields label{color:var(--ym-navy)!important}
      #view-payment #payx-customer-fields input{border:1.5px solid var(--ym-line)!important;border-radius:13px!important}
      #view-payment #payx-customer-fields input:focus{border-color:var(--ym-blue)!important;box-shadow:0 0 0 3px rgba(72,77,207,.10)}
      #view-payment .payx-alert{border-radius:14px;border-color:#F2D7B4;background:#FFF8EF;color:#805126}
      #view-payment .payx-support{color:var(--ym-blue);font-weight:750}
      #view-payment .payx-code{display:none;margin-top:20px;padding:18px;border:1px solid #F1D8C2;border-radius:18px;background:linear-gradient(145deg,#FFF9F4,#FFFDFB)}
      #view-payment .payx-code.ym-contingency-visible{display:block;animation:ymReveal .28s ease}
      #view-payment .payx-code-k{color:var(--ym-orange);font-weight:900}
      #view-payment .payx-input{border-radius:13px;border-color:var(--ym-line)}
      #view-payment .payx-input:focus{border-color:var(--ym-blue);box-shadow:0 0 0 3px rgba(72,77,207,.10)}
      #view-payment #payx-code-btn{border-radius:999px!important;color:var(--ym-blue)!important;border-color:var(--ym-line)!important;background:#fff!important;font-weight:800}
      #view-quiz .quiz-wrap{max-width:760px}
      #view-quiz .quiz-prog{height:7px;background:#E8EBF3}
      #view-quiz .quiz-prog-bar{background:linear-gradient(90deg,var(--ym-blue),var(--ym-blue2),var(--ym-orange))}
      #view-quiz .quiz-stage{color:var(--ym-orange);font-weight:900}
      #view-quiz .quiz-q{padding:26px;border:1px solid var(--ym-line);border-radius:26px;background:#fff;box-shadow:0 12px 34px rgba(18,30,74,.08)}
      #view-quiz .quiz-q h2{color:var(--ym-navy)}
      #view-quiz .opt{border-radius:15px;border-color:var(--ym-line)}
      #view-quiz .opt:hover,#view-quiz .opt.sel{border-color:var(--ym-blue);background:#F2F4FF}
      #view-quiz .opt.sel .opt-radio{border-color:var(--ym-blue)}
      #view-quiz .opt.sel .opt-radio:after{background:var(--ym-blue)}
      #view-quiz .quiz-nav .btn:not(.btn-ghost){border-radius:999px;background:var(--ym-orange);box-shadow:0 10px 24px rgba(255,122,0,.20);font-weight:850}
      #view-quiz .btn-ghost{border-radius:999px;background:#fff;color:var(--ym-blue);border-color:var(--ym-line)}
      #view-proc .proc{max-width:620px}
      #view-proc .proc-spin{border-color:#EEF1FF;border-top-color:var(--ym-orange)}
      #view-proc .proc h2{color:var(--ym-navy)}
      @keyframes ymReveal{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}
      @media(max-width:560px){#view-payment .payx-wrap{padding-top:82px}#view-payment .payx-card{border-radius:22px}#view-payment .payx-head{padding:27px 20px}#view-payment .payx-body{padding:24px 18px}#view-quiz .quiz-q{padding:20px;border-radius:20px}}
    `;
    document.head.appendChild(st);
  }
  installPublicFunnelTemplate();

  function removeProvisionalVsl() {
    var vsl = document.querySelector('.vsl');
    if (vsl) vsl.remove();
  }

  function onlyDigits(v) {
    return String(v || '').replace(/\D/g, '').slice(0, 14);
  }
  function formatDocument(v) {
    var d = onlyDigits(v);
    if (d.length <= 11) {
      return d.replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return d.replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }

  function hideContingency() {
    var box = document.querySelector('#view-payment .payx-code');
    if (box) box.classList.remove('ym-contingency-visible');
  }
  function revealContingency() {
    var box = document.querySelector('#view-payment .payx-code');
    if (box) box.classList.add('ym-contingency-visible');
  }

  function updatePaymentCopy() {
    var view = document.getElementById('view-payment');
    if (!view) return;
    var title = view.querySelector('.payx-body h2');
    var text = view.querySelector('.payx-body > p');
    if (title) title.textContent = 'Finalize seu pagamento';
    if (text) text.textContent = 'Informe o CPF ou CNPJ do pagador e siga para o checkout seguro. Depois da confirmação, seu Raio-X será liberado automaticamente.';
  }

  function ensurePaymentCustomerFields() {
    var view = document.getElementById('view-payment');
    if (!view || document.getElementById('payx-customer-fields')) return;
    var start = view.querySelector('[data-payx-start]');
    if (!start || !start.parentNode) return;

    var box = document.createElement('div');
    box.id = 'payx-customer-fields';
    box.style.cssText = 'max-width:540px;margin:18px auto 18px;text-align:left;background:#F7F9FC;border:1px solid #DDE4EE;border-radius:12px;padding:18px;';
    box.innerHTML =
      '<label for="payx-documento" style="display:block;font-size:13px;font-weight:700;color:#0A1628;margin-bottom:7px">CPF ou CNPJ do pagador</label>' +
      '<input id="payx-documento" type="text" inputmode="numeric" autocomplete="off" maxlength="18" placeholder="000.000.000-00" style="width:100%;padding:14px 15px;border:1.5px solid #DDE4EE;border-radius:10px;font:500 15px Inter,Arial,sans-serif;color:#1C2B40;background:#fff;outline:none">' +
      '<p style="font-size:11.5px;line-height:1.5;color:#6B7A99;margin:8px 0 0">O Asaas exige CPF ou CNPJ para gerar a cobrança. O documento é enviado com segurança ao Asaas e não é armazenado no Raio-X.</p>';
    start.parentNode.insertBefore(box, start);

    var input = document.getElementById('payx-documento');
    if (input) {
      input.addEventListener('input', function () { input.value = formatDocument(input.value); });
      input.addEventListener('focus', function () { input.style.borderColor = '#484DCF'; });
      input.addEventListener('blur', function () { input.style.borderColor = '#E4E8F1'; });
    }
  }

  var API_BASE = 'https://ym-raiox-backend.vercel.app';
  var WHATSAPP_YM = 'https://wa.me/5531975073862';
  var REF_STORAGE_KEY = 'ym_raiox_ref';
  var DRAFT_STORAGE_KEY = 'rx_draft_v1';
  var PROTECTED = ['quiz', 'proc', 'report'];
  var paymentStatus = 'pending';
  var pollId = null;
  var pollAttempts = 0;

  var originalGo = root.go;
  var originalRunAnalysis = root.runAnalysis;

  function clearStoredSession() {
    try {
      if (root.localStorage) {
        root.localStorage.removeItem(REF_STORAGE_KEY);
        root.localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    } catch (e) {}
  }
  function saveRef(ref) {
    if (!ref) return;
    try { root.localStorage && root.localStorage.setItem(REF_STORAGE_KEY, ref); } catch (e) {}
  }
  function getRef() {
    try { var q = new URLSearchParams(root.location.search).get('ref'); if (q) { saveRef(q); return q; } } catch (e) {}
    try { return root.localStorage ? (root.localStorage.getItem(REF_STORAGE_KEY) || '') : ''; } catch (e) { return ''; }
  }
  function isFreshCheckout() {
    try {
      var p = new URLSearchParams(root.location.search);
      return p.get('checkout') === '1' || p.get('novo') === '1';
    } catch (e) { return false; }
  }
  function clearFreshCheckoutParam() {
    try {
      var p = new URLSearchParams(root.location.search);
      p.delete('checkout');
      p.delete('novo');
      var qs = p.toString();
      root.history.replaceState(null, '', root.location.pathname + (qs ? '?' + qs : '') + root.location.hash);
    } catch (e) {}
  }

  function syncPaymentControls() {
    var check = document.getElementById('payx-check');
    if (check) check.style.display = getRef() ? '' : 'none';
  }
  function showPaymentMessage(html, allowContingency) {
    var box = document.getElementById('payx-alert');
    if (box) { box.style.display = 'block'; box.innerHTML = html; }
    if (allowContingency) revealContingency();
  }
  function clearPaymentMessage() {
    var box = document.getElementById('payx-alert');
    if (box) { box.style.display = 'none'; box.innerHTML = ''; }
  }

  function initPublicPaymentUi() {
    removeProvisionalVsl();
    updatePaymentCopy();
    ensurePaymentCustomerFields();
    hideContingency();
    syncPaymentControls();
  }

  if (typeof originalGo !== 'function' || typeof originalRunAnalysis !== 'function') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPublicPaymentUi, { once: true });
    else initPublicPaymentUi();
    return;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPublicPaymentUi, { once: true });
  else initPublicPaymentUi();

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

  function goPayment(message, allowContingency) {
    originalGo('payment');
    updatePaymentCopy();
    ensurePaymentCustomerFields();
    syncPaymentControls();
    if (!allowContingency) hideContingency();
    if (message) showPaymentMessage(message, !!allowContingency);
  }

  root.go = function guardedGo(v) {
    if (PROTECTED.indexOf(v) !== -1 && paymentStatus !== 'approved') {
      goPayment('<b>Acesso protegido.</b><br>Confirme o pagamento para abrir o questionário.', false);
      return;
    }
    originalGo(v);
    if (PROTECTED.indexOf(v) !== -1) {
      authorizedOnServer().then(function (ok) {
        if (!ok) {
          paymentStatus = 'pending';
          var active = document.querySelector('.view.active');
          if (active && PROTECTED.indexOf(active.id.replace('view-', '')) !== -1) {
            goPayment('<b>Não conseguimos confirmar seu acesso automaticamente.</b><br>Você pode verificar novamente. Se a falha persistir e a YM já tiver confirmado o pagamento, use a contingência abaixo.', true);
          }
        }
      });
    }
  };

  function beginNewCheckout() {
    stopPolling();
    clearStoredSession();
    paymentStatus = 'pending';
    clearPaymentMessage();
    hideContingency();
    goPayment(null, false);
  }

  async function createPayment() {
    clearPaymentMessage();
    hideContingency();
    ensurePaymentCustomerFields();

    var docInput = document.getElementById('payx-documento');
    var documento = onlyDigits(docInput ? docInput.value : '');
    if (documento.length !== 11 && documento.length !== 14) {
      originalGo('payment');
      updatePaymentCopy();
      ensurePaymentCustomerFields();
      showPaymentMessage('<b>Informe o CPF ou CNPJ do pagador.</b><br>Esse dado é exigido pelo Asaas para gerar a cobrança.', false);
      docInput = document.getElementById('payx-documento');
      if (docInput) docInput.focus();
      return;
    }

    var buttons = document.querySelectorAll('[data-payx-start]');
    buttons.forEach(function (b) { b.disabled = true; b.dataset.oldText = b.textContent; b.textContent = 'Preparando pagamento…'; });
    try {
      var r = await fetch(API_BASE + '/api/pagamento/criar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documento: documento })
      });
      var d = await r.json().catch(function () { return {}; });
      if (!r.ok || !d.ok || !d.ref || !d.paymentUrl) throw new Error((d && d.error) || 'Não foi possível criar a cobrança.');
      saveRef(d.ref);
      paymentStatus = d.status || 'pending';
      syncPaymentControls();
      originalGo('payment');
      root.location.href = d.paymentUrl;
    } catch (e) {
      goPayment('<b>Não foi possível iniciar o pagamento automático agora.</b><br>Fale com a YM pelo WhatsApp para concluir o atendimento.', false);
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
      if (!ref) {
        showPaymentMessage('<b>Não encontramos a referência deste pagamento neste navegador.</b><br>Se a YM já confirmou seu pagamento, a contingência foi liberada abaixo.', true);
        return false;
      }
      var r = await fetch(API_BASE + '/api/pagamento/status?ref=' + encodeURIComponent(ref), { cache: 'no-store' });
      if (!r.ok) throw new Error('status_' + r.status);
      var d = await r.json();
      paymentStatus = d.status || 'pending';
      if (paymentStatus === 'approved') {
        stopPolling();
        clearPaymentMessage();
        hideContingency();
        originalGo('quiz');
        root.renderQuiz();
        return true;
      }
      var map = {
        awaiting_pix: '<b>Aguardando a confirmação do Pix.</b><br>Normalmente isso leva poucos segundos.',
        refused: '<b>O pagamento não foi aprovado.</b><br>Você pode tentar novamente ou falar com a YM.',
        canceled: '<b>A cobrança foi cancelada.</b><br>Inicie um novo pagamento para continuar.',
        expired: '<b>A cobrança expirou.</b><br>Inicie um novo pagamento para continuar.',
        refunded: '<b>Este pagamento foi estornado.</b><br>Fale com a YM se precisar de ajuda.'
      };
      showPaymentMessage(map[paymentStatus] || '<b>Pagamento ainda não confirmado.</b><br>Assim que o Asaas confirmar, o questionário será liberado.', false);
      return false;
    } catch (e) {
      showPaymentMessage('<b>Não foi possível confirmar o pagamento automaticamente agora.</b><br>Tente novamente em instantes. Se a YM já confirmou seu pagamento, a contingência foi liberada abaixo.', true);
      return false;
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Verificar pagamento'; }
    }
  }

  function startPolling() {
    stopPolling();
    pollAttempts = 0;
    if (!getRef()) return;
    pollId = root.setInterval(async function () {
      pollAttempts += 1;
      if (pollAttempts > 60) { stopPolling(); return; }
      var ok = await checkPayment();
      if (ok) stopPolling();
    }, 5000);
  }
  function stopPolling() {
    if (pollId) { root.clearInterval(pollId); pollId = null; }
  }

  function formatCode(el) {
    var v = String(el.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.indexOf('YM') === 0) v = v.slice(2);
    var out = 'YM';
    if (v.length) out += '-' + v.slice(0, 4);
    if (v.length > 4) out += '-' + v.slice(4, 8);
    el.value = out;
  }

  async function validateManualCode() {
    clearPaymentMessage();
    revealContingency();
    var inp = document.getElementById('payx-code');
    var btn = document.getElementById('payx-code-btn');
    var code = inp ? String(inp.value || '').trim().toUpperCase() : '';
    if (code.length < 6) { showPaymentMessage('<b>Digite o código completo.</b>', true); return; }
    if (code.indexOf('YM-MASTER') === 0) { showPaymentMessage('<b>Código não reconhecido.</b>', true); return; }
    if (btn) { btn.disabled = true; btn.textContent = 'Validando…'; }
    try {
      var r = await fetch(API_BASE + '/api/acesso/manual', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codigo: code })
      });
      var d = await r.json().catch(function () { return {}; });
      if (r.ok && d.ok && d.ref && d.status === 'approved') {
        saveRef(d.ref);
        paymentStatus = 'approved';
        stopPolling();
        hideContingency();
        originalGo('quiz');
        root.renderQuiz();
        return;
      }
      if (r.status === 429) showPaymentMessage('<b>Muitas tentativas.</b><br>Aguarde um minuto e tente novamente.', true);
      else if (d && d.jaUsado) showPaymentMessage('<b>Este código já foi utilizado.</b><br>Fale com a YM para verificar seu acesso.', true);
      else showPaymentMessage('<b>Código não reconhecido.</b><br>Confira a digitação ou fale com a YM.', true);
    } catch (e) {
      showPaymentMessage('<b>Não foi possível validar o código agora.</b><br>Tente novamente ou fale com a YM.', true);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Liberar meu Raio-X'; }
    }
  }

  root.startCheckout = beginNewCheckout;
  root.irParaPagamento = createPayment;
  root.checkPayment = checkPayment;
  root.validarCodigo = validateManualCode;
  root.formatarCodigo = formatCode;
  root.lerRef = getRef;
  root.salvarRef = saveRef;
  root.autorizadoNoServidor = authorizedOnServer;

  root.runAnalysis = async function paymentProtectedRunAnalysis() {
    var ok = await authorizedOnServer();
    if (!ok) {
      paymentStatus = 'pending';
      goPayment('<b>Não conseguimos confirmar seu acesso para gerar o relatório.</b><br>Suas respostas continuam salvas. Se a YM já confirmou o pagamento, use a contingência liberada abaixo.', true);
      return;
    }
    paymentStatus = 'approved';
    return originalRunAnalysis();
  };

  function resumeFromPayment() {
    if (isFreshCheckout()) {
      stopPolling();
      clearStoredSession();
      paymentStatus = 'pending';
      originalGo('payment');
      updatePaymentCopy();
      ensurePaymentCustomerFields();
      hideContingency();
      syncPaymentControls();
      clearFreshCheckoutParam();
      return;
    }
    var ref = getRef();
    if (!ref) return;
    originalGo('payment');
    updatePaymentCopy();
    ensurePaymentCustomerFields();
    hideContingency();
    syncPaymentControls();
    checkPayment();
    startPolling();
    try {
      if (new URLSearchParams(root.location.search).get('ref')) root.history.replaceState(null, '', root.location.pathname + root.location.hash);
    } catch (e) {}
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      var active = document.querySelector('.view.active');
      if (active && active.id === 'view-payment' && getRef()) startPolling();
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resumeFromPayment);
  else resumeFromPayment();

  var wa = document.getElementById('payx-whatsapp');
  if (wa) wa.href = WHATSAPP_YM + '?text=' + encodeURIComponent('Olá! Preciso de ajuda com o acesso ao Raio-X Estratégico.');
})(window);

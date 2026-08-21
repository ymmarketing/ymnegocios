/* YM Raio-X — shell de pagamento/sessão v1.5
 * Template público YM + auditoria responsiva mobile/desktop.
 * Contingência fica oculta e só aparece após falha técnica real.
 * NÃO calcula Score, NÃO interpreta respostas, NÃO define rota, NÃO chama IA.
 */
(function (root) {
  'use strict';

  var API_BASE = 'https://ym-raiox-backend.vercel.app';
  var WHATSAPP_YM = 'https://wa.me/5531975073862';
  var INSTAGRAM_YM = 'https://www.instagram.com/ym_marketingenegocios/';
  var LINKEDIN_YM = 'https://br.linkedin.com/in/yasmin-menezes-06a187193';
  var REF_STORAGE_KEY = 'ym_raiox_ref';
  var DRAFT_STORAGE_KEY = 'rx_draft_v1';
  var PROTECTED = ['quiz', 'proc', 'report'];
  var paymentStatus = 'pending';
  var pollId = null;
  var pollAttempts = 0;

  function preflightRoute() {
    try {
      var p = new URLSearchParams(root.location.search);
      var shouldShowPayment = p.get('checkout') === '1' || p.get('novo') === '1' || !!p.get('ref');
      if (!shouldShowPayment) {
        try { shouldShowPayment = !!(root.localStorage && root.localStorage.getItem(REF_STORAGE_KEY)); } catch (e) {}
      }
      if (!shouldShowPayment) return;
      var intro = document.getElementById('view-intro');
      var payment = document.getElementById('view-payment');
      if (intro) intro.classList.remove('active');
      if (payment) payment.classList.add('active');
    } catch (e) {}
  }
  preflightRoute();

  function installPublicTemplate() {
    if (document.getElementById('ym-public-responsive-v14')) return;
    var st = document.createElement('style');
    st.id = 'ym-public-responsive-v14';
    st.textContent = `
      :root{--ym-navy:#0B1533;--ym-navy2:#111F4A;--ym-blue:#484DCF;--ym-blue2:#6B73E8;--ym-orange:#FF7A00;--ym-line:#E4E8F1;--ym-muted:#68748E;--ym-shadow:0 20px 60px rgba(18,30,74,.12)}
      html{-webkit-text-size-adjust:100%}body{overflow-x:hidden}button,a,input,textarea{touch-action:manipulation}
      nav.ym-flow-nav{position:fixed;top:0;left:0;right:0;z-index:100;height:72px;background:rgba(255,255,255,.96);backdrop-filter:blur(14px);border-bottom:1px solid var(--ym-line);display:flex;align-items:center;padding:0 clamp(18px,5vw,44px)}
      nav.ym-flow-nav .nav-brand{display:flex;align-items:center}.ym-flow-logo{height:36px;width:auto;max-width:min(215px,58vw);display:block}.ym-flow-nav .nav-chip{margin-left:auto;background:#EEF1FF;border:1px solid rgba(72,77,207,.16);color:var(--ym-blue);padding:6px 12px;border-radius:999px;font-size:9px;font-weight:850;letter-spacing:.1em;text-transform:uppercase}
      #view-payment,#view-quiz,#view-proc{min-height:100vh;background:radial-gradient(circle at 8% 8%,rgba(72,77,207,.08),transparent 27%),radial-gradient(circle at 92% 12%,rgba(255,122,0,.07),transparent 24%),#F7F8FC}
      #view-payment .payx-wrap{max-width:650px;padding-top:108px;padding-bottom:60px}
      #view-payment .payx-card{border:1px solid var(--ym-line);border-radius:28px;box-shadow:var(--ym-shadow);background:#fff}
      #view-payment .payx-head{position:relative;overflow:hidden;padding:34px 30px;background:radial-gradient(circle at 14% 12%,rgba(72,77,207,.35),transparent 33%),radial-gradient(circle at 88% 14%,rgba(255,122,0,.20),transparent 27%),linear-gradient(145deg,#08122E 0%,#101F4E 58%,#111F4A 100%)}
      #view-payment .payx-head:after{content:'';position:absolute;left:8%;right:8%;bottom:0;height:1px;background:repeating-linear-gradient(90deg,rgba(255,122,0,.55) 0 7px,transparent 7px 15px)}
      #view-payment .payx-k{color:#FFB278;font-weight:900;letter-spacing:.13em}.payx-title{letter-spacing:-.03em}.payx-price{font-size:38px!important}
      #view-payment .payx-body{padding:32px 30px 30px}.payx-lock{background:#FFF1E8!important;color:var(--ym-orange)!important;width:54px!important;height:54px!important}
      #view-payment .payx-body h2{color:var(--ym-navy);font-size:24px;letter-spacing:-.03em}.payx-body>p{max-width:500px;margin-left:auto!important;margin-right:auto!important;color:var(--ym-muted)!important}
      #view-payment .payx-actions{gap:11px}.payx-actions .btn,.payx-code .btn{min-height:50px!important;border-radius:999px!important}
      #view-payment .btn[data-payx-start]{min-height:54px!important;background:var(--ym-orange)!important;color:#fff!important;border:0!important;font-weight:850;box-shadow:0 12px 28px rgba(255,122,0,.24)}
      #view-payment #payx-check{border:1px solid var(--ym-line)!important;background:#fff!important;color:var(--ym-blue)!important;font-weight:800}
      #view-payment #payx-customer-fields{max-width:none!important;margin:20px 0!important;padding:19px!important;border:1px solid var(--ym-line)!important;border-radius:18px!important;background:linear-gradient(145deg,#F9FAFD,#F2F4FF)!important}
      #view-payment #payx-customer-fields label{color:var(--ym-navy)!important}#view-payment #payx-customer-fields input,#view-payment .payx-input{font-size:16px!important;border:1.5px solid var(--ym-line)!important;border-radius:13px!important;min-height:50px}
      #view-payment #payx-customer-fields input:focus,#view-payment .payx-input:focus{border-color:var(--ym-blue)!important;box-shadow:0 0 0 3px rgba(72,77,207,.10)!important}
      #view-payment .payx-alert{border-radius:14px!important;border-color:#F2D7B4!important;background:#FFF8EF!important;color:#805126!important}.payx-support{color:var(--ym-blue)!important;font-weight:750!important;min-height:44px;display:inline-flex!important;align-items:center;justify-content:center}
      #view-payment .payx-code{display:none;margin-top:20px;padding:18px!important;border:1px solid #F1D8C2!important;border-radius:18px!important;background:linear-gradient(145deg,#FFF9F4,#FFFDFB)}#view-payment .payx-code.ym-contingency-visible{display:block;animation:ymReveal .28s ease}.payx-code-k{color:var(--ym-orange)!important;font-weight:900!important}
      #view-quiz .quiz-wrap{max-width:760px;padding-left:clamp(16px,5vw,36px);padding-right:clamp(16px,5vw,36px)}#view-quiz .quiz-prog{height:7px;background:#E8EBF3}.quiz-prog-bar{background:linear-gradient(90deg,var(--ym-blue),var(--ym-blue2),var(--ym-orange))!important}.quiz-stage{color:var(--ym-orange)!important;font-weight:900!important}
      #view-quiz .quiz-q{padding:26px;border:1px solid var(--ym-line);border-radius:26px;background:#fff;box-shadow:0 12px 34px rgba(18,30,74,.08)}#view-quiz .quiz-q h2{color:var(--ym-navy)}
      #view-quiz .opt{border-radius:15px;border-color:var(--ym-line);min-height:54px;display:flex;align-items:center}#view-quiz .opt:hover,#view-quiz .opt.sel{border-color:var(--ym-blue);background:#F2F4FF}#view-quiz .opt.sel .opt-radio{border-color:var(--ym-blue)}#view-quiz .opt.sel .opt-radio:after{background:var(--ym-blue)}
      #view-quiz .txt-input,#view-quiz .txt-area{font-size:16px!important;border-radius:14px!important}#view-quiz .quiz-nav .btn{min-height:48px;border-radius:999px!important;font-weight:800}#view-quiz .quiz-nav .btn:not(.btn-ghost){background:var(--ym-orange)!important;box-shadow:0 10px 24px rgba(255,122,0,.20)}#view-quiz .btn-ghost{background:#fff!important;color:var(--ym-blue)!important;border-color:var(--ym-line)!important}
      #view-proc .proc{max-width:620px;padding-left:20px;padding-right:20px}.proc-spin{border-color:#EEF1FF!important;border-top-color:var(--ym-orange)!important}.proc h2{color:var(--ym-navy)!important}
      #sobre .contact-line .btn{min-height:48px}.footer-links a{min-height:44px}.mobile-sticky{bottom:calc(12px + env(safe-area-inset-bottom,0px))!important}.mobile-sticky .btn{min-height:54px}
      @keyframes ymReveal{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}
      @media(max-width:650px){
        .topbar{padding:8px 12px!important;font-size:.78rem!important;line-height:1.35}.navin{min-height:62px!important}.links .btn{display:none!important}
        #sobre .contact-line{display:grid!important;grid-template-columns:1fr!important;width:100%;gap:9px!important}#sobre .contact-line .btn{width:100%;justify-content:center}
        .footer-links{gap:8px!important}.footer-links a{width:100%;justify-content:center}
        body{padding-bottom:calc(82px + env(safe-area-inset-bottom,0px))!important}
      }
      @media(max-width:560px){
        nav.ym-flow-nav{height:62px;padding:0 14px}.ym-flow-logo{height:31px;max-width:58vw}.ym-flow-nav .nav-chip{display:none}
        #view-payment .payx-wrap{padding:82px 12px calc(38px + env(safe-area-inset-bottom,0px))}#view-payment .payx-card{border-radius:22px}#view-payment .payx-head{padding:27px 18px}#view-payment .payx-body{padding:24px 16px 22px}.payx-title{font-size:20px!important}.payx-price{font-size:34px!important}
        #view-quiz .quiz-wrap{padding-top:86px!important;padding-bottom:calc(42px + env(safe-area-inset-bottom,0px))!important}#view-quiz .quiz-q{padding:20px 17px;border-radius:20px}#view-quiz .quiz-q h2{font-size:clamp(20px,6vw,24px)!important;line-height:1.25!important}.quiz-meta{gap:8px!important}.opt{font-size:14px!important;padding:14px!important}.quiz-nav{gap:8px!important}.quiz-nav .btn{padding:12px 16px!important}
        #view-proc .proc{padding-top:110px!important;padding-bottom:calc(60px + env(safe-area-inset-bottom,0px))!important}
      }
      @media(max-width:390px){#view-quiz .quiz-nav .btn{flex:1;justify-content:center}.payx-body h2{font-size:21px!important}.payx-body>p{font-size:13.5px!important}}
    `;
    document.head.appendChild(st);
  }
  installPublicTemplate();

  function patchFlowNav() {
    var nav = document.querySelector('body > nav');
    var brand = nav && nav.querySelector('.nav-brand');
    if (!nav || !brand) return;
    nav.classList.add('ym-flow-nav');
    brand.innerHTML = '<a href="/" aria-label="Voltar ao site da YM"><img class="ym-flow-logo" src="/assets/img/logo-ym-horizontal.webp" alt="YM Marketing & Negócios"></a>';
    var chip = nav.querySelector('.nav-chip');
    if (chip) chip.textContent = 'Raio-X Estratégico';
  }

  function patchIndexContactLinks() {
    var line = document.querySelector('#sobre .contact-line');
    if (!line || line.dataset.ymSocialPatched === '1') return;
    line.dataset.ymSocialPatched = '1';
    var wa = WHATSAPP_YM + '?text=' + encodeURIComponent('Olá, Yasmin! Vim pelo site da YM e gostaria de falar com você.');
    line.innerHTML =
      '<a class="btn" href="' + wa + '" target="_blank" rel="noopener">Falar comigo <i data-lucide="message-circle"></i></a>' +
      '<a class="btn ghost" href="' + INSTAGRAM_YM + '" target="_blank" rel="noopener">Instagram <i data-lucide="instagram"></i></a>' +
      '<a class="btn ghost" href="' + LINKEDIN_YM + '" target="_blank" rel="noopener">LinkedIn <i data-lucide="linkedin"></i></a>';
    try { if (root.lucide) root.lucide.createIcons(); } catch (e) {}
  }

  function removeProvisionalVsl() {
    var vsl = document.querySelector('.vsl');
    if (vsl) vsl.remove();
  }

  function onlyDigits(v) { return String(v || '').replace(/\D/g, '').slice(0, 14); }
  function formatDocument(v) {
    var d = onlyDigits(v);
    if (d.length <= 11) return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return d.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }

  function hideContingency() { var box = document.querySelector('#view-payment .payx-code'); if (box) box.classList.remove('ym-contingency-visible'); }
  function revealContingency() { var box = document.querySelector('#view-payment .payx-code'); if (box) box.classList.add('ym-contingency-visible'); }

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
    box.innerHTML = '<label for="payx-documento" style="display:block;font-size:13px;font-weight:700;margin-bottom:7px">CPF ou CNPJ do pagador</label>' +
      '<input id="payx-documento" type="text" inputmode="numeric" autocomplete="off" maxlength="18" placeholder="000.000.000-00" style="width:100%;padding:14px 15px;background:#fff;outline:none">' +
      '<p style="font-size:11.5px;line-height:1.5;color:#68748E;margin:8px 0 0">O Asaas exige CPF ou CNPJ para gerar a cobrança. O documento é enviado com segurança ao Asaas e não é armazenado no Raio-X.</p>';
    start.parentNode.insertBefore(box, start);
    var input = document.getElementById('payx-documento');
    if (input) input.addEventListener('input', function () { input.value = formatDocument(input.value); });
  }

  function clearStoredSession() {
    try { if (root.localStorage) { root.localStorage.removeItem(REF_STORAGE_KEY); root.localStorage.removeItem(DRAFT_STORAGE_KEY); } } catch (e) {}
  }
  function saveRef(ref) { if (!ref) return; try { root.localStorage && root.localStorage.setItem(REF_STORAGE_KEY, ref); } catch (e) {} }
  function getRef() {
    try { var q = new URLSearchParams(root.location.search).get('ref'); if (q) { saveRef(q); return q; } } catch (e) {}
    try { return root.localStorage ? (root.localStorage.getItem(REF_STORAGE_KEY) || '') : ''; } catch (e) { return ''; }
  }
  function isFreshCheckout() { try { var p = new URLSearchParams(root.location.search); return p.get('checkout') === '1' || p.get('novo') === '1'; } catch (e) { return false; } }
  function clearFreshCheckoutParam() {
    try { var p = new URLSearchParams(root.location.search); p.delete('checkout'); p.delete('novo'); var qs = p.toString(); root.history.replaceState(null, '', root.location.pathname + (qs ? '?' + qs : '') + root.location.hash); } catch (e) {}
  }

  function syncPaymentControls() { var check = document.getElementById('payx-check'); if (check) check.style.display = getRef() ? '' : 'none'; }
  function showPaymentMessage(html, allowContingency) { var box = document.getElementById('payx-alert'); if (box) { box.style.display = 'block'; box.innerHTML = html; } if (allowContingency) revealContingency(); }
  function clearPaymentMessage() { var box = document.getElementById('payx-alert'); if (box) { box.style.display = 'none'; box.innerHTML = ''; } }

  function initPublicUi() {
    patchFlowNav();
    patchIndexContactLinks();
    removeProvisionalVsl();
    updatePaymentCopy();
    ensurePaymentCustomerFields();
    hideContingency();
    syncPaymentControls();
  }

  /* CTA público: garante a navegação Home -> checkout mesmo quando a Home não carrega o app do questionário. */
  root.startNewRaiox = function startNewRaiox() { root.location.href = '/raio-x.html?checkout=1'; };

  var originalGo = root.go;
  var originalRunAnalysis = root.runAnalysis;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPublicUi, { once: true });
  else initPublicUi();

  /* Na Home este shell atua apenas como CTA/template. */
  if (typeof originalGo !== 'function' || typeof originalRunAnalysis !== 'function') return;

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
    originalGo('payment'); updatePaymentCopy(); ensurePaymentCustomerFields(); syncPaymentControls();
    if (!allowContingency) hideContingency();
    if (message) showPaymentMessage(message, !!allowContingency);
  }

  root.go = function guardedGo(v) {
    if (PROTECTED.indexOf(v) !== -1 && paymentStatus !== 'approved') { goPayment('<b>Acesso protegido.</b><br>Confirme o pagamento para abrir o questionário.', false); return; }
    originalGo(v);
    if (PROTECTED.indexOf(v) !== -1) {
      authorizedOnServer().then(function (ok) {
        if (!ok) {
          paymentStatus = 'pending';
          var active = document.querySelector('.view.active');
          if (active && PROTECTED.indexOf(active.id.replace('view-', '')) !== -1) goPayment('<b>Não conseguimos confirmar seu acesso automaticamente.</b><br>Você pode verificar novamente. Se a falha persistir e a YM já tiver confirmado o pagamento, use a contingência abaixo.', true);
        }
      });
    }
  };

  function beginNewCheckout() { stopPolling(); clearStoredSession(); paymentStatus = 'pending'; clearPaymentMessage(); hideContingency(); goPayment(null, false); }

  async function createPayment() {
    clearPaymentMessage(); hideContingency(); ensurePaymentCustomerFields();
    var docInput = document.getElementById('payx-documento');
    var documento = onlyDigits(docInput ? docInput.value : '');
    if (documento.length !== 11 && documento.length !== 14) {
      goPayment('<b>Informe o CPF ou CNPJ do pagador.</b><br>Esse dado é exigido pelo Asaas para gerar a cobrança.', false);
      docInput = document.getElementById('payx-documento'); if (docInput) docInput.focus(); return;
    }
    var buttons = document.querySelectorAll('[data-payx-start]');
    buttons.forEach(function (b) { b.disabled = true; b.dataset.oldText = b.textContent; b.textContent = 'Preparando pagamento…'; });
    try {
      var r = await fetch(API_BASE + '/api/pagamento/criar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documento: documento }) });
      var d = await r.json().catch(function () { return {}; });
      if (!r.ok || !d.ok || !d.ref || !d.paymentUrl) throw new Error((d && d.error) || 'Não foi possível criar a cobrança.');
      saveRef(d.ref); paymentStatus = d.status || 'pending'; syncPaymentControls(); root.location.href = d.paymentUrl;
    } catch (e) {
      goPayment('<b>Não foi possível iniciar o pagamento automático agora.</b><br>Fale com a YM pelo WhatsApp para concluir o atendimento.', false);
    } finally {
      buttons.forEach(function (b) { b.disabled = false; if (b.dataset.oldText) b.textContent = b.dataset.oldText; });
    }
  }

  async function checkPayment() {
    clearPaymentMessage(); var btn = document.getElementById('payx-check'); if (btn) { btn.disabled = true; btn.textContent = 'Verificando…'; }
    try {
      var ref = getRef();
      if (!ref) { showPaymentMessage('<b>Não encontramos a referência deste pagamento neste navegador.</b><br>Se a YM já confirmou seu pagamento, a contingência foi liberada abaixo.', true); return false; }
      var r = await fetch(API_BASE + '/api/pagamento/status?ref=' + encodeURIComponent(ref), { cache: 'no-store' });
      if (!r.ok) throw new Error('status_' + r.status);
      var d = await r.json(); paymentStatus = d.status || 'pending';
      if (paymentStatus === 'approved') { stopPolling(); clearPaymentMessage(); hideContingency(); originalGo('quiz'); root.renderQuiz(); return true; }
      var map = { awaiting_pix:'<b>Aguardando a confirmação do Pix.</b><br>Normalmente isso leva poucos segundos.', refused:'<b>O pagamento não foi aprovado.</b><br>Você pode tentar novamente ou falar com a YM.', canceled:'<b>A cobrança foi cancelada.</b><br>Inicie um novo pagamento para continuar.', expired:'<b>A cobrança expirou.</b><br>Inicie um novo pagamento para continuar.', refunded:'<b>Este pagamento foi estornado.</b><br>Fale com a YM se precisar de ajuda.' };
      showPaymentMessage(map[paymentStatus] || '<b>Pagamento ainda não confirmado.</b><br>Assim que o Asaas confirmar, o questionário será liberado.', false); return false;
    } catch (e) {
      showPaymentMessage('<b>Não foi possível confirmar o pagamento automaticamente agora.</b><br>Tente novamente em instantes. Se a YM já confirmou seu pagamento, a contingência foi liberada abaixo.', true); return false;
    } finally { if (btn) { btn.disabled = false; btn.textContent = 'Verificar pagamento'; } }
  }

  function startPolling() { stopPolling(); pollAttempts = 0; if (!getRef()) return; pollId = root.setInterval(async function () { pollAttempts += 1; if (pollAttempts > 60) { stopPolling(); return; } var ok = await checkPayment(); if (ok) stopPolling(); }, 5000); }
  function stopPolling() { if (pollId) { root.clearInterval(pollId); pollId = null; } }

  function formatCode(el) { var v = String(el.value || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v.indexOf('YM') === 0) v = v.slice(2); var out = 'YM'; if (v.length) out += '-' + v.slice(0,4); if (v.length > 4) out += '-' + v.slice(4,8); el.value = out; }

  async function validateManualCode() {
    clearPaymentMessage(); revealContingency();
    var inp = document.getElementById('payx-code'); var btn = document.getElementById('payx-code-btn'); var code = inp ? String(inp.value || '').trim().toUpperCase() : '';
    if (code.length < 6) { showPaymentMessage('<b>Digite o código completo.</b>', true); return; }
    if (code.indexOf('YM-MASTER') === 0) { showPaymentMessage('<b>Código não reconhecido.</b>', true); return; }
    if (btn) { btn.disabled = true; btn.textContent = 'Validando…'; }
    try {
      var r = await fetch(API_BASE + '/api/acesso/manual', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({codigo:code}) });
      var d = await r.json().catch(function(){return{};});
      if (r.ok && d.ok && d.ref && d.status === 'approved') { saveRef(d.ref); paymentStatus='approved'; stopPolling(); hideContingency(); originalGo('quiz'); root.renderQuiz(); return; }
      if (r.status === 429) showPaymentMessage('<b>Muitas tentativas.</b><br>Aguarde um minuto e tente novamente.', true);
      else if (d && d.jaUsado) showPaymentMessage('<b>Este código já foi utilizado.</b><br>Fale com a YM para verificar seu acesso.', true);
      else showPaymentMessage('<b>Código não reconhecido.</b><br>Confira a digitação ou fale com a YM.', true);
    } catch (e) { showPaymentMessage('<b>Não foi possível validar o código agora.</b><br>Tente novamente ou fale com a YM.', true); }
    finally { if (btn) { btn.disabled=false; btn.textContent='Liberar meu Raio-X'; } }
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
    if (!ok) { paymentStatus='pending'; goPayment('<b>Não conseguimos confirmar seu acesso para gerar o relatório.</b><br>Suas respostas continuam salvas. Se a YM já confirmou o pagamento, use a contingência liberada abaixo.', true); return; }
    paymentStatus='approved'; return originalRunAnalysis();
  };

  function markFlowReady() {
    try { document.documentElement.classList.remove('ym-flow-booting'); } catch (e) {}
  }

  function resumeFromPayment() {
    try {
      var testParams = new URLSearchParams(root.location.search);
      if (testParams.get('teste_execucao') === '1' && getRef()) {
        paymentStatus = 'approved';
        originalGo('quiz');
        root.renderQuiz();
        markFlowReady();
        try { root.history.replaceState(null, '', root.location.pathname + '?ref=' + encodeURIComponent(getRef())); } catch (e) {}
        return;
      }
    } catch (e) {}
    if (isFreshCheckout()) {
      stopPolling(); clearStoredSession(); paymentStatus='pending'; originalGo('payment'); updatePaymentCopy(); ensurePaymentCustomerFields(); hideContingency(); syncPaymentControls(); clearFreshCheckoutParam(); markFlowReady(); return;
    }
    var ref=getRef();
    if (!ref) { markFlowReady(); root.location.replace('/'); return; }
    originalGo('payment'); updatePaymentCopy(); ensurePaymentCustomerFields(); hideContingency(); syncPaymentControls(); markFlowReady(); checkPayment(); startPolling();
    try { if (new URLSearchParams(root.location.search).get('ref')) root.history.replaceState(null,'',root.location.pathname+root.location.hash); } catch(e) {}
  }

  root.addEventListener('pageshow', function () {
    var active=document.querySelector('.view.active');
    if (active && active.id==='view-intro') {
      var ref=getRef();
      if (ref) { originalGo('payment'); updatePaymentCopy(); ensurePaymentCustomerFields(); hideContingency(); syncPaymentControls(); markFlowReady(); checkPayment(); startPolling(); }
      else root.location.replace('/');
    }
  });

  document.addEventListener('visibilitychange', function () { if (document.visibilityState==='visible') { var active=document.querySelector('.view.active'); if (active && active.id==='view-payment' && getRef()) startPolling(); } });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resumeFromPayment); else resumeFromPayment();

  var wa = document.getElementById('payx-whatsapp');
  if (wa) wa.href = WHATSAPP_YM + '?text=' + encodeURIComponent('Olá! Preciso de ajuda com o acesso ao Raio-X Estratégico.');
})(window);

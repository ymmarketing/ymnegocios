(() => {
  const config = window.MB_CONFIG || {};
  const form = document.getElementById('purchaseForm');
  const emailInput = document.getElementById('purchaseEmail');
  const button = document.getElementById('purchaseButton');
  const message = document.getElementById('purchaseMessage');
  const statusBanner = document.getElementById('checkoutStatus');

  const storedEmail = localStorage.getItem('mb_checkout_email');
  if (storedEmail) emailInput.value = storedEmail;

  const params = new URLSearchParams(location.search);
  const checkout = params.get('checkout');
  if (checkout) renderCheckoutReturn(checkout);

  function renderCheckoutReturn(status) {
    const states = {
      success: {
        cls: 'success',
        title: 'Pagamento enviado para confirmação',
        body: 'Agora crie sua conta com o mesmo e-mail usado na compra. Se o pagamento ainda estiver sendo processado, seu acesso aparecerá assim que o Asaas confirmar.',
        action: '<a class="secondary-link" href="./acesso.html">Criar conta e acessar</a>'
      },
      cancel: {
        cls: 'warning',
        title: 'Pagamento cancelado',
        body: 'Nenhuma jornada foi liberada. Você pode escolher a forma de pagamento novamente quando quiser.',
        action: '<a class="secondary-link" href="#comprar">Tentar novamente</a>'
      },
      expired: {
        cls: 'warning',
        title: 'Este checkout expirou',
        body: 'Gere um novo checkout abaixo para continuar.',
        action: '<a class="secondary-link" href="#comprar">Gerar novo checkout</a>'
      }
    };
    const current = states[status];
    if (!current) return;
    statusBanner.hidden = false;
    statusBanner.className = `status-banner ${current.cls}`;
    statusBanner.innerHTML = `<div><strong>${current.title}</strong><p>${current.body}</p></div>${current.action}`;
  }

  function setMessage(text, kind = '') {
    message.textContent = text;
    message.dataset.kind = kind;
  }

  function configured() {
    return config.mode === 'supabase' && /^https:\/\//.test(config.createCheckoutUrl || '');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage('');

    const email = emailInput.value.trim().toLowerCase();
    const renewalMode = new FormData(form).get('renewalMode') || 'one_time';
    if (!email) return;

    localStorage.setItem('mb_checkout_email', email);
    localStorage.setItem('mb_checkout_mode', String(renewalMode));

    if (!configured()) {
      setMessage('O checkout está pronto no código, mas ainda aguarda a conexão do projeto Supabase do Menos Bucho.', 'info');
      return;
    }

    button.disabled = true;
    button.textContent = 'Criando checkout…';
    try {
      const response = await fetch(config.createCheckoutUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, renewalMode })
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result.checkoutUrl) {
        location.assign(result.checkoutUrl);
        return;
      }

      const messages = {
        access_already_paid_create_account: 'Já existe um pagamento confirmado para este e-mail. Crie sua conta para acessar.',
        valid_email_required: 'Informe um e-mail válido.',
        checkout_provider_error: 'O Asaas não conseguiu gerar o checkout agora. Tente novamente.',
        order_create_failed: 'Não foi possível criar seu pedido. Tente novamente.'
      };
      setMessage(messages[result.error] || 'Não foi possível iniciar o pagamento. Tente novamente.', 'error');
      if (result.error === 'access_already_paid_create_account') {
        statusBanner.hidden = false;
        statusBanner.className = 'status-banner success';
        statusBanner.innerHTML = '<div><strong>Seu acesso já foi pago.</strong><p>Use este mesmo e-mail para criar a conta e entrar na jornada.</p></div><a class="secondary-link" href="./acesso.html">Criar conta</a>';
      }
    } catch (_) {
      setMessage('Falha de conexão ao iniciar o checkout. Confira sua internet e tente novamente.', 'error');
    } finally {
      button.disabled = false;
      button.textContent = 'Ir para o pagamento seguro';
    }
  });
})();

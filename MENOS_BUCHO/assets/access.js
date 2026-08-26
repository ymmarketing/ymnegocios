(() => {
  const config = window.MB_CONFIG || {};
  const emailStage = document.getElementById('emailStage');
  const codeStage = document.getElementById('codeStage');
  const claimStage = document.getElementById('claimStage');
  const emailForm = document.getElementById('emailForm');
  const codeForm = document.getElementById('codeForm');
  const emailInput = document.getElementById('authEmail');
  const codeInput = document.getElementById('authCode');
  const sendButton = document.getElementById('sendCodeButton');
  const verifyButton = document.getElementById('verifyCodeButton');
  const retryButton = document.getElementById('retryClaimButton');
  const changeEmailButton = document.getElementById('changeEmailButton');
  const message = document.getElementById('authMessage');
  const claimTitle = document.getElementById('claimTitle');
  const claimText = document.getElementById('claimText');
  const storedEmail = localStorage.getItem('mb_checkout_email') || '';
  emailInput.value = storedEmail;

  let client = null;
  let email = storedEmail;
  let claiming = false;

  if (configured()) {
    client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    client.auth.onAuthStateChange((event, currentSession) => {
      if (currentSession?.user && ['SIGNED_IN', 'INITIAL_SESSION'].includes(event)) {
        email = currentSession.user.email || email;
        show('claim');
        claimAccess();
      }
    });
    resumeSession();
  } else {
    setMessage('A autenticação está pronta no código, mas ainda aguarda a conexão do projeto Supabase do Menos Bucho.', 'info');
  }

  function configured() {
    return config.mode === 'supabase' && /^https:\/\//.test(config.supabaseUrl || '') && !!config.supabaseAnonKey;
  }

  function setMessage(text, kind = '') {
    message.textContent = text;
    message.dataset.kind = kind;
  }

  function show(stage) {
    emailStage.hidden = stage !== 'email';
    codeStage.hidden = stage !== 'code';
    claimStage.hidden = stage !== 'claim';
  }

  async function resumeSession() {
    const { data } = await client.auth.getSession();
    if (data?.session?.user) {
      email = data.session.user.email || email;
      show('claim');
      await claimAccess();
    }
  }

  emailForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!client) return;
    email = emailInput.value.trim().toLowerCase();
    if (!email) return;

    sendButton.disabled = true;
    sendButton.textContent = 'Enviando…';
    setMessage('');
    const redirectUrl = new URL('./acesso.html', location.href).href;
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: redirectUrl }
    });
    sendButton.disabled = false;
    sendButton.textContent = 'Enviar acesso';

    if (error) {
      setMessage('Não foi possível enviar o acesso. Confira o e-mail e tente novamente.', 'error');
      return;
    }

    localStorage.setItem('mb_checkout_email', email);
    show('code');
    codeInput.focus();
    setMessage('Enviamos seu acesso. Se o e-mail trouxer um código, digite abaixo; se trouxer um link, basta abrir o link.', 'success');
  });

  codeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!client) return;
    const token = codeInput.value.replace(/\D/g, '').slice(0, 6);
    if (token.length !== 6) return setMessage('Digite os 6 dígitos do código ou use o link recebido por e-mail.', 'error');

    verifyButton.disabled = true;
    verifyButton.textContent = 'Confirmando…';
    setMessage('');
    const { data, error } = await client.auth.verifyOtp({ email, token, type: 'email' });
    verifyButton.disabled = false;
    verifyButton.textContent = 'Confirmar e acessar';

    if (error || !data?.session) {
      setMessage('Código inválido ou expirado. Solicite um novo acesso se necessário.', 'error');
      return;
    }

    show('claim');
    await claimAccess();
  });

  changeEmailButton.addEventListener('click', async () => {
    if (client) await client.auth.signOut();
    codeInput.value = '';
    show('email');
    setMessage('');
    emailInput.focus();
  });

  retryButton.addEventListener('click', claimAccess);

  async function claimAccess() {
    if (!client || claiming) return;
    claiming = true;
    retryButton.disabled = true;
    claimTitle.textContent = 'Confirmando seu pagamento…';
    claimText.textContent = 'Estamos ligando o pagamento confirmado à sua conta.';
    setMessage('');

    const { data, error } = await client.rpc('mb_claim_paid_access');
    claiming = false;
    retryButton.disabled = false;
    if (error) {
      claimTitle.textContent = 'Não conseguimos validar agora.';
      claimText.textContent = 'Sua sessão está ativa. Tente verificar novamente sem fazer uma nova compra.';
      setMessage('Falha temporária ao consultar o acesso.', 'error');
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (result?.access_status === 'active' || result?.access_status === 'scheduled') {
      claimTitle.textContent = result.access_status === 'scheduled' ? 'Próximo ciclo garantido.' : 'Acesso liberado.';
      claimText.textContent = 'Sua conta está pronta. Abrindo sua jornada…';
      setTimeout(() => location.replace('./jornada.html'), 450);
      return;
    }

    claimTitle.textContent = 'Pagamento ainda em confirmação';
    claimText.textContent = 'Não encontramos uma cobrança confirmada para este e-mail ainda. Aguarde a confirmação do Asaas e use “Verificar novamente”.';
    setMessage('Não faça uma segunda compra enquanto o pagamento estiver sendo confirmado.', 'info');
  }
})();

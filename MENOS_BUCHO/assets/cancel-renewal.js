(() => {
  const config = window.MB_CONFIG || {};
  if (config.mode !== 'supabase' || !config.cancelSubscriptionUrl || !window.supabase) return;

  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  let injected = false;

  const observer = new MutationObserver(() => injectIfNeeded());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  injectIfNeeded();

  async function injectIfNeeded() {
    if (injected) return;
    const accessCard = document.querySelector('.access-card .access-row > div');
    if (!accessCard) return;

    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) return;

    const { data: subscription } = await client
      .from('mb_subscriptions')
      .select('id,status,auto_renew')
      .eq('user_id', user.id)
      .eq('auto_renew', true)
      .in('status', ['active','past_due'])
      .limit(1)
      .maybeSingle();

    if (!subscription) return;
    injected = true;
    const wrap = document.createElement('div');
    wrap.className = 'cancel-renew-wrap';
    wrap.innerHTML = '<button id="cancelAutoRenew" class="text-danger-btn" type="button">Cancelar renovação automática</button><span class="mini">O período já pago continua disponível até o fim.</span>';
    accessCard.appendChild(wrap);
    document.getElementById('cancelAutoRenew').addEventListener('click', cancelRenewal);
  }

  async function cancelRenewal(event) {
    const button = event.currentTarget;
    const accepted = window.confirm('Cancelar a renovação automática? Seu período já pago continuará ativo, mas não haverá novas cobranças mensais.');
    if (!accepted) return;

    const { data } = await client.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) return location.replace('./acesso.html');

    button.disabled = true;
    button.textContent = 'Cancelando…';
    try {
      const response = await fetch(config.cancelSubscriptionUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: '{}'
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || 'cancel_failed');
      button.textContent = 'Renovação automática cancelada';
      button.disabled = true;
      setTimeout(() => location.reload(), 650);
    } catch (_) {
      button.disabled = false;
      button.textContent = 'Cancelar renovação automática';
      showToast('Não conseguimos cancelar agora. Tente novamente.');
    }
  }

  function showToast(text) {
    document.querySelector('.toast')?.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
})();

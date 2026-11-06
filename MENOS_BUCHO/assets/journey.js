(() => {
  const config = window.MB_CONFIG || {};
  const app = document.getElementById('journeyApp');
  const signOutButton = document.getElementById('signOutButton');
  let client = null;
  let session = null;
  let profile = null;
  let onboarding = null;
  let currentPlanRows = [];
  let currentReflection = '';

  const labels = {
    hidratacao: 'Hidratação', alimentacao: 'Alimentação', movimento: 'Movimento',
    sono: 'Sono', planejamento: 'Planejamento', mente: 'Bem-estar'
  };

  if (!configured()) {
    app.innerHTML = developmentState();
    signOutButton.hidden = true;
    return;
  }

  client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  init();

  function configured() {
    return config.mode === 'supabase' && /^https:\/\//.test(config.supabaseUrl || '') && !!config.supabaseAnonKey;
  }

  function esc(value = '') {
    return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  }

  function localToday() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${map.year}-${map.month}-${map.day}`;
  }

  function dateDiff(from, to) {
    return Math.round((new Date(`${to}T12:00:00Z`) - new Date(`${from}T12:00:00Z`)) / 86400000);
  }

  function toast(text) {
    document.querySelector('.toast')?.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }

  async function init() {
    const { data } = await client.auth.getSession();
    session = data?.session || null;
    if (!session?.user) return location.replace('./acesso.html');

    const { data: claimed, error: claimError } = await client.rpc('mb_claim_paid_access');
    if (claimError) return renderError('Não conseguimos validar seu acesso agora.', 'Tente novamente em instantes sem fazer uma nova compra.');
    const claim = Array.isArray(claimed) ? claimed[0] : claimed;
    if (!claim || claim.access_status === 'awaiting_payment') return renderPendingAccess();

    await client.rpc('mb_sync_my_journey');
    await loadProfile();
    if (!onboarding) renderOnboarding();
    else await loadDashboard();
  }

  async function loadProfile() {
    const uid = session.user.id;
    const [{ data: p }, { data: o }] = await Promise.all([
      client.from('mb_profiles').select('*').eq('user_id', uid).maybeSingle(),
      client.from('mb_onboarding').select('*').eq('user_id', uid).maybeSingle()
    ]);
    profile = p || null;
    onboarding = o || null;
  }

  function renderOnboarding() {
    const name = profile?.display_name || '';
    app.innerHTML = `
      <section class="hero-card compact-hero">
        <span class="eyebrow">Diagnóstico inicial</span>
        <h1>Antes do primeiro desafio, vamos entender seu ritmo.</h1>
        <p>São poucas escolhas para o app começar com desafios que façam sentido para sua rotina.</p>
      </section>
      <form id="onlineOnboarding" class="panel form-panel">
        <label>Como podemos te chamar?<input name="name" type="text" maxlength="80" required value="${esc(name)}" placeholder="Seu primeiro nome"></label>
        <label>Seu principal objetivo agora<select name="goal" required><option value="">Selecione</option><option value="rotina">Ter uma rotina mais organizada</option><option value="alimentacao">Melhorar hábitos de alimentação</option><option value="movimento">Me movimentar com mais frequência</option><option value="energia">Ter mais disposição no dia a dia</option><option value="consistencia">Criar constância e parar de começar do zero</option></select></label>
        <fieldset><legend>O que você quer fortalecer? <small>Escolha até 3</small></legend><div class="choice-grid"><label class="choice"><input type="checkbox" name="focus" value="hidratacao"><span>Hidratação</span></label><label class="choice"><input type="checkbox" name="focus" value="alimentacao"><span>Alimentação</span></label><label class="choice"><input type="checkbox" name="focus" value="movimento"><span>Movimento</span></label><label class="choice"><input type="checkbox" name="focus" value="sono"><span>Sono</span></label><label class="choice"><input type="checkbox" name="focus" value="planejamento"><span>Planejamento</span></label><label class="choice"><input type="checkbox" name="focus" value="mente"><span>Bem-estar</span></label></div></fieldset>
        <label>Quanto tempo você consegue reservar por dia?<select name="minutes" required><option value="5">Até 5 minutos</option><option value="10" selected>Até 10 minutos</option><option value="15">Até 15 minutos</option><option value="20">Até 20 minutos</option></select></label>
        <label>Qual ritmo combina mais com você?<select name="pace" required><option value="1">Leve — quero começar pequeno</option><option value="2" selected>Moderado — consigo me desafiar um pouco</option><option value="3">Ativo — gosto de metas um pouco maiores</option></select></label>
        <label>Existe algo que você quer registrar sobre sua rotina? <small>Opcional</small><textarea name="notes" rows="3" maxlength="400" placeholder="Ex.: horários apertados, rotina noturna, preferência por começar devagar..."></textarea></label>
        <div class="info-box">O app usa este diagnóstico para selecionar desafios da biblioteca aprovada. Ele não transforma seu texto em orientação médica ou nutricional.</div>
        <button id="onboardingButton" class="primary-btn" type="submit">Montar meu primeiro dia</button>
        <p id="onboardingMessage" class="form-message"></p>
      </form>`;

    const form = document.getElementById('onlineOnboarding');
    const boxes = [...form.querySelectorAll('input[name="focus"]')];
    boxes.forEach(box => box.addEventListener('change', () => {
      if (boxes.filter(x => x.checked).length > 3) {
        box.checked = false;
        toast('Escolha até 3 focos.');
      }
    }));
    form.addEventListener('submit', saveOnboarding);
  }

  async function saveOnboarding(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const focus = fd.getAll('focus');
    const message = document.getElementById('onboardingMessage');
    if (!focus.length) {
      message.textContent = 'Escolha pelo menos um foco.';
      message.dataset.kind = 'error';
      return;
    }

    const button = document.getElementById('onboardingButton');
    button.disabled = true;
    button.textContent = 'Montando…';
    const now = new Date().toISOString();
    const uid = session.user.id;
    const name = String(fd.get('name') || '').trim();

    const [profileResult, onboardingResult] = await Promise.all([
      client.from('mb_profiles').upsert({ user_id: uid, display_name: name, updated_at: now }, { onConflict: 'user_id' }),
      client.from('mb_onboarding').upsert({
        user_id: uid,
        primary_goal: String(fd.get('goal') || ''),
        focus,
        minutes_per_day: Number(fd.get('minutes') || 10),
        pace: Number(fd.get('pace') || 2),
        context_notes: String(fd.get('notes') || '').trim(),
        updated_at: now
      }, { onConflict: 'user_id' })
    ]);

    if (profileResult.error || onboardingResult.error) {
      button.disabled = false;
      button.textContent = 'Montar meu primeiro dia';
      message.textContent = 'Não foi possível salvar o diagnóstico. Tente novamente.';
      message.dataset.kind = 'error';
      return;
    }

    await loadProfile();
    await loadDashboard();
    toast('Sua jornada foi montada.');
  }

  async function loadDashboard() {
    const [{ data: plan, error: planError }, { data: journeys }, { data: subscriptions }] = await Promise.all([
      client.rpc('mb_get_or_create_daily_plan'),
      client.rpc('mb_sync_my_journey'),
      client.from('mb_subscriptions').select('id,status,auto_renew,current_period_end,updated_at').eq('user_id', session.user.id).in('status', ['active','past_due']).order('updated_at', { ascending: false })
    ]);

    if (planError) return renderError('Não conseguimos montar os desafios de hoje.', 'Seu histórico continua salvo. Tente atualizar a página.');
    currentPlanRows = Array.isArray(plan) ? plan : [];
    const journeyRows = Array.isArray(journeys) ? journeys : [];
    const activeJourney = journeyRows.find(j => j.journey_status === 'active');
    const scheduledJourney = journeyRows.find(j => j.journey_status === 'scheduled');

    if (!activeJourney || !currentPlanRows.length) return renderNoActiveJourney(scheduledJourney);

    const planId = currentPlanRows[0].plan_id;
    const { data: reflection } = await client.from('mb_daily_reflections').select('note').eq('user_id', session.user.id).eq('daily_plan_id', planId).maybeSingle();
    currentReflection = reflection?.note || '';

    const daysLeft = Math.max(0, dateDiff(localToday(), activeJourney.ends_on));
    const autoRenew = (subscriptions || []).find(s => s.auto_renew && ['active','past_due'].includes(s.status));
    const pastDue = (subscriptions || []).some(s => s.auto_renew && s.status === 'past_due');

    app.innerHTML = dashboardMarkup(activeJourney, scheduledJourney, autoRenew, pastDue, daysLeft);
    bindDashboard(activeJourney, scheduledJourney, autoRenew, daysLeft);
    await refreshHistoryMetrics();
    await loadPreferences();
  }

  function dashboardMarkup(activeJourney, scheduledJourney, autoRenew, pastDue, daysLeft) {
    const row = currentPlanRows[0];
    const done = currentPlanRows.filter(x => x.completed).length;
    const pct = currentPlanRows.length ? Math.round(done / currentPlanRows.length * 100) : 0;
    const levelText = row.adaptive_level === 1 ? 'leve' : row.adaptive_level === 3 ? 'ativo' : 'moderado';

    return `
      <section class="dashboard-head">
        <div><span class="eyebrow">Dia ${row.day_number} de 30</span><h1>Oi, ${esc(profile?.display_name || 'por aí')}.</h1><p>Seu ritmo de hoje está <strong>${levelText}</strong>. A meta é constância possível, não perfeição.</p></div>
        <span id="todayBadge" class="step-pill">${pct}% hoje</span>
      </section>

      <section class="metric-grid">
        <div class="metric"><strong id="todayMetric">${done}/${currentPlanRows.length}</strong><span>desafios de hoje</span></div>
        <div class="metric"><strong id="streakMetric">—</strong><span>dias de constância</span></div>
        <div class="metric"><strong id="overallMetric">—</strong><span>execução acumulada</span></div>
      </section>

      <section class="panel" style="margin-top:18px">
        <div class="metric-row"><h2 class="section-title">Seu progresso hoje</h2><span id="todayCount" class="mini">${done} concluído(s)</span></div>
        <div class="progress-wrap"><div id="todayProgress" class="progress-bar" style="width:${pct}%"></div></div>
        <div class="progress-caption"><span>Versões pequenas também contam.</span><span id="todayPct">${pct}%</span></div>
      </section>

      <section class="panel"><h2 class="section-title">Desafios de hoje</h2><div id="challengeList" class="challenge-list">${challengeCards()}</div></section>

      <section class="panel daily-note">
        <span class="eyebrow">Registro do dia</span><h2 class="section-title" style="margin-top:7px">Como foi para você?</h2>
        <textarea id="dailyReflection" maxlength="700" placeholder="O que funcionou, o que foi difícil, o que você quer repetir amanhã...">${esc(currentReflection)}</textarea>
        <button id="saveReflectionButton" class="secondary-btn" type="button" style="margin-top:10px">Salvar registro</button>
        <span class="save-state">Seu registro fica no seu histórico e ajuda você a observar padrões ao longo do ciclo.</span>
      </section>

      ${accessMarkup(activeJourney, scheduledJourney, autoRenew, pastDue, daysLeft)}

      <section class="panel preferences-card">
        <div><span class="eyebrow">Comunicação</span><h2 class="section-title" style="margin-top:7px">Como quer receber nossos lembretes?</h2><p class="mini">Você pode mudar essas preferências a qualquer momento.</p></div>
        <div id="preferenceControls" class="preference-controls"><span class="mini">Carregando preferências…</span></div>
      </section>`;
  }

  function challengeCards() {
    return currentPlanRows.map(row => `
      <article class="challenge ${row.completed ? 'done' : ''}" data-card="${esc(row.plan_item_id)}">
        <div class="challenge-head"><div><div class="challenge-meta"><span class="tag">${esc(labels[row.category] || row.category)}</span><span class="tag">até ${row.minutes} min</span></div><h3>${esc(row.title)}</h3><p>${esc(row.body)}</p></div><button class="check-btn" type="button" data-item="${esc(row.plan_item_id)}" aria-label="${row.completed ? 'Reabrir' : 'Concluir'} desafio">${row.completed ? '✓' : '○'}</button></div>
      </article>`).join('');
  }

  function accessMarkup(activeJourney, scheduledJourney, autoRenew, pastDue, daysLeft) {
    let stateText = `Seu ciclo atual vai até ${formatDate(activeJourney.ends_on)}.`;
    let badge = `${daysLeft} dia${daysLeft === 1 ? '' : 's'} restantes`;
    let action = '<span class="mini">A renovação fica disponível nos últimos 7 dias.</span>';

    if (pastDue) {
      stateText = 'A renovação automática precisa de atenção no meio de pagamento.';
      badge = 'Pagamento pendente';
      action = '<span class="mini">O ciclo já pago permanece disponível até a data final. Não faça uma nova compra sem revisar a cobrança.</span>';
    } else if (autoRenew) {
      stateText = scheduledJourney ? `Próximo ciclo já programado para ${formatDate(scheduledJourney.starts_on)}.` : 'Renovação automática mensal ativa.';
      badge = 'Automática ativa';
      action = '<span class="mini">R$ 19,90 por ciclo mensal enquanto a renovação estiver ativa.</span>';
    } else if (scheduledJourney) {
      stateText = `Próximo ciclo já pago e programado para ${formatDate(scheduledJourney.starts_on)}.`;
      badge = 'Próximo ciclo garantido';
      action = '<span class="mini">Você não precisa comprar novamente agora.</span>';
    } else if (daysLeft <= 7) {
      action = `<div class="renew-actions"><button class="secondary-btn" type="button" data-renew="one_time">Renovar +30 dias</button><button class="secondary-btn" type="button" data-renew="automatic">Ativar renovação automática</button></div>`;
    }

    return `<section class="panel access-card"><div class="access-row"><div><span class="eyebrow">Seu acesso</span><h2 class="section-title" style="margin-top:7px"><span class="status-dot"></span>${esc(stateText)}</h2>${action}</div><span class="step-pill">${esc(badge)}</span></div></section>`;
  }

  function bindDashboard(activeJourney, scheduledJourney, autoRenew, daysLeft) {
    document.querySelectorAll('[data-item]').forEach(button => button.addEventListener('click', () => toggleCompletion(button.dataset.item)));
    document.getElementById('saveReflectionButton').addEventListener('click', () => saveReflection(false));
    document.querySelectorAll('[data-renew]').forEach(button => button.addEventListener('click', () => startRenewal(button.dataset.renew)));
  }

  async function toggleCompletion(itemId) {
    const row = currentPlanRows.find(x => x.plan_item_id === itemId);
    if (!row) return;
    const next = !row.completed;
    const now = new Date().toISOString();
    const { error } = await client.from('mb_completions').upsert({
      user_id: session.user.id,
      daily_plan_item_id: itemId,
      completed: next,
      completed_at: next ? now : null,
      updated_at: now
    }, { onConflict: 'user_id,daily_plan_item_id' });
    if (error) return toast('Não conseguimos salvar agora.');

    row.completed = next;
    const card = document.querySelector(`[data-card="${CSS.escape(itemId)}"]`);
    const button = document.querySelector(`[data-item="${CSS.escape(itemId)}"]`);
    card?.classList.toggle('done', next);
    if (button) {
      button.textContent = next ? '✓' : '○';
      button.setAttribute('aria-label', next ? 'Reabrir desafio' : 'Concluir desafio');
    }
    updateTodayStats();
    await refreshHistoryMetrics();
    toast(next ? 'Desafio concluído.' : 'Desafio reaberto.');
  }

  function updateTodayStats() {
    const done = currentPlanRows.filter(x => x.completed).length;
    const pct = currentPlanRows.length ? Math.round(done / currentPlanRows.length * 100) : 0;
    document.getElementById('todayMetric').textContent = `${done}/${currentPlanRows.length}`;
    document.getElementById('todayBadge').textContent = `${pct}% hoje`;
    document.getElementById('todayCount').textContent = `${done} concluído(s)`;
    document.getElementById('todayProgress').style.width = `${pct}%`;
    document.getElementById('todayPct').textContent = `${pct}%`;
  }

  async function refreshHistoryMetrics() {
    const uid = session.user.id;
    const { data: plans } = await client.from('mb_daily_plans').select('id,day_number').eq('user_id', uid).order('day_number');
    const planRows = plans || [];
    if (!planRows.length) return;
    const planIds = planRows.map(p => p.id);
    const { data: items } = await client.from('mb_daily_plan_items').select('id,daily_plan_id').in('daily_plan_id', planIds);
    const itemRows = items || [];
    const itemIds = itemRows.map(i => i.id);
    let completedRows = [];
    if (itemIds.length) {
      const { data } = await client.from('mb_completions').select('daily_plan_item_id,completed').eq('user_id', uid).in('daily_plan_item_id', itemIds).eq('completed', true);
      completedRows = data || [];
    }
    const completedSet = new Set(completedRows.map(c => c.daily_plan_item_id));
    const overall = itemRows.length ? Math.round(completedSet.size / itemRows.length * 100) : 0;

    const rates = planRows.map(p => {
      const own = itemRows.filter(i => i.daily_plan_id === p.id);
      const done = own.filter(i => completedSet.has(i.id)).length;
      return { day: p.day_number, rate: own.length ? done / own.length : 0 };
    }).sort((a, b) => a.day - b.day);
    let streak = 0;
    for (let i = rates.length - 1; i >= 0; i--) {
      if (rates[i].rate >= .66) streak++;
      else break;
    }
    document.getElementById('overallMetric').textContent = `${overall}%`;
    document.getElementById('streakMetric').textContent = String(streak);
  }

  async function saveReflection(silent = false) {
    const textarea = document.getElementById('dailyReflection');
    if (!textarea || !currentPlanRows.length) return;
    const note = textarea.value.trim();
    const now = new Date().toISOString();
    const { error } = await client.from('mb_daily_reflections').upsert({
      user_id: session.user.id,
      daily_plan_id: currentPlanRows[0].plan_id,
      note,
      updated_at: now
    }, { onConflict: 'user_id,daily_plan_id' });
    if (!error) {
      currentReflection = note;
      if (!silent) toast('Registro salvo.');
    } else if (!silent) toast('Não conseguimos salvar o registro.');
  }

  async function startRenewal(mode) {
    if (!config.createCheckoutUrl) return toast('Renovação ainda não configurada.');
    await saveReflection(true);
    const { data } = await client.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) return location.replace('./acesso.html');

    const clicked = document.querySelector(`[data-renew="${CSS.escape(mode)}"]`);
    if (clicked) clicked.disabled = true;
    try {
      const response = await fetch(config.createCheckoutUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ renewalMode: mode })
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.checkoutUrl) return location.assign(result.checkoutUrl);
      const messages = {
        renewal_not_open: 'A renovação abre nos últimos 7 dias do ciclo.',
        renewal_already_paid: 'Seu próximo ciclo já está pago.',
        auto_renew_already_active: 'Sua renovação automática já está ativa.'
      };
      toast(messages[result.error] || 'Não conseguimos abrir a renovação agora.');
    } catch (_) {
      toast('Falha de conexão ao abrir a renovação.');
    } finally {
      if (clicked) clicked.disabled = false;
    }
  }

  async function loadPreferences() {
    const container = document.getElementById('preferenceControls');
    if (!container) return;
    const { data } = await client.from('mb_notification_preferences').select('*').eq('user_id', session.user.id).maybeSingle();
    const prefs = data || { email_enabled: true, motivational_email: true, renewal_email: true };
    container.innerHTML = `
      <label class="toggle-row"><span><b>Lembretes da jornada</b><small>Mensagens de acompanhamento durante os 30 dias.</small></span><input id="prefMotivational" type="checkbox" ${prefs.email_enabled && prefs.motivational_email ? 'checked' : ''}></label>
      <label class="toggle-row"><span><b>Lembretes de renovação</b><small>Avisos próximos ao fim do ciclo.</small></span><input id="prefRenewal" type="checkbox" ${prefs.email_enabled && prefs.renewal_email ? 'checked' : ''}></label>`;
    container.querySelectorAll('input').forEach(input => input.addEventListener('change', savePreferences));
  }

  async function savePreferences() {
    const motivational = document.getElementById('prefMotivational').checked;
    const renewal = document.getElementById('prefRenewal').checked;
    const { error } = await client.from('mb_notification_preferences').upsert({
      user_id: session.user.id,
      email_enabled: motivational || renewal,
      motivational_email: motivational,
      renewal_email: renewal,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
    toast(error ? 'Não conseguimos salvar a preferência.' : 'Preferências atualizadas.');
  }

  function formatDate(iso) {
    if (!iso) return '';
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
  }

  function renderPendingAccess() {
    app.innerHTML = `<section class="panel centered-state"><span class="eyebrow">Acesso</span><h1>Seu pagamento ainda está em confirmação.</h1><p>Não faça uma nova compra. Volte à tela de acesso e use “Verificar novamente” quando o pagamento for confirmado.</p><a class="secondary-link" href="./acesso.html">Verificar pagamento</a></section>`;
  }

  function renderNoActiveJourney(scheduledJourney) {
    app.innerHTML = `<section class="panel centered-state"><span class="eyebrow">Jornada</span><h1>${scheduledJourney ? 'Seu próximo ciclo já está programado.' : 'Não encontramos um ciclo ativo.'}</h1><p>${scheduledJourney ? `Ele começa em ${formatDate(scheduledJourney.starts_on)}.` : 'Se você concluiu o ciclo anterior, poderá renovar o acesso pela página inicial.'}</p><a class="secondary-link" href="./">Voltar ao início</a></section>`;
  }

  function renderError(title, body) {
    app.innerHTML = `<section class="panel centered-state"><span class="eyebrow">Tivemos uma falha</span><h1>${esc(title)}</h1><p>${esc(body)}</p><button class="secondary-btn" type="button" onclick="location.reload()">Tentar novamente</button></section>`;
  }

  function developmentState() {
    return `<section class="panel centered-state"><span class="eyebrow">Ambiente de desenvolvimento</span><h1>A área online está pronta para conexão.</h1><p>O projeto Supabase do Menos Bucho ainda não está disponível na conexão atual. O protótipo local continua acessível para validar a experiência.</p><a class="secondary-link" href="./prototype.html">Abrir protótipo</a></section>`;
  }

  signOutButton.addEventListener('click', async () => {
    if (client) await client.auth.signOut();
    location.replace('./acesso.html');
  });
})();

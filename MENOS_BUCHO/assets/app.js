(() => {
  const STORAGE_KEY = 'menos_bucho_mvp_v1';
  const app = document.getElementById('app');
  const resetBtn = document.getElementById('resetDemo');
  const labels = window.MB_CATEGORY_LABELS || {};
  const library = window.MB_CHALLENGES || [];

  const emptyState = () => ({
    version: 1,
    profile: null,
    journey: null,
    plans: {},
    done: {},
    notes: {},
    createdAt: null,
    updatedAt: null
  });

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? {...emptyState(), ...JSON.parse(raw)} : emptyState();
    } catch (_) {
      return emptyState();
    }
  }

  function saveState() {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function esc(value = '') {
    return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function localDateISO(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function dayDiff(from, to) {
    const a = new Date(`${from}T12:00:00`);
    const b = new Date(`${to}T12:00:00`);
    return Math.floor((b - a) / 86400000);
  }

  function currentDay() {
    if (!state.journey?.startDate) return 1;
    return Math.max(1, dayDiff(state.journey.startDate, localDateISO()) + 1);
  }

  function toast(text) {
    document.querySelector('.toast')?.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1900);
  }

  function seededScore(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967295;
  }

  function previousCompletion(day) {
    if (day <= 1) return null;
    const prev = state.plans[String(day - 1)] || [];
    if (!prev.length) return null;
    const done = state.done[String(day - 1)] || {};
    return prev.filter(id => done[id]).length / prev.length;
  }

  function adaptiveLevel(day) {
    let level = Number(state.profile?.pace || 2);
    const prev = previousCompletion(day);
    if (prev !== null && prev < .5) level -= 1;
    if (prev !== null && prev >= .8) level += 1;
    return Math.min(3, Math.max(1, level));
  }

  function recentIds(day) {
    const ids = new Set();
    for (let d = Math.max(1, day - 3); d < day; d++) {
      (state.plans[String(d)] || []).forEach(id => ids.add(id));
    }
    return ids;
  }

  function ensurePlan(day) {
    const key = String(day);
    if (state.plans[key]?.length) return state.plans[key];

    const profile = state.profile || {};
    const focus = profile.focus?.length ? profile.focus : ['planejamento','hidratacao','movimento'];
    const recent = recentIds(day);
    const level = adaptiveLevel(day);
    const minutes = Number(profile.minutes || 10);
    const seed = `${profile.name || 'pessoa'}:${day}`;

    let candidates = library.filter(ch => ch.level <= level && ch.min <= minutes && !recent.has(ch.id));
    if (candidates.length < 3) candidates = library.filter(ch => ch.level <= level && ch.min <= minutes);

    candidates = candidates.map(ch => {
      let priority = 0;
      if (focus.includes(ch.cat)) priority += 5;
      if (ch.goals.includes(profile.goal)) priority += 4;
      priority += seededScore(`${seed}:${ch.id}`) * 2;
      return {ch, priority};
    }).sort((a,b) => b.priority - a.priority);

    const selected = [];
    const usedCats = new Set();
    for (const item of candidates) {
      if (selected.length >= 3) break;
      if (!usedCats.has(item.ch.cat)) {
        selected.push(item.ch.id);
        usedCats.add(item.ch.cat);
      }
    }
    for (const item of candidates) {
      if (selected.length >= 3) break;
      if (!selected.includes(item.ch.id)) selected.push(item.ch.id);
    }

    state.plans[key] = selected;
    saveState();
    return selected;
  }

  function planObjects(day) {
    return ensurePlan(day).map(id => library.find(ch => ch.id === id)).filter(Boolean);
  }

  function completionForDay(day) {
    const plan = state.plans[String(day)] || [];
    if (!plan.length) return 0;
    const done = state.done[String(day)] || {};
    return plan.filter(id => done[id]).length / plan.length;
  }

  function totalCompleted(upToDay) {
    let count = 0;
    for (let d = 1; d <= Math.min(upToDay, 30); d++) {
      const done = state.done[String(d)] || {};
      count += Object.values(done).filter(Boolean).length;
    }
    return count;
  }

  function totalAvailable(upToDay) {
    let count = 0;
    for (let d = 1; d <= Math.min(upToDay, 30); d++) count += (state.plans[String(d)] || []).length;
    return count;
  }

  function streak(upToDay) {
    let s = 0;
    for (let d = Math.min(upToDay, 30); d >= 1; d--) {
      if (completionForDay(d) >= .66) s++;
      else break;
    }
    return s;
  }

  function renderOnboarding() {
    resetBtn.hidden = true;
    const tpl = document.getElementById('onboardingTemplate');
    app.replaceChildren(tpl.content.cloneNode(true));

    const focusBoxes = [...app.querySelectorAll('input[name="focus"]')];
    focusBoxes.forEach(box => box.addEventListener('change', () => {
      const checked = focusBoxes.filter(x => x.checked);
      if (checked.length > 3) {
        box.checked = false;
        toast('Escolha até 3 focos.');
      }
    }));

    app.querySelector('#onboardingForm').addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const focus = fd.getAll('focus');
      if (!focus.length) return toast('Escolha pelo menos um foco.');

      state = emptyState();
      state.profile = {
        name: String(fd.get('name') || '').trim(),
        goal: String(fd.get('goal') || ''),
        focus,
        minutes: Number(fd.get('minutes') || 10),
        pace: Number(fd.get('pace') || 2),
        notes: String(fd.get('notes') || '').trim()
      };
      state.journey = {startDate: localDateISO(), accessDays: 30, status: 'active'};
      state.createdAt = new Date().toISOString();
      saveState();
      render();
      toast('Sua jornada foi criada.');
    });
  }

  function renderExpired() {
    resetBtn.hidden = false;
    app.innerHTML = `
      <section class="hero-card">
        <span class="eyebrow">Jornada concluída</span>
        <h1>Você chegou ao fim dos 30 dias.</h1>
        <p>Seu histórico continua salvo. A renovação vai abrir uma nova jornada mantendo seu progresso como referência.</p>
      </section>
      <section class="panel access-card">
        <div class="access-row">
          <div><span class="eyebrow">Próximo ciclo</span><h2>Renovar por mais 30 dias</h2><p class="mini">Checkout e renovação automática serão ativados pela integração com o Asaas.</p></div>
          <button class="secondary-btn" type="button" disabled>Em configuração</button>
        </div>
      </section>`;
  }

  function renderDashboard(day) {
    resetBtn.hidden = false;
    const plan = planObjects(day);
    const doneMap = state.done[String(day)] || {};
    const completedToday = plan.filter(ch => doneMap[ch.id]).length;
    const todayPct = plan.length ? Math.round(completedToday / plan.length * 100) : 0;
    const completed = totalCompleted(day);
    const available = Math.max(totalAvailable(day), plan.length);
    const overallPct = available ? Math.round(completed / available * 100) : 0;
    const level = adaptiveLevel(day);
    const levelText = level === 1 ? 'leve' : level === 2 ? 'moderado' : 'ativo';

    app.innerHTML = `
      <section class="dashboard-head">
        <div>
          <span class="eyebrow">Dia ${day} de 30</span>
          <h1>Oi, ${esc(state.profile.name)}.</h1>
          <p>Hoje o ritmo está <strong>${levelText}</strong>. Faça o que cabe no seu dia e registre como foi.</p>
        </div>
        <span class="step-pill">${todayPct}% hoje</span>
      </section>

      <section class="metric-grid">
        <div class="metric"><strong>${completedToday}/${plan.length}</strong><span>desafios de hoje</span></div>
        <div class="metric"><strong>${streak(day)}</strong><span>dias de constância</span></div>
        <div class="metric"><strong>${overallPct}%</strong><span>execução acumulada</span></div>
      </section>

      <section class="panel" style="margin-top:18px">
        <div class="metric-row"><h2 class="section-title">Seu progresso hoje</h2><span class="mini">${completedToday} concluído(s)</span></div>
        <div class="progress-wrap"><div class="progress-bar" style="width:${todayPct}%"></div></div>
        <div class="progress-caption"><span>Versões pequenas também contam.</span><span>${todayPct}%</span></div>
      </section>

      <section class="panel">
        <h2 class="section-title">Desafios de hoje</h2>
        <div class="challenge-list">
          ${plan.map(ch => challengeCard(ch, !!doneMap[ch.id])).join('')}
        </div>
      </section>

      <section class="panel daily-note">
        <span class="eyebrow">Registro do dia</span>
        <h2 class="section-title" style="margin-top:7px">Como foi para você?</h2>
        <textarea id="dailyNote" maxlength="700" placeholder="O que funcionou, o que foi difícil, o que você quer repetir amanhã...">${esc(state.notes[String(day)] || '')}</textarea>
        <button id="saveNote" class="secondary-btn" type="button" style="margin-top:10px">Salvar registro</button>
        <span class="save-state">Esse registro será usado na adaptação da jornada quando o banco estiver conectado.</span>
      </section>

      <section class="panel access-card">
        <div class="access-row">
          <div>
            <span class="eyebrow">Seu acesso</span>
            <h2 class="section-title" style="margin-top:7px"><span class="status-dot"></span>30 dias ativos</h2>
            <p class="mini">Valor validado: R$ 19,90 por ciclo. A opção de renovação automática será conectada ao Asaas.</p>
          </div>
          <span class="step-pill">faltam ${Math.max(0, 30 - day)} dias</span>
        </div>
      </section>`;

    app.querySelectorAll('[data-challenge]').forEach(btn => btn.addEventListener('click', () => {
      const id = btn.dataset.challenge;
      const key = String(day);
      state.done[key] = state.done[key] || {};
      state.done[key][id] = !state.done[key][id];
      saveState();
      renderDashboard(day);
      toast(state.done[key][id] ? 'Desafio concluído.' : 'Desafio reaberto.');
    }));

    app.querySelector('#saveNote').addEventListener('click', () => {
      state.notes[String(day)] = app.querySelector('#dailyNote').value.trim();
      saveState();
      toast('Registro salvo.');
    });
  }

  function challengeCard(ch, done) {
    return `
      <article class="challenge ${done ? 'done' : ''}">
        <div class="challenge-head">
          <div>
            <div class="challenge-meta"><span class="tag">${esc(labels[ch.cat] || ch.cat)}</span><span class="tag">até ${ch.min} min</span></div>
            <h3>${esc(ch.title)}</h3>
            <p>${esc(ch.text)}</p>
          </div>
          <button class="check-btn" type="button" data-challenge="${esc(ch.id)}" aria-label="${done ? 'Reabrir' : 'Concluir'} desafio">${done ? '✓' : '○'}</button>
        </div>
      </article>`;
  }

  function render() {
    if (!state.profile || !state.journey) return renderOnboarding();
    const day = currentDay();
    if (day > 30) return renderExpired();
    renderDashboard(day);
  }

  resetBtn.addEventListener('click', () => {
    if (!confirm('Recomeçar o protótipo e apagar os dados salvos neste aparelho?')) return;
    localStorage.removeItem(STORAGE_KEY);
    state = emptyState();
    render();
  });

  render();
})();

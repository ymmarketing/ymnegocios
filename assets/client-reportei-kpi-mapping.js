(() => {
  if (window.__clientReporteiKpiMapping) return;
  window.__clientReporteiKpiMapping = true;

  let clientId = null;
  let busy = false;
  const E = (v) => window.YM?.esc ? YM.esc(v) : String(v ?? '').replace(/[&<>"']/g, '');
  const ptDate = (v) => v ? new Date(v + (String(v).length === 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR') : '—';
  const iso = (d) => d.toISOString().slice(0, 10);
  const shift = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };
  function rollingPeriod() { const end = shift(new Date(), -1); const start = shift(new Date(end), -29); return [iso(start), iso(end)]; }

  function capture(event) {
    const el = event.target.closest?.('[data-client-performance],[data-cap-open]');
    if (el) clientId = el.dataset.clientPerformance || el.dataset.capOpen || clientId;
  }
  document.addEventListener('click', capture, true);

  function wrap() {
    if (!window.ClientPerformanceAdmin || window.ClientPerformanceAdmin.__reporteiMapWrapped) return;
    const old = window.ClientPerformanceAdmin.open;
    window.ClientPerformanceAdmin.open = (id, tab) => { clientId = id; return old(id, tab); };
    window.ClientPerformanceAdmin.__reporteiMapWrapped = true;
  }

  async function api(path, body) {
    const s = await YM.requireSession(location.pathname + location.search);
    if (!s) throw new Error('Sessão necessária.');
    const r = await fetch(YM.SUPABASE_URL + '/functions/v1/' + path, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + s.access_token, apikey: YM.PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.detail || j.error || 'Falha na operação.'); e.code = j.error; throw e; }
    return j;
  }
  const sync = (body) => api('performance-sync-automation', body);
  const rep = (body) => api('reportei-admin', body);
  async function performance() { return (await window.ClientPerformanceAdmin.api({ action: 'GET_CLIENT', client_id: clientId })).data; }

  function fixOldCopy() {
    document.querySelectorAll('#perf_fontes .perf-note').forEach((n) => {
      if (n.textContent.includes('será conectado na etapa final') || n.textContent.includes('Fonte de dados da Performance VOS')) {
        n.innerHTML = '<b>Fontes automáticas da Performance VOS:</b> CRM e Reportei alimentam os KPIs já configurados. Depois do setup, você não precisa escolher novamente qual métrica deve ser usada.';
      }
    });
  }

  function sourceBadge(source) {
    const ok = source.status === 'ATIVO' && !source.last_error;
    return `<span class="perf-badge ${ok ? 'ok' : source.last_error ? 'warn' : 'muted'}">${E(source.provider)} · ${ok ? 'OK' : source.last_error ? 'atenção' : E(source.status || '—')}</span>`;
  }

  function statusPanel(status) {
    const setting = status.setting || {};
    const kpis = status.kpis || [];
    const ready = kpis.filter((x) => x.configured && x.mapping_ready !== false).length;
    const configured = kpis.filter((x) => x.configured).length;
    const auto = setting.auto_sync_enabled === true;
    const [start, end] = rollingPeriod();
    const health = (status.sources || []).map(sourceBadge).join(' ') || '<span class="perf-badge muted">Sem fonte automática</span>';
    const incomplete = kpis.filter((x) => !x.configured || x.mapping_ready === false);

    const panel = document.createElement('div');
    panel.id = 'perfAutomationPanel';
    panel.className = 'perf-form';
    panel.innerHTML = `
      <div class="perf-card-top">
        <div>
          <h3>Atualização dos dados</h3>
          <p style="margin:5px 0 0;color:#6b7c91;font-size:12.5px;line-height:1.5">Os vínculos das fontes ficam gravados. Escolha apenas o período e atualize todos os KPIs de uma vez.</p>
        </div>
        <span class="perf-badge ${auto ? 'ok' : 'muted'}">${auto ? 'Automático ativo' : 'Automático pausado'}</span>
      </div>
      <div class="perf-values" style="margin-top:12px">
        <div><small>KPIs</small><b>${kpis.length}</b></div>
        <div><small>Prontos</small><b>${ready}/${kpis.length}</b></div>
        <div><small>Dados até</small><b>${E(status.data_through ? ptDate(status.data_through) : 'Sem medição')}</b></div>
      </div>
      <div class="perf-note" style="margin-top:10px">
        <b>Rotina:</b> atualização semanal da janela móvel de 30 dias + fechamento automático do mês anterior no dia 1. O baseline permanece congelado.
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin:9px 0">${health}</div>
      ${incomplete.length ? `<div class="perf-note" style="background:#fff5df;color:#7b5414"><b>Atenção:</b> ${incomplete.length} KPI(s) precisam de configuração técnica antes de entrar na atualização automática.</div>` : ''}
      <div class="perf-formgrid" style="margin-top:10px">
        <div><label class="perf-label">Início do período</label><input id="perfSyncStart" class="perf-input" type="date" value="${start}"></div>
        <div><label class="perf-label">Fim do período</label><input id="perfSyncEnd" class="perf-input" type="date" value="${end}"></div>
        <div><label class="perf-label">Atualização automática</label><button id="perfAutoToggle" class="perf-btn secondary" type="button">${auto ? 'Pausar automático' : 'Ativar automático'}</button></div>
      </div>
      <div class="perf-actions">
        <button id="perfSyncAll" class="perf-btn" type="button">Atualizar dados</button>
      </div>
      <div id="perfSyncResult" class="perf-note" style="margin-top:10px;display:none"></div>
      <details id="perfAdvanced" style="margin-top:12px;border-top:1px solid #e1e8f0;padding-top:10px">
        <summary style="cursor:pointer;font-weight:800;color:#496176;font-size:12.5px">Configuração avançada das fontes</summary>
        <div id="perfAdvancedBody" style="margin-top:10px"><div class="perf-note">Abra somente para configurar um KPI novo ou corrigir uma fonte antes de travar o baseline.</div></div>
      </details>`;

    panel.querySelector('#perfSyncAll').onclick = async (event) => {
      const button = event.currentTarget;
      const startValue = panel.querySelector('#perfSyncStart').value;
      const endValue = panel.querySelector('#perfSyncEnd').value;
      if (!startValue || !endValue || endValue < startValue) return YM.toast('Informe um período válido.', true);
      button.disabled = true; button.textContent = 'Atualizando…';
      const result = panel.querySelector('#perfSyncResult');
      try {
        const j = await sync({ action: 'SYNC_CLIENT', client_id: clientId, start: startValue, end: endValue });
        const s = j.summary || {};
        result.style.display = 'block';
        const problems = Number(s.errors?.length || 0) + Number(s.skipped || 0);
        result.innerHTML = `<b>${Number(s.written || 0)} KPI(s) atualizados.</b> ${Number(s.no_data || 0) ? `${s.no_data} sem dado no período. ` : ''}${problems ? `${problems} precisam de atenção.` : 'Todas as fontes configuradas responderam corretamente.'}`;
        YM.toast(problems ? 'Atualização concluída com itens para revisar.' : 'Dados atualizados com sucesso.', problems > 0);
        setTimeout(() => window.ClientPerformanceAdmin.open(clientId, 'fontes'), 500);
      } catch (e) { result.style.display = 'block'; result.textContent = e.message; YM.toast(e.message, true); }
      finally { button.disabled = false; button.textContent = 'Atualizar dados'; }
    };

    panel.querySelector('#perfAutoToggle').onclick = async (event) => {
      const button = event.currentTarget; button.disabled = true;
      try {
        await sync({ action: 'SET_AUTOMATION', client_id: clientId, auto_sync_enabled: !auto, weekly_sync_enabled: true, monthly_close_enabled: true, weekly_window_days: 30, timezone: 'America/Sao_Paulo' });
        YM.toast(!auto ? 'Atualização automática ativada.' : 'Atualização automática pausada.');
        setTimeout(() => window.ClientPerformanceAdmin.open(clientId, 'fontes'), 350);
      } catch (e) { YM.toast(e.message, true); button.disabled = false; }
    };

    panel.querySelector('#perfAdvanced').addEventListener('toggle', async (event) => {
      if (event.currentTarget.open && !event.currentTarget.dataset.loaded) {
        event.currentTarget.dataset.loaded = '1';
        await loadAdvanced(panel.querySelector('#perfAdvancedBody'));
      }
    });
    return panel;
  }

  function baselineDates(data) {
    const d0 = data?.client?.became_client_at ? new Date(data.client.became_client_at) : null;
    if (!d0 || Number.isNaN(d0.getTime())) return rollingPeriod();
    const end = shift(d0, -1), start = shift(new Date(end), -29);
    return [iso(start), iso(end)];
  }

  async function loadAdvanced(root) {
    root.innerHTML = '<div class="perf-note">Carregando configuração técnica…</div>';
    try {
      const [data, ints] = await Promise.all([performance(), rep({ action: 'INTEGRATIONS', client_id: clientId })]);
      const kpis = data.kpis || [];
      const active = (ints.integrations || []).filter((x) => String(x.status).toLowerCase() === 'active');
      const dates = baselineDates(data);
      if (!active.length) {
        root.innerHTML = '<div class="perf-note"><b>Reportei ainda não possui uma integração ativa vinculada a este cliente.</b> Conecte primeiro o projeto correto.</div>';
        return;
      }
      root.innerHTML = `
        <div class="perf-note"><b>Configuração protegida.</b> Esta etapa é feita uma vez. KPIs com baseline já travado não podem ser remapeados por esta tela; isso evita trocar acidentalmente uma métrica por outra parecida.</div>
        <div class="perf-formgrid">
          <div><label class="perf-label">KPI VOS</label><select id="repMapKpi" class="perf-select"><option value="">Selecione…</option>${kpis.map((k) => `<option value="${k.id}" ${k.baseline_locked_at ? 'disabled' : ''}>${E(k.name)}${k.baseline_locked_at ? ' · protegido' : ''}</option>`).join('')}</select></div>
          <div><label class="perf-label">Integração</label><select id="repMapIntegration" class="perf-select"><option value="">Selecione…</option>${active.map((i) => `<option value="${i.id}" data-slug="${E(i.slug)}">${E(i.name)}</option>`).join('')}</select></div>
          <div><label class="perf-label">Métrica do Reportei</label><select id="repMapMetric" class="perf-select" disabled><option value="">Escolha a integração primeiro</option></select></div>
          <div><label class="perf-label">Início do baseline</label><input id="repBaseStart" class="perf-input" type="date" value="${dates[0]}"></div>
          <div><label class="perf-label">Fim do baseline</label><input id="repBaseEnd" class="perf-input" type="date" value="${dates[1]}"></div>
        </div>
        <div class="perf-actions"><button id="repMapSave" class="perf-btn secondary">Validar e vincular fonte</button><button id="repCaptureBaseline" class="perf-btn secondary">Capturar e travar baseline</button></div>
        <div id="repMapStatus" class="perf-note" style="margin-top:9px;display:none"></div>`;

      const integration = root.querySelector('#repMapIntegration');
      const metric = root.querySelector('#repMapMetric');
      const status = root.querySelector('#repMapStatus');
      integration.onchange = async () => {
        metric.disabled = true; metric.innerHTML = '<option>Carregando métricas…</option>';
        const slug = integration.selectedOptions[0]?.dataset.slug;
        if (!slug) { metric.innerHTML = '<option value="">Escolha a integração primeiro</option>'; return; }
        try {
          const j = await rep({ action: 'METRICS', integration_slug: slug });
          metric.innerHTML = '<option value="">Selecione…</option>' + (j.metrics || []).map((m) => `<option value="${E(m.reference_key)}">${E(m.label || 'Métrica')}</option>`).join('');
          metric.disabled = false;
        } catch (e) { metric.innerHTML = '<option value="">Falha ao carregar</option>'; YM.toast(e.message, true); }
      };
      const selected = () => {
        const kpiId = root.querySelector('#repMapKpi').value;
        return { kpiId, kpi: kpis.find((k) => k.id === kpiId), intId: Number(integration.value), slug: integration.selectedOptions[0]?.dataset.slug, key: metric.value, start: root.querySelector('#repBaseStart').value, end: root.querySelector('#repBaseEnd').value };
      };
      root.querySelector('#repMapSave').onclick = async (event) => {
        const x = selected();
        if (!x.kpiId || !x.intId || !x.slug || !x.key) return YM.toast('Selecione KPI, integração e métrica.', true);
        if (x.kpi?.baseline_locked_at) return YM.toast('Este KPI está protegido porque o baseline já foi travado.', true);
        const button = event.currentTarget; button.disabled = true;
        try {
          await rep({ action: 'MAP_KPI', client_id: clientId, kpi_id: x.kpiId, integration_id: x.intId, integration_slug: x.slug, external_metric_key: x.key });
          const h = await sync({ action: 'HYDRATE_CLIENT', client_id: clientId });
          if (h.summary?.errors?.length) throw new Error('A métrica foi encontrada, mas a validação técnica não terminou. Revise a fonte antes do baseline.');
          status.style.display = 'block'; status.textContent = 'Fonte validada e vinculada. Agora capture o baseline para proteger definitivamente esse vínculo.';
          YM.toast('Fonte do KPI validada.');
        } catch (e) { YM.toast(e.message, true); }
        finally { button.disabled = false; }
      };
      root.querySelector('#repCaptureBaseline').onclick = async (event) => {
        const x = selected();
        if (!x.kpiId || !x.start || !x.end) return YM.toast('Selecione o KPI e o período do baseline.', true);
        if (x.kpi?.baseline_locked_at) return YM.toast('Este KPI já possui baseline travado.', true);
        if (!window.confirm('Confirmar este período como baseline oficial? O baseline e a fonte ficarão protegidos depois da captura.')) return;
        const button = event.currentTarget; button.disabled = true;
        try {
          const j = await rep({ action: 'SYNC_KPI', client_id: clientId, kpi_id: x.kpiId, start: x.start, end: x.end, is_baseline: true });
          status.style.display = 'block'; status.innerHTML = `Baseline capturado e protegido: <b>${Number(j.value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</b> · ${ptDate(x.start)} a ${ptDate(x.end)}.`;
          YM.toast('Baseline e fonte protegidos.');
          setTimeout(() => window.ClientPerformanceAdmin.open(clientId, 'fontes'), 500);
        } catch (e) { YM.toast(e.message, true); button.disabled = false; }
      };
    } catch (e) { root.innerHTML = `<div class="perf-note">${E(e.message)}</div>`; }
  }

  async function enhance() {
    wrap(); fixOldCopy();
    if (busy || !clientId || document.getElementById('perfAutomationPanel') || !document.getElementById('perf_fontes')) return;
    busy = true;
    try {
      const status = await sync({ action: 'GET_STATUS', client_id: clientId });
      const pane = document.getElementById('perf_fontes');
      pane.prepend(statusPanel(status));
    } catch (e) {
      const pane = document.getElementById('perf_fontes');
      if (pane && !document.getElementById('perfAutomationPanel')) {
        const n = document.createElement('div'); n.id = 'perfAutomationPanel'; n.className = 'perf-note'; n.textContent = e.message; pane.prepend(n);
      }
    } finally { busy = false; }
  }

  new MutationObserver(() => setTimeout(enhance, 80)).observe(document.body, { childList: true, subtree: true });
  setInterval(enhance, 1400);
  setTimeout(enhance, 500);
})();

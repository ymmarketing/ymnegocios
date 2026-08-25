(() => {
  if (window.ContentPerformance) return;
  const E = (value) => window.YM?.esc ? YM.esc(value) : String(value ?? '').replace(/[&<>"']/g, '');
  const today = () => new Date().toISOString().slice(0, 10);
  const pretty = (value) => String(value || '—').replaceAll('_', ' ').toLowerCase().replace(/^./, (x) => x.toUpperCase());
  let activeClientContentId = '';
  let clientDirectory = null;

  function styles() {
    if (document.getElementById('contentPerfStyles')) return;
    const style = document.createElement('style'); style.id = 'contentPerfStyles'; style.textContent = `
      .ct-post-state{display:inline-flex;padding:5px 7px;border-radius:999px;font-size:7px;font-weight:900;background:#fff4df;color:#8b5b12}.ct-post-state.posted{background:#eaf8f2;color:#137a5b}
      .cpf-back{position:fixed;inset:0;background:rgba(4,22,38,.7);z-index:850;display:grid;place-items:center;padding:15px}.cpf-modal{width:min(940px,100%);max-height:94vh;background:#f7f9fc;border-radius:20px;overflow:hidden;box-shadow:0 32px 90px rgba(0,0,0,.3)}
      .cpf-modal>header{display:flex;justify-content:space-between;align-items:center;gap:12px;background:#0a2540;color:#fff;padding:15px 17px}.cpf-modal h2{font:800 15px Montserrat;margin:0}.cpf-modal header small{display:block;font-size:8px;color:#bdd0e0;margin-top:4px}.cpf-close{width:33px;height:33px;border:0;border-radius:9px;background:rgba(255,255,255,.13);color:#fff;font-size:20px;cursor:pointer}.cpf-body{padding:14px;max-height:calc(94vh - 66px);overflow:auto}
      .cpf-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.cpf-card,.cpf-form{background:#fff;border:1px solid #dce5f0;border-radius:13px;padding:12px}.cpf-card h3,.cpf-form h3{font:800 11px Montserrat;color:#0a2540;margin:0}.cpf-card p{font-size:8.7px;color:#6b7c91;line-height:1.5}.cpf-values{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}.cpf-values div{background:#f3f6fa;padding:8px;border-radius:8px}.cpf-values small{display:block;font-size:7px;color:#8998a7;text-transform:uppercase;font-weight:900}.cpf-values b{font-size:9px;color:#0a2540}.cpf-formgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:8px}.cpf-wide{grid-column:1/-1}.cpf-label{display:block;font-size:8px;color:#0a2540;font-weight:800;margin-bottom:4px}.cpf-input,.cpf-select,.cpf-textarea{width:100%;border:1px solid #dce5f0;border-radius:9px;padding:9px;font-size:9.5px;background:#fff}.cpf-textarea{min-height:76px;resize:vertical}.cpf-btn{border:0;border-radius:9px;padding:9px 11px;background:#484dcf;color:#fff;font-size:8.8px;font-weight:800;cursor:pointer}.cpf-btn.secondary{background:#fff;color:#0a2540;border:1px solid #dce5f0}.cpf-note{font-size:8.5px;color:#6b7c91;line-height:1.5;background:#eef3f8;padding:9px;border-radius:9px;margin-bottom:9px}.cpf-empty{padding:20px;text-align:center;border:1px dashed #cad6e1;border-radius:11px;color:#6b7c91;font-size:9px}.cpf-prompt{white-space:pre-wrap;min-height:330px;font:10px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace}
      .cpf-calendar-flow{grid-column:1/-1;background:#eef3ff;border:1px solid #ccd4ff;border-radius:13px;padding:12px}.cpf-calendar-flow h3{font:800 11px Montserrat;color:#0a2540;margin:0 0 5px}.cpf-calendar-flow p{font-size:8.5px;color:#607287;line-height:1.5;margin:0 0 9px}.cpf-flow-actions{display:flex;gap:7px;flex-wrap:wrap}.cpf-flow-actions .cpf-btn:disabled{opacity:.5;cursor:not-allowed}
      @media(max-width:700px){.cpf-grid,.cpf-formgrid{grid-template-columns:1fr}.cpf-wide{grid-column:auto}.cpf-values{grid-template-columns:1fr}}
    `; document.head.append(style);
  }
  async function api(body) {
    const session = await YM.requireSession('/Conteudos'); if (!session) throw new Error('Sessão necessária.');
    const response = await fetch(YM.SUPABASE_URL + '/functions/v1/performance-admin', { method:'POST', headers:{ Authorization:'Bearer ' + session.access_token, apikey:YM.PUBLISHABLE_KEY, 'Content-Type':'application/json' }, body:JSON.stringify(body) });
    const json = await response.json().catch(() => ({})); if (!response.ok) throw new Error(json.detail || json.error || 'Falha ao acessar métricas do conteúdo.'); return json;
  }
  async function adminApi(body) {
    const session = await YM.requireSession('/Conteudos'); if (!session) throw new Error('Sessão necessária.');
    const response = await fetch(YM.SUPABASE_URL + '/functions/v1/central-ym-admin', { method:'POST', headers:{ Authorization:'Bearer ' + session.access_token, apikey:YM.PUBLISHABLE_KEY, 'Content-Type':'application/json' }, body:JSON.stringify(body) });
    const json = await response.json().catch(() => ({})); if (!response.ok) throw new Error(json.detail || json.error || 'Falha ao enviar o conteúdo para aprovação.'); return json;
  }
  async function getClientName(clientId) {
    if (!clientId) return 'YM / conteúdo interno';
    if (!clientDirectory) { const result = await YM.sb.rpc('central_ym_list_clients'); if (result.error) throw result.error; clientDirectory = result.data || []; }
    return clientDirectory.find((client) => client.client_id === clientId)?.client_name || 'Cliente selecionado';
  }
  function modal(title, subtitle, html) {
    document.getElementById('contentPerfModal')?.remove(); const wrap = document.createElement('div'); wrap.id = 'contentPerfModal'; wrap.innerHTML = `<div class="cpf-back"><section class="cpf-modal"><header><div><h2>${E(title)}</h2><small>${E(subtitle)}</small></div><button class="cpf-close">×</button></header><div class="cpf-body">${html}</div></section></div>`; document.body.append(wrap);
    const close = () => wrap.remove(); wrap.querySelector('.cpf-close').onclick = close; wrap.querySelector('.cpf-back').onclick = (event) => { if (event.target === event.currentTarget) close(); }; return wrap;
  }
  const value = (number, unit) => number == null ? '—' : unit === 'PERCENTUAL' ? Number(number).toLocaleString('pt-BR') + '%' : Number(number).toLocaleString('pt-BR', { maximumFractionDigits:2 });

  function promptText(content, metrics, strategy, objective, clientName) {
    const goals = metrics.length ? metrics.map((m) => `- ${m.metric_label}: meta ${value(m.target_value, m.unit)}${m.baseline_value == null ? '' : `; baseline ${value(m.baseline_value, m.unit)}`}`).join('\n') : '- Definir uma métrica principal coerente com o objetivo antes de produzir.';
    return `Crie o conteúdo abaixo pronto para ser montado no Canva. Não invente dados, cases, depoimentos ou resultados. Quando faltar informação, sinalize [VALIDAR COM A YM].\n\nCONTEXTO\n- Marca/cliente: ${clientName || 'YM / cliente indicado no briefing'}\n- Título interno: ${content.title_internal || content.client_title || '—'}\n- Objetivo do conteúdo: ${objective || content.client_objective || content.desired_behavior || '—'}\n- Função na jornada: ${pretty(content.function)}\n- Canal: ${pretty(content.primary_channel)}\n- Formato: ${pretty(content.format)}\n- Público/persona: ${strategy?.persona_name || content.persona || '—'}\n- Situação concreta do público: ${content.situation || '—'}\n- Por que a pessoa pararia: ${content.why_stop || '—'}\n- Comportamento desejado: ${content.desired_behavior || '—'}\n- Pensamento após consumir: ${content.after_thought || '—'}\n- Tema: ${content.theme || '—'}\n- Gancho: ${content.hook || '—'}\n- Mensagem central: ${content.central_message || '—'}\n- CTA: ${content.cta_text || pretty(content.cta_type)}\n\nMETAS DE PERFORMANCE\n${goals}\n\nENTREGA\n1. Estruture cada tela/quadro em ordem, com título e texto exato.\n2. Para vídeo, entregue cenas, fala, texto de tela e orientação visual. Para carrossel/post, entregue a hierarquia visual de cada página.\n3. Inclua legenda final, CTA e orientação de acessibilidade.\n4. Preserve o tom estratégico, direto e humano; evite clichês e promessas sem evidência.\n5. Termine com um checklist de produção no Canva e outro de mensuração após a postagem.\n\nFORMATO DA RESPOSTA\n- Conceito criativo\n- Estrutura página a página ou cena a cena\n- Legenda\n- CTA\n- Direção visual para o Canva\n- Checklist de publicação e mensuração`;
  }
  async function openPrompt(contentId) {
    try {
      const json = await api({ action:'GET_CONTENT', content_id:contentId }); const objective = json.content.content_objective || json.content.client_objective || json.content.desired_behavior || ''; const clientName = await getClientName(json.content.client_id);
      const prompt = promptText(json.content, json.metrics, json.strategy, objective, clientName); const wrap = modal('Prompt de construção no Canva', `${clientName} · ${json.content.title_internal || json.content.client_title}`, `<div class="cpf-note">O prompt já incorpora o cliente, os detalhes específicos deste post, o objetivo e as metas cadastradas. Revise e cole no ChatGPT para gerar a peça a ser montada no Canva.</div><label class="cpf-label">Objetivo do conteúdo</label><textarea id="cpfObjective" class="cpf-textarea">${E(objective)}</textarea><label class="cpf-label" style="margin-top:9px">Prompt pronto</label><textarea id="cpfPrompt" class="cpf-textarea cpf-prompt">${E(prompt)}</textarea><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:9px"><button id="cpfCopy" class="cpf-btn">Copiar prompt</button><button id="cpfSaveContext" class="cpf-btn secondary">Salvar objetivo</button></div>`);
      wrap.querySelector('#cpfCopy').onclick = async () => { const objectiveNow = wrap.querySelector('#cpfObjective').value.trim(); const finalPrompt = promptText(json.content, json.metrics, json.strategy, objectiveNow, clientName); wrap.querySelector('#cpfPrompt').value = finalPrompt; await navigator.clipboard.writeText(finalPrompt); await api({ action:'UPDATE_CONTENT_CONTEXT', content_id:contentId, content_objective:objectiveNow, prompt_context:{ metric_codes:json.metrics.map((x) => x.metric_code), template_version:'CANVA_V1' }, prompt_generated:true }); YM.toast('Prompt copiado e geração registrada.'); };
      wrap.querySelector('#cpfSaveContext').onclick = async () => { await api({ action:'UPDATE_CONTENT_CONTEXT', content_id:contentId, content_objective:wrap.querySelector('#cpfObjective').value.trim(), prompt_context:{ metric_codes:json.metrics.map((x) => x.metric_code), template_version:'CANVA_V1' }, prompt_generated:false }); YM.toast('Objetivo do conteúdo salvo.'); };
    } catch (error) { YM.toast(error.message, true); }
  }
  function metricForm() {
    return `<div class="cpf-form"><h3>Meta de engajamento / resultado</h3><div class="cpf-formgrid"><div><label class="cpf-label">KPI esperado</label><input id="cmLabel" class="cpf-input" placeholder="Ex.: Salvamentos"></div><div><label class="cpf-label">Formato</label><select id="cmUnit" class="cpf-select"><option value="NUMERO">Número</option><option value="PERCENTUAL">Percentual</option><option value="QUANTIDADE">Quantidade</option><option value="MOEDA">Moeda</option><option value="INDICE">Índice</option></select></div><div><label class="cpf-label">Direção</label><select id="cmDirection" class="cpf-select"><option value="MAIOR_MELHOR">Quanto maior, melhor</option><option value="MENOR_MELHOR">Quanto menor, melhor</option><option value="FAIXA_IDEAL">Faixa ideal</option></select></div><div><label class="cpf-label">Baseline</label><input id="cmBaseline" type="number" step="any" class="cpf-input"></div><div><label class="cpf-label">Meta</label><input id="cmTarget" type="number" step="any" class="cpf-input"></div><div><label class="cpf-label">Resultado realizado</label><input id="cmResult" type="number" step="any" class="cpf-input"></div><div><label class="cpf-label">Início da medição</label><input id="cmStart" type="date" value="${today()}" class="cpf-input"></div><div><label class="cpf-label">Fim da medição</label><input id="cmEnd" type="date" class="cpf-input"></div><div><label class="cpf-label">Fonte / evidência</label><input id="cmSource" class="cpf-input" placeholder="Link ou referência"></div><div class="cpf-wide"><label class="cpf-label">Notas</label><textarea id="cmNotes" class="cpf-textarea"></textarea></div></div><button id="cmSave" class="cpf-btn" style="margin-top:9px">Salvar meta e resultado</button></div>`;
  }
  function metricCards(metrics) {
    if (!metrics.length) return '<div class="cpf-empty">Nenhuma meta cadastrada. Defina de 1 a 3 KPIs que indiquem se este conteúdo cumpriu sua função.</div>';
    return `<div class="cpf-grid">${metrics.map((metric) => { const attained = metric.result_value != null && (metric.direction === 'MENOR_MELHOR' ? Number(metric.result_value) <= Number(metric.target_value) : Number(metric.result_value) >= Number(metric.target_value)); return `<article class="cpf-card"><div style="display:flex;justify-content:space-between;gap:8px"><h3>${E(metric.metric_label)}</h3><span class="ct-post-state ${attained ? 'posted' : ''}">${metric.result_value == null ? 'AGUARDANDO RESULTADO' : attained ? 'META ATINGIDA' : 'ABAIXO DA META'}</span></div><div class="cpf-values"><div><small>Baseline</small><b>${value(metric.baseline_value, metric.unit)}</b></div><div><small>Meta</small><b>${value(metric.target_value, metric.unit)}</b></div><div><small>Resultado</small><b>${value(metric.result_value, metric.unit)}</b></div></div><p>${E(metric.notes || `Fonte: ${pretty(metric.source_type)}`)}</p></article>`; }).join('')}</div>`;
  }
  async function openMetrics(contentId) {
    try {
      const json = await api({ action:'GET_CONTENT', content_id:contentId }); const wrap = modal('Metas e resultado do conteúdo', json.content.title_internal || json.content.client_title, `<div class="cpf-note">Cadastre o resultado esperado antes da publicação e complete o realizado depois. Isso permite comparar intenção, execução e performance.</div>${metricForm()}${metricCards(json.metrics)}`);
      wrap.querySelector('#cmSave').onclick = async (event) => { const button = event.currentTarget; button.disabled = true; try { await api({ action:'UPSERT_CONTENT_METRIC', content_id:contentId, metric_label:wrap.querySelector('#cmLabel').value, unit:wrap.querySelector('#cmUnit').value, direction:wrap.querySelector('#cmDirection').value, baseline_value:wrap.querySelector('#cmBaseline').value || null, target_value:wrap.querySelector('#cmTarget').value, result_value:wrap.querySelector('#cmResult').value || null, measurement_start:wrap.querySelector('#cmStart').value || null, measurement_end:wrap.querySelector('#cmEnd').value || null, source_ref:wrap.querySelector('#cmSource').value, notes:wrap.querySelector('#cmNotes').value }); YM.toast('Meta do conteúdo salva.'); wrap.remove(); await openMetrics(contentId); } catch (error) { YM.toast(error.message, true); button.disabled = false; } };
    } catch (error) { YM.toast(error.message, true); }
  }
  function readClientContentForm(modalRoot, current) {
    const field = (id) => modalRoot.querySelector('#' + id)?.value ?? '';
    return {
      client_id:field('fClient'), strategy_version:field('fStrategy').trim(), source_case_id:field('fCase').trim() || null,
      title_internal:field('fTitle').trim(), client_title:field('fClientTitle').trim(), client_objective:field('fClientObj').trim(), client_notes:field('fClientNotes').trim(),
      function:field('fFunction'), territory:field('fTerritory'), angle:field('fAngle'), situation:field('fSituation').trim(), desired_behavior:field('fBehavior').trim(), why_stop:field('fWhy').trim(), after_thought:field('fAfter').trim(), theme:field('fTheme').trim(), hook:field('fHook').trim(), central_message:field('fMessage').trim(),
      primary_channel:field('fChannel'), format:field('fFormat'), status:field('fStatus'), publish_date:field('fDate') || null, publish_time:field('fTime') || null, script_drive_url:field('fScript').trim(), asset_drive_url:field('fAsset').trim(), published_url:field('fPublished').trim(), cta_text:field('fCta').trim(), visible_to_client:true,
      paid_fit:field('fPaidFit'), paid_potential:field('fPaidPot'), paid_status:field('fPaidStatus'), icp_version:field('fStrategy').trim() || current.icp_version || 'CLIENTE', persona:current.persona || 'Cliente', icp_adherence:current.icp_adherence || 'ALTA', secondary_channels:current.secondary_channels || [], cta_type:current.cta_type || 'REFLETIR', evidence_type:current.evidence_type || '', evidence_ref:current.evidence_ref || '', paid_objective:current.paid_objective || '', paid_audience_temperature:current.paid_audience_temperature || '', paid_channel:current.paid_channel || '', paid_destination:current.paid_destination || '', paid_cta:current.paid_cta || '', test_hypothesis:current.test_hypothesis || '', signal_quality:current.signal_quality || 'NENHUM', learning:current.learning || '', reuse_decision:current.reuse_decision || '', notes:current.notes || '', updated_at:new Date().toISOString()
    };
  }
  async function saveAndApprove(contentId, button) {
    const root = document.getElementById('ccaModal'); if (!root) return;
    button.disabled = true; const original = button.textContent; button.textContent = 'Salvando e enviando…';
    try {
      const detail = await api({ action:'GET_CONTENT', content_id:contentId }); const payload = readClientContentForm(root, detail.content || {});
      if (!payload.client_id || !payload.title_internal) throw new Error('Informe o cliente e o título interno.');
      const driveUrl = payload.asset_drive_url || payload.script_drive_url;
      try { const parsed = new URL(driveUrl); if (!['http:','https:'].includes(parsed.protocol)) throw new Error(); } catch { throw new Error('Inclua o link do roteiro ou da arte/vídeo no Drive antes de enviar para aprovação.'); }
      const saved = await YM.sb.from('central_ym_content_items').update(payload).eq('id', contentId); if (saved.error) throw saved.error;
      const scheduledAt = payload.publish_date ? `${payload.publish_date}T${payload.publish_time || '12:00'}:00-03:00` : null;
      const approval = await adminApi({ action:'CREATE_APPROVAL', client_id:payload.client_id, title:payload.client_title || payload.title_internal, content_type:payload.format, description:payload.client_objective || payload.client_notes || '', drive_url:driveUrl, scheduled_at:scheduledAt, version_notes:'Enviado pelo calendário de conteúdos da Central YM.' });
      const review = await YM.sb.from('central_ym_content_items').update({ status:'REVISAO', visible_to_client:true, updated_at:new Date().toISOString() }).eq('id', contentId); if (review.error) throw review.error;
      const delivery = approval?.email_delivery?.status; const feedback = delivery === 'SENT' ? 'Conteúdo salvo, enviado para aprovação e cliente avisado por e-mail.' : delivery === 'FAILED' ? 'Conteúdo salvo e enviado para aprovação, mas o e-mail não pôde ser enviado.' : delivery === 'SKIPPED' ? 'Conteúdo salvo e enviado para aprovação; cliente sem e-mail transacional cadastrado.' : delivery === 'DUPLICATE' ? 'Conteúdo salvo e enviado para aprovação; este aviso já havia sido enviado.' : 'Conteúdo salvo e enviado para aprovação do cliente.';
      root.remove(); YM.toast(feedback, delivery === 'FAILED'); document.querySelector('[data-tab="clientes"]')?.click();
    } catch (error) { YM.toast(error.message, true); button.disabled = false; button.textContent = original; }
  }
  function enhanceClientCalendarModal() {
    const root = document.getElementById('ccaModal'); if (!root || root.querySelector('[data-client-content-flow]')) return;
    const save = root.querySelector('#fSave'); if (!save) return;
    const block = document.createElement('section'); block.className = 'cpf-calendar-flow'; block.dataset.clientContentFlow = '1';
    if (!activeClientContentId) {
      block.innerHTML = '<h3>Fluxo deste post</h3><p>Salve o novo conteúdo primeiro. Depois, reabra-o no calendário para gerar o prompt com os dados específicos, definir metas e enviá-lo para aprovação.</p>';
    } else {
      block.innerHTML = '<h3>Fluxo deste post</h3><p>Gere o prompt com os dados deste cliente e deste post. A criação direta por API permanece preparada para a segunda fase, depois da validação do prompt.</p><div class="cpf-flow-actions"><button type="button" class="cpf-btn" data-calendar-prompt>Gerar prompt de criação</button><button type="button" class="cpf-btn secondary" data-calendar-metrics>Metas e resultado</button><button type="button" class="cpf-btn" data-calendar-approve>Salvar e enviar para aprovação</button></div>';
      block.querySelector('[data-calendar-prompt]').onclick = () => openPrompt(activeClientContentId);
      block.querySelector('[data-calendar-metrics]').onclick = () => openMetrics(activeClientContentId);
      block.querySelector('[data-calendar-approve]').onclick = (event) => saveAndApprove(activeClientContentId, event.currentTarget);
    }
    save.closest('.cca-wide')?.before(block);
  }
  function enhance() {
    enhanceClientCalendarModal();
    document.querySelectorAll('.ct-card').forEach((card) => {
      const edit = card.querySelector('[data-edit-content]'); if (!edit) return; const id = edit.dataset.editContent;
      const status = card.querySelector('.ct-card-top > .ct-tag')?.textContent?.trim().toUpperCase() || ''; const posted = ['PUBLICADO','ANALISADO'].includes(status);
      const tags = card.querySelector('.ct-tags'); if (tags && status && !tags.querySelector('.ct-post-state')) { const state = document.createElement('span'); state.className = 'ct-post-state' + (posted ? ' posted' : ''); state.textContent = posted ? 'POSTADO' : 'NÃO POSTADO'; tags.prepend(state); }
      const actions = card.querySelector('.ct-actions'); if (!actions || actions.querySelector('[data-content-prompt]')) return;
      const prompt = document.createElement('button'); prompt.className = 'ym-btn'; prompt.dataset.contentPrompt = id; prompt.textContent = 'Criar prompt Canva'; prompt.onclick = () => openPrompt(id);
      const metrics = document.createElement('button'); metrics.className = 'ym-btn secondary'; metrics.dataset.contentMetrics = id; metrics.textContent = 'Metas e resultado'; metrics.onclick = () => openMetrics(id); actions.append(prompt, metrics);
    });
  }
  document.addEventListener('click', (event) => { const content = event.target.closest?.('.cca-event[data-cc]'); if (content) activeClientContentId = content.dataset.cc; if (event.target.closest?.('#ccaNew')) activeClientContentId = ''; }, true);
  styles(); new MutationObserver(() => requestAnimationFrame(enhance)).observe(document.body, { childList:true, subtree:true }); setInterval(enhance, 800); enhance();
  window.ContentPerformance = { openPrompt, openMetrics, api, adminApi };
})();

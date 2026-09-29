(() => {
  'use strict';
  const endpoint = 'https://srzdikgztpdtwbggwniz.supabase.co/functions/v1/ym-public-triage';
  const form = document.getElementById('triage-form');
  const error = document.getElementById('error');
  const result = document.getElementById('result');
  const button = document.getElementById('submit');
  const track = (name, params = {}) => window.YMAnalytics?.track(name, { source_page: location.pathname, ...params });
  let started = false;
  form.addEventListener('focusin', () => {
    if (started) return;
    started = true;
    track('avaliacao_inicio');
  });
  const keys = ['revenue','products','units','sales','journey','systems','volume','operations'];
  const channelInputs = [...form.querySelectorAll('[name="channels_selected"]')];
  const unknownChannel = channelInputs.find(input => input.value === 'nao_sei');
  channelInputs.forEach(input => input.addEventListener('change', () => {
    if (input.checked && input === unknownChannel) channelInputs.filter(other => other !== input).forEach(other => { other.checked = false; });
    else if (input.checked) unknownChannel.checked = false;
    channelInputs[0].setCustomValidity('');
  }));
  const utm = Object.fromEntries(new URLSearchParams(location.search));
  const source = {};
  for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) {
    if (utm[key]) source[key] = String(utm[key]).slice(0, 160);
  }
  source.landing_path = location.pathname;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const channels = channelInputs.filter(input => input.checked).map(input => input.value);
    channelInputs[0].setCustomValidity(channels.length ? '' : 'Selecione ao menos uma opção de canal.');
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const answers = Object.fromEntries(keys.map(key => [key, fields.get(key) === 'unknown' ? 2 : Number(fields.get(key))]));
    answers.channels_selected = channels;
    if (fields.get('revenue') === 'unknown') source.revenue_unknown = true;
    const body = {
      name: fields.get('name'), business_name: fields.get('business_name'),
      email: fields.get('email'), phone: fields.get('phone'), website: fields.get('website'),
      answers, source, consent: document.getElementById('consent').checked,
    };
    button.disabled = true; button.textContent = 'Enviando…'; error.textContent = '';
    track('avaliacao_envio');
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        const messages = {
          invalid_form: 'Não conseguimos validar os dados enviados. Revise os campos e tente novamente.',
          too_many_requests: 'Recebemos muitas avaliações novas agora. Tente novamente mais tarde.',
          storage_unavailable: 'O serviço está indisponível no momento. Sua avaliação não foi concluída; tente novamente em instantes.',
        };
        throw new Error(messages[data.error] || 'Não foi possível concluir a avaliação agora. Tente novamente em instantes.');
      }
      track('avaliacao_concluida', { rota_inicial: data.route });
      const strategic = data.route === 'ESTRATEGICO';
      const title = strategic ? 'Raio-X Estratégico YM' : 'Raio-X Digital YM';
      const target = strategic ? 'https://wa.me/5531975073862?text=' + encodeURIComponent('Olá, Yasmin! Fiz a avaliação inicial YM e gostaria de conversar sobre o Raio-X Estratégico. Código: ' + data.id) : '/raio-x.html?checkout=1';
      const make = (tag, className, content) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        element.textContent = content;
        return element;
      };
      const selectedText = key => form.querySelector(`[name="${key}"]`).selectedOptions[0].textContent;
      const channelText = channels.includes('nao_sei') ? 'Ainda não identificados' : `${channels.length} ${channels.length === 1 ? 'canal marcado' : 'canais marcados'}`;
      const signals = [
        ['Canais que já trouxeram clientes', channelText],
        ['Jornada até a venda', selectedText('journey')],
        ['Sistemas no processo', selectedText('systems')],
      ];
      result.replaceChildren();
      result.append(make('p', 'eyebrow', 'Resultado da avaliação gratuita'));
      if (data.known_contact === true) result.append(make('p', 'returning-note', 'Já nos conhecemos! Registramos esta nova avaliação da sua empresa.'));
      result.append(make('h2', '', 'O que seu resultado significa'));
      const scoreBlock = make('div', 'result-score', '');
      scoreBlock.append(make('strong', '', `${data.score}/100`), make('span', '', 'Score de complexidade declarada'));
      const meter = make('div', 'result-meter', '');
      meter.setAttribute('role', 'meter');
      meter.setAttribute('aria-label', 'Complexidade declarada na avaliação inicial');
      meter.setAttribute('aria-valuemin', '0');
      meter.setAttribute('aria-valuemax', '100');
      meter.setAttribute('aria-valuenow', String(data.score));
      const fill = make('span', '', '');
      fill.style.width = `${Math.min(100, Math.max(0, Number(data.score) || 0))}%`;
      meter.append(fill);
      result.append(scoreBlock, meter);
      result.append(make('p', 'result-explanation', 'De 0 a 100, o número resume o porte, as frentes e as etapas que você informou. Quanto mais camadas e integrações declaradas, maior a complexidade. Não é uma nota de desempenho, um cálculo de perdas nem um diagnóstico da causa de um problema.'));
      const evidence = make('div', 'result-evidence', '');
      evidence.append(make('h3', '', 'Algumas respostas consideradas'));
      const list = make('ul', 'result-signals', '');
      for (const [label, value] of signals) {
        const item = make('li', '', '');
        item.append(make('span', '', label), make('b', '', value));
        list.append(item);
      }
      evidence.append(list, make('p', 'help', 'O cálculo também considera faturamento aproximado, ofertas, unidades, modelo de venda, volume de contatos e operação.'));
      result.append(evidence);
      const next = make('div', 'result-next', '');
      next.append(make('p', 'eyebrow', 'Seu próximo passo'), make('h3', '', `Por que indicamos o ${title}?`));
      if (strategic) {
        next.append(make('p', '', 'Suas respostas indicam mais frentes para entender em conjunto. A avaliação gratuita mostra a dimensão da estrutura, mas ainda não conferiu dados nem avaliou as relações entre as áreas. Uma conversa com a YM permite definir a profundidade e o escopo do diagnóstico consultivo.'));
        next.append(make('p', 'result-pitch', 'No Raio-X Estratégico, a análise pode aprofundar a jornada, mapear oportunidades e construir um plano de ação adequado ao seu contexto. O investimento é apresentado depois da conversa sobre o escopo.'));
      } else {
        next.append(make('p', '', 'Sua estrutura declarada permite começar por uma leitura digital estruturada. A avaliação gratuita organizou as respostas, mas ainda não verificou o que está funcionando, onde há pontos de atenção e o que merece investigação.'));
        next.append(make('p', 'result-pitch', 'Por R$ 97, em pagamento único, o Raio-X Digital aprofunda as perguntas e entrega um relatório com o que já funciona, oportunidades, pontos de atenção e prioridades iniciais. Antes de investir mais tempo ou dinheiro, veja onde vale olhar primeiro. Sem obrigação de contratar outro serviço.'));
      }
      const link = make('a', 'button', strategic ? 'Conversar sobre meu Raio-X Estratégico →' : 'Fazer meu Raio-X Digital por R$ 97 →');
      link.href = target;
      next.append(link, make('p', 'help', 'Esta é uma indicação inicial. A YM pode rever a rota depois de conhecer melhor a operação.'));
      result.append(next);
      form.hidden = true; result.hidden = false; result.scrollIntoView({behavior:'smooth'});
    } catch (err) { track('avaliacao_erro'); error.textContent = err.message; button.disabled = false; button.textContent = 'Avaliação gratuita'; }
  });
})();

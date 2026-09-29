(() => {
  'use strict';
  const endpoint = 'https://srzdikgztpdtwbggwniz.supabase.co/functions/v1/ym-public-triage';
  const form = document.getElementById('triage-form');
  const error = document.getElementById('error');
  const result = document.getElementById('result');
  const button = document.getElementById('submit');
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
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error('Não foi possível concluir a avaliação agora. Confira os dados e tente novamente.');
      const strategic = data.route === 'ESTRATEGICO';
      const title = strategic ? 'Raio-X Estratégico YM' : 'Raio-X Digital YM';
      const message = strategic ? 'Sua operação apresenta mais camadas para investigar. A recomendação inicial é uma conversa de enquadramento para avaliar o Raio-X Estratégico.' : 'Sua operação pode começar por uma leitura digital estruturada. O Raio-X Digital custa R$ 97.';
      const target = strategic ? 'https://wa.me/5531975073862?text=' + encodeURIComponent('Olá, Yasmin! Fiz a avaliação inicial YM e gostaria de conversar sobre o Raio-X Estratégico. Código: ' + data.id) : '/raio-x.html?checkout=1';
      result.replaceChildren();
      const p = document.createElement('p'); p.className = 'eyebrow'; p.textContent = 'Sua rota inicial';
      const heading = document.createElement('h2'); heading.textContent = title;
      const score = document.createElement('strong'); score.textContent = `${data.score}/100`;
      const description = document.createElement('p'); description.textContent = message;
      const note = document.createElement('p'); note.className = 'help'; note.textContent = 'Este score mede a complexidade declarada, não a qualidade da empresa nem o valor de uma eventual perda. A YM pode revisar a rota.';
      const link = document.createElement('a'); link.className = 'button'; link.href = target; link.textContent = strategic ? 'Conversar com a YM →' : 'Conhecer o Raio-X Digital →';
      result.append(p, heading, score, description, note, link);
      form.hidden = true; result.hidden = false; result.scrollIntoView({behavior:'smooth'});
    } catch (err) { error.textContent = err.message; button.disabled = false; button.textContent = 'Avaliação gratuita'; }
  });
})();

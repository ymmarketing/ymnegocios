(() => {
  'use strict';
  const form = document.getElementById('cdd-form');
  const result = document.getElementById('cdd-result');
  const cards = document.getElementById('cdd-cards');
  if (!form || !result || !cards) return;
  const money = new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL', maximumFractionDigits:0});
  const decimal = new Intl.NumberFormat('pt-BR', {maximumFractionDigits:2});
  const get = name => {
    const value = form.elements.namedItem(name).value;
    return value === '' ? null : Number(value);
  };
  const complete = (...values) => values.every(value => value !== null && Number.isFinite(value));
  const node = (tag, content) => {
    const element = document.createElement(tag);
    element.textContent = content;
    return element;
  };
  const empty = reason => ({value:'Sem estimativa', detail:reason, isEmpty:true});
  const calculate = () => {
    const leads = get('leads'), current = get('conversion'), reference = get('reference'), ticket = get('ticket');
    const source = form.elements.namedItem('reference_source').value;
    let opportunity = empty('Informe contatos, as duas taxas, o ticket e a origem da referência.');
    if (complete(leads,current,reference,ticket) && source) {
      if (reference <= current) opportunity = empty('A conversão de referência precisa ser maior que a atual para formar um cenário incremental.');
      else {
        const sourceLabel = {history:'melhor período comparável',goal:'meta interna',scenario:'hipótese de simulação'}[source];
        opportunity = {
          value: money.format(leads * (reference - current) / 100 * ticket),
          detail: `${decimal.format(leads)} contatos × (${decimal.format(reference)}% − ${decimal.format(current)}%) × ${money.format(ticket)}. Referência: ${sourceLabel}. Receita bruta potencial por mês, não lucro ou venda garantida.`,
        };
      }
    }
    const spend = get('marketing_spend'), marketingHours = get('marketing_hours'), marketingRate = get('marketing_hour_cost');
    const attribution = form.elements.namedItem('attribution').value;
    let marketing = empty('Informe o gasto direto ou horas e custo/hora; indique também como acompanha o retorno.');
    const timeKnown = complete(marketingHours,marketingRate);
    const timeBlank = marketingHours === null && marketingRate === null;
    if (attribution && (spend !== null || timeKnown) && (timeKnown || timeBlank)) {
      const total = (spend || 0) + (timeKnown ? marketingHours * marketingRate : 0);
      const interpretation = attribution === 'yes'
        ? 'Você informou que acompanha resultados; este investimento não foi classificado como sem atribuição.'
        : 'Investimento cuja relação com resultados ainda precisa ser verificada. Não é prejuízo comprovado.';
      marketing = {value:money.format(total),detail:`Gasto direto + horas de produção/gestão × custo/hora, por mês. ${interpretation}`};
    }
    const manualHours = get('manual_hours'), manualRate = get('manual_hour_cost');
    const manual = complete(manualHours,manualRate)
      ? {value:money.format(manualHours * manualRate),detail:'Horas mensais em tarefas manuais × custo/hora. É custo de tempo empregado, não economia garantida.'}
      : empty('Informe horas manuais por mês e custo aproximado por hora.');
    const count = get('rework_count'), minutes = get('rework_minutes'), rate = get('rework_hour_cost'), direct = get('rework_direct');
    const reworkTimeKnown = complete(count,minutes,rate);
    const reworkTimeBlank = count === null && minutes === null && rate === null;
    const rework = (reworkTimeKnown || reworkTimeBlank) && (reworkTimeKnown || direct !== null)
      ? {value:money.format((reworkTimeKnown ? count * minutes / 60 * rate : 0) + (direct || 0)),detail:'Ocorrências × minutos por ocorrência ÷ 60 × custo/hora + gasto direto extra, por mês. Exclua horas já contadas como tarefa manual.'}
      : empty('Informe ocorrências, minutos e custo/hora; ou apenas o gasto direto extra. Não repita horas já contadas.');
    return [
      ['Receita potencial não capturada',opportunity],
      ['Investimento em marketing',marketing],
      ['Tempo em tarefas manuais',manual],
      ['Retrabalho e fricção',rework],
    ];
  };
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    cards.replaceChildren();
    for (const [title, estimate] of calculate()) {
      const card = node('article','');
      card.className = 'cdd-card';
      if (estimate.isEmpty) card.classList.add('is-empty');
      card.append(node('h3',title),node('strong',estimate.value),node('p',estimate.detail));
      cards.append(card);
    }
    result.hidden = false;
    result.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    result.focus({preventScroll:true});
    window.YMAnalytics?.track('cdd_estimativa_visualizada', {source_page:location.pathname});
  });
})();

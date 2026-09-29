(() => {
  'use strict';
  const form = document.getElementById('cdd-form');
  const result = document.getElementById('cdd-result');
  const cards = document.getElementById('cdd-cards');
  const summary = document.getElementById('cdd-summary');
  if (!form || !result || !cards || !summary) return;
  const money = new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL', maximumFractionDigits:2});
  const number = new Intl.NumberFormat('pt-BR', {maximumFractionDigits:1});
  const pct = value => `${number.format(value)}%`;
  const get = name => {
    const value = form.elements.namedItem(name).value;
    return value === '' ? null : Number(value);
  };
  const known = (...values) => values.every(value => value !== null && Number.isFinite(value));
  const element = (tag, value, className) => {
    const el = document.createElement(tag);
    el.textContent = value;
    if (className) el.className = className;
    return el;
  };
  const addCard = (target, title, value, detail, next, empty = false) => {
    const card = element('article', '', empty ? 'cdd-card is-empty' : 'cdd-card');
    card.append(element('h3', title), element('strong', value), element('p', detail));
    if (next) card.append(element('p', next, 'cdd-next'));
    target.append(card);
  };
  const monthly = (count, minutes) => count * minutes * 4 / 60;
  const calculate = () => {
    cards.replaceChildren();
    summary.replaceChildren();
    const revenue = get('revenue'), leads = get('leads'), customers = get('customers');
    const ticket = get('ticket'), extra = get('extra_sales');
    const spend = get('marketing_spend');
    const attribution = form.elements.namedItem('attribution').value;
    const manualCount = get('manual_count'), manualMinutes = get('manual_minutes'), manualRate = get('manual_hour_cost');
    const reworkCount = get('rework_count'), reworkMinutes = get('rework_minutes'), reworkRate = get('rework_hour_cost');
    const direct = get('rework_direct'), reduction = get('reduction');
    const manualHours = known(manualCount, manualMinutes) ? monthly(manualCount, manualMinutes) : null;
    const reworkHours = known(reworkCount, reworkMinutes) ? monthly(reworkCount, reworkMinutes) : null;
    const manualCost = known(manualHours, manualRate) ? manualHours * manualRate : null;
    const reworkCost = known(reworkHours, reworkRate) ? reworkHours * reworkRate : null;
    const knownCosts = [manualCost, reworkCost, direct].filter(value => value !== null);
    const operating = knownCosts.reduce((a, b) => a + b, 0);
    const incomplete = (manualHours !== null && manualCost === null) || (reworkHours !== null && reworkCost === null)
      || (manualCount !== null && manualMinutes === null) || (manualCount === null && manualMinutes !== null)
      || (reworkCount !== null && reworkMinutes === null) || (reworkCount === null && reworkMinutes !== null);

    if (known(leads, customers) && leads > 0) {
      addCard(cards, 'De contatos a clientes', pct(customers / leads * 100),
        `${number.format(customers)} clientes ÷ ${number.format(leads)} pessoas que entraram em contato. É a conversão do grupo informado, não uma nota de desempenho.`,
        'Para avaliar se está bom, acompanhe a mesma medida por alguns meses e compare com sua própria meta.');
    } else {
      addCard(cards, 'De contatos a clientes', 'Primeiro dado a medir',
        'Ainda não dá para calcular quantos contatos viram clientes.',
        'Anote cada novo contato e marque quais dessas pessoas compraram. Se a venda demora, acompanhe o grupo até a decisão.', true);
    }
    if (known(extra, ticket)) {
      const potential = extra * ticket;
      const comparison = revenue !== null
        ? `Faturamento de ${money.format(revenue)} hoje → ${money.format(revenue + potential)} no cenário (${revenue > 0 ? '+' + pct(potential / revenue * 100) : 'sem percentual com faturamento zero'}).`
        : 'Informe o faturamento mensal para comparar com o valor atual e ver a variação percentual.';
      addCard(cards, 'Vendas extras que você escolheu simular', money.format(potential),
        `${number.format(extra)} vendas extras × ${money.format(ticket)} por venda = receita bruta potencial por mês. ${comparison}`,
        'É uma hipótese, não uma previsão de vendas ou de lucro.');
    } else {
      addCard(cards, 'Cenário de vendas', 'Sem projeção de vendas',
        'Você ainda não informou uma quantidade de vendas extras e o valor médio por venda.',
        'Se não sabe o valor médio, divida as vendas do mês pela quantidade de vendas. Uma meta só faz sentido quando você conhece o ponto de partida.', true);
    }
    if (spend !== null) {
      const reading = attribution === 'yes' ? 'Você informou que acompanha a relação com contatos e vendas.'
        : attribution === 'partial' ? 'Você acompanha uma parte; registre a origem dos demais contatos e vendas.'
        : 'Você ainda não consegue confirmar quanto desse investimento gerou contatos e vendas.';
      addCard(cards, 'Marketing que você já paga', money.format(spend),
        `Valor mensal informado. ${reading} Isso não é prejuízo comprovado e não entra na economia simulada.`,
        'Compare os pagamentos do mês com contatos e clientes gerados por cada ação.');
    } else {
      addCard(cards, 'Marketing que você já paga', 'Primeiro dado a medir',
        'Sem os gastos atuais, não dá para avaliar o tamanho do investimento.',
        'Some faturas de anúncios, ferramentas, conteúdo e prestadores de um mês comum.', true);
    }
    const timeCard = (title, hours, cost, count, minutes, rate, emptyText) => {
      if (hours === null) {
        addCard(cards, title, 'Primeiro dado a medir', emptyText,
          'Observe uma tarefa em três ocasiões; conte quantas vezes ela ocorre em uma semana comum.', true);
      } else {
        const detail = `${number.format(count)} vezes/semana × ${number.format(minutes)} min × 4 semanas ÷ 60 = ${number.format(hours)} h/mês.`;
        addCard(cards, title, cost === null ? `${number.format(hours)} h/mês` : `${number.format(hours)} h/mês · ${money.format(cost)}`,
          cost === null ? detail : `${detail} ${number.format(hours)} h × ${money.format(rate)}/h = ${money.format(cost)} em tempo empregado.`,
          cost === null ? 'Se quiser estimar o custo, divida a remuneração mensal pelas horas trabalhadas no mês e informe o custo por hora.' : 'É custo de tempo empregado, não dinheiro que será necessariamente economizado.');
      }
    };
    timeCard('Tarefa repetida', manualHours, manualCost, manualCount, manualMinutes, manualRate, 'Ainda não sabemos a frequência e a duração de uma tarefa repetida.');
    timeCard('Retrabalho', reworkHours, reworkCost, reworkCount, reworkMinutes, reworkRate, 'Ainda não sabemos quanto tempo é gasto refazendo uma tarefa.');
    if (direct !== null) addCard(cards, 'Gasto direto com retrabalho', money.format(direct),
      'Valor extra mensal informado por você, separado das horas de correção.', 'Confira recibos ou registros para confirmar esse gasto.');

    if (knownCosts.length) {
      const qualifier = incomplete ? 'Total parcial dos custos informados' : 'Custos operacionais calculados';
      const ratio = revenue !== null && revenue > 0 ? ` Isso representa ${pct(operating / revenue * 100)} do faturamento mensal de ${money.format(revenue)}.`
        : ' Informe um faturamento maior que zero para ver quanto isso representa em percentual.';
      addCard(summary, qualifier, money.format(operating),
        'Soma somente do custo da tarefa repetida, do retrabalho e do gasto extra direto que puderam ser calculados.' + ratio,
        incomplete ? 'Há tempo informado sem custo por hora ou frequência incompleta. O total não representa toda a operação.' : 'O investimento em marketing e a receita de vendas extras ficam fora deste total.');
      if (reduction !== null) {
        const after = operating * (1 - reduction / 100);
        const points = revenue > 0 ? (operating - after) / revenue * 100 : null;
        const comparison = revenue !== null && revenue > 0
          ? ` Em relação ao mesmo faturamento: ${pct(operating / revenue * 100)} → ${pct(after / revenue * 100)} (queda de ${number.format(points)} ${points <= 1 ? 'ponto percentual' : 'pontos percentuais'}). De cada R$ 100 faturados, esses custos passariam de ${money.format(operating / revenue * 100)} para ${money.format(after / revenue * 100)}.`
          : ' Informe o faturamento mensal para ver a mudança em pontos percentuais.';
        addCard(summary, `Se reduzir ${pct(reduction)} desses custos`, `${money.format(operating)} → ${money.format(after)}`,
          `Diferença simulada de ${money.format(operating - after)} por mês.${comparison}`,
          (incomplete ? 'Cenário parcial. ' : '') + 'A meta foi escolhida por você. Para dizer se o resultado é bom, compare com meses anteriores e avalie se a redução preserva a qualidade do atendimento. Não é uma economia garantida.');
      } else {
        addCard(summary, 'E se esse custo diminuísse?', 'Escolha um percentual',
          'Informe na etapa 5 a redução que deseja simular para ver o valor de hoje, o cenário e a diferença em pontos percentuais.',
          'É uma hipótese sua, não um percentual estimado pela YM.', true);
      }
    } else {
      addCard(summary, 'Ponto de partida', 'Ainda não há um total em reais',
        'Tempo sem custo por hora não vira valor em dinheiro. O gasto em marketing e as vendas extras não são somados como perda.',
        'Comece anotando frequência, minutos e custo por hora de uma tarefa. Se souber apenas o tempo, a leitura das horas já ajuda.', true);
    }
    if (revenue === null) addCard(summary, 'Comparação com o faturamento', 'Falta uma referência',
      'Sem o faturamento mensal, não podemos dizer que parcela da receita esses custos representam nem mostrar uma mudança em pontos percentuais.',
      'Consulte o total de vendas de um mês comum no seu registro financeiro.', true);
  };
  form.addEventListener('submit', event => {
    event.preventDefault();
    const customers = form.elements.namedItem('customers');
    const leads = get('leads'), won = get('customers');
    customers.setCustomValidity(known(leads, won) && won > leads ? 'O número de clientes deste grupo não pode ser maior que o número de contatos.' : '');
    if (!form.reportValidity()) return;
    calculate();
    result.hidden = false;
    result.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    result.focus({preventScroll:true});
    window.YMAnalytics?.track('cdd_estimativa_visualizada', {source_page:location.pathname});
  });
  form.elements.namedItem('customers').addEventListener('input', event => event.target.setCustomValidity(''));
  form.elements.namedItem('leads').addEventListener('input', () => form.elements.namedItem('customers').setCustomValidity(''));
})();

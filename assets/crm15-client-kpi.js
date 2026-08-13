
(() => {
  let activeBigFilter = null;

  function clientsMode() {
    return document.getElementById('activeClientsTab')?.classList.contains('on');
  }

  function parseMoney(text) {
    const match = String(text || '').match(/R\$\s*([\d.]+,\d{2})/);
    if (!match) return 0;
    return Number(match[1].replace(/\./g, '').replace(',', '.')) || 0;
  }

  function dateKey(text) {
    const match = String(text || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
  }

  function iso(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function periodBounds() {
    const code = document.getElementById('financialPeriod')?.value || 'ALL';
    const now = new Date();
    if (code === 'ALL') return { code, start: null, end: null };
    if (code === 'CUSTOM') {
      return {
        code,
        start: document.getElementById('periodStart')?.value || null,
        end: document.getElementById('periodEnd')?.value || null
      };
    }
    const months = code === 'CURRENT' ? 1 : code === 'M3' ? 3 : code === 'M6' ? 6 : 12;
    return {
      code,
      start: iso(new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)),
      end: iso(now)
    };
  }

  function inPeriod(value, bounds) {
    if (!value) return false;
    if (bounds.start && value < bounds.start) return false;
    if (bounds.end && value > bounds.end) return false;
    return true;
  }

  function servicePayments(service) {
    return [...service.row.querySelectorAll('.pay-line')].map((line) => {
      const text = line.querySelector('.pay-main')?.textContent || '';
      return {
        paid: /\bPAGO\b/.test(text),
        date: dateKey(text),
        amount: parseMoney(text)
      };
    });
  }

  function paymentTotal(card, type) {
    const tools = window.YMClientFilters;
    if (!tools) return { total: 0, dates: [] };
    const bounds = periodBounds();
    let total = 0;
    const dates = [];

    tools.getServices(card).forEach((service) => {
      if (type && service.type !== type) return;
      servicePayments(service).forEach((payment) => {
        if (payment.paid && inPeriod(payment.date, bounds)) {
          total += payment.amount;
          dates.push(payment.date);
        }
      });
    });
    return { total, dates };
  }

  function cardMatches(card, key) {
    const tools = window.YMClientFilters;
    if (!tools || !key || key === 'CLIENTS') return true;
    const services = tools.getServices(card);
    if (key === 'ACTIVE') {
      return services.some((service) => tools.activeServiceStatuses.has(service.status));
    }
    if (key === 'REC') {
      return services.some((service) =>
        service.type === 'RECORRENTE' &&
        tools.activeServiceStatuses.has(service.status)
      );
    }
    if (key === 'REC_AVG' || key === 'REC_PAID') {
      return paymentTotal(card, 'RECORRENTE').total > 0;
    }
    if (key === 'AVULSO_PAID') {
      return paymentTotal(card, 'AVULSO').total > 0;
    }
    if (key === 'TOTAL_PAID') {
      return paymentTotal(card).total > 0;
    }
    return true;
  }

  function monthSpan(dates) {
    if (!dates.length) return 0;
    const sorted = [...dates].sort();
    const first = new Date(sorted[0] + 'T12:00:00');
    const last = new Date(sorted[sorted.length - 1] + 'T12:00:00');
    return (last.getFullYear() - first.getFullYear()) * 12 +
      last.getMonth() - first.getMonth() + 1;
  }

  function selectedPeriodMonths(bounds, recurringDates) {
    if (bounds.code === 'ALL') return monthSpan(recurringDates);
    if (!bounds.start || !bounds.end) return monthSpan(recurringDates);
    const first = new Date(bounds.start + 'T12:00:00');
    const last = new Date(bounds.end + 'T12:00:00');
    return (last.getFullYear() - first.getFullYear()) * 12 +
      last.getMonth() - first.getMonth() + 1;
  }

  function ensureStyles() {
    if (document.getElementById('clientKpiClickStyles')) return;
    const style = document.createElement('style');
    style.id = 'clientKpiClickStyles';
    style.textContent = `
      .ym-kpi.kpi-clickable { cursor: pointer; transition: .15s; }
      .ym-kpi.kpi-clickable:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 22px rgba(15,42,67,.08);
      }
      .ym-kpi.kpi-active-filter {
        outline: 2px solid #484DCF;
        background: #F5F5FF !important;
      }
      .ym-kpi.kpi-active-filter::after {
        content: 'Filtro ativo';
        display: block;
        margin-top: 5px;
        font-size: 7.5px;
        font-weight: 800;
        color: #484DCF;
        text-transform: uppercase;
        letter-spacing: .05em;
      }
    `;
    document.head.append(style);
  }

  function setText(element, value) {
    if (element && element.textContent !== String(value)) {
      element.textContent = value;
    }
  }

  function recalculate(cards) {
    const tools = window.YMClientFilters;
    const box = document.querySelector('.ym-grid.ym-kpis');
    if (!tools || !box) return;

    const services = cards.flatMap((card) => tools.getServices(card));
    const activeServices = services.filter((service) =>
      tools.activeServiceStatuses.has(service.status)
    ).length;
    const recurringActive = services.filter((service) =>
      service.type === 'RECORRENTE' &&
      tools.activeServiceStatuses.has(service.status)
    ).length;

    let recurringReceived = 0;
    let avulsoReceived = 0;
    const recurringDates = [];

    cards.forEach((card) => {
      const recurring = paymentTotal(card, 'RECORRENTE');
      const avulso = paymentTotal(card, 'AVULSO');
      recurringReceived += recurring.total;
      avulsoReceived += avulso.total;
      recurringDates.push(...recurring.dates);
    });

    const months = selectedPeriodMonths(periodBounds(), recurringDates);
    const average = months ? recurringReceived / months : 0;
    const format = (value) =>
      Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const values = [
      cards.length,
      activeServices,
      recurringActive,
      format(average),
      format(recurringReceived),
      format(avulsoReceived),
      format(recurringReceived + avulsoReceived)
    ];

    [...box.querySelectorAll('.ym-kpi')].forEach((card, index) => {
      setText(card.querySelector('b'), values[index]);
    });

    const firstLabel = box.querySelector('.ym-kpi span');
    const clientStatus = document.getElementById('clientStatus')?.value;
    setText(firstLabel, clientStatus === 'ATIVO' ? 'Clientes ativos' : 'Clientes visíveis');
  }

  function applyBigFilter() {
    if (!clientsMode()) return;
    const tools = window.YMClientFilters;
    if (!tools) return;

    ensureStyles();
    const baseCards = tools.visibleCards || [];
    const filteredCards = baseCards.filter((card) => cardMatches(card, activeBigFilter));

    baseCards.forEach((card) => {
      card.style.display = filteredCards.includes(card) ? '' : 'none';
    });

    recalculate(filteredCards);
    bindCards();

    const meta = document.getElementById('resultMeta');
    if (meta && activeBigFilter) {
      meta.textContent = `${filteredCards.length} cliente(s) no filtro do Big Number · clique novamente no mesmo indicador para limpar`;
    }
  }

  function bindCards() {
    if (!clientsMode()) return;
    const box = document.querySelector('.ym-grid.ym-kpis');
    if (!box) return;

    const keys = [
      'CLIENTS',
      'ACTIVE',
      'REC',
      'REC_AVG',
      'REC_PAID',
      'AVULSO_PAID',
      'TOTAL_PAID'
    ];

    [...box.querySelectorAll('.ym-kpi')].forEach((card, index) => {
      const key = keys[index];
      if (!key) return;
      card.classList.add('kpi-clickable');
      card.classList.toggle('kpi-active-filter', activeBigFilter === key);
      card.onclick = () => {
        activeBigFilter = activeBigFilter === key ? null : key;
        applyBigFilter();
      };
    });
  }

  document.addEventListener('ym-client-filtered', applyBigFilter);
  document.addEventListener('change', (event) => {
    if (['financialPeriod', 'periodStart', 'periodEnd'].includes(event.target?.id)) {
      setTimeout(applyBigFilter, 60);
    }
  });

  setInterval(() => {
    if (clientsMode()) {
      bindCards();
      applyBigFilter();
    }
  }, 1000);
})();

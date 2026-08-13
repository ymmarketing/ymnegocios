
(() => {
  const activeServiceStatuses = new Set(['CONTRATADO', 'EM_EXECUCAO']);
  const expandedClients = new Set();
  let scheduled = false;

  function isClientsTab() {
    return document.getElementById('activeClientsTab')?.classList.contains('on');
  }

  function getClientId(card) {
    const editButton = [...card.querySelectorAll('button')].find((button) =>
      (button.getAttribute('onclick') || '').includes('CRMClients.openClient')
    );
    const match = (editButton?.getAttribute('onclick') || '').match(/openClient\('([^']+)'\)/);
    return match?.[1] || '';
  }

  function getServices(card) {
    return [...card.querySelectorAll('.service-row')].map((row) => {
      const meta = (row.querySelector('.ym-meta')?.textContent || '')
        .split('·')
        .map((item) => item.trim());
      return {
        row,
        name: (row.querySelector('.service-top b')?.textContent || '').trim(),
        type: meta[0] || '',
        status: meta[1] || ''
      };
    });
  }

  function parseMoney(text) {
    const match = String(text || '').match(/R\$\s*([\d.]+,\d{2})/);
    if (!match) return 0;
    return Number(match[1].replace(/\./g, '').replace(',', '.')) || 0;
  }

  function totalPaid(card) {
    return getServices(card).reduce((total, service) => {
      const paidStat = [...service.row.querySelectorAll('.service-stat')].find((stat) =>
        /Pago/i.test(stat.querySelector('small')?.textContent || '')
      );
      return total + parseMoney(paidStat?.textContent);
    }, 0);
  }

  function monthlyValue(card) {
    return getServices(card).reduce((total, service) => {
      const monthlyStat = [...service.row.querySelectorAll('.service-stat')].find((stat) =>
        /Mensal/i.test(stat.querySelector('small')?.textContent || '')
      );
      return total + parseMoney(monthlyStat?.textContent);
    }, 0);
  }

  function clientDate(card) {
    const cell = [...card.querySelectorAll('.client-cell')].find((item) =>
      /Cliente desde/i.test(item.textContent || '')
    );
    const match = (cell?.textContent || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
  }

  function ensureStyles() {
    if (document.getElementById('clientInteractionStyles')) return;
    const style = document.createElement('style');
    style.id = 'clientInteractionStyles';
    style.textContent = `
      #clientExtraFilters {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 9px;
        margin: -3px 0 12px;
      }
      .client-view-btn {
        border: 1px solid #D7E2EE;
        background: #fff;
        color: #0A2540;
        border-radius: 9px;
        padding: 7px 11px;
        font-size: 9px;
        font-weight: 800;
        cursor: pointer;
      }
      .client-body[data-collapsed="1"] { display: none !important; }
      @media (max-width: 900px) {
        #clientExtraFilters { grid-template-columns: 1fr; }
      }
    `;
    document.head.append(style);
  }

  function ensureFilters() {
    if (!isClientsTab()) return;
    if (document.getElementById('clientExtraFilters')) return;
    const base = document.getElementById('clientControls');
    if (!base) return;

    const filters = document.createElement('div');
    filters.id = 'clientExtraFilters';
    filters.innerHTML = `
      <select id="clientServiceFilter" class="ym-select">
        <option value="">Todos os serviços</option>
      </select>
      <select id="clientServiceStatusFilter" class="ym-select">
        <option value="">Todos os status de serviço</option>
        <option value="ACTIVE">Somente serviços ativos</option>
        <option value="CONTRATADO">Contratado</option>
        <option value="EM_EXECUCAO">Em execução</option>
        <option value="CONCLUIDO">Concluído</option>
        <option value="PAUSADO">Pausado</option>
        <option value="CANCELADO">Cancelado</option>
      </select>
      <select id="clientOrderFilter" class="ym-select">
        <option value="AZ">Nome A → Z</option>
        <option value="ZA">Nome Z → A</option>
        <option value="PAID_DESC">Maior valor recebido</option>
        <option value="PAID_ASC">Menor valor recebido</option>
        <option value="MONTHLY_DESC">Maior valor mensal</option>
        <option value="MONTHLY_ASC">Menor valor mensal</option>
        <option value="DATE_DESC">Cliente mais recente</option>
        <option value="DATE_ASC">Cliente mais antigo</option>
      </select>
    `;
    base.after(filters);
    filters.querySelectorAll('select').forEach((select) => {
      select.addEventListener('change', scheduleApply);
    });
  }

  function populateServiceOptions() {
    const select = document.getElementById('clientServiceFilter');
    if (!select) return;
    const current = select.value;
    const names = [...new Set(
      [...document.querySelectorAll('.client-card .service-top b')]
        .map((item) => item.textContent.trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'pt-BR'));

    select.innerHTML = '<option value="">Todos os serviços</option>' +
      names.map((name) => `<option value="${name}">${name}</option>`).join('');
    if (names.includes(current)) select.value = current;
  }

  function enhanceCards() {
    document.querySelectorAll('.client-card').forEach((card) => {
      if (card.dataset.foldReady === '1') return;
      const clientId = getClientId(card);
      const body = card.querySelector('.client-body');
      const head = card.querySelector('.client-head');
      if (!clientId || !body || !head) return;

      card.dataset.foldReady = '1';
      if (!expandedClients.has(clientId)) body.dataset.collapsed = '1';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'client-view-btn';
      button.textContent = expandedClients.has(clientId) ? 'Recolher' : 'Ver';
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        if (expandedClients.has(clientId)) {
          expandedClients.delete(clientId);
          body.dataset.collapsed = '1';
          button.textContent = 'Ver';
        } else {
          expandedClients.add(clientId);
          delete body.dataset.collapsed;
          button.textContent = 'Recolher';
        }
      });
      head.append(button);
    });
  }

  function sortCards(cards) {
    const sort = document.getElementById('clientOrderFilter')?.value || 'AZ';
    const name = (card) => (
      card.querySelector('.client-title')?.textContent ||
      card.querySelector('.client-name-main b')?.textContent || ''
    ).trim().toLowerCase();

    cards.sort((a, b) => {
      if (sort === 'AZ') return name(a).localeCompare(name(b), 'pt-BR');
      if (sort === 'ZA') return name(b).localeCompare(name(a), 'pt-BR');
      if (sort === 'PAID_DESC') return totalPaid(b) - totalPaid(a);
      if (sort === 'PAID_ASC') return totalPaid(a) - totalPaid(b);
      if (sort === 'MONTHLY_DESC') return monthlyValue(b) - monthlyValue(a);
      if (sort === 'MONTHLY_ASC') return monthlyValue(a) - monthlyValue(b);
      if (sort === 'DATE_DESC') return clientDate(b).localeCompare(clientDate(a));
      if (sort === 'DATE_ASC') return clientDate(a).localeCompare(clientDate(b));
      return 0;
    });
  }

  function applyFilters() {
    scheduled = false;
    if (!isClientsTab()) return;
    ensureStyles();
    ensureFilters();
    enhanceCards();
    populateServiceOptions();

    const list = document.getElementById('leadList');
    if (!list) return;
    const serviceName = document.getElementById('clientServiceFilter')?.value || '';
    const serviceStatus = document.getElementById('clientServiceStatusFilter')?.value || '';

    let cards = [...list.querySelectorAll('.client-card')];
    cards.forEach((card) => { card.style.display = ''; });

    cards = cards.filter((card) => {
      const services = getServices(card);
      const nameMatch = !serviceName || services.some((service) => service.name === serviceName);
      const statusMatch = !serviceStatus || services.some((service) =>
        serviceStatus === 'ACTIVE'
          ? activeServiceStatuses.has(service.status)
          : service.status === serviceStatus
      );
      return nameMatch && statusMatch;
    });

    [...list.querySelectorAll('.client-card')].forEach((card) => {
      if (!cards.includes(card)) card.style.display = 'none';
    });

    sortCards(cards);
    cards.forEach((card) => list.append(card));

    window.YMClientFilters = {
      visibleCards: cards,
      getServices,
      activeServiceStatuses,
      totalPaid,
      monthlyValue
    };
    document.dispatchEvent(new CustomEvent('ym-client-filtered'));
  }

  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(applyFilters);
  }

  new MutationObserver(scheduleApply).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  setInterval(scheduleApply, 900);
  scheduleApply();
})();

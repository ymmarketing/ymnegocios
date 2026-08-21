(()=>{
  if(!location.pathname.toUpperCase().startsWith('/FINANCEIRO')) return;

  const state={group:'ALL',query:''};
  const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const num=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:1});
  const pct=v=>(Number(v||0)*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
  const parseMoney=t=>{
    const s=String(t||'').replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.');
    return Number(s)||0;
  };
  const parseHours=t=>{
    const s=String(t||'').replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.');
    return Number(s)||0;
  };
  const parsePct=t=>{
    const s=String(t||'').replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.');
    return (Number(s)||0)/100;
  };
  const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const groupOf=name=>{
    const n=normalize(name);
    if(n.includes('FUNDACAO')) return 'FUNDACOES';
    if(n.includes('SOCIAL MEDIA')) return 'SOCIAL_MEDIA';
    if(n.includes('RAIO-X')||n.includes('RAIO X')||n.includes('RAIOX')) return 'ENTRADA';
    return 'AVULSOS';
  };
  const style=()=>{
    if(document.getElementById('ymFinProductFilterStyles')) return;
    const s=document.createElement('style');
    s.id='ymFinProductFilterStyles';
    s.textContent=`
      .ym-fin-product-tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 11px;padding:10px 11px;background:#F7FAFD;border:1px solid #DFE7EE;border-radius:12px}
      .ym-fin-product-tools label{font:700 8px Montserrat;color:#657B8F;text-transform:uppercase;letter-spacing:.04em}
      .ym-fin-product-tools select,.ym-fin-product-tools input{margin-left:6px;border:1px solid #D5E0E8;border-radius:9px;background:#fff;color:#0A2540;padding:8px 10px;font:600 9.5px Inter;outline:none}
      .ym-fin-product-tools select{min-width:175px}.ym-fin-product-tools input{min-width:210px}
      .ym-fin-product-count{margin-left:auto;font:700 8.5px Montserrat;color:#536B7E;background:#EAF0F7;border-radius:999px;padding:6px 9px;white-space:nowrap}
      .ym-fin-summary-row td{background:#F3F6FA!important;border-top:1px solid #D6E0E9!important;font-weight:700!important;color:#0A2540!important}
      .ym-fin-summary-row.avg td{background:#EEF0FF!important;color:#343A87!important}
      .ym-fin-summary-row td:first-child{font:800 8.5px Montserrat!important;text-transform:uppercase;letter-spacing:.03em}
      @media(max-width:620px){.ym-fin-product-tools{align-items:stretch}.ym-fin-product-tools label{display:grid;gap:4px;flex:1 1 100%}.ym-fin-product-tools select,.ym-fin-product-tools input{margin-left:0;min-width:0;width:100%;box-sizing:border-box}.ym-fin-product-count{margin-left:0}}
    `;
    document.head.append(s);
  };

  function findSection(){
    return [...document.querySelectorAll('.section')].find(sec=>normalize(sec.querySelector('h2')?.textContent)==='ECONOMIA POR PRODUTO');
  }

  function dataRows(table){
    return [...(table?.tBodies?.[0]?.rows||[])].filter(r=>!r.dataset.finSummary);
  }

  function apply(section){
    const table=section.querySelector('table.table');
    if(!table) return;
    const rows=dataRows(table);
    const q=normalize(state.query.trim());
    let visible=[];
    rows.forEach(row=>{
      const name=row.cells[0]?.textContent?.trim()||'';
      const group=groupOf(name);
      const show=(state.group==='ALL'||state.group===group)&&(!q||normalize(name).includes(q));
      row.style.display=show?'':'none';
      if(show) visible.push(row);
    });

    table.querySelectorAll('tr[data-fin-summary="1"]').forEach(r=>r.remove());
    const body=table.tBodies[0];
    const count=visible.length;
    const sums={price:0,hours:0,cost:0,contrib:0,perHour:0,margin:0};
    visible.forEach(r=>{
      sums.price+=parseMoney(r.cells[1]?.textContent);
      sums.hours+=parseHours(r.cells[2]?.textContent);
      sums.cost+=parseMoney(r.cells[3]?.textContent);
      sums.contrib+=parseMoney(r.cells[4]?.textContent);
      sums.perHour+=parseMoney(r.cells[5]?.textContent);
      sums.margin+=parsePct(r.cells[6]?.textContent);
    });
    const avg=k=>count?sums[k]/count:0;
    const total=document.createElement('tr');
    total.dataset.finSummary='1';total.className='ym-fin-summary-row';
    total.innerHTML=`<td><strong>Total do filtro</strong></td><td class="money"><strong>${money(sums.price)}</strong></td><td class="money">${num(sums.hours)}h</td><td class="money">${money(sums.cost)}</td><td class="money"><strong>${money(sums.contrib)}</strong></td><td class="money">—</td><td class="money">—</td><td colspan="2">${count} produto${count===1?'':'s'}</td>`;
    const mean=document.createElement('tr');
    mean.dataset.finSummary='1';mean.className='ym-fin-summary-row avg';
    mean.innerHTML=`<td><strong>Média / ticket médio</strong></td><td class="money"><strong>${money(avg('price'))}</strong></td><td class="money">${num(avg('hours'))}h</td><td class="money">${money(avg('cost'))}</td><td class="money"><strong>${money(avg('contrib'))}</strong></td><td class="money">${money(avg('perHour'))}</td><td class="money">${pct(avg('margin'))}</td><td colspan="2">Média dos itens exibidos</td>`;
    body.append(total,mean);
    const badge=section.querySelector('[data-fin-product-count]');
    if(badge) badge.textContent=count+' de '+rows.length+' produtos';
  }

  function ensure(){
    style();
    const section=findSection();
    if(!section) return;
    const body=section.querySelector('.section-body');
    if(!body) return;
    if(!body.querySelector('[data-fin-product-tools]')){
      const tools=document.createElement('div');
      tools.className='ym-fin-product-tools';
      tools.dataset.finProductTools='1';
      tools.innerHTML=`
        <label>Categoria<select data-fin-product-group>
          <option value="ALL">Todos os produtos</option>
          <option value="FUNDACOES">Fundações</option>
          <option value="AVULSOS">Avulsos</option>
          <option value="SOCIAL_MEDIA">Social Media</option>
          <option value="ENTRADA">Produto de entrada / Raio-X</option>
        </select></label>
        <label>Produto<input data-fin-product-query type="search" placeholder="Buscar pelo nome..."></label>
        <span class="ym-fin-product-count" data-fin-product-count></span>`;
      body.prepend(tools);
      const sel=tools.querySelector('[data-fin-product-group]');
      const input=tools.querySelector('[data-fin-product-query]');
      sel.value=state.group;input.value=state.query;
      sel.addEventListener('change',()=>{state.group=sel.value;apply(section)});
      input.addEventListener('input',()=>{state.query=input.value;apply(section)});
    }
    apply(section);
  }

  let queued=false;
  const schedule=()=>{
    if(queued) return;queued=true;
    requestAnimationFrame(()=>{queued=false;ensure()});
  };
  const obs=new MutationObserver(schedule);
  obs.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();

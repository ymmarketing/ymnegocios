/**
 * YM Marketing & Negócios — Raio-X em contingência, versão 1.
 * Vincule este arquivo à planilha de contingência (Extensões > Apps Script).
 * Execute instalar() uma vez e use o menu YM Raio-X.
 * Não cobra, não libera o fluxo oficial e não cria score automático.
 */
const RX = {
  versao: 'RX_CONTINGENCIA_1.0',
  abas: {avaliacoes:'Avaliações', respostas:'Respostas', numeros:'Números'},
  semanas: 4
};

const PERGUNTAS = [{"id":"Q01","s":0,"t":"area","q":"Conte pra gente, de forma simples: o que seu negócio faz hoje?","h":"Pode explicar como explicaria para alguém que acabou de conhecer seu trabalho."},{"id":"Q02","s":0,"t":"area","q":"Qual produto ou serviço você mais vende hoje — ou gostaria de vender mais?","h":"Se tiver mais de um, escolha o principal neste momento."},{"id":"Q03","s":0,"t":"radio","q":"Qual é, aproximadamente, o valor desse produto ou serviço?","o":["Até R$ 100","R$ 101 a R$ 300","R$ 301 a R$ 1.000","R$ 1.001 a R$ 3.000","R$ 3.001 a R$ 10.000","Acima de R$ 10.000","Varia muito","Prefiro informar o valor"],"c":"Se quiser, conte como seus preços funcionam, se existem diferentes serviços, planos ou condições."},{"id":"Q04","s":0,"t":"area","q":"Quem normalmente compra de você?","h":"Descreva brevemente quem costuma procurar ou contratar seu trabalho."},{"id":"Q05","s":0,"t":"area","q":"O que essa pessoa normalmente quer resolver, conseguir ou melhorar quando procura você?"},{"id":"Q06","s":1,"t":"multi","q":"Hoje, por onde as pessoas normalmente conhecem ou encontram seu negócio?","o":["Indicação","Instagram","LinkedIn","Google","Site","WhatsApp","Eventos / presencial","Anúncios","Prospecção ativa","Parceiros","Marketplace / plataforma","Outro"],"c":"Tem alguma particularidade sobre como essas pessoas chegam até você? Conte aqui.","main":true},{"id":"Q07","s":1,"t":"area","q":"Quando alguém encontra você pela primeira vez, o que normalmente acontece depois?","h":"Ex.: segue o perfil, olha o site, chama no WhatsApp, pede informação, agenda, pede proposta ou não faz nada naquele momento."},{"id":"Q08","s":2,"t":"area","q":"Conte, de forma simples, o caminho mais comum de um cliente desde o primeiro contato até a compra.","h":"Não precisa usar termos técnicos. Ex.: “Chega pelo Instagram → chama no WhatsApp → explico o serviço → mando os valores → agenda.”"},{"id":"Q09","s":2,"t":"area","q":"O que normalmente a pessoa pergunta ou precisa saber antes de decidir comprar?"},{"id":"Q10","s":2,"t":"multi","q":"Como você apresenta seus serviços e valores hoje?","o":["Explico pelo WhatsApp","Envio um texto pronto","Envio catálogo","Envio PDF ou apresentação","Envio proposta personalizada","A pessoa vê no site","A pessoa vê nas redes sociais","Faço reunião ou conversa antes","O valor só é informado depois de entender a necessidade","Outro"],"c":"Se quiser, explique rapidamente como isso acontece na prática."},{"id":"Q11","s":2,"t":"radio","q":"Quando alguém demonstra interesse, mas não compra naquele momento, o que acontece depois?","o":["Entro em contato novamente","Tenho uma rotina definida de acompanhamento","Às vezes lembro e chamo","Espero a pessoa voltar","Normalmente não faço novo contato","Depende muito do caso","Não sei dizer"],"c":"Se isso varia dependendo do cliente ou da situação, conte como normalmente acontece."},{"id":"Q12","s":2,"t":"area","q":"Em quais momentos você percebe que pessoas interessadas deixam de avançar?","h":"Conte situações que acontecem com alguma frequência. Ex.: somem depois do preço, pedem informação e não respondem, recebem proposta e não retornam, chegam ao WhatsApp mas não agendam — ou você ainda não consegue identificar."},{"id":"Q13","s":3,"t":"multi","q":"Quais destes recursos seu negócio já possui hoje?","o":["Instagram","LinkedIn","Site","Google Perfil da Empresa","WhatsApp Business","Catálogo","Portfólio","Apresentação comercial","Página de vendas","Depoimentos de clientes","Avaliações no Google","Cases ou resultados de clientes","CRM ou controle de clientes","Lista de contatos","Automação","Anúncios","Identidade visual","Materiais comerciais","Nenhum desses","Outros"],"c":"Existe algo que você já construiu e não apareceu na lista? Ou algum desses recursos merece contexto? Conte aqui."},{"id":"Q14","s":3,"t":"area","q":"Por que você acredita que seus clientes escolhem você?","h":"Pode contar algo que eles costumam elogiar, comentar ou mencionar depois de contratar."},{"id":"Q15","s":4,"t":"radio","q":"Hoje, quem participa da operação do negócio?","o":["Faço praticamente tudo sozinho(a)","Tenho uma pessoa me apoiando","Tenho uma pequena equipe","Trabalho com parceiros ou freelancers","Tenho equipe estruturada","Outro formato"],"c":"Se quiser, conte brevemente quem faz o quê no negócio."},{"id":"Q16","s":4,"t":"radio","q":"Se o número de novos clientes dobrasse no próximo mês, o que provavelmente aconteceria?","o":["Conseguiria atender normalmente","Conseguiria, mas com bastante esforço","Precisaria reorganizar algumas coisas","Não conseguiria atender","Não sei"],"c":"Se quiser, explique o que ficaria mais difícil ou o que precisaria mudar."},{"id":"Q17","s":5,"t":"area","q":"O que você já tentou fazer para melhorar suas vendas, divulgação ou organização do negócio?","h":"Conte o que tentou e, principalmente, o que aconteceu depois."},{"id":"Q18","s":5,"t":"area","q":"Pensando nos próximos 90 dias, o que você mais gostaria que estivesse diferente no seu negócio?"}];

function onOpen() {
  SpreadsheetApp.getUi().createMenu('YM Raio-X')
    .addItem('Nova avaliação', 'novaAvaliacao')
    .addItem('Ver resumo da linha selecionada', 'resumoDaLinha')
    .addSeparator()
    .addItem('Preparar planilha', 'instalar')
    .addToUi();
}

function instalar() {
  const ss = SpreadsheetApp.getActive();
  if(!ss) throw new Error('Execute instalar pela planilha vinculada.');
  PropertiesService.getScriptProperties().setProperty('YM_SHEET_ID',ss.getId());
  const modelos = [
    [RX.abas.avaliacoes, ['ID','Data','Empresa','Responsável','E-mail','WhatsApp','Etapa','Perguntas respondidas','Principal canal','Faturamento atual','Faturamento cenário','Custo operacional atual','Custo cenário','Observações']],
    [RX.abas.respostas, ['ID da avaliação','Código','Pergunta oficial','Resposta','Contexto complementar','Data']],
    [RX.abas.numeros, ['ID','Faturamento/mês','Contatos','Novos clientes','Ticket médio','Vendas extras simuladas','Marketing atual/mês','Atribuição','Aquisição/mês','Margem bruta %','Receita mensal/cliente','Meses de retenção','Investimento novo','Tarefas/semana','Minutos/tarefa','Custo/hora tarefa','Retrabalhos/semana','Minutos/retrabalho','Custo/hora retrabalho','Gasto direto retrabalho','Redução simulada %','Horas tarefa/mês','Horas retrabalho/mês','Custo tarefa/mês','Custo retrabalho/mês','Custo operacional/mês','Custo após redução','Receita extra simulada','Faturamento cenário','CAC aproximado','LTV bruto de margem','ROI cenário','Lacunas']]
  ];
  modelos.forEach(([nome, headers]) => {
    const sh = ss.getSheetByName(nome) || ss.insertSheet(nome);
    sh.getRange(1,1,1,headers.length).setValues([headers]);
    sh.getRange(1,1,1,headers.length).setBackground('#0B1533').setFontColor('#FFFFFF').setFontWeight('bold').setWrap(true);
    sh.setFrozenRows(1);
    sh.setRowHeight(1, 44);
    sh.setColumnWidth(1, 170);
    sh.setColumnWidths(2, Math.max(1,headers.length-1), 150);
    if(nome===RX.abas.respostas) sh.setColumnWidth(3, 420);
    if(nome===RX.abas.avaliacoes) sh.setColumnWidth(3, 230);
    if(!sh.getFilter()) sh.getRange(1,1,Math.max(2,sh.getLastRow()),headers.length).createFilter();
  });
  ss.toast('Planilha pronta. Abra YM Raio-X → Nova avaliação.', 'YM', 6);
}

function novaAvaliacao() {
  instalar();
  const t = HtmlService.createTemplateFromFile('Formulario');
  t.perguntas = PERGUNTAS;
  SpreadsheetApp.getUi().showSidebar(t.evaluate().setTitle('Raio-X YM · contingência').setWidth(430));
}

function doGet() {
  const t=HtmlService.createTemplateFromFile('Formulario');
  t.perguntas=PERGUNTAS;
  return t.evaluate().setTitle('Raio-X YM · contingência');
}
function planilha_() {
  const id=PropertiesService.getScriptProperties().getProperty('YM_SHEET_ID');
  if(!id) throw new Error('Execute instalar na planilha antes de usar o formulário.');
  return SpreadsheetApp.openById(id);
}

function campoSeguro(valor, max) {
  const s = String(valor == null ? '' : valor).trim().slice(0,max||5000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function n(v) {
  if(v === '' || v === null || v === undefined) return null;
  const x = Number(String(v).replace(',','.'));
  return Number.isFinite(x) && x >= 0 ? x : null;
}
function arred(x) { return Math.round(x*100)/100; }
function val(x) { return x === null ? '' : arred(x); }
function conhecido(...a) { return a.every(x => x !== null); }
function calcular(d) {
  const chaves = ['revenue','leads','customers','ticket','extra','marketing','acquisition','margin','monthlyCustomer','months','newInvestment','manualCount','manualMinutes','manualHour','reworkCount','reworkMinutes','reworkHour','reworkDirect','reduction'];
  const x = {}; chaves.forEach(k => x[k] = n(d[k]));
  if(x.customers !== null && x.leads !== null && x.customers > x.leads) throw new Error('Clientes não podem superar os contatos do mesmo grupo.');
  if(x.margin !== null && x.margin > 100) throw new Error('A margem deve ficar entre 0 e 100%.');
  if(x.reduction !== null && x.reduction > 100) throw new Error('A redução deve ficar entre 0 e 100%.');
  const horasManual = conhecido(x.manualCount,x.manualMinutes) ? x.manualCount*x.manualMinutes*RX.semanas/60 : null;
  const horasRetrabalho = conhecido(x.reworkCount,x.reworkMinutes) ? x.reworkCount*x.reworkMinutes*RX.semanas/60 : null;
  const custoManual = conhecido(horasManual,x.manualHour) ? horasManual*x.manualHour : null;
  const custoRetrabalho = conhecido(horasRetrabalho,x.reworkHour) ? horasRetrabalho*x.reworkHour : null;
  const custos = [custoManual,custoRetrabalho,x.reworkDirect].filter(v => v !== null);
  const custo = custos.length ? custos.reduce((a,b) => a+b,0) : null;
  const custoDepois = conhecido(custo,x.reduction) ? custo*(1-x.reduction/100) : null;
  const receitaExtra = conhecido(x.extra,x.ticket) ? x.extra*x.ticket : null;
  const faturamentoDepois = conhecido(x.revenue,receitaExtra) ? x.revenue+receitaExtra : null;
  const cac = conhecido(x.acquisition,x.customers) && x.customers>0 ? x.acquisition/x.customers : null;
  const ltv = conhecido(x.monthlyCustomer,x.margin,x.months) ? x.monthlyCustomer*(x.margin/100)*x.months : null;
  const roi = conhecido(receitaExtra,x.margin,x.newInvestment) && x.newInvestment>0
    ? ((receitaExtra*x.margin/100)-x.newInvestment)/x.newInvestment*100 : null;
  const lacunas = [];
  if(x.revenue===null) lacunas.push('faturamento');
  if(x.leads===null||x.customers===null) lacunas.push('contatos e clientes do mesmo grupo');
  if(x.acquisition===null) lacunas.push('gasto de aquisição para CAC');
  if(x.margin===null) lacunas.push('margem bruta');
  if(x.monthlyCustomer===null||x.months===null) lacunas.push('receita por cliente e retenção para LTV');
  if(custo===null) lacunas.push('custo operacional');
  const parcial = (horasManual!==null&&custoManual===null)||(horasRetrabalho!==null&&custoRetrabalho===null);
  if(parcial) lacunas.push('custo por hora de tarefas medidas — total operacional parcial');
  return {x,horasManual,horasRetrabalho,custoManual,custoRetrabalho,custo,custoDepois,receitaExtra,faturamentoDepois,cac,ltv,roi,lacunas,parcial};
}

function registrar(payload) {
  const ss=planilha_();
  const empresa=campoSeguro(payload.empresa,220), nome=campoSeguro(payload.nome,180);
  const whatsapp=String(payload.whatsapp||'').replace(/\D/g,'');
  if(!empresa || !nome || whatsapp.length<10 || whatsapp.length>13) throw new Error('Informe empresa, responsável e WhatsApp com DDD.');
  const email=campoSeguro(payload.email,180);
  if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Confira o e-mail informado.');
  const calculo=calcular(payload.numeros||{});
  const respostas=payload.respostas||{}, complementos=payload.complementos||{};
  const preenchidas=PERGUNTAS.filter(q => {
    const a=respostas[q.id];
    return Array.isArray(a) ? a.length>0 : !!String(a||'').trim();
  }).length;
  const id='RX-C-'+Utilities.getUuid().slice(0,8).toUpperCase();
  const agora=new Date(), canal=campoSeguro(payload.canalPrincipal,160);
  const status=preenchidas===PERGUNTAS.length?'PRONTO PARA REVISÃO':'COLETA PARCIAL';
  const nota=campoSeguro(payload.observacoes,5000);
  const lock=LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    ss.getSheetByName(RX.abas.avaliacoes).appendRow([id,agora,empresa,nome,email,whatsapp,status,preenchidas,canal,val(calculo.x.revenue),val(calculo.faturamentoDepois),val(calculo.custo),val(calculo.custoDepois),nota]);
    const rows=PERGUNTAS.map(q => [id,q.id,q.q,campoSeguro(Array.isArray(respostas[q.id])?respostas[q.id].join(' | '):respostas[q.id],5000),campoSeguro(complementos[q.id],5000),agora]);
    ss.getSheetByName(RX.abas.respostas).getRange(ss.getSheetByName(RX.abas.respostas).getLastRow()+1,1,rows.length,6).setValues(rows);
    const x=calculo.x, c=calculo;
    ss.getSheetByName(RX.abas.numeros).appendRow([id,val(x.revenue),val(x.leads),val(x.customers),val(x.ticket),val(x.extra),val(x.marketing),campoSeguro((payload.numeros||{}).attribution,50),val(x.acquisition),val(x.margin),val(x.monthlyCustomer),val(x.months),val(x.newInvestment),val(x.manualCount),val(x.manualMinutes),val(x.manualHour),val(x.reworkCount),val(x.reworkMinutes),val(x.reworkHour),val(x.reworkDirect),val(x.reduction),val(c.horasManual),val(c.horasRetrabalho),val(c.custoManual),val(c.custoRetrabalho),val(c.custo),val(c.custoDepois),val(c.receitaExtra),val(c.faturamentoDepois),val(c.cac),val(c.ltv),val(c.roi),c.lacunas.join('; ')]);
  } finally { lock.releaseLock(); }
  return {id,status,preenchidas,html:resumoHtml(id,empresa,calculo,nota)};
}

function moeda(x) { return x===null?'Dado a medir':Number(x).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function percentual(x) { return x===null?'Dado a medir':Number(x).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%'; }
function html(s) { return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function resumoHtml(id,empresa,c,nota) {
  const x=c.x, div=(a,b)=>a!==null&&b>0?a/b*100:null;
  const rows=[
    ['Faturamento mensal · hoje → cenário',moeda(x.revenue)+' → '+moeda(c.faturamentoDepois),c.receitaExtra===null?'Faltam venda extra e ticket.':`${x.extra} vendas extras × ${moeda(x.ticket)} = ${moeda(c.receitaExtra)} em receita bruta; variação ${percentual(div(c.receitaExtra,x.revenue))}.`],
    ['Custo operacional · hoje → cenário',moeda(c.custo)+' → '+moeda(c.custoDepois),c.custoDepois===null?'Informe custos medidos e percentual de redução.':`Redução hipotética de ${moeda(c.custo-c.custoDepois)}/mês. Em relação ao mesmo faturamento: ${percentual(div(c.custo,x.revenue))} → ${percentual(div(c.custoDepois,x.revenue))}; ${div(c.custo-c.custoDepois,x.revenue)===null?'pontos percentuais indisponíveis':(div(c.custo-c.custoDepois,x.revenue)).toFixed(2).replace('.',',')+' p.p.'}.`],
    ['Horas de tarefa e retrabalho',`${c.horasManual===null?'—':arred(c.horasManual)} h + ${c.horasRetrabalho===null?'—':arred(c.horasRetrabalho)} h/mês`,'Cada tarefa: vezes/semana × minutos × 4 ÷ 60. Não repetir a mesma tarefa nas duas categorias.'],
    ['CAC aproximado',moeda(c.cac),'Gasto de aquisição do mesmo período ÷ novos clientes atribuíveis. Sem origem confiável, é apenas aproximação.'],
    ['LTV de margem',moeda(c.ltv),'Receita média mensal por cliente × margem bruta × meses de permanência. Não é faturamento total.'],
    ['ROI do cenário',percentual(c.roi),'(Margem bruta das vendas extras simuladas − novo investimento) ÷ novo investimento. Hipótese, não retorno observado.'],
    ['Marketing atual',moeda(x.marketing),'Gasto informado à parte. Sem atribuição de vendas não é perda comprovada.']
  ];
  return `<style>body{font:15px Arial,sans-serif;color:#0B1533;line-height:1.5;margin:22px}h1{font-size:23px}h2{font-size:16px;margin:24px 0 7px}.k{font-size:11px;text-transform:uppercase;color:#484DCF;font-weight:700}.box{border:1px solid #DDE4F2;border-radius:12px;padding:12px 15px;margin:9px 0;break-inside:avoid}.box strong{display:block;font-size:19px}.box p{font-size:12px;color:#566579;margin:4px 0}.alert{background:#FFF7EA;padding:13px;border-radius:10px}.muted{color:#566579;font-size:12px}button{background:#FF7A00;color:white;border:0;border-radius:10px;padding:12px 18px;font-weight:700}@media print{button{display:none}}</style><div class="k">YM · leitura de contingência · ${html(id)}</div><h1>${html(empresa)}</h1><p class="muted">Simulação para orientar a conversa. Confirme fontes e premissas antes de apresentar qualquer ganho como resultado.</p>${rows.map(r=>`<div class="box"><div class="k">${html(r[0])}</div><strong>${html(r[1])}</strong><p>${html(r[2])}</p></div>`).join('')}<h2>Dados a confirmar</h2><p class="alert">${html(c.lacunas.length?c.lacunas.join(' · '):'Premissas preenchidas; conferir fontes, período e qualidade dos dados.')}</p>${nota?'<h2>Observação da conversa</h2><p>'+html(nota)+'</p>':''}<p class="muted">A redução de custos não eleva o faturamento. Receita extra não é lucro. Este resumo não substitui o relatório oficial do Raio-X Digital.</p><button onclick="window.print()">Imprimir / salvar PDF</button>`;
}

function resumoDaLinha() {
  const sh=SpreadsheetApp.getActiveSheet();
  if(sh.getName()!==RX.abas.avaliacoes) return SpreadsheetApp.getUi().alert('Selecione uma linha na aba Avaliações.');
  const row=sh.getActiveCell().getRow();
  if(row<2) return SpreadsheetApp.getUi().alert('Selecione uma avaliação.');
  const id=sh.getRange(row,1).getValue();
  const nums=SpreadsheetApp.getActive().getSheetByName(RX.abas.numeros).getDataRange().getValues().find(r=>r[0]===id);
  if(!nums) return SpreadsheetApp.getUi().alert('Os números desta avaliação não foram encontrados.');
  const keys=['revenue','leads','customers','ticket','extra','marketing','attribution','acquisition','margin','monthlyCustomer','months','newInvestment','manualCount','manualMinutes','manualHour','reworkCount','reworkMinutes','reworkHour','reworkDirect','reduction'];
  const d={};keys.forEach((k,i)=>d[k]=nums[i+1]);
  const data=sh.getRange(row,1,1,14).getValues()[0];
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(resumoHtml(id,data[2],calcular(d),data[13])).setWidth(780).setHeight(650),'Resumo · '+id);
}

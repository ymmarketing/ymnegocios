/* YM Raio-X Digital 2.0 — paginação de UX
 * Não altera, remove ou reescreve perguntas. Apenas organiza os campos já existentes
 * em etapas de tela para reduzir a sensação de 28 avanços consecutivos.
 * RXD01/RXD02 são identificação; RXD03–RXD30 são as 28 perguntas diagnósticas.
 */
(function(root){
  'use strict';
  if(!root.RX_DIGITAL_V2) throw new Error('RX_DIGITAL_V2_ausente');

  var PAGES=[
    {id:'IDENTIFICACAO',stage:'Identificação',title:'Para começar',question_ids:['RXD01','RXD02']},
    {id:'BASE_CONTEXTO',stage:'Base do negócio',title:'Contexto do negócio',question_ids:['RXD03','RXD04']},
    {id:'BASE_OFERTA',stage:'Base do negócio',title:'Oferta e público',question_ids:['RXD05','RXD06']},

    {id:'DIGITAL_CANAIS',stage:'Presença digital',title:'Canais que você usa',question_ids:['RXD07']},
    {id:'DIGITAL_PAPEL',stage:'Presença digital',title:'Papel dos canais',question_ids:['RXD08','RXD09']},
    {id:'DIGITAL_CLAREZA',stage:'Presença digital',title:'Clareza e estrutura',question_ids:['RXD10','RXD11']},
    {id:'DIGITAL_ENCONTRAR',stage:'Presença digital',title:'Encontrabilidade e coerência',question_ids:['RXD12','RXD13']},
    {id:'DIGITAL_ACAO',stage:'Presença digital',title:'Próximo passo e presença',question_ids:['RXD14','RXD15']},

    {id:'CONTEUDO_AUTORIDADE',stage:'Conteúdo, autoridade e confiança',title:'Conteúdo e autoridade',question_ids:['RXD16','RXD17']},
    {id:'CONTEUDO_PROVA',stage:'Conteúdo, autoridade e confiança',title:'Provas no digital',question_ids:['RXD18','RXD19']},
    {id:'CONTEUDO_VALOR',stage:'Conteúdo, autoridade e confiança',title:'Conteúdo que conduz e comunica valor',question_ids:['RXD20','RXD21']},

    {id:'CONVERSAO_VENDA',stage:'Conversão, relacionamento e medição',title:'Do interesse à venda',question_ids:['RXD22','RXD23']},
    {id:'CONVERSAO_FOLLOWUP',stage:'Conversão, relacionamento e medição',title:'Follow-up e origem',question_ids:['RXD24','RXD25']},
    {id:'CONVERSAO_MEDICAO',stage:'Conversão, relacionamento e medição',title:'Medição e capacidade',question_ids:['RXD26','RXD27']},

    {id:'CONTEXTO_FORCAS',stage:'Contexto e destino',title:'Forças e desafio atual',question_ids:['RXD28','RXD29']},
    {id:'CONTEXTO_DESTINO',stage:'Contexto e destino',title:'Destino de 90 dias',question_ids:['RXD30']}
  ];

  root.RX_DIGITAL_V2.pages=PAGES;
  root.RX_DIGITAL_V2.diagnostic_question_count=28;
  root.RX_DIGITAL_V2.identification_field_count=2;
  root.RX_DIGITAL_V2.form_page_count=PAGES.length;
})(window);

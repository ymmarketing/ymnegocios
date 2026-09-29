# Glossário de KPIs de marketing | YM

**Edição de 29/09/2026.** Referência de estudo para reunião, diagnóstico e acompanhamento nacional de empresas de serviços. KPI é um indicador ligado a uma decisão ou meta; nem toda métrica disponível no painel é um KPI prioritário. Não existe uma lista universal e fechada: cada plataforma pode contar um evento de modo diferente. Este glossário cobre os indicadores mais úteis para aquisição, conteúdo, site, mídia, vendas e retenção. [1][2][3]

## Comece por aqui

**Na reunião, escolha poucos números:** faturamento e margem; contatos novos e sua origem; quantos viraram clientes; gasto de aquisição; tempo de resposta; uma etapa em que o cliente trava. Só depois aprofunde canal por canal. O Raio-X Digital oficial gera seis notas contextuais e uma média de maturidade de 0 a 10. **Nenhum KPI abaixo entra automaticamente nessa média.** A planilha de contingência calcula apenas os campos efetivamente informados, e seus cenários não são previsão.

**Regra de leitura:** use o mesmo período, a mesma população e o mesmo critério em numerador e denominador. Se faltou dado, registre **não medido**, sem transformá-lo em zero. Separe números observados, estimativas e hipóteses. Quando a conta divide por zero, o resultado é **indisponível**, não infinito. Taxas de etapas diferentes não devem ser somadas. Receita não é lucro; tempo liberado não é dinheiro economizado sem redução real de custo.

**Unidades:** `%` é uma proporção multiplicada por 100; `p.p.` é a diferença entre duas taxas percentuais. Exemplo: conversão de 8% para 10% = +2 p.p., ou +25% de crescimento relativo. `R$` é moeda. Uma razão como ROAS 3,0x significa R$ 3 de receita atribuída por R$ 1 de mídia. “Cliente” e “lead” precisam de definição única no CRM.

## 1. Alcance, marca e redes sociais

| Indicador | O que revela | Cálculo ou registro | Onde olhar e cuidado |
|---|---|---|---|
| Alcance | Pessoas/contas distintas expostas ao conteúdo no período. | Valor único informado pela plataforma. | Insights da rede; alcance não é número de clientes. |
| Impressões | Exibições do conteúdo ou anúncio, inclusive repetidas. | Contagem da plataforma. | Painel da rede/anúncios; não equivale a pessoas únicas. |
| Frequência média | Quantas vezes, em média, cada pessoa alcançada viu o anúncio. | Impressões ÷ alcance. | Plataforma de mídia; médias escondem diferenças individuais. [4] |
| CPM | Custo para mil impressões. | Gasto ÷ impressões × 1.000. | Anúncios; mede compra de exposição, não venda. [5] |
| Interações | Curtidas, comentários, salvamentos, compartilhamentos ou outras ações definidas pela rede. | Soma das ações escolhidas, sem misturar conceitos. | Insights; informe quais ações entraram na soma. |
| Taxa de engajamento | Proporção de pessoas expostas que interagiram segundo uma convenção. | Interações ÷ alcance × 100 **ou** interações ÷ impressões × 100. | Registre o denominador; duas versões não são comparáveis diretamente. |
| Salvamentos e compartilhamentos | Conteúdo guardado ou repassado. | Contagem separada de cada ação. | Insights; sinal de utilidade/circulação, sem provar compra. |
| Crescimento líquido de seguidores | Mudança da base no período. | Seguidores no fim − seguidores no início. | Insights; crescimento pode coexistir com poucas vendas. |
| Visita ao perfil → contato | Capacidade do perfil de iniciar conversas rastreáveis. | Contatos identificados após visita ÷ visitas ao perfil × 100. | Rede + links etiquetados + CRM; sem ligação entre visita e contato, não calcule. |
| Share of voice | Participação da marca nas menções de um conjunto monitorado. | Menções da marca ÷ menções de todas as marcas definidas × 100. | Monitoramento; depende do conjunto e da cobertura escolhidos. |

## 2. Site, experiência e conversão

| Indicador | O que revela | Cálculo ou registro | Onde olhar e cuidado |
|---|---|---|---|
| Usuários | Pessoas ou identidades observadas pelo sistema no período. | Contagem da ferramenta. | GA4; dispositivo, consentimento e identificação afetam a contagem. [2] |
| Sessões | Visitas iniciadas no site/app. | Contagem de sessões. | GA4; uma pessoa pode iniciar várias sessões. [2] |
| Visualizações de página | Carregamentos/visualizações de páginas. | Contagem de eventos de visualização. | GA4; não equivale a visitantes únicos. |
| Sessões engajadas | Visitas com mais de 10 segundos, evento principal ou duas visualizações. | Contagem do GA4. | Definição oficial do GA4; não prova interesse comercial. [2] |
| Taxa de engajamento | Parte das sessões consideradas engajadas. | Sessões engajadas ÷ sessões × 100. | GA4; compare páginas e fontes equivalentes. [2] |
| Taxa de rejeição (GA4) | Parte das sessões **não engajadas**. | 100% − taxa de engajamento. | GA4; não é a antiga definição universal de “sair após uma página”. [2] |
| Tempo médio de engajamento | Tempo em que o conteúdo ficou efetivamente em foco. | Valor calculado pelo GA4. | GA4; não confundir com tempo total entre primeira e última ação. [2] |
| Evento principal | Ação importante configurada, como formulário enviado. | Contagem do evento definido. | GA4; documente qual ação foi marcada. [2] |
| Taxa de sessões com evento principal | Parte das visitas em que houve ao menos um evento principal. | Sessões com o evento ÷ sessões × 100. | GA4; diferente de eventos totais ÷ sessões. [2] |
| Conversão da página | Parte das visitas à página que concluiu a ação desejada. | Sessões ou usuários que concluíram ÷ sessões ou usuários da página × 100. | GA4/formulário; escolha **um** denominador e deduplique. |
| Abandono de formulário | Pessoas que começaram e não enviaram. | Inícios sem envio ÷ inícios × 100. | Eventos de início/envio; instrumentação deve identificar o mesmo fluxo. |
| Clique no WhatsApp | Cliques no botão/link para conversar. | Evento de clique. | GA4/site; clique não confirma mensagem enviada. |
| Taxa de contato efetivo | Cliques no canal que viraram conversa recebida. | Conversas identificadas ÷ cliques rastreados × 100. | Site + WhatsApp/CRM; exige vínculo confiável. |
| LCP | Tempo para aparecer o maior elemento visível principal. | Percentil 75 dos dados reais de usuários. | PageSpeed/Search Console; referência de boa experiência até 2,5 s. [6] |
| INP | Tempo de resposta visual às interações. | Percentil 75 dos dados reais. | PageSpeed/Search Console; boa experiência até 200 ms. [6] |
| CLS | Instabilidade visual da página. | Pontuação das mudanças inesperadas de layout. | PageSpeed/Search Console; bom abaixo de 0,1. [6] |

## 3. Busca orgânica e presença no Google

| Indicador | O que revela | Cálculo ou registro | Onde olhar e cuidado |
|---|---|---|---|
| Impressões orgânicas | Quantas vezes um resultado do site apareceu na Busca. | Contagem do Search Console. | Não significa visita nem pessoa única. [3] |
| Cliques orgânicos | Cliques do resultado de busca para o site. | Contagem do Search Console. | Compare consulta, página, dispositivo e período. [3] |
| CTR orgânico | Parte das aparições que gerou clique. | Cliques ÷ impressões × 100. | Search Console; agregação por site e por página pode divergir. [3] |
| Posição média | Posição média observada para as impressões do recorte. | Cálculo do Search Console. | Não é uma posição fixa garantida para toda pessoa. [3] |
| Sessões de busca orgânica | Visitas classificadas como busca não paga. | Sessões agrupadas por origem/mídia no GA4. | Pode divergir de cliques do Search Console por medição/consentimento. [2][3] |
| Leads orgânicos qualificados | Contatos úteis oriundos de busca orgânica. | Leads elegíveis com origem rastreada. | GA4 + CRM; visitei o site ≠ origem comprovada da venda. |
| Conversão orgânica em lead | Parte das visitas orgânicas que gera contato válido. | Leads rastreados ÷ sessões orgânicas comparáveis × 100. | GA4 + CRM; documente janela e deduplicação. |
| Consultas sem marca | Busca por problema/serviço sem nome da empresa. | Cliques/impressões filtrados por termos sem marca. | Search Console; classificação da lista de termos é operacional. |
| Páginas indexadas válidas | URLs elegíveis efetivamente indexadas. | Contagem no relatório de indexação. | Search Console; mais páginas indexadas não garantem demanda. |
| Ações no Perfil da Empresa | Interações com a ficha: ligação, site, rota ou mensagem disponível. | Contagens separadas da ferramenta. | Perfil da Empresa; só para casos em que essa presença é relevante. [7] |

## 4. Mídia paga e atribuição

| Indicador | O que revela | Cálculo ou registro | Onde olhar e cuidado |
|---|---|---|---|
| Investimento em mídia | Quanto foi gasto com anúncios no período. | Soma do custo das campanhas do recorte. | Plataforma; serviço, criação e operação podem ficar fora. |
| Cliques no anúncio | Interações de clique contadas pela plataforma. | Contagem da campanha. | Nem todo clique vira visita carregada. |
| CTR do anúncio | Parte das impressões que gerou clique. | Cliques ÷ impressões × 100. | Google Ads/LinkedIn; leia junto com intenção e qualidade. [5][8] |
| CPC médio | Custo médio por clique. | Gasto em mídia ÷ cliques cobrados. | Google Ads; não é custo por cliente. [5] |
| Taxa de conversão do anúncio | Conversões atribuídas por interação elegível. | Conversões ÷ interações elegíveis × 100. | Google Ads; múltiplas ações podem elevar a taxa acima de 100%. [5] |
| CPL | Custo por lead captado. | Gasto definido ÷ leads atribuídos. | Plataforma + CRM; “lead” precisa de definição e deduplicação. |
| CPQL | Custo por lead qualificado. | Gasto definido ÷ leads que passaram no critério de qualificação. | CRM; melhor leitura comercial que CPL isolado. |
| CPA | Custo por ação definida, como compra ou agendamento. | Gasto ÷ ações atribuídas. | Diga qual ação; CPA de cadastro ≠ CAC de cliente. |
| Custo por reunião realizada | Gasto de aquisição ÷ reuniões efetivamente realizadas. | Gasto ÷ reuniões comparecidas. | CRM; reuniões marcadas e realizadas são bases diferentes. |
| Parcela de impressões | Aparições recebidas entre as oportunidades estimadas de aparecer. | Impressões obtidas ÷ impressões elegíveis estimadas. | Google Ads; elegibilidade é estimativa da plataforma. [5] |
| Conversão após visualização | Ação atribuída depois de ver, sem clicar, conforme janela da plataforma. | Contagem com configuração de atribuição declarada. | Não some cegamente às conversões por clique. [8] |
| ROAS | Receita **atribuída** para cada real de mídia. | Receita atribuída ÷ gasto em anúncios. | Razão em x; ignora custos e margem fora da mídia. [5] |
| Receita incremental | Receita adicional causada pela campanha além do cenário sem ela. | Diferença validada por experimento ou método causal adequado. | Não iguale automaticamente a receita “atribuída” do painel. |

## 5. E-mail, prospecção e nutrição

| Indicador | O que revela | Cálculo ou registro | Onde olhar e cuidado |
|---|---|---|---|
| E-mails enviados | Tentativas aceitas para envio pela plataforma. | Contagem de enviados. | Não significa chegada à caixa de entrada. [9] |
| E-mails entregues | Mensagens aceitas pelo servidor do destinatário. | Contagem de entregues. | Entrega técnica não prova leitura. [9] |
| Taxa de entrega | Parte dos enviados entregue. | Entregues ÷ enviados × 100. | Informe exclusões e supressões da plataforma. [9] |
| Bounce | Mensagens devolvidas ou rejeitadas. | Contagem/taxa conforme ferramenta. | Separe falha temporária da permanente. [9] |
| Abertura medida | Evento de abertura rastreado pelo provedor. | Aberturas únicas ou taxa definida. | Proteções de privacidade e bloqueios de imagem distorcem o dado; não trate como leitura certa. [9] |
| Taxa de clique no e-mail | Parte dos entregues que clicou em link rastreado. | Pessoas com clique único ÷ entregues × 100. | Deduplique e exclua cliques automáticos quando possível. [9] |
| CTOR | Cliques entre quem teve abertura medida. | Pessoas com clique ÷ pessoas com abertura medida × 100. | Herda imprecisão da abertura. |
| Descadastro | Pessoas que optaram por sair da lista. | Descadastros ÷ entregues × 100. | Diferencie base de marketing de e-mail individual de prospecção. [9] |
| Reclamação | Mensagens marcadas como spam. | Reclamações ÷ entregues × 100. | Observar por campanha e origem da lista. [9] |
| Taxa de resposta | Pessoas que responderam à abordagem. | Respostas humanas ÷ mensagens entregues × 100. | Resposta automática não vale como conversa. |
| Taxa de reunião da prospecção | Reuniões marcadas a partir da abordagem. | Reuniões marcadas ÷ contatos abordados entregues × 100. | Use coorte e prazo de acompanhamento consistentes. |

## 6. CRM, funil e vendas

| Indicador | O que revela | Cálculo ou registro | Onde olhar e cuidado |
|---|---|---|---|
| Lead | Pessoa/empresa que demonstrou interesse ou entrou na prospecção. | Registro único, com origem e data. | Defina regra de duplicidade antes de contar. |
| MQL | Lead que passou um critério **definido pela YM** para conversar sobre solução. | Contagem conforme critérios documentados. | Não existe nota universal; registre motivo e versão do critério. |
| SQL | Lead aceito como oportunidade comercial após qualificação. | Contagem conforme regra de passagem para vendas. | Não confundir clique, lead e oportunidade. |
| Taxa de qualificação | Parte dos leads que virou MQL ou SQL. | MQL ÷ leads ou SQL ÷ leads × 100. | Especifique qual etapa e período/coorte. |
| Tempo até a primeira resposta | Rapidez para responder a novo contato. | Mediana entre entrada e primeira resposta humana. | Mediana resiste melhor a extremos; horário útil pode ser um recorte. |
| Taxa de contato | Parte dos leads com conversa real iniciada. | Leads contatados com retorno ÷ leads abordados × 100. | Enviar mensagem não é obter contato efetivo. |
| Reuniões agendadas | Conversas comerciais marcadas. | Contagem com data e oportunidade vinculadas. | Não é o mesmo que comparecimento. |
| Taxa de comparecimento | Parte das reuniões agendadas que ocorreu. | Reuniões realizadas ÷ agendadas × 100. | Trate remarcadas separadamente. |
| Taxa de proposta | Parte das reuniões qualificadas que chegou à proposta. | Propostas enviadas ÷ reuniões qualificadas concluídas × 100. | Só compare coortes com tempo de maturação. |
| Win rate | Parte das oportunidades **decididas** que foi ganha. | Ganhas ÷ (ganhas + perdidas) × 100. | Oportunidades abertas ficam fora do denominador. |
| Conversão por etapa | Proporção que avançou de uma fase para a seguinte. | Oportunidades que avançaram ÷ que entraram na fase × 100. | Conte por coorte; não compare estoques de dias diferentes. |
| Ciclo de vendas | Tempo entre entrada qualificada e fechamento. | Mediana de dias dos negócios fechados. | Perdas e ganhos podem ter ciclos diferentes. |
| Valor de pipeline | Soma do valor potencial das oportunidades abertas. | Valores estimados das oportunidades. | Não é receita contratada nem previsão confiável sozinho. |
| Pipeline ponderado | Valor potencial ajustado pela chance estimada de fechar. | Σ valor × probabilidade documentada por etapa. | Probabilidades precisam ser calibradas com histórico. |

## 7. Receita, rentabilidade e clientes

| Indicador | O que revela | Cálculo ou registro | Onde olhar e cuidado |
|---|---|---|---|
| Faturamento | Receita bruta vendida/contratada no período definido. | Soma de vendas/contratos segundo critério financeiro escolhido. | Declare se considera caixa, competência ou pedidos. |
| Ticket médio | Receita por venda/contrato. | Receita das vendas ÷ número de vendas. | Diferente de receita mensal por cliente. |
| Margem bruta | Parte da receita após custos diretamente ligados à entrega. | (Receita − custos diretos) ÷ receita × 100. | Defina custos diretos do serviço. |
| Margem de contribuição | Parte que resta após custos/despesas variáveis. | (Receita − variáveis) ÷ receita × 100. | Não equivale a lucro líquido. |
| CAC total | Custo para adquirir cada novo cliente. | Gastos de aquisição compatíveis ÷ clientes novos da mesma coorte. | Declare se inclui mídia, equipe, criação e ferramentas. |
| CAC de mídia | Parcela de anúncios por cliente conquistado atribuído. | Gasto de anúncios ÷ novos clientes atribuídos. | Menor que CAC total quando existem outros custos. |
| LTV bruto | Receita estimada ao longo do relacionamento. | Receita média por cliente por período × períodos de permanência. | Não é lucro. |
| LTV de margem | Margem bruta estimada ao longo do relacionamento. | Receita por cliente por período × margem bruta × permanência. | Simplificação: não desconta tempo nem variação de receita. |
| LTV/CAC | Relação entre valor de margem do cliente e custo de adquiri-lo. | LTV de margem ÷ CAC compatível. | Mesma população; não substitui caixa nem prazo de retorno. |
| Payback de CAC | Tempo aproximado para recuperar aquisição pela margem recorrente. | CAC ÷ margem bruta mensal por cliente. | Válido para receita recorrente razoavelmente estável. |
| ROAS | Receita atribuída a anúncios por real de mídia. | Receita atribuída ÷ mídia. | Pode ser alto mesmo com margem negativa. [5] |
| ROI | Retorno após custos da ação analisada. | (Ganho atribuível líquido − investimento) ÷ investimento × 100. | Especifique custos, margem, período e método de atribuição. |
| ROMI | ROI calculado para investimento de marketing. | (Margem incremental atribuível − investimento de marketing) ÷ investimento × 100. | Uma convenção operacional; documente escopo e contrafactual. |
| MER | Receita total do negócio em relação à mídia total. | Receita total ÷ gasto total em mídia. | Razão gerencial agregada, não atribuição causal. |
| Receita por lead | Receita observada por contato gerado. | Receita da coorte ÷ leads da coorte. | Precisa de janela de maturação. |
| Retenção | Clientes do início que permaneceram ao fim. | Permaneceram ÷ clientes do início × 100. | Novos clientes não entram no denominador inicial. |
| Churn de clientes | Parte da base inicial que saiu. | Clientes perdidos ÷ clientes do início × 100. | Defina o que conta como saída/inatividade. |
| Compra recorrente | Parte dos compradores que voltou a comprar. | Compradores repetidos ÷ compradores elegíveis × 100. | Declare período e elegibilidade. |
| NPS/CSAT | Opinião declarada sobre recomendação/satisfação. | NPS: % promotores − % detratores; CSAT: favoráveis ÷ respostas × 100. | Pesquisa voluntária tem viés e não mede venda por si só. |

## 8. Vídeo e conteúdo educativo

| Indicador | O que revela | Cálculo ou registro | Onde olhar e cuidado |
|---|---|---|---|
| Impressões da miniatura | Aparições registradas da capa do vídeo na plataforma. | Contagem do YouTube. | Nem toda visualização veio de impressão registrada. [10] |
| CTR da miniatura | Parte das impressões registradas que virou visualização. | Visualizações originadas dessas impressões ÷ impressões × 100. | Não compare fontes e vídeos de tamanhos muito distintos. [10] |
| Visualizações | Reproduções contadas segundo regra da plataforma. | Contagem da ferramenta. | Regras variam por formato/plataforma. [10] |
| Duração média vista | Minutos assistidos por visualização. | Tempo assistido ÷ visualizações. | Leia junto com duração total do vídeo. [10] |
| Retenção do vídeo | Quanto da audiência permanece em cada trecho. | Curva de permanência da plataforma. | Não reduza a um único percentual sem declarar o ponto. |
| Tempo assistido | Soma do tempo efetivamente visto. | Minutos/horas da plataforma. | Não prova avanço no funil. |
| Leads do conteúdo | Contatos rastreados a partir de artigo/vídeo/post. | Leads com origem e conteúdo identificados. | UTM + formulário/CRM; visualizações isoladas não atribuem receita. |

## O painel mínimo da YM para uma empresa de serviços

| Pergunta de gestão | Indicador inicial | Se faltar dado |
|---|---|---|
| Estamos atraindo demanda útil? | Leads novos por origem e leads qualificados. | Registre origem no formulário/CRM. |
| O atendimento transforma interesse em conversa? | Tempo de resposta e taxa de contato. | Marque entrada, primeira resposta e retorno. |
| A venda está avançando? | Comparecimento, propostas, win rate e ciclo. | Padronize as etapas do pipeline. |
| O custo faz sentido? | CAC total, margem bruta e payback quando aplicável. | Separe mídia dos demais gastos de aquisição. |
| O cliente permanece e volta? | Retenção, churn e LTV de margem. | Registre data de entrada, receita e saída. |
| Qual canal sustenta o resultado? | Receita e clientes por origem, com grau de confiança. | Use UTMs e confirme a origem na conversa. |

## Referências oficiais para definições de plataforma

As fórmulas gerenciais de CRM, CAC, LTV, ROMI e cenários são **convenções de trabalho da YM** e devem ser documentadas para cada cliente. Definições próprias das plataformas podem mudar. Consulte a tela e a documentação vigente antes de comparar relatórios.

[1] [Google Ads: colunas, CTR, CPC e CPM](https://support.google.com/google-ads/answer/2454071?hl=pt-BR); [Google Ads: taxa de conversão](https://support.google.com/google-ads/answer/2684489?hl=pt-BR).

[2] [Google Analytics: engajamento e rejeição](https://support.google.com/analytics/answer/12195621?hl=pt-BR); [aquisição de tráfego e taxa de evento principal](https://support.google.com/analytics/answer/12923437?co=GENIE.Platform%3DDesktop&hl=pt-BR); [origem/mídia e atribuição](https://support.google.com/analytics/answer/11080067?hl=en).

[3] [Google Search Console: cliques, impressões, CTR e posição](https://support.google.com/webmasters/answer/7576553?hl=pt-BR); [como são contados](https://support.google.com/webmasters/answer/7042828?hl=pt-BR).

[4] [LinkedIn: alcance e frequência em mídia](https://www.linkedin.com/help/lms/answer/a426154).

[5] [Google Ads: métricas de campanha](https://support.google.com/google-ads/answer/2454071?hl=pt-BR); [parcela de impressões](https://support.google.com/google-ads/answer/2497703?hl=en); [ROAS e ROI](https://support.google.com/google-ads/answer/12851704).

[6] [Google Search Central: Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals).

[7] [Google Perfil da Empresa: métricas disponíveis](https://support.google.com/business/answer/9918094?hl=en).

[8] [LinkedIn: métricas de campanhas](https://www.linkedin.com/help/lms/answer/a445476); [conversões e leads](https://www.linkedin.com/help/lms/answer/a426062).

[9] [Resend: métricas de entrega, abertura, clique e descadastro](https://www.resend.com/changelog/email-metrics-api).

[10] [YouTube: impressões e CTR](https://support.google.com/youtube/answer/7628154?hl=en); [visualizações e duração média](https://support.google.com/youtube/answer/12942217?co=YOUTUBE._YTVideoType%3Dvideo&hl=en-GB).

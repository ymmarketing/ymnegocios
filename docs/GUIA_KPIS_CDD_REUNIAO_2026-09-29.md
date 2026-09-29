# YM | Números para conduzir a reunião

Versão 1.0 - 29/09/2026. Material de estudo e consulta durante o Raio-X. Use a [calculadora de contingência](https://docs.google.com/spreadsheets/d/1lN_sXfSsLSH4XUkwC-lRv23BWYN22TaBacFL54ExyYc/edit) para inserir os números. A calculadora pública em `/cdd/` usa o núcleo de faturamento, contatos, custo manual, retrabalho e redução.

## A conversa em 5 perguntas

1. **Onde estão os números?** "Quanto a empresa faturou em um mês comum? Quantas pessoas novas entraram em contato e quantas compraram?"
2. **Por onde vieram?** "Você sabe qual canal trouxe cada contato e cada venda? Quanto já investe nesse canal?"
3. **Onde o tempo vai embora?** "Qual tarefa repetida mais incomoda? Quantas vezes por semana? Cronometre três ocorrências; a média basta para começar."
4. **Qual cenário faria diferença?** "Se duas vendas adicionais acontecessem e se 20% do custo medido fosse evitado, como ficariam os números? São metas hipotéticas, não previsão."
5. **O que falta medir?** "Qual informação não temos para afirmar que o investimento dá retorno ou que há perda?" A ausência de dado é um achado do diagnóstico, mas não prova prejuízo.

## Os dados exatos da calculadora

| Campo | Pergunta simples e fonte | Uso |
|---|---|---|
| Faturamento mensal | Total vendido em um mês comum, antes dos custos; relatório financeiro | Ponto de partida e denominador dos percentuais |
| Novos contatos | Pessoas diferentes que iniciaram conversa no mês; WhatsApp, formulário e CRM | Conversão |
| Clientes conquistados | Quantos **desse mesmo grupo** compraram, acompanhando o ciclo até a decisão | Conversão, CAC |
| Ticket médio | Receita de vendas dividida pelo número de vendas; pedidos/contratos | Vendas extras simuladas |
| Vendas extras | Quantas vendas a mais a pessoa quer **simular** por mês | Cenário de faturamento |
| Marketing atual | O que **já paga hoje** em anúncios, ferramentas, conteúdo e prestadores | Mostrar exposição sem atribuição; não entra como perda |
| Atribuição | Sabe relacionar custo, origem de contatos e vendas? | Qualidade da leitura |
| Tarefa repetida | Ocorrências por semana, minutos por ocorrência e custo por hora da pessoa | Horas e custo empregado por mês |
| Retrabalho | Uma atividade **diferente** da tarefa anterior: ocorrências, minutos, custo por hora | Horas e custo empregado por mês |
| Gasto direto com retrabalho | Taxa/material efetivamente pagos para refazer algo; recibos | Custo adicional, sem duplicar horas |
| Redução simulada | Percentual escolhido pela pessoa para comparar hoje e cenário | Custo depois e queda em pontos percentuais |

**Se não souber, deixe vazio.** Zero só quando mediu e confirmou que o valor foi zero. A calculadora usa **4 semanas por mês** como aproximação declarada.

## Como os números são feitos

| Indicador | Conta | Como explicar |
|---|---|---|
| Conversão contato → cliente | clientes do grupo ÷ contatos do grupo × 100 | De cada 100 pessoas que chegaram, quantas compraram? |
| Receita extra hipotética | vendas extras × ticket médio | Receita bruta potencial, não lucro |
| Faturamento depois | faturamento atual + receita extra hipotética | Ex.: **R$ 40.000 → R$ 44.000** com 2 vendas × R$ 2.000 |
| Crescimento hipotético | receita extra ÷ faturamento atual × 100 | No exemplo, +10% sobre o faturamento atual |
| Horas mensais de uma tarefa | vezes/semana × minutos × 4 ÷ 60 | 10 vezes × 6 min × 4 ÷ 60 = **4 h/mês** |
| Custo do tempo empregado | horas mensais × custo por hora | 4 h × R$ 20/h = R$ 80/mês; não é economia automática |
| Custo operacional medido | custo da tarefa + custo do retrabalho + gasto direto conhecido | Total **parcial** quando falta alguma taxa/atividade |
| Custo depois | custo medido × (1 - redução escolhida/100) | Se R$ 200 e meta de 20%, cenário R$ 160 |
| Queda em pontos percentuais | (custo antes - custo depois) ÷ **mesmo faturamento atual** × 100 | R$ 40/40.000 = 0,1 p.p.; não confundir com 20% de redução |

**Nunca some faturamento potencial, custo evitável e marketing atual numa única “perda”.** Venda adicional é receita; tempo liberado pode ser realocado sem saída de caixa; marketing só é perda demonstrada com atribuição e análise de margem.

## Indicadores adicionais para um Raio-X mais profundo

Esses campos estão na planilha de reunião, mas **não fazem parte do núcleo da calculadora pública**. Use apenas se o cliente tiver base confiável:

| Sigla | Fórmula de trabalho | Dado que precisa | Cuidado na conversa |
|---|---|---|---|
| CAC - custo de aquisição de cliente | gastos **de aquisição** no período ÷ novos clientes atribuíveis ao mesmo período/coorte | mídia, produção/comercial aplicável e novos clientes por origem | Se usar só anúncios, chame de CAC de mídia; sem origem é aproximação |
| LTV de margem | receita média mensal por cliente × margem bruta × meses médios de permanência | cobrança por cliente, custos diretos, histórico de retenção | Esta versão é simplificada; não inclui desconto no tempo nem variações da receita |
| LTV/CAC | LTV de margem ÷ CAC | ambos medidos na mesma população | Uma razão alta não substitui análise de caixa e capacidade |
| ROI de um cenário | (margem bruta da receita incremental **atribuível** - novo investimento) ÷ novo investimento × 100 | vendas incrementais, margem e custo novo | Na planilha é **simulação**; só chame ROI observado depois de medir resultado e atribuição |
| ROAS de anúncios | receita atribuída aos anúncios ÷ gasto de anúncio | plataforma + vendas ligadas às campanhas | Mede receita sobre mídia, não lucro nem ROI |
| Taxa de resposta | respostas ÷ abordagens entregues × 100 | envios válidos e respostas | Separe prospecção de campanhas de marketing |
| Win rate | negócios ganhos ÷ negócios decididos × 100 | ganhos e perdidos no mesmo recorte | Não misture oportunidades ainda abertas |
| Retenção | clientes do início que permanecem ÷ clientes do início × 100 | base de clientes por período | Exclua novos clientes do denominador inicial |
| Churn | clientes do início que saíram ÷ clientes do início × 100 | cancelamentos e base inicial | Use período e tipo de cliente consistentes |

## Exemplo completo para explicar sem jargão

Uma empresa fatura R$ 40.000/mês. Recebe 80 contatos e 8 compram: conversão de **10%**. Ticket informado: R$ 2.000. A meta de 2 vendas adicionais dá **R$ 4.000 de receita bruta hipotética**, levando o faturamento a **R$ 44.000**. Se uma tarefa usa 4 h/mês a R$ 20/h, há R$ 80 em tempo empregado. Um retrabalho diferente usa mais 4 h (R$ 80), além de R$ 40 de custo direto: **R$ 200 de custo medido**. Uma redução simulada de 20% deixa **R$ 160**, diferença de R$ 40/mês ou **0,1 ponto percentual** do faturamento atual. Os R$ 4.000 e os R$ 40 aparecem separados.

Se o gasto de aquisição atribuível foi R$ 1.500 para os 8 novos clientes, o **CAC aproximado é R$ 187,50**. Com receita mensal por cliente de R$ 1.000, margem bruta de 50% e permanência média de 12 meses, o **LTV simplificado de margem é R$ 6.000**. Para um novo investimento hipotético de R$ 1.000, a margem das duas vendas extras seria R$ 2.000 e o **ROI simulado seria 100%**. Nada disso comprova causalidade antes do acompanhamento.

## Frases que ajudam na reunião

- "O que temos certeza de que aconteceu? O que é uma estimativa? O que queremos simular?"
- "Aqui você fatura R$ X. Com a meta que escolheu, a conta iria para R$ Y. Ainda precisamos verificar se há demanda e capacidade para essas vendas."
- "Este é o tempo consumido por **uma** tarefa; ele pode ser liberado, mas só vira economia financeira se os custos forem de fato reduzidos."
- "Seu gasto em marketing não é automaticamente desperdício. Sem saber de onde vieram os clientes, ainda não conseguimos defender esse investimento nem corrigir a rota com segurança."
- "O Raio-X aprofunda justamente a origem, a jornada, a capacidade e as evidências antes de propor um sistema ou uma campanha."

## Verificação antes de apresentar um número

1. Mesmo período para gastos, contatos, clientes e faturamento?
2. O cliente contado veio do grupo de contatos analisado?
3. Ticket de **venda** ou receita média **mensal por cliente**?
4. Custos diretos removidos para estimar margem? Investimento novo separado do marketing que já existe?
5. Tarefa repetida e retrabalho são atividades diferentes?
6. O cenário foi escolhido pelo cliente? Há capacidade para cumprir a meta?
7. Marcamos claramente "medido", "estimado" e "não informado"?

### Fontes de referência para termos

- Google Ads, glossário de ROAS e ROI: https://support.google.com/google-ads/answer/12851704
- Google Ads, taxa de conversão: https://support.google.com/google-ads/answer/2684489
- Google Analytics, atribuição: https://support.google.com/analytics/answer/11080067
- Shopify, CAC e margem bruta do valor do cliente: https://www.shopify.com/blog/customer-acquisition-cost

As fórmulas do **CDD YM** acima são definições operacionais desta versão da ferramenta. Elas devem ser confirmadas com as fontes do cliente antes de fundamentar uma proposta ou remuneração por resultado.

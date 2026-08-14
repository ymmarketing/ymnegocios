# ECOSSISTEMA TÉCNICO YM — BASELINE

Data de referência: 14/08/2026
Status: PRODUÇÃO ASSISTIDA

## Objetivo deste arquivo

Registrar o estado real do ecossistema técnico da YM para impedir reconstruções por memória parcial entre conversas. Este arquivo deve ser consultado antes de alterações relevantes em CRM, MOTOR, Dashboard ou Financeiro.

## Ambiente interno atual

Entrada única: `ymnegocios.com.br/interno`

Módulos internos materializados:
- `/CRM` — CRM Essencial 1.5, em produção assistida.
- `/MOTOR` — MOTOR VOS, em produção assistida.
- `/DASHBOARD` — Dashboard Gerencial, Etapa 2.
- `/Identidade` — rota reservada, ainda em ideação.

Rotas públicas relacionadas:
- site/Raio-X
- Quem Somos
- Área do Cliente — rota reservada, ainda em ideação.

Autenticação interna: Supabase Auth, sessão compartilhada entre módulos internos.

## CRM — estado atual

O CRM já cobre:
- prospecção e oportunidades;
- Leitura Inicial;
- contato e follow-up;
- Raio-X ofertado, pago e entregue;
- proposta, ganho e perda;
- vínculo com o MOTOR;
- próxima ação e histórico;
- clientes ativos;
- serviços contratados;
- recorrência;
- pagamentos e competências;
- filtros e KPIs clicáveis;
- entrada manual e contingência.

A base operacional financeira já nasce no CRM por meio das entidades de clientes, serviços e pagamentos. A Etapa 3 Financeiro NÃO deve duplicar esse cadastro.

## MOTOR VOS — estado atual

Fluxo implementado:
1. Destino
2. Cobertura dos 8Ps
3. Evidências e mapa VER
4. Hipóteses e testes
5. Conclusões humanas
6. Gate VER
7. ORDENAR

Governança vigente:
- os 8Ps são mapa obrigatório de cobertura, não ordem de prioridade;
- lacuna não é disfunção;
- hipótese não é conclusão;
- causa exige evidência;
- ORDENAR só é liberado após validação humana e Gate VER aprovado;
- decisões comerciais não devem nascer apenas do score.

8Ps oficiais:
- Produto
- Preço
- Praça
- Promoção
- Pessoas
- Processos
- Evidências físicas
- Produtividade e Qualidade

## Dashboard Gerencial — Etapa 2

Já implementado e conectado a CRM + MOTOR.

Visões atuais incluem:
- funil comercial;
- oportunidades, Leituras enviadas, Raio-X pagos/entregues e serviços contratados;
- desempenho por segmento, origem e classe de lead;
- motivos de perda;
- rotas humanas validadas;
- clientes ativos, serviços e fotografia financeira inicial;
- padrões dos 8Ps;
- status de hipóteses, conclusões e ordenação;
- correlações somente após gate mínimo de amostra humana;
- histórico de serviços após análise sem transformá-lo em recomendação automática.

## Etapa 3 — FINANCEIRO

STATUS: PAUSADA em 14/08/2026.

Fonte de arquitetura/cálculo: `YM_Quadro_Financeiro_ROI_Valuation_COMPLETO.xlsx`.

Direção já definida para quando retomada:
- rota interna `/FINANCEIRO`;
- planilha deixa de ser banco operacional e passa a ser referência canônica de arquitetura e cálculo;
- CRM fornece cliente, serviço, valor, condições e pagamentos;
- Financeiro adiciona custos, contribuição, capacidade, ROI, payback, valuation e projeções;
- separar obrigatoriamente: PREVISTO × CONTRATADO × FATURADO × RECEBIDO.

Não avançar esta etapa enquanto a prioridade for o ajuste do MOTOR VOS.

## PRIORIDADE ATUAL — AJUSTE DO MOTOR VOS

Motivo: aplicação real no cliente Lumos mostrou que a interface atual dá margem excessiva para análise rasa e deixa o aplicador sem orientação suficiente para interpretar e preencher cada P.

### Problema observado

Hoje cada P apresenta campos genéricos de observação, evidência, classificação, confiança, validação restante e justificativa humana. Apesar de metodologicamente corretos, esses campos não traduzem o método o suficiente para orientar a aplicação.

Riscos:
- interpretação vaga do que cada P cobre;
- classificações diferentes entre aplicadores;
- disfunção marcada sem evidência suficiente;
- lacuna confundida com problema;
- validação dos 8Ps feita de forma superficial;
- análise final rasa apesar de o método ser profundo.

### Requisito aprovado para o redesenho

Cada P deve virar um BLOCO GUIADO DE ANÁLISE, contendo:
1. legenda curta: o que aquele P avalia;
2. perguntas básicas/checklist para o aplicador se fazer antes de classificar;
3. indicação das fontes esperadas de evidência;
4. alerta do que não deve ser inferido naquele P;
5. síntese humana: observação, evidência/origem, classificação, confiança e o que falta validar.

As perguntas-guia devem nascer das fontes canônicas já aprovadas da Etapa 2 e do mapa 8Ps ↔ VER. Não criar um método paralelo.

### Referência de cobertura por P

- Produto: oferta, resultado entregue, público e clareza da oferta. Referências RX07–RX10. Não usar menor nota como causa.
- Preço: critério de preço e comunicação de valor. RX11–RX12. Não confundir ticket com maturidade.
- Praça: como o cliente encontra e como avança para compra. RX04, RX06, RX13–RX14. Não punir ausência de canal específico.
- Promoção: constância e clareza da mensagem. RX06, RX08, RX15–RX16. Não confundir frequência com estratégia.
- Pessoas: responsabilidades, cobertura e dependência. RX05, RX17–RX18, RX25. Não inferir capacidade por reputação ou tempo de mercado.
- Processos: jornada comercial, follow-up e repetibilidade. RX19–RX20. Ausência de registro não prova falha de processo.
- Evidências físicas: provas existentes e visibilidade na jornada. RX21–RX22. Não declarar inexistência sem verificar.
- Produtividade e Qualidade: indicadores, registros, capacidade e consistência. RX05, RX18, RX23–RX25. “Não sei” reduz confiança/cobertura; não vira zero.

### Regra de salvamento

A interface não deve ter botão de salvar/validar em cada P.

Deve existir um único botão ao final da área de análise, com comportamento de salvamento consolidado do VER. O usuário pode preencher todos os Ps e salvar uma única vez.

A validação metodológica continua humana; o checklist guia a reflexão, mas não deve classificar automaticamente o P nem gerar causa/prioridade.

## Fontes oficiais que sustentam o ajuste

- Planejamento Oficial Operacional VOS/YM v1.0 aprovado.
- Template Oficial 1C — VER Profundo.
- Etapa 2 — Canonização de Dados e Perguntas VOS/YM v1.2 aprovada.
- Mapa 8Ps ↔ VER e Score RX_CANONICO_1.0 / RX_SCORE_1.0.

## Regra para próximas alterações

Antes de codificar mudanças metodológicas no MOTOR:
1. confrontar com as fontes oficiais acima;
2. evitar criar nova lógica de score, causa ou prioridade;
3. preservar rastreabilidade;
4. preservar os dados já existentes em produção;
5. priorizar mudanças aditivas e retrocompatíveis;
6. testar com Lumos e pelo menos um caso adversarial antes de considerar o ajuste homologado.

# CRM vNext, prospecção e área do cliente — decisão de 29/09/2026

## Direção aprovada

- Prioridade de uso: pipeline de prospecção, ficha simples do potencial cliente, histórico e próxima ação; após a contratação, ambiente do cliente com seus números, dados e financeiro.
- O Motor deixa de aparecer na navegação da Central, no CRM e nos cards. Ele continua disponível de forma independente para trabalho interno futuro. Não excluir aplicação, tabelas, casos, arquivos ou vínculos existentes.
- Decisão posterior da fundadora: a lista antiga do pipeline pode sair integralmente da operação para uma revisão completa do ICP. Guardar a safra anterior de forma recuperável; seu histórico não precisa aparecer na operação diária. Preservar clientes ativos, financeiro e vínculos.
- A ficha de cliente é única: oportunidade evolui para cliente após aceite e onboarding; não duplicar cadastro. O CDD interno deve se vincular a essa ficha.
- Abrangência nacional. Cidade/UF é informação contextual, não filtro obrigatório de ICP.

## Auditoria inicial de UX — evidência no código atual

| Ponto | Evidência observada | Ajuste |
|---|---|---|
| Card do pipeline | Resumo tem etapa, leitura, próxima ação e marcador do Motor; ao abrir, aparecem perfil, quatro quadros de leitura, quatro editores e histórico de uma vez. Em tela pequena, a etapa e a próxima ação do resumo são ocultadas por CSS. | Dar destaque a empresa, etapa e próximo passo também no celular. Primeiro contato e próxima ação; leitura, qualificação e histórico sob expansão. |
| Cadastro | A edição apresenta 25 campos em três seções, todos abertos, sem progressão por momento comercial. | Básico primeiro: empresa/pessoa, contato, origem e próxima ação. Complementos e análise comercial em seções expansíveis; preservar os valores já cadastrados. |
| Navegação do Motor | Link no menu compartilhado, botão no topo do CRM, badge/link no card, fila de casos e botão dinâmico para criar caso. | Retirar esses pontos da experiência padrão e manter a rota e os dados existentes. Não modificar o serviço `motor-crm` nesta rodada. |
| Clientes ativos | Um módulo carregado após a página ativa a aba de clientes do CRM, com serviços e financeiro; a Central também tem lista administrativa. O aviso antigo do HTML não representava o fluxo final. | Preservar a aba funcional e validar após o arquivo da prospecção. Na etapa de ficha canônica, ligar CRM, Central e área do cliente ao mesmo registro. |
| Exclusão | O CRM oferece “Excluir duplicado”, que remove oportunidade e histórico mediante confirmação por nome. | Não usar como limpeza geral. Antes: inventário, critério de duplicidade, destino dos vínculos, backup e revisão humana. |

Esta é uma auditoria da implementação e dos fluxos disponíveis no repositório; a usabilidade com dados reais e uma sessão autenticada ainda precisa de homologação.

### Inventário de dados — consulta agregada em 29/09/2026

O projeto de produção YM registra 259 contatos, 253 oportunidades, 10 clientes e 2 acessos ativos ao portal. Das oportunidades, 244 estão em `LEAD_MAPEADO`. Nenhuma oportunidade apareceu sem texto em `next_action` na consulta agregada; isso não confirma se o texto é uma ação útil ou atualizada.

Critérios automáticos localizaram **candidatos para revisão**, não duplicados confirmados: 1 grupo de e-mail repetido envolvendo 4 contatos; 3 grupos de telefone repetido envolvendo 18 contatos; 1 grupo de nome de empresa repetido envolvendo 2 contatos. Esses grupos podem se sobrepor e telefone/e-mail compartilhado pode ser legítimo. Nenhum registro foi alterado ou removido.

### Arquivo da safra anterior — execução em 29/09/2026

Após a autorização para retirar todos os registros atuais do pipeline, as 253 oportunidades receberam `archived_at` e `archive_note = ICP_RESET_2026-09-29`. A função autenticada `motor-crm` agora retorna apenas oportunidades ativas, mas continua consultando os vínculos da safra arquivada para não reapresentar Raio-X antigos como entradas sem oportunidade. A interface mostra a quantidade arquivada e começa com zero oportunidades ativas.

Verificação após a operação: 253 oportunidades arquivadas, 0 ativas, 10 clientes, 11 serviços, 17 pagamentos e 2 acessos ativos ao portal. Quatro vínculos de clientes a oportunidades antigas permanecem íntegros. Contatos e histórico também permanecem no banco; a operação não usou `DELETE`.

Para recuperar uma oportunidade específica, revisar primeiro seus vínculos e então limpar `archived_at` e `archive_note` daquela linha. Para desfazer a safra inteira, usar a marca `archive_note` com conferência da contagem, em uma operação revisada. Novas oportunidades terão `archived_at = null`.

Limite técnico: a função consulta até 500 oportunidades ativas e até 5.000 referências para checar vínculos de Raio-X. Revisar paginação antes de ultrapassar esse volume.

## Experiência alvo do pipeline

1. Lista: empresa, decisor, etapa atual, última interação e próxima ação com prazo. Busca e filtro simples.
2. Abrir card: resumo do negócio, contato, sinal observado e ação seguinte. Botões de registrar contato, marcar próximo passo e mover etapa.
3. Expansão por necessidade: qualificação, links públicos, Leitura Inicial, histórico e proposta; não exigir esses dados na captação.
4. Edição básica: empresa/pessoa → canal de contato → origem → próxima ação. Complementos ficam opcionais e recolhidos.
5. Ao contratar: encaminhar à ficha canônica e onboarding. A área do cliente só mostra os registros autorizados da própria empresa, incluindo números e financeiro.

## Fluxo de prospecção a construir

| Momento | O que fazer | Registro mínimo no CRM |
|---|---|---|
| Busca | Encontrar empresas em fontes públicas, seguindo critérios ICP abaixo; guardar URL e data da fonte. | Empresa, segmento, fonte, evidência e responsável. |
| Qualificação | Confirmar aderência e um sinal observável; separar hipótese de fato. Checar possível cadastro existente. | Canal, decisor quando público, sinal, oportunidade a validar, nível de confiança. |
| Primeira abordagem | Mensagem curta contextualizada: observação verificável, pergunta sobre custo/resultado, convite para avaliação. Revisão humana antes do envio. | Data, canal, versão da mensagem, status e próxima ação. |
| Resposta e conversa | Registrar a dor declarada, objetivo, momento e autorização para continuar. Indicar avaliação gratuita e rota de Raio-X adequada. | Resultado, objeção, próxima ação e prazo. |
| Follow-up | Lembrete com contexto e valor; interromper diante de recusa ou preferência contrária. | Tentativa, resposta, data e motivo de pausa/encerramento. |
| Nutrição | Conteúdo pertinente à dor e ao estágio; separar e-mail individual de prospecção de campanhas de marketing. | Interesse, preferência de contato, origem da lista e interação. |
| Diagnóstico e proposta | CDD/triagem → Digital ou conversa Estratégica → devolutiva → proposta quando houver aderência. | Rota, evidências, próximos marcos; não criar cliente operacional antes do aceite. |

### Critérios de busca pelo ICP

**Hipótese prioritária a validar:** PMEs de serviços B2B com decisão acessível, necessidade de gerar demanda e operação comercial que possa ser organizada. Pesquisas anteriores sugerem negócios de RH, DHO, recrutamento e seleção e especialistas B2B como grupos para avaliação; não assumir que todo negócio desses segmentos é aderente.

1. **Aderência:** vende serviço de valor consultivo ou recorrente; tem capacidade de atender novos clientes; decisão comercial identificável.
2. **Sinal público específico:** site sem caminho claro de contato, conteúdo sem proposta de próximo passo, formulário/WhatsApp sem jornada aparente ou investimento em canais sem prova pública de acompanhamento. Sinal público é hipótese para conversa, nunca diagnóstico fechado.
3. **Momento:** expansão, nova oferta, contratação comercial, atividade de conteúdo recente ou mudança de posicionamento verificável. Registrar fonte e data.
4. **Potencial de trabalho:** há problema de aquisição, posicionamento ou operação que a YM consegue investigar e implementar; compatível com consultoria + sistemas digitais.
5. **Desqualificação:** sem capacidade de atender, busca apenas volume de posts sem diagnóstico, expectativa de ganho garantido, ausência de decisor ou recusa de contato.
6. **Busca nacional:** combinar serviço/segmento/dor nas fontes públicas e no LinkedIn; localidade não restringe a prospecção.

**Campos para pesquisa:** termo usado, fonte/URL, data, nome da empresa, segmento, evidência textual, hipótese, contato profissional público, decisor, canal permitido, duplicidade verificada, responsável e próxima ação. Não preencher faturamento, CAC ou dores internas com suposições.

### E-mail de prospecção e e-mail marketing

- **Prospecção individual:** mensagem revisada para uma empresa específica, com assunto simples, motivo da abordagem verificável, pergunta relevante e um único próximo passo. Registrar resultado e follow-up no CRM; não disparar em massa enquanto a base não for revisada.
- **E-mail marketing:** campanha para base com origem e preferência de contato registradas, segmentação por interesse/estágio, opção de saída e acompanhamento de entrega, resposta e conversão. Conteúdo útil precede oferta.
- **Antes de ativar envios:** definir domínio/remetente, integração de envio, regras de acesso, prevenção de duplicidade, revisão de conteúdo, tratamento de respostas e indicadores. Validar práticas de contato e privacidade antes da operação.
- **Indicadores:** empresas pesquisadas, qualificadas, abordadas, respostas, conversas, avaliações, Raio-X, propostas e clientes; comparar por fonte/canal. Taxas não substituem leitura qualitativa.

## Ordem de implementação e validação

1. Desacoplar entradas visíveis do Motor e simplificar card e cadastro do CRM; validar com Yasmin no celular. A safra antiga está arquivada, sem exclusão.
2. Revisar o ICP antes de pesquisar e cadastrar a nova lista. Se precisar de algum registro antigo, recuperá-lo do arquivo pelo vínculo original.
3. Modelar CDD interno na ficha canônica e verificar o fluxo Digital ponta a ponta.
4. Implementar busca/qualificação e tarefas de prospecção; integrar e-mail somente após regras de lista, preferências e revisão.
5. Evoluir conversão, Central e área do cliente com isolamento dos próprios dados e financeiro.

## Critérios de aceite da rodada de UX

- No celular, empresa, etapa e próxima ação são compreensíveis sem abrir todos os detalhes.
- Cadastrar lead exige apenas informações básicas; edição complementar não apaga campos existentes.
- Motor não aparece no menu da Central/CRM nem no card ou fila; sua rota independente e registros continuam disponíveis.
- Registrar contato, próxima ação e mudança de etapa continua funcional; histórico e Raio-X de origem permanecem acessíveis quando pertinentes.
- A safra anterior não aparece no pipeline e pode ser recuperada por marcação de arquivo; clientes ativos, financeiro e acessos continuam.

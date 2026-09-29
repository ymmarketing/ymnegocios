# YM 2.0 — estado da esteira

Atualizado em 29/09/2026. A documentação mestre continua sendo a referência de requisitos; este arquivo registra o estado observado na implementação.

| Frente | Estado | Evidência e próximo passo |
|---|---|---|
| Site e entrada pública | Publicado | Home, Quem Somos com depoimentos, três conteúdos iniciais e avaliação gratuita. A foto nova da fundadora segue pendente, sem impedir as demais etapas. |
| Triagem | Publicada e testada pela cliente | WhatsApp obrigatório, seleção múltipla de canais, score de complexidade, rotas Digital/Estratégica, repetição por contato conhecido, explicações de CRM/ERP/jornada e mensagem de resultado. Dados de contato e respostas são registrados pelo serviço público existente. |
| CDD público | Publicado | `/cdd/` agora orienta o preenchimento e destaca faturamento atual → cenário de vendas, com economia operacional em bloco separado. Não envia nem persiste os valores digitados; uma hipótese não é resultado garantido. Link na home; saída para a avaliação gratuita. |
| CDD interno | Pendente | Definir registro canônico de premissas, fontes, cenários, versão e validação humana; vincular à oportunidade/triagem e ao Raio-X Estratégico; criar interface autenticada e migração sem perda de dados. |
| Raio-X Digital | Fluxo legado preservado | Página e checkout de R$ 97 já existem. Próximo: auditar pagamento → validação → questionário → relatório → CRM sob o novo funil, sem alterar dados ou pagamentos anteriores. |
| Raio-X Estratégico | Pendente | Agendamento, conversa de enquadramento, coleta, imersão, CDD aprofundado e devolutiva. Preço definido após reunião, sem divulgação pública. |
| CRM e Central | Arquivo concluído; UX em homologação | Os 253 registros da safra anterior foram arquivados de forma reversível: pipeline ativo zerado, sem apagar clientes, serviços, pagamentos, acessos ou vínculos. Cadastro e card foram simplificados; o Motor saiu das entradas visíveis, mas aplicação e dados permanecem para uso independente. Ver `docs/CRM_VNEXT_PROSPECCAO_2026-09-29.md`. |
| Prospecção e aquisição ativa | Nova frente na esteira | Fluxo de busca por ICP nacional, qualificação, primeira abordagem, follow-up, nutrição, e-mail de prospecção e marketing com rastreio no CRM. Critérios e validações no documento de CRM vNext. |
| Área do cliente | Prioridade preservada | Planejar acesso autenticado aos próprios dados, números e financeiro, partindo da ficha canônica e de regras de acesso por cliente. Não expor dados de outro cliente. |
| Precificação, KPI e propostas | Pendente na esteira YM 2.0 | Evoluir após estabilizar as rotas de diagnóstico, CRM e dependências do legado. |

## Próxima implementação

1. Homologar com Yasmin a navegação do CRM/Central, o card e o cadastro simples no celular. A safra anterior já está arquivada; novos leads entram no pipeline limpo.
2. Auditar o esquema existente para decidir onde o CDD aprofundado pertence; modelar premissas, fontes, cenários, versão e autor sem criar ficha duplicada.
3. Validar o caminho do Raio-X Digital de ponta a ponta, em ambiente apropriado, antes de mudar pagamento, relatório ou CRM em produção.
4. Construir o fluxo de prospecção e os critérios de busca pelo ICP; depois integrar e-mail de prospecção e marketing com revisão, rastreio, preferências de contato e medição.
5. Evoluir Raio-X Estratégico, CRM vNext, conversão, ficha canônica e área do cliente para acesso aos próprios números e financeiro.

## Limites conhecidos

- A calculadora pública não identifica causa, não cria um lead e não promete recuperação dos valores.
- A triagem mede complexidade declarada; a recomendação pode ser revista pela YM.
- O arquivo da safra antiga é reversível por `archived_at`; nenhum registro foi excluído. A Central mantém clientes, serviços, pagamentos e acessos.
- A saída do Motor é visual/operacional no CRM e na Central. Seu código, rota independente, registros e vínculos existentes continuam preservados.
- A antiga nota “ETAPA 3: candidata integrada preparada em branch; produção não alterada” não descreve mais a publicação YM 2.0 atual.

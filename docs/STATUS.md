# YM 2.0 — estado da esteira

Atualizado em 30/09/2026. A documentação mestre continua sendo a referência de requisitos; este arquivo registra o estado observado na implementação.

| Frente | Estado | Evidência e próximo passo |
|---|---|---|
| Site e entrada pública | Publicado | Home, Quem Somos com depoimentos, três conteúdos iniciais e avaliação gratuita. A foto nova da fundadora segue pendente, sem impedir as demais etapas. |
| Triagem | Publicada e testada pela cliente | WhatsApp obrigatório, seleção múltipla de canais, score de complexidade, rotas Digital/Estratégica, repetição por contato conhecido, explicações de CRM/ERP/jornada e mensagem de resultado. Dados de contato e respostas são registrados pelo serviço público existente. |
| CDD público | Publicado | `/cdd/` agora orienta o preenchimento e destaca faturamento atual → cenário de vendas, com economia operacional em bloco separado. Não envia nem persiste os valores digitados; uma hipótese não é resultado garantido. Link na home; saída para a avaliação gratuita. |
| CDD interno | Implementado, aguardando homologação com dados de cliente | Registro versionado por oportunidade, fonte, premissas, validação humana, cálculo no servidor e tela autenticada pelo card do CRM. Não cria cliente operacional. O Digital continua qualitativo; a análise financeira é conduzida na conversa Estratégica. |
| Raio-X Digital | Correção de nomenclatura em validação | Página e checkout de R$ 97 permanecem. O aplicativo pago, relatório e integração com o CRM foram alinhados ao nome Digital, com contato/WhatsApp na coleta. A função aceita packets antigos como Estratégico; falta homologação ponta a ponta com acesso pago ou código autorizado. |
| Raio-X de contingência | Publicado no backend | Link independente `https://ym-raiox-backend.vercel.app/contingencia/`, 18 perguntas e mesmo motor/relatório do Digital, acesso por código individual após confirmação manual do Asaas. Lista privada e instruções na pasta CONTINGÊNCIA do Drive. A planilha permanece como registro auxiliar e a calculadora de KPIs é outro instrumento. |
| Raio-X Estratégico | Pendente | Agendamento, conversa de enquadramento, coleta, imersão, CDD aprofundado e devolutiva. Preço definido após reunião, sem divulgação pública. |
| CRM e Central | Arquivo concluído; UX em homologação | Os 253 registros da safra anterior foram arquivados de forma reversível: pipeline ativo zerado, sem apagar clientes, serviços, pagamentos, acessos ou vínculos. Cadastro e card foram simplificados; o Motor saiu das entradas visíveis, mas aplicação e dados permanecem para uso independente. Ver `docs/CRM_VNEXT_PROSPECCAO_2026-09-29.md`. |
| Prospecção e aquisição ativa | Nova frente na esteira | Fluxo de busca por ICP nacional, qualificação, primeira abordagem, follow-up, nutrição, e-mail de prospecção e marketing com rastreio no CRM. Critérios e validações no documento de CRM vNext. |
| Área do cliente | Prioridade preservada | Planejar acesso autenticado aos próprios dados, números e financeiro, partindo da ficha canônica e de regras de acesso por cliente. Não expor dados de outro cliente. |
| Precificação, KPI e propostas | Guia e glossário prontos | O guia de reunião explica a calculadora; `docs/GLOSSARIO_KPIS_MARKETING_2026-09-29.md` cobre 100 indicadores com fórmulas, fonte e cuidado de leitura. Os KPIs externos não alteram o score oficial nem são coletados automaticamente. Precificação contratual e baseline seguem na esteira. |

## Próxima implementação

1. Expandir o fluxo consultivo do Raio-X Estratégico: agendamento, fontes/evidências, imersão e devolutiva a partir do CDD interno, sem preço público.
2. Construir busca/qualificação do ICP nacional e tarefas de prospecção; integrar e-mail somente após regras de lista, preferências e revisão.
3. Evoluir conversão, ficha canônica e área do cliente para acesso aos próprios números e financeiro.
4. Na homologação final com Yasmin, testar CRM/Central no celular, CDD interno e Digital ponta a ponta: checkout → confirmação → 18 perguntas → relatório/PDF → registro no CRM; executar também o caminho de código individual sem cobrança real.

## Limites conhecidos

- A calculadora pública não identifica causa, não cria um lead e não promete recuperação dos valores.
- A triagem mede complexidade declarada; a recomendação pode ser revista pela YM.
- O arquivo da safra antiga é reversível por `archived_at`; nenhum registro foi excluído. A Central mantém clientes, serviços, pagamentos e acessos.
- A saída do Motor é visual/operacional no CRM e na Central. Seu código, rota independente, registros e vínculos existentes continuam preservados.
- O CDD interno não soma faturamento potencial, economia operacional e investimento em marketing num número único. Versões validadas exigem fonte e responsável humano. O relatório consultivo completo ainda está em desenvolvimento.
- A antiga nota “ETAPA 3: candidata integrada preparada em branch; produção não alterada” não descreve mais a publicação YM 2.0 atual.

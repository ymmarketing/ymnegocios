# YM 2.0 — estado da esteira

Atualizado em 29/09/2026. A documentação mestre continua sendo a referência de requisitos; este arquivo registra o estado observado na implementação.

| Frente | Estado | Evidência e próximo passo |
|---|---|---|
| Site e entrada pública | Publicado | Home, Quem Somos com depoimentos, três conteúdos iniciais e avaliação gratuita. A foto nova da fundadora segue pendente, sem impedir as demais etapas. |
| Triagem | Publicada e testada pela cliente | WhatsApp obrigatório, seleção múltipla de canais, score de complexidade, rotas Digital/Estratégica, repetição por contato conhecido, explicações de CRM/ERP/jornada e mensagem de resultado. Dados de contato e respostas são registrados pelo serviço público existente. |
| CDD público | Publicado | `/cdd/` estima quatro categorias separadas a partir dos números informados. Não envia nem persiste os valores digitados. Não soma receita potencial, investimento e custos em um total; explicita as premissas e limitações. Link na home; saída para a avaliação gratuita. |
| CDD interno | Pendente | Definir registro canônico de premissas, fontes, cenários, versão e validação humana; vincular à oportunidade/triagem e ao Raio-X Estratégico; criar interface autenticada e migração sem perda de dados. |
| Raio-X Digital | Fluxo legado preservado | Página e checkout de R$ 97 já existem. Próximo: auditar pagamento → validação → questionário → relatório → CRM sob o novo funil, sem alterar dados ou pagamentos anteriores. |
| Raio-X Estratégico | Pendente | Agendamento, conversa de enquadramento, coleta, imersão, CDD aprofundado e devolutiva. Preço definido após reunião, sem divulgação pública. |
| CRM vNext, precificação, KPI, propostas e área do cliente | Pendente na esteira YM 2.0 | Evoluir após estabilizar as rotas de diagnóstico e mapear dependências do legado. |

## Próxima implementação

1. Auditar o esquema e as telas internas existentes para decidir onde o CDD aprofundado pertence, sem criar ficha duplicada.
2. Modelar cenários e evidências com versão e autor, distinguindo custo real, investimento sem atribuição, tempo operacional e receita potencial.
3. Implementar cálculo e revisão interna com testes de sobreposição de categorias e acesso por papel.
4. Validar o caminho do Raio-X Digital de ponta a ponta em ambiente apropriado antes de mudar a produção.

## Limites conhecidos

- A calculadora pública não identifica causa, não cria um lead e não promete recuperação dos valores.
- A triagem mede complexidade declarada; a recomendação pode ser revista pela YM.
- A antiga nota “ETAPA 3: candidata integrada preparada em branch; produção não alterada” não descreve mais a publicação YM 2.0 atual.

# MENOS BUCHO — MVP

Status: desenvolvimento em branch isolada `feat/menos-bucho-mvp`.

## Decisões já validadas

- Produto: **Desafio Menos Bucho com Novos Hábitos**.
- Jornada individual de **30 dias**.
- Preço inicial: **R$ 19,90 por 30 dias**.
- Checkout: **Asaas direto**, usando página de checkout hospedada pelo Asaas.
- Compra avulsa: Pix ou cartão.
- Renovação automática opcional: mensal, inicialmente por cartão.
- Banco/autenticação: Supabase.
- Relacionamento: Resend.
- Domínio inicial: estrutura pronta para `ymnegocios.com.br/MENOS_BUCHO/`.
- PWA: sim, sem depender de App Store/Google Play.
- IA não cria desafios livremente. A jornada seleciona desafios de uma biblioteca aprovada e adapta nível/ordem por regras.

## O que já existe nesta branch

### Frontend funcional em modo local

- diagnóstico inicial;
- escolha de objetivo, focos, tempo e ritmo;
- criação da jornada de 30 dias;
- 3 desafios diários;
- prevenção de repetição recente;
- adaptação de intensidade conforme conclusão do dia anterior;
- registro de conclusão por desafio;
- anotação diária;
- métricas de execução e constância;
- tela de fim do ciclo;
- PWA e cache offline.

### Banco Supabase modelado

Migrations em `supabase/migrations`:

1. `0001_core.sql`: perfis, onboarding, assinaturas, biblioteca, jornadas, planos diários, conclusão, reflexões, preferências, mensagens e auditoria financeira + RLS.
2. `0002_billing_checkout.sql`: reconciliação Asaas.
3. `0003_engagement_queue.sql`: agenda e-mails dos dias 1, 3, 7, 14, 21, 27 e 30.
4. `0004_seed_challenges.sql`: biblioteca inicial aprovada de desafios.

### Edge Functions preparadas

- `create-checkout`: cria checkout Asaas hospedado; R$ 19,90; compra avulsa ou renovação automática.
- `asaas-webhook`: valida `asaas-access-token`, registra evento com idempotência e ativa/renova acesso somente após confirmação financeira.
- `dispatch-emails`: envia a régua de relacionamento pelo Resend com `Idempotency-Key`.

## Segurança

- Usuário autenticado não escreve diretamente em assinatura, cobrança, jornada gerada, catálogo ou log de mensagens.
- Dados financeiros são atualizados somente pelo backend/service role.
- Webhook Asaas exige token próprio, diferente da API Key.
- Eventos Asaas são persistidos por ID antes de processamento e podem ser reprocessados se houver falha.
- Redirecionamento de sucesso do checkout nunca é tratado como confirmação financeira.
- E-mails têm idempotência para reduzir risco de duplicidade em retries.

## Variáveis necessárias para implantação

### Supabase / Edge Functions

- `ASAAS_API_KEY`
- `ASAAS_BASE_URL` (`https://api-sandbox.asaas.com/v3` primeiro)
- `ASAAS_WEBHOOK_TOKEN`
- `APP_BASE_URL`
- `APP_ORIGIN`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `CRON_SECRET`

As variáveis nativas `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são usadas pelas Edge Functions.

## Gate atual de implantação

A conexão Supabase disponível no ChatGPT não está listando um projeto novo do Menos Bucho. Ela expõe somente os projetos existentes da YM/Raio-X. Por isso as migrations e Edge Functions **não foram aplicadas em produção** para evitar executar o app no banco errado.

Assim que o projeto correto aparecer na conexão Supabase:

1. aplicar migrations 0001–0004;
2. rodar advisors de segurança/performance;
3. publicar Edge Functions;
4. cadastrar secrets de sandbox;
5. configurar webhook Asaas autenticado;
6. testar compra avulsa e recorrente em sandbox;
7. trocar frontend de `local` para Supabase;
8. publicar preview;
9. só então promover para o domínio.

## Regra de produto

O aplicativo não promete emagrecimento específico nem substitui orientação profissional. O produto trabalha com construção de hábitos gerais e usa o histórico de execução para simplificar ou progredir a jornada dentro da biblioteca aprovada.

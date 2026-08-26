# MENOS BUCHO — MVP

Status: implementação preparada em branch isolada `feat/menos-bucho-mvp`. **Não publicar nem fazer merge em `main` antes do sandbox financeiro e da validação do Supabase.**

## Decisões validadas

- Produto: **Desafio Menos Bucho com Novos Hábitos**.
- Jornada individual de **30 dias**.
- Preço inicial: **R$ 19,90 por ciclo de 30 dias**.
- Checkout: **Asaas direto**, usando checkout hospedado pelo provedor.
- Compra avulsa: **Pix ou cartão**.
- Renovação automática: **opcional, mensal, por cartão**, com cancelamento pelo próprio portal.
- Banco/autenticação: **Supabase**.
- Relacionamento: **Resend**.
- Domínio inicial: preparado para `ymnegocios.com.br/MENOS_BUCHO/`.
- PWA: sim, sem depender de App Store ou Google Play.
- Personalização: regras + biblioteca aprovada. A IA não cria orientações de saúde livremente.

## Fluxo implementado

1. Pessoa acessa a página do Menos Bucho.
2. Informa o e-mail e escolhe:
   - 30 dias sem renovação automática; ou
   - renovação automática mensal.
3. O sistema cria checkout hospedado no Asaas.
4. O Asaas envia o evento financeiro para o webhook.
5. Pagamento confirmado antes da conta criada fica como `paid_unclaimed`.
6. Pessoa cria/entra na conta usando **o mesmo e-mail da compra**.
7. O banco reivindica o pagamento de forma atômica pelo e-mail autenticado.
8. Pessoa responde o diagnóstico inicial.
9. O banco cria os 3 desafios do dia usando a biblioteca aprovada.
10. Pessoa marca desafios, registra experiência e acompanha progresso.
11. O nível do dia seguinte pode diminuir ou subir conforme a execução anterior.
12. Nos últimos 7 dias, quem está em compra avulsa pode renovar antecipadamente.
13. Renovação paga antes do fim não encurta o ciclo atual: o próximo ciclo fica agendado para começar depois.
14. Quem ativou recorrência pode cancelá-la no portal sem perder o período já pago.

## Frontend

### `index.html`

Entrada comercial de produção:

- proposta do desafio;
- preço R$ 19,90;
- escolha entre compra avulsa e recorrência;
- captura do e-mail da compra;
- encaminhamento para checkout seguro do Asaas;
- estados de retorno de checkout.

### `acesso.html`

- autenticação por e-mail;
- compatível com código OTP e link mágico do Supabase;
- associação do pagamento confirmado à conta;
- estado de pagamento ainda em confirmação, evitando recompra desnecessária.

### `jornada.html`

- diagnóstico inicial;
- desafios do dia;
- conclusão por desafio;
- registro diário;
- execução acumulada;
- constância;
- status do ciclo;
- renovação nos últimos 7 dias;
- situação da renovação automática;
- cancelamento da renovação automática;
- preferências de e-mail.

### `prototype.html`

Protótipo local preservado para validação visual/lógica sem banco. Não é a porta de produção.

## Biblioteca de desafios

Arquivo local de referência: `assets/challenges.js`.

A biblioteca inicial possui desafios aprovados em seis categorias:

- hidratação;
- alimentação;
- movimento;
- sono;
- planejamento;
- bem-estar.

Cada item possui categoria, nível, tempo estimado e etiquetas de objetivo. A versão persistida é carregada pela migration `0004_seed_challenges.sql`.

## Motor adaptativo

A geração online fica no banco através de `mb_get_or_create_daily_plan()`.

Regras principais:

- 3 desafios por dia;
- prioriza os focos escolhidos no diagnóstico;
- prioriza itens compatíveis com o objetivo principal;
- tenta variar categorias;
- reduz repetição dos últimos 3 dias;
- respeita o tempo diário informado;
- se a execução do dia anterior ficar abaixo de 50%, reduz um nível;
- se ficar em 80% ou mais, pode subir um nível;
- nunca ultrapassa os níveis 1–3;
- o plano diário fica persistido, portanto recarregar a página não sorteia desafios diferentes.

## Banco Supabase

Migrations em `supabase/migrations`:

1. `0001_core.sql` — núcleo, RLS e auditoria.
2. `0002_billing_checkout.sql` — campos de reconciliação Asaas.
3. `0003_engagement_queue.sql` — versão inicial da fila de relacionamento.
4. `0004_seed_challenges.sql` — biblioteca aprovada.
5. `0005_renewal_scheduling.sql` — renovação pré-paga e promoção de ciclos agendados.
6. `0006_engagement_on_activation.sql` — dispara a régua apenas quando o ciclo realmente começa, às 09:00 em `America/Sao_Paulo`.
7. `0007_pre_auth_purchase.sql` — compra antes de criar conta.
8. `0008_claim_paid_access.sql` — reivindicação atômica do acesso pelo e-mail autenticado.
9. `0009_daily_plan_engine.sql` — motor adaptativo seguro no banco.
10. `0010_client_grants_and_update_hardening.sql` — grants/revokes e reforço das regras de propriedade.

### Tabelas principais

- `mb_profiles`
- `mb_onboarding`
- `mb_subscriptions`
- `mb_challenges`
- `mb_journeys`
- `mb_daily_plans`
- `mb_daily_plan_items`
- `mb_completions`
- `mb_daily_reflections`
- `mb_notification_preferences`
- `mb_message_log`
- `mb_billing_events`

## Edge Functions

### `create-checkout`

- aceita compra antes do login;
- exige e-mail válido;
- impede checkout duplicado recente;
- bloqueia nova compra se houver pagamento confirmado ainda não reivindicado;
- cria compra avulsa ou recorrência;
- usa checkout hospedado do Asaas;
- renovação manual só abre nos últimos 7 dias;
- usa data de São Paulo para vencimento inicial da recorrência.

### `asaas-webhook`

- valida `asaas-access-token`;
- grava cada evento antes do processamento;
- é idempotente por ID de evento;
- também é idempotente por ID da cobrança para não criar dois ciclos quando a mesma cobrança passa por `PAYMENT_CONFIRMED` e depois `PAYMENT_RECEIVED`;
- ativa acesso somente após evento financeiro válido;
- trata cobrança vencida/recusada;
- trata estorno/reversão;
- usa dia local de São Paulo;
- uma renovação antecipada cria ciclo `scheduled` em vez de encurtar o ciclo atual.

### `dispatch-emails`

- protegida por `CRON_SECRET`;
- envia por Resend;
- usa `Idempotency-Key` por mensagem;
- respeita preferências do usuário;
- diferencia a mensagem de renovação conforme o estado financeiro:
  - compra avulsa;
  - recorrência ativa;
  - recorrência com cobrança pendente.

### `cancel-subscription`

- exige usuário autenticado;
- cancela a assinatura no Asaas;
- interrompe cobranças futuras;
- preserva o período já pago;
- atualiza o estado local para impedir nova cobrança automática.

## Régua de relacionamento

Ao iniciar cada ciclo ativo, são programados e-mails para:

- dia 1;
- dia 3;
- dia 7;
- dia 14;
- dia 21;
- dia 27;
- dia 30.

Horário-base: **09:00 America/Sao_Paulo**.

Os dias 27 e 30 são adaptados ao status de renovação, para não pedir recompra a quem já está em recorrência automática.

### Resend

O domínio `ymnegocios.com.br` já está verificado no Resend e com envio habilitado. Sender sugerido para implantação:

`Menos Bucho <menosbucho@ymnegocios.com.br>`

## Segurança

- usuário não escreve diretamente em assinatura, cobrança, catálogo, jornada gerada ou log de mensagens;
- dados financeiros são alterados somente por backend/service role;
- tabelas estão com RLS;
- políticas de conclusão e reflexão validam a propriedade do plano/item;
- webhook Asaas usa token próprio;
- redirecionamento visual de checkout nunca libera acesso;
- eventos financeiros ficam auditados;
- e-mails têm idempotência;
- `config.js` público contém somente URL/chave publicável; segredos ficam nas Edge Functions;
- PWA não mantém `config.js` preso no cache para evitar configuração antiga após implantação.

## Configuração pública do frontend

`config.js` fica vazio enquanto o ambiente correto não estiver conectado.

Exemplo em `config.example.js`:

- `mode: 'supabase'`
- `supabaseUrl`
- `supabaseAnonKey`
- `createCheckoutUrl`
- `cancelSubscriptionUrl`

Nenhuma API key privada deve entrar nesse arquivo.

## Secrets necessários nas Edge Functions

- `ASAAS_API_KEY`
- `ASAAS_BASE_URL` — iniciar com `https://api-sandbox.asaas.com/v3`
- `ASAAS_WEBHOOK_TOKEN`
- `APP_BASE_URL`
- `APP_ORIGIN`
- `RESEND_API_KEY`
- `EMAIL_FROM` — sugerido `Menos Bucho <menosbucho@ymnegocios.com.br>`
- `CRON_SECRET`

As variáveis nativas `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` são usadas pelas Edge Functions.

## Autenticação Supabase

O frontend aceita dois formatos:

- código OTP de 6 dígitos;
- link mágico.

Se o template de e-mail do Supabase usar token, o usuário digita o código. Se usar link mágico, o redirect volta para `acesso.html`, a sessão é detectada e o pagamento é reivindicado automaticamente.

Antes de produção, incluir a URL final do Menos Bucho nas URLs permitidas do Auth.

## CI

Workflow: `.github/workflows/menos-bucho-ci.yml`.

Valida:

- sintaxe dos JavaScripts do navegador;
- TypeScript/Deno das Edge Functions;
- ausência básica de padrões de credenciais no `config.js` público.

O repositório possui workflows antigos que também disparam fora do `main` e podem falhar por motivos não relacionados ao Menos Bucho. O check relevante para este produto é **Menos Bucho CI**.

## Gate atual de implantação

A conexão Supabase disponível no ChatGPT ainda não lista um projeto separado do Menos Bucho. Ela expõe somente os projetos já existentes da YM/Raio-X. Para não misturar clientes, pagamentos ou políticas, nenhuma migration foi executada nesses bancos existentes.

Também não existe hoje um projeto Vercel separado do Menos Bucho.

### Assim que o Supabase correto aparecer na conexão

1. aplicar migrations `0001`–`0010` em ordem;
2. rodar advisors de segurança e performance;
3. publicar as 4 Edge Functions;
4. cadastrar os secrets em sandbox;
5. configurar URLs de Auth;
6. configurar webhook Asaas com token próprio;
7. programar o dispatcher de e-mails;
8. preencher `config.js` com os valores públicos;
9. testar compra avulsa por Pix;
10. testar compra avulsa por cartão;
11. testar recorrência por cartão;
12. testar `PAYMENT_CONFIRMED` + `PAYMENT_RECEIVED` da mesma cobrança;
13. testar estorno e cobrança recusada;
14. testar criação de conta após pagamento;
15. testar renovação antecipada nos últimos 7 dias;
16. testar cancelamento da recorrência mantendo o período pago;
17. publicar preview;
18. validar mobile/tablet/desktop;
19. só então promover a branch para `main` e apontar o domínio.

## Regra de produto

O aplicativo não promete perda de peso específica e não substitui acompanhamento profissional. O produto trabalha com construção de hábitos gerais de rotina e bem-estar. O texto livre do usuário é armazenado como contexto/reflexão, mas não é convertido automaticamente em prescrição médica, nutricional, psicológica ou de exercício.

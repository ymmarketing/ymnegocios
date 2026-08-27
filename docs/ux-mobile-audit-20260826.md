# Auditoria UX mobile — 26/08/2026

Critérios aplicados: viewport sem overflow horizontal global; leitura sem zoom; campos com 16px no mobile; áreas de toque confortáveis; grids colapsáveis; textos longos com quebra; tabelas/calendários densos com rolagem interna; modais/drawers usando o viewport real; desktop preservado.

## Camadas corrigidas
- Ambiente interno compartilhado (Central, CRM, MOTOR, Dashboard, Financeiro, Conteúdos, Identidade e demais páginas que usam `internal-shell.css`).
- MOTOR: tabs/etapas, perguntas, selects, cards, hipóteses, contexto do cliente e tabelas.
- Área do Cliente: cards, calendário, onboarding, jornada, formulários e componentes dinâmicos.
- Quem Somos: escala de leitura, grids, CTAs, filtros e rodapé no mobile.
- Home: auditada sem alteração estrutural nesta rodada, porque já é a referência aprovada de escala e navegação.

## Critério de aceite
- Nenhuma informação operacional depende de zoom do navegador.
- Nenhum texto necessário fica cortado lateralmente.
- Tabs longas quebram ou reorganizam em grade no MOTOR.
- Inputs/selects usam 16px no mobile para evitar zoom automático.
- Tabelas e calendários mantêm legibilidade com rolagem interna, sem ampliar a página inteira.

## HTMLs auditados pelo job
- `CENTRAL/index.html`
- `CRM/CENTRAL/index.html`
- `CRM/index.html`
- `Conteudos/index.html`
- `DASHBOARD/index.html`
- `FINANCEIRO/index.html`
- `Identidade/index.html`
- `MOTOR/index.html`
- `Ordem_certa.html`
- `VOS/index.html`
- `areadocliente/index.html`
- `areadocliente/redefinir/index.html`
- `identidade.html`
- `impacto/index.html`
- `impacto/politica/index.html`
- `index-minimo-producao.html`
- `index.html`
- `interno/index.html`
- `interno/redefinir/index.html`
- `quemsomos/index.html`
- `raio-x-app-base.html`
- `raio-x-app.html`
- `raio-x-teste.html`
- `raio-x-v3.1-approved.html`
- `raio-x-v3.1-integrado.html`
- `raio-x-validacao-2026-08-24.html`
- `raio-x-validacao-base-2026-08-24.html`
- `raio-x.html`

## HTMLs que receberam a nova camada
- `CENTRAL/index.html`
- `CRM/index.html`
- `Conteudos/index.html`
- `DASHBOARD/index.html`
- `FINANCEIRO/index.html`
- `Identidade/index.html`
- `MOTOR/index.html`
- `areadocliente/index.html`
- `interno/index.html`
- `interno/redefinir/index.html`
- `quemsomos/index.html`

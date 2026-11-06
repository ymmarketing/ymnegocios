# ETAPA 6 — STATUS TÉCNICO SITE + CANAIS YM

Data: 2026-08-08
Status: ARQUITETURA DE COMUNICAÇÃO + HOME CANDIDATA + TEXTOS DE CANAIS PRONTOS / VALIDAÇÃO VISUAL E PUBLICAÇÃO PENDENTES

## Fonte superior
Ecossistema Oficial de Marca — YM Marketing & Negócios — v1.0 — Agosto/2026.

## Entregue na branch
- `ETAPA6_BRAND_TOKENS_YM_V1.json`: tradução técnica da identidade oficial.
- `ETAPA6_MATRIZ_MENSAGENS_CANAIS_YM_V1.md`: núcleo comum + papel de Site/Instagram/LinkedIn/WhatsApp.
- `ETAPA6_CONFIG_CANAIS_YM_V1.md`: bios, descrições e CTAs candidatos, ainda não publicados.
- `site-v2-preview.html`: nova home candidata, `noindex,nofollow`, sem substituir `index.html`.
- CI `YM_ETAPA6_SITE_BRAND_GUARDRAILS_1.0` verde.

## Guardrails
- A YM é azul.
- Montserrat + Inter.
- Assinatura: `O marketing certo, na ordem certa.`
- Raio-X: R$97 + headline `Descubra seu Score da Jornada Digital.`
- Score não define causa, prioridade ou rota.
- Promessas legadas causais são rejeitadas pelo CI da nova home.
- Preços legados conflitantes são rejeitados.
- Site preview não é indexável.

## Não publicado
Nenhuma alteração foi feita no `index.html` de produção, CNAME, Instagram, LinkedIn ou WhatsApp.

## Gates restantes
1. Validação visual e de copy da home candidata.
2. Localizar/aplicar logo oficial no fechamento visual.
3. Confirmar links finais dos CTAs e canal da Leitura Inicial.
4. Atualizar canais reais somente após aceite.
5. Merge/publicação apenas com GO explícito.

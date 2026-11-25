# Mapa Digital YM: padrão de produção (v1, 25/11/2026)

O **Mapa Digital** substitui o Raio-X Digital (questionário de 25 perguntas). É a versão paga da
pré-análise pública (`/ym-pre-analise-publica`), feita a partir dos links que o cliente envia
depois do pagamento. Preço cheio R$ 97; Black Friday 2026: R$ 29,90. Entrega em **1 dia útil**,
**sempre com aprovação da Yasmin antes de o cliente receber o link**. Reunião de 30 minutos incluída.

Referência visual e de conteúdo: `preanalise_zirdigital/` (versão de 25/11/2026, com Google,
mercado e oportunidades). Tokens, estrutura base, regras de narrativa e QA: skill
`ym-pre-analise-publica`. Este documento lista só o que muda ou se soma na versão paga.

## Fluxo técnico

1. Cliente paga no checkout do Asaas (backend `ym-raiox-backend`, preço em `PRODUCT_PRICE`).
2. Formulário curto envia os links para a edge function `mapa-digital-intake`
   (Supabase `ym-raiox-production`, id `srzdikgztpdtwbggwniz`). Ela confere o pagamento, grava em
   `public.mapa_digital_pedidos` com status `RECEBIDO`, avisa a equipe e confirma ao cliente por e-mail.
3. A tarefa agendada "Mapa Digital: fila" pega um pedido por vez, gera a página e avisa a Yasmin.
4. A Yasmin revisa. Ao aprovar, ela mesma envia o link ao cliente pelo WhatsApp (link pronto na notificação).

Status: `RECEBIDO` → `EM_GERACAO` → `AGUARDANDO_APROVACAO` → `APROVADO` / `ENTREGUE`
(ou `ERRO`, `CANCELADO`). Pedidos com `is_test = true` são testes.

SQL de apoio:

```sql
-- próximo pedido
select * from public.mapa_digital_pedidos
where status = 'RECEBIDO'
   or (status = 'EM_GERACAO' and generation_started_at < now() - interval '3 hours' and attempts < 3)
order by created_at limit 1;

-- reservar
update public.mapa_digital_pedidos
set status = 'EM_GERACAO', attempts = attempts + 1, generation_started_at = now()
where id = '<id>';

-- pronto para aprovação
update public.mapa_digital_pedidos
set status = 'AGUARDANDO_APROVACAO', page_slug = '<slug>', page_url = '<url>', ready_at = now(), review_notes = '<limites>'
where id = '<id>';
```

## Página

- Caminho: `mapa/<empresa-em-minusculas-sem-acento>-<6 hex aleatórios>/index.html` + `img/`, no repo
  `ymmarketing/ymnegocios` (GitHub Pages, push na `main`). URL: `https://ymnegocios.com.br/mapa/<slug>/`.
- `meta robots noindex, nofollow`; fora do sitemap; `/mapa/` está no `robots.txt` como Disallow.
- Script `/assets/ym-analytics.js`; rodapé "Desenvolvido por YM Marketing e Negócios" com link.
- Chip do topo: **"Mapa Digital YM"** (nunca "cortesia", "gratuita" ou "pré Raio-X"). Rótulo do cabeçalho: "Mapa Digital".
- O cliente informou **objetivo, segmento e cidade**: use-os para orientar os cenários e o plano,
  ainda em linguagem condicional. Continua valendo "o que existe funciona" e o bloco de limites.

### Seções obrigatórias (ordem)

1. Hero (o que já faz bem + "veja onde dá para ir mais longe" + preparado para <empresa> em <data>).
2. Resumo VOS (Ver, Ordenar, Sustentar) + tese.
3. **Google: onde a indicação é conferida.** Prints reais (busca pelo nome, busca pela categoria +
   cidade, Google Maps), mockup do Perfil da Empresa e "Por que isso importa" com fontes
   (Google: relevância, distância e destaque; perfil completo e confiança). Se a empresa já tiver
   perfil, mostre nota, avaliações e o que pode evoluir.
4. Pergunta que organiza (cenários A, B e C) + perguntas para a conversa.
5. Termômetro dos 7 pilares (sem nota numérica).
6. O que já funciona.
7. 5 a 6 evidências: print real "Hoje" + "Possibilidade" ilustrativa + "Para pensar" + **"Por que importa"**.
8. Varredura pública com pílulas Ponto forte / Possibilidade / Conferir / **Oportunidade de criação**.
9. **Pesquisa de mercado**: concorrentes locais observados no Google e no Instagram (nota, avaliações,
   como se apresentam, onde vendem) + como o cliente desse segmento decide, com fontes. Pesquisa
   estrangeira deve ser rotulada como tal.
10. **O que não encontramos vira oportunidade de criação** (cartões).
11. Se o objetivo for crescer (destino pronto, prova reunida, medição + ponto de atenção regulatório do setor).
12. Caminho de 90 dias VOS.
13. Limites da leitura.
14. CTA único: **"Agendar a conversa de 30 minutos (incluída)"**, WhatsApp (31) 97507-3862, mensagem
    "Olá, Yasmin! Recebi o Mapa Digital da <empresa> e quero agendar a conversa de 30 minutos."
15. Fontes no rodapé.

## Cuidados

- Prints do Google: recortar localização pessoal ("Casa", bairro de quem buscou) e avatar.
- Instagram: **não abrir stories nem destaques** (o Instagram mostra quem visualizou).
- Não enviar mensagem, não preencher formulário do cliente; links de WhatsApp só abertos, nunca enviados.
- Sem dado pessoal de pacientes/clientes do cliente; mockups com placeholders entre colchetes.
- Sem estatística inventada; toda afirmação com fonte; amostras pequenas rotuladas.
- Varredura de palavras de julgamento antes de publicar (errad, frágil, gargalo, falta, antes/depois, direção sugerida, falha).

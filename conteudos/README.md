# Publicar conteúdos no site YM

Esta área reúne artigos públicos em `/conteudos/`. Cada texto tem uma URL própria, título descritivo, resumo para busca, endereço canônico e link para a avaliação inicial. O script gera também o índice e o sitemap.

## Novo texto

1. Crie `conteudos/fontes/assunto.md`, seguindo o formato dos arquivos existentes.
2. Use uma pergunta real no campo `title` e responda diretamente no primeiro parágrafo. Escreva orientações concretas e exemplos identificados como exemplos. Publique casos de clientes apenas com autorização e dados conferidos.
3. Preencha `description` (resumo específico), `slug` (minúsculas e hífens), `category` e `published` (AAAA-MM-DD). Em revisões posteriores, mantenha `published` e acrescente `modified`.
4. Rode `python3 scripts/gerar_conteudos.py` e revise o artigo, o índice e os links. Envie junto os arquivos gerados na mesma publicação do site.

Os textos publicados são arquivos do site. Esta versão não tem painel de edição no navegador. A home destaca três artigos; o índice lista automaticamente todos os textos publicados. A avaliação inicial continua sendo o único próximo passo comercial dentro de cada artigo.

# ETAPA 3 — Raio-X v3.1 integrado

Status: **CANDIDATO EM BRANCH / NÃO PUBLICAR AINDA**

## Fonte metodológica
A base usada é o `ym_raiox.PATCHED_v3.1.html` aprovado, validada por SHA-256 antes de cada build.

## Integrações adicionadas
- pagamento real pelo backend já existente;
- gate servidor antes de abrir/gerar;
- retomada por `ref`;
- contingência por código manual existente;
- persistência `VOS_INTAKE_1.0` no Supabase staging;
- nenhuma chamada ao endpoint legado `/api/relatorio` no novo fluxo.

## Governança
- `raio-x.html` nesta branch já representa a candidata integrada;
- a versão anterior foi preservada em `90_LEGADO_E_REFERENCIAS` com o mesmo blob SHA do `main` atual;
- `main` e o site público continuam intocados;
- CI reconstrói a v3.1 por hash, gera a candidata, verifica sintaxe, testa gate/persistência e impede o bypass conhecido de pagamento.

## Gate de produção
Somente após homologação integrada e GO explícito da responsável pelo produto.

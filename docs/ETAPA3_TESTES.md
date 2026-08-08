# Testes automáticos da candidata

O workflow `.github/workflows/vos-etapa3-build-v31.yml` executa, na branch técnica:

1. reconstrução da v3.1 aprovada com verificação do SHA-256;
2. build determinístico da candidata integrada;
3. `node --check` dos módulos de pagamento e persistência;
4. testes determinísticos do gate de pagamento e da persistência;
5. verificações estáticas de versões, `route_signal=null`, validação humana e ausência do bypass conhecido;
6. preparação de `raio-x.html` apenas na branch, preservando o arquivo anterior em legado.

A homologação positiva com pagamento real não é automatizada porque o Asaas configurado está em produção e não deve gerar cobrança de teste sem um gate explícito.
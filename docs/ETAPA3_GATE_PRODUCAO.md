# Gate de produção — NÃO EXECUTADO

Pré-condições para merge/publicação:
- CI verde na branch técnica;
- validação visual/funcional em ambiente controlado;
- homologação do fluxo real de pagamento sem cobrança acidental;
- confirmação do destino de dados de produção no Supabase;
- GO explícito da responsável pelo produto.

Enquanto essas condições não forem atendidas, `main` permanece inalterado.
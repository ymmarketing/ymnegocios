# Raio-X YM em contingência - Google Sheets + Apps Script

Esta é uma coleta interna para usar quando o fluxo normal do site não estiver disponível ou quando a conversa acontecer ao vivo. A [planilha nativa](https://docs.google.com/spreadsheets/d/1lN_sXfSsLSH4XUkwC-lRv23BWYN22TaBacFL54ExyYc/edit) já contém uma **Calculadora** utilizável sem script. As abas Avaliações, Respostas e Números são preenchidas pelo Apps Script.

## Ativação uma única vez no computador

1. Abra a planilha acima com a conta proprietária.
2. **Extensões → Apps Script**. Substitua o conteúdo de `Code.gs` pelo [Code.gs deste diretório](./Code.gs). Adicione um arquivo HTML com o nome exato **Formulario** e cole [Formulario.html](./Formulario.html).
3. Salve; selecione `instalar` no editor e execute. Autorize acesso **à própria planilha** quando o Google solicitar.
4. Recarregue a planilha. Use **YM Raio-X → Nova avaliação**. Preencha empresa, responsável e WhatsApp; os demais dados podem ficar em branco. Ao salvar, o formulário gera ID, 18 respostas, premissas e resumo imprimível.
5. Para usar no navegador do celular, publique **Implantar → Nova implantação → Aplicativo da Web**, com **Executar como: eu** e **Quem tem acesso: somente eu**. Abra a URL fornecida pelo Apps Script na mesma conta. Não use acesso público.

O conector disponível neste ambiente cria a planilha, mas não cria nem vincula projetos Apps Script. Os passos 2 a 5 exigem o login da proprietária no editor do Google. **O script está preparado e validado sintaticamente, ainda não executado no ambiente Google.**

## O que a contingência faz

- Coleta as mesmas 18 perguntas da versão oficial do questionário, com as escolhas e textos correspondentes.
- Registra respostas parciais sem transformá-las em zero. Identifica quantas perguntas faltam.
- Captura os números do CDD, CAC, LTV simplificado de margem e ROI de um cenário. Se faltar dado, mostra lacuna, sem fabricar resultado.
- Calcula faturamento atual → cenário, custo operacional atual → cenário e variação em pontos percentuais **em blocos separados**.
- Gera um resumo imprimível. Não cobra, não valida pagamento, não gera o Score oficial e não promete receita/economia.

## Relação com o CRM

O ID `RX-C-...` é uma referência local de contingência. A planilha **não cria automaticamente uma oportunidade no CRM**. Depois da reunião, cadastre ou localize o contato no CRM e registre o ID no histórico da oportunidade antes de migrar respostas. Não trate a pessoa como cliente contratado por ter respondido ao Raio-X.

## Controles de acesso e dados

Mantenha a planilha privada, sob a conta YM. O formulário Web App deve ficar restrito a **somente eu**. Dados de contato e respostas ficam no Google Drive da conta; o fluxo oficial do site usa outra persistência. Não cole tokens, chaves ou credenciais de produção no código.

## Validação antes de usar com cliente

1. Crie avaliação fictícia com nome claramente de teste, as 18 perguntas e o exemplo do [guia de KPIs](../docs/GUIA_KPIS_CDD_REUNIAO_2026-09-29.md).
2. Confirme três linhas/abas e o resumo: R$ 40.000 → R$ 44.000; custo R$ 200 → R$ 160; CAC R$ 187,50; LTV R$ 6.000; ROI hipotético 100%.
3. Apague a avaliação fictícia das três abas, se não quiser mantê-la como amostra.
4. Faça outra avaliação com vários números vazios; o resumo deve mostrar lacunas, não perdas inventadas.

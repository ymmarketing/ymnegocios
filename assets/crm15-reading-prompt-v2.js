(() => {
  const BUILD = '2026-08-20-reading-v2';

  function text(v) {
    return String(v ?? '').trim();
  }

  function buildReadingPrompt(o) {
    const c = o?.contact || {};
    const humanNote = o?.initial_reading_human_notes || document.getElementById('rin_' + o?.id)?.value || '';

    return `EXECUTE DIRETAMENTE ESTA PROSPECÇÃO DA YM MARKETING & NEGÓCIOS.

OBJETIVO DESTA COLAGEM NO CHATGPT
Entregue, no mesmo atendimento, DUAS SAÍDAS:
1) primeiro, escreva as mensagens prontas de prospecção para WhatsApp, LinkedIn e Instagram;
2) depois, gere a IMAGEM FINAL da leitura de 1 página pronta para envio ao potencial cliente.

Não mostre raciocínio, prompt, checklist, briefing interno ou etapas de construção. Não peça confirmação se os dados abaixo forem suficientes. Use a ferramenta de geração de imagem para produzir a peça final.

DADOS DO CRM
EMPRESA: ${text(c.business_name || c.name)}
DECISOR: ${text(c.decision_maker || c.name)}
CARGO / CONTEXTO DO DECISOR: ${text(c.decision_maker_role || c.role || '')}
SEGMENTO: ${text(c.segment)}
CIDADE / UF: ${text(c.city_state)}
TEMPO / ANO DE MERCADO: ${text(c.foundation_year)}
SITE: ${text(c.website_url)}
INSTAGRAM: ${text(c.instagram_url)}
LINKEDIN: ${text(c.linkedin_url)}
CANAL RECOMENDADO: ${text(c.recommended_channel)}
SINAL PÚBLICO OBSERVADO: ${text(c.public_signal)}
OPORTUNIDADE A VALIDAR: ${text(c.opportunity_to_validate)}
ÂNGULO DE ABORDAGEM: ${text(c.approach_angle)}
OFERTA / CONTEXTO: ${text(c.offer_summary)}
NOTAS DO CONTATO: ${text(c.notes)}
NOTAS DA OPORTUNIDADE: ${text(o?.notes)}
PRIMEIRA PERCEPÇÃO HUMANA: ${text(humanNote)}

REGRA CENTRAL
Esta é uma leitura de aproximação comercial, não uma auditoria e não um diagnóstico conclusivo. Use somente os dados fornecidos acima e sinais públicos que estejam explicitamente descritos neles. Não invente faturamento, clientes, processos internos, resultados, conversão, perdas de leads, métricas ou causas.

A pessoa deve se reconhecer primeiro no que JÁ CONSTRUIU. A leitura deve gerar identificação, curiosidade e vontade de aprofundar — nunca sensação de acusação.

NÃO USE COMO TÍTULO OU ENQUADRAMENTO PARA O CLIENTE palavras como: problema, erro, falha, fraqueza, desorganização, causa-raiz, gargalo ou diagnóstico. Não diga que a empresa “está fazendo errado”, “não funciona”, “perde clientes” ou equivalentes.

ESTRUTURA VISUAL OBRIGATÓRIA DA IMAGEM
- Formato: uma página vertical, clean, premium, legível no celular e pronta para envio.
- Identidade YM: fundo claro, azul-marinho/índigo, detalhes em laranja, cards arredondados, tipografia moderna e bastante respiro.
- O maior título no topo deve ser SOMENTE O NOME DA EMPRESA. Não use “Leitura Inicial” como título principal.
- A marca YM deve aparecer de forma discreta para assinar a peça. Se o logo oficial YM estiver disponível no contexto do chat, use-o. Se não estiver, não invente uma logo: use apenas a assinatura textual “YM Marketing & Negócios”.
- O nome do decisor NÃO entra na imagem.
- Mantenha no topo uma composição visual bonita com notebook + smartphone e interfaces DIGITAIS GENÉRICAS que remetam a site, Instagram e WhatsApp.
- O mockup é sempre genérico. NÃO use, capture, reproduza ou simule o site, Instagram, WhatsApp, LinkedIn, logo, fotos ou telas reais do prospect dentro do mockup.
- Nenhuma tela genérica pode parecer uma captura real da empresa.

TEXTO DA IMAGEM
Subtítulo abaixo do nome da empresa: “Uma leitura rápida da jornada que existe por trás da sua presença digital.”

Introdução: no máximo 35 palavras. Mostre que a leitura parte do que a empresa já construiu e observa como os ativos podem trabalhar juntos.

BLOCO 1 — título fixo:
“O que já fortalece sua presença”
Conteúdo: destaque 2 a 4 ativos positivos realmente sustentados pelos dados do CRM. A primeira sensação deve ser: “eles perceberam o que eu já construí”. Máximo 50 palavras.

BLOCO 2 — título fixo:
“Como sua jornada pode ganhar ainda mais força”
Conteúdo: traga UMA hipótese de conexão, sequência ou aproveitamento entre os ativos. Use linguagem de possibilidade: “pode”, “vale observar”, “quando essas partes se conectam”, “existe espaço para”. Não conclua problema interno. Máximo 50 palavras.

BLOCO 3 — título fixo:
“O que seus clientes valorizam na decisão”
O TÍTULO permanece sempre genérico. Dentro do texto, personalize a categoria somente quando o segmento permitir com segurança: pacientes, empresas contratantes, alunos, clientes etc. Se não houver certeza, use “clientes”. Relacione confiança, clareza, compreensão da oferta e próximo passo ao contexto do negócio. Máximo 45 palavras.

BLOCO 4 — título fixo:
“O próximo nível dessa jornada”
Conteúdo: preserve + conecte + organize + aproveite melhor o que já existe. Não proponha refazer tudo e não prometa faturamento ou quantidade de clientes. Máximo 45 palavras.

CTA — título fixo:
“Quer olhar essa jornada com mais profundidade?”
Explique de forma curta que o Raio-X Estratégico YM aprofunda a leitura para mostrar patrimônios, oportunidades e prioridades da jornada do negócio. Não diga que descobre exatamente o que trava o crescimento.

Rodapé discreto:
“Marketing certo, na ordem certa.”
“Leitura construída a partir de informações públicas e dados de prospecção disponíveis. Não representa uma auditoria completa.”

MENSAGENS DE PROSPECÇÃO — GERAR ANTES DA IMAGEM
Crie 3 versões prontas: WhatsApp, LinkedIn e Instagram.
- Se DECISOR estiver preenchido, comece usando o primeiro nome de forma natural.
- Se DECISOR estiver vazio, use saudação neutra. Nunca invente nome.
- As três mensagens devem contar a MESMA história e manter o mesmo posicionamento; varie apenas tamanho e ritmo do canal.
- Personalize com pelo menos um dado concreto do CRM, sem elogio vazio.
- Diga que você preparou uma leitura rápida a partir do que a empresa já construiu publicamente.
- O framing deve ser positivo: observar o que já existe e como as partes podem trabalhar ainda melhor juntas.
- A leitura já será enviada junto da mensagem. Não pergunte “posso enviar?”. Use algo como “Estou te enviando aqui. 👇”.
- O fechamento deve gerar curiosidade pelo Raio-X Estratégico, sem pressão e sem afirmar que existe um problema.
- Não use Score Digital na prospecção.

ORDEM FINAL DE ENTREGA NO CHAT
A) Mostre primeiro as três mensagens prontas, claramente separadas por canal.
B) Em seguida, gere a imagem final da peça usando a estrutura acima.
C) Depois de gerar a imagem, não acrescente explicações sobre a arte.

Antes de executar, valide silenciosamente:
- a empresa se reconhece antes de conhecer a YM;
- a peça começa pelo que já existe de positivo;
- nenhuma hipótese virou fato;
- não há termos acusatórios;
- o mockup é genérico e não usa telas do cliente;
- o nome do decisor aparece somente nas mensagens;
- o conteúdo da peça é personalizado com os dados disponíveis;
- as mensagens e a imagem conduzem naturalmente ao Raio-X.
`;
  }

  async function copyPrompt(id) {
    try {
      const source = typeof crm !== 'undefined' ? crm : null;
      const o = source?.opportunities?.find((x) => x.id === id);
      if (!o) {
        window.YM?.toast?.('Não foi possível localizar os dados deste lead.', true);
        return;
      }
      await navigator.clipboard.writeText(buildReadingPrompt(o));
      window.YM?.toast?.('Prompt completo copiado. Cole no ChatGPT para gerar imagem + mensagens.');
    } catch (error) {
      console.error(BUILD, error);
      window.YM?.toast?.('Não foi possível copiar automaticamente.', true);
    }
  }

  function patchButtons() {
    document.querySelectorAll('button[onclick*="copyReadingPrompt"]').forEach((button) => {
      button.textContent = 'Gerar Leitura';
      button.title = 'Copia o prompt completo para gerar a imagem e as mensagens no ChatGPT';
      button.dataset.readingPromptV2 = '1';
    });
  }

  function install() {
    window.copyReadingPrompt = copyPrompt;
    window.promptReading = buildReadingPrompt;
    window.YMReadingPromptV2 = { buildReadingPrompt, version: BUILD };
    patchButtons();

    const list = document.getElementById('leadList');
    if (list) {
      new MutationObserver(() => requestAnimationFrame(patchButtons)).observe(list, {
        childList: true,
        subtree: true
      });
    }
    setInterval(patchButtons, 1200);
  }

  function waitForCRM(attempt = 0) {
    if (typeof window.copyReadingPrompt === 'function' && document.getElementById('leadList')) {
      install();
      return;
    }
    if (attempt > 80) {
      console.warn(BUILD, 'CRM não ficou pronto a tempo para instalar o prompt v2.');
      return;
    }
    setTimeout(() => waitForCRM(attempt + 1), 100);
  }

  waitForCRM();
})();

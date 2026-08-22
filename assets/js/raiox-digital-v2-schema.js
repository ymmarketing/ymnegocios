/* YM Raio-X Digital 2.0 — schema de questionário e evidências
 * Branch de desenvolvimento. NÃO ligado ao fluxo de produção.
 * Objetivo: manter base de negócio, mas tornar presença/jornada digital a camada principal.
 */
(function(root){
  'use strict';

  var NA='Não sei / não tenho essa informação';
  var CHANNELS=['Instagram','LinkedIn','Google Perfil da Empresa','Site / landing page','WhatsApp Business','YouTube','TikTok','E-mail','Outro'];

  var Q=[
    {id:'RXD01',field_id:'META_CLIENT_NAME',block:'BASE_NEGOCIO',t:'text',required:true,q:'Como você se chama?',ph:'Seu nome'},
    {id:'RXD02',field_id:'BUSINESS_NAME',block:'BASE_NEGOCIO',t:'text',required:true,q:'Qual o nome do seu negócio?',ph:'Nome da empresa / marca'},
    {id:'RXD03',field_id:'BUSINESS_SEGMENT_PROMISE',block:'BASE_NEGOCIO',t:'textarea',required:true,q:'Em poucas palavras: o que seu negócio faz e que resultado ajuda o cliente a alcançar?',ph:'Ex.: consultoria de RH que ajuda pequenas empresas a estruturar pessoas e processos'},
    {id:'RXD04',field_id:'SERVICE_MODE_LOCATION',block:'BASE_NEGOCIO',t:'textarea',required:true,q:'Onde e como você atende ou vende hoje?',ph:'Cidade/região, online ou presencial, B2B/B2C quando fizer sentido'},
    {id:'RXD05',field_id:'MAIN_OFFERS',block:'BASE_NEGOCIO',t:'textarea',required:true,q:'Quais são hoje seus principais produtos ou serviços?',ph:'Liste apenas as ofertas mais importantes e, se quiser, faixa de preço'},
    {id:'RXD06',field_id:'TARGET_AUDIENCE',block:'BASE_NEGOCIO',t:'textarea',required:true,q:'Quem você quer atrair e vender com mais frequência?',ph:'Perfil de cliente, tipo de empresa, momento, necessidade ou contexto'},

    {id:'RXD07',field_id:'DIGITAL_CHANNELS_ACTIVE',block:'PRESENCA_DIGITAL',t:'multi',required:true,q:'Quais canais digitais o seu negócio usa hoje?',options:CHANNELS},
    {id:'RXD08',field_id:'DIGITAL_CHANNELS_LINKS',block:'PRESENCA_DIGITAL',t:'channel_links',required:true,q:'Informe os links ou @ dos canais que você usa.',depends_on:'RXD07'},
    {id:'RXD09',field_id:'DIGITAL_PRIMARY_CHANNEL',block:'PRESENCA_DIGITAL',t:'channel_primary',required:true,q:'Qual desses canais mais gera conversas ou oportunidades hoje?',depends_on:'RXD07',allow_na:true},
    {id:'RXD10',field_id:'DIGITAL_POSITIONING_CLARITY_SCORE',block:'PRESENCA_DIGITAL',t:'score',score:true,journey:'Entender',axis:'Posicionamento digital',q:'Ao entrar nos seus canais, a pessoa entende rapidamente o que você faz, para quem é e qual transformação oferece?',options:['Não fica claro','Quase sempre precisa perguntar o básico','Entende uma parte, mas ainda ficam dúvidas','Entende bem na maior parte dos canais','Entende com clareza e encontra a mesma mensagem nos principais canais']},
    {id:'RXD11',field_id:'DIGITAL_PROFILE_COMPLETENESS_SCORE',block:'PRESENCA_DIGITAL',t:'score',score:true,journey:'Entender',axis:'Presença e canais',q:'Seus perfis ou páginas principais têm informações essenciais completas e atualizadas?',options:['Estão incompletos ou desatualizados','Só o básico está preenchido','Alguns canais estão completos e outros não','Os principais canais estão completos','Os principais canais estão completos, coerentes e revisados']},
    {id:'RXD12',field_id:'DIGITAL_DISCOVERABILITY_SCORE',block:'PRESENCA_DIGITAL',t:'score',score:true,journey:'Encontrar',axis:'Presença e canais',q:'Hoje, alguém que ainda não conhece sua empresa consegue encontrá-la com facilidade no digital?',options:['É difícil encontrar','Depende quase sempre de indicação ou link direto','Apareço em alguns lugares, mas sem consistência','Sou encontrado nos canais principais','Sou encontrado e acompanho quais pontos de entrada geram oportunidades']},
    {id:'RXD13',field_id:'DIGITAL_CHANNEL_COHERENCE_SCORE',block:'PRESENCA_DIGITAL',t:'score',score:true,journey:'Entender',axis:'Posicionamento digital',q:'A mensagem, identidade e oferta parecem pertencer à mesma empresa quando alguém passa de um canal para outro?',options:['Os canais parecem desconectados','Há diferenças grandes entre eles','Existe alguma coerência, mas ainda oscila','Os principais canais são coerentes','Os canais são coerentes e cumprem papéis complementares na jornada']},
    {id:'RXD14',field_id:'DIGITAL_CTA_VISIBILITY_SCORE',block:'PRESENCA_DIGITAL',t:'score',score:true,journey:'Avançar',axis:'Conversão',q:'Está claro nos seus canais qual é o próximo passo para pedir informação, orçamento, agendar ou comprar?',options:['Não existe um próximo passo claro','A pessoa precisa procurar ou perguntar','Existe CTA, mas varia ou some em alguns pontos','O próximo passo está claro nos canais principais','O próximo passo está claro, fácil e é acompanhado']},

    {id:'RXD15',field_id:'CONTENT_ROUTINE_SCORE',block:'CONTEUDO_AUTORIDADE',t:'score',score:true,journey:'Encontrar',axis:'Conteúdo e autoridade',q:'Sua empresa mantém uma rotina de comunicação nos canais que realmente usa?',options:['Quase não publico','Publico raramente','Publico, mas sem frequência definida','Tenho uma rotina de comunicação','Tenho rotina e planejamento com objetivos definidos']},
    {id:'RXD16',field_id:'CONTENT_STRATEGY_SCORE',block:'CONTEUDO_AUTORIDADE',t:'score',score:true,journey:'Entender',axis:'Conteúdo e autoridade',q:'O conteúdo que você publica tem temas e objetivos claros, ou costuma nascer mais do que aparece no dia?',options:['Não tenho estratégia de conteúdo','Quase tudo nasce no improviso','Tenho alguns temas, mas sem função clara','Tenho temas e objetivos definidos','Tenho temas, objetivos e acompanho o papel do conteúdo na jornada']},
    {id:'RXD17',field_id:'AUTHORITY_VISIBILITY_SCORE',block:'CONTEUDO_AUTORIDADE',t:'score',score:true,journey:'Confiar',axis:'Conteúdo e autoridade',q:'A experiência, método, especialização ou autoridade de quem entrega o serviço aparece com clareza no digital?',options:['Quase não aparece','Aparece pouco e de forma solta','Aparece em alguns conteúdos ou páginas','Está visível nos principais pontos de contato','Está visível e é conectada de forma consistente à oferta e à prova']},
    {id:'RXD18',field_id:'PROOF_AVAILABILITY_SCORE',block:'CONTEUDO_AUTORIDADE',t:'score',score:true,journey:'Confiar',axis:'Prova e confiança',q:'Você já possui provas do trabalho realizado — avaliações, depoimentos, cases, resultados ou exemplos?',options:['Não tenho provas reunidas','Tenho poucas ou estão espalhadas','Tenho algumas reunidas','Tenho provas organizadas e atuais','Tenho diferentes tipos de prova, organizados e prontos para uso']},
    {id:'RXD19',field_id:'PROOF_VISIBILITY_SCORE',block:'CONTEUDO_AUTORIDADE',t:'score',score:true,journey:'Confiar',axis:'Prova e confiança',q:'Essas provas aparecem no digital antes de o cliente precisar pedir referência?',options:['Não aparecem','Só mostro quando pedem','Aparecem em alguns lugares','Aparecem nos principais pontos de decisão','Aparecem de forma intencional em diferentes etapas da jornada']},
    {id:'RXD20',field_id:'CONTENT_ACTION_SCORE',block:'CONTEUDO_AUTORIDADE',t:'score',score:true,journey:'Avançar',axis:'Conteúdo e autoridade',q:'Seu conteúdo costuma conduzir a algum próximo passo coerente com o tema?',options:['Não conduz a nenhum próximo passo','Raramente tem CTA','Tem CTA em alguns conteúdos, mas sem padrão','O conteúdo costuma indicar um próximo passo claro','O próximo passo varia de forma intencional conforme o objetivo do conteúdo']},

    {id:'RXD21',field_id:'VALUE_COMMUNICATION_SCORE',block:'CONVERSAO_RELACIONAMENTO',t:'score',score:true,journey:'Entender',axis:'Conversão',q:'Antes ou durante o contato digital, a pessoa consegue entender o que recebe e por que a solução tem valor?',options:['Quase sempre preciso começar a explicação do zero','A explicação muda muito de uma conversa para outra','Existe uma apresentação básica, mas ainda gera muitas dúvidas','A proposta de valor fica clara na maior parte dos contatos','A proposta de valor é clara e as principais dúvidas são acompanhadas']},
    {id:'RXD22',field_id:'DIGITAL_HANDOFF_SCORE',block:'CONVERSAO_RELACIONAMENTO',t:'score',score:true,journey:'Avançar',axis:'Conversão',q:'Quando alguém demonstra interesse no digital, existe um caminho claro até conversa, orçamento, agenda ou compra?',options:['Cada pessoa encontra um caminho diferente','O contato depende de ela procurar como falar comigo','Existe um caminho, mas ainda tem atritos','O caminho é simples e costuma funcionar','O caminho é simples e eu acompanho onde as pessoas avançam ou desistem']},
    {id:'RXD23',field_id:'SALES_RESPONSIBILITY_SCORE',block:'CONVERSAO_RELACIONAMENTO',t:'score',score:true,journey:'Avançar',axis:'Relacionamento',q:'Está definido quem recebe o contato digital e quem conduz a oportunidade até a venda?',options:['Não está definido','Quem estiver disponível atende','Uma pessoa costuma cuidar, mas sem substituição clara','Está definido quem cuida e quem pode substituir','Responsabilidades, prazos e orientações estão definidos']},
    {id:'RXD24',field_id:'FOLLOWUP_CRM_SCORE',block:'CONVERSAO_RELACIONAMENTO',t:'score',score:true,journey:'Sustentar',axis:'Relacionamento',q:'Quando alguém não fecha na hora, existe follow-up e registro do que aconteceu?',options:['Não faço follow-up nem registro','Faço quando lembro','Faço às vezes, mas sem registro consistente','Costumo fazer follow-up e registrar','Follow-up, motivo de perda e próxima ação fazem parte da rotina']},
    {id:'RXD25',field_id:'SOURCE_TRACKING_SCORE',block:'CONVERSAO_RELACIONAMENTO',t:'score',score:true,journey:'Sustentar',axis:'Medição',q:'Você registra de qual canal veio cada lead ou oportunidade?',options:['Não registro','Tenho uma ideia, mas não marco','Registro em parte dos casos','Registro a origem na maior parte dos casos','Registro e comparo quais origens geram mais avanço e receita']},
    {id:'RXD26',field_id:'DIGITAL_METRICS_SCORE',block:'CONVERSAO_RELACIONAMENTO',t:'score',score:true,journey:'Sustentar',axis:'Medição',q:'Você acompanha números que ligam o digital ao negócio, e não apenas alcance ou seguidores?',options:['Não acompanho números','Olho principalmente visualizações/seguidores','Acompanho alguns contatos ou cliques','Acompanho leads, oportunidades ou vendas além das métricas de canal','Comparo origem, avanço, conversão e receita para tomar decisões']},

    {id:'RXD27',field_id:'CAPACITY_CURRENT_USE',block:'CONTEXTO_DESTINO',t:'textarea',required:true,q:'Em média, quantos clientes ou projetos você consegue atender por mês e quanto dessa capacidade já costuma usar?',ph:'Pode responder em clientes, projetos, atendimentos ou outra unidade que faça sentido'},
    {id:'RXD28',field_id:'PATRIMONY_STRENGTHS',block:'CONTEXTO_DESTINO',t:'textarea',required:true,q:'O que já funciona bem no seu negócio e você considera um ativo que não abriria mão?',ph:'Método, reputação, clientes, equipe, processo, canal, marca, prova, tecnologia etc.'},
    {id:'RXD29',field_id:'DIFFICULTY_AND_ATTEMPTS',block:'CONTEXTO_DESTINO',t:'group_textarea',required:true,q:'Na sua visão, qual é a principal dificuldade hoje e o que você já tentou fazer para resolver?',fields:[{key:'difficulty',label:'Principal dificuldade'},{key:'attempts',label:'O que já tentou e qual foi o resultado'}]},
    {id:'RXD30',field_id:'DESTINATION_AND_SUCCESS',block:'CONTEXTO_DESTINO',t:'group_textarea',required:true,q:'Pensando nos próximos 90 dias, qual resultado você quer alcançar e como saberá que houve melhora?',fields:[{key:'destination',label:'Resultado desejado'},{key:'success_signal',label:'O que você conseguirá perceber, contar ou medir'}]}
  ];

  var EVIDENCE={
    version:'RX_EVIDENCE_1.0',
    title:'Evidências da sua presença digital',
    intro:'Envie prints dos canais que você realmente usa. Eles serão analisados como evidência visual e cruzados com suas respostas.',
    channel_rules:{
      'Instagram':{required_if_selected:true,label:'Print do perfil do Instagram',instruction:'Envie um print que mostre foto, nome/@, bio, link, destaques e o início do feed. Não envie Direct.'},
      'LinkedIn':{required_if_selected:true,label:'Print do LinkedIn',instruction:'Pode ser a página da empresa ou o perfil profissional usado para vender. Mostre o topo do perfil, headline/sobre quando possível e elementos de prova.'},
      'Google Perfil da Empresa':{required_if_selected:true,label:'Print do Google Perfil da Empresa',instruction:'Mostre nome, categoria, nota/avaliações, botões principais e informações visíveis do perfil.'},
      'Site / landing page':{required_if_selected:false,label:'Print do site ou landing page',instruction:'Preferencialmente o topo da página inicial, com posicionamento e CTA visíveis.'},
      'WhatsApp Business':{required_if_selected:false,label:'Print do perfil comercial',instruction:'Somente perfil, descrição, catálogo ou informações públicas. Nunca envie conversas.'}
    },
    accepted_types:['image/jpeg','image/png','image/webp'],
    max_files:5,
    client_max_dimension:1800,
    client_target_bytes:2000000,
    privacy_notice:'Use apenas prints do próprio negócio. Evite conversas, dados de clientes, documentos, números sensíveis ou qualquer informação privada que não seja necessária para a análise.'
  };

  root.RX_DIGITAL_V2={
    questionnaire_version:'RX_DIGITAL_2.0',
    evidence_version:EVIDENCE.version,
    report_version:'RX_REPORT_2.0',
    questions:Q,
    channels:CHANNELS,
    evidence:EVIDENCE,
    na_label:NA
  };
})(window);

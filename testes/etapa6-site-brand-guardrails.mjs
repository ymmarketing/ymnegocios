import fs from 'node:fs';
function assert(cond,msg){if(!cond)throw new Error(msg);}
const html=fs.readFileSync('site-v2-preview.html','utf8');
const matrix=fs.readFileSync('docs/ETAPA6_MATRIZ_MENSAGENS_CANAIS_YM_V1.md','utf8');
const tokens=JSON.parse(fs.readFileSync('docs/ETAPA6_BRAND_TOKENS_YM_V1.json','utf8'));

assert(tokens.contract_version==='YM_BRAND_TOKENS_1.0','Contrato técnico de marca inválido');
assert(tokens.governance.brand_is_blue===true,'Regra A YM É AZUL ausente');
for(const color of ['#0A2540','#0066FF','#3D47C4','#F7F9FC','#E4EAF2','#6B7A99'])assert(JSON.stringify(tokens).includes(color),`Cor oficial ausente: ${color}`);
for(const phrase of [
  'O marketing certo, na ordem certa.',
  'Colocar o marketing digital na ordem certa do negócio.',
  'Transformar confusão em clareza acionável.',
  'Ver para compreender.',
  'Ordenar para avançar.',
  'Sustentar para crescer.'
])assert(JSON.stringify(tokens).includes(phrase),`Núcleo de marca ausente: ${phrase}`);

for(const marker of [
  'Seu marketing não precisa de mais ações. <em>Precisa da ordem certa.</em>',
  'Descobrir meu Score · R$ 97',
  'Descubra seu Score da Jornada Digital.',
  'não é diagnóstico',
  'Essencial · 45 dias · R$1.500',
  'Acompanhada · 3× R$1.200',
  'Sustentada · 6× R$900',
  'O marketing certo, na ordem certa.'
])assert(html.includes(marker),`Home candidata sem marcador oficial: ${marker}`);

assert(!html.match(/descubra exatamente o que trava|o que trava o seu crescimento/i),'Promessa legada causal detectada na nova home');
assert(!html.match(/garantia de resultado|resultado garantido|crescimento garantido/i),'Promessa de resultado indevida detectada');
assert(!html.match(/R\$\s*4\.500|R\$\s*4,500/i),'Preço legado Negócio do Zero detectado');
assert(!html.match(/#7C3AED|#9333EA|#8B5CF6/i),'Roxo dominante/legado detectado na home candidata');
assert(html.includes("--navy:#0A2540")&&html.includes("--blue:#0066FF"),'Paleta institucional não domina CSS');
assert(html.includes('family=Inter')&&html.includes('Montserrat'),'Tipografia oficial não carregada');
assert(html.includes('meta name="robots" content="noindex,nofollow"'),'Preview precisa permanecer fora de indexação');

for(const channel of ['Site','Instagram','LinkedIn','WhatsApp'])assert(matrix.includes(`**${channel}**`)||matrix.includes(`| **${channel}**`),`Canal sem regra na matriz: ${channel}`);
assert(matrix.includes('Raio-X Estratégico — R$ 97'),'Preço do Raio-X ausente na matriz');
assert(matrix.includes('Nenhum canal escolhe rota automaticamente'),'Governança de rota ausente na matriz');
assert(matrix.includes('logo oficial está aplicada no fechamento visual'),'Gate da logo oficial ausente');

console.log(JSON.stringify({ok:true,suite:'YM_ETAPA6_SITE_BRAND_GUARDRAILS_1.0',brand:'OFICIAL_V1_0',channels:4,preview_indexed:false,guardrails:'PASS'}));

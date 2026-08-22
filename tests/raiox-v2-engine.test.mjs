import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const sandbox={window:{},console};sandbox.window.window=sandbox.window;vm.createContext(sandbox);
for(const file of ['assets/js/raiox-digital-v2-schema.js','assets/js/raiox-digital-v2-engine.js']){
  vm.runInContext(fs.readFileSync(new URL('../'+file,import.meta.url),'utf8'),sandbox,{filename:file});
}
const W=sandbox.window,engine=W.RX_DIGITAL_ENGINE,cfg=W.RX_DIGITAL_V2;
assert.ok(cfg,'schema V2 deve existir');assert.ok(engine,'engine V2 deve existir');
assert.equal(cfg.questionnaire_version,'RX_DIGITAL_2.0');assert.equal(cfg.questions.length,30);
assert.equal(Object.keys(engine.axes).length,8,'cliente deve enxergar 8 eixos digitais');
assert.equal(Object.keys(engine.journey).length,5,'jornada deve ter 5 visões');

const A={
 RXD01:'Yasmin',RXD02:'YM Marketing & Negócios',RXD03:'Consultoria estratégica',RXD04:'BH e online',RXD05:'Raio-X e consultoria',RXD06:'Pequenos negócios B2B',
 RXD07:['Instagram','LinkedIn','Site / landing page','WhatsApp Business'],RXD08:{Instagram:'@ym',LinkedIn:'linkedin', 'Site / landing page':'https://ymnegocios.com.br','WhatsApp Business':'wa'},RXD09:'LinkedIn',
 RXD10:3,RXD11:3,RXD12:2,RXD13:3,RXD14:3,RXD15:3,RXD16:3,RXD17:4,RXD18:4,RXD19:3,RXD20:3,RXD21:3,RXD22:3,RXD23:2,RXD24:3,RXD25:2,RXD26:3,
 RXD27:'10 clientes',RXD28:'Método e CRM',RXD29:{difficulty:'previsibilidade',attempts:'prospecção'},RXD30:{destination:'R$ 10 mil',success_signal:'pipeline e receita'}
};
const packet=engine.buildPacket(A,[],{source_system:'test'});
assert.equal(packet.packet_version,'VOS_DIGITAL_INTAKE_2.0');
assert.equal(packet.scoring_version,'RX_DIGITAL_SCORE_2.0');
assert.equal(packet.report_version,'RX_REPORT_2.0');
assert.equal(packet.score.overall,74);
assert.equal(packet.score.coverage_pct,100);
assert.equal(packet.score.axes['Prova e confiança'].score,87.5);
assert.equal(packet.score.axes['Presença e canais'].score,62.5);
assert.equal(packet.digital_presence.channels.length,4);
assert.equal(packet.digital_presence.primary_channel,'LinkedIn');

const withVision=engine.buildPacket(A,[{evidence_id:'1',channel:'Instagram',vision_analysis:{observed:{cta_visibility:'absent'},confidence:'high'}}],{source_system:'test'});
assert.equal(withVision.score.overall,packet.score.overall,'print não pode alterar Score na fase 1');
assert.equal(withVision.digital_presence.evidence_coverage_pct,25);

const onlyLinkedin={...A,RXD07:['LinkedIn','Google Perfil da Empresa'],RXD08:{LinkedIn:'li','Google Perfil da Empresa':'google'},RXD09:'LinkedIn'};
const p2=engine.buildPacket(onlyLinkedin,[],{});
assert.deepEqual(JSON.parse(JSON.stringify(p2.digital_presence.channels.map(x=>x.channel))),['LinkedIn','Google Perfil da Empresa']);
assert.equal(p2.digital_presence.channels.some(x=>x.channel==='Instagram'),false,'Instagram não pode ser obrigatório para a análise digital');

const igRule=cfg.evidence.channel_rules['Instagram'];
const liRule=cfg.evidence.channel_rules['LinkedIn'];
const googleRule=cfg.evidence.channel_rules['Google Perfil da Empresa'];
assert.equal(igRule.required_if_selected,true);assert.equal(liRule.required_if_selected,true);assert.equal(googleRule.required_if_selected,true);
assert.ok(cfg.evidence.privacy_notice.includes('conversas'),'aviso deve impedir envio de conversas/dados privados');

const partial={...A};delete partial.RXD26;
const pp=engine.buildPacket(partial,[],{});
assert.ok(pp.score.coverage_pct<100);assert.equal(pp.score.status,'PARCIAL');

console.log('RX_DIGITAL_2.0 tests OK');

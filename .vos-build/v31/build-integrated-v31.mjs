import fs from 'node:fs';
import crypto from 'node:crypto';

const BASE='raio-x-v3.1-approved.html';
const OUT='raio-x-v3.1-integrado.html';
const EXPECTED='a23adb0a4f20080fc091432decad218194417299548219369e8f7a50a001f43e';
let html=fs.readFileSync(BASE,'utf8');
const baseSha=crypto.createHash('sha256').update(Buffer.from(html)).digest('hex');
if(baseSha!==EXPECTED) throw new Error(`Base v3.1 incorreta: ${baseSha}`);

function replaceOnce(needle,replacement,label){
  const n=html.split(needle).length-1;
  if(n!==1) throw new Error(`${label}: esperado 1 match, obtido ${n}`);
  html=html.replace(needle,replacement);
}

const css=`
/* ETAPA 3 · shell pagamento/sessão. Não altera Score/VOS. */
.payx-wrap{max-width:560px;margin:0 auto;padding:100px clamp(18px,5vw,36px) 70px}
.payx-card{background:var(--branco);border:1px solid var(--borda);border-radius:18px;overflow:hidden;box-shadow:0 14px 45px rgba(0,85,204,.08)}
.payx-head{background:var(--azul2);padding:26px 28px;color:#fff;text-align:center}.payx-k{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55);margin-bottom:7px}.payx-title{font-family:'Montserrat',sans-serif;font-size:21px;font-weight:800}.payx-price{font-family:'Montserrat',sans-serif;font-size:32px;font-weight:900;margin-top:7px}.payx-price small{font-size:14px;color:rgba(255,255,255,.58);font-weight:600}
.payx-body{padding:28px;text-align:center}.payx-lock{width:58px;height:58px;border-radius:50%;margin:0 auto 16px;background:var(--azul-bg);display:flex;align-items:center;justify-content:center;font-size:25px}.payx-body h2{font-family:'Montserrat',sans-serif;font-size:22px;font-weight:800;color:var(--escuro);margin-bottom:9px}.payx-body>p{font-size:14px;color:var(--sub);line-height:1.65;margin-bottom:18px}.payx-alert{display:none;text-align:left;background:var(--amarelo-bg);border:1px solid var(--amarelo-bd);border-radius:10px;padding:13px 14px;font-size:12.5px;color:#7c4a08;line-height:1.55;margin-bottom:14px}.payx-actions{display:flex;flex-direction:column;gap:10px}.payx-code{margin-top:18px;padding-top:18px;border-top:1px dashed var(--borda)}.payx-code-k{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--azul);margin-bottom:7px}.payx-code p{font-size:12.5px;color:var(--sub);line-height:1.55;margin-bottom:10px}.payx-input{width:100%;padding:14px 15px;border:1.5px solid var(--borda);border-radius:10px;font-family:'Inter',sans-serif;font-size:16px;color:var(--texto);text-transform:uppercase;text-align:center;letter-spacing:.06em;margin-bottom:10px}.payx-input:focus{outline:none;border-color:var(--azul);box-shadow:0 0 0 3px rgba(0,85,204,.1)}.payx-support{display:inline-block;margin-top:18px;font-size:12.5px;color:var(--azul);text-decoration:none;font-weight:600}.payx-back{margin-top:18px;font-size:12px;color:var(--placeholder);cursor:pointer}@media(max-width:520px){.payx-body{padding:22px 18px}.payx-head{padding:23px 18px}}
`;
replaceOnce('</style>',css+'\n</style>','CSS');

const paymentView=`
<!-- ETAPA 3 · PAGAMENTO/SESSÃO REAL -->
<div class="view" id="view-payment"><div class="payx-wrap"><div class="payx-card">
<div class="payx-head"><div class="payx-k">Você está adquirindo</div><div class="payx-title">Raio-X Estratégico</div><div class="payx-price">R$ 97 <small>· pagamento único</small></div></div>
<div class="payx-body"><div class="payx-lock">🔒</div><h2>Pagamento em confirmação</h2><p>O questionário é liberado somente depois que o servidor confirma o pagamento no Asaas.</p><div class="payx-alert" id="payx-alert"></div>
<div class="payx-actions"><button class="btn btn-lg" data-payx-start style="width:100%;justify-content:center" onclick="irParaPagamento()">Ir para pagamento →</button><button class="btn btn-ghost" id="payx-check" style="width:100%;justify-content:center" onclick="checkPayment()">Verificar pagamento</button></div>
<div class="payx-code"><div class="payx-code-k">Contingência de acesso</div><p>Se o pagamento já foi confirmado pela YM e você recebeu um código de acesso, use-o aqui.</p><input class="payx-input" id="payx-code" placeholder="YM-XXXX-XXXX" maxlength="16" oninput="formatarCodigo(this)" onkeydown="if(event.key==='Enter')validarCodigo()"><button class="btn btn-ghost" id="payx-code-btn" style="width:100%;justify-content:center" onclick="validarCodigo()">Liberar meu Raio-X</button></div>
<a class="payx-support" id="payx-whatsapp" target="_blank" rel="noopener">Preciso de ajuda pelo WhatsApp</a><div class="payx-back" onclick="go('intro')">← Voltar ao início</div></div>
</div></div></div>

`;
replaceOnce('<!-- QUIZ -->',paymentView+'<!-- QUIZ -->','payment view');
replaceOnce("function startCheckout(){go('quiz');renderQuiz();}","function startCheckout(){ if(typeof window.irParaPagamento==='function') return window.irParaPagamento(); go('payment'); }",'startCheckout');
replaceOnce('</body>','<!-- ETAPA 3 · integrações aditivas -->\n<script src="assets/js/raiox-v3.1-persist.js"></script>\n<script src="assets/js/raiox-payment-shell-v1.js"></script>\n</body>','scripts');

for(const bad of ["function startCheckout(){go('quiz');renderQuiz();}",'fetch(API_BASE+"/api/relatorio"','POST {API_BASE}/api/relatorio']) if(html.includes(bad)) throw new Error(`Caminho proibido: ${bad}`);
for(const req of ['RX_CANONICO_1.0','RX_SCORE_1.0','VOS_INTAKE_1.0','RX_REPORT_1.0','route_signal: null','human_validation_required: true','assets/js/raiox-v3.1-persist.js','assets/js/raiox-payment-shell-v1.js','id="view-payment"','R$ 97']) if(!html.includes(req)) throw new Error(`Ausente: ${req}`);

fs.writeFileSync(OUT,html);
const integratedSha=crypto.createHash('sha256').update(Buffer.from(html)).digest('hex');
console.log(`OK ${OUT} base=${baseSha} integrated=${integratedSha} bytes=${Buffer.byteLength(html)}`);

import fs from 'node:fs';
import vm from 'node:vm';
function assert(cond,msg){if(!cond)throw new Error(msg)}

async function testPaymentShell(){
  const code=fs.readFileSync('assets/js/raiox-payment-shell-v1.js','utf8');
  const calls=[],views=[];let renderQuizCount=0,originalAnalysisCount=0;const store=new Map(),elements=new Map();
  function el(id){if(!elements.has(id))elements.set(id,{id,style:{},dataset:{},textContent:'',innerHTML:'',value:'',disabled:false});return elements.get(id)}
  const document={readyState:'complete',visibilityState:'visible',getElementById:id=>el(id),querySelectorAll:sel=>sel==='[data-payx-start]'?[el('pay-start')]:[],querySelector:sel=>sel==='.view.active'?{id:'view-payment'}:null,addEventListener:()=>{}};
  let status='pending';
  const location={search:'',pathname:'/raio-x',hash:'',_href:'',set href(v){this._href=v},get href(){return this._href}};
  const root={go:v=>views.push(v),runAnalysis:()=>{originalAnalysisCount++;return'analysis-ok'},renderQuiz:()=>{renderQuizCount++},localStorage:{setItem:(k,v)=>store.set(k,v),getItem:k=>store.get(k)||null},location,history:{replaceState:()=>{}},setInterval:()=>123,clearInterval:()=>{},document};
  async function fetch(url,opts={}){calls.push({url,opts});if(url.includes('/api/pagamento/criar'))return{ok:true,json:async()=>({ok:true,ref:'ym_raiox_1786160000000_testabcd',paymentUrl:'https://pay.example/abc',status:'pending'})};if(url.includes('/api/pagamento/status'))return{ok:true,json:async()=>({status})};if(url.includes('/api/acesso/manual'))return{ok:true,status:200,json:async()=>({ok:true,ref:'ym_raiox_1786160000000_manualabcd',status:'approved'})};throw new Error('unexpected fetch '+url)}
  const ctx={window:root,document,fetch,URLSearchParams,encodeURIComponent,console,JSON,String,Promise,setTimeout,clearTimeout};root.window=root;vm.createContext(ctx);vm.runInContext(code,ctx);
  await root.startCheckout();assert(calls.some(c=>c.url.includes('/api/pagamento/criar')),'checkout não criou cobrança');assert(store.get('ym_raiox_ref'),'ref não salva');assert(location.href==='https://pay.example/abc','sem redirect');assert(!views.includes('quiz'),'bypass de pagamento');
  status='pending';renderQuizCount=0;views.length=0;assert(await root.checkPayment()===false,'pending aprovou');assert(renderQuizCount===0,'pending abriu quiz');
  status='approved';assert(await root.checkPayment()===true,'approved não aprovou');assert(renderQuizCount===1&&views.includes('quiz'),'approved não abriu quiz');
  status='pending';originalAnalysisCount=0;views.length=0;await root.runAnalysis();assert(originalAnalysisCount===0&&views.includes('payment'),'análise sem gate');
  status='approved';await root.runAnalysis();assert(originalAnalysisCount===1,'análise aprovada não executou');
  return{payment_gate:true};
}

async function testPersistence(){
  const code=fs.readFileSync('assets/js/raiox-v3.1-persist.js','utf8');const calls=[];const root={lerRef:()=> 'ym_raiox_1786160000000_testabcd',location:{search:''},localStorage:{getItem:()=>null}};
  async function fetch(url,opts){calls.push({url,opts});return{ok:true,status:200,json:async()=>({ok:true,intake_id:'abc',created_at:'2026-08-08T00:00:00Z'})}}
  const ctx={window:root,fetch,URLSearchParams,JSON,Promise,Error,String};root.window=root;vm.createContext(ctx);vm.runInContext(code,ctx);
  const packet={packet_version:'VOS_INTAKE_1.0',questionnaire_version:'RX_CANONICO_1.0',scoring_version:'RX_SCORE_1.0',report_version:'RX_REPORT_1.0',human_validation_required:true,route_signal:null};
  const r=await root.persistRaioX(packet);assert(r.ok===true,'persistência falhou');assert(calls.length===1&&calls[0].url.includes('save-raiox-intake'),'endpoint incorreto');const body=JSON.parse(calls[0].opts.body);assert(body.ref&&body.packet&&body.packet.packet_version===packet.packet_version,'payload incorreto');
  let blocked=false;try{await root.persistRaioX({...packet,route_signal:'PONTUAL'})}catch(e){blocked=true}assert(blocked,'aceitou rota automática');assert(calls.length===1,'packet inválido chegou à rede');return{persist:true};
}
const a=await testPaymentShell(),b=await testPersistence();console.log(JSON.stringify({ok:true,...a,...b}));

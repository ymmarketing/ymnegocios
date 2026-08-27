from pathlib import Path

path = Path('assets/motor-flow-v2.js')
text = path.read_text(encoding='utf-8')
marker = '/* MOTOR_ORDER_HUMAN_PLAN_V1 */'
if marker in text:
    print('human plan patch already applied')
    raise SystemExit(0)

block = r'''

/* MOTOR_ORDER_HUMAN_PLAN_V1 */
(()=>{
const style=document.createElement('style');style.id='ymMotorOrderHumanPlanStyles';style.textContent=`
.order-human-plan{margin-top:9px;padding:10px;border:1px solid #dbe5ef;border-left:4px solid #0a2540;border-radius:10px;background:#fbfdff}.order-human-plan> b{display:block;font:800 9.5px Montserrat;color:#0a2540;margin-bottom:3px}.order-human-plan>p{font-size:8.8px;line-height:1.45;color:#65798b;margin:0 0 8px}.order-plan-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.order-plan-grid .wide{grid-column:1/-1}.order-plan-summary{display:flex;gap:7px;flex-wrap:wrap;margin-top:7px}.order-plan-summary span{font-size:8.5px;color:#52697e;background:#f0f4f8;border-radius:8px;padding:5px 7px}@media(max-width:700px){.order-plan-grid{grid-template-columns:1fr}.order-plan-grid .wide{grid-column:auto}}
`;document.head.appendChild(style);
const E=v=>YM.esc(v??'');
function sortedCandidates(){return [...(bundle?.order_candidates||[])].sort((a,b)=>(a.sequence_order||999)-(b.sequence_order||999))}
function planSummary(o){const parts=[];if(o.execution_stage)parts.push(`<span><b>Etapa:</b> ${E(o.execution_stage)}</span>`);if(o.planned_deadline)parts.push(`<span><b>Prazo:</b> ${E(String(o.planned_deadline).slice(0,10).split('-').reverse().join('/'))}</span>`);if(o.responsible)parts.push(`<span><b>Responsável:</b> ${E(o.responsible)}</span>`);if(o.human_plan_notes)parts.push(`<span><b>Nota:</b> ${E(o.human_plan_notes)}</span>`);return parts.length?`<div class="order-plan-summary">${parts.join('')}</div>`:''}
function decorateHumanPlan(){const cards=[...document.querySelectorAll('.sec-order .order-item')],rows=sortedCandidates();cards.forEach((card,i)=>{card.querySelector('[data-human-plan]')?.remove();const o=rows[i];if(!o)return;if(o.human_status==='PENDENTE'&&!o.not_now){const rationale=document.getElementById('or_'+o.id);if(!rationale)return;const anchor=rationale.closest('.ym-formgrid')||rationale.parentElement;anchor.insertAdjacentHTML('afterend',`<div class="order-human-plan" data-human-plan><b>PLANEJAMENTO HUMANO</b><p>A IA não preenche estes campos. Defina como esta ação entra na execução depois de decidir validá-la.</p><div class="order-plan-grid"><div><label class="ym-label">Etapa / fase</label><input id="ost_${E(o.id)}" class="ym-input" placeholder="Ex.: Etapa 1 · Base comercial"></div><div><label class="ym-label">Prazo</label><input id="od_${E(o.id)}" type="date" class="ym-input"></div><div><label class="ym-label">Responsável</label><input id="orp_${E(o.id)}" class="ym-input" placeholder="Quem conduz esta ação?"></div><div class="wide"><label class="ym-label">Observações do plano</label><textarea id="opn_${E(o.id)}" class="ym-textarea" placeholder="Dependências, combinação de execução ou outra decisão humana."></textarea></div></div></div>`)}else if(o.human_status==='VALIDADO'){const host=card.querySelector('div:nth-child(2)')||card;const summary=planSummary(o);if(summary)host.insertAdjacentHTML('beforeend',`<div data-human-plan>${summary}</div>`)}})}
window.validateOrder=(id,n)=>ord({action:'VALIDATE_CANDIDATE',candidate_id:id,sequence_order:n?null:Number(document.getElementById('os_'+id)?.value),validation_rationale:document.getElementById('or_'+id)?.value||'',execution_stage:n?'':(document.getElementById('ost_'+id)?.value||''),planned_deadline:n?'':(document.getElementById('od_'+id)?.value||''),responsible:n?'':(document.getElementById('orp_'+id)?.value||''),human_plan_notes:document.getElementById('opn_'+id)?.value||''},'Ação validada e planejamento humano registrado.');
const baseOpenHumanPlan=openCase;openCase=async function(id){await baseOpenHumanPlan(id);decorateHumanPlan()};window.openCase=openCase;
setTimeout(decorateHumanPlan,300);
})();
'''
path.write_text(text + block, encoding='utf-8')
print('patched human planning fields into ORDENAR')

index = Path('MOTOR/index.html')
html = index.read_text(encoding='utf-8')
old = '/assets/motor-flow-v2.js?v=20260827-2'
new = '/assets/motor-flow-v2.js?v=20260827-3'
if old in html:
    html = html.replace(old, new, 1)
elif new not in html:
    raise SystemExit('motor-flow cache tag not found')
index.write_text(html, encoding='utf-8')
print('bumped MOTOR cache to v3')

from pathlib import Path

path = Path('DASHBOARD/index.html')
text = path.read_text(encoding='utf-8')

old_dimension = "function dimensionTable(title,rows){rows=(rows||[]).slice(0,8);if(!rows.length)return `<div class=\"dash-card\"><b style=\"font:800 11px Montserrat;color:var(--ym-navy)\">${E(title)}</b><div class=\"empty\" style=\"margin-top:10px\">Sem dados suficientes.</div></div>`;const max=Math.max(...rows.map(x=>x.total||0),1);return `<div class=\"dash-card\"><b style=\"font:800 11px Montserrat;color:var(--ym-navy)\">${E(title)}</b><table class=\"mini-table\" style=\"margin-top:7px\"><thead><tr><th>Grupo</th><th>Total</th><th>Leitura</th><th>Raio-X</th><th>Venda</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${E(r.label)}</b><div class=\"rank-bar\"><i style=\"width:${Math.round((r.total/max)*100)}%\"></i></div></td><td>${r.total}</td><td>${r.reading_sent} <span class=\"updated\">(${pct(r.reading_rate)})</span></td><td>${r.raiox_paid}</td><td>${r.won}</td></tr>`).join('')}</tbody></table></div>`}"
new_dimension = "function dimensionTable(title,rows,limit=8){rows=(rows||[]).slice(0,limit);if(!rows.length)return `<div class=\"dash-card\"><b style=\"font:800 11px Montserrat;color:var(--ym-navy)\">${E(title)}</b><div class=\"empty\" style=\"margin-top:10px\">Sem dados suficientes.</div></div>`;const max=Math.max(...rows.map(x=>x.total||0),1);return `<div class=\"dash-card\"><b style=\"font:800 11px Montserrat;color:var(--ym-navy)\">${E(title)}</b><table class=\"mini-table\" style=\"margin-top:7px\"><thead><tr><th>Grupo</th><th>Total</th><th>Leitura</th><th>Raio-X</th><th>Venda</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${E(r.label)}</b><div class=\"rank-bar\"><i style=\"width:${Math.round((r.total/max)*100)}%\"></i></div></td><td>${r.total}</td><td>${r.reading_sent} <span class=\"updated\">(${pct(r.reading_rate)})</span></td><td>${r.raiox_paid}</td><td>${r.won}</td></tr>`).join('')}</tbody></table></div>`}"

if old_dimension not in text:
    raise SystemExit('dimensionTable original não encontrado')
text = text.replace(old_dimension, new_dimension, 1)

marker = "function countList(items,empty='Sem registros ainda.'){if(!items?.length)return `<div class=\"empty\">${E(empty)}</div>`;return `<div class=\"pill-list\">${items.slice(0,12).map(x=>`<span class=\"pill\">${E(x.label)} · <b>${x.count}</b></span>`).join('')}</div>`}\nfunction render(data){"
helper = """function countList(items,empty='Sem registros ainda.'){if(!items?.length)return `<div class=\"empty\">${E(empty)}</div>`;return `<div class=\"pill-list\">${items.slice(0,12).map(x=>`<span class=\"pill\">${E(x.label)} · <b>${x.count}</b></span>`).join('')}</div>`}
function segmentGroup(label){const s=String(label||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim();if(!s)return 'Não informado';if(/(^|[^a-z])rh([^a-z]|$)|recursos humanos|dho|recrut|selecao|gestao de pessoas|desenvolvimento humano|desenvolvimento organizacional|talent acquisition|talentos|psicologia do trabalho|cultura e clima|desenvolvimento de pessoas/.test(s))return 'Consultoria de RH';if(/negocio digital|infoprod|creator|comunidade e cursos|mentoria/.test(s))return 'Negócios digitais / Infoprodutos';if(/clinica|odontolog|estetica|cirurgia plastica|medica \/ estetica/.test(s))return 'Saúde / Estética / Odonto';if(/imobili|incorporadora/.test(s))return 'Imobiliário';if(/educacao|treinamento|edtech|idiomas corporativos|business school|team building|lideranca|carreira|coaching/.test(s))return 'Educação / Treinamento';if(/saas|tecnologia|software|crm|automacao whatsapp|omnichannel|healthtech|proptech|ia para receita|fiscal/.test(s))return 'SaaS / Tecnologia';if(/distribu|atacado|e-commerce|marcas proprias/.test(s))return 'Distribuição / E-commerce';if(/bpo|contab|financeir|controladoria|valuation/.test(s))return 'Financeiro / BPO / Contábil';if(/customer experience|customer success|(^|[^a-z])cx([^a-z]|$)|cs ops|(^|[^a-z])cs([^a-z]|$)/.test(s))return 'CX / Customer Success';if(/vendas|comercial|hunting/.test(s))return 'Comercial / Vendas';if(/consultoria|gestao|estrategia|processos|governanca|planejamento|facilitacao/.test(s))return 'Consultoria Empresarial';return 'Outros'}
function aggregateSegments(rows){const m=new Map();for(const r of rows||[]){const label=segmentGroup(r.label),cur=m.get(label)||{label,total:0,reading_sent:0,raiox_paid:0,raiox_delivered:0,won:0,lost:0};for(const k of ['total','reading_sent','raiox_paid','raiox_delivered','won','lost'])cur[k]+=Number(r?.[k]||0);m.set(label,cur)}return [...m.values()].map(r=>({...r,reading_rate:r.total?Number(((r.reading_sent/r.total)*100).toFixed(1)):null,raiox_rate_from_reading:r.reading_sent?Number(((r.raiox_paid/r.reading_sent)*100).toFixed(1)):null,won_rate:r.total?Number(((r.won/r.total)*100).toFixed(1)):null})).sort((a,b)=>b.total-a.total||a.label.localeCompare(b.label,'pt-BR'))}
function render(data){"""

if marker not in text:
    raise SystemExit('ponto de inserção dos agrupadores não encontrado')
text = text.replace(marker, helper, 1)

old_call = "${dimensionTable('Por segmento',c.by_segment)}${dimensionTable('Por origem',c.by_source)}${dimensionTable('Por classe de lead',c.by_lead_class)}"
new_call = "${dimensionTable('Por segmento',aggregateSegments(c.by_segment),20)}${dimensionTable('Por origem',c.by_source)}${dimensionTable('Por classe de lead',c.by_lead_class)}"
if old_call not in text:
    raise SystemExit('chamada do bloco por segmento não encontrada')
text = text.replace(old_call, new_call, 1)

path.write_text(text, encoding='utf-8')
print('Dashboard atualizado: segmentos gerenciais consolidados e bloco Por segmento ampliado.')
# trigger workflow 2026-08-18

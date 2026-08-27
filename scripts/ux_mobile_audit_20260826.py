from pathlib import Path

INTERNAL_CSS = r'''/* YM MOBILE SYSTEM 20260826 — carregado por último nas telas internas */
@media (max-width: 760px) {
  html,body{width:100%;max-width:100%;overflow-x:hidden}
  body{min-width:0}
  .ym-main,.ym-content,.workspace,.motor-grid,.motor-section,.motor-section .body,.ym-card,.ym-panel,.ym-block,.ym-detail-grid,.ym-formgrid,.ym-filterbar{min-width:0;max-width:100%}
  .ym-content{width:100%;padding-left:14px!important;padding-right:14px!important}
  .ym-topbar{gap:8px;align-items:center}.ym-topbar>div{min-width:0}.ym-topbar-title{white-space:normal;line-height:1.2;overflow-wrap:anywhere}.ym-topbar-meta{min-width:0}.ym-chip{max-width:100%;white-space:normal;text-align:center}
  .ym-header,.ym-section-head{width:100%;min-width:0}.ym-header>*,.ym-section-head>*{min-width:0;max-width:100%}.ym-actions{width:100%;display:flex}.ym-actions>.ym-btn,.ym-actions>a.ym-btn{flex:1 1 145px;white-space:normal;text-align:center}
  .ym-title,.ym-lead,.ym-copy,.ym-meta,.ym-block h3,.ym-section h2{max-width:100%;overflow-wrap:anywhere}
  .ym-grid>*{min-width:0}.ym-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important}.ym-kpi{min-width:0}.ym-kpi b{overflow-wrap:anywhere}
  .ym-formgrid,.ym-filterbar,.ym-detail-grid{grid-template-columns:minmax(0,1fr)!important}.ym-wide{grid-column:auto!important}
  .ym-input,.ym-select,.ym-textarea{width:100%!important;max-width:100%!important;min-width:0!important;font-size:16px!important}.ym-textarea{line-height:1.5}
  .ym-btn{white-space:normal;line-height:1.25}.ym-badge{white-space:normal;text-align:center;line-height:1.25}
  .ym-modal-back,.crm-modal-back,.target-back{padding:0!important;align-items:stretch!important}.ym-modal,.crm-modal,.target-modal{width:100%!important;max-width:none!important;max-height:100dvh!important;height:100dvh;border-radius:0!important}.ym-modal-body,.crm-modal-body,.target-body{max-height:none!important;flex:1;overflow:auto;-webkit-overflow-scrolling:touch}.ym-modal header,.crm-modal>header,.target-modal>header{min-height:64px}.ym-modal header button,.crm-modal>header button,.target-modal>header button{min-width:42px;min-height:42px}
  .table-wrap,[class*="table-wrap"]{width:100%;max-width:100%;overflow-x:auto!important;-webkit-overflow-scrolling:touch}.table{max-width:none}.tabbar,.fin-tabs,.preset-row{max-width:100%;overflow-x:auto!important;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity}.tabbar button,.fin-tab,.preset{scroll-snap-align:start}

  /* MOTOR */
  #workspace{width:100%;max-width:100%;overflow-x:hidden!important}
  #workspace *{min-width:0}
  #workspace .case-hero,#workspace .motor-section,#workspace .p8-card,#workspace .p8-body,#workspace .guide-intro,#workspace .guide-box,#workspace .check-row,#workspace .analysis-fields,#workspace .entry,#workspace .investigation-intro,#workspace .test-box,#workspace .mvc{width:100%;max-width:100%;box-sizing:border-box}
  #workspace .case-hero{padding:18px 16px!important;border-radius:18px}.case-hero h2{overflow-wrap:anywhere;line-height:1.12}.case-hero p{overflow-wrap:anywhere}
  #workspace .motor-section>header{padding:14px!important}.motor-section .body{padding:14px!important}
  #workspace .p8-summary{width:100%;gap:8px;align-items:flex-start}.p8-summary-main{min-width:0!important}.p8-summary h4,.p8-summary small{white-space:normal!important;overflow-wrap:anywhere}
  #workspace .check-row{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:9px!important;padding:12px!important}.check-row span{display:block!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;overflow-wrap:anywhere!important;word-break:normal!important;line-height:1.5!important}.check-select{width:100%!important;max-width:100%!important;font-size:16px!important;min-height:46px!important}
  #workspace textarea,#workspace select,#workspace input{max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
  #workspace :is([class*="tabs"],[class*="p8-nav"],[class*="step-nav"],[class*="stage-nav"],[class*="review-nav"]){display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;width:100%!important;max-width:100%!important;overflow:visible!important;white-space:normal!important}
  #workspace :is([class*="tabs"],[class*="p8-nav"],[class*="step-nav"],[class*="stage-nav"],[class*="review-nav"]) button{width:100%!important;max-width:100%!important;min-width:0!important;min-height:48px!important;padding:9px 8px!important;white-space:normal!important;overflow-wrap:anywhere!important;line-height:1.25!important;text-align:center!important}
  #workspace .prereq{grid-template-columns:minmax(0,1fr)!important}.prereq>div{min-width:0}
  #workspace .mvc-summary{grid-template-columns:repeat(2,minmax(0,1fr))!important}.mvc-grid{grid-template-columns:minmax(0,1fr)!important}.mvc-card.wide{grid-column:auto!important;overflow-x:auto!important}.mvc-table{min-width:620px}.mvc-source{grid-template-columns:minmax(0,1fr) auto!important}.mvc-copy,.mvc-source small,.mvc-blocker,.mvc-note{overflow-wrap:anywhere}
  .case-index{max-width:100%;overflow:hidden}.case-items{max-width:100%}.case-item{max-width:100%}.case-item b,.case-item span{white-space:normal!important;overflow-wrap:anywhere}

  /* CRM */
  .crm-toolbar{grid-template-columns:minmax(0,1fr)!important}.lead-summary{max-width:100%;grid-template-columns:36px minmax(0,1fr) auto!important}.lead-name{min-width:0}.lead-name b,.lead-name span{white-space:normal!important;overflow-wrap:anywhere}.lead-body,.lead-context,.visual-profile,.lead-quick,.detail-tabs,.source-queue{min-width:0;max-width:100%}.lead-context,.lead-quick,.detail-tabs,.source-queue{grid-template-columns:minmax(0,1fr)!important}

  /* Financeiro / Dashboard / Conteúdos / Identidade */
  .metric-grid,.insight-grid,.scenario-grid,.period-summary,.target-grid{grid-template-columns:minmax(0,1fr)!important}.hero-metrics{grid-template-columns:minmax(0,1fr)!important}.trend-month{min-width:0}.custom-range{grid-template-columns:minmax(0,1fr)!important}.section>header{min-width:0}.section>header>*{min-width:0}.section h2,.section header p,.hero h2,.hero-note{overflow-wrap:anywhere}
}
@media (max-width: 390px){
  .ym-kpis{grid-template-columns:minmax(0,1fr)!important}
  #workspace :is([class*="tabs"],[class*="p8-nav"],[class*="step-nav"],[class*="stage-nav"],[class*="review-nav"]){grid-template-columns:minmax(0,1fr)!important}
}
'''

CLIENT_CSS = r'''/* YM CLIENT PORTAL MOBILE SYSTEM 20260826 */
@media (max-width: 760px){
  html,body{width:100%;max-width:100%;overflow-x:hidden}.cp-app,.cp-main,.cp-content,.cp-view,.cp-card,.cp-panel{min-width:0;max-width:100%}.cp-main{margin-left:0}.cp-content{padding:18px 14px 56px!important}.cp-topbar{height:auto;min-height:62px;padding:9px 12px}.cp-topbar>div{min-width:0}.cp-topbar b{overflow-wrap:anywhere}.cp-chip{white-space:normal;text-align:center}
  .cp-head{display:block!important;margin-bottom:16px}.cp-head h1{font-size:clamp(27px,8vw,34px)!important;line-height:1.08;overflow-wrap:anywhere}.cp-head p{font-size:15px!important;line-height:1.6}
  .cp-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px}.cp-two,.cp-projects,.cp-docs,.cp-calendar-wrap{grid-template-columns:minmax(0,1fr)!important}.cp-grid>*{min-width:0}.cp-panel,.cp-project,.cp-approval,.cp-doc{padding:14px!important}
  .cp-section-title{align-items:flex-start;flex-direction:column}.cp-section-title h2{font-size:17px!important}.cp-section-title span{font-size:12px!important}.cp-row{min-width:0}.cp-row>div{min-width:0}.cp-row b{font-size:14px!important}.cp-row small{font-size:12.5px!important;overflow-wrap:anywhere}.cp-badge{font-size:11px!important;white-space:normal;text-align:center}
  .cp-project-top,.cp-approval-top,.cp-fin-head,.cp-doc{flex-direction:column;align-items:flex-start}.cp-project h3,.cp-approval h3,.cp-fin-head h3,.cp-doc h3{font-size:15px!important}.cp-project p,.cp-approval p,.cp-doc p{font-size:13px!important;line-height:1.55}.cp-project-meta,.cp-fin-grid{grid-template-columns:minmax(0,1fr)!important}.cp-soft small{font-size:11px!important}.cp-soft b{font-size:13px!important;overflow-wrap:anywhere}
  .cp-calendar{overflow-x:auto!important;-webkit-overflow-scrolling:touch}.cp-week,.cp-days{min-width:560px}.cp-week div{font-size:11px!important}.cp-day-num{font-size:12px!important}.cp-event{font-size:11px!important;white-space:normal}
  .cp-input,.cp-select,.cp-textarea{font-size:16px!important;min-height:44px!important;max-width:100%;min-width:0}.cp-btn{font-size:14px!important;min-height:44px;white-space:normal}.cp-label{font-size:12.5px!important}.cp-note{font-size:12px!important;line-height:1.5}.cp-empty{font-size:13px!important}
  .cp-overlay{padding:0!important;display:block!important;overflow:hidden}.cp-onboarding{width:100%!important;height:100dvh!important;max-height:100dvh!important;border-radius:0!important;display:flex;flex-direction:column}.cp-onboarding-top{padding:20px 16px!important;flex:0 0 auto}.cp-onboarding-top h2{font-size:24px!important;line-height:1.15}.cp-onboarding-top p{font-size:13px!important;line-height:1.55}.cp-onboarding-body{padding:16px!important;overflow-y:auto;min-height:0}
  .co-grid{grid-template-columns:minmax(0,1fr)!important}.co-wide{grid-column:auto!important}.co-section h3{font-size:16px!important}.co-section>p{font-size:13px!important}.co-source{font-size:12px!important;min-height:40px}.co-month{grid-template-columns:minmax(0,1fr)!important}.co-month .co-month-status{grid-template-columns:minmax(0,1fr)!important}.co-help,.co-confirm,.co-msg{font-size:12px!important}.co-summary span{font-size:11px!important}.co-actions{position:sticky;bottom:0;padding:10px 0;background:#fff}.co-actions button{flex:1 1 100%!important}
  .cpj-intro{font-size:13px!important}.cpj-track{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:10px;overflow:visible!important;padding:6px 0!important}.cpj-step{flex:none!important;width:100%!important;padding:10px 12px 10px 58px!important;border:1px solid #dfe6ee;border-radius:13px;background:#fff;min-height:70px}.cpj-step:not(:last-child):after{display:none!important}.cpj-node{position:absolute;left:10px;top:13px}.cpj-copy{padding:0!important}.cpj-copy b{font-size:14px!important}.cpj-copy p{font-size:12.5px!important}.cpj-status{font-size:10px!important}
}
@media(max-width:390px){.cp-kpis{grid-template-columns:minmax(0,1fr)!important}}
'''

QUEM_CSS = r'''/* QUEM SOMOS — refinamento mobile 20260826 */
@media(max-width:650px){
  html,body{width:100%;max-width:100%;overflow-x:hidden}.navin{min-height:64px;padding:9px 15px!important;gap:10px}.logo{width:165px;max-width:48vw}.navlinks{gap:7px}.navlinks .btn,.navlinks a.btn{min-height:42px;padding:10px 12px;font-size:12px}
  .heroin{padding:46px 16px 56px!important;gap:28px!important}.hero h1{font-size:clamp(38px,12vw,52px)!important;line-height:1.03}.hero p{font-size:16px!important;line-height:1.7}.hero-actions .btn{width:100%}.micro{font-size:12px!important;line-height:1.5}
  .section{padding:58px 16px!important}.sec-head{margin-bottom:24px}.sec-head p,.story-copy p,.founder-copy p,.behind-copy p,.closing p{font-size:15px!important;line-height:1.72}.why,.story,.founder,.behind,.universes,.portfolio,.principles,.vos-grid,.cred-grid{grid-template-columns:minmax(0,1fr)!important}.why-main,.mini-card,.vos-card,.universe,.case-body,.principle{padding-left:18px!important;padding-right:18px!important}.mini-card b,.time b,.cred b,.principle b{font-size:14px!important}.mini-card span,.time span,.cred span,.vos-card p,.universe p,.case p,.principle span{font-size:13px!important;line-height:1.6}.photo-slot{min-height:360px!important}.story-photo,.founder-photo,.behind-photo{min-height:340px!important}.portfolio-top{gap:14px}.portfolio-top .btn{width:100%}.filters{overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px}.filter{flex:0 0 auto;font-size:12px}.foot{padding:24px 16px;flex-direction:column;align-items:flex-start}.foot span{font-size:12px!important}.foot-social a{font-size:12px}
}
'''

Path('assets/internal-mobile-system.css').write_text(INTERNAL_CSS, encoding='utf-8')
Path('assets/client-portal-mobile-system.css').write_text(CLIENT_CSS, encoding='utf-8')
Path('assets/quemsomos-mobile-system.css').write_text(QUEM_CSS, encoding='utf-8')

internal_tag = '<link rel="stylesheet" href="/assets/internal-mobile-system.css?v=20260826-1">'
client_tag = '<link rel="stylesheet" href="/assets/client-portal-mobile-system.css?v=20260826-1">'
quem_tag = '<link rel="stylesheet" href="/assets/quemsomos-mobile-system.css?v=20260826-1">'

touched = []
audited = []
for p in Path('.').rglob('*.html'):
    rel = str(p).replace('\\', '/')
    if rel.startswith(('90_LEGADO_E_REFERENCIAS/', '.vos-build/')):
        continue
    text = p.read_text(encoding='utf-8', errors='ignore')
    audited.append(rel)
    changed = False
    if '/assets/internal-shell.css' in text and internal_tag not in text:
        text = text.replace('</head>', internal_tag + '</head>', 1)
        changed = True
    if rel == 'areadocliente/index.html' and client_tag not in text:
        text = text.replace('</head>', client_tag + '</head>', 1)
        changed = True
    if rel == 'quemsomos/index.html' and quem_tag not in text:
        text = text.replace('</head>', quem_tag + '</head>', 1)
        changed = True
    if changed:
        p.write_text(text, encoding='utf-8')
        touched.append(rel)

Path('docs').mkdir(exist_ok=True)
report = '''# Auditoria UX mobile — 26/08/2026

Critérios aplicados: viewport sem overflow horizontal global; leitura sem zoom; campos com 16px no mobile; áreas de toque confortáveis; grids colapsáveis; textos longos com quebra; tabelas/calendários densos com rolagem interna; modais/drawers usando o viewport real; desktop preservado.

## Camadas corrigidas
- Ambiente interno compartilhado (Central, CRM, MOTOR, Dashboard, Financeiro, Conteúdos, Identidade e demais páginas que usam `internal-shell.css`).
- MOTOR: tabs/etapas, perguntas, selects, cards, hipóteses, contexto do cliente e tabelas.
- Área do Cliente: cards, calendário, onboarding, jornada, formulários e componentes dinâmicos.
- Quem Somos: escala de leitura, grids, CTAs, filtros e rodapé no mobile.
- Home: auditada sem alteração estrutural nesta rodada, porque já é a referência aprovada de escala e navegação.

## Critério de aceite
- Nenhuma informação operacional depende de zoom do navegador.
- Nenhum texto necessário fica cortado lateralmente.
- Tabs longas quebram ou reorganizam em grade no MOTOR.
- Inputs/selects usam 16px no mobile para evitar zoom automático.
- Tabelas e calendários mantêm legibilidade com rolagem interna, sem ampliar a página inteira.
'''
report += '\n## HTMLs auditados pelo job\n' + '\n'.join(f'- `{x}`' for x in sorted(audited)) + '\n'
report += '\n## HTMLs que receberam a nova camada\n' + '\n'.join(f'- `{x}`' for x in sorted(touched)) + '\n'
Path('docs/ux-mobile-audit-20260826.md').write_text(report, encoding='utf-8')
print(f'Audited {len(audited)} HTML files; patched {len(touched)}')

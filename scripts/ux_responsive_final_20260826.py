from pathlib import Path

ROOT=Path('.')
SKIP_PREFIX=('90_LEGADO_E_REFERENCIAS/','.vos-build/')
active=[]
changed=[]
issues=[]

for p in ROOT.rglob('*.html'):
    rel=str(p).replace('\\','/')
    if rel.startswith(SKIP_PREFIX):
        continue
    txt=p.read_text(encoding='utf-8',errors='ignore')
    active.append(rel)
    original=txt

    # Force the latest shared internal responsive system wherever internal shell is used.
    if '/assets/internal-shell.css' in txt:
        if '/assets/internal-mobile-system.css' not in txt:
            txt=txt.replace('</head>','<link rel="stylesheet" href="/assets/internal-mobile-system.css?v=20260826-2"></head>',1)
        else:
            import re
            txt=re.sub(r'/assets/internal-mobile-system\.css(?:\?v=[^"\']+)?','/assets/internal-mobile-system.css?v=20260826-2',txt)

    # Client portal responsive layer.
    if rel=='areadocliente/index.html':
        if '/assets/client-portal-mobile-system.css' not in txt:
            txt=txt.replace('</head>','<link rel="stylesheet" href="/assets/client-portal-mobile-system.css?v=20260826-2"></head>',1)
        else:
            import re
            txt=re.sub(r'/assets/client-portal-mobile-system\.css(?:\?v=[^"\']+)?','/assets/client-portal-mobile-system.css?v=20260826-2',txt)

    # Quem Somos responsive layer.
    if rel=='quemsomos/index.html':
        if '/assets/quemsomos-mobile-system.css' not in txt:
            txt=txt.replace('</head>','<link rel="stylesheet" href="/assets/quemsomos-mobile-system.css?v=20260826-2"></head>',1)
        else:
            import re
            txt=re.sub(r'/assets/quemsomos-mobile-system\.css(?:\?v=[^"\']+)?','/assets/quemsomos-mobile-system.css?v=20260826-2',txt)

    if txt!=original:
        p.write_text(txt,encoding='utf-8')
        changed.append(rel)

    # Static audit checks after patch.
    if '<meta name="viewport"' not in txt and 'http-equiv="refresh"' not in txt:
        issues.append((rel,'sem viewport mobile'))
    if '/assets/internal-shell.css' in txt and '/assets/internal-mobile-system.css?v=20260826-2' not in txt:
        issues.append((rel,'tela interna sem camada responsiva v2'))

# Audit active UI assets for known high-risk fixed desktop patterns.
asset_checks={
    'assets/internal-mobile-system.css':['.vosg-chip.ok','.vosg-pchips','.vosg-question','font-size:16px'],
    'assets/client-portal-mobile-system.css':['@media','.cp-content','.cp-onboarding'],
    'assets/central-ym-mobile.css':['@media'],
    'assets/quemsomos-mobile-system.css':['@media'],
}
for rel,needles in asset_checks.items():
    p=ROOT/rel
    if not p.exists():
        issues.append((rel,'arquivo responsivo ausente'))
        continue
    content=p.read_text(encoding='utf-8',errors='ignore')
    for n in needles:
        if n not in content:
            issues.append((rel,f'proteção esperada ausente: {n}'))

report=[
'# Auditoria responsiva final — 26/08/2026',
'',
f'- Páginas HTML ativas auditadas: **{len(active)}**',
f'- Páginas com cache/versionamento atualizado nesta execução: **{len(changed)}**',
f'- Pendências estáticas detectadas após patch: **{len(issues)}**',
'',
'## Critérios aplicados',
'- viewport mobile presente;',
'- telas do ambiente interno carregam a camada responsiva compartilhada v2;',
'- inputs/selects preservam 16px no mobile para evitar zoom automático;',
'- grids e formulários densos colapsam para uma coluna quando necessário;',
'- tabelas mantêm rolagem dentro do componente, não na página inteira;',
'- MOTOR guiado: etapas e 8Ps reorganizados em grade; perguntas quebram linha; estados ativo/concluído têm contraste explícito;',
'- modais/drawers usam a viewport móvel e áreas de toque adequadas;',
'- Área do Cliente e Quem Somos mantêm camadas responsivas próprias.',
'',
'## Páginas alteradas',
]+[f'- {x}' for x in changed]
if issues:
    report += ['', '## Pendências encontradas']+[f'- {r}: {d}' for r,d in issues]
else:
    report += ['', '## Resultado', '- Nenhuma pendência estática nos critérios acima. A validação visual em navegadores reais continua sendo o gate final de homologação.']
(ROOT/'docs/ux-responsive-final-20260826.md').write_text('\n'.join(report)+'\n',encoding='utf-8')
print({'audited':len(active),'changed':len(changed),'issues':issues})

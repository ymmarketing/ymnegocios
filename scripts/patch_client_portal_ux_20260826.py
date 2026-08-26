from pathlib import Path

ROOT=Path('.')
STORAGE="ym_client_portal_auth_v1"

# 1) Isola sessão do cliente da sessão interna e aceita #resultados no roteamento principal.
p=ROOT/'assets/client-portal.js'
s=p.read_text(encoding='utf-8')
s=s.replace("auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}",f"auth:{{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'{STORAGE}'}}")
s=s.replace("const valid=['inicio','jornada','projetos','calendario','aprovacoes','financeiro','documentos','preferencias'];","const valid=['inicio','jornada','projetos','calendario','aprovacoes','resultados','financeiro','documentos','preferencias'];")
p.write_text(s,encoding='utf-8')

# 2) Bootstrap rápido precisa ler a mesma sessão isolada.
p=ROOT/'assets/client-portal-experience.js'
s=p.read_text(encoding='utf-8')
s=s.replace("auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}",f"auth:{{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false,storageKey:'{STORAGE}'}}")
p.write_text(s,encoding='utf-8')

# 3) Recuperação de senha também grava a sessão do cliente no namespace correto.
p=ROOT/'areadocliente/redefinir/index.html'
s=p.read_text(encoding='utf-8')
s=s.replace("auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}",f"auth:{{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'{STORAGE}'}}")
p.write_text(s,encoding='utf-8')

# 4) Resultados passa a participar do mesmo estado de navegação.
p=ROOT/'assets/client-performance-portal.js'
s=p.read_text(encoding='utf-8')
s=s.replace("button.dataset.performanceNav = '1'; button.innerHTML = '<i>R</i>Resultados';","button.dataset.performanceNav = '1'; button.dataset.nav = 'resultados'; button.innerHTML = '<i>R</i>Resultados';")
s=s.replace("button.onclick = () => { document.querySelectorAll('.cp-view').forEach((x) => x.classList.remove('on')); document.querySelectorAll('.cp-nav button').forEach((x) => x.classList.remove('on')); section.classList.add('on'); button.classList.add('on'); document.getElementById('cpSidebar')?.classList.remove('open'); render(); };","button.onclick = () => { document.querySelectorAll('.cp-view').forEach((x) => x.classList.remove('on')); document.querySelectorAll('.cp-nav button').forEach((x) => x.classList.remove('on')); section.classList.add('on'); button.classList.add('on'); history.replaceState({},'',location.pathname+'#resultados'); document.getElementById('cpSidebar')?.classList.remove('open'); render(); };")
s=s.replace("document.head.append(style); return true;","document.head.append(style); if ((location.hash||'') === '#resultados') setTimeout(() => button.click(), 0); return true;")
s=s.replace("let attempts = 0;", "window.ClientPerformancePortal={render};\n  let attempts = 0;")
p.write_text(s,encoding='utf-8')

# 5) Carrega ferramentas extras da Área do Cliente (documentos + contato configurável).
p=ROOT/'areadocliente/index.html'
s=p.read_text(encoding='utf-8')
needle='<script src="/assets/client-performance-portal.js?v=20260826-2"></script>'
extra=needle+'\n<script src="/assets/client-portal-client-tools.js?v=20260826-1"></script>'
if 'client-portal-client-tools.js' not in s:
    s=s.replace(needle,extra)
p.write_text(s,encoding='utf-8')

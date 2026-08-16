from pathlib import Path

idx=Path('index.html')
css=Path('assets/home-v3.css')
s=idx.read_text()
c=css.read_text()

old='''<button class="btn orange" onclick="startNewRaiox()">Descobrir meu Score</button>\n</div></div></nav>'''
new='''<button class="btn orange" onclick="startNewRaiox()">Descobrir meu Score</button>\n</div></div></nav>\n<div class="quick-access" aria-label="Acessos YM"><div class="quick-access-in">\n<a class="quick-link" href="/interno"><i data-lucide="lock-keyhole"></i><span>Acesso interno</span></a>\n<a class="quick-link" href="/areadocliente"><i data-lucide="user-round"></i><span>Área do cliente</span></a>\n<a class="quick-link" href="/quemsomos"><i data-lucide="building-2"></i><span>Quem somos</span></a>\n</div></div>'''
if old not in s:
    raise SystemExit('Trecho da navegação não encontrado')
s=s.replace(old,new,1)

marker='.btn.ghost{background:#fff;color:var(--navy2);border:1px solid var(--line);box-shadow:none}'
addition='''.btn.ghost{background:#fff;color:var(--navy2);border:1px solid var(--line);box-shadow:none}\n.quick-access{position:relative;z-index:70;background:#fff;border-bottom:1px solid var(--line)}\n.quick-access-in{max-width:var(--max);margin:auto;padding:8px 22px;display:flex;justify-content:flex-end;gap:8px;overflow-x:auto;scrollbar-width:none}.quick-access-in::-webkit-scrollbar{display:none}\n.quick-link{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:34px;padding:8px 12px;border:1px solid #DDE5EE;border-radius:10px;background:#F8FAFD;color:var(--navy2);font-size:10.5px;font-weight:700;white-space:nowrap;transition:.2s}\n.quick-link:hover{background:#EEF2FF;border-color:#CCD2F5;color:var(--indigo);transform:translateY(-1px)}\n.quick-link svg{width:14px;height:14px;color:var(--indigo)}'''
if marker not in c:
    raise SystemExit('Marcador CSS não encontrado')
c=c.replace(marker,addition,1)

mobile='@media(max-width:620px){.navin{padding:9px 14px}'
mobile_new='@media(max-width:620px){.quick-access-in{padding:7px 14px;justify-content:flex-start}.quick-link{flex:0 0 auto;min-height:36px;padding:8px 11px;font-size:10px}.navin{padding:9px 14px}'
if mobile not in c:
    raise SystemExit('Media query mobile não encontrada')
c=c.replace(mobile,mobile_new,1)

idx.write_text(s)
css.write_text(c)
print('Index e CSS atualizados')

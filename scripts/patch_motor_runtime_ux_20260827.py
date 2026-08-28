from pathlib import Path

index=Path('MOTOR/index.html')
text=index.read_text(encoding='utf-8')
old='<script src="/assets/motor-client-context.js?v=20260826-1"></script></body></html>'
new='<script src="/assets/motor-client-context.js?v=20260826-1"></script><script src="/assets/motor-runtime-ux-20260827.js?v=20260827-2"></script></body></html>'
if 'motor-runtime-ux-20260827.js' not in text:
    if old not in text:
        raise SystemExit('target marker not found')
    text=text.replace(old,new)
text=text.replace('/assets/motor-flow-v2.js?v=20260827-3','/assets/motor-flow-v2.js?v=20260827-4')
text=text.replace('/assets/motor-runtime-ux-20260827.js?v=20260827-1','/assets/motor-runtime-ux-20260827.js?v=20260827-2')
if 'motor-order-assist-stable.js' not in text:
    marker='<script src="/assets/motor-runtime-ux-20260827.js?v=20260827-2"></script>'
    if marker not in text:
        raise SystemExit('runtime marker not found')
    text=text.replace(marker,marker+'<script src="/assets/motor-order-assist-stable.js?v=20260828-2"></script>')
text=text.replace('/assets/motor-order-assist-stable.js?v=20260827-1','/assets/motor-order-assist-stable.js?v=20260828-2')
index.write_text(text,encoding='utf-8')

runtime=Path('assets/motor-runtime-ux-20260827.js')
r=runtime.read_text(encoding='utf-8')
needle="function run(){decorateDataGate();decorateClientContext();decorateOrder()}"
replacement="function run(){document.querySelectorAll('[data-order-ai]').forEach(x=>x.remove());decorateDataGate();decorateClientContext();decorateOrder()}"
if needle in r:
    r=r.replace(needle,replacement)
runtime.write_text(r,encoding='utf-8')

stable=Path('assets/motor-order-assist-stable.js')
s=stable.read_text(encoding='utf-8')
old_render="function render(force=false){if(!approved())return;const body=document.querySelector('.sec-order .body');if(!body)return;let panel=document.getElementById('ymOrderAssistStable');if(panel&&!force)return;if(panel)panel.remove();body.insertAdjacentHTML('afterbegin',html(st()));panel=document.getElementById('ymOrderAssistStable');if(panel)bind(panel)}"
new_render="""function findOrderHost(){
    const legacy=document.querySelector('.sec-order .body');if(legacy)return{host:legacy,mode:'legacy'};
    const cards=[...document.querySelectorAll('.vosg-card')];
    const guided=cards.find(c=>{const k=c.querySelector('.vosg-kicker')?.textContent||'';const h=c.querySelector('h3')?.textContent||'';return /ETAPA\\s*6\\s*[·•-]?\\s*ORDENAR/i.test(k)||/o que deve acontecer primeiro/i.test(h)});
    return guided?{host:guided,mode:'guided'}:null
  }
  function render(force=false){if(!approved())return;const target=findOrderHost();if(!target)return;const body=target.host;let panel=document.getElementById('ymOrderAssistStable');if(panel&&!force&&body.contains(panel))return;if(panel)panel.remove();document.querySelectorAll('[data-runtime-order-ai],[data-order-ai],.order-ai').forEach(x=>x.remove());if(target.mode==='legacy'){body.insertAdjacentHTML('afterbegin',html(st()))}else{const divider=body.querySelector('.vosg-divider');const empty=body.querySelector('.vosg-empty');const firstOrder=body.querySelector('.vosg-order');if(firstOrder){firstOrder.insertAdjacentHTML('beforebegin',html(st()))}else if(empty){empty.insertAdjacentHTML('afterend',html(st()))}else if(divider){divider.insertAdjacentHTML('beforebegin',html(st()))}else{const copy=body.querySelector('.vosg-copy');if(copy)copy.insertAdjacentHTML('afterend',html(st()));else body.insertAdjacentHTML('afterbegin',html(st()))}}panel=document.getElementById('ymOrderAssistStable');if(panel)bind(panel)}"""
if old_render not in s:
    raise SystemExit('stable render marker not found')
s=s.replace(old_render,new_render)
stable.write_text(s,encoding='utf-8')

print('patched MOTOR runtime UX + guided ORDENAR assistant')

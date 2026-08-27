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
index.write_text(text,encoding='utf-8')

runtime=Path('assets/motor-runtime-ux-20260827.js')
r=runtime.read_text(encoding='utf-8')
needle="function run(){decorateDataGate();decorateClientContext();decorateOrder()}"
replacement="function run(){document.querySelectorAll('[data-order-ai]').forEach(x=>x.remove());decorateDataGate();decorateClientContext();decorateOrder()}"
if needle in r:
    r=r.replace(needle,replacement)
runtime.write_text(r,encoding='utf-8')
print('patched MOTOR runtime UX')

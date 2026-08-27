from pathlib import Path

path=Path('MOTOR/index.html')
text=path.read_text(encoding='utf-8')
old='<script src="/assets/motor-client-context.js?v=20260826-1"></script></body></html>'
new='<script src="/assets/motor-client-context.js?v=20260826-1"></script><script src="/assets/motor-runtime-ux-20260827.js?v=20260827-1"></script></body></html>'
if 'motor-runtime-ux-20260827.js' not in text:
    if old not in text:
        raise SystemExit('target marker not found')
    text=text.replace(old,new)
text=text.replace('/assets/motor-flow-v2.js?v=20260827-3','/assets/motor-flow-v2.js?v=20260827-4')
path.write_text(text,encoding='utf-8')
print('patched MOTOR/index.html')

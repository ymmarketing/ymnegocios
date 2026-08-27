from pathlib import Path

path = Path('MOTOR/index.html')
text = path.read_text(encoding='utf-8')
old = '<script src="/assets/motor-flow-v2.js?v=20260827-1"></script>'
new = '<script src="/assets/motor-flow-v2.js?v=20260827-2"></script>'
if new in text:
    print('v2 already active')
elif old in text:
    path.write_text(text.replace(old, new, 1), encoding='utf-8')
    print('bumped motor-flow-v2 cache to v2')
else:
    raise SystemExit('v1 script tag not found')

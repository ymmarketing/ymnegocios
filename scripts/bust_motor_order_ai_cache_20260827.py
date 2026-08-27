from pathlib import Path

path = Path('MOTOR/index.html')
text = path.read_text(encoding='utf-8')
old = '<script src="/assets/motor-flow-v2.js"></script>'
new = '<script src="/assets/motor-flow-v2.js?v=20260827-1"></script>'
if new in text:
    print('cache already busted')
elif old in text:
    path.write_text(text.replace(old, new, 1), encoding='utf-8')
    print('updated MOTOR cache version')
else:
    raise SystemExit('motor-flow-v2 script tag not found')

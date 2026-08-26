from pathlib import Path

path = Path('MOTOR/index.html')
text = path.read_text(encoding='utf-8')
tag = '<script src="/assets/motor-client-context.js?v=20260826-1"></script>'
if tag not in text:
    marker = '<script src="/assets/motor-ver-data-gate.js?v=20260824-1"></script>'
    if marker not in text:
        raise SystemExit('Marcador do gate VER não encontrado em MOTOR/index.html')
    text = text.replace(marker, marker + tag, 1)
    path.write_text(text, encoding='utf-8')

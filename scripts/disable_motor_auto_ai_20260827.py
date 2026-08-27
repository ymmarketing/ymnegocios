from pathlib import Path

p = Path('MOTOR/index.html')
text = p.read_text(encoding='utf-8')
old = '<script src="/assets/motor-flow-v2.js"></script><script src="/assets/motor-ai-layer.js?v=20260824-2"></script><script src="/assets/motor-contingency-prompt.js?v=20260824-2"></script>'
new = '<script src="/assets/motor-flow-v2.js"></script><script src="/assets/motor-contingency-prompt.js?v=20260827-1"></script>'
if old not in text:
    raise SystemExit('Trecho esperado não encontrado; patch manual não aplicado.')
text = text.replace(old, new, 1)
p.write_text(text, encoding='utf-8')
print('MOTOR configurado para IA manual; camada automática removida.')

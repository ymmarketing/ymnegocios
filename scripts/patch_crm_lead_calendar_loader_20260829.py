from pathlib import Path

shell = Path('assets/internal-shell.js')
crm = Path('CRM/index.html')

shell_text = shell.read_text(encoding='utf-8')
shell_text = shell_text.replace("/assets/crm15-runtime.js?v=20260826-3", "/assets/crm15-runtime.js?v=20260829-1")
shell.write_text(shell_text, encoding='utf-8')

crm_text = crm.read_text(encoding='utf-8')
crm_text = crm_text.replace('/assets/internal-shell.js?v=20260825-2', '/assets/internal-shell.js?v=20260829-1')
crm.write_text(crm_text, encoding='utf-8')

print('CRM lead calendar loader cache versions updated')

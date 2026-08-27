from pathlib import Path

path = Path('assets/motor-flow-v2.js')
text = path.read_text(encoding='utf-8')
old_endpoint = "const ORDER_AI_API='https://ym-raiox-backend.vercel.app/api/motor/ordenar-ia';"
new_endpoint = "const ORDER_AI_API='https://ym-raiox-backend.vercel.app/api/motor/analise-ia';"
old_body = "body:JSON.stringify({case_id:currentId,manual_prompt:manual?prompt:''})"
new_body = "body:JSON.stringify({case_id:currentId,mode:'ORDENAR',manual_prompt:manual?prompt:''})"
changed = False
if old_endpoint in text:
    text = text.replace(old_endpoint, new_endpoint, 1)
    changed = True
elif new_endpoint not in text:
    raise SystemExit('ORDER AI endpoint anchor not found')
if old_body in text:
    text = text.replace(old_body, new_body, 1)
    changed = True
elif new_body not in text:
    raise SystemExit('ORDER AI request body anchor not found')
if changed:
    path.write_text(text, encoding='utf-8')
    print('updated ORDENAR AI to existing analise-ia endpoint')
else:
    print('endpoint patch already applied')

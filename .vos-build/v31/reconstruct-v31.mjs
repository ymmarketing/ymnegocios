import fs from 'node:fs';
import crypto from 'node:crypto';
import { gunzipSync } from 'node:zlib';

const EXPECTED_SHA256 = 'a23adb0a4f20080fc091432decad218194417299548219369e8f7a50a001f43e';
const OUT = 'raio-x-v3.1-approved.html';

let b64 = '';
for (let i = 1; i <= 6; i += 1) {
  const part = `.vos-build/v31/part${String(i).padStart(2, '0')}.b64`;
  b64 += fs.readFileSync(part, 'utf8').trim();
}

const html = gunzipSync(Buffer.from(b64, 'base64'));
const sha = crypto.createHash('sha256').update(html).digest('hex');

if (sha !== EXPECTED_SHA256) {
  throw new Error(`SHA-256 inválido. Esperado ${EXPECTED_SHA256}, obtido ${sha}`);
}

fs.writeFileSync(OUT, html);
console.log(`OK ${OUT} SHA256=${sha} bytes=${html.length}`);

// node --experimental-strip-types supabase/tests/metricool_schedule.test.mjs
import assert from 'node:assert/strict';
import {
  resolvePublishTime, captionFor, planNetworks, scheduleContent, localToInstant, instantToLocal, credsFromEnv,
} from '../functions/_shared/metricool.ts';

const TZ = 'America/Sao_Paulo';
const CLIENT = '8ed7b547-f2e2-4e29-8bc0-d2ea2b6cba8e';
const cfg = { client_id: CLIENT, metricool_blog_id: '5697820', auto_schedule: true, networks: ['instagram', 'linkedin'], timezone: TZ };
const content = {
  id: 'c1', client_id: CLIENT, format: 'CARROSSEL', publish_date: '2026-10-20', publish_time: '19:00:00',
  caption_instagram: 'Legenda IG\n\n#marketing', caption_linkedin: 'Legenda LI', hashtags: ['marketing', '#vendas'],
  asset_images: { instagram: [`${CLIENT}/a-ig-01.jpg`, `${CLIENT}/a-ig-02.jpg`], linkedin: [`${CLIENT}/a-li-01.jpg`, 'outro-cliente/x.jpg'] },
  schedule_sync: {},
};
const now = new Date('2026-10-12T18:00:00Z'); // 15h em São Paulo

// Fuso
assert.equal(localToInstant('2026-10-20T19:00:00', TZ).toISOString(), '2026-10-20T22:00:00.000Z');
assert.equal(instantToLocal(new Date('2026-10-20T22:00:00Z'), TZ), '2026-10-20T19:00:00');

// Data planejada no futuro: mantém
assert.deepEqual(resolvePublishTime('2026-10-20', '19:00:00', TZ, now), { dateTime: '2026-10-20T19:00:00', moved_from: null });
// Data no passado: daqui a ~20 min, arredondado para 5 min
const late = resolvePublishTime('2026-10-01', '12:00:00', TZ, now);
assert.equal(late.moved_from, '2026-10-01T12:00:00');
assert.equal(late.dateTime, '2026-10-12T15:20:00');
// Sem hora: 12h
assert.equal(resolvePublishTime('2026-10-20', null, TZ, now).dateTime, '2026-10-20T12:00:00');

// Legenda: não duplica hashtag que já está no texto
assert.equal(captionFor(content, 'instagram'), 'Legenda IG\n\n#marketing\n\n#vendas');
assert.equal(captionFor(content, 'linkedin'), 'Legenda LI\n\n#marketing #vendas');

// Reels não agenda (não há vídeo no sistema); imagem de outro cliente é ignorada
assert.deepEqual(planNetworks({ ...content, format: 'REEL' }, cfg).skipped, { instagram: 'video_nao_suportado', linkedin: 'video_nao_suportado' });
assert.deepEqual(planNetworks({ ...content, asset_images: { instagram: [] } }, cfg).skipped, { instagram: 'sem_imagem', linkedin: 'sem_imagem' });

// Credenciais
assert.equal(credsFromEnv(() => undefined), null);
assert.deepEqual(credsFromEnv((k) => ({ METRICOOL_API_TOKEN: 'tok', METRICOOL_USER_ID: '4416960' })[k]), { token: 'tok', userId: '4416960' });

// Metricool simulado
function fakeAdmin() {
  return { storage: { from: () => ({ createSignedUrls: async (paths) => ({ data: paths.map((p) => ({ path: p, signedUrl: 'https://sb.test/sign/' + p })), error: null }) }) } };
}
function fakeFetch(log, { failPost = false } = {}) {
  let n = 0;
  return async (url, init = {}) => {
    log.push({ url, init });
    const ok = (body) => ({ ok: true, status: 200, text: async () => JSON.stringify(body) });
    if (url.includes('/actions/normalize/image/url')) return ok('https://static.metricool.com/x' + (++n) + '.png');
    if (url.includes('/v2/scheduler/posts')) {
      if (failPost) return { ok: false, status: 400, text: async () => JSON.stringify({ message: 'Invalid media' }) };
      return ok({ data: { id: 1000 + n, uuid: 'u' + n, plannerUrl: 'https://app.metricool.com/planner/x' } });
    }
    throw new Error('url inesperada ' + url);
  };
}
const creds = { token: 'tok', userId: '4416960' };

// Agenda IG (2 imagens) e LI (1 imagem válida)
const log = [];
const sync = await scheduleContent({ admin: fakeAdmin(), fetchFn: fakeFetch(log), creds, config: cfg, content, now });
assert.equal(sync.status, 'AGENDADO');
assert.deepEqual(Object.keys(sync.networks).sort(), ['instagram', 'linkedin']);
const posts = log.filter((x) => x.url.includes('/v2/scheduler/posts'));
assert.equal(posts.length, 2);
const body = JSON.parse(posts[0].init.body);
assert.equal(posts[0].init.headers['X-Mc-Auth'], 'tok');
assert.ok(posts[0].url.includes('blogId=5697820') && posts[0].url.includes('userId=4416960'));
assert.deepEqual(body.publicationDate, { dateTime: '2026-10-20T19:00:00', timezone: TZ });
assert.deepEqual(body.providers, [{ network: 'instagram' }]);
assert.equal(body.media.length, 2);
assert.ok(body.media.every((m) => m.startsWith('https://static.metricool.com/')));
assert.equal(body.autoPublish, true);

// Idempotente: segunda chamada não cria post de novo
const log2 = [];
const again = await scheduleContent({ admin: fakeAdmin(), fetchFn: fakeFetch(log2), creds, config: cfg, content: { ...content, schedule_sync: sync }, now });
assert.equal(again.status, 'AGENDADO');
assert.equal(log2.length, 0);

// Erro do Metricool vira status ERRO com motivo
const bad = await scheduleContent({ admin: fakeAdmin(), fetchFn: fakeFetch([], { failPost: true }), creds, config: { ...cfg, networks: ['instagram'] }, content, now });
assert.equal(bad.status, 'ERRO');
assert.match(bad.error, /instagram: metricool_400: Invalid media/);

// Desligado / sem marca / sem credencial
assert.equal((await scheduleContent({ admin: fakeAdmin(), fetchFn: fakeFetch([]), creds, config: { ...cfg, auto_schedule: false }, content, now })).status, 'IGNORADO');
assert.equal((await scheduleContent({ admin: fakeAdmin(), fetchFn: fakeFetch([]), creds, config: { ...cfg, metricool_blog_id: '' }, content, now })).error, 'cliente_sem_marca_metricool');
assert.equal((await scheduleContent({ admin: fakeAdmin(), fetchFn: fakeFetch([]), creds: null, config: cfg, content, now })).error, 'metricool_sem_credenciais');

console.log('metricool_schedule: todos os testes passaram');

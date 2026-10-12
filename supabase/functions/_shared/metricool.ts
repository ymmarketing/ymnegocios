// Agendamento de conteúdos aprovados no Metricool.
// Sem dependências de Deno: recebe o client do Supabase, o fetch e as credenciais por parâmetro
// (assim dá para testar com Metricool simulado).
//
// Credenciais (secrets da edge function):
//   METRICOOL_API_TOKEN  -> Metricool > Configurações da conta > API (plano Advanced ou Custom)
//   METRICOOL_USER_ID    -> id numérico do usuário dono das marcas

export const METRICOOL_BASE = 'https://app.metricool.com/api';
export const CONTENT_BUCKET = 'client-content';
const NETWORKS = ['instagram', 'linkedin', 'facebook'];

export type Creds = { token: string; userId: string };
export type PublishingConfig = {
  client_id: string;
  metricool_blog_id: string;
  auto_schedule: boolean;
  networks: string[];
  timezone: string;
};
type Fetch = (url: string, init?: any) => Promise<any>;

export function credsFromEnv(get: (k: string) => string | undefined): Creds | null {
  const token = (get('METRICOOL_API_TOKEN') || '').trim();
  const userId = (get('METRICOOL_USER_ID') || '').trim();
  return token && /^\d+$/.test(userId) ? { token, userId } : null;
}

// Diferença em minutos entre o fuso informado e UTC num dado instante.
export function tzOffsetMinutes(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(at);
  const v: any = {};
  for (const p of parts) v[p.type] = p.value;
  const asUtc = Date.UTC(+v.year, +v.month - 1, +v.day, +v.hour, +v.minute, +v.second);
  return Math.round((asUtc - at.getTime()) / 60000);
}

export function localToInstant(localDateTime: string, timeZone: string): Date {
  const naive = new Date(localDateTime + 'Z');
  const off = tzOffsetMinutes(naive, timeZone);
  return new Date(naive.getTime() - off * 60000);
}

export function instantToLocal(at: Date, timeZone: string): string {
  const off = tzOffsetMinutes(at, timeZone);
  return new Date(at.getTime() + off * 60000).toISOString().slice(0, 19);
}

// Data/hora de publicação: a planejada; se já passou (aprovação atrasada), daqui a 20 minutos.
export function resolvePublishTime(publishDate: string | null, publishTime: string | null, timeZone: string, now = new Date()) {
  const minLead = 20 * 60000;
  const time = (publishTime || '12:00:00').slice(0, 8).padEnd(8, ':00');
  let planned: string | null = null;
  if (publishDate && /^\d{4}-\d{2}-\d{2}$/.test(publishDate)) planned = `${publishDate}T${time}`;
  if (planned && localToInstant(planned, timeZone).getTime() - now.getTime() >= minLead) {
    return { dateTime: planned, moved_from: null as string | null };
  }
  const soon = new Date(Math.ceil((now.getTime() + minLead) / 300000) * 300000);
  return { dateTime: instantToLocal(soon, timeZone), moved_from: planned };
}

export function captionFor(content: any, network: string): string {
  const base = String(network === 'linkedin' ? content.caption_linkedin || '' : content.caption_instagram || '').trim();
  const tags: string[] = Array.isArray(content.hashtags) ? content.hashtags : [];
  const missing = tags
    .map((t) => String(t || '').trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : '#' + t))
    .filter((t) => !base.toLowerCase().includes(t.toLowerCase()));
  return missing.length ? `${base}\n\n${missing.join(' ')}` : base;
}

export function imagesFor(content: any, network: string): string[] {
  const im = content.asset_images || {};
  const key = network === 'linkedin' ? 'linkedin' : 'instagram';
  const list = Array.isArray(im[key]) ? im[key] : [];
  return list.filter((p: any) => typeof p === 'string' && p.startsWith(String(content.client_id) + '/'));
}

// O que dá para agendar desta peça, rede por rede, e o que fica de fora (com motivo).
export function planNetworks(content: any, config: PublishingConfig) {
  const wanted = (config.networks || []).filter((n) => NETWORKS.includes(n));
  const ready: string[] = [];
  const skipped: Record<string, string> = {};
  for (const n of wanted) {
    if (content.format === 'REEL' || content.format === 'VIDEO_CURTO') { skipped[n] = 'video_nao_suportado'; continue; }
    if (!captionFor(content, n)) { skipped[n] = 'sem_legenda'; continue; }
    if (!imagesFor(content, n).length) { skipped[n] = 'sem_imagem'; continue; }
    ready.push(n);
  }
  return { ready, skipped };
}

function mcUrl(path: string, config: PublishingConfig, creds: Creds, extra: Record<string, string> = {}) {
  const u = new URL(METRICOOL_BASE + path);
  u.searchParams.set('blogId', config.metricool_blog_id);
  u.searchParams.set('userId', creds.userId);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
  return u.toString();
}

async function readBody(res: any) {
  const raw = await res.text();
  try { return JSON.parse(raw); } catch { return raw; }
}

// Copia a imagem para o Metricool (os links assinados expiram; o Metricool precisa de cópia própria).
export async function normalizeImage(fetchFn: Fetch, signedUrl: string, config: PublishingConfig, creds: Creds): Promise<string> {
  const res = await fetchFn(mcUrl('/actions/normalize/image/url', config, creds, { url: signedUrl }), {
    method: 'GET', headers: { 'X-Mc-Auth': creds.token }, signal: AbortSignal.timeout(30000),
  });
  const body = await readBody(res);
  if (!res.ok) throw new Error(`normalize_${res.status}`);
  const found = typeof body === 'string' ? body : body?.url || body?.mediaUrl || body?.data?.url || body?.data;
  if (typeof found !== 'string' || !/^https?:\/\//.test(found)) throw new Error('normalize_resposta_inesperada');
  return found;
}

export function buildPostBody(content: any, network: string, media: string[], when: { dateTime: string }, config: PublishingConfig) {
  const body: any = {
    publicationDate: { dateTime: when.dateTime, timezone: config.timezone || 'America/Sao_Paulo' },
    text: captionFor(content, network),
    providers: [{ network }],
    media,
    mediaAltText: [],
    autoPublish: true,
    draft: false,
    firstCommentText: '',
    descendants: [],
    hasNotReadNotes: false,
    shortener: false,
    smartLinkData: { ids: [] },
  };
  if (network === 'instagram') body.instagramData = { type: 'POST', showReelOnFeed: true, collaborators: [] };
  if (network === 'linkedin') body.linkedinData = { type: 'post', previewIncluded: true, publishImagesAsPDF: false };
  if (network === 'facebook') body.facebookData = { type: 'POST' };
  return body;
}

// Agenda uma peça aprovada. Nunca agenda de novo uma rede que já tem post no Metricool.
// Devolve o novo schedule_sync (o chamador grava no banco).
export async function scheduleContent(opts: {
  admin: any; fetchFn: Fetch; creds: Creds | null; config: PublishingConfig | null; content: any; now?: Date;
}) {
  const { admin, fetchFn, creds, config, content } = opts;
  const now = opts.now || new Date();
  const prev = content.schedule_sync || {};
  const networks: any = { ...(prev.networks || {}) };
  const base = { attempted_at: now.toISOString(), attempts: (prev.attempts || 0) + 1 };

  if (!config || !config.auto_schedule) return { ...prev, ...base, status: 'IGNORADO', error: 'publicacao_automatica_desligada', networks };
  if (!config.metricool_blog_id) return { ...prev, ...base, status: 'ERRO', error: 'cliente_sem_marca_metricool', networks };
  if (!creds) return { ...prev, ...base, status: 'ERRO', error: 'metricool_sem_credenciais', networks };

  const { ready, skipped } = planNetworks(content, config);
  const when = resolvePublishTime(content.publish_date, content.publish_time, config.timezone || 'America/Sao_Paulo', now);
  const errors: Record<string, string> = {};

  for (const n of ready) {
    if (networks[n]?.id) continue; // já agendado antes: idempotente
    try {
      const paths = imagesFor(content, n);
      const signed = await admin.storage.from(CONTENT_BUCKET).createSignedUrls(paths, 60 * 60);
      if (signed.error) throw new Error('assinatura_imagem');
      const urls = (signed.data || []).map((d: any) => d.signedUrl).filter(Boolean);
      if (urls.length !== paths.length) throw new Error('imagem_nao_encontrada');
      const media: string[] = [];
      for (const u of urls) media.push(await normalizeImage(fetchFn, u, config, creds));
      const res = await fetchFn(mcUrl('/v2/scheduler/posts', config, creds), {
        method: 'POST',
        headers: { 'X-Mc-Auth': creds.token, 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPostBody(content, n, media, when, config)),
        signal: AbortSignal.timeout(30000),
      });
      const out = await readBody(res);
      if (!res.ok) throw new Error(`metricool_${res.status}: ${String(typeof out === 'string' ? out : out?.message || out?.error || '').slice(0, 200)}`);
      const d = out?.data || out || {};
      networks[n] = {
        id: d.id ?? null,
        uuid: d.uuid ?? null,
        planner_url: d.plannerUrl || `https://app.metricool.com/planner?blogId=${config.metricool_blog_id}`,
        scheduled_for: when.dateTime,
        scheduled_at: now.toISOString(),
      };
    } catch (e: any) {
      errors[n] = String(e?.message || e).slice(0, 300);
    }
  }

  const scheduledNets = Object.keys(networks).filter((n) => networks[n]?.id || networks[n]?.uuid);
  const status = Object.keys(errors).length ? 'ERRO' : scheduledNets.length ? 'AGENDADO' : 'IGNORADO';
  return {
    ...base,
    status,
    networks,
    skipped,
    errors,
    error: status === 'ERRO' ? Object.entries(errors).map(([k, v]) => `${k}: ${v}`).join(' | ') : status === 'IGNORADO' ? 'nada_para_agendar' : null,
    scheduled_for: when.dateTime,
    moved_from: when.moved_from,
    timezone: config.timezone,
  };
}

// Lê config + peça, agenda e grava o resultado. Usado pelo portal (ao aprovar) e pelo admin (reenviar).
export async function scheduleApprovedContent(admin: any, fetchFn: Fetch, creds: Creds | null, contentId: string, actor: string) {
  const c = await admin.from('central_ym_content_items')
    .select('id,client_id,format,publish_date,publish_time,caption_instagram,caption_linkedin,hashtags,asset_images,status,client_approval_status,schedule_sync')
    .eq('id', contentId).maybeSingle();
  if (c.error) throw c.error;
  if (!c.data) throw new Error('content_not_found');
  if (c.data.client_approval_status !== 'APROVADO') return { status: 'IGNORADO', error: 'conteudo_nao_aprovado' };
  const cfg = await admin.from('client_social_publishing')
    .select('client_id,metricool_blog_id,auto_schedule,networks,timezone')
    .eq('client_id', c.data.client_id).maybeSingle();
  if (cfg.error) throw cfg.error;
  const sync = await scheduleContent({ admin, fetchFn, creds, config: cfg.data, content: c.data });
  const patch: any = { schedule_sync: sync };
  if (sync.status === 'AGENDADO' && ['IDEIA', 'PLANEJADO', 'ROTEIRO', 'EM_PRODUCAO', 'REVISAO', 'APROVADO'].includes(c.data.status)) patch.status = 'AGENDADO';
  const up = await admin.from('central_ym_content_items').update(patch).eq('id', contentId);
  if (up.error) throw up.error;
  await admin.from('vos_access_audit').insert({
    email: actor, role: 'SISTEMA', event: 'CONTENT_METRICOOL_SCHEDULE',
    metadata: { content_id: contentId, client_id: c.data.client_id, status: sync.status, error: sync.error || null, networks: Object.keys(sync.networks || {}) },
  });
  return sync;
}

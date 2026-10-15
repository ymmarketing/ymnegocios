import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { credsFromEnv, scheduleApprovedContent, METRICOOL_BASE } from "../_shared/metricool.ts";

// Publicação automática (Metricool) — painel interno da YM.
// Ações: GET_CONFIG, SET_CONFIG, LIST_BRANDS, RETRY_SCHEDULE.
const PROD = 'https://ymnegocios.com.br';
const ORIGINS = new Set([PROD, 'http://localhost:3000', 'http://localhost:5173']);
function headers(o: string | null) { return { 'Access-Control-Allow-Origin': o && ORIGINS.has(o) ? o : PROD, 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin' }; }
function reply(s: number, b: any, o: string | null) { return new Response(JSON.stringify(b), { status: s, headers: headers(o) }); }
function text(v: any, max = 10000) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }
function uuid(v: any) { return typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v); }
const NETS = ['instagram', 'linkedin', 'facebook'];

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers(origin) });
  if (origin && !ORIGINS.has(origin)) return reply(403, { ok: false, error: 'origin_not_allowed' }, origin);
  if (req.method !== 'POST') return reply(405, { ok: false, error: 'method_not_allowed' }, origin);
  const su = Deno.env.get('SUPABASE_URL'), sk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!su || !sk) return reply(503, { ok: false, error: 'storage_not_configured' }, origin);
  const sb = createClient(su, sk, { auth: { persistSession: false, autoRefreshToken: false } });
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: { user }, error: ue } = await sb.auth.getUser(token);
  if (ue || !user?.email) return reply(401, { ok: false, error: 'invalid_session' }, origin);
  const email = user.email.toLowerCase();
  const { data: access, error: ae } = await sb.from('vos_internal_access').select('role,active').eq('email', email).maybeSingle();
  if (ae || !access?.active) return reply(403, { ok: false, error: 'forbidden' }, origin);

  let b: any; try { b = await req.json(); } catch { return reply(400, { ok: false, error: 'invalid_json' }, origin); }
  const action = text(b.action, 40);
  const creds = credsFromEnv((k) => Deno.env.get(k));

  try {
    if (action === 'GET_CONFIG' && uuid(b.client_id)) {
      const q = await sb.from('client_social_publishing').select('client_id,metricool_blog_id,auto_schedule,networks,timezone,notes,updated_at,updated_by').eq('client_id', b.client_id).maybeSingle();
      if (q.error) throw q.error;
      return reply(200, { ok: true, credentials_configured: !!creds, config: q.data || { client_id: b.client_id, metricool_blog_id: '', auto_schedule: false, networks: ['instagram'], timezone: 'America/Sao_Paulo', notes: '' } }, origin);
    }

    if (action === 'SET_CONFIG' && uuid(b.client_id)) {
      const blog = text(b.metricool_blog_id, 20);
      if (blog && !/^\d+$/.test(blog)) return reply(400, { ok: false, error: 'invalid_blog_id' }, origin);
      const networks = (Array.isArray(b.networks) ? b.networks : []).map((n: any) => text(n, 20)).filter((n: string) => NETS.includes(n));
      const auto = !!b.auto_schedule;
      if (auto && (!blog || !networks.length)) return reply(400, { ok: false, error: 'blog_and_networks_required' }, origin);
      const row = { client_id: b.client_id, provider: 'METRICOOL', metricool_blog_id: blog, auto_schedule: auto, networks: networks.length ? networks : ['instagram'], timezone: text(b.timezone, 60) || 'America/Sao_Paulo', notes: text(b.notes, 2000), updated_at: new Date().toISOString(), updated_by: email };
      const q = await sb.from('client_social_publishing').upsert(row, { onConflict: 'client_id' }).select().single();
      if (q.error) throw q.error;
      await sb.from('vos_access_audit').insert({ email, role: access.role, event: 'CONTENT_PUBLISHING_CONFIG', metadata: { client_id: b.client_id, auto_schedule: auto, networks: row.networks, blog_set: !!blog } });
      return reply(200, { ok: true, config: q.data }, origin);
    }

    if (action === 'LIST_BRANDS') {
      if (!creds) return reply(409, { ok: false, error: 'metricool_sem_credenciais' }, origin);
      const r = await fetch(`${METRICOOL_BASE}/admin/simpleProfiles?userId=${creds.userId}`, { headers: { 'X-Mc-Auth': creds.token }, signal: AbortSignal.timeout(20000) });
      const raw = await r.text(); let data: any; try { data = JSON.parse(raw); } catch { data = raw; }
      if (!r.ok) return reply(502, { ok: false, error: `metricool_${r.status}` }, origin);
      const list = (Array.isArray(data) ? data : data?.data || []).map((p: any) => ({ blog_id: String(p.id ?? p.blogId ?? ''), label: p.label || p.name || '', instagram: p.instagram || p.networksData?.instagramData || '', linkedin: p.linkedinCompany || p.linkedin || '', facebook: p.facebookPageId || p.networksData?.facebookData || '' })).filter((p: any) => p.blog_id);
      return reply(200, { ok: true, brands: list }, origin);
    }

    if (action === 'RETRY_SCHEDULE' && uuid(b.content_id)) {
      const cur = await sb.from('central_ym_content_items').select('id,schedule_sync').eq('id', b.content_id).maybeSingle();
      if (cur.error) throw cur.error;
      if (!cur.data) return reply(404, { ok: false, error: 'content_not_found' }, origin);
      if (cur.data.schedule_sync?.adjust_after_schedule && b.clear_adjust) {
        const s = { ...cur.data.schedule_sync }; delete s.adjust_after_schedule;
        const u = await sb.from('central_ym_content_items').update({ schedule_sync: s }).eq('id', b.content_id); if (u.error) throw u.error;
      }
      const sync = await scheduleApprovedContent(sb, fetch, creds, b.content_id, email);
      return reply(200, { ok: true, schedule_sync: sync }, origin);
    }

    return reply(400, { ok: false, error: 'unsupported_action' }, origin);
  } catch (e: any) {
    console.error('content-publishing-admin', action, e?.message || e);
    return reply(409, { ok: false, error: 'action_failed', detail: String(e?.message || e).slice(0, 300) }, origin);
  }
});

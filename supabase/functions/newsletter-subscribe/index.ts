import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Newsletter YM: inscrição (POST) e descadastro (GET ?u=&t=).
// Fonte de verdade: public.newsletter_subscribers. Envio: Resend (segmento + tópico).

const SEGMENT_ID = "a129e2e6-449d-4244-9f65-b7df0a8631ea"; // Resend: Newsletter YM
const TOPIC_ID = "deb9c792-8f49-4577-a598-6024affd56a0";   // Resend: Newsletter quinzenal YM
const FROM = "Yasmin Menezes | YM <newsletter@ymnegocios.com.br>";
const REPLY_TO = "ymmarketingenegocios@gmail.com";
const SITE = "https://ymnegocios.com.br";
const FN_URL = "https://srzdikgztpdtwbggwniz.supabase.co/functions/v1/newsletter-subscribe";
const CONSENT_TEXT = "Aceito receber a newsletter quinzenal da YM Marketing & Negócios por e-mail. Posso cancelar quando quiser.";

const allowed = new Set(["https://ymnegocios.com.br", "https://www.ymnegocios.com.br", "http://localhost:8765", "http://localhost:8000"]);
function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && allowed.has(origin) ? origin : SITE,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, apikey, authorization",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}
const reply = (status: number, body: unknown, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: cors(origin) });
const clean = (v: unknown, max: number) => typeof v === "string" ? v.trim().slice(0, max) : "";
const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));

type Env = { url: string; key: string; resend: string };
let cachedResend = "";
async function env(): Promise<Env> {
  const url = Deno.env.get("SUPABASE_URL") || "";
  let key = "";
  try { key = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default || ""; } catch { /* fallback */ }
  key ||= Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  // Chave do Resend com acesso a contatos fica no Vault (resend_newsletter_key)
  if (!cachedResend && url && key) {
    try {
      const r = await fetch(`${url}/rest/v1/rpc/newsletter_resend_key`, { method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: "{}" });
      if (r.ok) cachedResend = (await r.json()) || "";
    } catch { /* fallback abaixo */ }
  }
  return { url, key, resend: cachedResend || Deno.env.get("RESEND_API_KEY") || "" };
}

async function hmac(secret: string, value: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 40);
}
const b64 = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));

async function db(e: Env, path: string, init: RequestInit = {}) {
  return fetch(`${e.url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: e.key, Authorization: `Bearer ${e.key}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

async function resend(e: Env, method: string, path: string, body?: unknown) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${e.resend}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: any = null;
  try { data = await res.json(); } catch { /* empty */ }
  return { ok: res.ok, status: res.status, data };
}

async function syncContact(e: Env, email: string, firstName: string) {
  let contactId = "";
  const created = await resend(e, "POST", "/contacts", { email, first_name: firstName || undefined, unsubscribed: false });
  if (created.ok) contactId = created.data?.id || "";
  else {
    // Contato já existe: reativa
    const upd = await resend(e, "PATCH", `/contacts/${encodeURIComponent(email)}`, { unsubscribed: false, first_name: firstName || undefined });
    if (!upd.ok) throw new Error(`contact_${created.status}_${upd.status}:${created.data?.message || upd.data?.message || ""}`.slice(0, 200));
    contactId = upd.data?.id || "";
  }
  const seg = await resend(e, "POST", `/contacts/${encodeURIComponent(email)}/segments/${SEGMENT_ID}`);
  if (!seg.ok && seg.status !== 409) throw new Error(`segment_${seg.status}:${seg.data?.message || ""}`.slice(0, 200));
  const top = await resend(e, "PATCH", `/contacts/${encodeURIComponent(email)}/topics`, [{ id: TOPIC_ID, subscription: "opt_in" }]);
  if (!top.ok) console.warn("topic_sync_failed", top.status);
  return contactId;
}

function welcomeHtml(firstName: string, unsubUrl: string) {
  const hi = firstName ? `Olá, ${esc(firstName)}!` : "Olá!";
  const btn = (href: string, label: string, bg: string) =>
    `<table cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${bg}" style="background-color:${bg};border-radius:10px"><a href="${href}" style="display:inline-block;padding-top:14px;padding-bottom:14px;padding-left:22px;padding-right:22px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;color:#ffffff;font-weight:bold;text-decoration:none">${label}</a></td></tr></table>`;
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="IE=edge"><title>Bem-vindo(a) à newsletter da YM</title></head><body style="margin:0;padding:0;background-color:#f3f6fb">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3f6fb" style="background-color:#f3f6fb"><tr><td align="center" style="padding-top:28px;padding-bottom:28px;padding-left:12px;padding-right:12px">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:18px">
<tr><td bgcolor="#0b1533" style="background-color:#0b1533;padding-top:28px;padding-bottom:28px;padding-left:32px;padding-right:32px;border-radius:18px 18px 0 0">
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:16px;letter-spacing:2px;color:#ffb066;font-weight:bold">NEWSLETTER YM · QUINZENAL</p>
<p style="margin:10px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:32px;color:#ffffff;font-weight:bold">Marketing certo, na ordem certa.</p></td></tr>
<tr><td style="padding-top:28px;padding-bottom:8px;padding-left:32px;padding-right:32px">
<p style="margin:0 0 14px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#18233f">${hi}</p>
<p style="margin:0 0 14px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#18233f">Sua inscrição está confirmada. A cada 15 dias você recebe um e-mail curto, com uma pergunta que todo empresário faz antes de investir em marketing, a resposta prática e um passo para aplicar no seu negócio.</p>
<p style="margin:0 0 18px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#18233f">Para começar, separei o conteúdo mais pedido: <b>as perguntas que você precisa fazer antes de contratar uma agência ou consultoria de marketing</b>.</p>
${btn(`${SITE}/conteudos/perguntas-antes-de-contratar-agencia-de-marketing/?utm_source=newsletter&utm_medium=email&utm_campaign=boas_vindas`, "Ler o checklist", "#484dcf")}
<p style="margin:24px 0 14px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#18233f">E se quiser saber por onde o seu negócio deveria começar, a avaliação inicial é gratuita e leva cerca de 4 minutos:</p>
${btn(`${SITE}/triagem/?utm_source=newsletter&utm_medium=email&utm_campaign=boas_vindas`, "Fazer a avaliação gratuita", "#ff7a00")}
<p style="margin:26px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#18233f">Até a próxima,<br><b>Yasmin Menezes</b><br>YM Marketing &amp; Negócios</p></td></tr>
<tr><td style="padding-top:22px;padding-bottom:26px;padding-left:32px;padding-right:32px">
<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#7a869d">Você recebeu este e-mail porque se inscreveu em ymnegocios.com.br. YM Marketing &amp; Negócios · CNPJ 65.606.945/0001-05 · Belo Horizonte (MG). <a href="${unsubUrl}" style="color:#7a869d;text-decoration:underline">Cancelar inscrição</a>.</p></td></tr>
</table></td></tr></table></body></html>`;
}

function page(title: string, msg: string) {
  return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head><body style="margin:0;font-family:Arial,sans-serif;background:#f3f6fb;color:#18233f"><div style="max-width:520px;margin:12vh auto;background:#fff;border-radius:18px;padding:32px;text-align:center"><h1 style="font-size:22px;margin:0 0 12px">${title}</h1><p style="line-height:1.6;margin:0 0 20px">${msg}</p><a href="${SITE}/" style="color:#484dcf;font-weight:bold">Voltar ao site da YM</a></div></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const e = await env();
  const url = new URL(req.url);

  // Descadastro via link do e-mail de boas-vindas
  if (req.method === "GET" && url.searchParams.get("u")) {
    try {
      const email = unb64(url.searchParams.get("u") || "").toLowerCase();
      const token = url.searchParams.get("t") || "";
      if (!e.key || token !== await hmac(e.key, `unsub:${email}`)) return page("Link inválido", "Não foi possível confirmar este link. Responda qualquer e-mail da YM pedindo o cancelamento e faremos manualmente.");
      await db(e, `newsletter_subscribers?email=ilike.${encodeURIComponent(email)}`, {
        method: "PATCH", headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "descadastrado", unsubscribed_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
      });
      if (e.resend) await resend(e, "PATCH", `/contacts/${encodeURIComponent(email)}`, { unsubscribed: true });
      return page("Inscrição cancelada", "Você não vai mais receber a newsletter da YM. Se mudar de ideia, é só se inscrever de novo no site.");
    } catch {
      return page("Link inválido", "Não foi possível confirmar este link.");
    }
  }

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST" || !origin || !allowed.has(origin)) return reply(403, { error: "origin_not_allowed" }, origin);
  if (!e.url || !e.key) return reply(503, { error: "storage_unavailable" }, origin);

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 4000) return reply(413, { error: "payload_too_large" }, origin);
    body = JSON.parse(raw);
  } catch { return reply(400, { error: "invalid_json" }, origin); }

  if (clean(body.website, 100)) return reply(200, { ok: true }, origin); // honeypot
  if (body.consent !== true) return reply(400, { error: "consent_required" }, origin);
  const email = clean(body.email, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return reply(400, { error: "invalid_email" }, origin);
  const firstName = clean(body.first_name, 60).split(/\s+/)[0] || "";
  const source = clean(body.source_page, 200);

  // Limite simples: 5 inscrições por IP por hora
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "sem-ip";
  const reqHash = await hmac(e.key, `ip:${ip}`);
  const since = new Date(Date.now() - 3600_000).toISOString();
  const recent = await db(e, `newsletter_subscribers?select=id&request_hash=eq.${reqHash}&updated_at=gte.${since}`);
  if (recent.ok && (await recent.json()).length >= 5) return reply(429, { error: "too_many_requests" }, origin);

  const now = new Date().toISOString();
  const up = await db(e, "newsletter_subscribers?on_conflict=email", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ email, first_name: firstName || null, source_page: source || null, consent_text: CONSENT_TEXT, consent_at: now,
      status: "ativo", unsubscribed_at: null, request_hash: reqHash, updated_at: now }),
  });
  if (!up.ok) {
    console.error("newsletter_store_error", up.status, (await up.text()).slice(0, 200));
    return reply(503, { error: "storage_unavailable" }, origin);
  }
  const row = (await up.json())[0];

  let sync: "ok" | "erro" = "erro";
  let syncError: string | null = null;
  let contactId: string | null = null;
  let welcomeAt: string | null = row?.welcome_sent_at || null;
  if (!e.resend) syncError = "resend_key_missing";
  else {
    try { contactId = await syncContact(e, email, firstName) || null; sync = "ok"; }
    catch (err) { syncError = err instanceof Error ? err.message : "sync_failed"; console.error("newsletter_resend_sync", syncError); }
    if (!welcomeAt) {
      const unsubUrl = `${FN_URL}?u=${b64(email)}&t=${await hmac(e.key, `unsub:${email}`)}`;
      const sent = await resend(e, "POST", "/emails", {
        from: FROM, to: [email], reply_to: REPLY_TO,
        subject: firstName ? `${firstName}, sua inscrição na newsletter da YM está confirmada` : "Sua inscrição na newsletter da YM está confirmada",
        html: welcomeHtml(firstName, unsubUrl),
        headers: { "List-Unsubscribe": `<${unsubUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      });
      if (sent.ok) welcomeAt = new Date().toISOString();
      else console.error("newsletter_welcome_error", sent.status, sent.data?.message);
    }
  }
  await db(e, `newsletter_subscribers?id=eq.${row.id}`, {
    method: "PATCH", headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ resend_sync: sync, resend_error: syncError, resend_contact_id: contactId, welcome_sent_at: welcomeAt }),
  });
  return reply(200, { ok: true }, origin);
});

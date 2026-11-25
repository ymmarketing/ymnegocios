import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/* Mapa Digital YM · recepção dos links após o pagamento (25/11/2026)
   Substitui o questionário do Raio-X. Fluxo:
   1. confere no backend do Asaas se o pagamento da referência está aprovado;
   2. grava o pedido em mapa_digital_pedidos (status RECEBIDO; idempotente por payment_ref);
   3. avisa a equipe interna (vos_internal_access) e confirma ao cliente por e-mail (Resend).
   A geração é feita pela tarefa agendada, e a entrega ao cliente só acontece após aprovação da Yasmin.
   Modo teste: body.test_key cujo hash bate com TEST_KEY_HASH e ref começando com ym_mapa_teste_. */

const PAYMENT_STATUS_URL = "https://ym-raiox-backend.vercel.app/api/pagamento/status";
const ALLOWED_ORIGINS = new Set(["https://ymnegocios.com.br", "https://www.ymnegocios.com.br"]);
const FROM_TEAM = "Mapa Digital YM <acesso@ymnegocios.com.br>";
const FROM_CLIENT = "YM Marketing & Negócios <acesso@ymnegocios.com.br>";
const WHATSAPP_YM = "(31) 97507-3862";
const TEST_SALT = "YM-MAPA-TEST-2026:";
const TEST_KEY_HASH = "58136a20d1290d9b89e730710b7c2e7e35899012d853c75cbab5b60546d65b44";

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
const clean = (v: unknown, max = 300) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

function cors(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://ymnegocios.com.br";
  return { "Access-Control-Allow-Origin": allow, "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST,OPTIONS", "Vary": "Origin", "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
}
const reply = (status: number, body: Record<string, unknown>, origin: string | null) => new Response(JSON.stringify(body), { status, headers: cors(origin) });

async function sha256(t: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function normUrl(v: unknown, insta = false): string {
  let s = clean(v, 500);
  if (!s) return "";
  if (insta && /^@?[A-Za-z0-9._]{2,30}$/.test(s)) return `https://www.instagram.com/${s.replace(/^@/, "")}/`;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try { const u = new URL(s); if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) return ""; return u.toString(); } catch { return ""; }
}

function parseLinks(raw: any) {
  const out: Record<string, unknown> = {};
  const insta = normUrl(raw?.instagram, true), site = normUrl(raw?.site), google = normUrl(raw?.google);
  if (insta) out.instagram = insta;
  if (site) out.site = site;
  if (google) out.google = google;
  const outros = Array.isArray(raw?.outros) ? raw.outros.map((o: unknown) => normUrl(o)).filter(Boolean).slice(0, 6) : [];
  if (outros.length) out.outros = outros;
  return out;
}

async function sendEmail(key: string, idem: string, payload: Record<string, unknown>) {
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": idem }, body: JSON.stringify(payload) });
  if (!r.ok) console.error("mapa-digital-intake resend", r.status, (await r.text()).slice(0, 200));
  return r.ok;
}

function linksHtml(l: Record<string, any>) {
  const rows: string[] = [];
  for (const k of ["instagram", "site", "google"]) if (l[k]) rows.push(`<li><b>${k}:</b> <a href="${esc(l[k])}">${esc(l[k])}</a></li>`);
  for (const o of (l.outros || [])) rows.push(`<li><b>outro:</b> <a href="${esc(o)}">${esc(o)}</a></li>`);
  return `<ul style="padding-left:18px;margin:8px 0">${rows.join("")}</ul>`;
}
const shell = (title: string, body: string) => `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#F7F9FC;font-family:Inter,Arial,sans-serif;color:#24344c"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 14px"><table role="presentation" width="100%" style="max-width:560px;background:#fff;border:1px solid #E4EAF2;border-radius:16px"><tr><td style="padding:26px 24px"><div style="font-size:11px;font-weight:800;letter-spacing:.12em;color:#FF7A00;text-transform:uppercase">Mapa Digital YM</div><h1 style="font-size:21px;color:#0A2540;margin:8px 0 14px;line-height:1.3">${title}</h1>${body}</td></tr></table></td></tr></table></body></html>`;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return reply(405, { ok: false, error: "method_not_allowed" }, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return reply(403, { ok: false, error: "origin_not_allowed" }, origin);

  let body: any; try { body = await req.json(); } catch { return reply(400, { ok: false, error: "invalid_json" }, origin); }
  const ref = clean(body?.ref, 200);
  const isTest = typeof body?.test_key === "string" && (await sha256(TEST_SALT + body.test_key)) === TEST_KEY_HASH;
  if (isTest) {
    if (!/^ym_mapa_teste_[a-z0-9_-]{4,60}$/.test(ref)) return reply(400, { ok: false, error: "invalid_test_ref" }, origin);
  } else if (!/^ym_raiox_[a-zA-Z0-9_-]{8,180}$/.test(ref)) return reply(400, { ok: false, error: "invalid_ref" }, origin);

  const empresa = clean(body?.empresa, 160), nome = clean(body?.nome, 120), email = clean(body?.email, 200).toLowerCase();
  const whatsapp = clean(body?.whatsapp, 40).replace(/[^\d+]/g, "");
  const cidade = clean(body?.cidade, 120), segmento = clean(body?.segmento, 200), objetivo = clean(body?.objetivo, 600), observacoes = clean(body?.observacoes, 1200);
  const links = parseLinks(body?.links || {});
  if (!empresa) return reply(400, { ok: false, error: "empresa_obrigatoria" }, origin);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400, { ok: false, error: "email_invalido" }, origin);
  if (!links.instagram && !links.site && !links.google) return reply(400, { ok: false, error: "informe_ao_menos_um_link" }, origin);
  if (body?.consentimento !== true) return reply(400, { ok: false, error: "consentimento_obrigatorio" }, origin);

  if (!isTest) {
    try {
      const r = await fetch(`${PAYMENT_STATUS_URL}?ref=${encodeURIComponent(ref)}`, { headers: { "Cache-Control": "no-store" } });
      if (!r.ok) return reply(503, { ok: false, error: "payment_status_unavailable" }, origin);
      const st = await r.json();
      if (st?.status !== "approved") return reply(403, { ok: false, error: "payment_not_approved" }, origin);
    } catch { return reply(503, { ok: false, error: "payment_status_unavailable" }, origin); }
  }

  const su = Deno.env.get("SUPABASE_URL"), sk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), rk = Deno.env.get("RESEND_API_KEY");
  if (!su || !sk) return reply(503, { ok: false, error: "storage_not_configured" }, origin);
  const sb = createClient(su, sk, { auth: { persistSession: false, autoRefreshToken: false } });

  const existing = await sb.from("mapa_digital_pedidos").select("id,status,created_at").eq("payment_ref", ref).maybeSingle();
  if (existing.error) return reply(500, { ok: false, error: "storage_lookup_error" }, origin);
  if (existing.data) return reply(200, { ok: true, pedido_id: existing.data.id, status: existing.data.status, idempotent: true }, origin);

  const ins = await sb.from("mapa_digital_pedidos").insert({ payment_ref: ref, is_test: isTest, empresa, nome: nome || null, email, whatsapp: whatsapp || null, cidade: cidade || null, segmento: segmento || null, objetivo: objetivo || null, observacoes: observacoes || null, links, consent_at: new Date().toISOString() }).select("id,created_at").single();
  if (ins.error) { console.error("mapa-digital-intake insert", ins.error.code, ins.error.message); return reply(500, { ok: false, error: "storage_error" }, origin); }

  let teamSent = false, clientSent = false;
  if (rk) {
    try {
      const q = await sb.from("vos_internal_access").select("email").eq("active", true);
      const to = [...new Set((q.data || []).map((x: any) => String(x.email || "").trim().toLowerCase()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)))];
      if (to.length) {
        const tag = isTest ? "[TESTE] " : "";
        teamSent = await sendEmail(rk, `mapa-team-${ins.data.id}`, { from: FROM_TEAM, to, subject: `${tag}Novo Mapa Digital: ${empresa}`.slice(0, 180), html: shell(`${tag}Novo pedido: ${esc(empresa)}`, `<p style="font-size:14.5px;line-height:1.6;margin:0 0 10px"><b>Contato:</b> ${esc(nome || "(sem nome)")} · ${esc(email)}${whatsapp ? " · " + esc(whatsapp) : ""}<br><b>Cidade:</b> ${esc(cidade || "-")}<br><b>Segmento:</b> ${esc(segmento || "-")}<br><b>Objetivo:</b> ${esc(objetivo || "-")}</p><p style="font-size:14.5px;margin:0"><b>Links:</b></p>${linksHtml(links)}${observacoes ? `<p style="font-size:14px;margin:10px 0 0"><b>Observações:</b> ${esc(observacoes)}</p>` : ""}<p style="font-size:13px;color:#66758f;margin:16px 0 0">Prazo combinado: 1 dia útil. A geração entra na fila automaticamente; você recebe o aviso para aprovar antes do envio ao cliente.</p>`) });
      }
      clientSent = await sendEmail(rk, `mapa-client-${ins.data.id}`, { from: FROM_CLIENT, to: [email], subject: "Recebemos seus links: seu Mapa Digital está a caminho", html: shell(`Olá${nome ? ", " + esc(nome.split(" ")[0]) : ""}! Recebemos os links de ${esc(empresa)}.`, `<p style="font-size:15px;line-height:1.6;margin:0 0 12px">Seu <b>Mapa Digital</b> fica pronto em até <b>1 dia útil</b>. Nele, você vai ver como o seu negócio aparece hoje no Instagram, no site e no Google, o que já funciona e as oportunidades para ir mais longe.</p><p style="font-size:15px;line-height:1.6;margin:0 0 12px">Assim que estiver pronto, enviamos o link para você, com o convite para a conversa de 30 minutos com a Yasmin.</p>${linksHtml(links)}<p style="font-size:13.5px;color:#66758f;margin:16px 0 0">Alguma dúvida? Fale com a YM pelo WhatsApp ${WHATSAPP_YM}.</p>`) });
    } catch (e) { console.error("mapa-digital-intake email", String(e)); }
  }
  return reply(201, { ok: true, pedido_id: ins.data.id, created_at: ins.data.created_at, prazo: "1 dia útil", team_email: teamSent, client_email: clientSent, test: isTest }, origin);
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/* Central YM · aviso para a equipe YM quando o cliente responde na Área do Cliente (11/11/2026)
   Chamado pelo gatilho do banco em client_approval_actions (cabeçalho x-ym-cron-key = segredo ym_team_alert_key).
   Ações:
   - APPROVAL_ACTION {action_id}          → e-mail imediato para a equipe interna (aprovado / ajuste / comentário)
   - DIGEST {client_id, since}            → resumo de todas as respostas do cliente desde a data (reenvio/recuperação) */

const FROM = "Central YM <acesso@ymnegocios.com.br>";
const CENTRAL_URL = "https://ymnegocios.com.br/CENTRAL/?view=aprovacoes";
const TZ = "America/Sao_Paulo";
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
const uuid = (v: unknown) => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const fmt = (v?: string | null, withTime = true) => { if (!v) return ""; const d = new Date(v); if (Number.isNaN(d.getTime())) return ""; return new Intl.DateTimeFormat("pt-BR", withTime ? { timeZone: TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" } : { timeZone: TZ, weekday: "short", day: "2-digit", month: "2-digit" }).format(d); };
const LABEL: Record<string, { txt: string; color: string; bg: string }> = {
  APROVADO: { txt: "APROVADO", color: "#0F7A3D", bg: "#E3F5EA" },
  AJUSTE_SOLICITADO: { txt: "PEDIU AJUSTE", color: "#B54708", bg: "#FEF0E1" },
  COMENTARIO: { txt: "COMENTÁRIO", color: "#1D4ED8", bg: "#E5EDFF" },
};

function card(r: any) {
  const l = LABEL[r.action] || LABEL.COMENTARIO;
  const pub = fmt(r.scheduled_at, false);
  return `<tr><td style="padding:0 0 14px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dfe7ef;border-radius:12px"><tr><td style="padding:16px 18px">`
    + `<span style="display:inline-block;font-size:11px;font-weight:800;letter-spacing:.06em;color:${l.color};background:${l.bg};padding:4px 9px;border-radius:999px">${l.txt}</span>`
    + `<div style="font-size:17px;font-weight:800;color:#0A2540;margin-top:10px;line-height:1.35">${esc(r.title)}</div>`
    + (pub ? `<div style="font-size:13px;color:#53677a;margin-top:4px">Publicação prevista: ${esc(pub)}</div>` : "")
    + (r.comment ? `<div style="margin-top:12px;background:#f5f8fb;border-left:3px solid ${l.color};padding:12px 14px;font-size:15px;line-height:1.55;color:#17324a;white-space:pre-wrap">${esc(r.comment)}</div>` : "")
    + `<div style="font-size:12px;color:#81909e;margin-top:10px">${esc(r.actor_email || "cliente")} · ${esc(fmt(r.created_at))}</div>`
    + `</td></tr></table></td></tr>`;
}

function page(heading: string, intro: string, rows: any[]) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f2f5f8;font-family:Arial,Helvetica,sans-serif;color:#17324a"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 10px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #dfe7ef"><tr><td bgcolor="#0A2540" style="background:#0A2540;padding:22px 26px"><p style="margin:0;font-size:11px;letter-spacing:1.2px;font-weight:700;color:#9fc2ff">CENTRAL YM · RESPOSTA DO CLIENTE</p><h1 style="margin:8px 0 0;font-size:22px;line-height:28px;color:#ffffff">${esc(heading)}</h1></td></tr><tr><td style="padding:22px 26px 10px"><p style="margin:0 0 16px;font-size:14px;line-height:22px;color:#53677a">${esc(intro)}</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.map(card).join("")}</table><table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 16px"><tr><td bgcolor="#0066FF" style="border-radius:10px"><a href="${CENTRAL_URL}" style="display:inline-block;padding:13px 20px;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px">Abrir Aprovações na Central YM</a></td></tr></table></td></tr><tr><td style="border-top:1px solid #edf1f5;padding:14px 26px;font-size:11px;line-height:17px;color:#81909e">Aviso interno automático da Central YM. As respostas também aparecem no sino da Central, e os pedidos de ajuste entram em Pendências operacionais.</td></tr></table></td></tr></table></body></html>`;
}

function plain(heading: string, rows: any[]) {
  return heading + "\n\n" + rows.map((r) => `• ${(LABEL[r.action] || LABEL.COMENTARIO).txt} · ${r.title}${r.scheduled_at ? ` (publicação ${fmt(r.scheduled_at, false)})` : ""}${r.comment ? `\n  "${r.comment}"` : ""}`).join("\n\n") + `\n\nAbrir na Central YM: ${CENTRAL_URL}`;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false, error: "method_not_allowed" });
  const su = Deno.env.get("SUPABASE_URL"), sk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), rk = Deno.env.get("RESEND_API_KEY");
  if (!su || !sk) return json(503, { ok: false, error: "storage_not_configured" });
  const sb = createClient(su, sk, { auth: { persistSession: false, autoRefreshToken: false } });
  const ok = await sb.rpc("central_ym_check_team_alert_key", { p_key: req.headers.get("x-ym-cron-key") || "" });
  if (ok.error || ok.data !== true) return json(401, { ok: false, error: "invalid_key" });
  let b: any = {}; try { b = await req.json(); } catch { return json(400, { ok: false, error: "invalid_json" }); }
  const action = String(b.action || "").toUpperCase();

  async function recipients() {
    const q = await sb.from("vos_internal_access").select("email").eq("active", true);
    if (q.error) throw q.error;
    return [...new Set((q.data || []).map((x: any) => String(x.email || "").trim().toLowerCase()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)))];
  }
  async function clientName(clientId: string) {
    const q = await sb.from("crm_clients").select("contact:crm_contacts(name,business_name)").eq("id", clientId).maybeSingle();
    const c: any = Array.isArray(q.data?.contact) ? q.data?.contact[0] : q.data?.contact;
    return c?.business_name || c?.name || "Cliente";
  }
  async function send(o: { clientId: string; key: string; resourceId: string; subject: string; heading: string; intro: string; rows: any[] }) {
    const to = await recipients();
    if (!to.length) return { status: "SKIPPED", reason: "NO_INTERNAL_RECIPIENT" };
    const ins = await sb.from("client_email_deliveries").insert({ client_id: o.clientId, recipient_email: to.join(",").slice(0, 500), notification_kind: "ALERTA_EQUIPE", resource_type: "APPROVAL_ACTION", resource_id: o.resourceId, idempotency_key: o.key, provider: "RESEND", status: "PENDING", metadata: { subject: o.subject, items: o.rows.length } }).select("id").single();
    if (ins.error?.code === "23505") return { status: "DUPLICATE" };
    if (ins.error) throw ins.error;
    if (!rk) { await sb.from("client_email_deliveries").update({ status: "FAILED", error_code: "RESEND_NOT_CONFIGURED", updated_at: new Date().toISOString() }).eq("id", ins.data.id); return { status: "FAILED", reason: "RESEND_NOT_CONFIGURED" }; }
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${rk}`, "Content-Type": "application/json", "Idempotency-Key": o.key }, body: JSON.stringify({ from: FROM, to, subject: o.subject.slice(0, 180), html: page(o.heading, o.intro, o.rows), text: plain(o.heading, o.rows) }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const code = String(j?.message || j?.name || `HTTP_${r.status}`).slice(0, 200); await sb.from("client_email_deliveries").update({ status: "FAILED", error_code: code, updated_at: new Date().toISOString() }).eq("id", ins.data.id); console.error("team alert resend", code); return { status: "FAILED", reason: code }; }
    await sb.from("client_email_deliveries").update({ status: "SENT", provider_message_id: j?.id || null, sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", ins.data.id);
    return { status: "SENT", to, provider_message_id: j?.id || null };
  }
  const select = "id,action,comment,actor_email,actor_type,created_at,item:client_approval_items!inner(id,client_id,title,scheduled_at)";
  const flat = (a: any) => { const it = Array.isArray(a.item) ? a.item[0] : a.item; return { id: a.id, action: a.action, comment: a.comment, actor_email: a.actor_email, created_at: a.created_at, title: it?.title || "Conteúdo", scheduled_at: it?.scheduled_at, client_id: it?.client_id }; };

  try {
    if (action === "APPROVAL_ACTION") {
      if (!uuid(b.action_id)) return json(400, { ok: false, error: "action_id_required" });
      const q = await sb.from("client_approval_actions").select(select).eq("id", b.action_id).maybeSingle();
      if (q.error) throw q.error; if (!q.data) return json(404, { ok: false, error: "action_not_found" });
      const r = flat(q.data);
      if (q.data.actor_type !== "CLIENTE") return json(200, { ok: true, status: "SKIPPED_NOT_CLIENT" });
      const name = await clientName(r.client_id);
      const verb = r.action === "APROVADO" ? "aprovou" : r.action === "AJUSTE_SOLICITADO" ? "pediu ajuste em" : "comentou em";
      const result = await send({ clientId: r.client_id, key: `team-alert/approval/${r.id}`, resourceId: r.id, subject: `${name} ${verb}: ${r.title}`, heading: `${name} ${verb} um conteúdo`, intro: "Resposta registrada agora na Área do Cliente:", rows: [r] });
      return json(200, { ok: true, result });
    }
    if (action === "DIGEST") {
      if (!uuid(b.client_id)) return json(400, { ok: false, error: "client_id_required" });
      const since = new Date(String(b.since || "")); if (Number.isNaN(since.getTime())) return json(400, { ok: false, error: "since_required" });
      const q = await sb.from("client_approval_actions").select(select).eq("actor_type", "CLIENTE").eq("item.client_id", b.client_id).gte("created_at", since.toISOString()).order("created_at", { ascending: true });
      if (q.error) throw q.error;
      const rows = (q.data || []).map(flat);
      if (!rows.length) return json(200, { ok: true, status: "NOTHING_TO_SEND" });
      const name = await clientName(b.client_id);
      const nA = rows.filter((r) => r.action === "APROVADO").length, nJ = rows.filter((r) => r.action === "AJUSTE_SOLICITADO").length;
      const result = await send({ clientId: b.client_id, key: `team-alert/digest/${b.client_id}/${since.toISOString()}/${rows.length}`, resourceId: rows[rows.length - 1].id, subject: `${name}: ${nA} aprovado(s) e ${nJ} ajuste(s) na Área do Cliente`, heading: `Respostas de ${name}`, intro: `${rows.length} resposta(s) registradas na Área do Cliente: ${nA} aprovada(s), ${nJ} com pedido de ajuste.`, rows });
      return json(200, { ok: true, count: rows.length, result });
    }
    return json(400, { ok: false, error: "unsupported_action" });
  } catch (e: any) { console.error("central-ym-team-alert", e?.message || e); return json(500, { ok: false, error: "team_alert_failed", detail: String(e?.message || e).slice(0, 400) }); }
});

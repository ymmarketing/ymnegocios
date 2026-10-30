import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/* Central YM · lembrete de vencimento (30/10/2026)
   Regra: 2 dias antes do vencimento, às 9h (America/Sao_Paulo), SOMENTE se não houver baixa (pagamento PAGO) daquela parcela.
   Ações:
   - RUN_DUE  (agendamento diário; cabeçalho x-ym-cron-key)  → envia os lembretes do dia
   - PREVIEW  (usuário interno)                               → mostra quem receberia hoje / numa data
   - SEND_ONE (usuário interno)                               → envia agora o lembrete de um serviço (mesma regra de baixa) */

const PROD = "https://ymnegocios.com.br";
const ORIGINS = new Set([PROD, "http://localhost:3000", "http://localhost:5173"]);
const FROM = "YM Marketing & Negócios <acesso@ymnegocios.com.br>";
const COPY_TO = "ymmarketingenegocios@gmail.com";
const PORTAL = "https://ymnegocios.com.br/areadocliente#financeiro";
const TZ = "America/Sao_Paulo";

const headers = (o: string | null) => ({ "Access-Control-Allow-Origin": o && ORIGINS.has(o) ? o : PROD, "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST,OPTIONS", "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", Vary: "Origin" });
const reply = (s: number, b: unknown, o: string | null) => new Response(JSON.stringify(b), { status: s, headers: headers(o) });
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
const validEmail = (v: unknown) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const todaySP = () => new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(new Date());
const addDays = (d: string, n: number) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const br = (d: string) => { const [y, m, dd] = d.split("-"); return `${dd}/${m}/${y}`; };
const brl = (n: number) => Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function html(name: string, service: string, due: string, amount: number) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f2f5f8;font-family:Arial,Helvetica,sans-serif;color:#17324a"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f5f8"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #dfe7ef"><tr><td bgcolor="#0A2540" style="background:#0A2540;padding:26px 32px"><p style="margin:0;font-size:11px;letter-spacing:1.2px;font-weight:700;color:#9fc2ff">YM MARKETING &amp; NEGÓCIOS · LEMBRETE</p><h1 style="margin:8px 0 0;font-size:24px;line-height:30px;color:#ffffff">Sua mensalidade vence em ${esc(br(due))}</h1></td></tr><tr><td style="padding:30px 32px"><p style="margin:0 0 14px;font-size:15px;line-height:24px">Olá, <strong>${esc(name)}</strong>.</p><p style="margin:0 0 18px;font-size:14px;line-height:23px;color:#53677a">Este é um lembrete amigável do próximo vencimento do seu acompanhamento com a YM.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f8fb"><tr><td style="padding:16px 18px;font-size:14px;line-height:23px;color:#17324a"><strong>${esc(service)}</strong><br>Vencimento: <strong>${esc(br(due))}</strong><br>Valor: <strong>${esc(brl(amount))}</strong></td></tr></table><p style="margin:18px 0 0;font-size:13px;line-height:21px;color:#53677a">Se o pagamento já foi feito, pode desconsiderar esta mensagem. Qualquer dúvida, é só responder este e-mail ou chamar no WhatsApp (31) 97507-3862.</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px"><tr><td bgcolor="#0066FF"><a href="${PORTAL}" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px">Abrir minha Área do Cliente</a></td></tr></table></td></tr><tr><td style="border-top:1px solid #edf1f5;padding:16px 32px;font-size:11px;line-height:17px;color:#81909e">YM Marketing &amp; Negócios · Marketing certo, na ordem certa.</td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(origin) });
  if (origin && !ORIGINS.has(origin)) return reply(403, { ok: false, error: "origin_not_allowed" }, origin);
  if (req.method !== "POST") return reply(405, { ok: false, error: "method_not_allowed" }, origin);
  const su = Deno.env.get("SUPABASE_URL"), sk = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), rk = Deno.env.get("RESEND_API_KEY");
  if (!su || !sk) return reply(503, { ok: false, error: "storage_not_configured" }, origin);
  const sb = createClient(su, sk, { auth: { persistSession: false, autoRefreshToken: false } });
  let b: any = {}; try { b = await req.json(); } catch { return reply(400, { ok: false, error: "invalid_json" }, origin); }
  const action = String(b.action || "").toUpperCase();

  // autorização: agendamento (chave no cofre) ou usuário interno ativo
  let actor = "cron";
  const cronKey = req.headers.get("x-ym-cron-key") || "";
  if (action === "RUN_DUE") {
    const ok = await sb.rpc("central_ym_check_billing_key", { p_key: cronKey });
    if (ok.error || ok.data !== true) return reply(401, { ok: false, error: "invalid_cron_key" }, origin);
  } else {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: { user }, error } = await sb.auth.getUser(token);
    if (error || !user?.email) return reply(401, { ok: false, error: "invalid_session" }, origin);
    const ia = await sb.from("vos_internal_access").select("role,active").eq("email", user.email.toLowerCase()).maybeSingle();
    if (ia.error || !ia.data?.active) return reply(403, { ok: false, error: "forbidden" }, origin);
    actor = user.email.toLowerCase();
  }

  async function candidates(due: string | null, serviceId: string | null) {
    let q = sb.from("crm_client_services").select("id,service_name,service_type,status,monthly_value,next_billing_date,client:crm_clients!inner(id,status,client_kind,contact:crm_contacts(name,business_name,email))")
      .eq("service_type", "RECORRENTE").in("status", ["CONTRATADO", "EM_EXECUCAO"]).gt("monthly_value", 0);
    if (serviceId) q = q.eq("id", serviceId); else q = q.eq("next_billing_date", due);
    const { data, error } = await q; if (error) throw error;
    const out: any[] = [];
    for (const s of data || []) {
      const client: any = Array.isArray(s.client) ? s.client[0] : s.client;
      if (!client || client.status !== "ATIVO") continue;
      const contact: any = Array.isArray(client.contact) ? client.contact[0] : client.contact || {};
      let email = validEmail(contact.email) ? String(contact.email).trim().toLowerCase() : "";
      if (!email) { const a = await sb.from("client_portal_access").select("email").eq("client_id", client.id).eq("active", true).order("created_at").limit(1).maybeSingle(); if (validEmail(a.data?.email)) email = String(a.data!.email).toLowerCase(); }
      const dueDate = s.next_billing_date as string;
      const paid = await sb.from("crm_payments").select("id").eq("client_service_id", s.id).eq("status", "PAGO").eq("due_date", dueDate).limit(1);
      if (paid.error) throw paid.error;
      out.push({ service_id: s.id, client_id: client.id, client: contact.business_name || contact.name || "Cliente", name: contact.name || contact.business_name || "cliente", service: s.service_name, amount: Number(s.monthly_value), due: dueDate, email, paid: (paid.data || []).length > 0 });
    }
    return out;
  }

  async function send(c: any, force: boolean) {
    if (c.paid) return { ...c, result: "SKIPPED_PAID" };
    if (!c.email) return { ...c, result: "SKIPPED_NO_EMAIL" };
    if (!rk) return { ...c, result: "FAILED_NO_RESEND" };
    const key = `billing-reminder/${c.service_id}/${c.due}${force ? "/manual/" + Date.now() : ""}`;
    const ins = await sb.from("client_email_deliveries").insert({ client_id: c.client_id, recipient_email: c.email, notification_kind: "LEMBRETE_VENCIMENTO", resource_type: "BILLING_REMINDER", resource_id: c.service_id, idempotency_key: key, provider: "RESEND", status: "PENDING", metadata: { due_date: c.due, amount: c.amount, trigger: force ? "MANUAL" : "AGENDADO", actor } }).select("id").single();
    if (ins.error?.code === "23505") return { ...c, result: "ALREADY_SENT" };
    if (ins.error) throw ins.error;
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${rk}`, "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify({ from: FROM, to: [c.email], cc: [COPY_TO], reply_to: COPY_TO, subject: `Lembrete: sua mensalidade vence em ${br(c.due)}`, html: html(c.name, c.service, c.due, c.amount), text: `Olá, ${c.name}.\n\nLembrete: ${c.service}\nVencimento: ${br(c.due)}\nValor: ${brl(c.amount)}\n\nSe o pagamento já foi feito, desconsidere esta mensagem.\n\nYM Marketing & Negócios` }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { await sb.from("client_email_deliveries").update({ status: "FAILED", error_code: String(j?.message || r.status).slice(0, 200), updated_at: new Date().toISOString() }).eq("id", ins.data.id); return { ...c, result: "FAILED" }; }
    await sb.from("client_email_deliveries").update({ status: "SENT", provider_message_id: j?.id || null, sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", ins.data.id);
    return { ...c, result: "SENT" };
  }

  try {
    if (action === "RUN_DUE" || action === "PREVIEW") {
      const base = /^\d{4}-\d{2}-\d{2}$/.test(String(b.date || "")) ? String(b.date) : todaySP();
      const due = addDays(base, 2);
      const list = await candidates(due, null);
      if (action === "PREVIEW") return reply(200, { ok: true, run_date: base, due_date: due, candidates: list }, origin);
      const results = []; for (const c of list) results.push(await send(c, false));
      return reply(200, { ok: true, run_date: base, due_date: due, results }, origin);
    }
    if (action === "SEND_ONE") {
      const id = String(b.service_id || ""); if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(400, { ok: false, error: "service_required" }, origin);
      const [c] = await candidates(null, id); if (!c) return reply(404, { ok: false, error: "service_not_eligible" }, origin);
      return reply(200, { ok: true, result: await send(c, true) }, origin);
    }
    return reply(400, { ok: false, error: "unsupported_action" }, origin);
  } catch (e: any) { console.error("central-billing-reminders", e?.message || e); return reply(500, { ok: false, error: "reminder_failed", detail: String(e?.message || e).slice(0, 400) }, origin); }
});

import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || '';
const APP_BASE_URL = (Deno.env.get('APP_BASE_URL') || '').replace(/\/$/, '');
const CRON_SECRET = Deno.env.get('CRON_SECRET') || '';
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function safeEqual(a: string, b: string) {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  let diff = 0;
  for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i];
  return diff === 0;
}

function escapeHtml(value = '') {
  return value.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c] as string));
}

function template(key: string, name: string) {
  const safeName = escapeHtml(name || '');
  const appUrl = `${APP_BASE_URL}/MENOS_BUCHO/jornada.html`;
  const messages: Record<string, { subject: string; lead: string; body: string; cta: string }> = {
    journey_day_1: {
      subject: 'Seu primeiro dia no Menos Bucho',
      lead: `Oi${safeName ? `, ${safeName}` : ''}! Sua jornada começou.`,
      body: 'Hoje a meta é simples: abrir o app, olhar os três desafios e fazer o que cabe no seu dia. Não precisa fazer tudo perfeito para o dia contar.',
      cta: 'Abrir meus desafios'
    },
    journey_day_3: {
      subject: 'Dia 3: menos cobrança, mais repetição',
      lead: 'Os primeiros dias servem para encontrar um ritmo possível.',
      body: 'Se algum desafio ficou difícil, registre isso no app. A jornada usa sua execução para ajustar o nível dos próximos dias.',
      cta: 'Registrar meu dia'
    },
    journey_day_7: {
      subject: 'Você completou a primeira semana',
      lead: 'Uma semana já é informação suficiente para perceber o que está ficando mais fácil.',
      body: 'Veja seu progresso e observe quais hábitos estão encaixando melhor na sua rotina. O objetivo é sustentar, não acelerar sem necessidade.',
      cta: 'Ver meu progresso'
    },
    journey_day_14: {
      subject: 'Duas semanas: o que já mudou na rotina?',
      lead: 'Você chegou à metade da construção do hábito.',
      body: 'Use o registro de hoje para anotar o que funcionou, o que atrapalhou e qual versão mínima do hábito você consegue manter nos dias corridos.',
      cta: 'Fazer meu registro'
    },
    journey_day_21: {
      subject: 'Dia 21: proteja o que já está funcionando',
      lead: 'Agora vale menos inventar coisas novas e mais proteger a constância.',
      body: 'Olhe seus desafios recentes e escolha um comportamento que você quer levar para além desta jornada.',
      cta: 'Continuar a jornada'
    },
    renewal_day_27: {
      subject: 'Sua jornada termina em poucos dias',
      lead: 'Seu histórico não precisa terminar junto com o ciclo.',
      body: 'Nos últimos dias do ciclo, você pode garantir mais 30 dias por R$ 19,90 ou ativar a renovação automática mensal.',
      cta: 'Ver opção de renovação'
    },
    renewal_day_30: {
      subject: 'Dia 30: escolha seu próximo ciclo',
      lead: 'Você chegou ao fim desta jornada de 30 dias.',
      body: 'Seu histórico fica preservado. Se quiser continuar, renove por mais 30 dias ou escolha a renovação automática mensal.',
      cta: 'Ver minha continuidade'
    },
    renewal_auto_day_27: {
      subject: 'Sua renovação automática está ativa',
      lead: 'Você não precisa recomprar seu acesso manualmente.',
      body: 'Sua renovação automática está ativa por R$ 19,90 por ciclo mensal. Você pode acompanhar ou cancelar a recorrência diretamente na sua jornada; o período já pago continua disponível mesmo se cancelar.',
      cta: 'Ver minha assinatura'
    },
    renewal_auto_day_30: {
      subject: 'Fim do ciclo: sua continuidade está automática',
      lead: 'Seu ciclo atual chegou ao final e a renovação automática está ativa.',
      body: 'A continuidade depende da confirmação da próxima cobrança pelo Asaas. Você pode acompanhar o status e cancelar novas recorrências diretamente no aplicativo.',
      cta: 'Acompanhar meu acesso'
    },
    renewal_payment_attention: {
      subject: 'Sua renovação automática precisa de atenção',
      lead: 'A cobrança de renovação não foi confirmada normalmente.',
      body: 'Seu período já pago continua válido até a data final. Entre no aplicativo para conferir o status da renovação antes de iniciar uma nova compra.',
      cta: 'Ver status da renovação'
    }
  };
  const msg = messages[key] || messages.journey_day_1;
  const html = `<!doctype html><html><body style="margin:0;background:#f4f1e8;font-family:Arial,sans-serif;color:#173026"><div style="max-width:600px;margin:auto;padding:28px 18px"><div style="font-weight:800;letter-spacing:.08em;font-size:12px;color:#2f6a4f">MENOS BUCHO · NOVOS HÁBITOS</div><h1 style="font-size:26px;line-height:1.15;margin:14px 0">${msg.lead}</h1><p style="font-size:16px;line-height:1.65;color:#52625a">${msg.body}</p><a href="${appUrl}" style="display:inline-block;margin-top:14px;background:#173b2d;color:white;text-decoration:none;padding:13px 18px;border-radius:12px;font-weight:700">${msg.cta}</a><p style="margin-top:28px;font-size:12px;line-height:1.5;color:#7b857f">Desenvolvido pela YM Marketing & Negócios. Você pode ajustar suas preferências de e-mail dentro do aplicativo.</p></div></body></html>`;
  return { subject: msg.subject, html };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false }, 405);
  const received = req.headers.get('x-cron-secret') || '';
  if (!CRON_SECRET || !safeEqual(received, CRON_SECRET)) return json({ ok: false }, 401);
  if (!RESEND_API_KEY || !EMAIL_FROM || !APP_BASE_URL) return json({ ok: false, error: 'server_not_configured' }, 503);

  const now = new Date().toISOString();
  const { data: queue, error } = await admin
    .from('mb_message_log')
    .select('id,user_id,journey_id,message_key,scheduled_for')
    .eq('status', 'queued')
    .lte('scheduled_for', now)
    .order('scheduled_for', { ascending: true })
    .limit(25);
  if (error) return json({ ok: false }, 500);

  let sent = 0, failed = 0, skipped = 0;
  for (const item of queue || []) {
    const { data: pref } = await admin.from('mb_notification_preferences').select('*').eq('user_id', item.user_id).maybeSingle();
    const isRenewal = String(item.message_key).startsWith('renewal_');
    if (pref && (!pref.email_enabled || (isRenewal && !pref.renewal_email) || (!isRenewal && !pref.motivational_email))) {
      await admin.from('mb_message_log').update({ status: 'skipped' }).eq('id', item.id);
      skipped++;
      continue;
    }

    const { data: authUser, error: authError } = await admin.auth.admin.getUserById(item.user_id);
    const email = authUser?.user?.email;
    if (authError || !email) {
      await admin.from('mb_message_log').update({ status: 'failed', error_code: 'missing_email' }).eq('id', item.id);
      failed++;
      continue;
    }

    let templateKey = String(item.message_key);
    if (isRenewal) {
      const { data: autoRenew } = await admin
        .from('mb_subscriptions')
        .select('status,auto_renew')
        .eq('user_id', item.user_id)
        .eq('auto_renew', true)
        .in('status', ['active','past_due'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (autoRenew?.status === 'past_due') {
        templateKey = 'renewal_payment_attention';
      } else if (autoRenew?.status === 'active') {
        templateKey = item.message_key === 'renewal_day_30' ? 'renewal_auto_day_30' : 'renewal_auto_day_27';
      }
    }

    const { data: profile } = await admin.from('mb_profiles').select('display_name').eq('user_id', item.user_id).maybeSingle();
    const msg = template(templateKey, profile?.display_name || '');
    const idempotencyKey = `mb/${item.id}`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({ from: EMAIL_FROM, to: [email], subject: msg.subject, html: msg.html })
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok && result?.id) {
      await admin.from('mb_message_log').update({
        status: 'sent', provider_message_id: String(result.id), sent_at: new Date().toISOString(), error_code: null
      }).eq('id', item.id);
      sent++;
    } else {
      await admin.from('mb_message_log').update({
        status: 'failed', error_code: String(result?.name || result?.message || response.status).slice(0, 200)
      }).eq('id', item.id);
      failed++;
    }
  }

  return json({ ok: true, processed: queue?.length || 0, sent, failed, skipped });
});

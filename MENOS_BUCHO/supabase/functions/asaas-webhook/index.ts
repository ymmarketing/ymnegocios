import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ASAAS_WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN') || '';

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

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function findAccess(payload: any) {
  const payment = payload?.payment || {};
  const subscription = payload?.subscription || {};
  const externalReference = payment.externalReference || subscription.externalReference || null;
  const subscriptionId = payment.subscription || subscription.id || null;

  if (externalReference) {
    const { data } = await admin.from('mb_subscriptions').select('*').eq('external_reference', externalReference).maybeSingle();
    if (data) return data;
  }
  if (subscriptionId) {
    const { data } = await admin.from('mb_subscriptions').select('*').eq('asaas_subscription_id', subscriptionId).maybeSingle();
    if (data) return data;
  }
  return null;
}

async function activateJourney(access: any, eventName: string, payment: any) {
  const paymentId = payment?.id ? String(payment.id) : null;
  if (paymentId && access.asaas_payment_id === paymentId && ['active','paid_unclaimed'].includes(access.status)) {
    return;
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const periodEnd = new Date(now.getTime() + 30 * 86400000).toISOString();
  const subscriptionId = payment?.subscription || access.asaas_subscription_id || null;

  if (!access.user_id) {
    await admin.from('mb_subscriptions').update({
      status: 'paid_unclaimed',
      last_payment_status: eventName,
      asaas_payment_id: paymentId || access.asaas_payment_id,
      asaas_subscription_id: subscriptionId,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd,
      activated_at: access.activated_at || now.toISOString(),
      updated_at: now.toISOString()
    }).eq('id', access.id);
    return;
  }

  await admin.from('mb_subscriptions').update({
    status: 'active',
    last_payment_status: eventName,
    asaas_payment_id: paymentId || access.asaas_payment_id,
    asaas_subscription_id: subscriptionId,
    current_period_start: now.toISOString(),
    current_period_end: periodEnd,
    activated_at: access.activated_at || now.toISOString(),
    updated_at: now.toISOString()
  }).eq('id', access.id);

  const { data: activeJourney } = await admin
    .from('mb_journeys')
    .select('id,subscription_id,starts_on,ends_on,status')
    .eq('user_id', access.user_id)
    .eq('status', 'active')
    .maybeSingle();

  if (activeJourney && activeJourney.ends_on >= today) {
    const { data: scheduled } = await admin
      .from('mb_journeys')
      .select('id,subscription_id,starts_on,ends_on')
      .eq('user_id', access.user_id)
      .eq('status', 'scheduled')
      .maybeSingle();

    if (!scheduled) {
      const startsOn = addDays(activeJourney.ends_on, 1);
      await admin.from('mb_journeys').insert({
        user_id: access.user_id,
        subscription_id: access.id,
        starts_on: startsOn,
        ends_on: addDays(startsOn, 29),
        status: 'scheduled',
        source: 'renewal'
      });
    } else if (scheduled.subscription_id !== access.id) {
      throw new Error('scheduled_journey_conflict');
    }
    return;
  }

  if (activeJourney?.id) {
    await admin.from('mb_journeys').update({
      status: 'completed',
      completed_at: now.toISOString()
    }).eq('id', activeJourney.id);
  }

  const { data: dueScheduled } = await admin
    .from('mb_journeys')
    .select('id,subscription_id,starts_on,ends_on')
    .eq('user_id', access.user_id)
    .eq('status', 'scheduled')
    .lte('starts_on', today)
    .order('starts_on', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (dueScheduled?.id) {
    await admin.from('mb_journeys').update({ status: 'active' }).eq('id', dueScheduled.id);
    return;
  }

  await admin.from('mb_journeys').insert({
    user_id: access.user_id,
    subscription_id: access.id,
    starts_on: today,
    ends_on: addDays(today, 29),
    status: 'active',
    source: 'purchase'
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false }, 405);
  const receivedToken = req.headers.get('asaas-access-token') || '';
  if (!ASAAS_WEBHOOK_TOKEN || !safeEqual(receivedToken, ASAAS_WEBHOOK_TOKEN)) return json({ ok: false }, 401);

  let payload: any;
  try { payload = await req.json(); } catch { return json({ ok: false }, 400); }
  const eventId = String(payload?.id || '');
  const eventName = String(payload?.event || '');
  if (!eventId || !eventName) return json({ ok: false }, 400);

  const { data: existing } = await admin
    .from('mb_billing_events')
    .select('id,processed_at')
    .eq('provider_event_id', eventId)
    .maybeSingle();

  if (existing?.processed_at) return json({ ok: true, duplicate: true });

  if (!existing) {
    const { error: insertError } = await admin.from('mb_billing_events').insert({
      provider_event_id: eventId,
      event_type: eventName,
      asaas_payment_id: payload?.payment?.id || null,
      asaas_subscription_id: payload?.payment?.subscription || payload?.subscription?.id || null,
      payload
    });
    if (insertError && insertError.code !== '23505') return json({ ok: false }, 500);
  }

  try {
    const access = await findAccess(payload);
    const payment = payload?.payment || {};

    if (access) {
      if (['PAYMENT_RECEIVED','PAYMENT_CONFIRMED'].includes(eventName)) {
        await activateJourney(access, eventName, payment);
      } else if (eventName === 'PAYMENT_OVERDUE') {
        await admin.from('mb_subscriptions').update({
          status: access.user_id ? 'past_due' : 'pending',
          last_payment_status: eventName,
          updated_at: new Date().toISOString()
        }).eq('id', access.id);
      } else if (['PAYMENT_REFUNDED','PAYMENT_DELETED','PAYMENT_REVERSED'].includes(eventName)) {
        await admin.from('mb_subscriptions').update({
          status: 'canceled',
          last_payment_status: eventName,
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('id', access.id);

        if (access.user_id) {
          await admin.from('mb_journeys').update({ status: 'expired' })
            .eq('subscription_id', access.id)
            .in('status', ['active','scheduled']);
        }
      }
    }

    await admin.from('mb_billing_events').update({
      processed_at: new Date().toISOString(),
      processing_error: null
    }).eq('provider_event_id', eventId);

    return json({ ok: true, matched: !!access });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : 'unknown_error';
    await admin.from('mb_billing_events').update({ processing_error: message }).eq('provider_event_id', eventId);
    console.error('asaas_webhook_processing_error', eventId, eventName, message);
    return json({ ok: false }, 500);
  }
});

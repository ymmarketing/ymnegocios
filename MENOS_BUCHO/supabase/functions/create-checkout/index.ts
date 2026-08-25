import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')!;
const ASAAS_BASE_URL = Deno.env.get('ASAAS_BASE_URL') || 'https://api-sandbox.asaas.com/v3';
const APP_BASE_URL = (Deno.env.get('APP_BASE_URL') || '').replace(/\/$/, '');
const ALLOW_ORIGIN = Deno.env.get('APP_ORIGIN') || '*';

const cors = {
  'Access-Control-Allow-Origin': ALLOW_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}

function isRecent(iso?: string | null, minutes = 45) {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < minutes * 60_000;
}

function daysUntil(dateString: string) {
  const today = new Date();
  const current = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const target = new Date(`${dateString}T00:00:00Z`).getTime();
  return Math.floor((target - current) / 86400000);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  if (!ASAAS_API_KEY || !APP_BASE_URL) return json({ ok: false, error: 'server_not_configured' }, 503);

  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return json({ ok: false, error: 'unauthorized' }, 401);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false }
  });
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  const user = userData?.user;
  if (userError || !user) return json({ ok: false, error: 'unauthorized' }, 401);

  let input: { renewalMode?: string } = {};
  try { input = await req.json(); } catch { /* default */ }
  const renewalMode = input.renewalMode === 'automatic' ? 'automatic' : 'one_time';
  const autoRenew = renewalMode === 'automatic';

  const { data: existing } = await admin
    .from('mb_subscriptions')
    .select('id,checkout_url,created_at,status,auto_renew')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.checkout_url && existing.auto_renew === autoRenew && isRecent(existing.created_at)) {
    return json({ ok: true, checkoutUrl: existing.checkout_url, reused: true });
  }
  if (existing?.id) {
    await admin.from('mb_subscriptions').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', existing.id);
  }

  const { data: liveAutoRenew } = await admin
    .from('mb_subscriptions')
    .select('id,status')
    .eq('user_id', user.id)
    .eq('auto_renew', true)
    .in('status', ['active','past_due'])
    .limit(1)
    .maybeSingle();

  if (liveAutoRenew) {
    return json({ ok: false, error: 'auto_renew_already_active' }, 409);
  }

  const { data: scheduledJourney } = await admin
    .from('mb_journeys')
    .select('id,starts_on,ends_on')
    .eq('user_id', user.id)
    .eq('status', 'scheduled')
    .limit(1)
    .maybeSingle();

  if (scheduledJourney) {
    return json({ ok: false, error: 'renewal_already_paid' }, 409);
  }

  const { data: activeJourney } = await admin
    .from('mb_journeys')
    .select('id,ends_on')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (activeJourney?.ends_on && daysUntil(activeJourney.ends_on) > 7) {
    return json({ ok: false, error: 'renewal_not_open' }, 409);
  }

  const externalReference = `mb_${user.id}_${crypto.randomUUID()}`;
  const now = new Date();
  const today = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;

  const { data: order, error: orderError } = await admin
    .from('mb_subscriptions')
    .insert({
      user_id: user.id,
      status: 'pending',
      price_cents: 1990,
      currency: 'BRL',
      auto_renew: autoRenew,
      external_reference: externalReference,
      last_payment_status: 'CHECKOUT_CREATED'
    })
    .select('id')
    .single();

  if (orderError || !order) return json({ ok: false, error: 'order_create_failed' }, 500);

  const payload: Record<string, unknown> = {
    billingTypes: autoRenew ? ['CREDIT_CARD'] : ['PIX', 'CREDIT_CARD'],
    chargeTypes: [autoRenew ? 'RECURRENT' : 'DETACHED'],
    minutesToExpire: 60,
    externalReference,
    callback: {
      successUrl: `${APP_BASE_URL}/MENOS_BUCHO/?checkout=success`,
      cancelUrl: `${APP_BASE_URL}/MENOS_BUCHO/?checkout=cancel`,
      expiredUrl: `${APP_BASE_URL}/MENOS_BUCHO/?checkout=expired`
    },
    items: [{
      name: 'Menos Bucho — 30 dias',
      description: 'Jornada digital de 30 dias para construção de novos hábitos.',
      quantity: 1,
      value: 19.90
    }]
  };

  if (autoRenew) payload.subscription = { cycle: 'MONTHLY', nextDueDate: today };

  const asaasResponse = await fetch(`${ASAAS_BASE_URL}/checkouts`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      access_token: ASAAS_API_KEY
    },
    body: JSON.stringify(payload)
  });

  const asaasBody = await asaasResponse.json().catch(() => ({}));
  if (!asaasResponse.ok || !asaasBody?.id || !asaasBody?.link) {
    await admin.from('mb_subscriptions').update({
      status: 'expired',
      last_payment_status: 'CHECKOUT_ERROR',
      updated_at: new Date().toISOString()
    }).eq('id', order.id);
    console.error('asaas_checkout_error', asaasResponse.status, asaasBody?.errors || asaasBody);
    return json({ ok: false, error: 'checkout_provider_error' }, 502);
  }

  await admin.from('mb_subscriptions').update({
    asaas_checkout_id: String(asaasBody.id),
    checkout_url: String(asaasBody.link),
    last_payment_status: String(asaasBody.status || 'ACTIVE'),
    updated_at: new Date().toISOString()
  }).eq('id', order.id);

  return json({ ok: true, checkoutUrl: asaasBody.link, reused: false });
});

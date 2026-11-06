import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')!;
const ASAAS_BASE_URL = Deno.env.get('ASAAS_BASE_URL') || 'https://api-sandbox.asaas.com/v3';
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);
  if (!ASAAS_API_KEY) return json({ ok: false, error: 'server_not_configured' }, 503);

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

  const { data: subscription, error: subscriptionError } = await admin
    .from('mb_subscriptions')
    .select('id,asaas_subscription_id,status,auto_renew,current_period_end')
    .eq('user_id', user.id)
    .eq('auto_renew', true)
    .in('status', ['active','past_due'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError) return json({ ok: false, error: 'lookup_failed' }, 500);
  if (!subscription) return json({ ok: true, alreadyCanceled: true });
  if (!subscription.asaas_subscription_id) return json({ ok: false, error: 'provider_subscription_missing' }, 409);

  const response = await fetch(`${ASAAS_BASE_URL}/subscriptions/${encodeURIComponent(subscription.asaas_subscription_id)}`, {
    method: 'DELETE',
    headers: { accept: 'application/json', access_token: ASAAS_API_KEY }
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok && response.status !== 404) {
    console.error('asaas_cancel_subscription_error', response.status, body?.errors || body);
    return json({ ok: false, error: 'provider_cancel_failed' }, 502);
  }

  await admin.from('mb_subscriptions').update({
    status: 'canceled',
    auto_renew: false,
    canceled_at: new Date().toISOString(),
    last_payment_status: 'SUBSCRIPTION_CANCELED_BY_USER',
    updated_at: new Date().toISOString()
  }).eq('id', subscription.id);

  return json({
    ok: true,
    alreadyCanceled: response.status === 404,
    accessUntil: subscription.current_period_end
  });
});

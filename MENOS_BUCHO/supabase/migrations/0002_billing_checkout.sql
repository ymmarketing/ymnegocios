alter table public.mb_subscriptions
  add column if not exists external_reference text,
  add column if not exists asaas_checkout_id text,
  add column if not exists checkout_url text,
  add column if not exists asaas_payment_id text,
  add column if not exists last_payment_status text,
  add column if not exists activated_at timestamptz;

create unique index if not exists mb_subscriptions_external_reference_uq
  on public.mb_subscriptions(external_reference)
  where external_reference is not null;

create unique index if not exists mb_subscriptions_checkout_uq
  on public.mb_subscriptions(asaas_checkout_id)
  where asaas_checkout_id is not null;

create index if not exists mb_subscriptions_payment_idx
  on public.mb_subscriptions(asaas_payment_id)
  where asaas_payment_id is not null;

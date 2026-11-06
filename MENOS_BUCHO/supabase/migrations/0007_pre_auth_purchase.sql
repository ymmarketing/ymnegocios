alter table public.mb_subscriptions
  alter column user_id drop not null,
  add column if not exists purchaser_email text,
  add column if not exists claimed_at timestamptz;

update public.mb_subscriptions s
set purchaser_email = lower(u.email)
from auth.users u
where s.user_id = u.id
  and s.purchaser_email is null
  and u.email is not null;

alter table public.mb_subscriptions drop constraint if exists mb_subscriptions_status_check;
alter table public.mb_subscriptions
  add constraint mb_subscriptions_status_check
  check (status in ('pending','paid_unclaimed','active','past_due','canceled','expired'));

alter table public.mb_subscriptions
  drop constraint if exists mb_subscriptions_purchaser_email_normalized;
alter table public.mb_subscriptions
  add constraint mb_subscriptions_purchaser_email_normalized
  check (purchaser_email is null or purchaser_email = lower(btrim(purchaser_email)));

create unique index if not exists mb_one_pending_checkout_per_email
  on public.mb_subscriptions(purchaser_email)
  where user_id is null and status = 'pending' and purchaser_email is not null;

create unique index if not exists mb_one_unclaimed_paid_per_email
  on public.mb_subscriptions(purchaser_email)
  where user_id is null and status = 'paid_unclaimed' and purchaser_email is not null;

create index if not exists mb_subscriptions_email_status_idx
  on public.mb_subscriptions(purchaser_email, status, created_at desc)
  where purchaser_email is not null;

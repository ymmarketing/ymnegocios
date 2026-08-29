create extension if not exists pgcrypto;

create table if not exists public.mb_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mb_onboarding (
  user_id uuid primary key references auth.users(id) on delete cascade,
  primary_goal text not null check (primary_goal in ('rotina','alimentacao','movimento','energia','consistencia')),
  focus text[] not null default '{}',
  minutes_per_day integer not null check (minutes_per_day in (5,10,15,20)),
  pace smallint not null check (pace between 1 and 3),
  context_notes text not null default '',
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(focus) between 1 and 3)
);

create table if not exists public.mb_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'asaas' check (provider = 'asaas'),
  asaas_customer_id text,
  asaas_subscription_id text,
  status text not null default 'pending' check (status in ('pending','active','past_due','canceled','expired')),
  price_cents integer not null default 1990 check (price_cents > 0),
  currency text not null default 'BRL' check (currency = 'BRL'),
  auto_renew boolean not null default false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (asaas_subscription_id)
);
create unique index if not exists mb_one_live_subscription_per_user
  on public.mb_subscriptions(user_id)
  where status in ('pending','active','past_due');

create table if not exists public.mb_challenges (
  id text primary key,
  category text not null check (category in ('hidratacao','alimentacao','movimento','sono','planejamento','mente')),
  level smallint not null check (level between 1 and 3),
  minutes integer not null check (minutes between 1 and 30),
  title text not null,
  body text not null,
  goal_tags text[] not null default '{}',
  active boolean not null default true,
  approved_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mb_journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.mb_subscriptions(id) on delete set null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'active' check (status in ('active','completed','paused','expired')),
  source text not null default 'purchase' check (source in ('purchase','renewal','admin')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (ends_on >= starts_on)
);
create unique index if not exists mb_one_active_journey_per_user
  on public.mb_journeys(user_id)
  where status = 'active';

create table if not exists public.mb_daily_plans (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.mb_journeys(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_number smallint not null check (day_number between 1 and 30),
  plan_date date not null,
  adaptive_level smallint not null check (adaptive_level between 1 and 3),
  created_at timestamptz not null default now(),
  unique (journey_id, day_number),
  unique (journey_id, plan_date)
);

create table if not exists public.mb_daily_plan_items (
  id uuid primary key default gen_random_uuid(),
  daily_plan_id uuid not null references public.mb_daily_plans(id) on delete cascade,
  challenge_id text not null references public.mb_challenges(id),
  position smallint not null check (position between 1 and 5),
  created_at timestamptz not null default now(),
  unique (daily_plan_id, challenge_id),
  unique (daily_plan_id, position)
);

create table if not exists public.mb_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_plan_item_id uuid not null references public.mb_daily_plan_items(id) on delete cascade,
  completed boolean not null default true,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, daily_plan_item_id)
);

create table if not exists public.mb_daily_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  daily_plan_id uuid not null references public.mb_daily_plans(id) on delete cascade,
  note text not null default '',
  perceived_difficulty smallint check (perceived_difficulty between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, daily_plan_id)
);

create table if not exists public.mb_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_enabled boolean not null default true,
  motivational_email boolean not null default true,
  renewal_email boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.mb_message_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_id uuid references public.mb_journeys(id) on delete set null,
  channel text not null default 'email' check (channel = 'email'),
  message_key text not null,
  provider_message_id text,
  status text not null check (status in ('queued','sent','failed','skipped')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  error_code text,
  created_at timestamptz not null default now(),
  unique (user_id, message_key, journey_id)
);

create table if not exists public.mb_billing_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique,
  event_type text not null,
  asaas_payment_id text,
  asaas_subscription_id text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text
);

alter table public.mb_profiles enable row level security;
alter table public.mb_onboarding enable row level security;
alter table public.mb_subscriptions enable row level security;
alter table public.mb_challenges enable row level security;
alter table public.mb_journeys enable row level security;
alter table public.mb_daily_plans enable row level security;
alter table public.mb_daily_plan_items enable row level security;
alter table public.mb_completions enable row level security;
alter table public.mb_daily_reflections enable row level security;
alter table public.mb_notification_preferences enable row level security;
alter table public.mb_message_log enable row level security;
alter table public.mb_billing_events enable row level security;

create policy "mb_profiles_own_select" on public.mb_profiles for select to authenticated using (auth.uid() = user_id);
create policy "mb_profiles_own_insert" on public.mb_profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "mb_profiles_own_update" on public.mb_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "mb_onboarding_own_select" on public.mb_onboarding for select to authenticated using (auth.uid() = user_id);
create policy "mb_onboarding_own_insert" on public.mb_onboarding for insert to authenticated with check (auth.uid() = user_id);
create policy "mb_onboarding_own_update" on public.mb_onboarding for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "mb_subscriptions_own_select" on public.mb_subscriptions for select to authenticated using (auth.uid() = user_id);
create policy "mb_challenges_authenticated_select" on public.mb_challenges for select to authenticated using (active = true);
create policy "mb_journeys_own_select" on public.mb_journeys for select to authenticated using (auth.uid() = user_id);
create policy "mb_daily_plans_own_select" on public.mb_daily_plans for select to authenticated using (auth.uid() = user_id);
create policy "mb_daily_plan_items_own_select" on public.mb_daily_plan_items for select to authenticated using (
  exists (select 1 from public.mb_daily_plans p where p.id = daily_plan_id and p.user_id = auth.uid())
);

create policy "mb_completions_own_select" on public.mb_completions for select to authenticated using (auth.uid() = user_id);
create policy "mb_completions_own_insert" on public.mb_completions for insert to authenticated with check (
  auth.uid() = user_id and exists (
    select 1 from public.mb_daily_plan_items i
    join public.mb_daily_plans p on p.id = i.daily_plan_id
    where i.id = daily_plan_item_id and p.user_id = auth.uid()
  )
);
create policy "mb_completions_own_update" on public.mb_completions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "mb_reflections_own_select" on public.mb_daily_reflections for select to authenticated using (auth.uid() = user_id);
create policy "mb_reflections_own_insert" on public.mb_daily_reflections for insert to authenticated with check (
  auth.uid() = user_id and exists (select 1 from public.mb_daily_plans p where p.id = daily_plan_id and p.user_id = auth.uid())
);
create policy "mb_reflections_own_update" on public.mb_daily_reflections for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "mb_notification_preferences_own_select" on public.mb_notification_preferences for select to authenticated using (auth.uid() = user_id);
create policy "mb_notification_preferences_own_insert" on public.mb_notification_preferences for insert to authenticated with check (auth.uid() = user_id);
create policy "mb_notification_preferences_own_update" on public.mb_notification_preferences for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "mb_message_log_own_select" on public.mb_message_log for select to authenticated using (auth.uid() = user_id);

revoke all on public.mb_billing_events from anon, authenticated;
revoke insert, update, delete on public.mb_subscriptions from anon, authenticated;
revoke insert, update, delete on public.mb_journeys from anon, authenticated;
revoke insert, update, delete on public.mb_daily_plans from anon, authenticated;
revoke insert, update, delete on public.mb_daily_plan_items from anon, authenticated;
revoke insert, update, delete on public.mb_challenges from anon, authenticated;
revoke insert, update, delete on public.mb_message_log from anon, authenticated;

create index if not exists mb_daily_plans_user_date_idx on public.mb_daily_plans(user_id, plan_date);
create index if not exists mb_completions_user_idx on public.mb_completions(user_id, updated_at desc);
create index if not exists mb_message_log_schedule_idx on public.mb_message_log(status, scheduled_for);
create index if not exists mb_billing_events_subscription_idx on public.mb_billing_events(asaas_subscription_id, received_at desc);

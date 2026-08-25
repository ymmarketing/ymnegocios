create or replace function public.mb_claim_paid_access()
returns table (
  access_status text,
  subscription_id uuid,
  journey_id uuid,
  journey_status text,
  starts_on date,
  ends_on date,
  auto_renew boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
  v_purchase public.mb_subscriptions%rowtype;
  v_active public.mb_journeys%rowtype;
  v_scheduled public.mb_journeys%rowtype;
  v_new_journey public.mb_journeys%rowtype;
  v_existing_subscription public.mb_subscriptions%rowtype;
begin
  if v_uid is null or v_email = '' then
    raise exception 'not_authenticated';
  end if;

  select s.* into v_purchase
    from public.mb_subscriptions s
   where s.user_id is null
     and s.purchaser_email = v_email
     and s.status = 'paid_unclaimed'
   order by s.created_at asc
   limit 1
   for update;

  if not found then
    select s.* into v_existing_subscription
      from public.mb_subscriptions s
     where s.user_id = v_uid
       and s.status in ('active','past_due')
     order by s.updated_at desc
     limit 1;

    select j.* into v_active
      from public.mb_journeys j
     where j.user_id = v_uid
       and j.status = 'active'
     limit 1;

    if v_existing_subscription.id is not null and v_active.id is not null then
      return query select
        'active'::text,
        v_existing_subscription.id,
        v_active.id,
        v_active.status,
        v_active.starts_on,
        v_active.ends_on,
        v_existing_subscription.auto_renew;
    else
      return query select
        'awaiting_payment'::text,
        null::uuid,
        null::uuid,
        null::text,
        null::date,
        null::date,
        false;
    end if;
    return;
  end if;

  update public.mb_subscriptions
     set user_id = v_uid,
         status = 'active',
         claimed_at = now(),
         updated_at = now()
   where id = v_purchase.id;

  insert into public.mb_notification_preferences(user_id)
  values (v_uid)
  on conflict (user_id) do nothing;

  select j.* into v_active
    from public.mb_journeys j
   where j.user_id = v_uid
     and j.status = 'active'
   limit 1
   for update;

  if v_active.id is not null and v_active.ends_on >= current_date then
    select j.* into v_scheduled
      from public.mb_journeys j
     where j.user_id = v_uid
       and j.status = 'scheduled'
     limit 1
     for update;

    if v_scheduled.id is null then
      insert into public.mb_journeys(user_id, subscription_id, starts_on, ends_on, status, source)
      values (
        v_uid,
        v_purchase.id,
        v_active.ends_on + 1,
        v_active.ends_on + 30,
        'scheduled',
        'renewal'
      )
      returning * into v_new_journey;
    else
      v_new_journey := v_scheduled;
    end if;

    return query select
      'scheduled'::text,
      v_purchase.id,
      v_new_journey.id,
      v_new_journey.status,
      v_new_journey.starts_on,
      v_new_journey.ends_on,
      v_purchase.auto_renew;
    return;
  end if;

  if v_active.id is not null then
    update public.mb_journeys
       set status = 'completed',
           completed_at = coalesce(completed_at, now())
     where id = v_active.id;
  end if;

  insert into public.mb_journeys(user_id, subscription_id, starts_on, ends_on, status, source)
  values (
    v_uid,
    v_purchase.id,
    current_date,
    current_date + 29,
    'active',
    'purchase'
  )
  returning * into v_new_journey;

  return query select
    'active'::text,
    v_purchase.id,
    v_new_journey.id,
    v_new_journey.status,
    v_new_journey.starts_on,
    v_new_journey.ends_on,
    v_purchase.auto_renew;
end;
$$;

revoke all on function public.mb_claim_paid_access() from public, anon;
grant execute on function public.mb_claim_paid_access() to authenticated;

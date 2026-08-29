drop index if exists public.mb_one_live_subscription_per_user;

create unique index if not exists mb_one_pending_checkout_per_user
  on public.mb_subscriptions(user_id)
  where status = 'pending';

create unique index if not exists mb_one_live_auto_renew_per_user
  on public.mb_subscriptions(user_id)
  where auto_renew = true and status in ('active','past_due');

alter table public.mb_journeys drop constraint if exists mb_journeys_status_check;
alter table public.mb_journeys
  add constraint mb_journeys_status_check
  check (status in ('scheduled','active','completed','paused','expired'));

create unique index if not exists mb_one_scheduled_journey_per_user
  on public.mb_journeys(user_id)
  where status = 'scheduled';

create or replace function public.mb_sync_my_journey()
returns table (journey_id uuid, journey_status text, starts_on date, ends_on date)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  update public.mb_journeys
     set status = 'completed', completed_at = coalesce(completed_at, now())
   where user_id = uid
     and status = 'active'
     and ends_on < v_today;

  if not exists (
    select 1 from public.mb_journeys where user_id = uid and status = 'active'
  ) then
    update public.mb_journeys
       set status = 'active'
     where id = (
       select id from public.mb_journeys
        where user_id = uid
          and status = 'scheduled'
          and starts_on <= v_today
        order by starts_on asc
        limit 1
     );
  end if;

  return query
  select j.id, j.status, j.starts_on, j.ends_on
    from public.mb_journeys j
   where j.user_id = uid
     and j.status in ('active','scheduled')
   order by case when j.status = 'active' then 0 else 1 end, j.starts_on
   limit 2;
end;
$$;

grant execute on function public.mb_sync_my_journey() to authenticated;
revoke execute on function public.mb_sync_my_journey() from anon;

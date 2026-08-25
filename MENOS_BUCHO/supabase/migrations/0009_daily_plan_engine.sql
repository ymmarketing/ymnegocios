create or replace function public.mb_get_or_create_daily_plan()
returns table (
  plan_id uuid,
  plan_item_id uuid,
  day_number integer,
  plan_date date,
  adaptive_level integer,
  challenge_id text,
  category text,
  title text,
  body text,
  minutes integer,
  position integer,
  completed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'America/Sao_Paulo')::date;
  v_journey public.mb_journeys%rowtype;
  v_onboarding public.mb_onboarding%rowtype;
  v_plan public.mb_daily_plans%rowtype;
  v_day integer;
  v_level integer;
  v_prev_ratio numeric;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  perform * from public.mb_sync_my_journey();

  select j.* into v_journey
    from public.mb_journeys j
   where j.user_id = v_uid
     and j.status = 'active'
   limit 1;

  if v_journey.id is null then
    return;
  end if;

  select o.* into v_onboarding
    from public.mb_onboarding o
   where o.user_id = v_uid;

  if v_onboarding.user_id is null then
    return;
  end if;

  v_day := (v_today - v_journey.starts_on) + 1;
  if v_day < 1 or v_day > 30 then
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_journey.id::text || ':' || v_day::text, 0));

  select p.* into v_plan
    from public.mb_daily_plans p
   where p.journey_id = v_journey.id
     and p.day_number = v_day;

  if v_plan.id is null then
    v_level := v_onboarding.pace;

    if v_day > 1 then
      select
        case
          when count(i.id) = 0 then null
          else (count(c.id) filter (where c.completed = true))::numeric / count(i.id)::numeric
        end
      into v_prev_ratio
      from public.mb_daily_plans p
      join public.mb_daily_plan_items i on i.daily_plan_id = p.id
      left join public.mb_completions c
        on c.daily_plan_item_id = i.id
       and c.user_id = v_uid
       and c.completed = true
      where p.journey_id = v_journey.id
        and p.day_number = v_day - 1;

      if v_prev_ratio is not null and v_prev_ratio < 0.50 then
        v_level := greatest(1, v_level - 1);
      elsif v_prev_ratio is not null and v_prev_ratio >= 0.80 then
        v_level := least(3, v_level + 1);
      end if;
    end if;

    insert into public.mb_daily_plans(journey_id, user_id, day_number, plan_date, adaptive_level)
    values (v_journey.id, v_uid, v_day, v_today, v_level)
    returning * into v_plan;

    with recent as (
      select distinct i.challenge_id
        from public.mb_daily_plans rp
        join public.mb_daily_plan_items i on i.daily_plan_id = rp.id
       where rp.journey_id = v_journey.id
         and rp.day_number between greatest(1, v_day - 3) and v_day - 1
    ), candidates as (
      select
        c.id,
        c.category,
        (
          case when c.category = any(v_onboarding.focus) then 50 else 0 end
          + case when v_onboarding.primary_goal = any(c.goal_tags) then 30 else 0 end
          + case when r.challenge_id is null then 20 else 0 end
          + (4 - c.level) * 2
        ) as priority,
        md5(v_uid::text || ':' || v_journey.id::text || ':' || v_day::text || ':' || c.id) as tie_break,
        row_number() over (
          partition by c.category
          order by
            case when r.challenge_id is null then 0 else 1 end,
            case when c.category = any(v_onboarding.focus) then 0 else 1 end,
            case when v_onboarding.primary_goal = any(c.goal_tags) then 0 else 1 end,
            md5(v_uid::text || ':' || v_journey.id::text || ':' || v_day::text || ':' || c.id)
        ) as category_rank
      from public.mb_challenges c
      left join recent r on r.challenge_id = c.id
      where c.active = true
        and c.level <= v_level
        and c.minutes <= v_onboarding.minutes_per_day
    ), selected as (
      select id, priority, tie_break
        from candidates
       where category_rank = 1
       order by priority desc, tie_break
       limit 3
    )
    insert into public.mb_daily_plan_items(daily_plan_id, challenge_id, position)
    select
      v_plan.id,
      s.id,
      row_number() over (order by s.priority desc, s.tie_break)::smallint
    from selected s;
  end if;

  return query
  select
    p.id,
    i.id,
    p.day_number::integer,
    p.plan_date,
    p.adaptive_level::integer,
    ch.id,
    ch.category,
    ch.title,
    ch.body,
    ch.minutes::integer,
    i.position::integer,
    coalesce(c.completed, false)
  from public.mb_daily_plans p
  join public.mb_daily_plan_items i on i.daily_plan_id = p.id
  join public.mb_challenges ch on ch.id = i.challenge_id
  left join public.mb_completions c
    on c.daily_plan_item_id = i.id
   and c.user_id = v_uid
  where p.id = v_plan.id
  order by i.position;
end;
$$;

revoke all on function public.mb_get_or_create_daily_plan() from public, anon;
grant execute on function public.mb_get_or_create_daily_plan() to authenticated;

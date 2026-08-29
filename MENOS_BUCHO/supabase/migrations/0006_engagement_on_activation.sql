create or replace function public.mb_schedule_journey_messages()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_time timestamptz;
begin
  if new.status <> 'active' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'active' then
    return new;
  end if;

  base_time := (new.starts_on + time '09:00') at time zone 'America/Sao_Paulo';

  insert into public.mb_message_log(user_id, journey_id, channel, message_key, status, scheduled_for)
  values
    (new.user_id, new.id, 'email', 'journey_day_1',  'queued', base_time),
    (new.user_id, new.id, 'email', 'journey_day_3',  'queued', base_time + interval '2 days'),
    (new.user_id, new.id, 'email', 'journey_day_7',  'queued', base_time + interval '6 days'),
    (new.user_id, new.id, 'email', 'journey_day_14', 'queued', base_time + interval '13 days'),
    (new.user_id, new.id, 'email', 'journey_day_21', 'queued', base_time + interval '20 days'),
    (new.user_id, new.id, 'email', 'renewal_day_27', 'queued', base_time + interval '26 days'),
    (new.user_id, new.id, 'email', 'renewal_day_30', 'queued', base_time + interval '29 days')
  on conflict (user_id, message_key, journey_id) do nothing;

  return new;
end;
$$;

revoke all on function public.mb_schedule_journey_messages() from public, anon, authenticated;

drop trigger if exists mb_journey_message_schedule on public.mb_journeys;

create trigger mb_journey_message_schedule
  after insert or update of status on public.mb_journeys
  for each row
  execute function public.mb_schedule_journey_messages();

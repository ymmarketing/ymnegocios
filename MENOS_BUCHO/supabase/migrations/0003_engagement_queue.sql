create or replace function public.mb_schedule_journey_messages()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' then
    insert into public.mb_message_log(user_id, journey_id, channel, message_key, status, scheduled_for)
    values
      (new.user_id, new.id, 'email', 'journey_day_1',  'queued', new.starts_on::timestamptz + interval '9 hours'),
      (new.user_id, new.id, 'email', 'journey_day_3',  'queued', new.starts_on::timestamptz + interval '2 days 9 hours'),
      (new.user_id, new.id, 'email', 'journey_day_7',  'queued', new.starts_on::timestamptz + interval '6 days 9 hours'),
      (new.user_id, new.id, 'email', 'journey_day_14', 'queued', new.starts_on::timestamptz + interval '13 days 9 hours'),
      (new.user_id, new.id, 'email', 'journey_day_21', 'queued', new.starts_on::timestamptz + interval '20 days 9 hours'),
      (new.user_id, new.id, 'email', 'renewal_day_27', 'queued', new.starts_on::timestamptz + interval '26 days 9 hours'),
      (new.user_id, new.id, 'email', 'renewal_day_30', 'queued', new.starts_on::timestamptz + interval '29 days 9 hours')
    on conflict (user_id, message_key, journey_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.mb_schedule_journey_messages() from public, anon, authenticated;

create trigger mb_journey_message_schedule
  after insert on public.mb_journeys
  for each row execute function public.mb_schedule_journey_messages();

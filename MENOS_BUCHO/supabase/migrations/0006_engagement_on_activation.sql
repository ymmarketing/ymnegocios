drop trigger if exists mb_journey_message_schedule on public.mb_journeys;

create trigger mb_journey_message_schedule
  after insert or update of status on public.mb_journeys
  for each row
  when (
    new.status = 'active'
    and (tg_op = 'INSERT' or old.status is distinct from new.status)
  )
  execute function public.mb_schedule_journey_messages();

grant select, insert, update on public.mb_profiles to authenticated;
grant select, insert, update on public.mb_onboarding to authenticated;
grant select on public.mb_subscriptions to authenticated;
grant select on public.mb_challenges to authenticated;
grant select on public.mb_journeys to authenticated;
grant select on public.mb_daily_plans to authenticated;
grant select on public.mb_daily_plan_items to authenticated;
grant select, insert, update on public.mb_completions to authenticated;
grant select, insert, update on public.mb_daily_reflections to authenticated;
grant select, insert, update on public.mb_notification_preferences to authenticated;
grant select on public.mb_message_log to authenticated;

revoke all on public.mb_profiles from anon;
revoke all on public.mb_onboarding from anon;
revoke all on public.mb_subscriptions from anon;
revoke all on public.mb_challenges from anon;
revoke all on public.mb_journeys from anon;
revoke all on public.mb_daily_plans from anon;
revoke all on public.mb_daily_plan_items from anon;
revoke all on public.mb_completions from anon;
revoke all on public.mb_daily_reflections from anon;
revoke all on public.mb_notification_preferences from anon;
revoke all on public.mb_message_log from anon;
revoke all on public.mb_billing_events from anon, authenticated;

revoke insert, update, delete on public.mb_subscriptions from authenticated;
revoke insert, update, delete on public.mb_challenges from authenticated;
revoke insert, update, delete on public.mb_journeys from authenticated;
revoke insert, update, delete on public.mb_daily_plans from authenticated;
revoke insert, update, delete on public.mb_daily_plan_items from authenticated;
revoke insert, update, delete on public.mb_message_log from authenticated;

drop policy if exists "mb_completions_own_update" on public.mb_completions;
create policy "mb_completions_own_update" on public.mb_completions
for update to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
      from public.mb_daily_plan_items i
      join public.mb_daily_plans p on p.id = i.daily_plan_id
     where i.id = daily_plan_item_id
       and p.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
      from public.mb_daily_plan_items i
      join public.mb_daily_plans p on p.id = i.daily_plan_id
     where i.id = daily_plan_item_id
       and p.user_id = auth.uid()
  )
);

drop policy if exists "mb_reflections_own_update" on public.mb_daily_reflections;
create policy "mb_reflections_own_update" on public.mb_daily_reflections
for update to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1 from public.mb_daily_plans p
     where p.id = daily_plan_id
       and p.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.mb_daily_plans p
     where p.id = daily_plan_id
       and p.user_id = auth.uid()
  )
);

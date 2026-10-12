-- Aprovação de conteúdo pelo cliente + agendamento automático no Metricool.
-- Migração aditiva: não altera dados existentes. Publicação automática nasce DESLIGADA por cliente.

-- 1) Aprovação por conteúdo (central_ym_content_items)
alter table public.central_ym_content_items
  add column if not exists client_approval_status text not null default 'PENDENTE',
  add column if not exists client_approval_comment text not null default '',
  add column if not exists client_approved_at timestamptz,
  add column if not exists client_approved_by text,
  add column if not exists schedule_sync jsonb not null default '{}'::jsonb;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'central_ym_content_items_client_approval_status_check') then
    alter table public.central_ym_content_items
      add constraint central_ym_content_items_client_approval_status_check
      check (client_approval_status in ('PENDENTE','APROVADO','AJUSTE_SOLICITADO'));
  end if;
end $$;

comment on column public.central_ym_content_items.client_approval_status is
  'Decisão do cliente no portal. APROVADO dispara agendamento no Metricool quando client_social_publishing.auto_schedule = true.';
comment on column public.central_ym_content_items.schedule_sync is
  'Resultado do agendamento: {status: AGENDADO|ERRO|IGNORADO, networks:{instagram:{id,uuid,planner_url}}, error, attempted_at, attempts}.';

-- 2) Configuração de publicação por cliente
create table if not exists public.client_social_publishing (
  client_id uuid primary key references public.crm_clients(id) on delete cascade,
  provider text not null default 'METRICOOL' check (provider in ('METRICOOL')),
  metricool_blog_id text not null default '' check (metricool_blog_id ~ '^[0-9]*$'),
  auto_schedule boolean not null default false,
  networks text[] not null default array['instagram']::text[]
    check (networks <@ array['instagram','linkedin','facebook']::text[]),
  timezone text not null default 'America/Sao_Paulo',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);

comment on table public.client_social_publishing is
  'Publicação automática por cliente (marca no Metricool). Acesso só via service role (edge functions).';

alter table public.client_social_publishing enable row level security;
revoke all on public.client_social_publishing from anon, authenticated;
grant select, insert, update, delete on public.client_social_publishing to service_role;

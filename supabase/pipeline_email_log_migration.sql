-- Ausführen im Supabase SQL Editor
-- supabase.com → dein Projekt → SQL Editor → New query → einfügen + Run

create table if not exists pipeline_email_log (
  id         uuid primary key default gen_random_uuid(),
  brand_id   uuid not null references pipeline_brands(id) on delete cascade,
  sender     text not null,
  subject    text not null,
  body       text not null,
  sent_at    timestamptz not null default now()
);

create index if not exists pipeline_email_log_brand_id_idx on pipeline_email_log(brand_id);

alter table pipeline_email_log enable row level security;

create policy anon_full_access on pipeline_email_log
  for all
  to anon
  using (true)
  with check (true);

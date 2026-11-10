-- Aufgaben als Handy-App: Link an der Aufgabe, Stimmen (wartet drauf / unwichtig).
-- Idempotent. Vor dem Deploy ausführen, der Lader liest beide Felder.

-- Link zur Aufgabe (Drive, Mail, Seite), nicht der Nachweis beim Abhaken.
alter table crm_aufgaben add column if not exists link text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'crm_aufgaben_link_check') then
    alter table crm_aufgaben add constraint crm_aufgaben_link_check
      check (link is null or link ~* '^https?://');
  end if;
end $$;

-- Eine Stimme je Person und Aufgabe: +1 wartet drauf, -1 unwichtig.
create table if not exists crm_aufgaben_stimmen (
  aufgabe_id uuid        not null references crm_aufgaben(id) on delete cascade,
  wer        text        not null,
  wert       smallint    not null check (wert in (1, -1)),
  created_at timestamptz not null default now(),
  primary key (aufgabe_id, wer)
);

-- Wie alle CRM-Tabellen: RLS an, keine Policy, Zugriff nur über den Server.
alter table crm_aufgaben_stimmen enable row level security;

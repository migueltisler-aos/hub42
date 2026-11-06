-- Nachweis beim Abhaken: wer, Notiz, Link zur Lösung (z. B. Drive). Idempotent.

alter table crm_aufgaben add column if not exists erledigt_von text;
alter table crm_aufgaben add column if not exists erledigt_notiz text;
alter table crm_aufgaben add column if not exists erledigt_link text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'crm_aufgaben_erledigt_link_check') then
    alter table crm_aufgaben add constraint crm_aufgaben_erledigt_link_check
      check (erledigt_link is null or erledigt_link ~* '^https?://');
  end if;
end $$;

-- Historie: zuletzt Erledigtes zuerst.
create index if not exists crm_aufgaben_erledigt_am_idx on crm_aufgaben (erledigt_am desc) where erledigt_am is not null;

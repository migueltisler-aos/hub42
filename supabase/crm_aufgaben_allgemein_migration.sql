-- Allgemeine Aufgaben ohne Marke (Steuer, LinkedIn-Post) neben den Sales-Aufgaben.
-- Bisher verlangte crm_aufgaben eine Marke oder ein Projekt. Idempotent.

alter table crm_aufgaben drop constraint if exists crm_aufgaben_check;

alter table crm_aufgaben add column if not exists bereich text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'crm_aufgaben_bereich_check') then
    alter table crm_aufgaben add constraint crm_aufgaben_bereich_check
      check (bereich in ('Vertrieb', 'Marketing', 'Finanzen', 'Betrieb', 'Sonstiges'));
  end if;
end $$;

-- Offene allgemeine Aufgaben je Person und Frist, wie der Index der Sales-Aufgaben.
create index if not exists crm_aufgaben_allgemein_offen_idx
  on crm_aufgaben (wer, faellig_am) where erledigt_am is null and brand_id is null and projekt_id is null;

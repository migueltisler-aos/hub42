-- Ausführen im Supabase SQL Editor
-- supabase.com → dein Projekt → SQL Editor → New query → einfügen + Run
--
-- Zentrales Bestands-Ledger: fuehrt Wareneingang (Zugang) und Kassen-Verkauf
-- (Abgang) automatisch per Trigger zusammen, statt dass jede App das selbst
-- korrekt schreiben muss. Kein Lagerort (Puffer/Regal) - bei 100 qm Store
-- lohnt die Trennung nicht, ein Bestand je Artikel/Standort reicht.
-- Siehe kassensystem/README.md Abschnitt 12.

create table if not exists bestand_bewegungen (
  id            uuid primary key default gen_random_uuid(),
  ean           text not null,
  standort_id   text not null,
  menge_delta   integer not null,
  quelle        text not null check (quelle in ('wareneingang', 'verkauf', 'korrektur')),
  referenz_id   uuid,
  erstellt_am   timestamptz not null default now()
);

alter table bestand_bewegungen enable row level security;
create policy anon_full_access on bestand_bewegungen for all to anon using (true) with check (true);

create or replace view bestand_aktuell as
select ean, standort_id, sum(menge_delta)::integer as menge
from bestand_bewegungen
group by ean, standort_id;

-- Wareneingang (Charge) -> automatischer Zugang
create or replace function bestand_aus_wareneingang() returns trigger as $$
declare
  v_standort_id text;
begin
  select standort_id into v_standort_id from wareneingang_sendungen where id = new.sendung_id;
  insert into bestand_bewegungen (ean, standort_id, menge_delta, quelle, referenz_id)
  values (new.ean, coalesce(v_standort_id, 'alexa-berlin'), new.menge, 'wareneingang', new.id);
  return new;
end;
$$ language plpgsql;

drop trigger if exists wareneingang_bestand_trigger on wareneingang_chargen;
create trigger wareneingang_bestand_trigger
after insert on wareneingang_chargen
for each row execute function bestand_aus_wareneingang();

-- Verkauf (Kassen-Kern-Sync) -> automatischer Abgang
create or replace function bestand_aus_verkauf() returns trigger as $$
begin
  insert into bestand_bewegungen (ean, standort_id, menge_delta, quelle, referenz_id)
  values (new.ean, new.standort_id, -new.menge, 'verkauf', new.id);
  return new;
end;
$$ language plpgsql;

drop trigger if exists verkauf_bestand_trigger on kasse_verkaeufe;
create trigger verkauf_bestand_trigger
after insert on kasse_verkaeufe
for each row execute function bestand_aus_verkauf();

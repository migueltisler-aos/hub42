-- Ausführen im Supabase SQL Editor
-- supabase.com → dein Projekt → SQL Editor → New query → einfügen + Run
--
-- Kassieren in der SumUp-App (Artikel dort antippen, Solo Lite belasten),
-- danach auf /kasse die Zahlung auswählen und Umfrage ergänzen.
-- Die Seite holt die Zahlungen per SumUp-Transaktions-API, legt sie hier ab
-- und bucht die Positionen als kasse_verkaeufe (-> Bestand per Trigger).
--
-- Bewusst NICHT gespeichert: Kartenziffern, GPS, Autorisierungscode. Die
-- Umfrage (Alter/Geschlecht) bleibt dadurch anonym. Bewusst keine PLZ.

create table if not exists sumup_transaktionen (
  id                  text primary key,          -- SumUp transaction id
  transaction_code    text,
  standort_id         text not null default 'alexa-berlin',
  zeitstempel         timestamptz not null,
  betrag              numeric not null,
  mwst                numeric,
  trinkgeld           numeric not null default 0,
  gebuehr             numeric,                   -- SumUp-Gebuehr, falls schon abgerechnet
  erstattet           numeric not null default 0,
  status              text not null,             -- SUCCESSFUL / FAILED / CANCELLED / REFUNDED ...
  zahlart             text not null,             -- karte / bar / sonstige
  zahlweise           text,                      -- contactless / chip / ...
  benutzer            text,                      -- SumUp-Login, der kassiert hat
  produkte            jsonb not null default '[]'::jsonb,
  nicht_zugeordnet    text[] not null default '{}',
  verkaeufe_gebucht   boolean not null default false,
  importiert_am       timestamptz not null default now(),
  aktualisiert_am     timestamptz not null default now()
);

create index if not exists sumup_transaktionen_zeit_idx on sumup_transaktionen (zeitstempel desc);

-- Nur serverseitig (Service-Role) - keine anon-Policy, siehe rls_lockdown_migration.sql
alter table sumup_transaktionen enable row level security;

-- Verkaeufe aus der SumUp-App haben keine Bon-Nr. des Kassen-Kerns
alter table kasse_verkaeufe alter column bon_nr drop not null;
alter table kasse_verkaeufe add column if not exists sumup_transaktion_id text references sumup_transaktionen(id);
create index if not exists kasse_verkaeufe_sumup_idx on kasse_verkaeufe (sumup_transaktion_id);

alter table kasse_beobachtungen alter column bon_nr drop not null;
alter table kasse_beobachtungen add column if not exists sumup_transaktion_id text references sumup_transaktionen(id);
create unique index if not exists kasse_beobachtungen_sumup_uidx on kasse_beobachtungen (sumup_transaktion_id);

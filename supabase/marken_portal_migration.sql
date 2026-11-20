-- Marken-Portal: Onboarding (Stammdaten für Gutschrift/Rechnung), Zugang,
-- Abrechnung je Monat, Regalfotos.
--
-- Zugriffsmodell: Marken lesen NIE direkt über PostgREST. Supabase Auth liefert
-- nur die Identität, der Server lädt alles über den Service-Role-Client und
-- filtert über brand_nutzer (lib/marke.ts). Deshalb RLS an, keine Policy:
-- anon und authenticated sehen hier nichts.
--
-- Idempotent: mehrfach ausführbar.

-- ── Zugang: Auth-Nutzer ↔ Marke ─────────────────────────────────────────────
create table if not exists brand_nutzer (
  user_id     uuid not null references auth.users(id) on delete cascade,
  brand_id    uuid not null references pipeline_brands(id) on delete cascade,
  email       text not null,
  kontakt_id  uuid references crm_kontakte(id) on delete set null,
  eingeladen_von text,
  created_at  timestamptz not null default now(),
  letzter_login timestamptz,
  primary key (user_id, brand_id)
);
create index if not exists brand_nutzer_brand_idx on brand_nutzer(brand_id);
alter table brand_nutzer enable row level security;

-- ── Konditionen + Stammdaten für Gutschrift (GS) und Rechnung (RG) ───────────
create table if not exists brand_konditionen (
  brand_id          uuid primary key references pipeline_brands(id) on delete cascade,
  -- Stammdaten, von der Marke im Onboarding ausgefüllt
  firma             text,
  strasse           text,
  plz               text,
  ort               text,
  land              text default 'DE',
  rechnungs_email   text,
  ansprechpartner   text,
  telefon           text,
  logistik_kontakt  text,
  nachschub_email   text,
  ust_idnr          text,
  steuernummer      text,
  kleinunternehmer  boolean not null default false,
  iban              text,
  bic               text,
  kontoinhaber      text,
  gutschrift_zustimmung_am      timestamptz,
  gutschrift_zustimmung_version text,
  konditionen_bestaetigt_am     timestamptz,
  -- Konditionen, von Hub42 gesetzt
  provision_pct     numeric(5,2) not null default 7.00,
  provision_basis   text not null default 'netto' check (provision_basis in ('netto', 'brutto')),
  miete_netto_monat numeric(10,2) not null default 0,
  vertragsbeginn    date,
  laufzeit_monate   integer,
  kuendigungsfrist  text,
  regal_cm          integer,
  regal_lage        text,
  -- Ablauf
  status            text not null default 'entwurf'
                    check (status in ('entwurf', 'eingereicht', 'freigegeben')),
  eingereicht_am    timestamptz,
  freigegeben_von   text,
  freigegeben_am    timestamptz,
  pruef_notiz       text,
  updated_at        timestamptz not null default now()
);
alter table brand_konditionen enable row level security;

-- ── Artikel, die eine Marke einreicht (vor Freigabe nicht in der Kasse) ──────
create table if not exists brand_artikel_antrag (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null references pipeline_brands(id) on delete cascade,
  ean           text not null,
  artikel_name  text not null,
  vk_brutto     numeric(10,2) not null check (vk_brutto > 0),
  mwst_satz     numeric(4,2) not null check (mwst_satz in (0, 7, 19)),
  inhalt        text,
  mhd_tage      integer,
  status        text not null default 'eingereicht'
                check (status in ('eingereicht', 'freigegeben', 'abgelehnt')),
  created_at    timestamptz not null default now(),
  entschieden_am timestamptz,
  unique (brand_id, ean)
);
alter table brand_artikel_antrag enable row level security;

-- MwSt-Satz je Artikel: Pflicht für die Gutschrift (Entgelt je Steuersatz).
alter table kasse_artikelstamm add column if not exists mwst_satz numeric(4,2)
  check (mwst_satz is null or mwst_satz in (0, 7, 19));

-- ── Feedback-Produkte an die Marke hängen (bisher Freitext) ──────────────────
alter table feedback_products add column if not exists brand_id uuid references pipeline_brands(id) on delete set null;
create index if not exists feedback_products_brand_idx on feedback_products(brand_id);
update feedback_products fp
   set brand_id = b.id
  from pipeline_brands b
 where fp.brand_id is null
   and fp.brand is not null
   and lower(trim(b.name)) = lower(trim(fp.brand));

-- ── Regalfotos ───────────────────────────────────────────────────────────────
create table if not exists brand_regalfotos (
  id            uuid primary key default gen_random_uuid(),
  brand_id      uuid not null references pipeline_brands(id) on delete cascade,
  standort_id   text not null default 'alexa-berlin',
  pfad          text not null,
  aufgenommen_am timestamptz not null default now(),
  aufgenommen_von text
);
create index if not exists brand_regalfotos_brand_idx on brand_regalfotos(brand_id, aufgenommen_am desc);
alter table brand_regalfotos enable row level security;

-- ── Abrechnung je Marke und Monat ────────────────────────────────────────────
create sequence if not exists gutschrift_nr_seq start 1;
create sequence if not exists rechnung_nr_seq start 1;

create table if not exists abrechnungen (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid not null references pipeline_brands(id) on delete cascade,
  zeitraum        text not null check (zeitraum ~ '^\d{4}-\d{2}$'),
  status          text not null default 'entwurf' check (status in ('entwurf', 'final', 'bezahlt')),
  gs_nr           text,
  rg_nr           text,
  -- alle Beträge in Cent
  umsatz_brutto_ct   bigint not null default 0,
  provision_ct       bigint not null default 0,
  gs_netto_ct        bigint not null default 0,
  gs_ust_ct          bigint not null default 0,
  gs_brutto_ct       bigint not null default 0,
  miete_netto_ct     bigint not null default 0,
  rg_ust_ct          bigint not null default 0,
  rg_brutto_ct       bigint not null default 0,
  vortrag_alt_ct     bigint not null default 0,
  auszahlung_ct      bigint not null default 0,
  vortrag_neu_ct     bigint not null default 0,
  details         jsonb not null default '{}'::jsonb,   -- Steuersätze, Positionen, Konditionen-Schnappschuss
  gs_pdf_pfad     text,
  rg_pdf_pfad     text,
  erstellt_am     timestamptz not null default now(),
  finalisiert_am  timestamptz,
  finalisiert_von text,
  bezahlt_am      timestamptz,
  unique (brand_id, zeitraum)
);
alter table abrechnungen enable row level security;

-- Fortlaufende Nummer erst beim Finalisieren ziehen (keine Lücken durch Entwürfe
-- außer bei Abbruch nach dem Ziehen – das ist bei Gutschriften zulässig, solange
-- die Nummer einmalig bleibt).
create or replace function abrechnung_nummern_ziehen(p_id uuid)
returns table (gs_nr text, rg_nr text)
language plpgsql security definer set search_path = public as $$
declare
  a abrechnungen%rowtype;
  jahr text;
begin
  select * into a from abrechnungen where id = p_id for update;
  if a.status <> 'entwurf' then
    raise exception 'Abrechnung % ist nicht im Entwurf', p_id;
  end if;
  jahr := left(a.zeitraum, 4);
  return query
  update abrechnungen
     set gs_nr = coalesce(abrechnungen.gs_nr, 'GS-' || jahr || '-' || lpad(nextval('gutschrift_nr_seq')::text, 4, '0')),
         rg_nr = case when a.miete_netto_ct > 0
                      then coalesce(abrechnungen.rg_nr, 'RG-' || jahr || '-' || lpad(nextval('rechnung_nr_seq')::text, 4, '0'))
                      else null end
   where abrechnungen.id = p_id
  returning abrechnungen.gs_nr, abrechnungen.rg_nr;
end $$;
revoke all on function abrechnung_nummern_ziehen(uuid) from public, anon, authenticated;
grant execute on function abrechnung_nummern_ziehen(uuid) to service_role;

-- ── Bestandsquellen: Migration an die Datenbank angleichen ───────────────────
-- (Tasting = muster_entnahme, Abschrift; in der DB bereits so, Datei war veraltet)
alter table bestand_bewegungen drop constraint if exists bestand_bewegungen_quelle_check;
alter table bestand_bewegungen add constraint bestand_bewegungen_quelle_check
  check (quelle in ('wareneingang', 'verkauf', 'muster_entnahme', 'abschrift', 'korrektur'));

-- ── Storage: privater Bucket für Gutschriften, Rechnungen, Regalfotos ────────
insert into storage.buckets (id, name, public)
values ('marken', 'marken', false)
on conflict (id) do nothing;

-- ── 2026-11-19: EAN optional, Produktbild je Artikel ─────────────────────────
alter table brand_artikel_antrag alter column ean drop not null;
alter table brand_artikel_antrag add column if not exists bild_pfad text;

-- ── 2026-11-20: Artikel-Vorschläge (von Hub42 vorbereitet, Marke ergänzt) ────
alter table brand_artikel_antrag drop constraint if exists brand_artikel_antrag_status_check;
alter table brand_artikel_antrag add constraint brand_artikel_antrag_status_check
  check (status in ('vorschlag', 'eingereicht', 'freigegeben', 'abgelehnt'));
alter table brand_artikel_antrag alter column vk_brutto drop not null;
alter table brand_artikel_antrag alter column mwst_satz drop not null;
-- Eingereicht und freigegeben brauchen Preis und MwSt, nur Vorschläge dürfen leer sein
alter table brand_artikel_antrag drop constraint if exists brand_artikel_antrag_vollstaendig;
alter table brand_artikel_antrag add constraint brand_artikel_antrag_vollstaendig
  check (status = 'vorschlag' or (vk_brutto is not null and mwst_satz is not null));
alter table brand_artikel_antrag add column if not exists quelle text;

-- ── 2026-11-20: ohne Freigabe ────────────────────────────────────────────────
-- Stammdaten gelten mit dem Einreichen; nur eine nachträgliche IBAN-Änderung
-- wird markiert. Artikel gehen sofort in die Kasse; was in SumUp anzulegen
-- oder zu ändern ist, steht in sumup_offen/sumup_hinweis.
alter table brand_konditionen add column if not exists iban_geaendert_am timestamptz;
alter table kasse_artikelstamm add column if not exists sumup_offen boolean not null default false;
alter table kasse_artikelstamm add column if not exists sumup_hinweis text;
alter table kasse_artikelstamm add column if not exists sumup_seit timestamptz;
update brand_konditionen set status = 'freigegeben', freigegeben_von = coalesce(freigegeben_von, 'Marke'), freigegeben_am = coalesce(freigegeben_am, eingereicht_am, now())
 where status = 'eingereicht';

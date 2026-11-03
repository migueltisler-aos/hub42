-- TROCKENLAUF für crm_migration.sql: schreibt NICHTS fest.
--
-- So geht's: Datei komplett in den Supabase SQL-Editor kopieren, „Run“.
-- Erwartet wird ein Fehler `DRYRUN {...}`: das ist Absicht. Der Fehler am Ende
-- nimmt die ganze Anfrage zurück, die JSON-Zeile darin sind die Testergebnisse.
-- Diese Zeile an Claude schicken. Sie enthält nur Zahlen, keine Kundendaten.
--
-- Erzeugt aus crm_migration.sql plus Testblock. Nach Änderungen an der
-- Migration neu erzeugen.

-- CRM-Grundgerüst: Stufen, Kontakte, Aktivitäten, Aufgaben, Projekte, Meilensteine.
-- Plan: docs/crm-plan.md. ENTWURF, noch nicht ausgeführt.
--
-- Idempotent wie die übrigen Migrationen. RLS an, keine anon-Policy:
-- Zugriff nur über lib/supabase-admin.ts (siehe rls_lockdown_migration.sql).
-- `pipeline_brands.status` bleibt vorerst stehen, die App zieht auf `stufe` um.

-- ── Stufe an der Marke ───────────────────────────────────────────────────────
alter table pipeline_brands
  add column if not exists stufe          text,
  add column if not exists stufe_seit     timestamptz,
  add column if not exists segment        text,
  add column if not exists verlust_grund  text,
  add column if not exists wiedervorlage  date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pipeline_brands_stufe_chk') then
    alter table pipeline_brands
      add constraint pipeline_brands_stufe_chk
      check (stufe in ('Recherche', 'In Sequenz', 'Antwort', 'Interesse', 'Gespräch',
                       'Angebot', 'Kunde', 'Später', 'Verloren', 'Gesperrt'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pipeline_brands_segment_chk') then
    alter table pipeline_brands
      add constraint pipeline_brands_segment_chk
      check (segment is null or segment in ('Startup', 'Enterprise', 'Partner'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pipeline_brands_verlust_grund_chk') then
    alter table pipeline_brands
      add constraint pipeline_brands_verlust_grund_chk
      check (verlust_grund is null or verlust_grund in
        ('Preis', 'Timing', 'Kein Bedarf', 'Eigener Handel reicht',
         'Kapazität/Ware', 'Keine Antwort', 'Sonstiges'));
  end if;
  -- Pflichtfelder je Stufe
  if not exists (select 1 from pg_constraint where conname = 'pipeline_brands_verloren_grund_chk') then
    alter table pipeline_brands
      add constraint pipeline_brands_verloren_grund_chk
      check (stufe is distinct from 'Verloren' or verlust_grund is not null) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'pipeline_brands_spaeter_datum_chk') then
    alter table pipeline_brands
      add constraint pipeline_brands_spaeter_datum_chk
      check (stufe is distinct from 'Später' or wiedervorlage is not null) not valid;
  end if;
end $$;

-- Backfill aus dem alten Status. Alt-Verlorene bekommen „Sonstiges“,
-- Alt-Später die Wiedervorlage aus datum_naechste_aktion oder in 30 Tagen.
update pipeline_brands set
  stufe = case status
    when 'Neu'         then 'Recherche'
    when 'Kontaktiert' then 'In Sequenz'
    when 'Antwort'     then 'Antwort'
    when 'Gespräch'    then 'Gespräch'
    when 'Angebot'     then 'Angebot'
    when 'Onboarded'   then 'Kunde'
    when 'Später'      then 'Später'
    when 'Abgelehnt'   then 'Verloren'
    when 'Inaktiv'     then 'Verloren'  -- „Inaktiv schalten“, Kommentar steht in feedback
    else 'Recherche'
  end,
  stufe_seit    = coalesce(datum_letzte_aktion::timestamptz, created_at),
  verlust_grund = case when status in ('Abgelehnt', 'Inaktiv') then 'Sonstiges' end,
  segment       = case when typ = 'Partner' then 'Partner' end,
  wiedervorlage = case when status = 'Später'
                       then coalesce(datum_naechste_aktion, current_date + 30) end
where stufe is null;

update pipeline_brands b set stufe = 'Gesperrt'
from suppression s
where lower(s.email) = lower(b.email) and b.stufe is distinct from 'Kunde';

alter table pipeline_brands alter column stufe set default 'Recherche';
alter table pipeline_brands alter column stufe set not null;
alter table pipeline_brands alter column stufe_seit set default now();

create or replace function crm_stufe_seit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.stufe is distinct from old.stufe then
    new.stufe_seit = now();
  end if;
  return new;
end $$;

drop trigger if exists pipeline_brands_stufe_seit on pipeline_brands;
-- Ohne Spaltenliste: `update of stufe` feuert nicht, wenn ein anderer
-- BEFORE-Trigger (crm_stufe_aus_outreach) die Stufe setzt. Alphabetisch läuft
-- dieser Trigger nach stufe_aus_outreach und sieht dessen Ergebnis.
create trigger pipeline_brands_stufe_seit
  before update on pipeline_brands
  for each row execute function crm_stufe_seit();

-- Outreach schiebt die Stufe: gesendet → In Sequenz, Antwort → Antwort,
-- Bounce → Gesperrt. outreach_status setzen send-step und der Gmail-Webhook.
create or replace function crm_stufe_aus_outreach()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.outreach_status is not distinct from old.outreach_status then
    return new;
  end if;
  if new.outreach_status = 'contacted' and new.stufe = 'Recherche' then
    new.stufe = 'In Sequenz';
  elsif new.outreach_status = 'replied' and new.stufe in ('Recherche', 'In Sequenz') then
    new.stufe = 'Antwort';
  elsif new.outreach_status = 'bounced' and new.stufe in ('Recherche', 'In Sequenz') then
    new.stufe = 'Gesperrt';
  end if;
  return new;
end $$;

drop trigger if exists pipeline_brands_stufe_aus_outreach on pipeline_brands;
create trigger pipeline_brands_stufe_aus_outreach
  before update of outreach_status on pipeline_brands
  for each row execute function crm_stufe_aus_outreach();

-- Routing: ohne Besitzer entscheidet das Segment.
-- Startup → Ralf, Enterprise → Anke (BIFI), Partner und ohne Segment → Miguel.
create or replace function crm_routing()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(btrim(new.zugewiesen), '') = '' then
    new.zugewiesen = case new.segment
      when 'Startup'    then 'Ralf'
      when 'Enterprise' then 'Anke'
      else 'Miguel'
    end;
  end if;
  return new;
end $$;

drop trigger if exists pipeline_brands_routing on pipeline_brands;
create trigger pipeline_brands_routing
  before insert or update of segment, zugewiesen on pipeline_brands
  for each row execute function crm_routing();

create index if not exists pipeline_brands_stufe_idx   on pipeline_brands (stufe);
create index if not exists pipeline_brands_segment_idx on pipeline_brands (segment);

-- ── Kontakte ────────────────────────────────────────────────────────────────
create table if not exists crm_kontakte (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references pipeline_brands(id) on delete cascade,
  name        text not null,
  rolle       text,
  email       text,
  telefon     text,
  linkedin    text,
  ist_haupt   boolean not null default false,
  notiz       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists crm_kontakte_brand_id_idx on crm_kontakte (brand_id);
create unique index if not exists crm_kontakte_ein_haupt_idx
  on crm_kontakte (brand_id) where ist_haupt;

-- Backfill: der bisherige Ansprechpartner wird Hauptkontakt.
insert into crm_kontakte (brand_id, name, email, linkedin, ist_haupt)
select b.id, coalesce(nullif(btrim(b.ansprechpartner), ''), b.name), b.email, b.linkedin, true
from pipeline_brands b
where (coalesce(btrim(b.ansprechpartner), '') <> '' or coalesce(btrim(b.email), '') <> '')
  and not exists (select 1 from crm_kontakte k where k.brand_id = b.id);

-- ── Aktivitäten ─────────────────────────────────────────────────────────────
-- Handnotizen, Anrufe, Termine, Stufenwechsel. Mails stehen weiter in
-- pipeline_email_log / email_events und kommen über die View dazu.
create table if not exists crm_aktivitaeten (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references pipeline_brands(id) on delete cascade,
  kontakt_id  uuid references crm_kontakte(id) on delete set null,
  typ         text not null check (typ in ('Notiz', 'Anruf', 'Termin', 'Mail', 'Stufe', 'System')),
  titel       text not null,
  inhalt      text,
  wann        timestamptz not null default now(),
  wer         text,
  created_at  timestamptz not null default now()
);
create index if not exists crm_aktivitaeten_brand_wann_idx on crm_aktivitaeten (brand_id, wann desc);

-- Stufenwechsel landet automatisch in der Zeitleiste.
create or replace function crm_stufe_protokoll()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.stufe is distinct from old.stufe then
    insert into public.crm_aktivitaeten (brand_id, typ, titel, inhalt)
    values (new.id, 'Stufe', old.stufe || ' → ' || new.stufe, new.verlust_grund);
  end if;
  return new;
end $$;

drop trigger if exists pipeline_brands_stufe_protokoll on pipeline_brands;
create trigger pipeline_brands_stufe_protokoll
  after update on pipeline_brands
  for each row when (old.stufe is distinct from new.stufe)
  execute function crm_stufe_protokoll();

-- ── Aufgaben ────────────────────────────────────────────────────────────────
create table if not exists crm_aufgaben (
  id           uuid primary key default gen_random_uuid(),
  brand_id     uuid references pipeline_brands(id) on delete cascade,
  projekt_id   uuid,  -- FK unten, nach crm_projekte
  titel        text not null,
  faellig_am   date,
  wer          text,
  erledigt_am  timestamptz,
  created_at   timestamptz not null default now(),
  created_by   text,
  check (brand_id is not null or projekt_id is not null)
);
create index if not exists crm_aufgaben_offen_idx
  on crm_aufgaben (wer, faellig_am) where erledigt_am is null;
create index if not exists crm_aufgaben_brand_id_idx on crm_aufgaben (brand_id);

-- Backfill: offene „nächste Aktion“ wird Aufgabe.
insert into crm_aufgaben (brand_id, titel, faellig_am, wer, created_by)
select b.id, b.naechste_aktion, b.datum_naechste_aktion, b.zugewiesen, 'migration'
from pipeline_brands b
where coalesce(btrim(b.naechste_aktion), '') <> ''
  and b.stufe not in ('Verloren', 'Gesperrt')
  and not exists (select 1 from crm_aufgaben a where a.brand_id = b.id and a.created_by = 'migration');

-- ── Projekte und Meilensteine ───────────────────────────────────────────────
create table if not exists crm_projekte (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references pipeline_brands(id) on delete cascade,
  angebot_id  uuid unique references pipeline_angebote(id) on delete set null,
  titel       text not null,
  status      text not null default 'Vorbereitung'
              check (status in ('Vorbereitung', 'Live', 'Auswertung', 'Abgeschlossen', 'Abgebrochen')),
  start_datum date,
  end_datum   date,
  wer         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists crm_projekte_brand_id_idx on crm_projekte (brand_id);
create index if not exists crm_projekte_status_idx   on crm_projekte (status);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'crm_aufgaben_projekt_fk') then
    alter table crm_aufgaben
      add constraint crm_aufgaben_projekt_fk
      foreign key (projekt_id) references crm_projekte(id) on delete cascade;
  end if;
end $$;
create index if not exists crm_aufgaben_projekt_id_idx on crm_aufgaben (projekt_id);

create table if not exists crm_meilensteine (
  id           uuid primary key default gen_random_uuid(),
  projekt_id   uuid not null references crm_projekte(id) on delete cascade,
  reihenfolge  smallint not null,
  titel        text not null,
  faellig_am   date,
  erledigt_am  timestamptz,
  auto_quelle  text check (auto_quelle in ('kasse_artikelstamm', 'wareneingang_sendungen', 'kasse_verkaeufe')),
  notiz        text,
  unique (projekt_id, reihenfolge)
);

-- Angebot angenommen → Projekt mit Standard-Meilensteinen, Marke wird Kunde.
create or replace function crm_projekt_aus_angebot()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  p_id   uuid;
  s      date := coalesce(new.start_datum, current_date + 14);
  e      date := (s + make_interval(months => coalesce(new.laufzeit_monate, 3)))::date;
  b_wer  text;
begin
  if new.status <> 'Angenommen' or old.status = 'Angenommen' or new.brand_id is null then
    return new;
  end if;

  select zugewiesen into b_wer from public.pipeline_brands where id = new.brand_id;

  insert into public.crm_projekte (brand_id, angebot_id, titel, start_datum, end_datum, wer)
  values (new.brand_id, new.id, coalesce(new.titel, new.angebot_nr), s, e, b_wer)
  on conflict (angebot_id) do nothing
  returning id into p_id;

  if p_id is null then
    return new;
  end if;

  insert into public.crm_meilensteine (projekt_id, reihenfolge, titel, faellig_am, auto_quelle) values
    (p_id, 1, 'Vertrag unterschrieben',              s - 14, null),
    (p_id, 2, 'Artikelstamm und Etiketten angelegt', s - 7,  'kasse_artikelstamm'),
    (p_id, 3, 'Ware eingegangen',                    s - 2,  'wareneingang_sendungen'),
    (p_id, 4, 'Regal live',                          s,      null),
    (p_id, 5, 'Erster Verkauf',                      s + 7,  'kasse_verkaeufe'),
    (p_id, 6, 'Feedback-Panel aktiv',                s + 7,  null),
    (p_id, 7, 'Zwischenbericht',                     s + (e - s) / 2, null),
    (p_id, 8, 'Verlängerungsgespräch',               e - 21, null),
    (p_id, 9, 'Abschlussbericht',                    e,      null);

  update public.pipeline_brands set stufe = 'Kunde' where id = new.brand_id;
  return new;
end $$;

drop trigger if exists pipeline_angebote_projekt on pipeline_angebote;
create trigger pipeline_angebote_projekt
  after update of status on pipeline_angebote
  for each row execute function crm_projekt_aus_angebot();

-- ── Bewerbungen als Einstieg ────────────────────────────────────────────────
-- Jede Bewerbung landet in der Pipeline: Treffer über website_key, Mail oder
-- Markenname, sonst neue Marke. Stufe Interesse, Aufgabe „Bewerbung prüfen“
-- für heute beim Besitzer. Weiter fortgeschrittene Marken behalten ihre Stufe.
alter table bewerbungen
  add column if not exists brand_id uuid references pipeline_brands(id) on delete set null;
create index if not exists bewerbungen_brand_id_idx on bewerbungen (brand_id);

create or replace function crm_bewerbung_zu_brand(bw public.bewerbungen)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  b_id  uuid;
  b_key text := nullif(regexp_replace(
                  regexp_replace(lower(btrim(coalesce(bw.website, ''))), '^https?://(www\.)?', ''),
                  '/$', ''), '');
  b_wer text;
begin
  select id into b_id from public.pipeline_brands
  where (b_key is not null and website_key = b_key)
     or lower(email) = lower(bw.email)
     or lower(btrim(name)) = lower(btrim(bw.marke))
  order by (website_key = b_key) desc nulls last
  limit 1;

  if b_id is null then
    insert into public.pipeline_brands
      (name, website, website_key, email, ansprechpartner, produkt, gefunden_via, stufe, segment)
    values
      (bw.marke, bw.website, b_key, bw.email, bw.name, bw.produkt, 'Bewerbung', 'Interesse',
       case when bw.einstieg = 'studie' then 'Enterprise' else 'Startup' end)
    returning id into b_id;
  else
    update public.pipeline_brands
    set stufe = 'Interesse', verlust_grund = null, wiedervorlage = null
    where id = b_id
      and stufe in ('Recherche', 'In Sequenz', 'Antwort', 'Später', 'Verloren', 'Gesperrt');
  end if;

  insert into public.crm_kontakte (brand_id, name, email, ist_haupt)
  select b_id, bw.name, bw.email,
         not exists (select 1 from public.crm_kontakte where brand_id = b_id and ist_haupt)
  where not exists (select 1 from public.crm_kontakte
                    where brand_id = b_id and lower(email) = lower(bw.email));

  insert into public.crm_aktivitaeten (brand_id, typ, titel, inhalt, wann)
  values (b_id, 'System', 'Bewerbung eingegangen: ' || bw.produkt,
          concat_ws(' · ', bw.einstieg, bw.zone, bw.cm || ' cm', bw.nachricht), bw.created_at);

  -- Aufgabe nur für offene Bewerbungen
  if bw.status = 'neu' then
    select zugewiesen into b_wer from public.pipeline_brands where id = b_id;
    insert into public.crm_aufgaben (brand_id, titel, faellig_am, wer, created_by)
    values (b_id, 'Bewerbung prüfen und antworten', bw.created_at::date, b_wer, 'bewerbung');
  end if;

  return b_id;
end $$;

create or replace function crm_bewerbung_einordnen()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.brand_id is null then
    new.brand_id = public.crm_bewerbung_zu_brand(new);
  end if;
  return new;
end $$;

drop trigger if exists bewerbungen_einordnen on bewerbungen;
create trigger bewerbungen_einordnen
  before insert on bewerbungen
  for each row execute function crm_bewerbung_einordnen();

-- Backfill: bestehende Bewerbungen durch denselben Weg. Danach Stufe nach
-- altem Bewerbungsstatus, nur wo die Marke gerade erst auf Interesse kam.
update bewerbungen set brand_id = crm_bewerbung_zu_brand(bewerbungen)
where brand_id is null;

update pipeline_brands b set stufe = 'Kunde'
from bewerbungen w
where w.brand_id = b.id and w.status in ('angenommen', 'onboarding') and b.stufe = 'Interesse';

update pipeline_brands b set stufe = 'Verloren', verlust_grund = 'Sonstiges'
from bewerbungen w
where w.brand_id = b.id and w.status = 'abgelehnt' and b.stufe = 'Interesse';

-- ── Zeitleiste ──────────────────────────────────────────────────────────────
-- Eine Liste je Marke über alle Quellen. security_invoker, sonst unterläuft
-- die View den RLS-Lockdown (siehe Nachtrag in rls_lockdown_migration.sql).
create or replace view crm_zeitleiste with (security_invoker = true) as
  select a.brand_id, a.wann, a.typ, a.titel, a.inhalt, a.wer, 'crm_aktivitaeten' as quelle, a.id
  from crm_aktivitaeten a
union all
  select m.brand_id, m.sent_at, 'Mail', m.subject, m.body, m.sender, 'pipeline_email_log', m.id
  from pipeline_email_log m
union all
  select g.brand_id, g.created_at, 'Angebot', g.angebot_nr || ' · ' || g.status, g.titel, g.created_by, 'pipeline_angebote', g.id
  from pipeline_angebote g where g.brand_id is not null
union all
  select w.brand_id, w.eingegangen_am, 'Wareneingang', 'Sendung eingegangen', w.dhl_tracking_nr, w.eingegangen_von, 'wareneingang_sendungen', w.id
  from wareneingang_sendungen w where w.brand_id is not null
union all
  select e.brand_id, e.created_at, 'Outreach',
         case e.type when 'sent' then 'Outreach-Mail ' || coalesce(e.step::text, '') || ' raus'
                     when 'reply' then 'Antwort eingegangen'
                     when 'bounce' then 'Bounce'
                     else e.type end,
         e.raw ->> 'subject', null, 'email_events', e.id
  from email_events e where e.brand_id is not null;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table crm_kontakte     enable row level security;
alter table crm_aktivitaeten enable row level security;
alter table crm_aufgaben     enable row level security;
alter table crm_projekte     enable row level security;
alter table crm_meilensteine enable row level security;

-- updated_at über die bestehende Funktion aus angebote_migration.sql
drop trigger if exists crm_kontakte_updated_at on crm_kontakte;
create trigger crm_kontakte_updated_at before update on crm_kontakte
  for each row execute function set_updated_at();
drop trigger if exists crm_projekte_updated_at on crm_projekte;
create trigger crm_projekte_updated_at before update on crm_projekte
  for each row execute function set_updated_at();

-- ── TESTS, danach erzwungener Abbruch ───────────────────────────────────────
do $$
declare
  r jsonb := '{}';
  t_brand uuid; t_ang uuid; t_new uuid; t_bw uuid;
begin
  r := r || jsonb_build_object(
    'stufen', (select jsonb_object_agg(stufe, n) from (select stufe, count(*) n from public.pipeline_brands group by stufe) s),
    'segmente', (select jsonb_object_agg(coalesce(segment,'ohne'), n) from (select segment, count(*) n from public.pipeline_brands group by segment) s),
    'kontakte', (select count(*) from public.crm_kontakte),
    'aufgaben', (select jsonb_object_agg(created_by, n) from (select created_by, count(*) n from public.crm_aufgaben group by created_by) s),
    'bewerbungen_verknuepft', (select count(*) from public.bewerbungen where brand_id is not null),
    'brands_aus_bewerbung', (select count(*) from public.pipeline_brands where gefunden_via = 'Bewerbung'),
    'zeitleiste', (select jsonb_object_agg(quelle, n) from (select quelle, count(*) n from public.crm_zeitleiste group by quelle) s));

  -- T1: Outreach-Antwort schiebt Recherche → Antwort, mit Protokoll
  select id into t_brand from public.pipeline_brands where stufe = 'Recherche' limit 1;
  update public.pipeline_brands set outreach_status = 'replied' where id = t_brand;
  r := r || jsonb_build_object('t1_stufe', (select stufe from public.pipeline_brands where id = t_brand),
         't1_protokoll', (select count(*) from public.crm_aktivitaeten where brand_id = t_brand and typ = 'Stufe'));

  -- T2: Angebot angenommen → Projekt, 9 Meilensteine, Marke Kunde
  select id into t_ang from public.pipeline_angebote where status <> 'Angenommen' and brand_id is not null limit 1;
  if t_ang is not null then
    update public.pipeline_angebote set status = 'Angenommen' where id = t_ang;
    r := r || jsonb_build_object('t2_projekte', (select count(*) from public.crm_projekte where angebot_id = t_ang),
           't2_meilensteine', (select count(*) from public.crm_meilensteine m join public.crm_projekte p on p.id = m.projekt_id where p.angebot_id = t_ang),
           't2_stufe', (select b.stufe from public.pipeline_brands b join public.pipeline_angebote a on a.brand_id = b.id where a.id = t_ang));
  else
    r := r || jsonb_build_object('t2', 'kein offenes Angebot mit Marke');
  end if;

  -- T3: neue Bewerbung, unbekannte Marke, Einstieg studie → Enterprise, Anke
  insert into public.bewerbungen (name, email, marke, produkt, website, einstieg)
  values ('Test Person', 'crm-test@example.invalid', 'CRM Testmarke XYZ', 'Testprodukt', 'https://www.crm-test.invalid/', 'studie')
  returning id, brand_id into t_bw, t_new;
  r := r || jsonb_build_object('t3_brand', t_new is not null,
         't3', (select jsonb_build_object('stufe', stufe, 'segment', segment, 'zugewiesen', zugewiesen, 'website_key', website_key)
                from public.pipeline_brands where id = t_new),
         't3_aufgabe', (select wer from public.crm_aufgaben where brand_id = t_new),
         't3_kontakt_haupt', (select ist_haupt from public.crm_kontakte where brand_id = t_new));

  -- T4: zweite Bewerbung derselben Website → dieselbe Marke, zweiter Kontakt
  insert into public.bewerbungen (name, email, marke, produkt, website)
  values ('Test Zwei', 'crm-test2@example.invalid', 'Anderer Name', 'P2', 'crm-test.invalid')
  returning brand_id into t_bw;
  r := r || jsonb_build_object('t4_gleiche_marke', t_bw = t_new,
         't4_kontakte', (select count(*) from public.crm_kontakte where brand_id = t_new));

  raise exception 'DRYRUN %', r::text;
end $$;

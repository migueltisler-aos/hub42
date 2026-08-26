-- Hub42 Analytics: eigene, cookiefreie Reichweitenmessung
--
-- Ausführen im Supabase SQL Editor
-- supabase.com → dein Projekt → SQL Editor → New query → einfügen + Run
--
-- ─────────────────────────────────────────────────────────────────────────────
-- DATENSCHUTZ-DESIGN (steckt in den Spalten, nicht im Kleingedruckten)
-- ─────────────────────────────────────────────────────────────────────────────
--   * Keine Cookies, kein localStorage, kein sessionStorage. § 25 TDDDG greift
--     bei JEDEM Speichern/Lesen im Endgerät, nicht nur bei Cookies – kein
--     Zugriff heißt kein Consent-Banner und kein Datenverlust durch Ablehnen.
--   * Keine IP-Spalte. Stattdessen visitor_hash =
--     sha256(ip + ua + ANALYTICS_SALT + YYYY-MM-DD), täglich rotierend.
--     Damit ist "unique visitor" bewusst nur innerhalb eines Tages definiert –
--     der Preis dafür, dass kein Langzeitprofil entstehen kann.
--   * session_id wird serverseitig vergeben (gleicher visitor_hash innerhalb
--     von 30 Min), nicht im Browser gespeichert.
--   * referrer_host, nicht die volle Referrer-URL.
--   * Rohdaten-Löschfrist 12 Monate, siehe Block am Dateiende.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- ZUGRIFF
-- ─────────────────────────────────────────────────────────────────────────────
-- Bewusst KEINE anon-Policy auf beiden Tabellen – auch nicht zum Einfügen.
-- Der Browser spricht ausschließlich mit POST /api/track, nie direkt mit
-- Supabase. Eine anon-INSERT-Policy wäre nur eine offene Flanke, über die
-- jemand mit dem öffentlichen Anon-Key die Tabelle per PostgREST zumüllen
-- könnte. Schreiben und Lesen läuft über den Service-Role-Key
-- (lib/supabase-admin.ts), der RLS ohnehin umgeht.

-- ── Rohdaten ────────────────────────────────────────────────────────────────
create table if not exists analytics_events (
  id            bigint generated always as identity primary key,
  ts            timestamptz not null default now(),

  -- pageview | leave | section | interaction | conversion
  event_type    text not null,
  path          text not null,

  -- Herkunft
  referrer_host text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,

  -- Brand-Attribution: link_token stammt aus ?b=… , brand_id ist das serverseitig
  -- aufgelöste Ergebnis. on delete set null, damit gelöschte Brands die
  -- Reichweitenzahlen nicht mitreißen.
  link_token    text,
  brand_id      uuid references pipeline_brands(id) on delete set null,

  -- Besucher/Session (siehe Datenschutz-Design oben)
  visitor_hash  text not null,
  session_id    text not null,

  -- Kontext
  device        text,   -- mobile | tablet | desktop
  country       text,   -- aus x-vercel-ip-country

  -- Messwerte, je nach event_type gesetzt
  duration_ms   int,    -- leave
  scroll_pct    int,    -- section: Position der Sektion im Deck (0–100)
  section       text,   -- section | interaction

  meta          jsonb
);

create index if not exists analytics_events_ts_idx
  on analytics_events (ts desc);
create index if not exists analytics_events_path_ts_idx
  on analytics_events (path, ts desc);
create index if not exists analytics_events_brand_ts_idx
  on analytics_events (brand_id, ts desc) where brand_id is not null;
-- Trägt die Session-Zuordnung: wird bei JEDEM Insert gelesen, um zu entscheiden,
-- ob das Event zu einer laufenden Session gehört.
create index if not exists analytics_events_visitor_ts_idx
  on analytics_events (visitor_hash, ts desc);

alter table analytics_events enable row level security;
-- keine Policy: nur service_role kommt durch

-- ── Outreach-Links ──────────────────────────────────────────────────────────
create table if not exists analytics_links (
  token      text primary key,
  brand_id   uuid not null references pipeline_brands(id) on delete cascade,
  target     text not null default '/deck',
  label      text,
  created_at timestamptz not null default now(),
  created_by text
);

-- Macht getOrCreateBrandLink idempotent: dieselbe Brand + dasselbe Label
-- ergibt immer denselben Token, egal wie oft die Mail neu gebaut wird.
create unique index if not exists analytics_links_brand_label_idx
  on analytics_links (brand_id, coalesce(label, ''));

alter table analytics_links enable row level security;
-- keine Policy: nur service_role kommt durch

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEWS
-- ─────────────────────────────────────────────────────────────────────────────
-- Aggregation gehört in SQL. Sonst zieht das Dashboard irgendwann
-- zehntausende Rows in den Node-Prozess, nur um sie dort zu zählen.
-- security_invoker = true, damit die Views nicht die RLS der Basistabelle
-- umgehen.

-- Tag × Pfad
create or replace view analytics_daily
with (security_invoker = true) as
select
  (ts at time zone 'Europe/Berlin')::date            as tag,
  path,
  count(*) filter (where event_type = 'pageview')     as aufrufe,
  count(distinct visitor_hash)
    filter (where event_type = 'pageview')            as besucher,
  count(distinct session_id)
    filter (where event_type = 'pageview')            as sessions,
  avg(duration_ms) filter (
    where event_type = 'leave' and duration_ms > 0
  )                                                   as avg_dauer_ms,
  -- Anzahl der Messungen, damit die Verweildauer im Dashboard GEWICHTET
  -- gemittelt werden kann. Ein ungewichteter Mittelwert von Pfad-Mittelwerten
  -- laesst einen Pfad mit einem Aufruf so schwer wiegen wie einen mit hundert.
  count(*) filter (
    where event_type = 'leave' and duration_ms > 0
  )                                                   as dauer_messungen
from analytics_events
group by 1, 2;

-- Exakte Tages-Unique-Besucher.
-- Eigene View, weil count(distinct visitor_hash) sich NICHT aus den pfadweisen
-- Zahlen von analytics_daily rekonstruieren laesst: summiert waere es zu hoch
-- (ein Besucher auf drei Seiten zaehlt dreifach), das Maximum zu niedrig (zwei
-- Besucher auf je einer anderen Seite ergaeben 1 statt 2). Diese Zahl wird als
-- Nachfrage-Nachweis zitiert, also muss sie stimmen.
create or replace view analytics_daily_visitors
with (security_invoker = true) as
select
  (ts at time zone 'Europe/Berlin')::date as tag,
  count(distinct visitor_hash)            as besucher,
  count(distinct session_id)              as sessions,
  count(*) filter (where event_type = 'pageview') as aufrufe
from analytics_events
group by 1;

-- Herkunft
create or replace view analytics_sources
with (security_invoker = true) as
select
  (ts at time zone 'Europe/Berlin')::date            as tag,
  coalesce(nullif(referrer_host, ''), 'direkt')      as quelle,
  utm_source,
  utm_medium,
  utm_campaign,
  count(distinct session_id)                          as sessions
from analytics_events
where event_type = 'pageview'
group by 1, 2, 3, 4, 5;

-- Lesetiefe im Deck: wie viele Sessions haben eine Sektion erreicht
create or replace view analytics_deck_depth
with (security_invoker = true) as
select
  section,
  max(scroll_pct)             as position_pct,
  count(distinct session_id)  as sessions
from analytics_events
where event_type = 'section' and section is not null
group by section;

-- Brand-Aktivität: die Tabelle, in die beim Follow-up tatsächlich geschaut wird
create or replace view analytics_brand_engagement
with (security_invoker = true) as
select
  brand_id,
  min(ts)                                             as erste_oeffnung,
  max(ts)                                             as letzte_oeffnung,
  count(distinct session_id)                          as sessions,
  count(*) filter (where event_type = 'pageview')      as aufrufe,
  coalesce(sum(duration_ms) filter (
    where event_type = 'leave' and duration_ms > 0
  ), 0)                                               as lesezeit_ms,
  max(scroll_pct) filter (where event_type = 'section') as tiefste_pct,
  (array_agg(section order by scroll_pct desc nulls last)
    filter (where event_type = 'section'))[1]          as tiefste_sektion
from analytics_events
where brand_id is not null
group by brand_id;

-- Kontext: Gerät und Land pro Tag
create or replace view analytics_context
with (security_invoker = true) as
select
  (ts at time zone 'Europe/Berlin')::date as tag,
  coalesce(device, 'unbekannt')           as device,
  coalesce(country, '??')                 as country,
  count(distinct session_id)              as sessions
from analytics_events
where event_type = 'pageview'
group by 1, 2, 3;

-- Trichter auf Session-Ebene: wer /hersteller oder /deck gesehen hat, wer
-- danach auf /kontakt landete und wer das Formular abgeschickt hat.
-- Session-Datum = Zeitpunkt des ersten Events, damit eine über Mitternacht
-- laufende Session nicht auf zwei Tage aufgeteilt wird.
create or replace view analytics_funnel
with (security_invoker = true) as
with s as (
  select
    session_id,
    min(ts)                                      as start_ts,
    bool_or(path = '/deck')                      as sah_deck,
    bool_or(path = '/hersteller')                as sah_hersteller,
    bool_or(path = '/kontakt')                   as sah_kontakt,
    bool_or(event_type = 'conversion')           as konvertiert
  from analytics_events
  group by session_id
)
select
  (start_ts at time zone 'Europe/Berlin')::date  as tag,
  count(*)                                       as sessions,
  count(*) filter (where sah_deck)               as deck,
  count(*) filter (where sah_hersteller)         as hersteller,
  count(*) filter (where sah_kontakt)            as kontakt,
  count(*) filter (where konvertiert)            as conversions
from s
group by 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- LÖSCHFRIST
-- ─────────────────────────────────────────────────────────────────────────────
-- Die Datenschutzerklärung nennt 12 Monate. Eine Frist, die nur in der
-- Erklärung steht, ist keine – deshalb hier als pg_cron-Job.
-- Falls pg_cron im Projekt nicht aktiv ist, den delete-Befehl stattdessen
-- als Kalendereintrag halbjährlich per Hand ausführen.
create extension if not exists pg_cron;

select cron.schedule(
  'analytics_events_aufraeumen',
  '30 3 1 * *',   -- am 1. jedes Monats, 03:30
  $$delete from analytics_events where ts < now() - interval '12 months'$$
);

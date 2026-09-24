-- Hub42 Analytics, Migration 2: saubere Sessions + sequenzieller Trichter
--
-- Ausführen im Supabase SQL Editor NACH analytics_migration.sql.
-- Idempotent: mehrfaches Ausführen schadet nicht.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- WARUM
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Session-Race: /api/track hat "letzte Session dieses Besuchers suchen" und
--    "Event einfügen" als zwei getrennte Requests gemacht. Beim Laden von /deck
--    kommen Pageview und die ersten Section-Events in derselben Millisekunde –
--    keiner sieht den anderen, jeder würfelt eine eigene session_id. Belegt:
--    der Deck-Besuch vom 06.09.2026 wurde in drei Sessions zerlegt, der Trichter
--    zählte deshalb 4 Deck-Sessions statt 2. Fix: analytics_track() macht
--    beides in EINER Transaktion unter einem Advisory-Lock pro visitor_hash.
--
-- 2. Trichter: die Stufen wurden unabhängig gezählt ("hat Seite X gesehen"),
--    dadurch konnte eine Stufe größer sein als die davor (250 %). Jetzt ist
--    jede Stufe eine echte Teilmenge der vorherigen, zeitlich geordnet.
--
-- 3. Geister-Sessions: ein leave-Beacon nach > 30 Min offenem Tab eröffnete
--    eine neue Session ohne Pageview. Der Trichter zählt nur noch Sessions mit
--    mindestens einem Pageview.

-- ── 1. Atomare Session-Vergabe ──────────────────────────────────────────────
-- security definer + fester search_path, execute nur für service_role: die
-- Funktion ist der einzige Schreibweg und soll nicht per Anon-Key über
-- PostgREST erreichbar sein.
create or replace function analytics_track(
  p_event_type    text,
  p_path          text,
  p_referrer_host text,
  p_utm_source    text,
  p_utm_medium    text,
  p_utm_campaign  text,
  p_link_token    text,
  p_brand_id      uuid,
  p_visitor_hash  text,
  p_device        text,
  p_country       text,
  p_duration_ms   int,
  p_scroll_pct    int,
  p_section       text,
  p_meta          jsonb,
  p_fenster_min   int default 30
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session text;
begin
  -- Serialisiert nur Events DESSELBEN Besuchers; alle anderen laufen parallel.
  -- xact-Lock: wird mit dem Transaktionsende automatisch freigegeben.
  perform pg_advisory_xact_lock(hashtext('analytics:' || p_visitor_hash));

  select session_id into v_session
  from analytics_events
  where visitor_hash = p_visitor_hash
    and ts >= now() - make_interval(mins => p_fenster_min)
  order by ts desc
  limit 1;

  if v_session is null then
    v_session := gen_random_uuid()::text;
  end if;

  insert into analytics_events (
    event_type, path, referrer_host, utm_source, utm_medium, utm_campaign,
    link_token, brand_id, visitor_hash, session_id, device, country,
    duration_ms, scroll_pct, section, meta
  ) values (
    p_event_type, p_path, p_referrer_host, p_utm_source, p_utm_medium, p_utm_campaign,
    p_link_token, p_brand_id, p_visitor_hash, v_session, p_device, p_country,
    p_duration_ms, p_scroll_pct, p_section, p_meta
  );

  return v_session;
end;
$$;

revoke all on function analytics_track(
  text, text, text, text, text, text, text, uuid, text, text, text, int, int, text, jsonb, int
) from public, anon, authenticated;
grant execute on function analytics_track(
  text, text, text, text, text, text, text, uuid, text, text, text, int, int, text, jsonb, int
) to service_role;

-- ── 2. Altdaten reparieren ──────────────────────────────────────────────────
-- a) Durch das Race zerlegte Sessions wieder zusammenführen: Events desselben
--    Besuchers bilden eine Session, solange zwischen zwei Events < 30 Min
--    liegen. Die Session behält die session_id ihres ersten Events.
with geordnet as (
  select
    id, visitor_hash, ts, session_id,
    case
      when lag(ts) over w is null
        or ts - lag(ts) over w > interval '30 minutes'
      then 1 else 0
    end as neu
  from analytics_events
  window w as (partition by visitor_hash order by ts, id)
),
nummeriert as (
  select *, sum(neu) over (partition by visitor_hash order by ts, id) as nr
  from geordnet
),
ziel as (
  select
    id,
    first_value(session_id) over (partition by visitor_hash, nr order by ts, id) as neue_session
  from nummeriert
)
update analytics_events e
set session_id = z.neue_session
from ziel z
where e.id = z.id
  and e.session_id is distinct from z.neue_session;

-- b) Interne Prototyp-Routen (/neue-ui, /neue-offer) waren Team-Traffic und
--    werden ab jetzt nicht mehr gemessen (lib/analytics-types.ts). Die alten
--    Zeilen verzerren sonst weiter die Seiten-Tabelle.
delete from analytics_events where path like '/neue-%';

-- c) Selbstverweise (www.tryhub42.de → tryhub42.de) sind keine Herkunft.
update analytics_events
set referrer_host = null
where referrer_host in ('tryhub42.de', 'www.tryhub42.de');

-- ── 3. Sequenzieller Trichter ───────────────────────────────────────────────
-- Stufen, jede eine Teilmenge der vorherigen:
--   sessions   – Sessions mit mindestens einem Pageview
--   interesse  – hat /, /hersteller oder /deck gesehen (Brand-Interesse;
--                / ist seit dem Umzug der Regalwand die Brand-Startseite)
--   kontakt    – hat NACH dem ersten Interesse-Pageview /kontakt aufgerufen
--                ODER das Bewerbungsformular auf / begonnen
--                (interaction, section = 'bewerbung')
--   conversions– hat danach das Formular abgeschickt
--   anfragen   – ALLE Sessions mit Formular, unabhängig vom Weg (KPI-Kachel)
-- hersteller/deck bleiben als Aufschlüsselung der Interesse-Stufe erhalten
-- (überlappen sich, summieren sich also nicht zwingend zu interesse).
-- drop statt replace: create or replace view kann keine Spalten umbenennen
-- oder umsortieren.
drop view if exists analytics_funnel;
create view analytics_funnel
with (security_invoker = true) as
with s as (
  select
    session_id,
    min(ts) as start_ts,
    bool_or(event_type = 'pageview') as hat_pageview,
    bool_or(event_type = 'conversion') as hat_conversion,
    bool_or(event_type = 'pageview' and path = '/') as sah_start,
    bool_or(event_type = 'pageview' and path = '/hersteller') as sah_hersteller,
    bool_or(event_type = 'pageview' and (path = '/deck' or path like '/deck/%')) as sah_deck,
    min(ts) filter (
      where event_type = 'pageview'
        and (path = '/' or path = '/hersteller' or path = '/deck' or path like '/deck/%')
    ) as interesse_ts,
    max(ts) filter (
      where (event_type = 'pageview' and path = '/kontakt')
         or (event_type = 'interaction' and section = 'bewerbung')
    ) as letzter_kontakt_ts,
    max(ts) filter (where event_type = 'conversion') as letzte_conversion_ts
  from analytics_events
  group by session_id
),
stufen as (
  select
    start_ts,
    hat_conversion,
    sah_start,
    sah_hersteller,
    sah_deck,
    interesse_ts is not null as interesse,
    interesse_ts is not null and letzter_kontakt_ts >= interesse_ts as kontakt,
    interesse_ts is not null
      and letzter_kontakt_ts >= interesse_ts
      and letzte_conversion_ts >= interesse_ts as konvertiert
  from s
  where hat_pageview
)
select
  (start_ts at time zone 'Europe/Berlin')::date as tag,
  count(*)                                      as sessions,
  count(*) filter (where interesse)             as interesse,
  count(*) filter (where sah_start)             as start,
  count(*) filter (where sah_hersteller)        as hersteller,
  count(*) filter (where sah_deck)              as deck,
  count(*) filter (where kontakt)               as kontakt,
  count(*) filter (where konvertiert)           as conversions,
  -- Alle Anfragen, auch ohne vorheriges Brand-Interesse – für die KPI-Kachel.
  count(*) filter (where hat_conversion)        as anfragen
from stufen
group by 1;

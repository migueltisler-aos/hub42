-- Ausführen im Supabase SQL Editor
-- supabase.com → dein Projekt → SQL Editor → New query → einfügen + Run
--
-- Sperrt eine erneute Nachbestellung fuer (ean, standort_id), solange seit
-- der letzten Ausloesung weder Ware eingegangen ist noch 3 Werktage vergangen
-- sind. Verhindert, dass dieselbe Marke mehrfach angeschrieben wird, waehrend
-- eine Nachbestellung noch unterwegs ist. Siehe kassensystem/README.md
-- Abschnitt 12.

create or replace function werktage_zwischen(von timestamptz, bis timestamptz default now()) returns integer as $$
  select count(*)::integer
  from generate_series(von::date + 1, bis::date, interval '1 day') as d
  where extract(dow from d) <> 0;  -- nur Sonntag ist kein Werktag, Samstag zaehlt (Einzelhandel)
$$ language sql immutable;

create or replace function nachbestellung_gesperrt(p_ean text, p_standort_id text) returns boolean as $$
declare
  v_letzte timestamptz;
  v_wareneingang_seither boolean;
begin
  select n.ausgeloest_am into v_letzte
  from wareneingang_nachbestellungen n
  join wareneingang_chargen c on c.id = n.charge_id
  join wareneingang_sendungen s on s.id = c.sendung_id
  where n.ean = p_ean and s.standort_id = p_standort_id
  order by n.ausgeloest_am desc
  limit 1;

  if v_letzte is null then
    return false;
  end if;

  select exists (
    select 1 from wareneingang_chargen c2
    join wareneingang_sendungen s2 on s2.id = c2.sendung_id
    where c2.ean = p_ean and s2.standort_id = p_standort_id
      and s2.eingegangen_am > v_letzte
  ) into v_wareneingang_seither;

  if v_wareneingang_seither then
    return false;
  end if;

  return werktage_zwischen(v_letzte) < 3;
end;
$$ language plpgsql stable;

drop view if exists bestand_reichweite;

create view bestand_reichweite as
with verkauf_14t as (
  select ean, standort_id, sum(menge)::numeric / 14 as verkauf_pro_tag
  from kasse_verkaeufe
  where zeitstempel >= now() - interval '14 days'
  group by ean, standort_id
)
select
  b.ean,
  b.standort_id,
  a.artikel_name,
  a.brand_name,
  b.menge as bestand,
  round(coalesce(v.verkauf_pro_tag, 0), 2) as verkauf_pro_tag,
  round(coalesce(v.verkauf_pro_tag, 0) * 4, 1) as mindestbestand,
  nachbestellung_gesperrt(b.ean, b.standort_id) as nachbestellung_gesperrt,
  (b.menge < (coalesce(v.verkauf_pro_tag, 0) * 4))
    and not nachbestellung_gesperrt(b.ean, b.standort_id) as nachbestellung_empfohlen
from bestand_aktuell b
left join verkauf_14t v on v.ean = b.ean and v.standort_id = b.standort_id
left join kasse_artikelstamm a on a.ean = b.ean and a.standort_id = b.standort_id;

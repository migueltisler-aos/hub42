-- Zusagen aus FeFa_Zusagen (Google Sheet, Stand 2026-10-28) und offene Punkte
-- aus FeFa_Stand (Stand 2026-11-03) ins CRM. Idempotent: ein zweiter Lauf
-- legt nichts doppelt an.

create table if not exists crm_zusagen (
  id                  uuid primary key default gen_random_uuid(),
  brand_id            uuid not null references pipeline_brands(id) on delete cascade,
  produkt             text not null,
  klasse              text,
  regal_cm            integer,
  laufzeit_monate     integer,
  monat_netto         numeric(10, 2),
  vertragswert_netto  numeric(10, 2),
  gebucht_am          date,
  status              text not null default 'gebucht'
                      check (status in ('gebucht', 'live', 'beendet', 'storniert')),
  quelle              text,
  created_at          timestamptz not null default now(),
  unique (brand_id, produkt)
);
create index if not exists crm_zusagen_brand_id_idx on crm_zusagen (brand_id);
alter table crm_zusagen enable row level security;

-- Zeilen aus dem Sheet. `marke` ist der Name in pipeline_brands, wo er vom
-- Sheet abweicht (shootsu = SHOTSU, auteniQ Feinkost = auteniQ).
create temporary table zusage_import (
  marke text, produkt text, klasse text, regal_cm int, laufzeit int, monat numeric, wert numeric, gebucht date
) on commit drop;
insert into zusage_import values
  ('Tekoha',              'Mate Kaffee',        'Drinks',    13,  3,   59.00,  177.00, '2026-10-27'),
  ('Ikani',               'Vanille',            'Food',      13,  3,   59.00,  177.00, '2026-10-27'),
  ('Crazy Bastard Sauce', 'Schafe Saucen',      'Food',      25,  3,  118.00,  354.00, '2026-10-27'),
  ('Lchtnbrg',            'Postkarten Magente', 'Lifestyle', 13,  3,   59.00,  177.00, '2026-10-27'),
  ('Green Naturals',      'Supplements',        'Drogerie', 270,  3, 1252.80, 3758.40, '2026-10-27'),
  ('auteniQ',             'Olivenöl',           'Food',     108,  3,  500.00, 1500.00, '2026-10-27'),
  ('anto',                'Gepäckträger',       'Lifestyle', 13,  3,   59.00,  177.00, '2026-10-27'),
  ('goodmoodfood',        'Schokolade',         'Food',      13,  3,   59.00,  177.00, '2026-10-27'),
  ('SHOTSU',              'Tee Getränk',        'Drinks',    13,  3,   59.00,  177.00, '2026-10-27'),
  ('Benton Und Horris',   'Pies TK',            'Food',      70,  3,  324.80,  974.40, '2026-10-27'),
  ('SNACKL',              'Salami',             'Snacks',    13,  3,   59.00,  177.00, '2026-10-27'),
  ('mon courage',         'Creme',              'Drogerie',  13,  3,   89.00,  267.00, '2026-10-27');

-- Fehlende Marken anlegen (Abgleich ohne Groß/Klein und Randleerzeichen).
insert into pipeline_brands (name, segment, gefunden_via)
select z.marke, 'Startup', 'Zusagenliste'
from zusage_import z
where not exists (select 1 from pipeline_brands b where lower(btrim(b.name)) = lower(z.marke));

insert into crm_zusagen (brand_id, produkt, klasse, regal_cm, laufzeit_monate, monat_netto, vertragswert_netto, gebucht_am, quelle)
select b.id, z.produkt, z.klasse, z.regal_cm, z.laufzeit, z.monat, z.wert, z.gebucht, 'FeFa_Zusagen, Liste von Miguel 2026-10-27'
from zusage_import z
join pipeline_brands b on lower(btrim(b.name)) = lower(z.marke)
on conflict (brand_id, produkt) do nothing;

-- Gebuchte Marken sind Kunden. Der Trigger setzt stufe_seit auf jetzt und
-- protokolliert den Wechsel; danach gilt das Buchungsdatum.
update pipeline_brands b
set stufe = 'Kunde', status = 'Onboarded', segment = coalesce(b.segment, 'Startup')
from crm_zusagen z
where z.brand_id = b.id and b.stufe <> 'Kunde';

update pipeline_brands b
set stufe_seit = z.gebucht_am::timestamptz
from (select brand_id, min(gebucht_am) gebucht_am from crm_zusagen group by brand_id) z
where z.brand_id = b.id and b.stufe = 'Kunde' and b.stufe_seit::date >= z.gebucht_am;

-- Offene Punkte aus FeFa_Stand als allgemeine Aufgaben („Team“ steht bei Miguel).
insert into crm_aufgaben (titel, faellig_am, wer, bereich, created_by)
select t.titel, t.faellig::date, t.wer, t.bereich, 'FeFa_Stand'
from (values
  ('KI-Zugang: erklären, was die Idee mit dem Ordner „06_O-Ton und Stil“ ist', null, 'Miguel', 'Betrieb'),
  ('Leadliste: entscheiden, ob eine lebende Google-Tabelle die Tagesfassungen als .xlsx ersetzt', null, 'Miguel', 'Vertrieb'),
  ('Beeskow-Case darstellen (Maßnahmenkatalog Strategie)', '2026-11-02', 'Miguel', 'Marketing')
) as t(titel, faellig, wer, bereich)
where not exists (select 1 from crm_aufgaben a where a.titel = t.titel and a.created_by = 'FeFa_Stand');

# CRM und Projekte: Grundgerüst

Stand 30.10.2026 · Branch `feat/crm-grundgeruest` · Migrationsentwurf `supabase/crm_migration.sql` (noch nicht ausgeführt)

## Ziel

Eine Marke hat eine Akte, vom ersten Fund bis zur Verlängerung. Vertrieb und Betrieb
lesen dieselben Zeilen: `pipeline_brands` bleibt der Stamm, `wareneingang_*` und
`kasse_*` hängen schon per `brand_id` daran. Neu kommen Kontakte, Zeitleiste,
Aufgaben, Projekte und Meilensteine dazu. Die alte Oberfläche wird ersetzt, nicht poliert.

## Was bleibt, was kommt

| Heute | Problem | Neu |
| --- | --- | --- |
| `pipeline_brands.status`, Freitext, 8 Werte | Keine Pflichtfelder, kein „seit wann“, Verlustgrund fehlt | `stufe` mit Check, `stufe_seit`, `verlust_grund`, `wiedervorlage` |
| `ansprechpartner`, `email` als Felder | Eine Person je Marke | `crm_kontakte`, mehrere je Marke, eine Hauptperson |
| `naechste_aktion` + Datum | Eine Aufgabe je Marke, ohne Erledigt | `crm_aufgaben` mit Fälligkeit, Verantwortlichem, erledigt |
| `pipeline_email_log`, `email_events` getrennt | Keine gemeinsame Historie | `crm_aktivitaeten` + View `crm_zeitleiste` über alle Quellen |
| `pipeline_angebote.deliverables` (jsonb) | Kein Projekt nach dem Ja | `crm_projekte` (1 je angenommenem Angebot) + `crm_meilensteine` |
| `zugewiesen`, Freitext | Kein Routing | `segment` (Startup, Enterprise) → Besitzer per Regel |

## Stufen einer Marke

Outbound-Logik aus dem Skill `revops`, auf das Testkaufhaus übersetzt. Die Spalte
„Alt“ zeigt, wohin der bestehende `status` beim Backfill wandert.

| Stufe | Eintritt | Austritt | Pflicht beim Eintritt | Alt |
| --- | --- | --- | --- | --- |
| **Recherche** | Fit geprüft, Mail verifiziert | erste Mail raus | `segment`, `kategorie_kanonisch` | Neu |
| **In Sequenz** | erste Mail raus | Antwort, Ende der Sequenz, Abmeldung | – | Kontaktiert |
| **Antwort** | menschliche Antwort, egal welcher Kanal | binnen 1 Werktag eingeordnet | – | Antwort |
| **Interesse** | Antwort zeigt Interesse | Termin steht oder 14 Tage Stille | Hauptkontakt | – |
| **Gespräch** | Termin steht oder fand statt | Angebot oder zurück | Termin als Aktivität | Gespräch |
| **Angebot** | Angebot versendet | angenommen, abgelehnt, abgelaufen | verknüpftes Angebot | Angebot |
| **Kunde** | Angebot angenommen | Projekt beendet | Projekt angelegt (automatisch) | Onboarded |
| **Später** | „meldet euch im März“ | Wiedervorlage erreicht → Recherche | `wiedervorlage` | Später |
| **Verloren** | Absage oder Angebot abgelehnt | – | `verlust_grund` | Abgelehnt |
| **Gesperrt** | Abmeldung, Bounce, feindlich | nie | – | (aus `suppression`) |

**Verlustgründe** (fest): Preis · Timing · Kein Bedarf · Eigener Handel reicht · Kapazität/Ware · Keine Antwort · Sonstiges.

**SLAs**, angezeigt in „Heute“:
- Antwort ungeordnet nach 1 Werktag → rot.
- Interesse ohne Terminvorschlag am selben Tag → rot.
- Angebot ohne Aktivität seit 14 Tagen → „stockt“.
- Jede Stufe außer Kunde, Später, Verloren, Gesperrt ohne offene Aufgabe → „hängt“.

**Segmente und Routing** (Trigger `crm_routing`, greift nur ohne Besitzer):

| Segment | Wer | Was | Besitzer |
| --- | --- | --- | --- |
| Startup | D2C-Marken | Regalplatz im Testkaufhaus | Ralf |
| Enterprise | größere Hersteller | Marktforschung mit BIFI (Feedback Factory) | Anke (BIFI), im selben Tool |
| Partner | Immobilieneigentümer, Institutionen | Store-Konzept und Betrieb | Miguel |
| ohne | – | – | Miguel |

Miguel und Oliver sind Founder: Sie sehen alles und bekommen keine eigene Zuteilung über das Routing.
Was Oliver betreut, setzt die Hand.

**Outreach schiebt die Stufe** (Trigger `crm_stufe_aus_outreach` auf `outreach_status`):
gesendet → In Sequenz, Antwort im Gmail-Webhook → Antwort, Bounce → Gesperrt.
Einordnen (Interesse oder Verloren) bleibt Handarbeit.

## Projekt nach dem Ja

Ein angenommenes Angebot legt per Trigger ein Projekt mit Standard-Meilensteinen an.
Fälligkeit rechnet ab `pipeline_angebote.start_datum` und `laufzeit_monate`.

| # | Meilenstein | Fällig | Auto-Haken (Phase 2) |
| --- | --- | --- | --- |
| 1 | Vertrag unterschrieben | Start − 14 T | – |
| 2 | Artikelstamm und Etiketten angelegt | Start − 7 T | Zeile in `kasse_artikelstamm` |
| 3 | Ware eingegangen | Start − 2 T | Zeile in `wareneingang_sendungen` |
| 4 | Regal live | Start | – |
| 5 | Erster Verkauf | Start + 7 T | Zeile in `kasse_verkaeufe` |
| 6 | Feedback-Panel aktiv | Start + 7 T | – |
| 7 | Zwischenbericht | Mitte der Laufzeit | – |
| 8 | Verlängerungsgespräch | Ende − 21 T | – |
| 9 | Abschlussbericht | Ende | – |

Projektstatus: Vorbereitung → Live → Auswertung → Abgeschlossen (oder Abgebrochen).

## Screens (nächster Schritt, `ux-ui-designer` mit `interface-design` + `shadcn`)

1. **Pipeline-Board:** Kanban über die Stufen, Karten mit Marke, Segment, Tage in Stufe und fälliger Aufgabe; Filter Besitzer, Segment, Kategorie; Ziehen fragt Pflichtfelder ab.
2. **Brand-Akte:** Kopf mit Stufe und Besitzer, links Stammdaten und Kontakte, Mitte die Zeitleiste (Mails, Notizen, Stufenwechsel, Wareneingang, Verkäufe), rechts Aufgaben und Angebote.
3. **Heute:** fällige und überfällige Aufgaben je Person plus SLA-Verstöße, das ist der Startscreen.
4. **Projekte:** Liste der laufenden Platzierungen mit Meilenstein-Fortschritt und Ampel.

Dazu ⌘K für Suche und Schnellaktionen (Notiz, Aufgabe, Stufe).

## Reihenfolge

1. Plan abnehmen (dieses Dokument, offene Fragen unten).
2. Migration auf einem Supabase-Branch oder lokal testen, dann auf Produktion.
3. shadcn ins Projekt holen, Design-Tokens setzen.
4. Screens entwerfen (Mockups), abnehmen, bauen: Heute → Akte → Board → Projekte.
5. Alte Pipeline-Ansicht abschalten, `status` erst danach entfernen.

## Offene Fragen

- Segment Partner: eigene Projekt-Vorlage (Konzept, Fläche, Ausbau, Eröffnung, Betrieb) statt der Regal-Meilensteine.
- Gehören Bewerbungen (`bewerbungen`) als Einstieg in die Stufe „Antwort“ oder „Interesse“?
- Der Webhook erkennt Antworten nur vom Absender `pipeline_brands.email`. Antwortet jemand anderes aus der Marke, fehlt der Treffer; später gegen `crm_kontakte` abgleichen.
- `outreach_status` und `email_events` haben keine Migrationsdatei im Repo: vor dem Run Spalten in der DB prüfen.

Entschieden 30.10.2026: Anke (BIFI) arbeitet im selben Tool, Gmail-Antworten setzen die Stufe automatisch.

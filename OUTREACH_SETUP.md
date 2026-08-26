# Cold-Outreach-Engine "Feedback Factory" — Setup

Kaltakquise-Sequenz (Erstmail + 3 Follow-ups) über die Gmail-API. Bewusst
**kein Cron/Inngest** — der Versand wird manuell per lokalem Skript
ausgelöst (`pnpm send-batch`), das die fälligen Mails mit Zufallspausen
verschickt. Baut auf der bestehenden `pipeline_brands`-Tabelle auf (keine
separate Lead-Tabelle) — Details siehe Code-Kommentare in
`supabase/outreach_migration.sql`.

## Architektur-Entscheidungen (Kontext für spätere Änderungen)

- **Kein separates `leads`-Schema.** `pipeline_brands` wurde um
  `perso_satz`, `prio`, `ko_flag`, `outreach_status`, `thread_id`,
  `gmail_message_id`, `last_step`, `next_action_at` erweitert. `status`
  bleibt die manuelle CRM-Phase (Neu/Kontaktiert/…), `outreach_status` der
  technische Zustand der Sequenz. Bei Erstversand wird `status` nur auf
  `Kontaktiert` gehoben, wenn er noch `Neu` ist; bei Reply auf `Antwort` —
  damit ein bereits manuell bearbeiteter Brand nicht zusätzlich
  angeschrieben wird.
- **`ko_flag` wird abgeleitet, `prio` bleibt manuell.** Seit der Scope-/
  Haltungs-Erfassung (`supabase/pipeline_scope_haltung_migration.sql`) setzt
  `upsertBrand` das `ko_flag` bei jedem Write aus der Hub42-Fit-Bewertung
  (`deriveKoFlag` in `lib/pipeline.ts`): `hub42_fit='Eher nicht'` → gesperrt.
  Der Fit kann damit nur **sperren**, nie freigeben — `prio` kommt weiterhin
  ausschließlich aus der Lead-xlsx. Sonst hätte ein automatisch als „Top"
  bewerteter Datensatz sich selbst die Versandfreigabe erteilt, und zwei
  Mechanismen würden auf derselben Spalte schreiben (`import:leads`
  überschreibt `prio` mit dem xlsx-Wert).
- **`hub42_fit='Unbewertet'`** heißt: Größe oder Haltungs-Satz fehlen noch.
  Solche Marken sind nicht gesperrt, aber sie bekommen auch keine `prio` —
  ohne manuelle Priorisierung wird nichts versandt.
- **Sender-Postfach ist bewusst NICHT eines der 3 bestehenden
  UD-SMTP-Postfächer** (Miguel/Ralf/Oliver, siehe `lib/mail.ts`) — ein
  dediziertes 4. Postfach isoliert das Spam-Risiko der Sequenz von den
  persönlichen Postfächern der Gründer.
- **Gmail-API statt UD-SMTP für dieses 4. Postfach**, weil Google die
  Authentifizierung (SPF/DKIM) selbst und lückenlos übernimmt — kein
  Reputationsrisiko durch ein geteiltes, fremdes SMTP-Relay. Dafür reicht ein
  ganz normaler **kostenloser Gmail-Account** (`@gmail.com`/`@googlemail.com`),
  kein bezahltes Google Workspace nötig. Konkret gewählt:
  `tryhub42@gmail.com`, Anzeigename `Oliver` (siehe ENV-Tabelle) — die
  Adresse ist markenerkennbar, der Anzeigename hält trotzdem den
  persönlichen Founder-Ton, den Empfänger im Postfach sehen
  ("Oliver · Hub42 &lt;tryhub42@gmail.com&gt;").
- **Kein Cron/Inngest.** Alle Sicherheitsregeln (Sendefenster, Tages-Cap,
  Zufallsintervall, Idempotenz) stecken direkt in `lib/outreach/*` und
  greifen unabhängig davon, WER den Versand auslöst. Der Auslöser ist
  bewusst ein lokales Skript (`scripts/send-batch.ts`), das du selbst an
  einem Sende-Tag startest — kein Google-Cloud-Pub/Sub-Aufwand, kein
  Drittanbieter-Account nötig, um überhaupt loszulegen.
- **Personalisierungs-Satz wird per Claude Haiku generiert** (aus Website/
  Instagram/Kategorie/Produkt/Notizen, die schon in `pipeline_brands`
  stehen), wenn die xlsx-Spalte leer ist — kein Copy-Paste aus einem
  separaten Chat-Fenster.

## ENV-Variablen

In Vercel unter **Project Settings → Environment Variables** setzen
(Production + Preview) UND lokal in `.env.local` (für die Skripte, die du
selbst ausführst — `send-batch`, `import:leads`, `gmail:watch`):

| Variable | Zweck |
|---|---|
| `GMAIL_OAUTH_CLIENT_ID` | OAuth2-Client-ID aus Google Cloud Console |
| `GMAIL_OAUTH_CLIENT_SECRET` | OAuth2-Client-Secret |
| `GMAIL_OAUTH_REFRESH_TOKEN` | Refresh-Token des Sende-Postfachs (einmalig per OAuth-Flow erzeugen, s. u.) |
| `SENDER_EMAIL` | Absender-Adresse, z. B. `tryhub42@gmail.com` |
| `SENDER_DISPLAY_NAME` | Anzeigename im From-Header (optional, z. B. `Oliver`) |
| `LIST_UNSUBSCRIBE_MAILTO` | Adresse für `List-Unsubscribe`-Header (optional, Default = `SENDER_EMAIL`) |
| `DAILY_CAP` | Tages-Sende-Limit, s. Warm-up-Rampe unten |
| `DRY_RUN` | `true` = nur loggen, nicht senden |
| `ANTHROPIC_API_KEY` | Für die automatische Personalisierungs-Satz-Generierung beim Import (API-Key aus der [Anthropic Console](https://console.anthropic.com/)) |
| `PUBSUB_VERIFICATION_TOKEN` | Nur relevant, falls ihr die optionale Reply-/Bounce-Automatik (Abschnitt 2) später nachrüstet |

Bereits vorhanden und weiterverwendet: `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `PIPELINE_PASSWORD` (schützt auch
`/admin/outreach`).

## 1. Gmail-Postfach + OAuth2 (kostenlos, kein Workspace nötig)

1. Neuen, komplett frischen **kostenlosen Gmail-Account** anlegen:
   `tryhub42@gmail.com`.
2. **2–3 Wochen manuelles Warm-up**, bevor der erste Batch läuft: normal
   darüber mailen/empfangen, in ein paar echte Threads einbinden — eine
   frisch angelegte Adresse ohne Reputation ist selbst mit der konservativen
   Rampe (s. u.) ein Spam-Risiko.
3. In der [Google Cloud Console](https://console.cloud.google.com/) ein
   Projekt anlegen, **Gmail API** aktivieren.
4. Unter "Google Auth Platform" → **Zielgruppe**: Nutzertyp Extern,
   Veröffentlichungsstatus **Testing**, Testnutzer = `tryhub42@gmail.com`
   selbst.
5. Unter **Clients**: OAuth-Client vom Typ **"Webanwendung"** anlegen (nicht
   Desktop-App — der [OAuth Playground](https://developers.google.com/oauthplayground)
   braucht das), autorisierte Weiterleitungs-URI:
   `https://developers.google.com/oauthplayground` →
   `GMAIL_OAUTH_CLIENT_ID` / `GMAIL_OAUTH_CLIENT_SECRET`.
6. Im OAuth Playground (Zahnrad-Icon → eigene Credentials eintragen) einmalig
   mit Scope `https://www.googleapis.com/auth/gmail.modify` autorisieren
   (eingeloggt als `tryhub42@gmail.com`) und das **Refresh-Token**
   entgegennehmen → `GMAIL_OAUTH_REFRESH_TOKEN`.

   ⚠️ Falls eine ENV-Variable in Vercel als **„Sensitive"** markiert ist,
   lässt sich ihr Wert nie wieder auslesen (auch nicht per
   `vercel env pull`) — bei Verlust einfach über Google Cloud Console
   („Add secret") + OAuth Playground neu erzeugen, das schadet nichts.
7. **Google Postmaster Tools** (postmaster.google.com) für die Adresse
   einrichten (kostenlos) — zeigt Spam-Rate/Reputation direkt aus
   Google-Sicht. Vor dem Hochfahren der Rampe zusätzlich eine Test-Mail auf
   [mail-tester.com](https://www.mail-tester.com) gegenchecken.

## 2. Reply-/Bounce-Automatik (optional, aktuell nicht eingerichtet)

Der Code dafür liegt fertig unter `app/api/gmail/webhook/route.ts` und
`scripts/gmail-watch.ts`, ist aber **nicht aktiviert** — bewusst
zurückgestellt, weil das Google-Cloud-Pub/Sub-Setup (Topic + Berechtigung +
Subscription) der komplizierteste Teil der ganzen Einrichtung ist und für
den Start nicht nötig ist.

**Solange das nicht eingerichtet ist: Antworten selbst im Blick behalten.**
Schaut regelmäßig ins Postfach `tryhub42@gmail.com` — bei 15–70 Mails/Tag
gut von Hand überschaubar. Antwortet jemand, im bestehenden `/pipeline`
händisch den Status auf "Antwort" setzen, damit `send-batch` die Marke
nicht weiter anschreibt (`outreach_status` bleibt sonst auf `contacted`).

Falls ihr das später nachrüsten wollt: Anleitung war Pub/Sub-Topic
`gmail-outreach-notify` anlegen → `gmail-api-push@system.gserviceaccount.com`
als Publisher berechtigen → Push-Subscription auf
`https://tryhub42.de/api/gmail/webhook?token=<PUBSUB_VERIFICATION_TOKEN>` →
`pnpm gmail:watch projects/<PROJECT_ID>/topics/gmail-outreach-notify`
(danach alle ~7 Tage erneuern, Watches laufen ab).

## 3. Versand auslösen (manuell, kein Cron)

```bash
pnpm send-batch          # läuft bis Tages-Cap erreicht oder keine Leads mehr fällig
pnpm send-batch 10       # oder: maximal 10 Mails in diesem Lauf
```

- Muss laufen, solange der Batch dauert — Terminal offen lassen (kann bei
  vielen Mails mit 6–18-Minuten-Pausen mehrere Stunden dauern). Abbruch mit
  Strg+C ist jederzeit sicher — nichts geht verloren, beim nächsten Start
  macht das Skript einfach beim nächsten fälligen Lead weiter.
- Prüft bei jedem Schritt: Sendefenster (Di–Do, 9–11 & 13–16 Uhr
  Europe/Berlin), Tages-Cap, Zufallsintervall — sendet außerhalb davon
  nichts.
- An einem Sende-Tag also einfach `pnpm send-batch` starten und laufen
  lassen (oder mit einer Zahl begrenzen, wenn ihr nur einen kleinen Stoß
  raushauen wollt).

## 4. Warm-up-Rampe (manuell, kein Automatismus im Code)

`DAILY_CAP` wird wöchentlich von Hand in Vercel **und** lokal in
`.env.local` erhöht:

| Woche | DAILY_CAP |
|---|---|
| 1 | 15 |
| 2 | 30 |
| 3 | 45 |
| ab 4 | 70 |

Bewusst keine Datums-Automatik — die Rampe soll jederzeit pausierbar/
korrigierbar sein (z. B. bei steigender Bounce-Rate in `/admin/outreach`).

## 5. Neue Leads aus einer Verzeichnis-Website scrapen (optional, vor dem Import)

```bash
pnpm scrape:swyytr                     # Default: swyytr.com Food-Startup-Datenbank, alle Treffer
pnpm scrape:swyytr --limit=20          # nur die ersten 20, zum Testen
pnpm scrape:swyytr --dry-run           # nur loggen, nichts in Supabase schreiben
pnpm scrape:swyytr <listing-url> --limit=20 --dry-run   # andere Verzeichnis-URL im gleichen Markup
```

Lädt eine öffentliche Verzeichnis-Seite (Karten-/Listenansicht mit Profil-Links,
Default swyytr.com), folgt jedem Profil-Link, liest Name/Kurzbeschreibung/externe
Website aus und sucht auf der markeneigenen Website nach einer Kontakt-E-Mail
(Startseite, dann `/kontakt`, `/contact`, `/impressum`, `/imprint`, `/about`,
`/ueber-uns`). Findet die Marke keinen `mailto:`-Link (z. B. nur Kontaktformular),
bleibt die E-Mail leer — das Script rät nichts.

Legt jede neue Marke direkt in `pipeline_brands` an (Name, Website, Beschreibung
als `produkt`/`notizen`, E-Mail falls gefunden, Personalisierungs-Satz per Claude
Haiku falls `ANTHROPIC_API_KEY` gesetzt ist) — bereits vorhandene Marken (per
normalisiertem Namen) werden übersprungen, keine Duplikate.

**Setzt absichtlich NIE `outreach_status` oder `Prio`.** Jede gescrapte Marke landet
als normale `"Neu"`-Zeile im `/pipeline` — sie kommt erst infrage für `import:leads`
bzw. den Versand, nachdem jemand sie manuell gesichtet und priorisiert hat. Kein
ungeprüfter Scraping-Treffer wird automatisch zum Cold-Mail-Versand freigegeben.

Heuristische Extraktion (kein offizielles API) — beruht auf dem aktuell
beobachteten Webflow-Markup von swyytr.com; ändert sich das Seitenlayout
grundlegend, muss das Script nachgezogen werden. Sequenziell mit 400ms Pause
zwischen Requests und identifizierendem User-Agent, kein Browser-Spoofing.

## 6. Lead-Import

Texte in `lib/templates.ts` sind Platzhalter (`TODO_TEXT_STEP_n`) — vor dem
ersten echten Versand durch die finalen Formulierungen ersetzen.

```bash
pnpm import:leads pfad/zur/leadliste.xlsx
```

Erwartete Spalten: `Marke`, `E-Mail`, `Ansprechpartner`,
`Personalisierungs-Satz` (optional — wird sonst automatisch generiert),
`Prio` (`hoch`/`mittel`/`pruefen`/`niedrig`). Das Skript validiert
Syntax + MX-Record, matcht bestehende Marken per E-Mail dann per Name (um
`pipeline_brands`-IDs nicht zu verdoppeln), generiert bei Bedarf per Claude
Haiku einen Personalisierungs-Satz aus den vorhandenen Marken-Daten und
setzt nur gültige, nicht gesperrte, `hoch`/`mittel`-priorisierte Zeilen ohne
`ko_flag` und mit Personalisierungs-Satz auf `outreach_status='queued'`. Am
Ende gibt es einen Report, was übersprungen wurde und warum.

## 7. Beobachtung & Abnahme

- `/admin/outreach` (geschützt über `PIPELINE_PASSWORD`, gleicher Login wie
  `/pipeline`): heute gesendet vs. Cap, Bounce-/Reply-Rate, Leads je
  Outreach-Status.
- `DRY_RUN=true` loggt jeden geplanten Versand inkl. gerendertem Text statt
  zu senden — zum Testen der Auswahl-/Cap-/Fenster-Logik ohne echte Mails.
- Idempotenz: pro (Brand, Schritt) kann `email_events` nur ein
  `type='sent'`-Event enthalten (unique Index `email_events_sent_step_uidx`
  + App-Guard) — ein abgebrochener und neu gestarteter `send-batch`-Lauf
  sendet nicht doppelt.

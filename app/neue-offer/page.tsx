/* eslint-disable @next/next/no-img-element --
   Der Held ist wie auf /neue-ui ein Vollbild mit fester object-position;
   next/image legt dafür Wrapper und Größen fest, die die Bildführung brechen. */

import { eur } from "@/lib/neue-ui/regal";
import {
  ABLAUF,
  ANKER,
  GARANTIE,
  KOHORTE,
  LAUFZEIT_TAGE,
  MIETE_MONAT,
  NICHT_FUER,
  OFFEN,
  PAKETPREIS,
  PROVISION_PCT,
  SLOT_CM,
  STACK,
  STACK_GESAMTWERT,
} from "@/lib/regalbeweis";

/* Ganze Euro – für Paketpreis und Stackwerte. Der zweistellige eur() aus
   der Regalwand bleibt für Tarifwerte wie die Monatsmiete. */
const eur0 = (n: number): string =>
  n.toLocaleString("de-DE", { maximumFractionDigits: 0 }) + " €";

const MAILTO =
  "mailto:info@tryhub42.de?subject=Regalbeweis%2090%20%E2%80%93%20Gr%C3%BCndungskohorte";
const WHATSAPP =
  "https://wa.me/4917787956437?text=Hallo%20Miguel%2C%20ich%20interessiere%20mich%20f%C3%BCr%20den%20Regalbeweis%2090.";

const FAKTEN = [
  { v: `${LAUFZEIT_TAGE} Tage`, k: "Laufzeit, keine Verlängerung" },
  { v: `${SLOT_CM} cm`, k: "Front auf Augenhöhe" },
  { v: `${KOHORTE.plaetze}`, k: `Plätze in Kohorte ${KOHORTE.nummer}` },
  { v: eur0(PAKETPREIS), k: `statt ${eur0(STACK_GESAMTWERT)} einzeln` },
];

export default function RegalbeweisPage() {
  return (
    <>
      <header className="top">
        <div className="top__in">
          <a className="mark" href="#top">
            HUB42
          </a>
          <nav className="top__nav" aria-label="Seitenbereiche">
            <a href="#leistungen">Leistungen</a>
            <a href="#garantie">Garantie</a>
            <a href="#ablauf">Ablauf</a>
          </nav>
          <a className="btn btn--solid" href="#anfragen">
            Platz anfragen
          </a>
        </div>
      </header>

      <main id="top">
        {/* ══ Held ══════════════════════════════════════════════ */}
        <section className="hero">
          <img
            className="hero__img"
            src="/konzept/store.png"
            alt="Blick in den Hub42-Store im Alexa Berlin: Sichtbeton, schwarze Stahlregale, helle Holzflächen, zwei freistehende Gondeln mit Markenkarten, links eine Verkostungstheke am Schaufenster, rechts die Kasse."
          />
          <div className="hero__scrim" />
          <div className="hero__say">
            <div className="wrap">
              <p className="hero__badge">
                Kohorte {KOHORTE.nummer} · {KOHORTE.name} · Start {KOHORTE.start}
              </p>
              <h1>Jeder Einkäufer stellt dieselbe Frage. Und du kannst sie nicht beantworten.</h1>
              <p className="hero__sub">
                Gute Marke, treue Online-Kunden, keine einzige Zahl aus einem echten Regal. Ohne
                die kommst du nicht rein — und ohne reinzukommen, bekommst du sie nie. Diesen
                Knoten schneiden wir in {LAUFZEIT_TAGE} Tagen auf.
              </p>
              <div className="hero__cta">
                <a className="btn btn--lit" href="#anfragen">
                  Platz in der Kohorte anfragen
                </a>
                <a className="btn btn--dark" href="#leistungen">
                  Was drin ist
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="factbar">
          {FAKTEN.map((f) => (
            <div className="fact" key={f.k}>
              <p className="fact__v">{f.v}</p>
              <p className="fact__k">{f.k}</p>
            </div>
          ))}
        </div>

        {/* ══ Das Problem ═══════════════════════════════════════ */}
        <section className="sect sect--tight">
          <div className="wrap">
            <p className="eyebrow">Der Satz, an dem es scheitert</p>
            <h2>Es liegt nicht am Produkt.</h2>
            <p className="lede" style={{ marginTop: 20 }}>
              Der Category Manager hat nichts gegen deine Marke. Er hat ein Regal, in dem jeder
              Zentimeter schon jemandem gehört, und genau eine Frage, mit der er entscheidet.
            </p>

            <blockquote className="quote">
              <p className="quote__q">Und? Wie dreht das Produkt?</p>
              <p className="quote__w">Die Frage, die jede Listung entscheidet</p>
            </blockquote>

            <p className="fineprint">
              Rotation pro Woche und pro Meter Regal. Ohne diese Zahl bist du eine Geschichte, und
              Geschichten werden vertagt.
            </p>
          </div>
        </section>

        {/* ══ Wertanker ═════════════════════════════════════════ */}
        <section className="sect sect--rule sect--deep">
          <div className="wrap">
            <p className="eyebrow">Die Alternativen</p>
            <h2>Vier Wege zu dieser Zahl. Drei kosten ein Vermögen.</h2>

            <div className="tbl-scroll">
              <table className="rate">
                <thead>
                  <tr>
                    <th scope="col">Weg</th>
                    <th scope="col">Was er kostet</th>
                    <th scope="col">Was daran hakt</th>
                  </tr>
                </thead>
                <tbody>
                  {ANKER.map((a) => (
                    <tr key={a.weg}>
                      <th scope="row">{a.weg}</th>
                      <td>{a.kosten}</td>
                      <td style={{ textAlign: "left", maxWidth: "40ch", whiteSpace: "normal" }}>
                        {a.haken}
                      </td>
                    </tr>
                  ))}
                  <tr data-pick="1">
                    <th scope="row">
                      Regalbeweis {LAUFZEIT_TAGE}
                      <span className="tag">dieser Weg</span>
                      <span>Echtes Regal, echte Käufer, echtes Geld an der Kasse</span>
                    </th>
                    <td>{eur0(PAKETPREIS)}</td>
                    <td style={{ textAlign: "left", maxWidth: "40ch", whiteSpace: "normal" }}>
                      Der Store eröffnet erst {KOHORTE.start}. Kohorte {KOHORTE.nummer} geht das
                      Risiko mit.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ══ Leistungsverzeichnis ══════════════════════════════ */}
        <section className="sect sect--rule" id="leistungen">
          <div className="wrap">
            <p className="eyebrow">Leistungsverzeichnis · {STACK.length} Positionen</p>
            <h2>Jede Position löst einen Satz, den du selbst schon gesagt hast.</h2>
            <p className="lede" style={{ marginTop: 20, maxWidth: "52ch" }}>
              Sechs davon kosten uns fast nichts, weil wir den Laden ohnehin betreiben. Für dich
              sind genau die der Unterschied zwischen einer Rechnung und einem Projekt.
            </p>

            <div className="tbl-scroll">
              <table className="rate">
                <thead>
                  <tr>
                    <th scope="col">Position</th>
                    <th scope="col">Einzeln beauftragt</th>
                  </tr>
                </thead>
                <tbody>
                  {STACK.map((pos) => (
                    <tr key={pos.nr} {...(pos.nr === "07" ? { "data-pick": "1" } : {})}>
                      <th scope="row">
                        {pos.titel}
                        {pos.nr === "07" && <span className="tag">der Kern</span>}
                        <span>„{pos.einwand}“ — {pos.beschreibung}</span>
                      </th>
                      <td>{eur0(pos.wert)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Preisblock ── */}
            <div className="card offer">
              <div className="card__prem">
                <span>
                  Gründungskonditionen · Kohorte {KOHORTE.nummer}
                </span>
              </div>
              <div className="card__in">
                <p className="card__name">Regalbeweis {LAUFZEIT_TAGE}</p>

                <div className="price">
                  <span className="price__was">{eur0(STACK_GESAMTWERT)}</span>
                  <span className="price__is">{eur0(PAKETPREIS)}</span>
                  <span className="price__per">für {LAUFZEIT_TAGE} Tage</span>
                </div>

                <div className="rows">
                  <div className="row">
                    <span className="row__k">Alle {STACK.length} Positionen</span>
                    <span className="row__v">enthalten</span>
                  </div>
                  <div className="row">
                    <span className="row__k">Vermittlungsprovision</span>
                    <span className="row__v">{PROVISION_PCT} % je verkauftem Artikel</span>
                  </div>
                  <div className="row">
                    <span className="row__k">Warenrisiko</span>
                    <span className="row__v">Konsignation, bleibt deins</span>
                  </div>
                  <div className="row row--sum">
                    <span className="row__k">Vorteil gegenüber Einzelbuchung</span>
                    <span className="row__v">{eur0(STACK_GESAMTWERT - PAKETPREIS)}</span>
                  </div>
                </div>

                <div className="specs">
                  <div>
                    <p className="spec__k">Regalfront</p>
                    <p className="spec__v">{SLOT_CM} cm</p>
                  </div>
                  <div>
                    <p className="spec__k">Zone</p>
                    <p className="spec__v">Augenhöhe</p>
                  </div>
                  <div>
                    <p className="spec__k">Laufzeit</p>
                    <p className="spec__v">{LAUFZEIT_TAGE} Tage</p>
                  </div>
                  <div>
                    <p className="spec__k">Preis-Lock</p>
                    <p className="spec__v">12 Monate</p>
                  </div>
                </div>

                <p className="card__note">
                  Die {PROVISION_PCT} % fallen nur auf tatsächlich verkaufte Artikel an,
                  Zahlungsabwicklung inklusive. Der LEH nimmt dafür 30–50 % Handelsmarge und setzt
                  zusätzlich deinen Endpreis fest. Deine UVP bleibt hier deine.
                </p>

                <div className="card__foot">
                  <a className="btn btn--solid" href="#anfragen">
                    Platz anfragen
                  </a>
                  <span className="card__hint">
                    Reine Fläche ohne Leistungen ab {eur(MIETE_MONAT)} / Monat
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ Garantie ══════════════════════════════════════════ */}
        <section className="sect dark" id="garantie">
          <div className="wrap">
            <p className="eyebrow">Risikoumkehr</p>
            <h2>{GARANTIE.name}</h2>

            <div className="guar">
              <p className="guar__lead">{GARANTIE.kern}</p>
              <p className="guar__body">{GARANTIE.zusatz}</p>
            </div>

            <p className="bar__cap" style={{ textAlign: "left", marginTop: 28, maxWidth: "60ch" }}>
              Die Garantie zahlt in Regalzeit, nicht in Rückerstattung — ein zweiter Anlauf auf
              besserer Höhe nützt dir mehr als dein Geld zurück.
            </p>
          </div>
        </section>

        {/* ══ Ablauf ════════════════════════════════════════════ */}
        <section className="sect sect--rule" id="ablauf">
          <div className="wrap">
            <p className="eyebrow">Ablauf · {ABLAUF.length} Etappen</p>
            <h2>Von der Anfrage bis zum Dossier.</h2>

            <ol className="steps">
              {ABLAUF.map((e) => (
                <li className="step" key={e.marke}>
                  <p className="step__n">{e.marke}</p>
                  <div>
                    <p className="step__t">{e.titel}</p>
                    <p className="step__d">{e.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ══ Ausschluss ════════════════════════════════════════ */}
        <section className="sect sect--rule sect--deep">
          <div className="wrap">
            <p className="eyebrow">Ehrlichkeit vorab</p>
            <h2>Für wen das nicht gemacht ist.</h2>

            <ul className="nots">
              {NICHT_FUER.map((z) => (
                <li className="not" key={z}>
                  {z}
                </li>
              ))}
            </ul>

            <p className="fineprint">
              Wir nehmen {KOHORTE.plaetze} Marken in die {KOHORTE.name}. Nicht aus
              Verknappungstaktik, sondern weil mehr nicht ins Regal passt und wir jede davon
              persönlich betreuen.
            </p>
          </div>
        </section>

        {/* ══ Offene Punkte ═════════════════════════════════════ */}
        <section className="sect sect--rule">
          <div className="wrap">
            <p className="eyebrow">Bevor du buchst</p>
            <h2>Die Fragen, bei denen andere ausweichen.</h2>

            <div className="qa">
              {OFFEN.map((o) => (
                <details key={o.frage}>
                  <summary>{o.frage}</summary>
                  <p>{o.antwort}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ══ Abschluss ═════════════════════════════════════════ */}
        <section className="sect dark close" id="anfragen">
          <div className="wrap">
            <div className="close__in close__in--wide">
              <p className="eyebrow">Bewerbung · Kohorte {KOHORTE.nummer}</p>
              <h2>{KOHORTE.plaetze} Plätze. Start {KOHORTE.start}.</h2>
              <p className="lede">
                Schreib uns, was du verkaufst und in welchem Regal du eigentlich stehen willst.
                Rückmeldung in 24 Stunden — und wir sagen auch ehrlich, wenn es nicht passt.
              </p>
              <div className="btn-row">
                <a className="btn btn--lit" href={MAILTO}>
                  Per E-Mail bewerben
                </a>
                <a className="btn btn--dark" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                  Per WhatsApp
                </a>
              </div>
              <p className="reach">
                <span>Miguel Tisler · Gründer</span>
                <a href="tel:+4917787956437">0177 879 56 37</a>
                <a href="mailto:info@tryhub42.de">info@tryhub42.de</a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <strong>
            Angebotsstand {KOHORTE.name}, Start {KOHORTE.start}. Preise zzgl. USt.
          </strong>
          <br />
          Aus dem Preismodell abgeleitet: Grundpreis 7,00 €/cm, Augenhöhe +10 %, Mindestmiete 89 €,
          Mindestbreite 5 cm, {PROVISION_PCT} % Vermittlungsprovision auf den Bruttoverkaufspreis
          inkl. Zahlungsabwicklung, Gründungskonditionen bis 60 % Store-Auslastung.
          <br />
          Die Einzelwerte im Leistungsverzeichnis sind kalkulierte Vergleichspreise für eine
          separate Beauftragung, keine bereits am Markt abgerechneten Beträge. Der Store eröffnet{" "}
          {KOHORTE.start}; Abverkaufsdaten aus dem Hub42 liegen noch nicht vor.
          <br />
          Die Ladenansicht ist ein KI-generiertes Konzeptbild aus dem Hub42-Pitchmaterial mit
          Generator-Wasserzeichen — kein Foto des fertigen Ladens.
        </div>
      </footer>
    </>
  );
}

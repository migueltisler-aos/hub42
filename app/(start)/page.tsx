/* eslint-disable @next/next/no-img-element --
   Hero, Herkunft und Theke sind Vollbild-Kunstwerke mit fester
   object-position bzw. mix-blend-mode; next/image legt dafür Wrapper und
   Größen fest, die die Bildführung brechen. */

import Link from "next/link";
import Anteil from "@/components/neue-ui/Anteil";
import Bewerbung from "@/components/neue-ui/Bewerbung";
import Massband from "@/components/neue-ui/Massband";
import Preistabelle from "@/components/neue-ui/Preistabelle";
import Regalwand from "@/components/neue-ui/Regalwand";
import Rundgang from "@/components/neue-ui/Rundgang";
import { onboardingsFrei } from "@/lib/bewerbung";
import { ONBOARDINGS_PRO_WOCHE } from "@/lib/bewerbung-model";
import {
  BASE_RATE_BESONDERER_WERT,
  BASE_RATE_PER_CM,
  MIN_SLOT_MIETE,
  MIN_SLOT_MIETE_BESONDERER_WERT,
  MIN_SLOT_MIETE_BY_TRANCHE,
} from "@/lib/deck-economics";
import { eur } from "@/lib/neue-ui/regal";

/* Der Onboarding-Zähler kommt aus der DB. Alle 5 Minuten neu, und nach jeder
   Bewerbung sofort (revalidatePath in app/actions/bewerbung.ts). */
export const revalidate = 300;

/* Die drei Produkte auf der Verkostungstheke, 1,35-fach vergrößert. */
const THEKE = [
  { cm: 14, h: 17, img: "/brands/crazy-bastard-7pot.png", zoom: 1.42, dy: "14%",
    alt: "Crazy Bastard Sauce, 7 Pot Tropical, auf der Verkostungstheke" },
  { cm: 18, h: 18, img: "/brands/tekoha-matekaffee.jpg", zoom: 1.28, dy: "22%",
    alt: "Tekoha Matekaffee, geöffnete Packung mit Sticks, auf der Theke" },
  { cm: 22, h: 24, img: "/brands/berlin-oats-sixspice.png", zoom: 1.34, dy: "17%",
    alt: "Berlin Oats Crunchy Six Spice Granola auf der Theke" },
];

const FAKTEN = [
  { v: "41.000", k: "Besucher täglich" },
  { v: "150 m²", k: "Pilotfläche" },
  { v: "50 cm", k: "VK-Fläche, 60 cm tief" },
  { v: "Mo–Sa", k: "10–20 Uhr" },
];

export default async function StartPage() {
  const frei = await onboardingsFrei();

  return (
    <>
      <header className="top">
        <div className="top__in">
          <a className="mark" href="#top">
            HUB42
          </a>
          <nav className="top__nav" aria-label="Seitenbereiche">
            <a href="#regal">Regal</a>
            <a href="#rundgang">Rundgang</a>
            <a href="#preise">Preise</a>
            <a href="#bewerben">Bewerben</a>
          </nav>
          <a className="btn btn--solid" href="#bewerben">
            Jetzt bewerben
          </a>
        </div>
      </header>

      <main id="top">
        {/* ══ Held: der Laden ═══════════════════════════════════ */}
        <section className="hero">
          <img
            className="hero__img"
            src="/konzept/store.png"
            alt="Blick in den Hub42-Store im Alexa Berlin: Sichtbeton, schwarze Stahlregale, helle Holzflächen, zwei freistehende Gondeln mit Markenkarten, links eine Verkostungstheke am Schaufenster, rechts die Kasse."
          />
          <div className="hero__scrim" />
          <div className="hero__say">
            <div className="wrap">
              <p className="hero__badge">Eröffnung März 2027 · Alexa Berlin · Alexanderplatz</p>
              <h1>Ein Laden aus Beton, Stahl und sechs Marken, die du nicht kennst.</h1>
              <p className="hero__sub">
                Schwerlastregale statt Ladenbau. Sperrholz statt Hochglanz. Jede Regalfront gehört
                einer Marke, die sonst nirgendwo im Regal steht.
              </p>
              <div className="hero__cta">
                <a className="btn btn--lit" href="#regal">
                  Ins Regal sehen
                </a>
                <a className="btn btn--dark" href="#rundgang">
                  Rundgang
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

        {/* ══ Maßband ═══════════════════════════════════════════ */}
        <section className="sect sect--tight">
          <div className="wrap">
            <p className="eyebrow">Die Einheit des Hauses</p>
            <h2>Wir vermieten Zentimeter.</h2>
            <p className="lede" style={{ marginTop: 20 }}>
              Nicht Listungsplätze, nicht Jahresverträge. Regalfront in Zentimetern, Monat für
              Monat, ab fünf Zentimetern Breite.
            </p>

            <Massband />
          </div>
        </section>

        {/* ══ Das Regal ═════════════════════════════════════════ */}
        <section className="sect sect--rule sect--deep" id="regal">
          <div className="wrap">
            <p className="eyebrow">Regalwand A · Schwerlastregal · 3 Ebenen à 84 cm</p>
            <h2>Ein Regal, in dem jede Front einen Preis hat.</h2>
            <p className="lede" style={{ marginTop: 20, maxWidth: "54ch" }}>
              Grundpreis {eur(BASE_RATE_PER_CM)} pro Zentimeter und Monat. Wer höher steht, zahlt
              mehr — Augenhöhe
              +10 %, garantierte Greifhöhe +20 %. Auf der Traverse steht, wem die Front gehört:
              Marke, QR-Code, Preis. Front antippen, dann rechnet die Karte mit. Die bronzene Front
              hat einen Griff — zieh sie breiter.
            </p>

            <Regalwand />
          </div>
        </section>

        {/* ══ Rundgang ══════════════════════════════════════════ */}
        <section className="sect sect--rule" id="rundgang">
          <div className="wrap">
            <p className="eyebrow">Grundriss · Pilotfläche</p>
            <h2>150 m², sieben Stationen, ein Weg.</h2>
            <p className="lede" style={{ marginTop: 20 }}>
              Von der Glasfront bis zur Kasse sind es 40 Schritte. Station anfassen — sie leuchtet
              im Foto und im Grundriss.
            </p>

            <Rundgang />
          </div>
        </section>

        {/* ══ Theke ═════════════════════════════════════════════ */}
        <section className="sect dark">
          <div className="wrap">
            <p className="eyebrow">Verkostung</p>
            <h2>Freitags steht der Hersteller daneben.</h2>
            <p className="lede" style={{ marginTop: 20 }}>
              Offene Flasche, offene Tüte, kein Kaufzwang. Wer probiert hat, kommt mit einem Namen
              zurück — nicht mit einer Kategorie.
            </p>

            <div className="bar">
              <div className="bar__goods">
                {THEKE.map((p) => (
                  <div
                    key={p.img}
                    className="bar__good"
                    style={{ "--cm": p.cm, "--h": p.h } as React.CSSProperties}
                  >
                    <img
                      className="good__img"
                      src={p.img}
                      alt={p.alt}
                      style={{ "--zoom": p.zoom, "--dy": p.dy } as React.CSSProperties}
                    />
                  </div>
                ))}
              </div>
              <div className="counter" />
            </div>
            <p className="bar__cap">Theke am Schaufenster · 4 Marken pro Woche · Probe gratis</p>
          </div>
        </section>

        {/* ══ Preise ════════════════════════════════════════════ */}
        <section className="sect sect--rule" id="preise">
          <div className="wrap">
            <p className="eyebrow">Was eine Front kostet</p>
            <h2>Miete nach Zentimeter. Provision erst beim Verkauf.</h2>
            <p className="lede" style={{ marginTop: 20, maxWidth: "50ch" }}>
              Keine Listungsgebühr, keine Handelsmarge. Die Marke behält ihre UVP — Hub42 verdient
              7 % vom Verkaufspreis.
            </p>

            <Preistabelle />

            <p className="fineprint">
              * Besonderer Wert: für Handwerk, Herkunft oder eine Mission — nur auf Bewerbung,
              entschieden im Onboarding. Gleiche Front, {eur(BASE_RATE_BESONDERER_WERT)} statt{" "}
              {eur(BASE_RATE_PER_CM)} je cm, Mindestmiete {MIN_SLOT_MIETE_BESONDERER_WERT} € statt{" "}
              {MIN_SLOT_MIETE} €
              <br />
              Mindestmiete {MIN_SLOT_MIETE} € / Monat je Front · Mindestbreite 5 cm · Konsignation,
              kein Wareneinkauf
              <br />
              Gründungskonditionen bis 60 % Store-Auslastung · ab 60 % +10 % (Mindestmiete{" "}
              {MIN_SLOT_MIETE_BY_TRANCHE.aufbau} €) · ab 85 % +20 % (
              {MIN_SLOT_MIETE_BY_TRANCHE.warteliste} €) · First
              Mover behalten ihren Einstiegspreis vertraglich für 12 Monate
              <br />7 % Vermittlungsprovision auf den Bruttoverkaufspreis, Zahlungsabwicklung
              inklusive · Traverse-Karte mit QR-Code und monatlicher Verkaufsbericht je Front
              inklusive
            </p>
          </div>
        </section>

        {/* ══ Anteil ════════════════════════════════════════════ */}
        <section className="sect sect--rule sect--deep">
          <div className="wrap">
            <p className="eyebrow">Dieselben 20 Zentimeter</p>
            <h2>Im Supermarkt bist du Nummer 43 von 60.</h2>
            <p className="lede" style={{ marginTop: 20, maxWidth: "50ch" }}>
              Ein Frühstücksregal im LEH ist zwölf Meter lang. Deine 20 cm darin sind ein Strich —
              falls du überhaupt gelistet wirst. An unserer Wand sind dieselben 20 cm ein
              Dreizehntel.
            </p>

            <Anteil />

            <p className="fineprint">
              Beide Regale in voller Breite gezeigt, die Maßstäbe unterscheiden sich also —
              verglichen wird der Anteil, nicht die absolute Länge.
            </p>
          </div>
        </section>

        {/* ══ Herkunft ══════════════════════════════════════════ */}
        <section className="origin">
          <img
            className="origin__img"
            src="/brands/ikani-vanille.jpg"
            alt="Fermentierte Bourbon-Vanilleschoten auf Trockengittern in Ikanis Manufaktur auf Bali; eine Hand hält ein Bündel ins Bild."
          />
          <div className="origin__cap">
            <div>
              <h3>Zwei Monate fermentieren. Zwölf Wochen trocknen. Dann 22 Zentimeter Regal.</h3>
              <p>
                Im Supermarkt wäre das ein Glas Extrakt im Backregal. Hier steht der Name der Frau
                daneben, die die Schoten wendet.
              </p>
            </div>
            <p className="origin__meta">Ikani · Bourbon-Vanille · Bali / Berlin</p>
          </div>
        </section>

        {/* ══ Erlebnis ══════════════════════════════════════════ */}
        <section className="sect sect--tight sect--deep">
          <div className="wrap">
            <p className="eyebrow">Drei Wege, ein Produkt zu entdecken</p>
            <h2>Was man im Regal nicht sieht.</h2>

            <div className="tiles">
              <div className="tile">
                <p className="tile__k">Blind Box · 25–49 €</p>
                <h3>Nur die Kategorie steht drauf.</h3>
                <p>
                  Versiegelt mitnehmen, zuhause öffnen. Entdeckerbox S und M, Berliner Box,
                  Saisonbox.
                </p>
              </div>
              <div className="tile">
                <p className="tile__k">Scouts Club</p>
                <h3>Du kennst eine Marke, die hier reingehört?</h3>
                <p>Sag es uns. Nehmen wir sie auf, bekommst du ein Produkt von ihr geschenkt.</p>
              </div>
              <div className="tile">
                <p className="tile__k">Nicht nur essbar</p>
                <h3>Lchtnbrg, Postkartenwand</h3>
                <p>Berliner Bildarchiv, neu betextet. 24 Zentimeter neben dem Packtisch.</p>
                <div className="tile__pic">
                  <img
                    src="/brands/lchtnbrg-postkarten.jpg"
                    alt="Drei Postkarten von Lchtnbrg mit collagierten Motiven und Sprüchen"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ Bewerbung ════════════════════════════════════════ */}
        <section className="sect dark close" id="bewerben">
          <div className="wrap">
            <div className="close__grid">
              <div className="close__in">
                <p className="eyebrow">Regalfront · Bewerbung</p>
                <h2>Wir kuratieren. Deshalb bewirbst du dich.</h2>
                <p className="lede">
                  Ab fünf Zentimetern, ab {MIN_SLOT_MIETE} € im Monat — für Produkte mit besonderem
                  Wert ab {MIN_SLOT_MIETE_BESONDERER_WERT} €. Ohne Listungsgebühr. Wir holen
                  jede Woche {ONBOARDINGS_PRO_WOCHE} Marken ins Onboarding — und schauen uns jedes
                  Produkt an, bevor es ins Regal kommt.
                </p>
                <div className="slots" aria-label="Onboarding-Termine diese Woche">
                  {frei === null ? (
                    <p className="slots__txt">{ONBOARDINGS_PRO_WOCHE} Onboardings pro Woche</p>
                  ) : (
                    <>
                      <div className="slots__dots" aria-hidden="true">
                        {Array.from({ length: ONBOARDINGS_PRO_WOCHE }, (_, i) => (
                          <span key={i} className={i < ONBOARDINGS_PRO_WOCHE - frei ? "is-taken" : ""} />
                        ))}
                      </div>
                      <p className="slots__txt">
                        {frei > 0 ? (
                          <>
                            <strong>
                              {frei} von {ONBOARDINGS_PRO_WOCHE}
                            </strong>{" "}
                            Onboardings diese Woche frei
                          </>
                        ) : (
                          <>Diese Woche ist voll — deine Bewerbung rutscht in die nächste.</>
                        )}
                      </p>
                    </>
                  )}
                </div>
                <p className="close__note">
                  Eröffnung März 2027. Wer jetzt einsteigt, behält die Gründungskonditionen 12 Monate
                  lang vertraglich.
                </p>
              </div>

              <Bewerbung />
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <nav className="foot__nav" aria-label="Rechtliches und mehr">
            <Link href="/hersteller">Für Hersteller</Link>
            <Link href="/deck">Pitch-Deck</Link>
            <Link href="/kontakt">Kontakt</Link>
            <Link href="/impressum">Impressum</Link>
            <Link href="/datenschutz">Datenschutz</Link>
            <Link href="/agb">AGB</Link>
          </nav>
          <strong>Hub42 UG (haftungsbeschränkt) · Eröffnung März 2027 · Alexa Berlin</strong>
          <br />
          Ladenansicht und Regalkonzept sind KI-generierte Konzeptbilder, keine Fotos des fertigen
          Ladens. Regalbelegung, Grundriss und Stationsmaße sind illustrativ; Preise und Konditionen
          sind verbindlich wie angegeben.
        </div>
      </footer>
    </>
  );
}

/* eslint-disable @next/next/no-img-element --
   Hero, Herkunft und Theke sind Vollbild-Kunstwerke mit fester
   object-position bzw. mix-blend-mode; next/image legt dafür Wrapper und
   Größen fest, die die Bildführung brechen. */

import Link from "next/link";
import BeratungSektion from "@/components/neue-ui/BeratungSektion";
import Bewerbung from "@/components/neue-ui/Bewerbung";
import KiAnfrage from "@/components/neue-ui/KiAnfrage";
import { CookieEinstellungenButton } from "@/components/GoogleAnalytics";
import Massband from "@/components/neue-ui/Massband";
import Preistabelle from "@/components/neue-ui/Preistabelle";
import Regalwand from "@/components/neue-ui/Regalwand";
import Rundgang from "@/components/neue-ui/Rundgang";
import SagenTun from "@/components/neue-ui/SagenTun";
import SektionTracker from "@/components/neue-ui/SektionTracker";
import StufenTabelle from "@/components/neue-ui/StufenTabelle";
import Treppe from "@/components/neue-ui/Treppe";
import TreppeMenue, { TreppeKnopf } from "@/components/neue-ui/TreppeMenue";
import TerminKalender from "@/components/neue-ui/TerminKalender";
import { onboardingsFrei } from "@/lib/bewerbung";
import { ONBOARDINGS_PRO_WOCHE } from "@/lib/bewerbung-model";
import { BAFA_ZUSCHUSS_PCT } from "@/lib/beratung";
import {
  BASE_RATE_BESONDERER_WERT,
  BASE_RATE_PER_CM,
  HUB_MARGIN_PCT,
  MIN_SLOT_MIETE,
  MIN_SLOT_MIETE_BESONDERER_WERT,
  MIN_SLOT_MIETE_BY_TRANCHE,
  REGAL_INKLUSIVE_CM,
} from "@/lib/deck-economics";
import { eur } from "@/lib/neue-ui/regal";
import { SHOW_BAFA, SHOW_PARTNER } from "@/lib/site-flags";
import { BEISPIEL, STUFEN, ZUSATZ_CM_TEXT, eur0 } from "@/lib/treppe";

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
  { v: `ab ${MIN_SLOT_MIETE} €`, k: "Regal im Monat" },
  { v: "Mo–Sa", k: "10–20 Uhr" },
];

export default async function StartPage() {
  const frei = await onboardingsFrei();

  return (
    <>
      <header className="top">
        <div className="top__in">
          <a className="mark" href="#top" aria-label="HUB42 – entdecken, erleben, erwerben">
            HUB42
            <span className="mark__tag" aria-hidden="true">
              entdecken • erleben • erwerben
            </span>
          </a>
          <nav className="top__nav" aria-label="Seitenbereiche">
            <a href="#regal">Regal</a>
            <a href="#preise">Preise</a>
            <a href="#rundgang">Rundgang</a>
            <TreppeKnopf className="top__link">Treppe</TreppeKnopf>
            <a href="#bewerben">Bewerben</a>
          </nav>
          <a className="btn btn--solid" href="#bewerben">
            Jetzt bewerben
          </a>
        </div>
      </header>

      <main id="top">
        <SektionTracker />
        {/* ══ Held: der Laden ═══════════════════════════════════ */}
        <section className="hero" data-sektion="hero">
          <img
            className="hero__img"
            src="/konzept/store.png"
            alt="Blick in den Hub42-Store im Alexa Berlin: Sichtbeton, schwarze Stahlregale, helle Holzflächen, zwei freistehende Gondeln mit Markenkarten, links eine Verkostungstheke am Schaufenster, rechts die Kasse."
          />
          <div className="hero__scrim" />
          <div className="hero__say">
            <div className="wrap">
              <p className="hero__badge">
                {SHOW_PARTNER && "Feedback Factory · "}Eröffnung März 2027 · Alexa Berlin ·
                Alexanderplatz
              </p>
              <h1>
                Der Laden für Neuheiten.{" "}
                <span className="hero__h1b">Dein Regal am Alexanderplatz.</span>
              </h1>
              <p className="hero__sub">
                Ab {MIN_SLOT_MIETE} € im Monat. Keine Listungsgebühr, du behältst deinen Preis, wir
                verdienen {HUB_MARGIN_PCT} % nur an dem, was verkauft wird.
              </p>
              <div className="hero__cta">
                <a className="btn btn--lit" href="#bewerben">
                  Jetzt bewerben
                </a>
                <a className="btn btn--dark" href="#preise">
                  Preise ansehen
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

        {/* ══ Trust: Summit-Gewinn ═════════════════════════════ */}
        <section className="trust" aria-label="Auszeichnung">
          <div className="wrap trust__in">
            <img
              className="trust__logo"
              src="/trust/stiftung-entrepreneurship.png"
              alt="Stiftung Entrepreneurship"
              width={190}
              height={49}
            />
            <p className="trust__txt">
              <strong>Hub42 gewinnt den Proof-of-Concept</strong> beim Entrepreneurship Summit 2026
              der Stiftung Entrepreneurship, Berlin.
            </p>
          </div>
        </section>

        {/* ══ Maßband ═══════════════════════════════════════════ */}
        <section className="sect sect--tight" data-sektion="massband">
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
        <section className="sect sect--rule sect--deep" id="regal" data-sektion="regal">
          <div className="wrap">
            <p className="eyebrow">Regalwand A · Schwerlastregal · 3 Ebenen à 84 cm</p>
            <h2>Das Standardregal.</h2>
            <p className="lede" style={{ marginTop: 20, maxWidth: "54ch" }}>
              Deine Front, dein Preis, dein Name auf der Traverse. Unser geschultes Store-Team
              verkauft, auch Produkte, die man erklären muss. Du bekommst jeden Monat den Bericht.
            </p>
            <p className="lede" style={{ marginTop: 14, maxWidth: "54ch" }}>
              Grundpreis {eur(BASE_RATE_PER_CM)} pro Zentimeter und Monat. Wer höher steht, zahlt
              mehr: Augenhöhe +10 %, garantierte Greifhöhe +20 %. Auf der Traverse steht, wem die
              Front gehört: Marke, QR-Code, Preis. Front antippen, dann rechnet die Karte mit. Die
              bronzene Front hat einen Griff, zieh sie breiter.
            </p>

            <Regalwand />
          </div>
        </section>

        {/* ══ Preise ════════════════════════════════════════════ */}
        <section className="sect sect--rule" id="preise" data-sektion="preise">
          <div className="wrap">
            <p className="eyebrow">Was es kostet</p>
            <h2>Miete nach Zentimeter. Provision erst beim Verkauf.</h2>
            <p className="lede" style={{ marginTop: 20, maxWidth: "50ch" }}>
              Keine Listungsgebühr, keine Handelsmarge. Die Marke behält ihre UVP, Hub42 verdient{" "}
              {HUB_MARGIN_PCT} % vom Verkaufspreis.
            </p>

            {/* B: Das Standardregal */}
            <div className="priceblock">
              <p className="priceblock__k">B · Das Standardregal</p>
              <h3>Miete pro Zentimeter und Monat.</h3>
              <Preistabelle />

              <p className="fineprint">
                * Besonderer Wert: für Handwerk, Herkunft oder eine Mission, nur auf Bewerbung,
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
                <br />
                {HUB_MARGIN_PCT} % Vermittlungsprovision auf den Bruttoverkaufspreis,
                Zahlungsabwicklung inklusive · geschultes Verkaufspersonal, auch für erklärungsbedürftige
                Produkte, inklusive · Traverse-Karte mit QR-Code und monatlicher
                Verkaufsbericht je Front inklusive
              </p>
            </div>

            {/* Die Treppe klappt als Seitenleiste auf (TreppeMenue) */}
            <div className="priceblock treppe__teaser">
              <p className="priceblock__k">Mehr als ein Regal</p>
              <h3>Du willst wissen, wer kauft und warum?</h3>
              <p className="priceblock__txt">
                Die Treppe: fünf Stufen mit Auswertung, Interviews am Regal und Bericht, ab{" "}
                {eur0(STUFEN[0].preis)} für drei Monate. Für Marken, die mehr wollen als den
                Abverkauf.
              </p>
              <TreppeKnopf>Die Treppe ansehen →</TreppeKnopf>
            </div>

            {/* C: Beratung */}
            {SHOW_BAFA && (
              <div className="priceblock">
                <p className="priceblock__k">C · Beratung</p>
                <h3>1:1 auf dem Weg in den Handel.</h3>
                <p className="priceblock__txt">
                  Unabhängig von Regal und Treppe buchbar. Kann über das BAFA mit bis zu{" "}
                  {BAFA_ZUSCHUSS_PCT.neu} % gefördert werden.{" "}
                  <a href="#beratung">Mehr zur Beratung →</a>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ══ Beratung (nur mit SHOW_BAFA) ═════════════════════ */}
        {SHOW_BAFA && <BeratungSektion />}

        {/* ══ Rundgang ══════════════════════════════════════════ */}
        <section className="sect sect--rule" id="rundgang" data-sektion="rundgang">
          <div className="wrap">
            <p className="eyebrow">Grundriss · Pilotfläche</p>
            <h2>150 m², sieben Stationen, ein Weg.</h2>
            <p className="lede" style={{ marginTop: 20 }}>
              Von der Glasfront bis zur Kasse sind es 40 Schritte. Station anfassen, sie leuchtet
              im Foto und im Grundriss.
            </p>

            <Rundgang />
          </div>
        </section>

        {/* ══ Theke ═════════════════════════════════════════════ */}
        <section className="sect dark" data-sektion="theke">
          <div className="wrap">
            <p className="eyebrow">Verkostung</p>
            <h2>Freitags steht der Hersteller daneben.</h2>
            <p className="lede" style={{ marginTop: 20 }}>
              Offene Flasche, offene Tüte, kein Kaufzwang. Wer probiert hat, kommt mit einem Namen
              zurück, nicht mit einer Kategorie.
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

        {/* ══ Herkunft ══════════════════════════════════════════ */}
        <section className="origin" data-sektion="herkunft">
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
        <section className="sect sect--tight sect--deep" data-sektion="erlebnis">
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
        <section className="sect dark close" id="bewerben" data-sektion="bewerben">
          <div className="wrap">
            <div className="close__grid">
              <div className="close__in">
                <p className="eyebrow">Bewerbung</p>
                <h2>Wir kuratieren. Deshalb bewirbst du dich.</h2>
                <p className="lede">
                  Im Regal ab fünf Zentimetern, ab{" "}
                  {MIN_SLOT_MIETE} € im Monat, für Produkte mit besonderem Wert ab{" "}
                  {MIN_SLOT_MIETE_BESONDERER_WERT} €. Ohne Listungsgebühr. Wir holen jede Woche{" "}
                  {ONBOARDINGS_PRO_WOCHE} Marken ins Onboarding und schauen uns jedes Produkt an,
                  bevor es ins Regal kommt.
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
                          <>Diese Woche ist voll. Deine Bewerbung rutscht in die nächste.</>
                        )}
                      </p>
                    </>
                  )}
                </div>
                <p className="close__note">
                  Eröffnung März 2027. Wer jetzt einsteigt, behält die Gründungskonditionen 12 Monate
                  lang vertraglich.
                </p>
                <div className="btn-row">
                  <TerminKalender mode="dialog" />
                </div>
              </div>

              <div className="close__wege">
                <KiAnfrage />
                <Bewerbung />
              </div>
            </div>
          </div>
        </section>

        {/* ══ Die Treppe als Seitenleiste ═════════════════════ */}
        <TreppeMenue>
          <p className="eyebrow">Fünf Stufen · vom ersten Test bis zum Portfolio</p>
          <h2>Eine Treppe. Du entscheidest, wo du einsteigst.</h2>
          <p className="lede" style={{ marginTop: 20, maxWidth: "54ch" }}>
            Jede Marke kann jede Stufe buchen. Wir empfehlen dir einen Einstieg, ausgeschlossen ist
            niemand. Die Basis jeder Stufe ist das Regal nach Zentimetern, und dorthin geht es
            danach: ins Standardregal.
          </p>

          <Treppe />

          {/* A: Die Treppe */}
          <div className="priceblock">
            <p className="priceblock__k">A · Die Treppe</p>
            <h3>Fünf Stufen mit Festpreis.</h3>
            <StufenTabelle />
            <p className="fineprint">
              Alle Festpreise netto. * In jeder Stufe sind {REGAL_INKLUSIVE_CM} cm Regal im Preis
              enthalten. {ZUSATZ_CM_TEXT}
            </p>

            <div className="calc">
              <p className="calc__k">Rechenbeispiel</p>
              <p className="calc__t">
                Stufe {BEISPIEL.stufe.nr} {BEISPIEL.stufe.name} mit {BEISPIEL.cm} cm in der
                Basiszone
              </p>
              <div className="rows">
                <div className="row">
                  <span className="row__k">Festpreis netto</span>
                  <span className="row__v">{eur0(BEISPIEL.stufe.preis)}</span>
                </div>
                <div className="row">
                  <span className="row__k">Regal {REGAL_INKLUSIVE_CM} cm</span>
                  <span className="row__v">inklusive</span>
                </div>
                <div className="row">
                  <span className="row__k">
                    Weitere {BEISPIEL.zusatzCm} cm × {eur(BEISPIEL.rate)} × {BEISPIEL.monate}{" "}
                    Monate
                  </span>
                  <span className="row__v">
                    {eur0(BEISPIEL.zusatzMonat * BEISPIEL.monate)} ({eur0(BEISPIEL.zusatzMonat)} im
                    Monat)
                  </span>
                </div>
                <div className="row">
                  <span className="row__k">Provision</span>
                  <span className="row__v">+ {HUB_MARGIN_PCT} % auf verkaufte Ware</span>
                </div>
              </div>
            </div>
          </div>

          <SagenTun />
        </TreppeMenue>
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
            <CookieEinstellungenButton className="foot__btn" />
          </nav>
          <strong>
            {SHOW_PARTNER && "Feedback Factory · ein Laden der "}Hub42 UG (haftungsbeschränkt) ·
            Eröffnung März 2027 · Alexa Berlin
          </strong>
          <br />
          Ladenansicht und Regalkonzept sind KI-generierte Konzeptbilder, keine Fotos des fertigen
          Ladens. Regalbelegung, Grundriss und Stationsmaße sind illustrativ; Preise und Konditionen
          sind verbindlich wie angegeben.
        </div>
      </footer>
    </>
  );
}

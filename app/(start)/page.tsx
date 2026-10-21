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
  HUB_MARGIN_PCT,
  PAKETE,
  REGAL_INKLUSIVE_CM,
  ZONE_SURCHARGE_PCT,
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

/* Die drei Regalfronten des Standardregals, Preise auf Basishöhe. */
const zahl = (n: number) => n.toLocaleString("de-DE", { maximumFractionDigits: 2 });
const PAKET_KARTEN = [
  {
    name: "Regalfront S",
    breite: `${PAKETE.S.cm} cm`,
    preis: `${PAKETE.S.preis} €`,
    einheit: "im Monat",
    zeile: "Rund zwei Gläser nebeneinander.",
  },
  {
    name: "Regalfront M",
    breite: `${PAKETE.M.cm} cm`,
    preis: `${PAKETE.M.preis} €`,
    einheit: "im Monat",
    zeile: "Rund fünf Gläser nebeneinander.",
  },
  {
    name: "Regalfront L",
    breite: `ab ${PAKETE.L.abCm} cm`,
    preis: eur(PAKETE.L.preisJeCm),
    einheit: "je cm und Monat",
    zeile: `Bei ${PAKETE.L.abCm} cm sind das ${zahl(PAKETE.L.abCm * PAKETE.L.preisJeCm)} € im Monat.`,
  },
];

/* Abschnitt „Deine Verkaufsdaten“: was der Monatsbericht je Regalfront zeigt,
   und ein Beispiel aus dem ersten Verkauf (PoC 17./18.10.2026, ohne Markennamen). */
const DATENPUNKTE = [
  {
    t: "Stück und Umsatz je Front",
    d: "Du siehst jeden Monat in Stück und Euro, ob deine Regalfront sich selbst bezahlt.",
  },
  {
    t: "Alter und Geschlecht der Käufer",
    d: "Du siehst, ob an der Kasse die Menschen stehen, für die du dein Produkt gemacht hast.",
  },
  {
    t: "Gemeinsame Körbe",
    d: "Du siehst, wie oft dein Produkt zusammen mit anderen Marken gekauft wird, ein Hinweis für Bundles und gemeinsame Aktionen.",
  },
  {
    t: "QR-Feedback am Regal",
    d: "Wer am Regal den Code scannt, bewertet dein Produkt, und du liest die Antworten neben deinen Verkäufen.",
  },
  {
    t: "Vergleich mit dem Haus",
    d: "Du siehst dich neben dem Durchschnitt deiner Kategorie im Laden und weißt, ob ein schwacher Monat an dir lag oder am ganzen Haus.",
  },
];

const BERICHT_ZAHLEN = [
  { v: "968,95 €", k: "Umsatz brutto, alle\u00A0Marken" },
  { v: "96", k: "Artikel verkauft" },
  { v: "8", k: "Marken mit Verkäufen" },
  { v: "18,23 €", k: "Ø Kartenbon, 45\u00A0Bons" },
];

const FAKTEN = [
  { v: "rund 15 Mio.", k: "Besuche im Jahr im Alexa, Stand 2026" },
  { v: `ab ${PAKETE.S.preis} €`, k: "Regalfront im Monat, netto" },
  { v: `${HUB_MARGIN_PCT} %`, k: "nur auf das, was verkauft wird" },
  { v: "0 €", k: "Listungsgebühr" },
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
            <a href="#daten" className="top__nav-weit">Daten</a>
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
                {SHOW_PARTNER && "Feedback Factory · "}Für Gründer und Hersteller neuer Produkte ·
                Eröffnung März 2027 · Alexa am Alexanderplatz
              </p>
              <h1>
                Deinen Onlineshop findet nur, wer schon nach dir sucht.{" "}
                <span className="hero__h1b">Am Alexanderplatz finden dich alle{"\u00A0"}anderen.</span>
              </h1>
              <p className="hero__sub">
                Ab März 2027 steht dein Produkt im Alexa, vor Menschen, die nie nach dir gesucht
                hätten. Unser Store-Team lässt probieren und erklärt, was nicht aufs Etikett passt.
              </p>
              <div className="hero__cta">
                <a className="btn btn--lit" href="#bewerben">
                  Mit deinem Produkt bewerben
                </a>
                <a className="btn btn--dark" href="#preise">
                  Was eine Regalfront kostet
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

        {/* ══ Problem: Sichtbarkeit ════════════════════════════ */}
        <section className="sect sect--tight" data-sektion="problem" aria-labelledby="problem-h">
          <div className="wrap">
            <p className="eyebrow">Shop, Messe, Einkauf</p>
            <h2 id="problem-h">Sichtbarkeit ist so teuer geworden.</h2>
            <p className="lede" style={{ marginTop: 20, maxWidth: "54ch" }}>
              Online zahlst du für Anzeigen, damit überhaupt jemand deinen Shop öffnet, oder du gehst
              auf eine Messe. Drei Tage lang probieren Menschen dein Produkt. Am vierten ist der Stand
              abgebaut. Und fragt dein Einkäufer beim Neuprodukt, wer es kauft und ob es läuft, hast
              du Hoffnung statt Zahlen.
            </p>
          </div>
        </section>

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
              Nicht Listungsplätze, nicht Jahresverträge. Regalfront in Zentimetern:{" "}
              {PAKETE.S.cm}, {PAKETE.M.cm} oder ab {PAKETE.L.abCm}, nach drei Monaten monatlich
              kündbar.
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
              Drei Breiten: S mit {PAKETE.S.cm} cm für {PAKETE.S.preis} €, M mit {PAKETE.M.cm} cm
              für {PAKETE.M.preis} €, L ab {PAKETE.L.abCm} cm für {eur(PAKETE.L.preisJeCm)} je cm,
              jeweils im Monat. Wer höher steht, zahlt mehr: Augenhöhe +{ZONE_SURCHARGE_PCT.augenhoehe}
              &nbsp;%, garantierte Greifhöhe +{ZONE_SURCHARGE_PCT.greifhoehe}&nbsp;%. Auf der
              Traverse steht, wem die Front gehört: Marke, QR-Code, Preis. Front antippen, dann
              rechnet die Karte mit. Die bronzene Front hat einen Griff, zieh sie von S auf M.
            </p>

            <Regalwand />
          </div>
        </section>

        {/* ══ Deine Verkaufsdaten ═══════════════════════════════ */}
        <section className="sect sect--rule" id="daten" data-sektion="daten" aria-labelledby="daten-h">
          <div className="wrap">
            <p className="eyebrow">Deine Verkaufsdaten</p>
            <h2 id="daten-h">Wer kauft dein Produkt, ohne nach dir zu suchen?</h2>
            <p className="lede" style={{ marginTop: 20, maxWidth: "58ch" }}>
              Jeden Monat bekommst du aus unserer Ladenkasse, was deine Regalfront verkauft hat, wie
              alt deine Käufer sind und was sonst in ihrem Korb lag. Das sind die Zahlen für das
              Gespräch mit einem Einkäufer, für deinen Investor und für deine
              nächste&nbsp;Preisentscheidung.
            </p>

            <div className="daten__grid">
              <ul className="daten__punkte">
                {DATENPUNKTE.map((d) => (
                  <li key={d.t}>
                    <b>{d.t}</b>
                    <span>{d.d}</span>
                  </li>
                ))}
              </ul>

              <div>
                <figure className="bericht">
                  <figcaption className="bericht__kopf">
                    <span className="bericht__k">So sieht dein Bericht aus</span>
                    <span className="bericht__kennz">
                      Beispiel: Auswertung unseres ersten Verkaufs am 17. und 18. Oktober 2026, zwei
                      Verkaufstage, vor der Eröffnung im Alexa.
                    </span>
                  </figcaption>
                  <dl className="bericht__zahlen">
                    {BERICHT_ZAHLEN.map((z) => (
                      <div key={z.k}>
                        <dt className="bericht__l">{z.k}</dt>
                        <dd className="bericht__v">{z.v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="bericht__befund">
                    Die Mitte kauft: 40- bis 59-Jährige stellen 52 % der Käufer, in Berlin sind es
                    30 % der Einwohner ab&nbsp;15.
                  </p>
                  <p className="bericht__vorbehalt">
                    Noch kein Urteil. Das sind zwei Verkaufstage und 27 Altersangaben, ein einzelner
                    Käufer verschiebt einen Anteil um rund 4 Prozentpunkte.
                  </p>
                </figure>
                <p className="priceblock__txt">
                  Dein Bericht zeigt dieselben Zahlen für deine Marke, daneben den Durchschnitt deiner
                  Kategorie. Den ersten vollständigen Monatsbericht bekommst du ab April 2027.
                </p>
              </div>
            </div>

            <p className="daten__einkaeufer">
              Fragt dich ein Einkäufer, wer dein Produkt kauft, schlägst du den Bericht auf, statt zu
              schätzen.
            </p>
            <div className="hero__cta" style={{ marginTop: 22 }}>
              <a className="btn btn--solid" href="#bewerben">
                Mit deinem Produkt bewerben
              </a>
            </div>
            <p className="fineprint">
              Alter und Geschlecht werden an der Kasse erfasst, bei Kartenzahlung und nicht bei jedem
              Bon. Im Bericht stehen nur Summen: Du siehst Altersgruppen, keine Namen.
            </p>
          </div>
        </section>

        {/* ══ Preise ════════════════════════════════════════════ */}
        <section className="sect sect--rule" id="preise" data-sektion="preise">
          <div className="wrap">
            <p className="eyebrow">Was es kostet</p>
            <h2>Regalfront ab {PAKETE.S.preis}&nbsp;€ im Monat. Provision erst beim Verkauf.</h2>
            <p className="lede" style={{ marginTop: 20, maxWidth: "50ch" }}>
              Du wählst die Breite, unser Store-Team verkauft. Keine Listungsgebühr, keine
              Handelsmarge: Du behältst deine UVP, Hub42 bekommt {HUB_MARGIN_PCT}&nbsp;% vom
              Verkaufspreis.
            </p>

            {/* B: Das Standardregal */}
            <div className="priceblock">
              <p className="priceblock__k">B · Das Standardregal</p>
              <h3>Drei Breiten zur Wahl.</h3>

              {/* Gleich gewichtet: kein „beliebt“, kein „empfohlen“. */}
              <div className="tiles pakete">
                {PAKET_KARTEN.map((p) => (
                  <div className="tile paket" key={p.name}>
                    <p className="tile__k">
                      {p.name} · {p.breite}
                    </p>
                    <p className="paket__preis">{p.preis}</p>
                    <p className="paket__einheit">{p.einheit}</p>
                    <p>{p.zeile}</p>
                  </div>
                ))}
              </div>

              <p className="priceblock__txt">
                Die Preise gelten auf Basishöhe, 50 bis 90 cm über dem Boden. Auf Augenhöhe kommen{" "}
                {ZONE_SURCHARGE_PCT.augenhoehe}&nbsp;% dazu, auf garantierter Greifhöhe{" "}
                {ZONE_SURCHARGE_PCT.greifhoehe}&nbsp;%.
              </p>

              <Preistabelle />

              <p className="fineprint">Nur für Unternehmer. Preise netto zzgl. USt.</p>
            </div>

            {/* Die Treppe klappt als Seitenleiste auf (TreppeMenue) */}
            <div className="priceblock treppe__teaser">
              <p className="priceblock__k">Mehr als ein Regal</p>
              <h3>Du willst wissen, wer kauft und warum?</h3>
              <p className="priceblock__txt">
                Die Treppe: vier Stufen mit Auswertung, Interviews am Regal und Bericht, ab{" "}
                {eur0(STUFEN[0].preis)} netto für drei Monate. Für Marken, die mehr wollen als den
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
            <h2>95 m², sieben Stationen, ein Weg.</h2>
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
                  Im Regal ab {PAKETE.S.cm} Zentimetern und {PAKETE.S.preis} € im Monat, ohne
                  Listungsgebühr. Wir holen jede Woche {ONBOARDINGS_PRO_WOCHE} Marken ins Onboarding
                  und schauen uns jedes Produkt an, bevor es ins Regal kommt. Die Bewerbung
                  entscheidet, ob du reinkommst, nicht, was du zahlst.
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
                  Eröffnung März 2027. Wer bucht, bevor der Laden zu 60 % ausgelastet ist, behält
                  seinen Preis 12 Monate lang, vertraglich.
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
          <p className="eyebrow">Vier Stufen · vom ersten Beweis bis zum Portfolio</p>
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
            <h3>Vier Stufen mit Festpreis.</h3>
            <StufenTabelle />
            <p className="fineprint">
              Alle Festpreise netto zzgl. USt., nur für Unternehmer. * In jeder Stufe sind{" "}
              {REGAL_INKLUSIVE_CM} cm Regal im Preis
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
                    {eur(BEISPIEL.zusatzMonat * BEISPIEL.monate)} ({eur(BEISPIEL.zusatzMonat)} im
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

/* eslint-disable @next/next/no-img-element --
   Hero, Herkunft und Theke sind Vollbild-Kunstwerke mit fester
   object-position bzw. mix-blend-mode; next/image legt dafür Wrapper und
   Größen fest, die die Bildführung brechen. */

import Link from "next/link";
import BeratungSektion from "@/components/neue-ui/BeratungSektion";
import Bewerbung from "@/components/neue-ui/Bewerbung";
import { CookieEinstellungenButton } from "@/components/GoogleAnalytics";
import Massband from "@/components/neue-ui/Massband";
import Regalwand from "@/components/neue-ui/Regalwand";
import Rundgang from "@/components/neue-ui/Rundgang";
import SagenTun from "@/components/neue-ui/SagenTun";
import SektionTracker from "@/components/neue-ui/SektionTracker";
import Treppe from "@/components/neue-ui/Treppe";
import TreppeMenue, { TreppeKnopf } from "@/components/neue-ui/TreppeMenue";
import TerminKalender from "@/components/neue-ui/TerminKalender";
import PreiseAufTestkaufhaus, { TestkaufhausLink } from "@/components/TestkaufhausLink";
import { PREISE_SATZ } from "@/lib/testkaufhaus";
import { onboardingsFrei } from "@/lib/bewerbung";
import { ONBOARDINGS_PRO_WOCHE } from "@/lib/bewerbung-model";
import { BAFA_ZUSCHUSS_PCT } from "@/lib/beratung";
import { PAKETE } from "@/lib/deck-economics";
import { SHOW_BAFA, SHOW_PARTNER } from "@/lib/site-flags";

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

/* Die drei Regalfronten des Standardregals. Preise stehen seit 2026-10-30
   nur auf testkaufhaus.de; die Karten zeigen die Breite. */
const PAKET_KARTEN = [
  {
    name: "Regalfront S",
    breite: `${PAKETE.S.cm} cm`,
    zeile: "Rund zwei Gläser nebeneinander.",
  },
  {
    name: "Regalfront M",
    breite: `${PAKETE.M.cm} cm`,
    zeile: "Rund fünf Gläser nebeneinander.",
  },
  {
    name: "Regalfront L",
    breite: `ab ${PAKETE.L.abCm} cm`,
    zeile: "Breiter nach Bedarf, je Zentimeter.",
  },
];

/* Abschnitt „Deine Verkaufsdaten“: was der Monatsbericht je Regalfront zeigt,
   und ein Muster des Monatsberichts, ohne Zahlen. */
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

/* Felder des Musters: Beschriftung und Mini-Erklärung, ohne Werte. Die
   Balken daneben sind leere Platzhalter in fester Länge, keine Daten. */
const BERICHT_FELDER = [
  {
    l: "Stück und Umsatz deiner Front",
    d: "Wie viele Stück du im Monat verkauft hast und was sie an der Kasse gebracht haben.",
    balken: [72, 54, 86, 40],
  },
  {
    l: "Käufer nach Altersgruppe und\u00A0Geschlecht",
    d: "In welchen Altersgruppen deine Käufer liegen und wie sich die Geschlechter verteilen.",
    balken: [34, 62, 80, 46, 22],
  },
  {
    l: "Gemeinsame Körbe",
    d: "Welche anderen Marken mit deinem Produkt im selben Einkauf lagen, und wie oft.",
    balken: [58, 44, 30],
  },
  {
    l: "Bewertungen am Regal",
    d: "Was Kunden über den QR-Code auf dem Preisschild zu deinem Produkt sagen.",
    balken: [66, 50],
  },
  {
    l: "Schnitt deiner Kategorie",
    d: "Wie sich deine Kategorie im selben Monat im ganzen Laden verkauft hat, als Vergleich zu deinen Zahlen.",
    balken: [70, 70],
  },
];

/* Faktenleiste ohne Preise: nur Angaben, die weiter unten auf der Seite
   stehen (Maßband, Rundgang, Bewerbung). */
const FAKTEN = [
  { v: "rund 15 Mio.", k: "Besuche im Jahr im Alexa, Stand 2026" },
  { v: `ab ${PAKETE.S.cm} cm`, k: "Regalfront, nach drei Monaten monatlich kündbar" },
  { v: "95 m²", k: "Laden mit sieben Stationen" },
  { v: `${ONBOARDINGS_PRO_WOCHE}`, k: "Marken je Woche ins Onboarding" },
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
            <TestkaufhausLink>
              Preise <span aria-hidden="true">↗</span>
            </TestkaufhausLink>
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
                  Die drei Regalfronten
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

        {/* ══ Warum? Was? Wie? ══════════════════════════════════
            Text des Teams, abgenommen 2026-10-30 (copy-v1, Block „Startseite“),
            wortgleich. Ersetzt „Sichtbarkeit ist so teuer geworden“; der Schlüssel
            data-sektion="problem" bleibt, damit die Lesetiefe vergleichbar bleibt. */}
        <section className="sect sect--tight" data-sektion="problem">
          <div className="wrap warum">
            <div className="warum__col">
              <h2 id="warum-h">Warum?</h2>
              <p className="lede warum__lede">
                Unsere Motivation: Sichtbarkeit und Kaufbarkeit im Laden für Marken, die online
                schwer neue Käufer erreichen. Kaufbarkeit heißt, dass die Kundschaft ein Produkt
                leicht, reibungslos und immer wieder kaufen kann.
              </p>
              <div className="warum__text">
                <p>
                  Unabhängige Marken und Direct-to-Consumer-Hersteller (D2C) stehen zwischen zwei
                  Systemen, die beide gegen sie arbeiten.
                </p>
                <p>
                  Im klassischen Handel entscheiden hohe Listungsgebühren und Handelsmargen,
                  Mindestmengen und die Verhandlungsmacht großer Konzerne darüber, was ins Regal
                  kommt. Dort landet nicht das bessere Produkt, sondern das mit dem größeren Budget.
                </p>
                <p>
                  Online war lange der Ausweg. Inzwischen ist der Kanal teuer und schwer planbar:
                  Steigende Akquisekosten (CAC) bei Meta, Google und Amazon und dazu die Retouren
                  fressen die Marge auf. Aus dem Margendruck des Handels wurde ein Werbedruck im Netz.
                </p>
                <p className="warum__ziel">
                  Wir wollen unabhängigen Marken aus dem Netz schnell eine echte Bühne im Laden geben,
                  in hochfrequentierten Lagen wie dem Alexa am Alexanderplatz. Flexibel und ohne die
                  harten Konditionen des klassischen Handels.
                </p>
              </div>
            </div>

            <div className="warum__col warum__col--was">
              <h2 id="was-h">Was? Wie?</h2>
              <h3 className="warum__h3">
                Hub42: Stationäre Retail-Infrastruktur und Schaufenster für unabhängige Hersteller
              </h3>
              <div className="warum__text">
                <p>
                  Wir entwickeln, bauen und betreiben neue Ladengeschäfte. Als Betreiber oder
                  Umsetzungspartner übernehmen wir Planung, Einrichtung, Sortiment und Organisation
                  stationärer Handelsformate. Dabei verbinden wir Verkauf, Markenerlebnis und das
                  Ausprobieren neuer Produkte.
                </p>
                <p>
                  Mit dem Berliner Institut für Innovationsforschung (BIFI) bringen wir stationären
                  Handel und wissenschaftliche Marktforschung in einem gemeinsamen Konzept zusammen.
                  Das BIFI verantwortet die wissenschaftliche Leitung, die Methodik und den Bericht.
                  Erprobt ist die Methodik im Pilot 2018 des BIFI. Das erste gemeinsame Format ist das
                  Testkaufhaus im Alexa Berlin, Eröffnung am 28.03.2027 (
                  <TestkaufhausLink className="tk-link" />
                  ). Diese Verbindung aus echtem Laden und wissenschaftlicher Begleitung bietet weder
                  ein reiner Onlineshop noch ein Pop-up-Store.
                </p>
              </div>
              <div className="warum__cta">
                <TestkaufhausLink className="btn btn--solid" ort="start-was-wie">
                  Zum Testkaufhaus <span aria-hidden="true">→</span>
                </TestkaufhausLink>
              </div>
            </div>
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
              <span className="trust__beleg">
                Unser Pop-up beim Summit, zwei Verkaufstage am 17. und 18. Oktober 2026: 968,95 € Umsatz
                brutto, 96 Artikel, 8 Marken mit Verkäufen, Ø Kartenbon 18,23&nbsp;€. Jede dieser
                acht Marken bekam danach ihre eigene Auswertung.
              </span>
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
              Drei Breiten: S mit {PAKETE.S.cm} cm, M mit {PAKETE.M.cm} cm, L ab {PAKETE.L.abCm} cm.
              Auf der Traverse steht deine Werbung: Marke, eine Zeile zu deinem Produkt, dazu ein
              weißes Preisschild mit QR-Code, über das Käufer dein Produkt bewerten. Front antippen,
              dann zeigt die Karte Breite und Zone. Die bronzene Front hat einen Griff, zieh sie von
              S auf M.
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
              Ab März 2027 zählt unsere Ladenkasse im Alexa für dich mit: was deine Regalfront
              verkauft, wie alt deine Käufer sind und was sonst in ihrem Korb liegt. Daraus bekommst
              du jeden Monat deinen Bericht, für das Gespräch mit einem Einkäufer, für deinen Investor
              und für deine nächste&nbsp;Preisentscheidung.
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
                    <span className="bericht__kennz">Muster: So ist dein Monatsbericht aufgebaut.</span>
                  </figcaption>
                  <dl className="muster">
                    {BERICHT_FELDER.map((f) => (
                      <div key={f.l} className="muster__feld">
                        <dt className="bericht__l">{f.l}</dt>
                        <dd className="muster__d">{f.d}</dd>
                        <dd className="muster__balken" aria-hidden="true">
                          {f.balken.map((b, i) => (
                            <i key={i} style={{ width: `${b}%` }} />
                          ))}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </figure>
                <p className="priceblock__txt">Den ersten vollständigen Monatsbericht bekommst du ab April 2027.</p>
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

        {/* ══ Regalfronten ═════════════════════════════════════
            Bis 2026-10-30 der Preisblock. Preise und Pakete stehen jetzt nur
            auf testkaufhaus.de; die Anker #preise und data-sektion bleiben,
            damit Links und Auswertung weiter greifen. */}
        <section className="sect sect--rule" id="preise" data-sektion="preise">
          <div className="wrap">
            <p className="eyebrow">Das Standardregal</p>
            <h2>Drei Breiten zur Wahl.</h2>
            <p className="lede" style={{ marginTop: 20, maxWidth: "50ch" }}>
              Du wählst die Breite, unser Store-Team verkauft. Keine Listungsgebühr, keine
              Handelsmarge: Du behältst deine UVP.
            </p>

            {/* Gleich gewichtet: kein „beliebt“, kein „empfohlen“. */}
            <div className="tiles pakete">
              {PAKET_KARTEN.map((p) => (
                <div className="tile paket" key={p.name}>
                  <p className="tile__k">{p.name}</p>
                  <p className="paket__breite">{p.breite}</p>
                  <p>{p.zeile}</p>
                </div>
              ))}
            </div>

            <div className="priceblock">
              <p className="priceblock__k">Was es kostet</p>
              <h3>{PREISE_SATZ}</h3>
              <TestkaufhausLink className="btn btn--solid priceblock__btn" ort="start-preise">
                Preise auf testkaufhaus.de <span aria-hidden="true">→</span>
              </TestkaufhausLink>
            </div>

            {/* Die Treppe klappt als Seitenleiste auf (TreppeMenue) */}
            <div className="priceblock treppe__teaser">
              <p className="priceblock__k">Mehr als ein Regal</p>
              <h3>Du willst wissen, wer kauft und warum?</h3>
              <p className="priceblock__txt">
                Die Treppe: vier Stufen mit Auswertung, Interviews am Regal und Bericht. Für Marken,
                die mehr wollen als den Abverkauf.
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
                <p className="tile__k">Blind Box</p>
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
                  Im Regal ab {PAKETE.S.cm} Zentimetern, ohne Listungsgebühr. Wir holen jede Woche {ONBOARDINGS_PRO_WOCHE} Marken ins Onboarding
                  und schauen uns jedes Produkt an, bevor es ins Regal kommt. Die Bewerbung
                  entscheidet, ob du reinkommst, nicht, was du zahlst.
                </p>
                <div className="slots" aria-label="Onboarding-Termine diese Woche">
                  {frei === null ? (
                    /* Zählung fehlgeschlagen: nie eine erfundene Zahl, nur der feste Satz. */
                    <p className="slots__txt">Wir holen jede Woche {ONBOARDINGS_PRO_WOCHE} Marken ins Onboarding.</p>
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
                          <>Diese Woche sind alle Onboardings vergeben. Bewirb dich für die nächste Woche.</>
                        )}
                      </p>
                    </>
                  )}
                </div>
                <p className="close__note">
                  Eröffnung März 2027. <PreiseAufTestkaufhaus linkClassName="tk-link" />
                </p>
                <div className="btn-row">
                  <TerminKalender mode="dialog" />
                </div>
              </div>

              {/* Die KI-Anfrage rechnete Miete und Provision vor; sie ist seit
                  2026-10-30 nicht mehr eingebunden (Preise nur auf testkaufhaus.de).
                  Die Komponente bleibt im Repo. */}
              <div className="close__wege">
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

          <div className="priceblock">
            <p className="priceblock__k">Was es kostet</p>
            <p className="priceblock__txt">
              <PreiseAufTestkaufhaus linkClassName="tk-link" />
            </p>
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
          Ladens. Regalbelegung, Grundriss und Stationsmaße sind illustrativ.
        </div>
      </footer>
    </>
  );
}

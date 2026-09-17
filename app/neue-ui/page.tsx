/* eslint-disable @next/next/no-img-element --
   Hero, Herkunft und Theke sind Vollbild-Kunstwerke mit fester
   object-position bzw. mix-blend-mode; next/image legt dafür Wrapper und
   Größen fest, die die Bildführung brechen. */

import Anteil from "@/components/neue-ui/Anteil";
import Massband from "@/components/neue-ui/Massband";
import Preistabelle from "@/components/neue-ui/Preistabelle";
import Regalwand from "@/components/neue-ui/Regalwand";
import Rundgang from "@/components/neue-ui/Rundgang";

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

export default function NeueUiPage() {
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
          </nav>
          <a className="btn btn--solid" href="#anfragen">
            Regalfront anfragen
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
              <p className="hero__badge">Alexa Berlin · Alexanderplatz</p>
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
              Grundpreis 4,64 € pro Zentimeter und Monat. Wer höher steht, zahlt mehr — Augenhöhe
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
              Mindestmiete 59 € / Monat je Front · Mindestbreite 5 cm · Konsignation, kein
              Wareneinkauf
              <br />
              Gründungskonditionen bis 60 % Store-Auslastung · ab 60 % +10 % · ab 85 % +20 % · First
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

        {/* ══ Abschluss ═════════════════════════════════════════ */}
        <section className="sect dark close" id="anfragen">
          <div className="wrap">
            <div className="close__in">
              <p className="eyebrow">Regalfront anfragen</p>
              <h2>Sieben Fronts in dieser Wand sind noch frei.</h2>
              <p className="lede">
                Ab fünf Zentimetern, ab 59 € im Monat, ohne Listungsgebühr. Wir bringen den Ort, du
                bringst dein Produkt.
              </p>
              <div className="btn-row">
                <a className="btn btn--lit" href="#regal">
                  Freie Front wählen
                </a>
                <a className="btn btn--dark" href="#preise">
                  Preise ansehen
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <strong>Design-Mockup, 11. September 2026.</strong>
          <br />
          Echt: Produktfotos der sechs gelisteten Marken, Zonen-Preismodell (4,64 €/cm, +10 % /
          +20 %, 140 € Schaufenster, 59 € Mindestmiete, 5 cm Mindestbreite, 7 % Provision), Traverse
          15 cm, 50 cm VK-Fläche, Öffnungszeiten, Besucherzahl Alexa. Der Konfigurator rechnet mit
          genau diesen Werten.
          <br />
          Illustrativ: Regalbreiten und Produkthöhen in cm, Belegung der Wand, Grundriss und
          Stationsmaße, Anzahl und Länge der LEH-Fronts im Anteilsvergleich.
          <br />
          Ladenansicht und Regalkonzept sind KI-generierte Konzeptbilder aus dem
          Hub42-Pitchmaterial — sie tragen ein Generator-Wasserzeichen und sind keine Fotos des
          fertigen Ladens.
        </div>
      </footer>
    </>
  );
}

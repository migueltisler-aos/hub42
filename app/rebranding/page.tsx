import type { Metadata } from "next";
import Link from "next/link";
import FFNavbar from "@/components/rebranding/FFNavbar";
import FFFooter from "@/components/rebranding/FFFooter";

export const metadata: Metadata = {
  title: "Feedback Factory, Alexa Berlin",
  description:
    "Neue Marken zuerst im Regal. Rohes Holz, neutrale Fläche, deine ehrliche Meinung. Alexa Berlin, Alexanderplatz.",
};

const MARKEN = ["Berlin Oats", "Crazy Bastard Sauce", "Lchtnbrg", "Ikani", "auteniQ", "Green Naturals", "Tekoha"];

const ERLEBNIS = [
  {
    titel: "Regal, kein Schaufenster",
    text: "Produkte stehen zum Anfassen bereit, nicht hinter Glas. Du nimmst mit, was dich überzeugt.",
  },
  {
    titel: "Tasting Bar",
    text: "Probieren vor dem Kaufen. Bei Lebensmitteln und Getränken die einzige ehrliche Reihenfolge.",
  },
  {
    titel: "QR-Bewertung",
    text: "Kurzer Scan an der Traverse, neun Punkte, eine Minute. Deine Einschätzung geht direkt an die Marke zurück.",
  },
];

const OEFFNUNGSZEITEN = [
  { tag: "Montag bis Freitag", zeiten: "10:00 bis 20:00" },
  { tag: "Samstag", zeiten: "10:00 bis 20:00" },
  { tag: "Sonntag", zeiten: "Geschlossen" },
];

export default function RebrandingHome() {
  return (
    <>
      <FFNavbar variant="store" />
      <main>
        {/* Hero */}
        <section className="pt-20 pb-24 border-b border-black">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="ff-eyebrow mb-6">Das Format</p>
            <h1
              className="ff-headline uppercase tracking-tight leading-[0.95] text-[clamp(2.5rem,7vw,6rem)] font-bold mb-8"
              style={{ fontFamily: "var(--font-ff-display)" }}
            >
              Neue Marken.
              <br />
              <span className="ff-mark">Deine Meinung.</span>
            </h1>
            <div className="max-w-xl space-y-4 text-base leading-relaxed">
              <p>
                Wir stellen unabhängige Marken ins Regal, bevor sie jeder kennt. Du probierst,
                bewertest und entscheidest.
              </p>
              <p>
                Neutrale Regale, kein Rabattschild, keine Marketinglyrik: nur das Produkt und
                deine ehrliche Meinung.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 mt-10 text-xs font-mono border-l-2 border-black pl-4">
              <span>41.000 Besucher täglich</span>
              <span>Alexa Berlin, Alexanderplatz</span>
              <span>Mo bis Sa, 10 bis 20 Uhr</span>
            </div>
          </div>
        </section>

        {/* Die Marken */}
        <section id="marken" className="py-20 border-b border-black">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="ff-eyebrow mb-4">Die Marken</p>
            <h2
              className="ff-headline uppercase tracking-tight leading-[0.95] text-[clamp(2rem,5vw,4rem)] font-bold mb-8"
              style={{ fontFamily: "var(--font-ff-display)" }}
            >
              Unbekannt heute.
              <br />
              <span className="ff-mark">Gefragt morgen.</span>
            </h2>
            <p className="max-w-xl text-base leading-relaxed mb-10">
              Jede Marke im Regal ist unabhängig, hat einen echten Gründer dahinter und einen
              Preis, den sie selbst setzt. Kein Konzern, keine Handelsmarge, kein Listungsgeld.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-black/10 border border-black/10 max-w-3xl">
              {MARKEN.map((name) => (
                <div key={name} className="bg-white p-5">
                  <p className="text-sm font-semibold">{name}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-black/40 mt-4">
              Produktfotos folgen. Aktuelle Sortiments-Aufnahmen liegen noch nicht vor.
            </p>
          </div>
        </section>

        {/* Das Erlebnis */}
        <section id="erlebnis" className="py-20 border-b border-black">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="ff-eyebrow mb-4">Das Erlebnis</p>
            <h2
              className="ff-headline uppercase tracking-tight leading-[0.95] text-[clamp(2rem,5vw,4rem)] font-bold mb-10"
              style={{ fontFamily: "var(--font-ff-display)" }}
            >
              Drei Schritte.
              <br />
              <span className="ff-mark">Ein Urteil.</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
              {ERLEBNIS.map((e) => (
                <div key={e.titel} className="border-l border-black pl-5">
                  <h3 className="text-lg font-semibold mb-2">{e.titel}</h3>
                  <p className="text-sm leading-relaxed text-black/70">{e.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Warum neutral */}
        <section className="py-20 border-b border-black bg-black text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="ff-eyebrow mb-4 text-white/60">Warum so nüchtern</p>
            <h2
              className="ff-headline uppercase tracking-tight leading-[0.95] text-[clamp(1.8rem,4vw,3rem)] font-bold mb-6"
              style={{ fontFamily: "var(--font-ff-display)" }}
            >
              Rohes Holz. Schwarze Schilder.
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-white/80">
              Kein Markendesign, keine Storeinszenierung, kein Deko-Trick, der dein Urteil
              vorwegnimmt. Neutrale Regale und Lageroptik sollen genau eines nicht tun: dein
              Urteil über das Produkt verzerren.
            </p>
          </div>
        </section>

        {/* Der Store */}
        <section id="store" className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div>
                <p className="ff-eyebrow mb-4">Der Store</p>
                <h2
                  className="ff-headline uppercase tracking-tight leading-[0.95] text-[clamp(1.8rem,4vw,3rem)] font-bold mb-6"
                  style={{ fontFamily: "var(--font-ff-display)" }}
                >
                  Alexa Berlin.
                  <br />
                  <span className="ff-mark">Alexanderplatz.</span>
                </h2>
                <address className="not-italic text-sm text-black/70 mb-8">
                  Grunerstraße 20, 10179 Berlin
                  <br />
                  <a
                    href="https://maps.google.com/?q=Alexa+Berlin,+Grunerstra%C3%9Fe+20,+10179+Berlin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ff-link"
                  >
                    In Google Maps öffnen
                  </a>
                </address>
                <div className="space-y-2 max-w-sm">
                  {OEFFNUNGSZEITEN.map((oz) => (
                    <div
                      key={oz.tag}
                      className={`flex justify-between border-b border-black/10 py-2 text-sm ${
                        oz.zeiten === "Geschlossen" ? "text-black/40" : ""
                      }`}
                    >
                      <span>{oz.tag}</span>
                      <span className="font-mono">{oz.zeiten}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-dashed border-black/30 p-8 flex flex-col justify-center min-h-[16rem]">
                <p className="text-xs text-black/40 font-mono uppercase tracking-widest mb-2">
                  Foto folgt
                </p>
                <p className="text-sm text-black/60 max-w-xs">
                  Rohholz-Regal mit schwarzem Traversenschild, Weitwinkel auf die Ladenfront.
                  Aufnahme steht noch aus.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bridge zu Marken */}
        <section className="py-12 border-t border-black">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-sm text-black/60">Du machst selbst ein Produkt und willst ins Regal?</p>
            <Link
              href="/rebranding/marken"
              className="ff-btn inline-flex items-center px-6 py-3 text-sm font-semibold w-fit"
            >
              Zur Marken-Seite
            </Link>
          </div>
        </section>
      </main>
      <FFFooter />
    </>
  );
}

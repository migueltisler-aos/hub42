import type { Metadata } from "next";
import FFNavbar from "@/components/rebranding/FFNavbar";
import FFFooter from "@/components/rebranding/FFFooter";

export const metadata: Metadata = {
  title: "Für Marken, Testkaufhaus Feedback Factory",
  description:
    "Regal ab 59 Euro im Monat, 4,64 Euro pro Zentimeter, 14 Tage bis ins Regal, Kommission nach Paragraf 383 HGB. Rohdaten statt Bauchgefühl.",
};

const KONDITIONEN = [
  { wert: "Ab 59 €", label: "pro Monat, kleinste Regalfront" },
  { wert: "4,64 €", label: "pro Zentimeter Regalbreite" },
  { wert: "14 Tage", label: "von Zusage bis ins Regal" },
  { wert: "3 Monate", label: "Mindestlaufzeit, danach monatlich kündbar" },
  { wert: "0,30 €", label: "Checkout-Fee pro verkauftem Artikel" },
  { wert: "§ 383 HGB", label: "Kommission, Ware bleibt dein Eigentum bis zum Verkauf" },
];

const ABLAUF = [
  { nr: "01", titel: "Bewerbung", text: "Kurze Anfrage, Rückmeldung innerhalb von 24 Stunden." },
  { nr: "02", titel: "Gespräch", text: "30 Minuten, Position im Regal wählen, offene Fragen klären." },
  { nr: "03", titel: "Onboarding", text: "Ware rein, QR-Code und Traversenschild eingerichtet." },
  { nr: "04", titel: "Live", text: "Regal steht, erste Kundenkontakte, erste Bewertungen." },
  { nr: "05", titel: "Auswertung", text: "Monatliche Abrechnung und Rohdaten aus der Kundenbewertung." },
];

export default function RebrandingMarken() {
  return (
    <>
      <FFNavbar variant="marken" />
      <main>
        {/* Hero */}
        <section className="pt-20 pb-20 border-b border-black">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="ff-eyebrow mb-6">Das Testkaufhaus</p>
            <h1
              className="uppercase tracking-tight leading-[0.95] text-[clamp(2.5rem,7vw,6rem)] font-bold mb-8"
              style={{ fontFamily: "var(--font-ff-display)" }}
            >
              Deine Marke.
              <br />
              <span className="ff-mark">Echte Kunden.</span>
            </h1>
            <div className="max-w-xl space-y-4 text-base leading-relaxed">
              <p>
                Die Feedback Factory ist ein Testkaufhaus am Alexanderplatz. Du mietest
                Regalfläche nach Zentimetern, wir verkaufen als Kommissionär, du bleibst bis
                zum Verkauf Eigentümer deiner Ware.
              </p>
              <p>
                Kein Listungsgeld, keine Handelsmarge. Wir verdienen erst, wenn du verkaufst.
              </p>
            </div>
          </div>
        </section>

        {/* Konditionen */}
        <section id="konditionen" className="py-20 border-b border-black">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="ff-eyebrow mb-4">Konditionen</p>
            <h2
              className="uppercase tracking-tight leading-[0.95] text-[clamp(2rem,5vw,4rem)] font-bold mb-10"
              style={{ fontFamily: "var(--font-ff-display)" }}
            >
              Zahlen statt
              <br />
              <span className="ff-mark">Versprechen.</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-black/10 border border-black/10">
              {KONDITIONEN.map((k) => (
                <div key={k.label} className="bg-white p-6">
                  <p
                    className="text-3xl font-bold mb-1"
                    style={{ fontFamily: "var(--font-ff-display)" }}
                  >
                    {k.wert}
                  </p>
                  <p className="text-sm text-black/60">{k.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ablauf */}
        <section id="ablauf" className="py-20 border-b border-black">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="ff-eyebrow mb-4">Ablauf</p>
            <h2
              className="uppercase tracking-tight leading-[0.95] text-[clamp(2rem,5vw,4rem)] font-bold mb-10"
              style={{ fontFamily: "var(--font-ff-display)" }}
            >
              Fünf Schritte.
              <br />
              <span className="ff-mark">Erster Verkauf.</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {ABLAUF.map((s) => (
                <div key={s.nr} className="flex flex-col gap-2">
                  <span
                    className="text-4xl font-bold"
                    style={{ fontFamily: "var(--font-ff-display)" }}
                  >
                    {s.nr}
                  </span>
                  <h3 className="text-base font-semibold">{s.titel}</h3>
                  <p className="text-sm text-black/60 leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Validierung */}
        <section id="validierung" className="py-20 border-b border-black bg-black text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="ff-eyebrow mb-4 text-white/60">Validierung</p>
            <h2
              className="uppercase tracking-tight leading-[0.95] text-[clamp(2rem,5vw,4rem)] font-bold mb-8"
              style={{ fontFamily: "var(--font-ff-display)" }}
            >
              Rohdaten.
              <br />
              <span className="ff-mark">Keine Dashboards, die schönreden.</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4 text-base leading-relaxed text-white/80">
                <p>
                  Jede Kundenbewertung läuft über einen QR-Code an der Traverse: neun Punkte,
                  eine Frage, unter einer Minute. Du bekommst die Rohdaten, nicht nur eine
                  hübsche Zusammenfassung.
                </p>
                <p>
                  Die Marktforschung dazu läuft in Kooperation mit dem Berliner Institut für
                  Innovationsforschung GmbH (BIFI). Das Institut ist unser Partner für Methodik
                  und Auswertung, nicht Betreiber des Stores.
                </p>
              </div>
              <div className="border border-white/20 p-6">
                <p className="text-xs font-mono uppercase tracking-widest text-white/40 mb-3">
                  Was du bekommst
                </p>
                <ul className="space-y-2 text-sm text-white/80">
                  <li>Monatlicher Verkaufsbericht pro Artikel</li>
                  <li>Bewertungs-Rohdaten, eine Zeile pro Kundenbewertung</li>
                  <li>Tageszeit-Auswertung, wann dein Produkt gekauft wird</li>
                  <li>Panel-Struktur nach DSGVO, ohne personenbezogene Klartextdaten</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Kontakt */}
        <section className="py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <p className="ff-eyebrow mb-4">Kontakt</p>
            <h2
              className="uppercase tracking-tight leading-[0.95] text-[clamp(2rem,5vw,4rem)] font-bold mb-8"
              style={{ fontFamily: "var(--font-ff-display)" }}
            >
              Regalfläche anfragen
            </h2>
            <p className="text-sm text-black/60 mb-1">Miguel Tisler, Gründer Hub42 UG</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a href="tel:+4917787956437" className="underline hover:no-underline font-mono">
                0177 879 56 37
              </a>
              <a href="mailto:info@tryhub42.de" className="underline hover:no-underline">
                info@tryhub42.de
              </a>
            </div>
          </div>
        </section>
      </main>
      <FFFooter />
    </>
  );
}

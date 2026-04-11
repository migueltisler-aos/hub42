import type { Metadata } from "next";
import Link from "next/link";
import ComparisonTable from "@/components/ComparisonTable";
import HerstellerRechner from "@/components/HerstellerRechner";
import SlotCard from "@/components/SlotCard";
import ContactForm from "@/components/ContactForm";
import { SLOTS, ANALYTICS_PAKETE } from "@/lib/slots";

export const metadata: Metadata = {
  title: "Für Hersteller – Dein Produkt verdient einen fairen Platz",
  description:
    "0% Handelsmarge, täglich Kundendaten, Slots ab 55 €/Monat. Hub42 ist der direkteste Weg vom Produkt zum Berliner Kunden.",
};

const SCHRITTE = [
  {
    nr: "01",
    titel: "Slot anfragen",
    beschreibung: "30 Minuten Gespräch. Kein Papierkram vorher.",
  },
  {
    nr: "02",
    titel: "Vertrag unterschreiben",
    beschreibung: "3 Monate Mindestlaufzeit. Danach monatlich kündbar.",
  },
  {
    nr: "03",
    titel: "Ware liefern",
    beschreibung: "Wir räumen ein. Du bleibst Eigentümer bis zum Verkauf.",
  },
  {
    nr: "04",
    titel: "Verkaufen",
    beschreibung: "Du behältst den Erlös minus Slot-Gebühr und 0,40 € Checkout-Fee.",
  },
  {
    nr: "05",
    titel: "Daten bekommen",
    beschreibung: "Täglich. Was deine Kunden wirklich wollen.",
  },
];

const WAS_DU_BEKOMMST = [
  "Dein Regalplatz im Alexa Berlin",
  "Traverse-Karte mit deiner Story",
  "QR-Code mit Tracking",
  "Monatlicher Verkaufsbericht",
  "Zugang zum Hub42 Creator Playbook",
  "Freitags-Tasting auf Wunsch",
];

const FAQ = [
  {
    frage: "Was ist Konsignation?",
    antwort:
      "Du lieferst deine Ware an Hub42, bleibst aber rechtlich Eigentümer bis zum Verkauf. Du trägst kein Lagerrisiko im klassischen Sinne – die Ware ist immer noch deins.",
  },
  {
    frage: "Was ist die Checkout-Gebühr?",
    antwort:
      "0,40 € pro Transaktion. Keine Handelsmarge. Keine versteckten Kosten. Du weißt immer exakt was du bekommst.",
  },
  {
    frage: "Wie funktioniert die Abrechnung?",
    antwort:
      "Monatlich automatisch. Du bekommst eine Aufstellung aller Verkäufe, der abgezogenen Slot-Gebühr und dein Nettoerlös wird überwiesen.",
  },
  {
    frage: "Was passiert wenn ich nicht genug verkaufe?",
    antwort:
      "Du kannst jederzeit nach Ablauf der Mindestlaufzeit aussteigen. Unverkaufte Ware wird zurückgesandt. Kein Warenrisiko auf unserer Seite.",
  },
  {
    frage: "Kann ich meinen Preis selbst festlegen?",
    antwort:
      "Ja. Vollständige Preishoheit. Wir nehmen keine Handelsmarge. Du setzt den Endkundenpreis, wir kassieren nur die Slot-Gebühr.",
  },
  {
    frage: "Was ist die Mindestlaufzeit?",
    antwort:
      "3 Monate. Danach monatlich kündbar. Wir glauben, dass du bleiben willst – weil die Zahlen stimmen.",
  },
];

export default function HerstellerPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-green-dark pt-32 pb-20 border-b border-stone-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
            Für Hersteller
          </p>
          <h1
            className="text-cream text-[clamp(2.5rem,8vw,7rem)] leading-none tracking-widest mb-6"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Dein Produkt verdient
            <br />
            <span className="text-bronze">einen fairen Platz.</span>
          </h1>
          <p className="text-stone text-base max-w-lg mb-3">
            Kein Einkäufer der dich klein macht.<br />
            Kein Listungsgeld das dich ausblutet.<br />
            Nur du – und deine Kunden.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <a
              href="#slot-anfragen"
              className="px-8 py-4 bg-bronze text-green-dark font-semibold rounded-sm hover:bg-bronze-light transition-colors text-sm"
            >
              Slot anfragen →
            </a>
            <a
              href="#rechner"
              className="px-8 py-4 border border-stone-dark text-cream hover:border-bronze/40 rounded-sm transition-colors text-sm"
            >
              Rechner öffnen
            </a>
          </div>
        </div>
      </section>

      {/* Vergleichstabelle */}
      <section className="bg-green-mid py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Direktvergleich
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Rewe vs. Hub42
            </h2>
          </div>
          <ComparisonTable />
        </div>
      </section>

      {/* So funktioniert es */}
      <section className="bg-green-dark py-20 border-t border-stone-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              So funktioniert es
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              5 Schritte zum
              <span className="text-bronze"> ersten Verkauf</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {SCHRITTE.map((s) => (
              <div key={s.nr} className="flex flex-col gap-3">
                <span
                  className="text-bronze text-5xl leading-none"
                  style={{ fontFamily: "var(--font-bebas)" }}
                >
                  {s.nr}
                </span>
                <h3
                  className="text-cream text-xl tracking-widest"
                  style={{ fontFamily: "var(--font-bebas)" }}
                >
                  {s.titel}
                </h3>
                <p className="text-stone text-sm leading-relaxed">{s.beschreibung}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rechner */}
      <section id="rechner" className="bg-green-mid py-20 border-t border-stone-dark">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Kalkulator
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest mb-2"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Was verdienst du
              <span className="text-bronze"> wirklich?</span>
            </h2>
            <p className="text-stone text-sm">
              Vergleiche deinen Erlös bei Rewe vs. Hub42 – auf Basis deiner eigenen Zahlen.
            </p>
          </div>
          <HerstellerRechner />
        </div>
      </section>

      {/* Slot-System */}
      <section className="bg-green-dark py-20 border-t border-stone-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Preise
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              5 Slots.
              <span className="text-bronze"> Ein Ziel.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[...SLOTS].reverse().map((slot, i) => (
              <SlotCard key={slot.name} slot={slot} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Was du bekommst + Checkout */}
      <section className="bg-green-mid py-20 border-t border-stone-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Was du bekommst */}
            <div>
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
                Inklusive
              </p>
              <h2
                className="text-cream text-[clamp(2rem,4vw,3rem)] leading-none tracking-widest mb-8"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Was du
                <span className="text-bronze"> bekommst</span>
              </h2>
              <ul className="space-y-3">
                {WAS_DU_BEKOMMST.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-cream text-sm">
                    <span className="text-bronze shrink-0 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Checkout-Gebühr */}
            <div>
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
                Transparenz
              </p>
              <h2
                className="text-cream text-[clamp(2rem,4vw,3rem)] leading-none tracking-widest mb-8"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Checkout-
                <span className="text-bronze">Gebühr</span>
              </h2>
              <div className="border-l-2 border-bronze pl-6">
                <p className="text-bronze text-5xl mb-2" style={{ fontFamily: "var(--font-bebas)" }}>
                  0,40 €
                </p>
                <p className="text-stone text-sm mb-4">pro Transaktion</p>
                <p className="text-cream text-sm leading-relaxed">
                  Keine Handelsmarge. Keine versteckten Kosten.<br />
                  Du weißt immer exakt was du bekommst.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Analytics */}
      <section className="bg-green-dark py-20 border-t border-stone-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Pro Analytics
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Daten die
              <span className="text-bronze"> wirklich zählen</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ANALYTICS_PAKETE.map((paket) => (
              <div
                key={paket.name}
                className="bg-green-mid border border-stone-dark rounded-sm p-6 hover:border-bronze/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-cream text-2xl tracking-widest"
                    style={{ fontFamily: "var(--font-bebas)" }}
                  >
                    {paket.name}
                  </h3>
                  {paket.inkludiert ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-bronze/20 text-bronze rounded-sm">
                      INKLUDIERT
                    </span>
                  ) : (
                    <span className="text-bronze font-mono font-bold">{paket.preis} €/Mo.</span>
                  )}
                </div>
                <p className="text-stone text-sm mb-4">{paket.beschreibung}</p>
                <ul className="space-y-1.5">
                  {paket.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-cream">
                      <span className="text-bronze shrink-0 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blind Box Pipeline */}
      <section className="bg-green-mid py-16 border-t border-stone-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
            Kein Slot frei?
          </p>
          <h2
            className="text-cream text-[clamp(1.8rem,4vw,3.5rem)] leading-none tracking-widest mb-4"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Kein Problem. Dein Produkt kommt erstmal
            <br />
            <span className="text-bronze">in unsere Blind Box.</span>
          </h2>
          <p className="text-stone text-sm max-w-lg mx-auto mb-6">
            Volle Slots bedeuten nicht das Ende. Dein Produkt landet in der kurierten
            Überraschungskiste – ohne Slot-Gebühr, aber mit echtem Kundenkontakt.
          </p>
          <Link
            href="/kontakt"
            className="inline-block px-8 py-3 border border-bronze/40 text-bronze hover:border-bronze rounded-sm text-sm transition-colors"
          >
            Blind Box anfragen
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-green-dark py-20 border-t border-stone-dark">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Häufige
              <span className="text-bronze"> Fragen</span>
            </h2>
          </div>

          <div className="space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.frage}
                className="group border border-stone-dark rounded-sm overflow-hidden"
              >
                <summary className="flex justify-between items-center px-6 py-4 cursor-pointer text-cream hover:text-bronze transition-colors list-none">
                  <span className="font-medium">{item.frage}</span>
                  <span className="text-bronze text-xl shrink-0 ml-4 group-open:rotate-45 transition-transform duration-200">
                    +
                  </span>
                </summary>
                <div className="px-6 pb-5 text-stone text-sm leading-relaxed border-t border-stone-dark">
                  <p className="pt-4">{item.antwort}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Kontakt / CTA */}
      <section id="slot-anfragen" className="bg-green-mid py-20 border-t border-stone-dark">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Jetzt starten
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Slot anfragen
            </h2>
            <p className="text-stone text-sm mt-3">
              Miguel Tisler · Gründer ·{" "}
              <a href="mailto:info@tryhub42.de" className="text-bronze hover:underline">
                info@tryhub42.de
              </a>
            </p>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}

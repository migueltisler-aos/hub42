import type { Metadata } from "next";
import Link from "next/link";
import ComparisonTable from "@/components/ComparisonTable";
import HerstellerRechner from "@/components/HerstellerRechner";
import SlotCard from "@/components/SlotCard";
import ContactForm from "@/components/ContactForm";
import SlotFeatureTable from "@/components/SlotFeatureTable";
import { SLOTS, ANALYTICS_PAKETE } from "@/lib/slots";

export const metadata: Metadata = {
  title: "Für Hersteller – Miete deinen Platz im Retail",
  description:
    "Stationärer Handel wie er sein sollte. 0% Handelsmarge, Regalfront ab 10 cm / 72 €/Monat, 3 Monate Mindestlaufzeit. Bewirb dein Produkt, verlinke deinen Shop, gewinne Fans jenseits von TikTok.",
};

const SCHRITTE = [
  {
    nr: "01",
    titel: "Bewerbung",
    beschreibung: "Kurze Anfrage. Wir schauen ob es passt. 24h Rückmeldung.",
  },
  {
    nr: "02",
    titel: "Gespräch",
    beschreibung: "30 Minuten. Position wählen. Alle Fragen klären.",
  },
  {
    nr: "03",
    titel: "Onboarding",
    beschreibung: "Ware rein. QR-Code, Traverse-Karte, Creator Playbook. Du drehst ein kurzes Video über deine Marke – wir zeigen es unserem Team damit sie dein Produkt bestmöglich präsentieren.",
  },
  {
    nr: "04",
    titel: "Live gehen",
    beschreibung: "Erster Post. WhatsApp-Ankündigung. Und auf Wunsch: dein eigener Promo-Tag im Store – einmal pro Quartal, freitags oder samstags.",
  },
  {
    nr: "05",
    titel: "Daten & Erlös",
    beschreibung: "Du behältst den Erlös minus Mietgebühr und 0,40 € pro verkauftem Artikel. Monatliche Abrechnung. Zahlen die zählen.",
  },
];

const WEN_WIR_SUCHEN = [
  { label: "Eigene Marke", detail: "Kein Konzern. Eine echte Story dahinter." },
  { label: "Fairer Preis", detail: "Kein Dumping. Produkt das seinen Preis wert ist." },
  { label: "Direkter Kontakt", detail: "Du willst Feedback. Nicht nur Umsatz." },
  { label: "Kein LEH-Konflikt", detail: "Keine Preisbindung die uns beide blockiert." },
];

const WAS_DU_BEKOMMST = [
  "Dein Regalplatz im Alexa Berlin",
  "Traverse-Karte mit deiner Story + QR-Code",
  "Tageszeit-Tracking & monatlicher Verkaufsbericht",
  "3 Monate Mindestlaufzeit – danach monatlich kündbar",
  "1 Karton reicht zum Start – kein Abnahmezwang",
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
      "0,40 € pro verkauftem Artikel – nicht pro Transaktion. Kauft ein Kunde 3 Produkte, fallen 3 × 0,40 € an. Keine Handelsmarge. Keine versteckten Kosten.",
  },
  {
    frage: "Wie funktioniert die Abrechnung?",
    antwort:
      "Monatlich automatisch. Du bekommst eine Aufstellung aller Verkäufe, der abgezogenen Mietgebühr und dein Nettoerlös wird überwiesen.",
  },
  {
    frage: "Was passiert wenn ich nicht genug verkaufe?",
    antwort:
      "3 Monate Mindestlaufzeit, danach monatlich kündbar. Unverkaufte Ware wird zurückgesandt – du bleibst bis zum Kassenbon Eigentümer. Kein Abnahmezwang, kein Mindestbestellwert.",
  },
  {
    frage: "Kann ich meinen Preis selbst festlegen?",
    antwort:
      "Ja. Vollständige Preishoheit. Wir nehmen keine Handelsmarge. Du setzt den Endkundenpreis, wir kassieren nur die Regalmiete.",
  },
  {
    frage: "Was ist die Mindestlaufzeit?",
    antwort:
      "3 Monate. Danach monatlich kündbar. Wir glauben, dass du bleiben willst – weil die Zahlen stimmen.",
  },
  {
    frage: "Wie liefere ich meine Ware an?",
    antwort:
      "Frei Haus an unsere Adresse – 1 Karton reicht zum Start. Hub42 räumt ein. Wenn Nachschub nötig ist, melden wir uns per WhatsApp. Du kannst auch persönlich vorbeikommen.",
  },
  {
    frage: "Was passiert bei Beschädigung, Diebstahl oder abgelaufenem MHD?",
    antwort:
      "Deine Ware bleibt bis zum Kassenbon dein Eigentum. Das Hub42-Team prüft regelmäßig Bestände und MHD. Beschädigte oder abgelaufene Ware wird dokumentiert und nach Absprache zurückgesandt oder entsorgt – auf keinen Fall still verkauft.",
  },
  {
    frage: "Wann und wie werde ich ausgezahlt?",
    antwort:
      "Monatlich bis zum 10. des Folgemonats per Überweisung. Du bekommst eine vollständige Aufstellung aller Verkäufe, der abgezogenen Gebühren und deines Nettoerlöses – als Beleg für deine Buchhaltung.",
  },
];

export default function HerstellerPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-green-dark pt-32 pb-20 border-b border-stone-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="w-2 h-2 rounded-full bg-bronze animate-pulse" />
            <span className="text-bronze text-xs font-mono tracking-[0.2em] uppercase">
              Eröffnung Oktober 2026 · Jetzt First-Mover-Platz sichern
            </span>
          </div>
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
            Für Hersteller
          </p>
          <h1
            className="text-cream text-[clamp(2.5rem,8vw,7rem)] leading-none tracking-widest mb-4"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Miete deinen Platz
            <br />
            <span className="text-bronze">im Retail.</span>
          </h1>
          <p className="text-stone text-base max-w-xl mb-6 leading-relaxed">
            Erlebe stationären Handel wie er sein sollte.
            Bewerbe deine Produkte. Verlinke deinen Shop.
            Gewinne Fans jenseits von TikTok.
          </p>
          <p className="text-bronze text-sm font-mono mb-8">
            Wir suchen Marken die besser sind.
          </p>

          {/* Facts strip */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 text-xs font-mono text-stone border-l-2 border-bronze pl-4">
            <span>0% Handelsmarge</span>
            <span>Ab 55 €/Monat</span>
            <span>3 Monate · dann monatlich kündbar</span>
            <span>41.000 Berliner täglich</span>
          </div>

          <div className="flex flex-wrap gap-4">
            <a
              href="#regalfront-anfragen"
              className="px-8 py-4 bg-bronze text-green-dark font-semibold rounded-sm hover:bg-bronze-light transition-colors text-sm"
            >
              Regalfläche anfragen →
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

      {/* Wen wir suchen */}
      <section className="bg-green-dark py-20 border-t border-stone-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Selektion
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest mb-3"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Nicht jedes Produkt.
              <br />
              <span className="text-bronze">Das hier schon.</span>
            </h2>
            <p className="text-stone text-sm max-w-lg">
              Hub42 ist kein Lager für alles. Wir suchen Marken die etwas zu sagen haben.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WEN_WIR_SUCHEN.map((k) => (
              <div
                key={k.label}
                className="bg-green-mid border border-stone-dark rounded-sm p-6 hover:border-bronze/30 transition-colors"
              >
                <p
                  className="text-bronze text-xl tracking-widest mb-2"
                  style={{ fontFamily: "var(--font-bebas)" }}
                >
                  {k.label}
                </p>
                <p className="text-stone text-sm leading-relaxed">{k.detail}</p>
              </div>
            ))}
          </div>
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

      {/* Regalfront-Positionen */}
      <section className="bg-green-dark py-20 border-t border-stone-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Preise
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest mb-4"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              5 Positionen.
              <span className="text-bronze"> Ein Ziel.</span>
            </h2>
            <p className="text-stone text-sm max-w-lg mb-10">
              Du mietest Regalfläche nach cm Breite — so viel oder so wenig wie dein Produkt braucht.
              Jeder gemietete cm bringt dir automatisch die gleiche Breite als Werbefläche dazu.
            </p>

            {/* Cm-Konzept Visualisierung */}
            <div className="border border-stone-dark bg-green-mid/30 p-6 max-w-xl">
              <p className="text-bronze text-xs font-mono tracking-[0.2em] uppercase mb-4">So sieht dein Platz aus</p>

              {/* Shelf diagram */}
              <div className="relative">
                {/* Width indicator */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-px bg-stone-dark" />
                  <span className="text-stone text-xs font-mono whitespace-nowrap">z. B. 30 cm</span>
                  <div className="flex-1 h-px bg-stone-dark" />
                </div>

                {/* Ad surface */}
                <div className="border border-bronze/50 bg-bronze/10 px-4 py-3 text-center mb-0">
                  <p className="text-bronze text-xs font-mono font-semibold">WERBEFLÄCHE</p>
                  <p className="text-stone/60 text-[10px] font-mono mt-0.5">Traverse-Karte · 15 cm hoch · deine Story + QR-Code</p>
                </div>

                {/* Shelf surface */}
                <div className="border border-stone-dark border-t-0 bg-green-mid px-4 py-4 text-center">
                  <p className="text-cream text-xs font-mono">REGALFRONT</p>
                  <p className="text-stone/60 text-[10px] font-mono mt-0.5">deine Produkte · 3 Ebenen · 60 cm tief</p>
                </div>

                {/* Height label */}
                <div className="absolute -right-16 top-6 flex flex-col items-center gap-0.5 hidden sm:flex">
                  <div className="w-px flex-1 bg-stone-dark" style={{ minHeight: 24 }} />
                  <span className="text-stone/50 text-[10px] font-mono rotate-90 whitespace-nowrap">15 cm</span>
                  <div className="w-px flex-1 bg-stone-dark" style={{ minHeight: 24 }} />
                </div>
              </div>

              <p className="text-stone/50 text-xs font-mono mt-4">
                Miete 30 cm → Preis Standard: 30 × 9,00 € = <span className="text-stone">270 €/Monat</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {[...SLOTS].reverse().map((slot, i) => (
              <SlotCard key={slot.name} slot={slot} index={i} />
            ))}
          </div>

          <div className="mt-12">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
              Was ist in welcher Position?
            </p>
            <SlotFeatureTable />
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

            {/* Checkout-Gebühr + Transparenz */}
            <div>
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
                Transparenz
              </p>
              <h2
                className="text-cream text-[clamp(2rem,4vw,3rem)] leading-none tracking-widest mb-8"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                So verdient
                <span className="text-bronze"> Hub42</span>
              </h2>

              {/* Slot-Miete */}
              <div className="border-l-2 border-stone-dark pl-6 mb-6">
                <p className="text-cream text-sm font-semibold mb-1">Regalmiete → Fixkosten</p>
                <p className="text-stone text-sm leading-relaxed">
                  Die Miete deckt den Laden: Alexa-Miete, unser Team, Infrastruktur.
                  Kein Cent davon ist Gewinn – es hält den Store am Laufen.
                </p>
              </div>

              {/* Checkout-Fee */}
              <div className="border-l-2 border-bronze pl-6">
                <p className="text-bronze text-4xl mb-1" style={{ fontFamily: "var(--font-bebas)" }}>
                  0,40 €
                </p>
                <p className="text-stone text-sm mb-2">pro verkauftem Artikel → unsere Marge</p>
                <p className="text-stone text-sm leading-relaxed">
                  Die Checkout-Fee ist unsere Gewinnmarge – und deckt EC-Kartengebühren.
                  Wir verdienen erst wenn du verkaufst.
                  Kein Umsatz bei dir = kein Umsatz bei uns.
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
            Kein Platz frei?
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
            Kein freier Platz bedeutet nicht das Ende. Dein Produkt landet in der kurierten
            Überraschungskiste – ohne Mietgebühr, aber mit echtem Kundenkontakt.
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
      <section id="regalfront-anfragen" className="bg-green-mid py-20 border-t border-stone-dark">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Jetzt starten
            </p>
            <h2
              className="text-cream text-[clamp(2rem,5vw,4rem)] leading-none tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Regalfläche anfragen
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

import type { Metadata } from "next";
import Link from "next/link";
import ComparisonTable from "@/components/ComparisonTable";
import HerstellerRechner from "@/components/HerstellerRechner";
import SlotCard from "@/components/SlotCard";
import ContactForm from "@/components/ContactForm";
import SlotFeatureTable from "@/components/SlotFeatureTable";
import CountdownTimer from "@/components/CountdownTimer";
import TrustBadges from "@/components/TrustBadges";
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
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="w-2 h-2 rounded-full bg-bronze animate-pulse" />
            <span className="text-bronze text-xs font-mono tracking-[0.2em] uppercase">
              Eröffnung Oktober 2026 · Jetzt First-Mover-Platz sichern
            </span>
          </div>
          <div className="mb-6">
            <CountdownTimer />
          </div>
          <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
            Für Hersteller
          </p>
          <h1
            className="text-cream text-[clamp(2.5rem,8vw,7rem)] leading-none tracking-widest mb-4"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Wir setzen auf dich.
            <br />
            <span className="text-bronze">Du setzt auf uns.</span>
          </h1>
          <p className="text-stone text-base max-w-xl mb-3 leading-relaxed">
            Dein Produkt. Dein Preis. Deine Daten.
            Wir bringen den Ort, die Kunden, die Infrastruktur.
            Und wir verdienen erst wenn du verkaufst.
          </p>
          <p className="text-bronze text-sm font-mono mb-8">
            Stationärer Handel wie er sein sollte.
          </p>

          {/* Facts strip */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 text-xs font-mono text-stone border-l-2 border-bronze pl-4">
            <span>0% Handelsmarge</span>
            <span>Ab 55 €/Monat</span>
            <span>3 Monate · dann monatlich kündbar</span>
            <span>41.000 Berliner täglich</span>
          </div>

          <div className="flex flex-wrap gap-4 mb-8">
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
          <TrustBadges />
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

      {/* Gemeinsam wachsen */}
      <section className="bg-green-dark py-20 border-t border-stone-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
                Unser Modell
              </p>
              <h2
                className="text-cream text-[clamp(2rem,5vw,4.5rem)] leading-none tracking-widest mb-6"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                Dein Erfolg ist
                <br />
                <span className="text-bronze">unser Geschäftsmodell.</span>
              </h2>
              <p className="text-stone text-base leading-relaxed mb-6 max-w-lg">
                Wir nehmen 0,40 € pro verkauftem Artikel. Nicht pro Monat, nicht pauschal —
                pro Verkauf. Das bedeutet: Wenn du nichts verkaufst, verdienen wir kaum etwas.
                Wir sind strukturell daran interessiert, dass dein Produkt läuft.
              </p>
              <p className="text-stone text-base leading-relaxed max-w-lg">
                Kein klassischer Vermieter denkt so. Wir schon — weil wir das Modell so
                gebaut haben. Tasting, Story-Fläche, Creator Playbook, Promo-Tag im Store:
                das sind keine Extras. Das ist unser Beitrag zu deinem Verkauf.
              </p>
            </div>

            {/* Visual: aligned incentives */}
            <div className="grid grid-cols-1 gap-px bg-stone-dark/20">
              {[
                {
                  label: "Du bringst",
                  items: ["Dein Produkt", "Deine Story", "Deinen Preis", "Deine Ware auf Kommission"],
                },
                {
                  label: "Wir bringen",
                  items: ["Alexa Berlin · 41.000 Besucher täglich", "Store, Kasse, Warenpflege", "Tasting & Story-Fläche am Regal", "Daten & monatliche Abrechnung"],
                },
                {
                  label: "Wir verdienen beide wenn",
                  items: ["Dein Produkt verkauft wird", "Kunden wiederkommen", "Deine Marke wächst"],
                  highlight: true,
                },
              ].map((block) => (
                <div
                  key={block.label}
                  className={`p-8 ${block.highlight ? "bg-bronze/10 border border-bronze/30" : "bg-green-dark"}`}
                >
                  <p className={`text-xs font-mono tracking-[0.2em] uppercase mb-3 ${block.highlight ? "text-bronze" : "text-stone/60"}`}>
                    {block.label}
                  </p>
                  <ul className="space-y-1.5">
                    {block.items.map((item) => (
                      <li key={item} className={`flex items-start gap-2 text-sm ${block.highlight ? "text-cream" : "text-stone"}`}>
                        <span className="text-bronze/50 shrink-0 mt-0.5">—</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
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
                <div className="absolute -right-16 top-6 hidden sm:flex flex-col items-center gap-0.5">
                  <div className="w-px flex-1 bg-stone-dark" style={{ minHeight: 24 }} />
                  <span className="text-stone/50 text-[10px] font-mono rotate-90 whitespace-nowrap">15 cm</span>
                  <div className="w-px flex-1 bg-stone-dark" style={{ minHeight: 24 }} />
                </div>
              </div>

              <p className="text-stone/50 text-xs font-mono mt-4">
                Miete 30 cm → Preis Standard: 30 × 13,11 € = <span className="text-stone">393 €/Monat</span>
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
          {/* Scarcity signal */}
          <div className="flex items-center gap-3 mb-8 px-4 py-3 border border-bronze/30 bg-bronze/5">
            <span className="w-2 h-2 rounded-full bg-bronze animate-pulse shrink-0" />
            <p className="text-bronze text-xs font-mono tracking-[0.15em]">
              Noch 8 von 12 First-Mover-Slots verfügbar · Preisgarantie bis Eröffnung
            </p>
          </div>

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
            <div className="flex flex-col items-center gap-1 mt-3">
              <p className="text-stone text-sm">
                Miguel Tisler · Gründer
              </p>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm">
                <a href="tel:+4917787956437" className="text-bronze hover:text-bronze-light transition-colors font-mono">
                  0177 879 56 37
                </a>
                <a href="mailto:info@tryhub42.de" className="text-bronze hover:text-bronze-light transition-colors">
                  info@tryhub42.de
                </a>
                <a
                  href="https://www.linkedin.com/in/miguel-tisler-0a2976120/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bronze/60 hover:text-bronze transition-colors font-mono text-xs self-center"
                >
                  LinkedIn →
                </a>
              </div>
            </div>
          </div>

          {/* Urgency box */}
          <div className="border-l-4 border-bronze bg-bronze/5 px-5 py-4 mb-8">
            <p className="text-cream text-sm font-semibold mb-1">
              First-Mover-Konditionen: 55 €/Monat · Preisgarantie für gesamte Laufzeit
            </p>
            <p className="text-stone text-xs font-mono">
              Gültig für Anfragen bis Eröffnung Oktober 2026. Danach reguläre Preise.
            </p>
          </div>

          <ContactForm />

          <div className="mt-6 text-center">
            <p className="text-stone/50 text-xs font-mono mb-2">oder direkt</p>
            <a
              href="https://wa.me/4917787956437?text=Hallo%20Miguel%2C%20ich%20interessiere%20mich%20f%C3%BCr%20einen%20Slot%20bei%20Hub42."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white text-xs font-semibold rounded-full hover:bg-[#1ebe5d] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Per WhatsApp schreiben
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

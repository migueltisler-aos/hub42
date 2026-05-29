/* Section 7 – Daten-Layer / Funnel. Server Component. */
import FunnelSVG from "@/components/deck/FunnelSVG";

export default function DeckFunnel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 items-start">
      {/* Daten-Layer erklärt */}
      <div>
        <p className="text-cream/80 text-base leading-relaxed mb-6">
          Jeder Schritt im Laden wird gemessen – nicht der einzelne Mensch, sondern der
          Strom. So sieht eine Marke zum ersten Mal, was im Regal wirklich passiert.
        </p>
        <ul className="space-y-3">
          {[
            ["People-Counter am Eingang", "Wie viele kommen rein – pro Tag, pro Stunde."],
            ["Gang-Frequenz", "Wie viele erreichen deinen Regalgang."],
            ["Tasting- & QR-Interaktionen", "Wer probiert, wer scannt, wer in deinen Shop geht."],
            ["Conversion & Abverkauf", "Was tatsächlich gekauft wird – tagesgenau."],
          ].map(([t, d]) => (
            <li key={t} className="flex items-start gap-3">
              <span className="text-bronze text-lg leading-none mt-0.5" aria-hidden="true">◆</span>
              <div>
                <p className="text-cream text-sm font-semibold">{t}</p>
                <p className="text-stone text-sm leading-relaxed">{d}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-bronze/70 text-xs font-mono leading-relaxed border-t border-stone-dark mt-6 pt-4">
          Das ist der Layer, den FutureFoodCo &amp; Co. sonst nur simulieren: echte
          In-vivo-Daten statt Workshop-Schätzung.
        </p>
      </div>

      {/* Funnel */}
      <div className="bg-green-dark border border-stone-dark/50 p-5 md:p-6">
        <FunnelSVG />
        <p className="text-stone text-xs font-mono mt-4 pt-3 border-t border-stone-dark leading-relaxed">
          Modellrechnung, konservativ. 41.000 ist die Alexa-Standortfrequenz (Obergrenze) –
          nicht Hub42-Reichweite. Store-Eingang im realistischen Korridor 600–800/Tag.
        </p>
      </div>
    </div>
  );
}

import ShelfSlotSVG from "@/components/deck/ShelfSlotSVG";

const CATS = ["Food", "Drinks", "Drogerie", "Non-Food"];

const PERSONAS = [
  { tag: "Newcomer", text: "Tee-Startup, 20 cm Basis. Test ohne Risiko." },
  { tag: "Etabliert", text: "Lokal-Brand, 30 cm Standard. Skalieren mit Daten." },
  {
    tag: "Hero",
    text: "Bekannte Marke, 40 cm Premium + Tasting-Bar. Maximale Sichtbarkeit, eigene Events.",
  },
];

export default function DeckErlebnis() {
  return (
    <div className="space-y-12">
      {/* ── Store-Übersicht: 4 Regale · 4 Kategorien · 4 Ebenen ── */}
      <div>
        <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-4">
          Der Store auf einen Blick
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATS.map((cat, ci) => (
            <div key={cat} className="border border-stone-dark/50 bg-green-dark">
              <div className="px-3 py-2 border-b border-bronze/20">
                <p className="text-cream text-sm font-semibold leading-tight">{cat}</p>
                <p className="text-stone text-[10px] font-mono">Regal {ci + 1}</p>
              </div>
              <div className="p-2 space-y-1">
                {[
                  { z: "Premium", hi: true },
                  { z: "Standard", hi: false },
                  { z: "Basis", hi: false },
                ].map((lvl) => (
                  <div
                    key={lvl.z}
                    className={`flex items-center justify-between px-2 h-5 border ${
                      lvl.hi ? "border-bronze/50 bg-bronze/10" : "border-stone-dark/40"
                    }`}
                  >
                    <span
                      className={`text-[9px] font-mono ${lvl.hi ? "text-bronze" : "text-stone/70"}`}
                    >
                      {lvl.z}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Hero Wall + Tasting – eigene Store-Elemente */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="border border-bronze/40 bg-bronze/10 px-3 py-2">
            <p className="text-bronze text-sm font-semibold leading-tight">Hero Wall</p>
            <p className="text-stone text-[10px] font-mono">Stirnseite · maximale Sichtbarkeit</p>
          </div>
          <div className="border border-bronze/40 bg-bronze/10 px-3 py-2">
            <p className="text-bronze text-sm font-semibold leading-tight">Tasting Bar</p>
            <p className="text-stone text-[10px] font-mono">Probieren · Aktion · Event</p>
          </div>
        </div>
        <p className="text-stone text-xs font-mono mt-3 leading-relaxed">
          4 Regale · 4 Kategorien · 3 Ebenen je Regal (
          <span className="text-bronze/70">Basis · Standard · Premium = Augenhöhe</span>) – plus
          Hero Wall &amp; Tasting Bar. Dein Slot lebt in einer dieser Kategorien; unten der
          Detailblick auf eine einzelne Regalfront.
        </p>

        {/* Persona-Kacheln – aus Preisliste wird Beratung */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-cream/10 mt-6">
          {PERSONAS.map((p) => (
            <div key={p.tag} className="bg-green-dark p-5">
              <p className="text-bronze text-xs font-mono uppercase tracking-widest mb-2">
                {p.tag}
              </p>
              <p className="text-cream/90 text-sm leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 items-start">
      {/* ── Visualisierung der gemieteten Fläche ──────────── */}
      <div>
        <div className="bg-green-dark border border-stone-dark/50 p-6">
          <ShelfSlotSVG />
        </div>
        <p className="text-stone text-xs font-mono mt-3 leading-relaxed">
          Deine Breite, volle Höhe: <span className="text-cream/70">15 cm Werbefläche</span> für
          deine Story, <span className="text-cream/70">4×4 cm Preisauszeichnung</span>{" "}
          oben rechts. Oben &amp; unten <span className="text-cream/70">Stauraum / Nachschub</span> (Verkaufsstauraum
          60 cm Tiefe), dazwischen drei Verkaufs-Ebenen nach Preisklasse –{" "}
          <span className="text-cream/70">Augenhöhe = Premium</span>. Plus ein eigener Event-Tag pro
          Quartal.
        </p>
      </div>

      {/* ── Zwei klar getrennte Argumente ─────────────────── */}
      <div className="space-y-6">
        {/* 1. Discovery → Online-Repurchase */}
        <div className="border border-bronze/20 bg-green-dark p-6">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-bronze font-mono text-sm">01</span>
            <h3 className="text-cream text-xl tracking-wide" style={{ fontFamily: "var(--font-bebas)" }}>
              Discovery → Wiederkauf im eigenen Shop
            </h3>
          </div>
          <p className="text-stone text-sm leading-relaxed mb-3">
            Der QR-Code auf deiner Produktkarte führt direkt in deinen Online-Shop. Wer dich im
            Store entdeckt, wird potenziell Stammkunde – der teure Erstkontakt passiert hier, der
            Wiederkauf läuft danach margenfrei über deinen eigenen Kanal.
          </p>
          <p className="text-bronze/70 text-xs font-mono leading-relaxed border-t border-bronze/15 pt-3">
            Dieser Wiederkauf-Effekt ist im Rechner bewusst <span className="text-bronze">nicht</span>{" "}
            eingerechnet – er kommt on top.
          </p>
        </div>

        {/* 2. Tasting + Event-Recht */}
        <div className="border border-bronze/20 bg-green-dark p-6">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-bronze font-mono text-sm">02</span>
            <h3 className="text-cream text-xl tracking-wide" style={{ fontFamily: "var(--font-bebas)" }}>
              Tasting &amp; Event-Recht
            </h3>
          </div>
          <p className="text-stone text-sm leading-relaxed mb-4">
            Probieren ist im Laden kostenlos – du stellst nur das Material. Wer probiert, kauft
            öfter als wer nur schaut.
          </p>
          <div className="flex items-start gap-3">
            <span className="text-bronze text-lg leading-none mt-0.5" aria-hidden="true">
              ◆
            </span>
            <p className="text-cream/80 text-sm leading-relaxed">
              Dazu: <span className="text-cream">1× pro Quartal ein eigener Event-Tag</span> auf
              deiner Fläche – Mini-Expo-Format. Meet-the-Founder, Launch, Tasting-Special: deine
              Bühne mitten am Alexanderplatz.
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

import {
  DEFAULTS,
  LEH_DEFAULTS,
  netLEH,
  netOnline,
  netHub,
} from "@/lib/deck-economics";

function fmt(n: number, d = 2) {
  return n.toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
}
const signedEur = (n: number) => `${n >= 0 ? "+" : "−"}${fmt(Math.abs(n))} €`;

/* Vergleichsvolumen für den statischen Netto-Erlös (explizit genannt) */
const SALES_REF = 50;
const A = { ...DEFAULTS, sales: SALES_REF };

const CHANNELS = [
  {
    key: "leh",
    name: "LEH / Supermarkt",
    net: netLEH(A.vk),
    sub: "Großhandelspreis, −" + LEH_DEFAULTS.margePct + " % Marge",
    tone: "stone" as const,
  },
  {
    key: "online",
    name: "Eigener Online-Shop",
    net: netOnline(A),
    sub: "voller VK, −Fulfillment −" + fmt(A.cac, 0) + " € CAC",
    tone: "neg" as const,
  },
  {
    key: "hub42",
    name: "Hub42",
    net: netHub(A),
    sub: "voller VK, −Fees −Slot-Anteil",
    tone: "hub" as const,
  },
];

interface Row {
  label: string;
  leh: string | boolean;
  online: string | boolean;
  hub42: string | boolean;
  hi?: boolean;
}

const ROWS: Row[] = [
  { label: "Handelsmarge", leh: "30–50 %", online: "0 %", hub42: "0 %", hi: true },
  { label: "Preishoheit", leh: false, online: true, hub42: true, hi: true },
  { label: "Eigene Kundendaten", leh: false, online: true, hub42: true, hi: true },
  { label: "Physische Sichtbarkeit", leh: true, online: false, hub42: true },
  {
    label: "Reichweite",
    leh: "national – wenn gelistet",
    online: "nur wer dich kennt",
    hub42: "41.000/Tag am Alexa → ~600–800 im Store",
    hi: true,
  },
  {
    label: "Einstieg",
    leh: "2.000–50.000 €",
    online: "Shop + Ads laufend",
    hub42: "ab 59 € / Monat",
    hi: true,
  },
  {
    label: "Warenrisiko",
    leh: "Abnahme / Rücknahme",
    online: "du lagerst & versendest",
    hub42: "Konsignation – dein Eigentum",
    hi: true,
  },
  { label: "Entscheidungszeit", leh: "6–18 Monate", online: "sofort", hub42: "1–2 Wochen", hi: true },
];

function Cell({ value, accent }: { value: string | boolean; accent?: "hub" | "neg" | "muted" }) {
  if (typeof value === "boolean") {
    return (
      <span
        className={`font-mono text-base ${
          value
            ? accent === "hub"
              ? "text-green-400 font-semibold"
              : "text-cream"
            : "text-red-400/60"
        }`}
      >
        {value ? "✓" : "✕"}
      </span>
    );
  }
  return (
    <span
      className={
        accent === "hub"
          ? "text-green-400 font-semibold"
          : accent === "neg"
            ? "text-red-400/70"
            : "text-stone"
      }
    >
      {value}
    </span>
  );
}

export default function DeckModell() {
  return (
    <div className="space-y-12">
      {/* ── Wie das Modell funktioniert ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-cream/10">
        {[
          {
            n: "01",
            t: "Regalplatz buchen",
            d: "Du buchst einen Regalplatz – bemessen am Platzbedarf deines Produkts (Breite, €/cm). Ein F&B-Produkt braucht ~5 cm. Die Miete deckt unsere Fixkosten.",
          },
          {
            n: "02",
            t: "Wir verkaufen für dich",
            d: "Pro verkauftem Artikel: 0,30 € Checkout-Fee, Zahlungsgebühr durchgereicht. Keine Handelsmarge.",
          },
          {
            n: "03",
            t: "Du behältst die Hoheit",
            d: "Du setzt den Preis. Dein Produkt bleibt dein Eigentum, bis es verkauft ist. Kein Abnahmezwang.",
          },
        ].map((s) => (
          <div key={s.n} className="bg-green-dark p-6">
            <p className="text-bronze/50 font-mono text-sm mb-3">{s.n}</p>
            <p
              className="text-cream text-xl mb-2 tracking-wide"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              {s.t}
            </p>
            <p className="text-stone text-sm leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>

      {/* ── §383 HGB in Klartext ──────────────────────────── */}
      <div className="border-l-2 border-bronze pl-5 py-1 max-w-2xl">
        <p className="text-bronze/60 text-xs font-mono tracking-[0.3em] uppercase mb-2">
          Konsignation · § 383 HGB, ohne Fachjargon
        </p>
        <p className="text-cream/80 text-base leading-relaxed">
          Dein Produkt bleibt <span className="text-cream">dein Eigentum</span>, bis es
          verkauft ist. Hub42 verkauft es in deinem Namen – du setzt den Preis, wir nehmen{" "}
          <span className="text-cream">keine Handelsmarge</span> und gehen kein Eigentum ein.
          Heißt: kein Abnahmezwang, kein Verkaufsrisiko, keine Listungsverhandlung.
        </p>
      </div>

      {/* ── Netto-Erlös pro Artikel (statisch, Volumen genannt) ── */}
      <div>
        <h3
          className="text-cream text-2xl tracking-wide mb-1"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Was bleibt der Marke – pro verkauftem Artikel?
        </h3>
        <p className="text-stone text-sm mb-6">
          Bei VK {fmt(A.vk, 0)} €, {SALES_REF} Sales/Monat, {A.regalCm} cm Regal. Online inkl.{" "}
          {fmt(A.cac, 0)} € CAC (typischer DTC-F&amp;B-Wert), LEH-Marge {LEH_DEFAULTS.margePct} %
          (konservativ).{" "}
          <span className="text-stone/60">Alles im Rechner live anpassbar.</span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-cream/10">
          {CHANNELS.map((ch) => (
            <div
              key={ch.key}
              className={`p-6 text-center ${
                ch.tone === "hub" ? "bg-green-mid/40 border border-bronze/30" : "bg-green-dark"
              }`}
            >
              <p className="text-cream/50 text-xs font-mono uppercase tracking-widest mb-3">
                {ch.name}
              </p>
              <p
                className="text-4xl md:text-5xl"
                style={{
                  fontFamily: "var(--font-bebas)",
                  color:
                    ch.tone === "hub"
                      ? "#6BA888"
                      : ch.tone === "neg"
                        ? "#d98a8a"
                        : "#B0A494",
                }}
              >
                {signedEur(ch.net)}
              </p>
              <p className="text-cream/30 text-xs font-mono mt-2">{ch.sub}</p>
            </div>
          ))}
        </div>
        <p className="text-stone text-xs font-mono mt-3 leading-relaxed">
          Hub42 ist volumenabhängig (fixe Slot-Miete), LEH &amp; Online nicht – deshalb ein
          genanntes Vergleichsvolumen. Der eigene Online-Shop ist bei kalter Erstakquise pro
          Einzelartikel defizitär; profitabel wird er erst über Wiederkäufe.
        </p>
      </div>

      {/* ── Qualitativer Vergleich ────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 text-stone font-mono text-xs tracking-widest uppercase border-b border-stone-dark min-w-[130px]">
                Kriterium
              </th>
              <th className="text-left p-3 text-stone font-mono text-xs tracking-widest uppercase border-b border-stone-dark">
                LEH
              </th>
              <th className="text-left p-3 text-stone font-mono text-xs tracking-widest uppercase border-b border-stone-dark">
                Online-Shop
              </th>
              <th className="text-left p-3 font-mono text-xs tracking-widest uppercase border-b border-bronze/40">
                <span className="text-bronze">Hub42</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => (
              <tr
                key={row.label}
                className={`border-b border-stone-dark/50 ${i % 2 === 0 ? "" : "bg-green-mid/30"}`}
              >
                <td className="p-3">
                  <p className="text-cream font-medium">{row.label}</p>
                </td>
                <td className="p-3">
                  <Cell value={row.leh} accent="muted" />
                </td>
                <td className="p-3">
                  <Cell value={row.online} accent="muted" />
                </td>
                <td className="p-3">
                  <Cell value={row.hub42} accent={row.hi ? "hub" : undefined} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

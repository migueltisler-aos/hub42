/* Schematische, drucktaugliche Darstellung einer gemieteten Regalfront:
   Werbefläche/Story (15 cm) + 4×4 cm Preisauszeichnung oben rechts,
   darunter 5 Ebenen nach Preisklasse (Augenhöhe = Premium), unterste
   Ebene = Nachschub / Verkaufsstauraum. Inline-SVG, feste Farben. */

const C = {
  line: "#C8964A", // bronze
  soft: "#7A6E62", // stone-dark
  cream: "#F9F5EE",
  stone: "#B0A494",
  fill: "#1A3228", // green-muted
  hi: "#2A4A3C", // green-dark (Highlight-Fond)
};

const LEVELS: { name: string; rate: string | null; tag?: string; restock?: boolean }[] = [
  { name: "Stauraum", rate: null, tag: "Reserve / Überbestand", restock: true },
  { name: "Premium", rate: "10,80 €/cm", tag: "Augenhöhe" },
  { name: "Standard", rate: "9,00 €/cm" },
  { name: "Basis", rate: "7,20 €/cm" },
  { name: "Nachschub", rate: null, tag: "Verkaufsstauraum · 60 cm Tiefe", restock: true },
];

const X0 = 30;
const W = 196;
const TOP = 138; // erste Ebene
const H = 58; // Ebenenhöhe

export default function ShelfSlotSVG({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 380 480"
      role="img"
      aria-label="Gemietete Regalfront: Werbefläche, Preisauszeichnung, 5 Ebenen nach Preisklasse, unterste Ebene Nachschub"
      className={className}
      style={{ width: "100%", height: "auto" }}
    >
      {/* Maß: Breite (gehört durchgängig dir) */}
      <line x1={X0} y1="22" x2={X0 + W} y2="22" stroke={C.soft} strokeWidth="1" />
      <line x1={X0} y1="17" x2={X0} y2="27" stroke={C.soft} strokeWidth="1" />
      <line x1={X0 + W} y1="17" x2={X0 + W} y2="27" stroke={C.soft} strokeWidth="1" />
      <text x={X0 + W / 2} y="14" fill={C.stone} fontSize="9" fontFamily="monospace" textAnchor="middle">
        Platzbedarf deines Produkts (cm)
      </text>

      {/* Werbefläche / Story (15 cm) */}
      <rect x={X0} y="34" width={W} height="86" fill={C.fill} stroke={C.line} strokeWidth="1.5" />
      <text x={X0 + 10} y="54" fill={C.line} fontSize="10" fontFamily="monospace" letterSpacing="1.5">
        WERBEFLÄCHE
      </text>
      <text x={X0 + 10} y="72" fill={C.cream} fontSize="12">
        Deine Story
      </text>
      <text x={X0 + 10} y="88" fill={C.stone} fontSize="8.5">
        Wer du bist · warum dein Produkt
      </text>
      <text x={X0 + 10} y="100" fill={C.stone} fontSize="8.5">
        QR-Code zu deinem Online-Shop
      </text>

      {/* 4×4 cm Preisauszeichnung – immer oben rechts */}
      <rect x={X0 + W - 42} y="42" width="36" height="36" fill="none" stroke={C.line} strokeWidth="1.5" strokeDasharray="3 2" />
      <text x={X0 + W - 24} y="58" fill={C.line} fontSize="8" fontFamily="monospace" textAnchor="middle">PREIS</text>
      <text x={X0 + W - 24} y="70" fill={C.stone} fontSize="7" fontFamily="monospace" textAnchor="middle">4×4 cm</text>

      {/* Höhenmaß Werbefläche */}
      <line x1={X0 + W + 8} y1="34" x2={X0 + W + 8} y2="120" stroke={C.soft} strokeWidth="1" />
      <line x1={X0 + W + 4} y1="34" x2={X0 + W + 12} y2="34" stroke={C.soft} strokeWidth="1" />
      <line x1={X0 + W + 4} y1="120" x2={X0 + W + 12} y2="120" stroke={C.soft} strokeWidth="1" />
      <text x={X0 + W + 16} y="80" fill={C.stone} fontSize="9" fontFamily="monospace">15 cm</text>

      {/* 5 Ebenen nach Preisklasse */}
      {LEVELS.map((lvl, i) => {
        const y = TOP + i * H;
        const eye = lvl.tag === "Augenhöhe";
        return (
          <g key={i}>
            {/* Highlight-Fond bei Augenhöhe */}
            {eye && (
              <rect x={X0 - 4} y={y - 4} width={W + 8} height={H} fill={C.hi} stroke={C.line} strokeWidth="1.5" />
            )}
            {/* Regalboden */}
            <line x1={X0} y1={y + H - 12} x2={X0 + W} y2={y + H - 12} stroke={C.line} strokeWidth="2" />

            {/* Inhalt: Produkte oder Nachschub-Kartons */}
            {lvl.restock
              ? [0, 1, 2].map((k) => (
                  <g key={k}>
                    <rect x={X0 + 8 + k * 62} y={y + 6} width="52" height="34" fill="none" stroke={C.soft} strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={X0 + 8 + k * 62} y1={y + 17} x2={X0 + 8 + k * 62 + 52} y2={y + 17} stroke={C.soft} strokeWidth="1" strokeDasharray="2 2" />
                  </g>
                ))
              : [0, 1, 2, 3].map((k) => (
                  <rect key={k} x={X0 + 8 + k * 47} y={y + 4} width="36" height="34" fill={C.fill} stroke={eye ? C.line : C.soft} strokeWidth="1" />
                ))}

            {/* Klassen-Label rechts */}
            <text x={X0 + W + 16} y={y + 18} fill={eye ? C.line : C.cream} fontSize="11" fontWeight={eye ? "bold" : "normal"}>
              {lvl.name}
            </text>
            {lvl.rate ? (
              <text x={X0 + W + 16} y={y + 32} fill={C.stone} fontSize="9" fontFamily="monospace">
                {lvl.rate}
              </text>
            ) : null}
            {lvl.tag ? (
              <text x={X0 + W + 16} y={lvl.rate ? y + 44 : y + 32} fill={eye ? C.line : C.stone} fontSize={lvl.restock ? "8" : "8.5"} fontFamily="monospace">
                {lvl.tag}
              </text>
            ) : null}
          </g>
        );
      })}

      {/* Event-Fähnchen ganz unten */}
      <g>
        <line x1={X0} y1="468" x2={X0} y2="442" stroke={C.line} strokeWidth="1.5" />
        <path d={`M${X0} 442 L${X0 + 28} 448 L${X0} 454 Z`} fill={C.line} />
        <text x={X0 + 34} y="454" fill={C.cream} fontSize="9">
          1× / Quartal: dein Event-Tag
        </text>
      </g>
    </svg>
  );
}

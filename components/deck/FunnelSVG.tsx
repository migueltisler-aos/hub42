/* Section 7 – Conversion-Funnel als inline SVG (drucktauglich).
   Zahlen konservativ, Store-Eingang im realistischen Korridor 600–800/Tag. */

const STAGES = [
  { label: "Alexa-Frequenz", value: "41.000", unit: "Passanten / Tag", w: 100, conv: null },
  { label: "Store-Eingang", value: "~700", unit: "Besucher / Tag", w: 74, conv: "≈ 1,7 %" },
  { label: "In den Regalgang", value: "~300", unit: "/ Tag", w: 52, conv: "≈ 43 %" },
  { label: "Tasting / QR-Scan", value: "~60", unit: "/ Tag", w: 33, conv: "≈ 20 %" },
  { label: "Kauf", value: "~25", unit: "/ Tag", w: 19, conv: "≈ 40 %" },
];

const C = { line: "#C8964A", cream: "#F9F5EE", stone: "#B0A494", green: "#2A4A3C", soft: "#7A6E62" };
const LABEL_W = 132;
const BAR_X = LABEL_W + 8;
const BAR_MAX = 300;
const ROW_H = 64;

export default function FunnelSVG({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 560 ${STAGES.length * ROW_H + 16}`}
      role="img"
      aria-label="Conversion-Funnel: von 41.000 Alexa-Passanten zu rund 25 Käufen pro Tag"
      className={className}
      style={{ width: "100%", height: "auto" }}
    >
      <defs>
        <linearGradient id="funnelBar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.line} />
          <stop offset="1" stopColor={C.line} stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {STAGES.map((s, i) => {
        const y = 8 + i * ROW_H;
        const barW = (s.w / 100) * BAR_MAX;
        const mid = y + 22;
        return (
          <g key={s.label}>
            {/* Stufen-Label links */}
            <text x="0" y={mid - 2} fill={C.cream} fontSize="12">
              {s.label}
            </text>
            <text x="0" y={mid + 13} fill={C.stone} fontSize="9" fontFamily="monospace">
              {s.unit}
            </text>

            {/* Balken */}
            <rect x={BAR_X} y={y} width={barW} height="44" rx="2" fill="url(#funnelBar)" />
            <text
              x={BAR_X + 12}
              y={mid + 6}
              fill={C.green}
              fontSize="18"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {s.value}
            </text>

            {/* Conversion rechts */}
            {s.conv && (
              <text x={BAR_X + barW + 10} y={mid + 5} fill={C.line} fontSize="11" fontFamily="monospace">
                {s.conv}
              </text>
            )}

            {/* Verbindungslinie zur nächsten Stufe */}
            {i < STAGES.length - 1 && (
              <line
                x1={BAR_X + 2}
                y1={y + 44}
                x2={BAR_X + 2}
                y2={y + ROW_H}
                stroke={C.soft}
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

import { ImageResponse } from "next/og";

/* App-Icon der Aufgaben-App (PWA): Haken in Mint auf Stahl, die Farben der
   Testkaufhaus-Tokens. Liegt unter /api, weil der Proxy /api nicht schützt:
   Homescreen und Manifest laden das Icon ohne Login-Cookie.
   ?g=180 (Apple), 192, 512; ?maskable=1 lässt Rand für runde Masken. */

const GROESSEN = new Set([180, 192, 512]);

export function GET(request: Request) {
  const url = new URL(request.url);
  const g = Number(url.searchParams.get("g"));
  const groesse = GROESSEN.has(g) ? g : 192;
  // Maskable: der sichere Kreis hat 80 % Durchmesser, das Motiv bleibt darin.
  const motiv = Math.round(groesse * (url.searchParams.get("maskable") ? 0.46 : 0.6));

  return new ImageResponse(
    (
      <div
        style={{
          width: groesse,
          height: groesse,
          background: "#101313",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: motiv,
            height: motiv,
            background: "#66F2DF",
            borderRadius: Math.round(motiv * 0.08),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width={motiv * 0.7} height={motiv * 0.7} viewBox="0 0 24 24">
            <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#101313" strokeWidth={3.2} strokeLinecap="square" />
          </svg>
        </div>
      </div>
    ),
    {
      width: groesse,
      height: groesse,
      headers: { "Cache-Control": "public, max-age=604800, immutable" },
    }
  );
}

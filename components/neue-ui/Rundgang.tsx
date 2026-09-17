"use client";

/* Rundgang: Station im Foto oder in der Liste anfassen – sie leuchtet in
   beidem und zusätzlich im Grundriss. */

/* eslint-disable @next/next/no-img-element --
   Die Pins sitzen prozentual auf dem Konzeptfoto; next/image würde einen
   eigenen Wrapper zwischen Foto und Pin-Koordinaten legen. */

import { useState } from "react";
import { STOPS } from "@/lib/neue-ui/regal";

/* Ruhefarben der Grundriss-Flächen. Das Schaufenster ist Glas, der Rest Holz. */
const RUHE: Record<string, { fill: string; stroke: string }> = {
  schaufenster: { fill: "#BFD4DE", stroke: "#7FA2B2" },
  moebel: { fill: "#DCC19A", stroke: "#B9976B" },
};
const AKTIV = { fill: "#E8C88A", stroke: "#82571A" };

export default function Rundgang() {
  const [aktiv, setAktiv] = useState<string | null>(null);

  const farbe = (id: string) => {
    if (aktiv === id) return AKTIV;
    return id === "schaufenster" ? RUHE.schaufenster : RUHE.moebel;
  };

  /* Ein Rechteck des Grundrisses, das auf die aktive Station reagiert. */
  const flaeche = (id: string, props: React.SVGProps<SVGRectElement>) => {
    const { fill, stroke } = farbe(id);
    return <rect {...props} fill={fill} stroke={stroke} strokeWidth={2} />;
  };

  const anfassen = (id: string) => ({
    onMouseEnter: () => setAktiv(id),
    onMouseLeave: () => setAktiv((a) => (a === id ? null : a)),
    onFocus: () => setAktiv(id),
    onBlur: () => setAktiv((a) => (a === id ? null : a)),
  });

  return (
    <div className="tour">
      <div>
        <div className="shot">
          <img src="/konzept/store.png" alt="" />
          {STOPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className="pin"
              data-on={aktiv === s.id ? "1" : "0"}
              style={{ "--x": s.x, "--y": s.y } as React.CSSProperties}
              aria-label={`Station ${i + 1}: ${s.t}`}
              {...anfassen(s.id)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <p className="shot__cap">
          Konzeptansicht Hub42, Blick von der Ladenfront nach hinten
        </p>

        <div className="plan">
          <svg
            viewBox="0 0 620 440"
            role="img"
            aria-label="Grundriss der Hub42-Pilotfläche, 15 mal 10 Meter, mit Schaufenster links, zwei Gondeln in der Mitte, Regalwänden an Rück- und Seitenwand, Verkostungstheke, Talks-Pult und Kasse rechts."
          >
            <rect x="10" y="10" width="600" height="400" fill="#E4DFD5" stroke="#A9A296" strokeWidth={2} />
            <g stroke="rgba(30,36,29,.07)" strokeWidth={1}>
              <path d="M50 10V410M90 10V410M130 10V410M170 10V410M210 10V410M250 10V410M290 10V410M330 10V410M370 10V410M410 10V410M450 10V410M490 10V410M530 10V410M570 10V410" />
              <path d="M10 50H610M10 90H610M10 130H610M10 170H610M10 210H610M10 250H610M10 290H610M10 330H610M10 370H610" />
            </g>

            <g>
              {flaeche("schaufenster", { x: 10, y: 60, width: 16, height: 260, rx: 2 })}
              {flaeche("tasting", { x: 52, y: 250, width: 126, height: 42, rx: 3 })}
              {flaeche("wandB", { x: 150, y: 12, width: 300, height: 24, rx: 2 })}
              {flaeche("gondelA", { x: 232, y: 130, width: 44, height: 190, rx: 3 })}
              {flaeche("gondelB", { x: 336, y: 130, width: 44, height: 190, rx: 3 })}
              {flaeche("markenwand", { x: 594, y: 60, width: 16, height: 160, rx: 2 })}
              {flaeche("kasse", { x: 462, y: 228, width: 132, height: 48, rx: 3 })}
              {flaeche("talks", { x: 428, y: 322, width: 64, height: 42, rx: 3 })}
              <rect
                x="470"
                y="40"
                width="120"
                height="60"
                rx="2"
                fill="#EDEAE2"
                stroke="#A9A296"
                strokeWidth={2}
                strokeDasharray="5 4"
              />
            </g>

            <path d="M10 340v70" stroke="#E4DFD5" strokeWidth={6} />
            <path d="M10 340A60 60 0 0 1 70 400" fill="none" stroke="#A9A296" strokeWidth={1.5} strokeDasharray="4 4" />

            <g fontFamily="DM Mono, monospace" fontSize="10" fill="#6F695C" letterSpacing="0.6">
              <text x="34" y="195" textAnchor="start" transform="rotate(90 34 195)">Schaufenster · 6,5 m</text>
              <text x="115" y="276" textAnchor="middle" fill="#4A5449">Verkostung</text>
              <text x="300" y="53" textAnchor="middle">Regalwand B · 7,5 m</text>
              <text x="254" y="232" textAnchor="middle" fill="#4A5449" transform="rotate(-90 254 232)">Gondel A</text>
              <text x="358" y="232" textAnchor="middle" fill="#4A5449" transform="rotate(-90 358 232)">Gondel B</text>
              <text x="586" y="145" textAnchor="end" transform="rotate(90 586 145)">Markenwand</text>
              <text x="528" y="257" textAnchor="middle" fill="#4A5449">Kasse</text>
              <text x="460" y="348" textAnchor="middle" fill="#4A5449">Talks</text>
              <text x="530" y="75" textAnchor="middle">Lager / Pack</text>
              <text x="40" y="392" textAnchor="start">Eingang</text>
            </g>

            <g stroke="#82571A" strokeWidth={1} fill="none">
              <path d="M10 428H610" />
              <path d="M10 424v8" />
              <path d="M610 424v8" />
            </g>
            <text x="310" y="438" textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="10" fill="#82571A">
              15,0 m
            </text>
          </svg>
          <div className="plan__cap">
            <span>≈ 150 m² · 15,0 × 10,0 m · Raster 1 m</span>
            <span>Zwischennutzung „Alexa mini“</span>
          </div>
        </div>
      </div>

      <ul className="stops">
        {STOPS.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              className="stop"
              data-on={aktiv === s.id ? "1" : "0"}
              {...anfassen(s.id)}
            >
              <span className="stop__n">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <span className="stop__t">{s.t}</span>
                <span className="stop__d">{s.d}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

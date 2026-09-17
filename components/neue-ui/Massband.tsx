/* Maßband: fünf Produkte der gelisteten Marken auf einer Zentimeterskala.
   Rein statisch – die Skala ergibt sich aus den cm-Werten der Produkte. */

/* eslint-disable @next/next/no-img-element --
   Die Produktfotos liegen per mix-blend-mode: multiply auf dem Regalboden
   und werden über CSS-Variablen (--zoom, --dy) im Frontkasten justiert.
   next/image würde die Bilder in einen eigenen Wrapper legen und damit
   sowohl die Zentimeter-Geometrie als auch das Blending brechen. */

import { HERO, GAP_CM } from "@/lib/neue-ui/regal";

export default function Massband() {
  const warenCm = HERO.reduce((s, p) => s + p.cm, 0);
  const total = warenCm + GAP_CM * (HERO.length - 1);

  /* Startpunkt jeder Maßklammer: alles davor plus die Lücken dazwischen. */
  const klammern = HERO.map((p, i) => ({
    links: HERO.slice(0, i).reduce((s, q) => s + q.cm + GAP_CM, 0),
    cm: p.cm,
  }));

  const striche: number[] = [];
  for (let cm = 0; cm <= total; cm += 10) striche.push(cm);

  return (
    <div
      className="lineup"
      role="img"
      aria-label="Fünf Produkte der gelisteten Hub42-Marken nebeneinander, vermessen auf einer Zentimeterskala: Crazy Bastard 7 Pot Tropical 14 Zentimeter, Berlin Oats Crunchy Matcha Granola 22, Green Naturals Ashwagandha 16, Tekoha Matekaffee 18 und auteniQ Bio-Olivenöl 20 Zentimeter."
    >
      <div className="lineup__track" style={{ "--total": total } as React.CSSProperties}>
        <div className="lineup__row">
          {HERO.map((p) => (
            <div
              key={p.img}
              className="lineup__good"
              style={{ "--cm": p.cm, "--h": p.h } as React.CSSProperties}
            >
              <img
                className={"good__img" + (p.crop ? " good__img--crop" : "")}
                src={p.img}
                alt=""
                style={{ "--zoom": p.zoom, "--dy": p.dy } as React.CSSProperties}
              />
            </div>
          ))}
        </div>

        <div className="brackets">
          {klammern.map((k) => (
            <div
              key={k.links}
              className="bracket"
              style={{
                left: `calc(${k.links} * var(--pxcm))`,
                width: `calc(${k.cm} * var(--pxcm))`,
              }}
            >
              <span className="bracket__n">{k.cm} cm</span>
            </div>
          ))}
        </div>

        <div className="rule">
          {striche.map((cm) => (
            <span key={cm} className="rule__n" style={{ left: `calc(${cm} * var(--pxcm))` }}>
              {cm}
            </span>
          ))}
        </div>

        <p className="lineup__sum">
          {warenCm} cm Ware · {HERO.length} Marken · 4,64 € je Zentimeter und Monat
        </p>
      </div>
    </div>
  );
}

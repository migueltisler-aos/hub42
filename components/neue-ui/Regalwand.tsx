"use client";

/* Die Regalwand: drei Ebenen à 84 cm, jede Front anklickbar, eine Front
   am Ziehgriff breiter zu ziehen. Die Karteikarte rechts rechnet mit. */

/* eslint-disable @next/next/no-img-element --
   Produktfotos liegen per mix-blend-mode: multiply auf dem Sperrholz und
   werden über CSS-Variablen im Frontkasten justiert; next/image würde
   Wrapper und Größen setzen und beides brechen. */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CONF_POOL,
  MIN_CM,
  ORDER,
  WALL,
  ZONES,
  eur,
  istFrei,
  miete,
  rate,
  type Front,
  type ZoneKey,
} from "@/lib/neue-ui/regal";

/* QR-Marke auf der Traverse — wie im Regalkonzept */
function QrMarke() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
      <rect width="13" height="13" fill="none" />
      <path
        fill="#1E241D"
        d="M0 0h5v5H0zm1 1v3h3V1zM8 0h5v5H8zm1 1v3h3V1zM0 8h5v5H0zm1 1v3h3V9z"
      />
      <path
        fill="#1E241D"
        d="M6 0h1v2H6zm0 3h1v1H6zm1 3h1v1H7zM6 8h1v1H6zm2-2h1v1H8zm2 0h1v1h-1zm2 0h1v1h-1zM8 8h2v1H8zm3 0h2v1h-2zm-3 2h1v3H8zm2 1h3v1h-3zm2-2h1v1h-1z"
      />
    </svg>
  );
}

function Kisten({ anzahl }: { anzahl: number }) {
  return (
    <div className="crates" aria-label="Auer-Eurokisten als Nachschubplätze">
      {Array.from({ length: anzahl }, (_, i) => (
        <div className="crate" key={i} />
      ))}
    </div>
  );
}

const CONF_IDX = WALL.greifhoehe.findIndex((f) => istFrei(f) && f.conf);
const BUDDY_IDX = WALL.greifhoehe.findIndex((f) => istFrei(f) && f.buddy);
const CONF_START = WALL.greifhoehe[CONF_IDX].cm;

const klemm = (cm: number) =>
  Math.max(MIN_CM, Math.min(CONF_POOL - MIN_CM, Math.round(cm)));

interface Auswahl {
  zone: ZoneKey;
  idx: number;
}

export default function Regalwand() {
  const [sel, setSel] = useState<Auswahl>({ zone: "greifhoehe", idx: 0 });
  const [confCm, setConfCm] = useState(CONF_START);

  const confRef = useRef<HTMLButtonElement>(null);
  /* Pixel je Zentimeter wird einmal gemessen und bei Resize verworfen –
     --pxcm springt an den Breakpoints. */
  const pxProCm = useRef(0);

  useEffect(() => {
    const verwerfen = () => {
      pxProCm.current = 0;
    };
    window.addEventListener("resize", verwerfen);
    return () => window.removeEventListener("resize", verwerfen);
  }, []);

  /* Breite einer Front: die beiden verstellbaren Fronts teilen sich CONF_POOL. */
  const breite = useCallback(
    (zone: ZoneKey, idx: number, f: Front): number => {
      if (zone !== "greifhoehe") return f.cm;
      if (idx === CONF_IDX) return confCm;
      if (idx === BUDDY_IDX) return CONF_POOL - confCm;
      return f.cm;
    },
    [confCm],
  );

  const bestand = useMemo(() => {
    let belegt = 0;
    let frei = 0;
    let freieCm = 0;
    for (const zone of ORDER) {
      for (const f of WALL[zone]) {
        if (istFrei(f)) {
          frei++;
          freieCm += f.cm; /* conf + buddy ergeben immer CONF_POOL */
        } else {
          belegt++;
        }
      }
    }
    return { belegt, frei, freieCm };
  }, []);

  const einheitPx = () => {
    if (!pxProCm.current && confRef.current) {
      pxProCm.current = confRef.current.getBoundingClientRect().width / confCm;
    }
    return pxProCm.current || 1;
  };

  const griffZiehen = (ev: React.PointerEvent<HTMLSpanElement>) => {
    ev.preventDefault();
    ev.stopPropagation();
    const griff = ev.currentTarget;
    const startX = ev.clientX;
    const startCm = confCm;
    const einheit = einheitPx();
    griff.setPointerCapture(ev.pointerId);
    setSel({ zone: "greifhoehe", idx: CONF_IDX });

    const bewegen = (e: PointerEvent) => setConfCm(klemm(startCm + (e.clientX - startX) / einheit));
    const los = () => {
      griff.removeEventListener("pointermove", bewegen);
      griff.removeEventListener("pointerup", los);
      griff.removeEventListener("pointercancel", los);
    };
    griff.addEventListener("pointermove", bewegen);
    griff.addEventListener("pointerup", los);
    griff.addEventListener("pointercancel", los);
  };

  const griffTaste = (ev: React.KeyboardEvent<HTMLSpanElement>) => {
    const schritt = ev.shiftKey ? 5 : 1;
    let d = 0;
    if (ev.key === "ArrowRight" || ev.key === "ArrowUp") d = schritt;
    else if (ev.key === "ArrowLeft" || ev.key === "ArrowDown") d = -schritt;
    else if (ev.key === "Home") {
      ev.preventDefault();
      setConfCm(MIN_CM);
      setSel({ zone: "greifhoehe", idx: CONF_IDX });
      return;
    } else if (ev.key === "End") {
      ev.preventDefault();
      setConfCm(CONF_POOL - MIN_CM);
      setSel({ zone: "greifhoehe", idx: CONF_IDX });
      return;
    } else return;
    ev.preventDefault();
    setConfCm((cm) => klemm(cm + d));
    setSel({ zone: "greifhoehe", idx: CONF_IDX });
  };

  /* ── Karteikarte ───────────────────────────────────────────── */
  const gewaehlt = WALL[sel.zone][sel.idx];
  const gewaehltCm = breite(sel.zone, sel.idx, gewaehlt);
  const Z = ZONES[sel.zone];
  const monat = miete(gewaehltCm, sel.zone);

  const zeilen: { k: string; v: string; sum?: boolean }[] = [
    { k: "Regalfront", v: `${gewaehltCm} cm` },
    { k: "Zone", v: Z.name + (Z.auf ? ` (+${Z.auf} %)` : "") },
    { k: "Zentimeterpreis", v: eur(rate(sel.zone)) },
    { k: "Miete / Monat", v: eur(monat), sum: true },
  ];
  if (!istFrei(gewaehlt)) zeilen.push({ k: "Verkaufspreis", v: "UVP der Marke" });

  const confMonat = miete(confCm, "greifhoehe");
  const mindestGreift = confMonat > Math.round(confCm * rate("greifhoehe") * 100) / 100;

  return (
    <>
      <div className="wall">
        <div className="rig">
          <div className="zones">
            {ORDER.map((z) => (
              <div key={z} className={"zone" + (ZONES[z].pick ? " zone--pick" : "")}>
                <p className="zone__n">{ZONES[z].name}</p>
                <p className="zone__h">{ZONES[z].hoehe}</p>
                <p className="zone__r">{eur(rate(z))} / cm</p>
              </div>
            ))}
          </div>

          <div className="rackwrap">
            <div className="rack">
              <div className="rack__post" aria-hidden="true" />
              <div className="rack__col">
                <Kisten anzahl={5} />
                <div className="rack__banner">HUB42 WERBUNG</div>

                {ORDER.map((zone) => (
                  <div className="board" key={zone}>
                    <div className="board__goods">
                      <div
                        className="deck"
                        style={{ "--deck": `${ZONES[zone].deck}px` } as React.CSSProperties}
                      />

                      {WALL[zone].map((f, i) => {
                        const cm = breite(zone, i, f);
                        const frei = istFrei(f);
                        const conf = frei && f.conf === true;
                        const aktiv = sel.zone === zone && sel.idx === i;

                        return (
                          <Fragment key={`${zone}-${i}`}>
                            <button
                              type="button"
                              ref={conf ? confRef : undefined}
                              className={
                                "front" + (frei ? " front--free" : "") + (conf ? " front--conf" : "")
                              }
                              style={
                                {
                                  "--cm": cm,
                                  ...(istFrei(f) ? {} : { "--h": f.h }),
                                } as React.CSSProperties
                              }
                              aria-pressed={aktiv}
                              aria-label={
                                frei
                                  ? conf
                                    ? `Deine Regalfront, ${cm} Zentimeter, ${ZONES[zone].name}, ${eur(miete(cm, zone))} im Monat`
                                    : `Freie Regalfront, ${cm} Zentimeter, ${ZONES[zone].name}, ${eur(miete(cm, zone))} im Monat`
                                  : `${f.marke}, ${f.produkt}, ${cm} Zentimeter Regalfront in ${ZONES[zone].name}`
                              }
                              onClick={() => setSel({ zone, idx: i })}
                              onFocus={() => setSel({ zone, idx: i })}
                            >
                              <span className="front__body">
                                {frei ? (
                                  <span className="front__free-lbl">
                                    {conf ? (
                                      <>
                                        <b>Deine Front</b>
                                        {cm} cm
                                      </>
                                    ) : (
                                      <>
                                        frei
                                        <br />
                                        {cm} cm
                                      </>
                                    )}
                                  </span>
                                ) : (
                                  <img
                                    className={"good__img" + (f.crop ? " good__img--crop" : "")}
                                    src={f.img}
                                    alt=""
                                    style={{ "--zoom": f.zoom, "--dy": f.dy } as React.CSSProperties}
                                  />
                                )}
                              </span>
                            </button>

                            {conf && (
                              <span className="gripwrap">
                                <span
                                  className="grip"
                                  role="slider"
                                  tabIndex={0}
                                  aria-label="Breite deiner Regalfront in Zentimetern"
                                  aria-valuemin={MIN_CM}
                                  aria-valuemax={CONF_POOL - MIN_CM}
                                  aria-valuenow={confCm}
                                  aria-valuetext={`${confCm} Zentimeter, ${eur(confMonat)} im Monat`}
                                  onPointerDown={griffZiehen}
                                  onKeyDown={griffTaste}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="readout">
                                  {confCm} cm · <b>{eur(confMonat)}</b> / Monat
                                  {mindestGreift && <em>Mindestmiete greift</em>}
                                </span>
                              </span>
                            )}
                          </Fragment>
                        );
                      })}
                    </div>

                    <div className="plank" />

                    <div className="traverse">
                      {WALL[zone].map((f, i) => {
                        const cm = breite(zone, i, f);
                        const frei = istFrei(f);
                        const conf = frei && f.conf === true;

                        return (
                          <div
                            key={`${zone}-t-${i}`}
                            className={"tcard" + (frei && !conf ? " tcard--free" : "")}
                            style={{ "--cm": cm } as React.CSSProperties}
                          >
                            <p className="tcard__b">{frei ? (conf ? "Deine Marke" : "frei") : f.marke}</p>
                            <p className="tcard__m">
                              {frei && !conf ? (
                                <>
                                  <span>{cm} cm</span>
                                  <span>{eur(miete(cm, zone))}</span>
                                </>
                              ) : (
                                <>
                                  <QrMarke />
                                  <span>{cm} cm</span>
                                </>
                              )}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <Kisten anzahl={4} />
              </div>
              <div className="rack__post" aria-hidden="true" />
            </div>
          </div>
        </div>

        <aside className="card" aria-live="polite">
          <p className="card__prem">
            <span>
              {istFrei(gewaehlt) ? `Frei · ${Z.name}` : `Premium · ${gewaehlt.kat}`}
            </span>
          </p>
          <div className="card__in">
            <p className="card__name">
              {istFrei(gewaehlt) ? `${gewaehltCm} cm Regalfront` : gewaehlt.marke}
            </p>
            <p className="card__sub">
              {istFrei(gewaehlt)
                ? `${Z.hint} · ${Z.hoehe} über Boden`
                : `${gewaehlt.produkt} · ${gewaehlt.herkunft}`}
            </p>

            <div className="rows">
              {zeilen.map((r) => (
                <div key={r.k} className={"row" + (r.sum ? " row--sum" : "")}>
                  <span className="row__k">{r.k}</span>
                  <span className="row__v">{r.v}</span>
                </div>
              ))}
            </div>

            <p className="card__note">
              {istFrei(gewaehlt)
                ? "Frei ab sofort. Konsignation — du lieferst die Ware, wir verkaufen sie und rechnen monatlich ab. Traverse-Karte mit QR-Code und Preis inklusive."
                : gewaehlt.note}
            </p>

            <div className="card__foot">
              <a className="btn btn--solid" href="#anfragen">
                {istFrei(gewaehlt) ? "Diese Front anfragen" : "Front daneben anfragen"}
              </a>
              <span className="card__hint">7 % Provision bei Verkauf</span>
            </div>
          </div>
        </aside>
      </div>

      <p className="fineprint">
        {bestand.belegt} von {bestand.belegt + bestand.frei} Fronts dieser Wand sind belegt ·{" "}
        {bestand.frei} Fronts frei, zusammen {bestand.freieCm} cm · Ebene 84 cm breit, 60 cm tief,
        davon 50 cm VK-Fläche · Traverse 15 cm hoch · Auer-Eurokisten oben und unten als
        Nachschubplätze
      </p>
    </>
  );
}

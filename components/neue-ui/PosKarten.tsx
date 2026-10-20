"use client";

/* Wie wir eine Marke am POS zeigen: Herstellerkarte (A5, wie die
   Partner-Steckbriefe aus Handout/_build_partner.py) und Artikelkarte (A6,
   wie Handout/_build_artikel_a6.py). Dazu die Rechnung, was der Marke je
   Kanal bleibt. Alles Entwürfe aus der Website der Marke. */

/* eslint-disable @next/next/no-img-element -- fremde Shop-Bilder, keine Domains-Liste */

import { useRef, useState } from "react";
import { AMAZON, potenzial, type ArtikelTexte, type KarteEntwurf, type KarteProdukt } from "@/lib/karte-model";
import { HUB_MARGIN_PCT, LEH_DEFAULTS } from "@/lib/deck-economics";
import { eur, type ZoneKey } from "@/lib/neue-ui/regal";

const euro0 = (n: number) => Math.round(n).toLocaleString("de-DE") + " €";

const farbStil = (k: KarteEntwurf) =>
  ({ "--k-c": k.farben.c, "--k-on": k.farben.on, "--k-acc": k.farben.acc, "--k-bg": k.farben.bg }) as React.CSSProperties;

/* ── Detailansicht: Klick auf die Karte öffnet sie groß ─────── */

export function Zoombar({ label, children }: { label: string; children: React.ReactNode }) {
  const dlg = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="rk-zoom__btn" onClick={() => dlg.current?.showModal()} aria-label={`${label} groß ansehen`}>
        {children}
        <span className="rk-zoom__lupe" aria-hidden="true">⤢ Groß ansehen</span>
      </button>
      <dialog
        ref={dlg}
        className="rk-zoom__dlg"
        aria-label={label}
        onClick={(e) => {
          if (e.target === e.currentTarget) dlg.current?.close();
        }}
      >
        <button type="button" className="rk-zoom__zu" onClick={() => dlg.current?.close()} aria-label="Schließen">
          ✕
        </button>
        <div className="rk-zoom__karte">{children}</div>
      </dialog>
    </>
  );
}

/* ── Herstellerkarte A5 ──────────────────────────────────────── */

export function HerstellerKarte({ karte, produkt }: { karte: KarteEntwurf; produkt: KarteProdukt | null }) {
  const bild = karte.hero ?? produkt?.bild ?? null;
  return (
    <article className="rk-card rk-card--a5" style={farbStil(karte)} aria-label={`Herstellerkarte ${karte.marke}`}>
      <span className="rk-card__muster" aria-hidden="true">Muster</span>
      <header className="rk-card__band">
        {karte.logo ? (
          <span className="rk-card__logo">
            <img src={karte.logo} alt={karte.marke} />
          </span>
        ) : (
          <span className="rk-card__name">{karte.marke}</span>
        )}
        {karte.ort && <span className="rk-card__ort">{karte.ort}</span>}
      </header>
      {bild && (
        <div className="rk-card__bild rk-card__bild--cover">
          <img src={bild} alt="" />
        </div>
      )}
      <div className="rk-card__body">
        <h3>{karte.claim}</h3>
        <p className="rk-card__story">{karte.story}</p>
        {karte.zitat && (
          <blockquote className="rk-card__zitat">
            „{karte.zitat}“{karte.zitatVon && <cite>{karte.zitatVon}</cite>}
          </blockquote>
        )}
        {karte.fakten.length > 0 && (
          <ul className="rk-card__fakten">
            {karte.fakten.map((x, i) => (
              <li key={i}>
                <b>{x.wert}</b>
                <span>{x.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <footer className="rk-card__fuss">
        <span>{karte.wer || karte.marke}</span>
        <span>{karte.web}</span>
      </footer>
    </article>
  );
}

/* ── Artikelkarte A6 ─────────────────────────────────────────── */

export function ArtikelKarte({
  karte,
  produkt,
  artikel,
}: {
  karte: KarteEntwurf;
  produkt: KarteProdukt;
  artikel: ArtikelTexte | null | "laedt";
}) {
  const a = artikel === "laedt" ? null : artikel;
  return (
    <article className="rk-card rk-card--a6" style={farbStil(karte)} aria-label={`Artikelkarte ${produkt.titel}`}>
      <span className="rk-card__muster" aria-hidden="true">Muster</span>
      <header className="rk-card__band rk-card__band--a6">
        <b>{karte.marke}</b>
        <span>Direkt von der Marke</span>
      </header>
      {produkt.bild && (
        <div className="rk-card__bild">
          <img src={produkt.bild} alt={produkt.titel} />
        </div>
      )}
      <div className="rk-card__body">
        <p className="rk-a6__name">{produkt.titel}</p>
        {artikel === "laedt" && <p className="rk-a6__laedt">Texte entstehen …</p>}
        {a && (
          <>
            {a.head && <h3>{a.head}</h3>}
            {a.chips.length > 0 && <p className="rk-a6__chips">{a.chips.join(" · ")}</p>}
            {a.why.length > 0 && (
              <>
                <p className="rk-a6__lbl">Darum lohnt es sich</p>
                <ul className="rk-a6__why">
                  {a.why.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </>
            )}
            {a.know && (
              <p className="rk-a6__know">
                <b>Gut zu wissen</b> {a.know}
              </p>
            )}
            {a.tip && (
              <p className="rk-a6__tip">
                <b>Tipp:</b> {a.tip}
              </p>
            )}
          </>
        )}
      </div>
      <footer className="rk-a6__foot">
        <div>
          {produkt.preis ? <p className="rk-a6__preis">{eur(produkt.preis)}</p> : null}
          <p className="rk-a6__mwst">inkl. MwSt.</p>
          <p className="rk-a6__hub">
            HUB<span>42</span>
          </p>
        </div>
        <div className="rk-a6__qr">
          <QrPlatzhalter />
          Scannen &amp; bewerten
        </div>
      </footer>
    </article>
  );
}

/** Nur Platzhalter: der echte Code (Kurz-URL /q/…) entsteht im Onboarding. */
function QrPlatzhalter() {
  const z = [
    "1111111001011111111", "1000001010101000001", "1011101001001011101", "1011101011101011101",
    "1011101000101011101", "1000001011001000001", "1111111010101111111", "0000000011100000000",
    "1101011100111010110", "0100110011010101011", "1011001101101100101", "0000000010010101100",
    "1111111001101011010", "1000001011010010101", "1011101000111101011", "1011101010010110110",
    "1011101001101001011", "1000001010110110101", "1111111011001011010",
  ];
  return (
    <svg viewBox="0 0 19 19" aria-hidden="true" shapeRendering="crispEdges">
      {z.flatMap((reihe, y) =>
        [...reihe].map((c, x) => (c === "1" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null)),
      )}
    </svg>
  );
}

/* ── Was bleibt dir? ─────────────────────────────────────────── */

export function Rechnung(r: {
  produkt: KarteProdukt;
  setProdukt: (p: KarteProdukt) => void;
  verkaeufe: number;
  setVerkaeufe: (n: number) => void;
  zone: ZoneKey | "";
  cm: number | null;
}) {
  const [preisText, setPreisText] = useState("");
  const vk = r.produkt.preis;

  if (!vk) {
    return (
      <div className="rk-calc">
        <p className="rk-calc__h">Was kostet dein Produkt im Laden?</p>
        <div className="rk__eigen">
          <input placeholder="z. B. 8,90" inputMode="decimal" value={preisText} onChange={(e) => setPreisText(e.target.value)} />
          <button
            type="button"
            className="btn"
            onClick={() => {
              const n = Number(preisText.replace(",", "."));
              if (n > 0) r.setProdukt({ ...r.produkt, preis: n });
            }}
          >
            Rechnen
          </button>
        </div>
      </div>
    );
  }

  const x = potenzial({ vk, verkaeufeMonat: r.verkaeufe, zone: r.zone, cm: r.cm });
  const max = Math.max(x.proStueck.hub, x.proStueck.leh, x.proStueck.online, x.proStueck.amazon, 0.01);
  const balken = [
    { k: "Hub42", v: x.proStueck.hub, hub: true },
    { k: "Supermarkt", v: x.proStueck.leh, hub: false },
    { k: "Amazon", v: x.proStueck.amazon, hub: false },
    { k: "Eigener Onlineshop", v: x.proStueck.online, hub: false },
  ];

  // Erst der Supermarkt; gewinnt Hub42 dort nicht, der stärkste Online-Kanal.
  const online = [
    { k: "deinen Onlineshop", v: x.mehrJahrOnline },
    { k: "Amazon", v: x.mehrJahrAmazon },
  ].sort((a, b) => a.v - b.v);
  const haupt =
    x.mehrMonat > 0 ? { k: "im Supermarkt", v: x.mehrJahr } : online.find((o) => o.v > 0) ? { k: `über ${online.find((o) => o.v > 0)!.k}`, v: online.find((o) => o.v > 0)!.v } : null;
  const neben = [
    ...(x.mehrMonat > 0 ? [] : x.abVerkaeufenBesserAlsLEH ? [`Den Supermarkt schlägst du ab ${x.abVerkaeufenBesserAlsLEH} Verkäufen im Monat.`] : []),
    ...online.filter((o) => o.v > 0 && `über ${o.k}` !== haupt?.k).map((o) => `Gegenüber ${o.k}: +${euro0(o.v)} im Jahr.`),
  ];

  return (
    <div className="rk-calc">
      {haupt ? (
        <p className="rk-calc__h">
          <span className="rk-calc__big">+{euro0(haupt.v)}</span>
          im Jahr mehr als {haupt.k}, bei {r.verkaeufe} Verkäufen im Monat.
          {neben.map((n) => (
            <span key={n} className="rk-calc__neben">
              {n}
            </span>
          ))}
        </p>
      ) : (
        <p className="rk-calc__h">
          {x.abVerkaeufenBesserAlsLEH ? (
            <>
              Ab <span className="rk-calc__big">{x.abVerkaeufenBesserAlsLEH}</span> Verkäufen im Monat bleibt dir bei uns
              mehr als im Supermarkt.
            </>
          ) : (
            "Bei diesem Preis lohnt sich eher ein größeres Gebinde – lass uns im Onboarding drauf schauen."
          )}
        </p>
      )}

      <label className="rk-calc__slider">
        <span>
          Verkäufe pro Monat: <b>{r.verkaeufe}</b>
        </span>
        <input type="range" min={5} max={120} step={5} value={r.verkaeufe} onChange={(e) => r.setVerkaeufe(Number(e.target.value))} />
      </label>

      <p className="rk-calc__sub">Was dir von {eur(vk)} pro Stück bleibt:</p>
      <ul className="rk-calc__bars">
        {balken.map((b) => (
          <li key={b.k} className={b.hub ? "is-hub" : ""}>
            <span>{b.k}</span>
            <i style={{ width: `${Math.max(2, (Math.max(0, b.v) / max) * 100)}%` }} />
            <b>{eur(b.v)}</b>
          </li>
        ))}
      </ul>

      <p className="rk__fine">
        Rechenbeispiel, keine Zusage. Hub42: {HUB_MARGIN_PCT} % Provision plus Regalmiete {eur(x.mieteMonat)} im Monat.
        Supermarkt: {LEH_DEFAULTS.margePct} % Handelsmarge, ohne Listungsgebühr. Amazon: {AMAZON.provisionPct} % Verkaufsgebühr
        ({AMAZON.provisionPctGuenstig} % bis {AMAZON.guenstigBis} € bei Lebensmitteln und Beauty), rund {eur(AMAZON.fba)} Versand
        durch Amazon je Stück, {AMAZON.kontoMonat} € Verkäuferkonto im Monat, ohne Werbung. Onlineshop: Fulfillment, Versand,
        Zahlung und 4 € Werbung je Verkauf. Wareneinsatz ist überall noch nicht abgezogen.
      </p>
    </div>
  );
}

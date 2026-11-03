import { ZIEL, type Trichter } from "@/lib/crm-heute-model";
import { kurzDatum } from "../logik";

const EURO = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** Zusagen gegen das Jahresziel, dahinter die Stufen als Leiste mit Anzahl. */
export default function TrichterLeiste({ trichter }: { trichter: Trichter }) {
  const max = Math.max(1, ...trichter.stufen.map((s) => s.anzahl));
  const z = trichter.zusagen;
  const anteil = Math.min(100, (z.vertragswert / ZIEL.jahrSoll) * 100);
  return (
    <section className="trichter regal" aria-labelledby="trichter-titel">
      <h2 id="trichter-titel" className="satz satz--h2">
        Zusagen
      </h2>
      <dl className="trichter__zahlen">
        <div className="trichter__zahl trichter__zahl--signal">
          <dt>Vertragswert netto</dt>
          <dd>{EURO.format(z.vertragswert)}</dd>
          <dd className="trichter__klein">
            {z.anzahl} Zusagen · {EURO.format(z.monat)} im Monat · {z.regalCm} cm Regal
          </dd>
        </div>
        <div className="trichter__zahl">
          <dt>Diese Woche gebucht</dt>
          <dd>{EURO.format(trichter.wertWoche)}</dd>
          <dd className="trichter__klein">Soll {EURO.format(ZIEL.wocheSoll)} je Woche</dd>
        </div>
        <div className="trichter__zahl">
          <dt>Diesen Monat gebucht</dt>
          <dd>{EURO.format(trichter.wertMonat)}</dd>
          <dd className="trichter__klein">{trichter.offeneAngebote} offene Angebote</dd>
        </div>
      </dl>
      <div className="trichter__ziel">
        <p className="trichter__klein">
          Jahresziel {EURO.format(ZIEL.jahrSoll)} bis {kurzDatum(ZIEL.frist)}{ZIEL.frist.slice(0, 4)} · erreicht {Math.round(anteil)} %
        </p>
        <span className="trichter__balken trichter__balken--ziel" aria-hidden="true">
          <span style={{ width: `${Math.max(1, anteil)}%` }} />
        </span>
      </div>
      <ol className="trichter__stufen" aria-label="Marken je Stufe">
        {trichter.stufen.map((s) => (
          <li key={s.stufe} className="trichter__stufe">
            <span className="trichter__name">{s.stufe}</span>
            <span className="trichter__balken" aria-hidden="true">
              <span style={{ width: `${Math.max(2, (s.anzahl / max) * 100)}%` }} />
            </span>
            <span className="trichter__anzahl">{s.anzahl}</span>
          </li>
        ))}
      </ol>
      <p className="trichter__rest">
        Später {trichter.spaeter} · Verloren {trichter.verloren}
      </p>
    </section>
  );
}

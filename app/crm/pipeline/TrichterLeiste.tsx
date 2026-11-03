import type { Trichter } from "@/lib/crm-heute-model";

/** Zusagen als Zahlen vorn, dahinter die Stufen als Leiste mit Anzahl. */
export default function TrichterLeiste({ trichter }: { trichter: Trichter }) {
  const max = Math.max(1, ...trichter.stufen.map((s) => s.anzahl));
  return (
    <section className="trichter regal" aria-labelledby="trichter-titel">
      <h2 id="trichter-titel" className="satz satz--h2">
        Zusagen
      </h2>
      <dl className="trichter__zahlen">
        <div className="trichter__zahl trichter__zahl--signal">
          <dt>Neue Kunden diese Woche</dt>
          <dd>{trichter.zusagenWoche}</dd>
        </div>
        <div className="trichter__zahl">
          <dt>Neue Kunden diesen Monat</dt>
          <dd>{trichter.zusagenMonat}</dd>
        </div>
        <div className="trichter__zahl">
          <dt>Offene Angebote</dt>
          <dd>{trichter.offeneAngebote}</dd>
        </div>
      </dl>
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

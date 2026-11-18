import type { Metadata } from "next";
import { ladeKaeufer, N_KAEUFER, requireMarke } from "@/lib/marke";
import { prozent } from "../format";

export const metadata: Metadata = { title: "Käufer" };
export const dynamic = "force-dynamic";

const TAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const GESCHLECHT: Record<string, string> = { w: "Frauen", m: "Männer", d: "Divers" };

export default async function MarkeKaeufer() {
  const m = await requireMarke();
  const k = await ladeKaeufer(m.brandId);
  const max = Math.max(1, ...k.heatmap.flat());

  return (
    <>
      <div className="mp-kopfzeile">
        <h1 className="mp-h1">Wer und wann kauft</h1>
        <p className="mp-leise mp-mono">Letzte {k.tage} Tage</p>
      </div>

      <section className="mp-karte" aria-labelledby="wer-titel">
        <h2 id="wer-titel" className="mp-h2">Wer kauft</h2>
        <p className="mp-leise" style={{ fontSize: 13 }}>
          An der Kasse schätzt das Team Altersgruppe und Geschlecht, gefragt wird niemand und gespeichert wird keine Person.
          Anteile zeigen wir ab {N_KAEUFER} erfassten Käufen.
        </p>
        {!k.freigegeben ? (
          <p>Noch zu wenig Daten: {k.n} von {N_KAEUFER} Käufen erfasst.</p>
        ) : (
          <div className="mp-raster">
            <div style={{ display: "grid", gap: 6 }}>
              <h3 className="mp-mono">Alter</h3>
              {k.alter.map((a) => (
                <div key={a.gruppe} className="mp-balken">
                  <span className="mp-mono">{a.gruppe}</span>
                  <div className="mp-balken__spur"><div className="mp-balken__wert" style={{ width: `${a.anteil * 100}%` }} /></div>
                  <span className="mp-mono" style={{ textAlign: "right" }}>{prozent(a.anteil)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gap: 6, alignContent: "start" }}>
              <h3 className="mp-mono">Geschlecht</h3>
              {k.geschlecht.map((g) => (
                <div key={g.wert} className="mp-balken">
                  <span className="mp-mono">{GESCHLECHT[g.wert] ?? g.wert}</span>
                  <div className="mp-balken__spur"><div className="mp-balken__wert" style={{ width: `${g.anteil * 100}%` }} /></div>
                  <span className="mp-mono" style={{ textAlign: "right" }}>{prozent(g.anteil)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="mp-karte" aria-labelledby="wann-titel">
        <h2 id="wann-titel" className="mp-h2">Wann verkauft wird</h2>
        <p className="mp-leise" style={{ fontSize: 13 }}>Verkaufte Stück nach Wochentag und Uhrzeit. Je dunkler, desto mehr.</p>
        <div style={{ overflowX: "auto" }}>
          <div className="mp-heat" role="table" aria-label="Abverkauf nach Wochentag und Stunde">
            <div />
            {k.stunden.map((h) => <div key={h}>{h}</div>)}
            {k.heatmap.map((zeile, t) => (
              <Zeile key={t} tag={TAGE[t]} zeile={zeile} max={max} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Zeile({ tag, zeile, max }: { tag: string; zeile: number[]; max: number }) {
  return (
    <>
      <div>{tag}</div>
      {zeile.map((n, i) => (
        <div
          key={i}
          className="zelle"
          title={`${tag} ${8 + i} Uhr: ${n} Stück`}
          style={n ? { background: `rgba(36, 90, 84, ${0.15 + 0.85 * (n / max)})`, color: n / max > 0.5 ? "#fff" : undefined } : undefined}
        >
          {n || ""}
        </div>
      ))}
    </>
  );
}

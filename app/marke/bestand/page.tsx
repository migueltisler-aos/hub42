import type { Metadata } from "next";
import { ladeBestand, ladeKonditionen, requireMarke } from "@/lib/marke";
import { datumZeit } from "../format";

export const metadata: Metadata = { title: "Bestand" };
export const dynamic = "force-dynamic";

const QUELLE: Record<string, string> = {
  wareneingang: "Lieferung",
  verkauf: "Verkauf",
  muster_entnahme: "Tasting",
  abschrift: "Abschrift",
  korrektur: "Korrektur",
};

export default async function MarkeBestand() {
  const m = await requireMarke();
  const [{ zeilen, bewegungen }, k] = await Promise.all([ladeBestand(m.brandId), ladeKonditionen(m.brandId)]);
  const nachschub = zeilen.filter((z) => z.nachbestellung_empfohlen || (z.reichweite_tage !== null && z.reichweite_tage < 7));

  return (
    <>
      <div className="mp-kopfzeile">
        <h1 className="mp-h1">Bestand</h1>
        <p className="mp-leise mp-mono">Ware im Laden, Lieferungen, Tasting und Abschriften</p>
      </div>

      {nachschub.length > 0 && (
        <section className="mp-hinweis mp-hinweis--warn" aria-labelledby="nachschub-titel">
          <h2 id="nachschub-titel" className="mp-h2" style={{ fontSize: 18 }}>Bitte nachliefern</h2>
          <ul style={{ marginTop: 8, display: "grid", gap: 4 }}>
            {nachschub.map((z) => (
              <li key={z.ean}>
                <strong>{z.artikel_name}</strong>: noch {z.bestand} Stück
                {z.reichweite_tage !== null && `, reicht etwa ${z.reichweite_tage} Tage`}
                {z.nachschub_menge > 0 && `. Für zwei Wochen fehlen ${z.nachschub_menge} Stück.`}
              </li>
            ))}
          </ul>
          <p style={{ marginTop: 8, fontSize: 13 }}>
            Lieferung bitte innerhalb einer Woche
            {k?.nachschub_email ? `, Rückfragen an ${k.nachschub_email}` : ""}.
          </p>
        </section>
      )}

      <section aria-labelledby="konto-titel" style={{ display: "grid", gap: 12 }}>
        <h2 id="konto-titel" className="mp-h2">Warenkonto</h2>
        <p className="mp-leise" style={{ fontSize: 13 }}>
          Geliefert minus verkauft, Tasting und Abschrift, plus oder minus Korrektur ergibt den Bestand im Laden. Tasting-Stücke
          stellst du als Muster, sie werden nicht vergütet.
        </p>
        {zeilen.length === 0 ? (
          <p className="mp-hinweis">Noch keine Artikel im Regal.</p>
        ) : (
          <div className="mp-tabelle-rahmen">
            <table className="mp-tabelle">
              <thead>
                <tr>
                  <th>Artikel</th>
                  <th className="z">Geliefert</th>
                  <th className="z">Verkauft</th>
                  <th className="z">Tasting</th>
                  <th className="z">Abschrift</th>
                  <th className="z">Korrektur</th>
                  <th className="z">Im Laden</th>
                  <th className="z">Ø / Tag</th>
                  <th className="z">Reicht</th>
                </tr>
              </thead>
              <tbody>
                {zeilen.map((z) => {
                  const rechnerisch = z.konto.geliefert - z.konto.verkauft - z.konto.tasting - z.konto.abschrift + z.konto.korrektur;
                  const abweichung = rechnerisch !== z.bestand;
                  return (
                    <tr key={z.ean} className={z.bestand < 0 || abweichung ? "warn" : undefined}>
                      <td>{z.artikel_name}<div className="mp-mono mp-leise">{z.ean}</div></td>
                      <td className="z">{z.konto.geliefert}</td>
                      <td className="z">{z.konto.verkauft}</td>
                      <td className="z">{z.konto.tasting}</td>
                      <td className="z">{z.konto.abschrift}</td>
                      <td className="z">{z.konto.korrektur > 0 ? `+${z.konto.korrektur}` : z.konto.korrektur}</td>
                      <td className="z"><strong>{z.bestand}</strong></td>
                      <td className="z">{z.verkauf_pro_tag ? z.verkauf_pro_tag.toLocaleString("de-DE", { maximumFractionDigits: 1 }) : "–"}</td>
                      <td className="z">{z.reichweite_tage !== null ? `${z.reichweite_tage} Tage` : "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="bew-titel" style={{ display: "grid", gap: 12 }}>
        <h2 id="bew-titel" className="mp-h2">Letzte Bewegungen</h2>
        {bewegungen.length === 0 ? (
          <p className="mp-hinweis">Noch keine Bewegungen.</p>
        ) : (
          <div className="mp-tabelle-rahmen">
            <table className="mp-tabelle">
              <thead>
                <tr><th>Wann</th><th>Artikel</th><th>Art</th><th className="z">Menge</th><th>Grund</th></tr>
              </thead>
              <tbody>
                {bewegungen.map((b, i) => (
                  <tr key={i}>
                    <td className="mp-mono">{datumZeit(b.erstellt_am)}</td>
                    <td>{b.artikel_name}</td>
                    <td>{QUELLE[b.quelle] ?? b.quelle}</td>
                    <td className="z">{b.menge_delta > 0 ? `+${b.menge_delta}` : b.menge_delta}</td>
                    <td>{b.notiz ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

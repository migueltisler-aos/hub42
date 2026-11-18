import type { Metadata } from "next";
import { ladeAbrechnungen, requireMarke } from "@/lib/marke";
import { euro } from "@/lib/abrechnung-model";
import { datum, monatName } from "../format";

export const metadata: Metadata = { title: "Abrechnungen" };
export const dynamic = "force-dynamic";

export default async function MarkeAbrechnungen() {
  const m = await requireMarke();
  const liste = await ladeAbrechnungen(m.brandId);

  return (
    <>
      <div className="mp-kopfzeile">
        <h1 className="mp-h1">Abrechnungen</h1>
        <p className="mp-leise mp-mono">Gutschrift und Rechnung je Monat</p>
      </div>
      <p className="mp-leise" style={{ fontSize: 13 }}>
        Für die verkaufte Ware stellen wir dir eine Gutschrift aus, die als deine Rechnung gilt. Die Regalmiete stellen wir dir in
        Rechnung und ziehen sie von der Gutschrift ab. Beide Belege sind für deine Buchhaltung.
      </p>
      {liste.length === 0 ? (
        <p className="mp-hinweis">Die erste Abrechnung erscheint hier nach dem ersten vollen Monat.</p>
      ) : (
        <div className="mp-tabelle-rahmen">
          <table className="mp-tabelle">
            <thead>
              <tr>
                <th>Monat</th>
                <th className="z">Umsatz</th>
                <th className="z">Gutschrift</th>
                <th className="z">Miete</th>
                <th className="z">Auszahlung</th>
                <th>Status</th>
                <th>Belege</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((a) => (
                <tr key={a.id}>
                  <td>{monatName(a.zeitraum)}</td>
                  <td className="z">{euro(a.umsatz_brutto_ct)}</td>
                  <td className="z">{euro(a.gs_brutto_ct)}</td>
                  <td className="z">{a.rg_brutto_ct ? `− ${euro(a.rg_brutto_ct)}` : "–"}</td>
                  <td className="z">
                    <strong>{euro(a.auszahlung_ct)}</strong>
                    {a.vortrag_neu_ct > 0 && <div className="mp-leise" style={{ fontSize: 12 }}>offen: {euro(a.vortrag_neu_ct)}</div>}
                  </td>
                  <td>
                    {a.status === "bezahlt" ? (
                      <span className="mp-marke mp-marke--licht">überwiesen {a.bezahlt_am ? datum(a.bezahlt_am) : ""}</span>
                    ) : (
                      <span className="mp-marke">abgerechnet</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {a.gs_pdf_pfad && <a href={`/marke/abrechnungen/${a.id}/gutschrift`}>Gutschrift {a.gs_nr}</a>}
                    {a.rg_pdf_pfad && (
                      <>
                        <br />
                        <a href={`/marke/abrechnungen/${a.id}/rechnung`}>Rechnung {a.rg_nr}</a>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

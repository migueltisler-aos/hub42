/* Die fünf Stufen als Preistabelle (#preise, Block A). Unter 640 px stapelt
   sich jede Zeile zur Karte, damit nichts horizontal scrollt. */

import { STUFEN, eur0, regalText } from "@/lib/treppe";
import { HUB_MARGIN_PCT } from "@/lib/deck-economics";

export default function StufenTabelle() {
  return (
    <div className="tbl-scroll">
      <table className="rate rate--stack">
        <thead>
          <tr>
            <th scope="col">Stufe</th>
            <th scope="col">Dauer</th>
            <th scope="col">Festpreis netto</th>
            <th scope="col">Regal</th>
            <th scope="col">Empfohlen für</th>
          </tr>
        </thead>
        <tbody>
          {STUFEN.map((s) => (
            <tr key={s.key}>
              <th scope="row">
                {s.nr} {s.name}
                <span>{s.frage}</span>
              </th>
              <td data-label="Dauer">{s.dauer}</td>
              <td data-label="Festpreis netto">{eur0(s.preis)}</td>
              <td data-label="Regal">
                {regalText(s)}
                {s.regalInklusive ? "" : "*"}
              </td>
              <td data-label="Empfohlen für">{s.empfohlenFuer}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="rate__note">Auf jede Stufe: + {HUB_MARGIN_PCT} % auf den Verkauf.</p>
    </div>
  );
}

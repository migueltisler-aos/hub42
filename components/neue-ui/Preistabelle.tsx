/* Preistabelle: von unten nach oben gelesen – Basis, Greifhöhe, Augenhöhe –
   plus das pauschal bepreiste Schaufenster. */

import { ORDER, ZONES, eur, miete, mieteBesonders, rate, rateBesonders } from "@/lib/neue-ui/regal";
import { SCHAUFENSTER_MONAT } from "@/lib/deck-economics";

export default function Preistabelle() {
  return (
    <div className="tbl-scroll">
      <table className="rate">
        <thead>
          <tr>
            <th scope="col">Zone</th>
            <th scope="col">Höhe über Boden</th>
            <th scope="col">€ / cm / Monat</th>
            <th scope="col">Front 20 cm</th>
            <th scope="col">Besonderer Wert*</th>
          </tr>
        </thead>
        <tbody>
          {[...ORDER].reverse().map((z) => {
            const Z = ZONES[z];
            return (
              <tr key={z} {...(Z.pick ? { "data-pick": "1" } : {})}>
                <th scope="row">
                  {Z.name}
                  {Z.pick && <span className="tag">empfohlen</span>}
                  <span>{Z.hint}</span>
                </th>
                <td>{Z.hoehe}</td>
                <td>
                  {eur(rate(z))}
                  {Z.auf ? ` (+${Z.auf} %)` : ""}
                </td>
                <td>{eur(miete(20, z))}</td>
                <td>
                  {eur(rateBesonders(z))} / cm · {eur(mieteBesonders(20, z))}
                </td>
              </tr>
            );
          })}
          <tr>
            <th scope="row">
              Schaufenster<span>Sichtbar ohne Betreten</span>
            </th>
            <td>Ladenfront</td>
            <td>pauschal</td>
            <td>{eur(SCHAUFENSTER_MONAT)}</td>
            <td>—</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

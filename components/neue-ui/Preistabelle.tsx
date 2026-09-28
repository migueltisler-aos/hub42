/* Preistabelle: von unten nach oben gelesen (Basis, Greifhöhe, Augenhöhe),
   plus das pauschal bepreiste Schaufenster. Unter 640 px stapelt sich jede
   Zeile zur Karte (data-label), damit nichts horizontal scrollt. */

import { ORDER, ZONES, eur, miete, mieteBesonders, rate, rateBesonders } from "@/lib/neue-ui/regal";
import { SCHAUFENSTER_MONAT } from "@/lib/deck-economics";

export default function Preistabelle() {
  return (
    <div className="tbl-scroll">
      <table className="rate rate--stack">
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
                <td data-label="Höhe">{Z.hoehe}</td>
                <td data-label="€ / cm / Monat">
                  {eur(rate(z))}
                  {Z.auf ? ` (+${Z.auf} %)` : ""}
                </td>
                <td data-label="Front 20 cm">{eur(miete(20, z))}</td>
                <td data-label="Besonderer Wert*">
                  {eur(rateBesonders(z))} / cm · {eur(mieteBesonders(20, z))}
                </td>
              </tr>
            );
          })}
          <tr>
            <th scope="row">
              Schaufenster<span>Sichtbar ohne Betreten</span>
            </th>
            <td data-label="Höhe">Ladenfront</td>
            <td data-label="€ / cm / Monat">pauschal</td>
            <td data-label="Front 20 cm">{eur(SCHAUFENSTER_MONAT)}</td>
            <td data-label="Besonderer Wert*">entfällt</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

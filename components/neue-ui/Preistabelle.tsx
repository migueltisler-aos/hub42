/* Preistabelle: von unten nach oben gelesen (Basis, Greifhöhe, Augenhöhe),
   plus das pauschal bepreiste Schaufenster. Unter 640 px stapelt sich jede
   Zeile zur Karte (data-label), damit nichts horizontal scrollt. */

import { ORDER, ZONES, eur, rate } from "@/lib/neue-ui/regal";
import { PAKETE, SCHAUFENSTER_MONAT, paketMiete } from "@/lib/deck-economics";

const S = `S · ${PAKETE.S.cm} cm`;
const M = `M · ${PAKETE.M.cm} cm`;
const L = `L · je cm ab ${PAKETE.L.abCm} cm`;

/* S und M sind Pakete, ihre Miete gibt es immer. */
const paket = (cm: number, z: (typeof ORDER)[number]) => eur(paketMiete(cm, z) ?? 0);

export default function Preistabelle() {
  return (
    <div className="tbl-scroll">
      <table className="rate rate--stack">
        <thead>
          <tr>
            <th scope="col">Zone</th>
            <th scope="col">Höhe über Boden</th>
            <th scope="col">{S}</th>
            <th scope="col">{M}</th>
            <th scope="col">{L}</th>
          </tr>
        </thead>
        <tbody>
          {[...ORDER].reverse().map((z) => {
            const Z = ZONES[z];
            return (
              <tr key={z} {...(Z.pick ? { "data-pick": "1" } : {})}>
                <th scope="row">
                  {Z.name}
                  {Z.auf ? ` +${Z.auf} %` : ""}
                  {Z.pick && <span className="tag">empfohlen</span>}
                  <span>{Z.hint}</span>
                </th>
                <td data-label="Höhe">{Z.hoehe}</td>
                <td data-label={S}>{paket(PAKETE.S.cm, z)}</td>
                <td data-label={M}>{paket(PAKETE.M.cm, z)}</td>
                <td data-label={L}>{eur(rate(z))}</td>
              </tr>
            );
          })}
          <tr>
            <th scope="row">
              Schaufenster<span>Sichtbar ohne Betreten</span>
            </th>
            <td data-label="Höhe">Ladenfront</td>
            <td data-label="Preis" colSpan={3}>
              {eur(SCHAUFENSTER_MONAT)} pauschal
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

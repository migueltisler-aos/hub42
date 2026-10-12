/**
 * Preis-Leiter für die Preisfrage: der aktuelle Verkaufspreis in der Mitte,
 * darüber und darunter je `steps` Stufen auf Schwellenpreisen.
 *
 * Die Stufenweite wächst mit dem Preis (rund 6 % des Preises, gerundet auf
 * 0,50 / 1 / 2 / 5 / 10 / 20 / 50 / 100 €), damit die Leiter bei jedem Artikel
 * etwa ±25–45 % abdeckt. Bei 0,50 € enden die Stufen auf x,49 und x,99,
 * darüber immer auf ,99:
 *
 *    5,49 → 2,99 3,49 3,99 4,49 4,99 | 5,49 | 5,99 6,49 6,99 7,49 7,99
 *   17,98 → 12,99 13,99 14,99 15,99 16,99 | 17,98 | 18,99 19,99 20,99 21,99 22,99
 *  349,50 → 259,99 279,99 299,99 319,99 339,99 | 349,50 | 359,99 … 439,99
 *
 * Schwellenpreise zu nah am aktuellen Preis (unter 30 % einer Stufe, z. B. 17,99
 * neben 17,98) werden übersprungen. Gerechnet wird in Cent.
 */
const STUFEN_CENT = [50, 100, 200, 500, 1000, 2000, 5000, 10000];

function stufe(cent: number): number {
  const roh = cent * 0.06;
  return STUFEN_CENT.reduce((best, s) =>
    Math.abs(Math.log(s / roh)) < Math.abs(Math.log(best / roh)) ? s : best
  );
}

export function priceLadder(price: number, steps = 5): number[] {
  const cent = Math.round(price * 100);
  if (cent <= 0) return [];
  const s = stufe(cent);
  const abstand = s * 0.3;
  // Schwellenpreise: k * Stufe - 1 Cent (…,49/…,99 bzw. …,99)
  const unten: number[] = [];
  for (let k = Math.floor((cent + 1) / s); unten.length < steps && k >= 1; k--) {
    const p = k * s - 1;
    if (p < cent - abstand && p > 0) unten.unshift(p);
  }
  const oben: number[] = [];
  for (let k = Math.ceil((cent + 1) / s); oben.length < steps; k++) {
    const p = k * s - 1;
    if (p > cent + abstand) oben.push(p);
  }
  return [...unten, cent, ...oben].map((c) => c / 100);
}

export function formatEuro(v: number): string {
  return v.toFixed(2).replace(".", ",") + " €";
}

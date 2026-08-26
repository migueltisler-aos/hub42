/**
 * Tages-Cap kommt direkt aus ENV DAILY_CAP. Die Warm-up-Rampe
 * (Woche1=15, Woche2=30, Woche3=45, ab Woche4=70) ist keine Automatik im
 * Code, sondern eine Betriebsanweisung: DAILY_CAP wird wöchentlich in Vercel
 * manuell erhöht (siehe README). Das hält die Logik einfach und macht die
 * Rampe jederzeit von Hand pausierbar/korrigierbar, ohne Redeploy nötig zu
 * machen.
 */
export function getDailyCap(): number {
  const raw = process.env.DAILY_CAP;
  const parsed = Number(raw);
  if (!raw || !Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("ENV DAILY_CAP fehlt oder ist ungültig (positive Zahl erwartet)");
  }
  return parsed;
}

const TZ = "Europe/Berlin";

export const datum = (iso: string) =>
  new Date(iso).toLocaleDateString("de-DE", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });

export const datumZeit = (iso: string) =>
  new Date(iso).toLocaleString("de-DE", { timeZone: TZ, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) + " Uhr";

export function monatName(zeitraum: string) {
  const [j, m] = zeitraum.split("-").map(Number);
  return new Date(Date.UTC(j, m - 1, 15)).toLocaleDateString("de-DE", { month: "long", year: "numeric", timeZone: "UTC" });
}

export const prozent = (x: number) => `${Math.round(x * 100)} %`;

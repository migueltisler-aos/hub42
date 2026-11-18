import type { Metadata } from "next";
import { ladeVertrag, requireMarke } from "@/lib/marke";
import { euro, inCent } from "@/lib/abrechnung-model";
import { datum } from "../format";

export const metadata: Metadata = { title: "Vertrag & Regal" };
export const dynamic = "force-dynamic";

function restlaufzeit(beginn: string | null, monate: number | null): string | null {
  if (!beginn || !monate) return null;
  const ende = new Date(beginn);
  ende.setMonth(ende.getMonth() + monate);
  const tage = Math.ceil((ende.getTime() - Date.now()) / 864e5);
  if (tage <= 0) return `Mindestlaufzeit endete am ${datum(ende.toISOString())}, jetzt monatlich kündbar`;
  return `noch ${Math.ceil(tage / 30)} Monate, bis ${datum(ende.toISOString())}`;
}

export default async function MarkeVertrag() {
  const m = await requireMarke();
  const { konditionen: k, zusagen, foto } = await ladeVertrag(m.brandId);
  const regalCm = k?.regal_cm ?? zusagen.reduce((a, z) => a + (z.regal_cm ?? 0), 0);
  const laufzeit = k?.laufzeit_monate ?? zusagen[0]?.laufzeit_monate ?? null;
  const beginn = k?.vertragsbeginn ?? zusagen[0]?.gebucht_am ?? null;
  const rest = restlaufzeit(beginn, laufzeit);

  return (
    <>
      <div className="mp-kopfzeile">
        <h1 className="mp-h1">Vertrag & Regal</h1>
      </div>

      <section className="mp-raster" aria-label="Konditionen">
        <Wert titel="Regalfläche" wert={regalCm ? `${regalCm} cm` : "–"} unter={k?.regal_lage ?? zusagen[0]?.klasse ?? undefined} />
        <Wert titel="Regalmiete" wert={k?.miete_netto_monat ? `${euro(inCent(Number(k.miete_netto_monat)))} netto` : "–"} unter="je Monat, wird mit der Auszahlung verrechnet" />
        <Wert titel="Provision" wert={`${Number(k?.provision_pct ?? 7).toLocaleString("de-DE")} %`} unter="auf den Verkaufserlös, Kartengebühren inklusive" />
        <Wert titel="Vertragsbeginn" wert={beginn ? datum(beginn) : "–"} unter={laufzeit ? `Mindestlaufzeit ${laufzeit} Monate` : undefined} />
      </section>

      <section className="mp-karte" aria-labelledby="lauf-titel">
        <h2 id="lauf-titel" className="mp-h2">Laufzeit</h2>
        <ul style={{ display: "grid", gap: 6 }}>
          {rest && <li>Restlaufzeit: {rest}</li>}
          <li>Kündigungsfrist: {k?.kuendigungsfrist ?? "monatlich nach der Mindestlaufzeit"}</li>
          <li>Auszahlung: monatlich bis zum 10. des Folgemonats per Überweisung, mit Gutschrift und Rechnung als Beleg</li>
          <li>Die Ware bleibt bis zum Verkauf dein Eigentum (Kommission nach § 383 HGB). Unverkaufte Ware geht zurück.</li>
        </ul>
      </section>

      <section className="mp-karte" aria-labelledby="foto-titel">
        <h2 id="foto-titel" className="mp-h2">So steht deine Ware gerade</h2>
        {foto?.url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- signierte, kurzlebige Storage-URL */}
            <img src={foto.url} alt={`Regal mit ${m.brandName} im Testkaufhaus`} className="mp-foto" />
            <p className="mp-mono mp-leise">Aufgenommen am {datum(foto.aufgenommen_am)}</p>
          </>
        ) : (
          <p className="mp-leise">Noch kein Foto. Wir fotografieren dein Regal, sobald die Ware steht.</p>
        )}
      </section>
    </>
  );
}

function Wert({ titel, wert, unter }: { titel: string; wert: string; unter?: string }) {
  return (
    <div className="mp-kachel">
      <span className="mp-mono">{titel}</span>
      <span className="mp-zahl" style={{ fontSize: 26 }}>{wert}</span>
      {unter && <span className="mp-leise" style={{ fontSize: 13 }}>{unter}</span>}
    </div>
  );
}

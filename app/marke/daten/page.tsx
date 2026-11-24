import type { Metadata } from "next";
import { ladeKonditionen, requireMarke } from "@/lib/marke";
import { GUTSCHRIFT_ZUSTIMMUNG_TEXT } from "@/lib/abrechnung-model";
import StammdatenForm from "./StammdatenForm";
import { VERKAUFSTEAM_FRAGEN } from "@/lib/spielregeln";
import { datum } from "../format";

export const metadata: Metadata = { title: "Stammdaten" };
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  entwurf: "Noch nicht eingereicht",
  eingereicht: "Gespeichert",
  freigegeben: "Gespeichert und gültig",
};

export default async function MarkeDaten({ searchParams }: { searchParams: Promise<{ willkommen?: string }> }) {
  const { willkommen } = await searchParams;
  const m = await requireMarke();
  const k = await ladeKonditionen(m.brandId);
  const status = k?.status ?? "entwurf";

  return (
    <>
      <div className="mp-kopfzeile">
        <div>
          <h1 className="mp-h1">Stammdaten</h1>
          <p className="mp-leise">Was wir für Gutschrift, Rechnung und Überweisung brauchen. Deine Produkte trägst du unter <a href="/marke/artikel">Artikel</a> ein.</p>
        </div>
        <span className={status === "freigegeben" ? "mp-marke mp-marke--licht" : "mp-marke"}>
          {STATUS[status]}
          {status === "freigegeben" && k?.freigegeben_am ? ` am ${datum(k.freigegeben_am)}` : ""}
        </span>
      </div>

      {(willkommen || status === "entwurf") && (
        <ol className="mp-schritte" aria-label="Onboarding">
          <li aria-current="step"><strong>1 · Stammdaten</strong> prüfen, ergänzen und die <a href="/marke/spielregeln" target="_blank" rel="noopener">Spielregeln</a> annehmen</li>
          <li><strong>2 · Artikel</strong> prüfen, Preise und Bilder ergänzen</li>
        </ol>
      )}

      {k?.pruef_notiz && status !== "freigegeben" && (
        <p className="mp-hinweis mp-hinweis--warn"><strong>Hinweis von uns:</strong> {k.pruef_notiz}</p>
      )}
      {status === "freigegeben" && (
        <p className="mp-hinweis">
          Deine Daten gelten. Änderst du die IBAN, schauen wir vor der nächsten Auszahlung noch einmal drauf.
        </p>
      )}

      <StammdatenForm
        werte={{
          firma: k?.firma ?? "",
          strasse: k?.strasse ?? "",
          plz: k?.plz ?? "",
          ort: k?.ort ?? "",
          land: k?.land ?? "DE",
          rechnungs_email: k?.rechnungs_email ?? m.email,
          ansprechpartner: k?.ansprechpartner ?? "",
          telefon: k?.telefon ?? "",
          logistik_kontakt: k?.logistik_kontakt ?? "",
          nachschub_email: k?.nachschub_email ?? "",
          ust_idnr: k?.ust_idnr ?? "",
          steuernummer: k?.steuernummer ?? "",
          iban: k?.iban ?? "",
          bic: k?.bic ?? "",
          kontoinhaber: k?.kontoinhaber ?? "",
          gutschrift_zustimmung: Boolean(k?.gutschrift_zustimmung_am),
          spielregeln_zustimmung: Boolean(k?.spielregeln_angenommen_am),
          vt_tasting: k?.verkaufsteam?.tasting === true ? "ja" : k?.verkaufsteam?.tasting === false ? "nein" : "",
          ...Object.fromEntries(VERKAUFSTEAM_FRAGEN.map((q) => [`vt_${q.key}`, String(k?.verkaufsteam?.[q.key] ?? "")])),
        }}
        zustimmungText={GUTSCHRIFT_ZUSTIMMUNG_TEXT}
        bereitsEingereicht={status !== "entwurf"}
      />
    </>
  );
}

import { PageShell } from "@/app/(intern)/_components/ui/surfaces";
import EtikettenClient from "./EtikettenClient";

/**
 * Regaletiketten fuer den Thermodrucker (Phomemo M110S, 40x30 mm): Preis,
 * Verkaeufer, Grundpreis und QR zum Bewerten. Anders als der QR-Bogen
 * (Register 04, A4 zum Ausschneiden) kommt der Preis aus dem SumUp-Export —
 * feedback_products kennt keine Preise.
 */
export default function EtikettenPage() {
  return (
    <PageShell
      eyebrow="Register 07"
      title="Regaletiketten"
      lead="SumUp-Artikelexport hochladen, Etiketten auswählen, PDF für den M110S herunterladen. Fehlende Artikel werden dabei als Feedback-Produkt angelegt, damit der QR-Code auf ihre Bewertungsseite führt."
    >
      <EtikettenClient />
    </PageShell>
  );
}

import { headers } from "next/headers";
import QRCode from "qrcode";
import { getProducts } from "@/lib/feedback";
import { EmptyState, PageShell } from "@/app/(intern)/_components/ui/surfaces";
import PrintSheetClient from "./PrintSheetClient";

export const dynamic = "force-dynamic";

/**
 * Etikettenbogen: der Weg vom Bildschirm ans Regal. Bisher blieb nur
 * Rechtsklick-Speichern auf jedem einzelnen QR-Code.
 *
 * QR mit 480px erzeugt, damit die Etiketten auch bei 300 dpi scharf bleiben —
 * die Liste nutzt 220px, das wäre hier zu grob.
 */
export default async function PrintSheetPage() {
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const products = await getProducts();
  const etiketten = await Promise.all(
    products.map(async (p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      store: p.store,
      shelf: p.shelf_code,
      batch: p.batch,
      qr: await QRCode.toDataURL(`${baseUrl}/feedback/r/${p.id}`, { margin: 1, width: 480 }),
    }))
  );

  if (etiketten.length === 0) {
    return (
      <PageShell
        breit
        eyebrow="Register 04"
        title="Etikettenbogen"
        back={{ href: "/feedback/admin", label: "Produkte" }}
      >
        <EmptyState
          titel="Keine aktiven Produkte."
          text="Archivierte Produkte kommen nicht auf den Bogen — sie sollen im Store nicht mehr gescannt werden."
        />
      </PageShell>
    );
  }

  return <PrintSheetClient etiketten={etiketten} />;
}

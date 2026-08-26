import { headers } from "next/headers";
import Link from "next/link";
import QRCode from "qrcode";
import { Printer } from "lucide-react";
import {
  getAllProductQuestionSetLinks,
  getProductInterestCounts,
  getProducts,
  getQuestionSets,
  getRatingCountsByProduct,
} from "@/lib/feedback";
import { PageShell, Stamp } from "@/app/(intern)/_components/ui/surfaces";
import NewProductPanel from "./_components/NewProductPanel";
import ProductList, { type ProduktZeile } from "./_components/ProductList";
import type { SetOption } from "./_components/ProductForm";

export const dynamic = "force-dynamic";

async function getBaseUrl(): Promise<string> {
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${protocol}://${host}`;
}

export default async function FeedbackAdminPage() {
  const [products, baseUrl, questionSets, links, ratingCounts, interestCounts] = await Promise.all([
    getProducts({ includeArchived: true }),
    getBaseUrl(),
    getQuestionSets(),
    getAllProductQuestionSetLinks(),
    getRatingCountsByProduct(),
    getProductInterestCounts(),
  ]);

  const zeilen: ProduktZeile[] = await Promise.all(
    products.map(async (p) => {
      const targetUrl = `${baseUrl}/feedback/r/${p.id}`;
      const setIds = links.filter((l) => l.product_id === p.id).map((l) => l.question_set_id);
      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        store: p.store,
        shelf_code: p.shelf_code,
        batch: p.batch,
        price_enabled: p.price_enabled,
        setIds,
        archiviert: p.archived_at != null,
        qr: await QRCode.toDataURL(targetUrl, { margin: 1, width: 220 }),
        targetUrl,
        setNames: setIds
          .map((id) => questionSets.find((s) => s.id === id)?.name)
          .filter((n): n is string => Boolean(n)),
        bewertungen: ratingCounts[p.id] ?? 0,
        leads: interestCounts[p.id] ?? 0,
      };
    })
  );

  const setOptions: SetOption[] = questionSets.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    fragen: s.questions.length,
  }));

  // Häufigster Store der Bestandsprodukte als Vorbelegung — im Pilotbetrieb
  // landet fast alles am selben Standort.
  const storeVorschlag = haeufigster(
    products.map((p) => p.store).filter((s): s is string => Boolean(s))
  );

  const aktive = zeilen.filter((z) => !z.archiviert).length;

  return (
    <PageShell
      breit
      eyebrow="Register 01"
      title="Produkte & QR-Codes"
      lead="Jedes Produkt bekommt einen QR-Code fürs Regal. Was danach gefragt wird, hängt an den zugeordneten Fragensets."
      actions={
        aktive > 0 && (
          <Link
            href="/feedback/admin/print"
            className="inline-flex items-center gap-1.5 text-sm px-4 py-2.5 min-h-11 rounded-sm border border-bronze/40 text-bronze hover:border-bronze hover:bg-bronze/10 transition-colors"
          >
            <Printer size={15} /> Etikettenbogen
          </Link>
        )
      }
    >
      {setOptions.length === 0 && (
        <div className="mb-5">
          <Stamp tone="warn" tilt>
            Noch keine Fragensets
          </Stamp>
          <p className="text-stone text-xs mt-2">
            Ohne Fragenset wird nur die hedonische Skala („Wie gefällt dir das Produkt insgesamt?“)
            gefragt.{" "}
            <Link href="/feedback/admin/questions" className="text-bronze underline">
              Fragensets anlegen
            </Link>
          </p>
        </div>
      )}

      <NewProductPanel
        questionSets={setOptions}
        storeVorschlag={storeVorschlag}
        offenBeimStart={products.length === 0}
      />

      <ProductList produkte={zeilen} questionSets={setOptions} />
    </PageShell>
  );
}

function haeufigster(werte: string[]): string | undefined {
  if (werte.length === 0) return undefined;
  const counts = new Map<string, number>();
  for (const w of werte) counts.set(w, (counts.get(w) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getBrands } from "@/lib/pipeline";
import { erfasseSendung } from "@/lib/wareneingang";
import SendungForm from "../_components/SendungForm";

async function speichern(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  const eingegangenVon = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";

  const eans = formData.getAll("ean") as string[];
  const namen = formData.getAll("artikel_name") as string[];
  const mengen = formData.getAll("menge") as string[];
  const mhds = formData.getAll("mhd") as string[];

  const artikel = eans
    .map((ean, i) => ({
      ean,
      artikel_name: namen[i] || null,
      menge: Number(mengen[i]),
      mhd: mhds[i] || null,
    }))
    .filter((a) => a.ean && a.menge > 0);

  if (artikel.length === 0) return;

  const sendung = await erfasseSendung({
    standort_id: (formData.get("standort_id") as string) || "alexa-berlin",
    brand_id: (formData.get("brand_id") as string) || null,
    dhl_tracking_nr: (formData.get("dhl_tracking_nr") as string) || null,
    eingegangen_von: eingegangenVon,
    artikel,
  });

  redirect(`/wareneingang/${sendung.id}`);
}

export default async function NeuerWareneingangPage() {
  const brands = await getBrands();

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <Link href="/wareneingang" className="text-stone text-xs font-mono hover:text-bronze transition-colors">
            ← Wareneingang
          </Link>
          <h1 className="text-cream text-4xl tracking-widest mt-3" style={{ fontFamily: "var(--font-bebas)" }}>
            Paket erfassen
          </h1>
        </div>
        <SendungForm brands={brands} saveAction={speichern} />
      </div>
    </div>
  );
}

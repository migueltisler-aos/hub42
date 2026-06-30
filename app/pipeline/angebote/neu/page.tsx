import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getBrands } from "@/lib/pipeline";
import { upsertAngebot, parseAngebotForm } from "@/lib/angebote";
import AngebotForm, { type BrandOption } from "../_components/AngebotForm";

async function saveAngebot(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  const createdBy = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";

  const angebot = await upsertAngebot(null, {
    ...parseAngebotForm(formData),
    created_by: createdBy,
  });

  redirect(`/pipeline/angebote/${angebot.id}`);
}

export default async function NeuAngebotPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const { brand } = await searchParams;
  const brands = await getBrands();
  const brandOptions: BrandOption[] = brands
    .filter((b) => b.status !== "Inaktiv")
    .map((b) => ({ id: b.id, name: b.name, ansprechpartner: b.ansprechpartner }));

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <Link
            href="/pipeline/angebote"
            className="text-stone text-xs font-mono hover:text-bronze transition-colors"
          >
            ← Angebote
          </Link>
          <h1
            className="text-cream text-4xl tracking-widest mt-3"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Neues Angebot
          </h1>
        </div>
        <AngebotForm brands={brandOptions} presetBrandId={brand} saveAction={saveAngebot} />
      </div>
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getBrands } from "@/lib/pipeline";
import {
  getAngebot,
  upsertAngebot,
  deleteAngebot,
  parseAngebotForm,
} from "@/lib/angebote";
import AngebotForm, { type BrandOption } from "../_components/AngebotForm";

async function saveAngebot(id: string, formData: FormData) {
  "use server";
  await upsertAngebot(id, parseAngebotForm(formData));
  redirect("/pipeline/angebote");
}

async function removeAngebot(id: string) {
  "use server";
  await deleteAngebot(id);
  redirect("/pipeline/angebote");
}

export default async function AngebotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const angebot = await getAngebot(id);
  if (!angebot) notFound();

  const brands = await getBrands();
  const brandOptions: BrandOption[] = brands.map((b) => ({
    id: b.id,
    name: b.name,
    ansprechpartner: b.ansprechpartner,
  }));

  const saveWithId = saveAngebot.bind(null, id);
  const removeWithId = removeAngebot.bind(null, id);

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
          <div className="flex items-baseline gap-4 mt-3 flex-wrap">
            <h1
              className="text-cream text-4xl tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              {angebot.angebot_nr}
            </h1>
            <span className="text-stone text-xs font-mono">
              {angebot.empfaenger_name ?? "—"} · {angebot.status}
            </span>
          </div>
        </div>
        <AngebotForm
          angebot={angebot}
          brands={brandOptions}
          saveAction={saveWithId}
          deleteAction={removeWithId}
        />
      </div>
    </div>
  );
}

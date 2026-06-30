import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getBrand, upsertBrand } from "@/lib/pipeline";
import { getAngeboteForBrand, computeAngebot, formatEUR } from "@/lib/angebote";
import BrandForm from "../_components/BrandForm";

async function saveBrand(id: string, formData: FormData) {
  "use server";
  await upsertBrand(id, {
    name: formData.get("name") as string,
    website: (formData.get("website") as string) || null,
    instagram: (formData.get("instagram") as string) || null,
    email: (formData.get("email") as string) || null,
    linkedin: (formData.get("linkedin") as string) || null,
    ansprechpartner: (formData.get("ansprechpartner") as string) || null,
    kategorie: (formData.get("kategorie") as string) || null,
    produkt: (formData.get("produkt") as string) || null,
    preisrange: (formData.get("preisrange") as string) || null,
    standort: (formData.get("standort") as string) || null,
    gefunden_via: (formData.get("gefunden_via") as string) || null,
    zugewiesen: (formData.get("zugewiesen") as string) || null,
    status: ((formData.get("status") as string) || "Neu") as import("@/lib/pipeline").BrandStatus,
    kanal: (formData.get("kanal") as string) || null,
    hub42_fit: (formData.get("hub42_fit") as string) || null,
    hub42_potenzial: (formData.get("hub42_potenzial") as string) || null,
    datum_erstkontakt: (formData.get("datum_erstkontakt") as string) || null,
    datum_letzte_aktion: new Date().toISOString().split("T")[0],
    naechste_aktion: (formData.get("naechste_aktion") as string) || null,
    datum_naechste_aktion: (formData.get("datum_naechste_aktion") as string) || null,
    feedback: (formData.get("feedback") as string) || null,
    notizen: (formData.get("notizen") as string) || null,
  });

  redirect("/pipeline");
}

async function deactivateBrand(id: string, formData: FormData) {
  "use server";
  const kommentar = (formData.get("kommentar") as string).trim();
  await upsertBrand(id, {
    status: "Inaktiv",
    feedback: kommentar || null,
    datum_letzte_aktion: new Date().toISOString().split("T")[0],
  });
  redirect("/pipeline");
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const currentUser = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";

  const brandOrNull = await getBrand(id);
  if (!brandOrNull) notFound();
  const brand = brandOrNull!;

  const angebote = await getAngeboteForBrand(id);

  const saveWithId = saveBrand.bind(null, id);
  const deactivateWithId = deactivateBrand.bind(null, id);

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <Link href="/pipeline" className="text-stone text-xs font-mono hover:text-bronze transition-colors">
            ← Pipeline
          </Link>
          <div className="flex items-baseline gap-4 mt-3">
            <h1
              className="text-cream text-4xl tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              {brand.name}
            </h1>
            <span className="text-stone text-xs font-mono">
              angelegt {new Date(brand.created_at).toLocaleDateString("de-DE")}
              {brand.created_by ? ` von ${brand.created_by}` : ""}
            </span>
          </div>
        </div>
        {/* Angebote zu dieser Brand */}
        <div className="mb-8 border border-stone-dark bg-green-mid/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase">Angebote</p>
            <Link
              href={`/pipeline/angebote/neu?brand=${brand.id}`}
              className="px-3 py-1.5 bg-bronze text-green-dark text-xs font-mono font-semibold hover:bg-bronze-light transition-colors"
            >
              + Angebot
            </Link>
          </div>
          {angebote.length === 0 ? (
            <p className="text-stone/40 text-xs font-mono">Noch kein Angebot für diese Brand.</p>
          ) : (
            <ul className="divide-y divide-stone-dark/40">
              {angebote.map((a) => {
                const sum = computeAngebot(a.positionen, a.laufzeit_monate, a.ebenen ?? []);
                return (
                  <li key={a.id} className="flex items-center justify-between py-2 gap-3">
                    <Link href={`/pipeline/angebote/${a.id}`} className="flex-1 min-w-0">
                      <span className="text-cream font-mono text-xs">{a.angebot_nr}</span>
                      <span className="text-stone/50 text-xs ml-2">
                        {a.laufzeit_monate} Mon. · {formatEUR(sum.gesamtBrutto)} brutto
                      </span>
                    </Link>
                    <span className="text-stone text-xs font-mono shrink-0">{a.status}</span>
                    <Link
                      href={`/pipeline/angebote/${a.id}/print`}
                      className="text-bronze text-xs font-mono hover:underline shrink-0"
                    >
                      Druck ↗
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <BrandForm
          brand={brand}
          currentUser={currentUser}
          saveAction={saveWithId}
          deactivateAction={brand.status !== "Inaktiv" ? deactivateWithId : undefined}
        />
      </div>
    </div>
  );
}

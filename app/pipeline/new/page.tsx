import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { upsertBrand } from "@/lib/pipeline";
import BrandForm from "../_components/BrandForm";

async function saveBrand(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  const createdBy = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";

  await upsertBrand(null, {
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
    zugewiesen: (formData.get("zugewiesen") as string) || createdBy,
    status: ((formData.get("status") as string) || "Neu") as import("@/lib/pipeline").BrandStatus,
    kanal: (formData.get("kanal") as string) || null,
    hub42_fit: (formData.get("hub42_fit") as string) || null,
    datum_erstkontakt: (formData.get("datum_erstkontakt") as string) || null,
    datum_letzte_aktion: null,
    naechste_aktion: (formData.get("naechste_aktion") as string) || null,
    datum_naechste_aktion: (formData.get("datum_naechste_aktion") as string) || null,
    feedback: (formData.get("feedback") as string) || null,
    notizen: (formData.get("notizen") as string) || null,
    created_by: createdBy,
  });

  redirect("/pipeline");
}

export default async function NewBrandPage() {
  const cookieStore = await cookies();
  const currentUser = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <Link href="/pipeline" className="text-stone text-xs font-mono hover:text-bronze transition-colors">
            ← Pipeline
          </Link>
          <h1
            className="text-cream text-4xl tracking-widest mt-3"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Neue Brand
          </h1>
        </div>
        <BrandForm currentUser={currentUser} saveAction={saveBrand} />
      </div>
    </div>
  );
}

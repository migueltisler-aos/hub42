import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { brandFormToInput, upsertBrand } from "@/lib/pipeline";
import BrandForm from "../_components/BrandForm";

export const dynamic = "force-dynamic";

async function saveBrand(formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  const createdBy = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";

  const input = brandFormToInput(formData);
  await upsertBrand(null, {
    ...input,
    zugewiesen: input.zugewiesen ?? createdBy,
    datum_letzte_aktion: null,
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

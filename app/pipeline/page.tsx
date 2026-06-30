import { cookies } from "next/headers";
import Link from "next/link";
import { getBrands, updateStatus, type BrandStatus } from "@/lib/pipeline";
import PipelineClient from "./_components/PipelineClient";

async function updateStatusAction(id: string, status: BrandStatus) {
  "use server";
  await updateStatus(id, status);
}

export default async function PipelinePage() {
  const cookieStore = await cookies();
  const currentUser = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";

  const brands = await getBrands();

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-1">Hub42 Intern</p>
            <h1
              className="text-cream text-5xl tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Sales Pipeline
            </h1>
            <p className="text-stone text-xs font-mono mt-1">Eingeloggt als: {currentUser}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/pipeline/angebote"
              className="px-4 py-2 border border-bronze/40 text-bronze text-xs font-mono hover:border-bronze transition-colors"
            >
              Angebote
            </Link>
            <Link
              href="/pipeline/import"
              className="px-4 py-2 bg-bronze text-green-dark text-xs font-mono font-semibold hover:bg-bronze-light transition-colors"
            >
              + Import
            </Link>
            <Link
              href="/pipeline/new"
              className="px-4 py-2 border border-bronze/40 text-bronze text-xs font-mono hover:border-bronze transition-colors"
            >
              + Manuell
            </Link>
          </div>
        </div>

        <PipelineClient
          initialBrands={brands}
          currentUser={currentUser}
          updateStatusAction={updateStatusAction}
        />
      </div>
    </div>
  );
}

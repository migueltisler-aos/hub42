import { cookies } from "next/headers";
import Link from "next/link";
import { getAngebote, updateAngebotStatus, type AngebotStatus } from "@/lib/angebote";
import AngeboteClient from "./_components/AngeboteClient";

async function updateStatusAction(id: string, status: AngebotStatus) {
  "use server";
  await updateAngebotStatus(id, status);
}

export default async function AngebotePage() {
  const cookieStore = await cookies();
  const currentUser = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";

  const angebote = await getAngebote();

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/pipeline"
              className="text-stone text-xs font-mono hover:text-bronze transition-colors"
            >
              ← Pipeline
            </Link>
            <h1
              className="text-cream text-5xl tracking-widest mt-2"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Angebote
            </h1>
            <p className="text-stone text-xs font-mono mt-1">Eingeloggt als: {currentUser}</p>
          </div>
          <Link
            href="/pipeline/angebote/neu"
            className="px-4 py-2 bg-bronze text-green-dark text-xs font-mono font-semibold hover:bg-bronze-light transition-colors"
          >
            + Neues Angebot
          </Link>
        </div>

        <AngeboteClient
          initialAngebote={angebote}
          updateStatusAction={updateStatusAction}
        />
      </div>
    </div>
  );
}

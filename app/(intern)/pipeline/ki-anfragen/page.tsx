import { cookies } from "next/headers";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ZIELE, type ZielKey } from "@/lib/assistent-model";
import { anfrageInPipeline, getKiAnfragen } from "@/lib/ki-anfragen";

export const dynamic = "force-dynamic";

/* Wer den KI-Assistenten auf der Startseite benutzt hat (ohne Personendaten).
   Abbrecher sind warme Leads: Website, Produkte und Ziel sind bekannt, nur
   der Kontakt fehlt – den sucht das Outreach-Team über die Website. */

async function uebernehmen(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const user = (await cookies()).get("pipeline_user")?.value ?? "Unbekannt";
  await anfrageInPipeline(id, user);
  revalidatePath("/pipeline/ki-anfragen");
}

const SCHRITT: Record<string, string> = {
  website: "Website",
  ziel: "Ziel",
  start: "Start",
  reife: "Handelsreife",
  produkt: "Produkte",
  regal: "Regal",
  ergebnis: "Ergebnis gesehen",
  kontakt: "Kontaktformular",
  abgeschickt: "Abgeschickt",
};

const datum = (s: string) =>
  new Date(s).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" });

export default async function KiAnfragenPage({ searchParams }: { searchParams: Promise<{ alle?: string }> }) {
  const { alle } = await searchParams;
  const nurAbbrecher = alle !== "1";
  const anfragen = await getKiAnfragen(nurAbbrecher);

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between gap-4 mb-8 flex-wrap">
          <div>
            <Link href="/pipeline" className="text-stone text-xs font-mono hover:text-bronze transition-colors">
              ← Pipeline
            </Link>
            <h1 className="text-cream text-5xl tracking-widest mt-2" style={{ fontFamily: "var(--font-bebas)" }}>
              KI-Anfragen
            </h1>
            <p className="text-stone text-xs font-mono mt-1">
              Marken, die den Assistenten auf der Startseite genutzt haben. Ohne Name und E-Mail.
            </p>
          </div>
          <div className="flex gap-2 text-xs font-mono">
            <Link
              href="/pipeline/ki-anfragen"
              className={`px-3 py-2 border ${nurAbbrecher ? "border-bronze text-bronze" : "border-bronze/30 text-stone"}`}
            >
              Nur Abbrecher
            </Link>
            <Link
              href="/pipeline/ki-anfragen?alle=1"
              className={`px-3 py-2 border ${!nurAbbrecher ? "border-bronze text-bronze" : "border-bronze/30 text-stone"}`}
            >
              Alle
            </Link>
          </div>
        </div>

        {anfragen.length === 0 ? (
          <p className="text-stone text-sm">
            Noch keine Anfragen{nurAbbrecher ? " ohne Bewerbung" : ""}. Falls das nicht stimmen kann: Ist
            supabase/ki_anfragen_migration.sql schon gelaufen?
          </p>
        ) : (
          <div className="overflow-x-auto border border-bronze/20">
            <table className="w-full text-sm text-cream">
              <thead className="text-left text-stone text-[11px] font-mono uppercase tracking-wider">
                <tr className="border-b border-bronze/20">
                  <th className="p-3">Wann</th>
                  <th className="p-3">Marke</th>
                  <th className="p-3">Produkte</th>
                  <th className="p-3">Ziel</th>
                  <th className="p-3">Ausgestiegen bei</th>
                  <th className="p-3">Schätzung</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {anfragen.map((x) => {
                  const ziele = (x.antworten?.ziele ?? []).map((z) => ZIELE[z as ZielKey]?.label ?? z);
                  const insta = typeof x.karte?.instagram === "string" ? x.karte.instagram : "";
                  return (
                    <tr key={x.id} className="border-b border-bronze/10 align-top">
                      <td className="p-3 font-mono text-xs text-stone whitespace-nowrap">{datum(x.created_at)}</td>
                      <td className="p-3">
                        <p className="font-semibold">{x.marke ?? "–"}</p>
                        <a href={x.website.startsWith("http") ? x.website : `https://${x.website}`} target="_blank" rel="noreferrer" className="text-bronze text-xs hover:underline">
                          {x.website}
                        </a>
                        {insta && (
                          <a href={`https://instagram.com/${insta.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="block text-stone text-xs hover:text-bronze">
                            {insta}
                          </a>
                        )}
                      </td>
                      <td className="p-3 text-xs">
                        {(x.produkte ?? []).slice(0, 5).map((p) => (
                          <p key={p.titel}>
                            {p.titel}
                            {typeof p.preis === "number" && <span className="text-stone"> · {p.preis.toFixed(2).replace(".", ",")} €</span>}
                          </p>
                        ))}
                      </td>
                      <td className="p-3 text-xs">{ziele.join(", ") || "–"}</td>
                      <td className="p-3 text-xs">
                        <span className={x.abgeschickt ? "text-bronze" : ""}>{SCHRITT[x.schritt ?? ""] ?? x.schritt ?? "–"}</span>
                      </td>
                      <td className="p-3 text-xs font-mono whitespace-nowrap">
                        {x.antworten?.schaetzungMonat ? `${x.antworten.schaetzungMonat} Stk./M.` : "–"}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {x.pipeline_id ? (
                          <Link href={`/pipeline/${x.pipeline_id}`} className="text-bronze text-xs font-mono hover:underline">
                            In Pipeline →
                          </Link>
                        ) : (
                          <form action={uebernehmen}>
                            <input type="hidden" name="id" value={x.id} />
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-bronze text-green-dark text-xs font-mono font-semibold hover:bg-bronze-light transition-colors"
                            >
                              In Pipeline übernehmen
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

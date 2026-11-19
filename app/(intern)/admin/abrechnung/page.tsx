import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { alsBezahlt, finalisieren, ladeLauf } from "@/lib/abrechnung-lauf";
import { abrechnungsGrenzen, aktuellePeriode, euro } from "@/lib/abrechnung-model";
import { PageShell } from "../../_components/ui/surfaces";

export const dynamic = "force-dynamic";
export const metadata = { title: "Monatsabrechnung · Intern" };

const vormonat = () => {
  // Zuletzt abgeschlossene Abrechnungsperiode (Sondergrenzen beachtet)
  const [j, m] = aktuellePeriode().split("-").map(Number);
  return m === 1 ? `${j - 1}-12` : `${j}-${String(m - 1).padStart(2, "0")}`;
};
const gueltig = (z?: string) => (z && /^\d{4}-\d{2}$/.test(z) ? z : vormonat());

async function finalAktion(fd: FormData) {
  "use server";
  const monat = gueltig(String(fd.get("monat")));
  const von = (await cookies()).get("pipeline_user")?.value ?? "Team";
  let meldung = "Finalisiert, Belege liegen im Portal der Marke.";
  try {
    await finalisieren(String(fd.get("brand_id")), monat, von);
  } catch (e) {
    meldung = e instanceof Error ? e.message : String(e);
  }
  revalidatePath("/admin/abrechnung");
  redirect(`/admin/abrechnung?monat=${monat}&m=${encodeURIComponent(meldung)}`);
}

async function bezahltAktion(fd: FormData) {
  "use server";
  const monat = gueltig(String(fd.get("monat")));
  await alsBezahlt(String(fd.get("id")));
  revalidatePath("/admin/abrechnung");
  redirect(`/admin/abrechnung?monat=${monat}&m=${encodeURIComponent("Als überwiesen markiert.")}`);
}

export default async function AbrechnungAdmin({ searchParams }: { searchParams: Promise<{ monat?: string; m?: string }> }) {
  const { monat: roh, m: meldung } = await searchParams;
  const monat = gueltig(roh);
  // Eine Periode ist erst nach ihrem letzten Tag abrechenbar
  const laufend = new Date().toISOString() < abrechnungsGrenzen(monat).bis;
  const zeilen = await ladeLauf(monat);
  const knopf = "px-3 py-1.5 min-h-9 bg-bronze text-green-dark text-xs font-semibold hover:bg-bronze-light disabled:opacity-40";
  const knopf2 = "px-3 py-1.5 min-h-9 border border-stone-dark text-cream text-xs hover:border-bronze";

  return (
    <PageShell
      eyebrow="Marken-Portal"
      title="Monatsabrechnung"
      breit
      back={{ href: "/admin/marken", label: "Marken" }}
      lead="Gutschrift für die verkaufte Ware minus 7 % Provision, verrechnet mit der Regalmiete. Finalisieren vergibt die Nummern und legt die PDFs ins Portal der Marke."
      actions={
        <form className="flex gap-2 items-center">
          <input type="month" name="monat" defaultValue={monat} className="bg-green-dark border border-stone-dark text-cream text-sm px-2 py-1.5" />
          <button className={knopf2}>Anzeigen</button>
        </form>
      }
    >
      {meldung && <p className="mb-6 border-l-4 border-bronze bg-green-mid/40 px-4 py-3 text-cream text-sm" role="status">{meldung}</p>}
      {laufend && (
        <p className="mb-6 border-l-4 border-amber-300 bg-green-mid/40 px-4 py-3 text-cream text-sm">
          Der Monat läuft noch, die Zahlen sind vorläufig. Finalisieren erst nach Monatsende.
        </p>
      )}

      <div className="flex gap-4 mb-4 text-sm">
        <a className="text-bronze underline underline-offset-4" href={`/admin/abrechnung/export?monat=${monat}&format=csv`}>Kontroll-CSV</a>
        <a className="text-bronze underline underline-offset-4" href={`/admin/abrechnung/export?monat=${monat}&format=sepa`}>SEPA-Datei (pain.001)</a>
        <span className="text-stone">enthält alle finalen, noch nicht überwiesenen Auszahlungen</span>
      </div>

      {zeilen.length === 0 ? (
        <p className="text-stone">Keine Verkäufe und keine Miete in diesem Monat.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-cream">
            <thead>
              <tr className="text-left text-stone text-xs font-mono uppercase tracking-widest border-b border-stone-dark">
                <th className="py-2 pr-3">Marke</th>
                <th className="py-2 pr-3 text-right">Umsatz</th>
                <th className="py-2 pr-3 text-right">Gutschrift</th>
                <th className="py-2 pr-3 text-right">Miete</th>
                <th className="py-2 pr-3 text-right">Vortrag alt</th>
                <th className="py-2 pr-3 text-right">Auszahlung</th>
                <th className="py-2 pr-3">Stand</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {zeilen.map((z) => {
                const a = z.abrechnung;
                const s = z.gespeichert?.status;
                return (
                  <tr key={z.brandId} className="border-b border-stone-dark/50 align-top">
                    <td className="py-2.5 pr-3">
                      <Link href={`/admin/marken/${z.brandId}`} className="underline underline-offset-4 hover:text-bronze">{z.name}</Link>
                      {z.hindernisse.length > 0 && !s?.match(/final|bezahlt/) && (
                        <ul className="text-amber-300 text-xs mt-1">{z.hindernisse.map((h) => <li key={h}>· {h}</li>)}</ul>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-right">{euro(a.umsatz_brutto_ct)}</td>
                    <td className="py-2.5 pr-3 text-right">{euro(a.gs_brutto_ct)}</td>
                    <td className="py-2.5 pr-3 text-right">{a.rg_brutto_ct ? `− ${euro(a.rg_brutto_ct)}` : "–"}</td>
                    <td className="py-2.5 pr-3 text-right">{a.vortrag_alt_ct ? `− ${euro(a.vortrag_alt_ct)}` : "–"}</td>
                    <td className="py-2.5 pr-3 text-right font-semibold">
                      {euro(a.auszahlung_ct)}
                      {a.vortrag_neu_ct > 0 && <div className="text-stone text-xs font-normal">offen {euro(a.vortrag_neu_ct)}</div>}
                    </td>
                    <td className="py-2.5 pr-3 text-xs">
                      {s === "bezahlt" ? `überwiesen · ${z.gespeichert?.gs_nr}` : s === "final" ? `final · ${z.gespeichert?.gs_nr}` : "offen"}
                    </td>
                    <td className="py-2.5">
                      {!s || s === "entwurf" ? (
                        <form action={finalAktion}>
                          <input type="hidden" name="brand_id" value={z.brandId} />
                          <input type="hidden" name="monat" value={monat} />
                          <button className={knopf} disabled={laufend || z.hindernisse.length > 0}>Finalisieren</button>
                        </form>
                      ) : s === "final" ? (
                        <form action={bezahltAktion}>
                          <input type="hidden" name="id" value={z.gespeichert!.id} />
                          <input type="hidden" name="monat" value={monat} />
                          <button className={knopf2}>Überwiesen</button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-stone text-xs mt-6">
        Nach „Finalisieren“ wird der Monat aus den final gespeicherten Zahlen abgerechnet. Spätere Stornos an der Kasse ändern ihn
        nicht mehr und müssen im Folgemonat korrigiert werden.
      </p>
    </PageShell>
  );
}

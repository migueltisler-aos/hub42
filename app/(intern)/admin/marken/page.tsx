import Link from "next/link";
import { ladeMarkenUebersicht, ladeSumupAufgaben } from "@/lib/marken-admin";
import { sumupErledigtAktion } from "./actions";
import { PageShell } from "../../_components/ui/surfaces";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marken-Portal · Intern" };

const STATUS: Record<string, string> = {
  entwurf: "Entwurf",
  eingereicht: "Eingetragen",
  freigegeben: "Eingetragen",
};

export default async function MarkenAdmin() {
  const [marken, sumup] = await Promise.all([ladeMarkenUebersicht(), ladeSumupAufgaben()]);
  return (
    <PageShell
      eyebrow="Marken-Portal"
      title="Marken"
      breit
      lead="Zugang einladen, Daten ansehen, Regalfoto hochladen. Was Marken eintragen, gilt sofort; neue Artikel und Preisänderungen stehen unten auf der SumUp-Liste."
      actions={
        <Link href="/admin/abrechnung" className="text-bronze text-sm underline underline-offset-4">
          Monatsabrechnung →
        </Link>
      }
    >
      <section className="border border-stone-dark bg-green-mid/30 p-5 mb-8">
        <h2 className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-1">In SumUp anlegen oder ändern · {sumup.length}</h2>
        <p className="text-stone text-xs mb-4">
          Die Kasse ordnet Verkäufe über den Artikelnamen zu. Legt den Artikel in der SumUp-App genau mit diesem Namen und Preis an und klickt dann „Erledigt“.
        </p>
        {sumup.length === 0 ? (
          <p className="text-cream text-sm">Nichts offen.</p>
        ) : (
          <ul className="grid gap-2">
            {sumup.map((a) => (
              <li key={a.id}>
                <form action={sumupErledigtAktion} className="flex flex-wrap items-center gap-3 text-sm text-cream border-b border-stone-dark/50 pb-2">
                  <input type="hidden" name="artikel_id" value={a.id} />
                  <input type="hidden" name="zurueck" value="/admin/marken" />
                  <span className="text-stone w-40 shrink-0">{a.marke}</span>
                  <span className="flex-1 min-w-60">
                    <strong>{a.artikel_name}</strong> · {a.verkaufspreis.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                    <span className="block text-amber-300 text-xs">{a.hinweis}</span>
                  </span>
                  <button className="px-3 py-1.5 border border-stone-dark text-cream text-xs hover:border-bronze">Erledigt</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-stone text-xs font-mono uppercase tracking-widest border-b border-stone-dark">
              <th className="py-2 pr-4">Marke</th>
              <th className="py-2 pr-4">Zugänge</th>
              <th className="py-2 pr-4">Stammdaten</th>
              <th className="py-2 pr-4">Artikel offen</th>
              <th className="py-2 pr-4">Im Regal</th>
              <th className="py-2 pr-4">Ohne MwSt</th>
            </tr>
          </thead>
          <tbody>
            {marken.map((m) => (
              <tr key={m.id} className="border-b border-stone-dark/50 text-cream">
                <td className="py-2.5 pr-4">
                  <Link href={`/admin/marken/${m.id}`} className="underline underline-offset-4 hover:text-bronze">
                    {m.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-4">{m.nutzer || "–"}</td>
                <td className={`py-2.5 pr-4 ${m.status === "eingereicht" ? "text-amber-300 font-semibold" : ""}`}>
                  {m.status ? STATUS[m.status] : "–"}
                </td>
                <td className={`py-2.5 pr-4 ${m.offeneArtikel ? "text-amber-300 font-semibold" : ""}`}>{m.offeneArtikel || "–"}</td>
                <td className="py-2.5 pr-4">{m.artikelImRegal || "–"}</td>
                <td className={`py-2.5 pr-4 ${m.ohneSatz ? "text-amber-300" : ""}`}>{m.ohneSatz || "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

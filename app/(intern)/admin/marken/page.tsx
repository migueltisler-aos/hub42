import Link from "next/link";
import { ladeMarkenUebersicht } from "@/lib/marken-admin";
import { PageShell } from "../../_components/ui/surfaces";

export const dynamic = "force-dynamic";
export const metadata = { title: "Marken-Portal · Intern" };

const STATUS: Record<string, string> = {
  entwurf: "Entwurf",
  eingereicht: "Prüfen",
  freigegeben: "Freigegeben",
};

export default async function MarkenAdmin() {
  const marken = await ladeMarkenUebersicht();
  return (
    <PageShell
      eyebrow="Marken-Portal"
      title="Marken"
      breit
      lead="Zugang einladen, Stammdaten prüfen, Artikel freigeben, Regalfoto hochladen. Die Marke sieht alles unter /marke."
      actions={
        <Link href="/admin/abrechnung" className="text-bronze text-sm underline underline-offset-4">
          Monatsabrechnung →
        </Link>
      }
    >
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

import { getProductInterestLeads } from "@/lib/feedback";
import {
  Card,
  EmptyState,
  NoteBox,
  PageShell,
} from "@/app/(intern)/_components/ui/surfaces";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await getProductInterestLeads();

  const byProduct = new Map<string, typeof leads>();
  for (const lead of leads) {
    byProduct.set(lead.product_name, [...(byProduct.get(lead.product_name) ?? []), lead]);
  }
  const gruppen = [...byProduct.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <PageShell
      breit
      eyebrow="Register 07"
      title="Leads"
      lead="Wer nach einer Bewertung Interesse an genau diesem Produkt hinterlassen hat."
      back={{ href: "/feedback/admin", label: "Produkte" }}
    >
      <div className="mb-6">
        <NoteBox tone="warn">
          <strong className="font-semibold">Personenbezogene Daten.</strong> E-Mail-Adressen und
          Telefonnummern von Scouts, erhoben für Neuigkeiten zu einem konkreten Produkt. Nicht an
          Brands weitergeben, ohne vorher zu klären, wofür die Kontakte genutzt werden dürfen — die
          Zustimmung galt dem Produkt, nicht dem Hersteller.
        </NoteBox>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          titel="Noch keine Leads."
          text="Die Frage nach dem Kontakt erscheint direkt nach einer Bewertung."
        />
      ) : (
        <div className="space-y-4">
          {gruppen.map(([productName, productLeads]) => (
            <Card key={productName} className="p-4 sm:p-5">
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h2 className="text-green-dark text-lg font-semibold leading-snug">
                  {productName}
                </h2>
                <span className="text-stone-dark text-xs font-mono tabular-nums shrink-0">
                  {productLeads.length} Kontakt{productLeads.length === 1 ? "" : "e"}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-stone-dark text-[10px] font-mono uppercase tracking-[0.16em]">
                      <th className="text-left font-normal pb-1.5 pr-4">E-Mail</th>
                      <th className="text-left font-normal pb-1.5 pr-4">WhatsApp</th>
                      <th className="text-right font-normal pb-1.5 whitespace-nowrap">Datum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productLeads.map((lead) => (
                      <tr key={lead.id} className="border-t border-stone-dark/15">
                        <td className="py-1.5 pr-4">
                          {lead.email ? (
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-green-dark underline decoration-stone-dark/40 hover:decoration-green-dark"
                            >
                              {lead.email}
                            </a>
                          ) : (
                            <span className="text-stone-dark">—</span>
                          )}
                        </td>
                        <td className="py-1.5 pr-4 text-green-dark font-mono text-xs">
                          {lead.whatsapp || <span className="text-stone-dark">—</span>}
                        </td>
                        <td className="py-1.5 text-right text-stone-dark text-xs font-mono whitespace-nowrap">
                          {new Date(lead.created_at).toLocaleDateString("de-DE")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}

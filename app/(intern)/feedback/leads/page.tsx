import Link from "next/link";
import { getProductInterestLeads } from "@/lib/feedback";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await getProductInterestLeads();

  const byProduct = new Map<string, typeof leads>();
  for (const lead of leads) {
    byProduct.set(lead.product_name, [...(byProduct.get(lead.product_name) ?? []), lead]);
  }

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/feedback/admin" className="text-stone text-xs font-mono hover:text-bronze transition-colors">
          ← Feedback-Studio
        </Link>
        <h1
          className="text-cream text-4xl tracking-widest mt-3 mb-2"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Leads
        </h1>
        <p className="text-stone text-sm mb-8">
          Wer nach einer Bewertung Interesse an Neuigkeiten/Angeboten zu einem konkreten
          Produkt hinterlassen hat. Enthält personenbezogene Daten — nicht weitergeben ohne
          Rücksprache, wofür die Kontakte genutzt werden dürfen.
        </p>

        {leads.length === 0 && <p className="text-stone-dark text-sm">Noch keine Leads.</p>}

        <div className="space-y-6">
          {[...byProduct.entries()].map(([productName, productLeads]) => (
            <div key={productName} className="bg-sage-warm p-5">
              <h2 className="text-green-dark text-lg font-semibold mb-3">
                {productName} <span className="text-stone-dark text-sm">({productLeads.length})</span>
              </h2>
              <div className="space-y-1">
                {productLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between bg-sage px-3 py-2 text-sm">
                    <span className="text-green-dark">{lead.email || "—"}</span>
                    <span className="text-stone-dark">{lead.whatsapp || "—"}</span>
                    <span className="text-stone-dark text-xs">
                      {new Date(lead.created_at).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

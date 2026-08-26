import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { brandFormToInput, getBrand, upsertBrand } from "@/lib/pipeline";
import { getAngeboteForBrand, computeAngebot, formatEUR } from "@/lib/angebote";
import { sendMail } from "@/lib/mail";
import { logSentEmail, getEmailLogForBrand } from "@/lib/email-log";
import { getBrandEngagement } from "@/lib/analytics-links";
import { dauerLabel } from "@/lib/analytics-stats";
import BrandForm from "../_components/BrandForm";
import MailComposer from "../_components/MailComposer";

export const dynamic = "force-dynamic";

async function saveBrand(id: string, formData: FormData) {
  "use server";
  await upsertBrand(id, {
    ...brandFormToInput(formData),
    datum_letzte_aktion: new Date().toISOString().split("T")[0],
  });

  redirect("/pipeline");
}

async function deactivateBrand(id: string, formData: FormData) {
  "use server";
  const kommentar = (formData.get("kommentar") as string).trim();
  await upsertBrand(id, {
    status: "Inaktiv",
    feedback: kommentar || null,
    datum_letzte_aktion: new Date().toISOString().split("T")[0],
  });
  redirect("/pipeline");
}

async function sendColdEmailAction(id: string, formData: FormData) {
  "use server";
  const cookieStore = await cookies();
  const currentUser = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";

  const subject = (formData.get("subject") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();

  const brand = await getBrand(id);
  if (!brand?.email) {
    redirect(`/pipeline/${id}?mailerror=noemail`);
  }

  let sendErrorMessage: string | null = null;
  try {
    await sendMail({ to: brand.email!, subject, text: body, fromName: currentUser });
  } catch (err) {
    console.error("SMTP-Versand fehlgeschlagen", err);
    sendErrorMessage = err instanceof Error ? err.message : "Unbekannter Fehler";
  }

  if (sendErrorMessage) {
    redirect(`/pipeline/${id}?mailerror=send&reason=${encodeURIComponent(sendErrorMessage)}`);
  }

  await logSentEmail({ brandId: id, sender: currentUser, subject, body });

  const today = new Date().toISOString().split("T")[0];
  // Kein Anhängen an `notizen`: der Verlauf steht vollständig in
  // pipeline_email_log (logSentEmail oben) und wird unten unter
  // „Gesendete Anschreiben“ gerendert. Vorher wuchs das Notizen-Feld als
  // Logbuch mit — und weil die Fit-Bewertung damals Regex über genau dieses
  // Feld war, konnte ein Mail-Log das Fit-Label kippen.
  await upsertBrand(id, {
    kanal: "E-Mail",
    datum_erstkontakt: brand.datum_erstkontakt ?? today,
    datum_letzte_aktion: today,
    status: brand.status === "Neu" ? "Kontaktiert" : brand.status,
  });

  redirect(`/pipeline/${id}?mailsent=1`);
}

export default async function BrandDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mailsent?: string; mailerror?: string; reason?: string }>;
}) {
  const { id } = await params;
  const { mailsent, mailerror, reason } = await searchParams;
  const cookieStore = await cookies();
  const currentUser = cookieStore.get("pipeline_user")?.value ?? "Unbekannt";

  const brandOrNull = await getBrand(id);
  if (!brandOrNull) notFound();
  const brand = brandOrNull!;

  const angebote = await getAngeboteForBrand(id);
  const emailLog = await getEmailLogForBrand(id);
  const deckAktivitaet = await getBrandEngagement(id);

  const saveWithId = saveBrand.bind(null, id);
  const deactivateWithId = deactivateBrand.bind(null, id);
  const sendMailWithId = sendColdEmailAction.bind(null, id);

  return (
    <div className="min-h-screen bg-green-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <Link href="/pipeline" className="text-stone text-xs font-mono hover:text-bronze transition-colors">
            ← Pipeline
          </Link>
          <div className="flex items-baseline gap-4 mt-3">
            <h1
              className="text-cream text-4xl tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              {brand.name}
            </h1>
            <span className="text-stone text-xs font-mono">
              angelegt {new Date(brand.created_at).toLocaleDateString("de-DE")}
              {brand.created_by ? ` von ${brand.created_by}` : ""}
            </span>
          </div>
        </div>

        {mailsent && (
          <div className="border border-emerald-500/40 bg-emerald-950/20 px-4 py-3 mb-6 text-emerald-400 text-sm font-mono">
            E-Mail gesendet – Status und Kontakt-Historie wurden aktualisiert.
          </div>
        )}
        {mailerror === "noemail" && (
          <div className="border border-red-500/40 bg-red-950/20 px-4 py-3 mb-6 text-red-400 text-sm font-mono">
            Keine E-Mail-Adresse hinterlegt. Erst oben eintragen und speichern.
          </div>
        )}
        {mailerror === "send" && (
          <div className="border border-red-500/40 bg-red-950/20 px-4 py-3 mb-6 text-red-400 text-sm font-mono">
            Versand fehlgeschlagen{reason ? `: ${reason}` : " – SMTP-Zugangsdaten prüfen."}
          </div>
        )}

        {/* Deck-Aktivität — das Signal fürs Follow-up. Nur sichtbar, wenn die
            Brand über einen getaggten Link tatsächlich gelesen hat; ein leerer
            Block wäre hier nur Rauschen. */}
        {deckAktivitaet && (
          <div className="mb-8 border border-bronze/40 bg-bronze/5 p-4">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Deck-Aktivität
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-stone/50 text-[10px] font-mono uppercase tracking-[0.16em]">
                  Zuerst geöffnet
                </p>
                <p className="text-cream text-sm font-mono mt-0.5">
                  {new Date(deckAktivitaet.erste_oeffnung).toLocaleDateString("de-DE")}
                </p>
              </div>
              <div>
                <p className="text-stone/50 text-[10px] font-mono uppercase tracking-[0.16em]">
                  Zuletzt
                </p>
                <p className="text-cream text-sm font-mono mt-0.5">
                  {new Date(deckAktivitaet.letzte_oeffnung).toLocaleDateString("de-DE")}
                </p>
              </div>
              <div>
                <p className="text-stone/50 text-[10px] font-mono uppercase tracking-[0.16em]">
                  Sessions / Lesezeit
                </p>
                <p className="text-cream text-sm font-mono mt-0.5">
                  {deckAktivitaet.sessions} ·{" "}
                  {dauerLabel(Math.round(deckAktivitaet.lesezeit_ms / 1000))}
                </p>
              </div>
              <div>
                <p className="text-stone/50 text-[10px] font-mono uppercase tracking-[0.16em]">
                  Gelesen bis
                </p>
                <p className="text-cream text-sm font-mono mt-0.5">
                  {deckAktivitaet.tiefste_sektion ?? "—"}
                  {deckAktivitaet.tiefste_pct !== null && (
                    <span className="text-stone/40 ml-1.5">{deckAktivitaet.tiefste_pct}%</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Angebote zu dieser Brand */}
        <div className="mb-8 border border-stone-dark bg-green-mid/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase">Angebote</p>
            <Link
              href={`/pipeline/angebote/neu?brand=${brand.id}`}
              className="px-3 py-1.5 bg-bronze text-green-dark text-xs font-mono font-semibold hover:bg-bronze-light transition-colors"
            >
              + Angebot
            </Link>
          </div>
          {angebote.length === 0 ? (
            <p className="text-stone/40 text-xs font-mono">Noch kein Angebot für diese Brand.</p>
          ) : (
            <ul className="divide-y divide-stone-dark/40">
              {angebote.map((a) => {
                const sum = computeAngebot(a.positionen, a.laufzeit_monate, a.ebenen ?? []);
                return (
                  <li key={a.id} className="flex items-center justify-between py-2 gap-3">
                    <Link href={`/pipeline/angebote/${a.id}`} className="flex-1 min-w-0">
                      <span className="text-cream font-mono text-xs">{a.angebot_nr}</span>
                      <span className="text-stone/50 text-xs ml-2">
                        {a.laufzeit_monate} Mon. · {formatEUR(sum.gesamtBrutto)} brutto
                      </span>
                    </Link>
                    <span className="text-stone text-xs font-mono shrink-0">{a.status}</span>
                    <Link
                      href={`/pipeline/angebote/${a.id}/print`}
                      className="text-bronze text-xs font-mono hover:underline shrink-0"
                    >
                      Druck →
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <BrandForm
          brand={brand}
          currentUser={currentUser}
          saveAction={saveWithId}
          deactivateAction={brand.status !== "Inaktiv" ? deactivateWithId : undefined}
        />

        <div className="mt-8">
          <MailComposer
            brandEmail={brand.email}
            brandName={brand.name}
            ansprechpartner={brand.ansprechpartner}
            currentUser={currentUser}
            sendAction={sendMailWithId}
          />
        </div>

        {emailLog.length > 0 && (
          <div className="mt-8 border border-stone-dark bg-green-mid/10 p-4">
            <p className="text-bronze text-xs font-mono tracking-[0.3em] uppercase mb-3">
              Gesendete Anschreiben ({emailLog.length})
            </p>
            <div className="space-y-3">
              {emailLog.map((e) => (
                <details key={e.id} className="border border-stone-dark/60 group">
                  <summary className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer list-none hover:bg-green-mid/30 transition-colors">
                    <span className="text-cream text-xs font-mono truncate">{e.subject}</span>
                    <span className="text-stone/50 text-xs font-mono shrink-0">
                      {e.sender} · {new Date(e.sent_at).toLocaleDateString("de-DE")}
                    </span>
                  </summary>
                  <pre className="px-3 pb-3 text-stone text-xs font-mono whitespace-pre-wrap">
                    {e.body}
                  </pre>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

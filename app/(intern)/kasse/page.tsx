import { revalidatePath } from "next/cache";
import { fehlerText } from "./fehler";
import { ladeLetzteZahlungen, speichereUmfrage, synchronisiereZahlungen } from "@/lib/sumup";
import { ALTERSGRUPPEN, GESCHLECHTER, type Altersgruppe, type Geschlecht } from "@/lib/sumup-model";
import type { ActionState } from "@/lib/action-state";
import { PageShell } from "../_components/ui/surfaces";
import KasseClient from "./KasseClient";

export const dynamic = "force-dynamic";

async function umfrageSpeichern(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  "use server";
  const id = String(formData.get("transaktion_id") ?? "");
  const g = String(formData.get("geschlecht") ?? "");
  const a = String(formData.get("alter_gruppe") ?? "");

  if (!id) return { ok: false, message: "Keine Zahlung ausgewählt.", stamp: Date.now() };
  const geschlecht = GESCHLECHTER.some((x) => x.value === g) ? (g as Geschlecht) : null;
  const alter_gruppe = (ALTERSGRUPPEN as readonly string[]).includes(a) ? (a as Altersgruppe) : null;

  try {
    await speichereUmfrage(id, { geschlecht, alter_gruppe });
  } catch (e) {
    return { ok: false, message: `Nicht gespeichert: ${fehlerText(e)}`, stamp: Date.now() };
  }
  revalidatePath("/kasse");
  return { ok: true, message: "Gespeichert.", stamp: Date.now() };
}

export default async function KassePage() {
  // SumUp-Abruf darf die Seite nicht killen: ohne Netz/Key trotzdem die
  // bereits gespeicherten Zahlungen zeigen, mit Hinweis.
  let syncFehler: string | null = null;
  try {
    await synchronisiereZahlungen();
  } catch (e) {
    syncFehler = fehlerText(e);
  }
  const zahlungen = await ladeLetzteZahlungen();

  return (
    <PageShell
      eyebrow="Hub42 Kasse"
      title="Kasse"
      lead="Erst in der SumUp-App kassieren, dann hier die Zahlung antippen und ergänzen."
    >
      <KasseClient zahlungen={zahlungen} syncFehler={syncFehler} speichernAction={umfrageSpeichern} />
    </PageShell>
  );
}

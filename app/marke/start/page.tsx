import { redirect } from "next/navigation";
import { ladeKonditionen, requireMarke } from "@/lib/marke";

export const dynamic = "force-dynamic";

// Ziel nach dem Login: solange die Stammdaten nicht eingereicht sind, geht es
// zuerst dorthin (danach weiter zu den Artikeln), sonst zur Übersicht.
export default async function MarkeStart() {
  const m = await requireMarke();
  const k = await ladeKonditionen(m.brandId);
  redirect(!k || k.status === "entwurf" ? "/marke/daten?willkommen=1" : "/marke");
}

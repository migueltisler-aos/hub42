import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ladeHeute } from "@/lib/crm-heute";
import { personAus } from "@/lib/crm-heute-model";
import HeuteAnsicht from "./HeuteAnsicht";
import { werAus } from "./logik";

export const metadata: Metadata = { title: "Aufgaben" };

/* Startscreen des CRM. Ohne ?wer= gilt die Person aus dem Login-Cookie,
   ?wer=Ralf|Anke|Miguel|Oliver|Alle wählt eine andere Ansicht. */
export default async function AufgabenPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ wer }, cookieStore, daten] = await Promise.all([searchParams, cookies(), ladeHeute()]);
  const ich = personAus(cookieStore.get("pipeline_user")?.value);
  return <HeuteAnsicht start={werAus(wer, ich)} ich={ich} daten={daten} />;
}

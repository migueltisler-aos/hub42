import type { Metadata } from "next";
import HeuteAnsicht from "./HeuteAnsicht";
import { werAus } from "./logik";

export const metadata: Metadata = { title: "Heute" };

/* Startscreen des CRM. Daten kommen in dieser Runde nur aus fixture.ts;
   ?wer=Anke|Miguel|Oliver|Alle wählt die Person, ohne Parameter gilt ICH. */
export default async function HeutePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { wer } = await searchParams;
  return <HeuteAnsicht start={werAus(wer)} />;
}

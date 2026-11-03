import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ladeAllgemeineAufgaben } from "@/lib/crm-pipeline";
import { personAus } from "@/lib/crm-heute-model";
import { werAus } from "../logik";
import AufgabenAnsicht from "./AufgabenAnsicht";

export const metadata: Metadata = { title: "Aufgaben" };

/* Allgemeine Aufgaben ohne Marke. Sales-Aufgaben stehen unter /crm/pipeline.
   Ohne ?wer= gilt die Person aus dem Login-Cookie. */
export default async function AufgabenPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ wer }, cookieStore, daten] = await Promise.all([searchParams, cookies(), ladeAllgemeineAufgaben()]);
  const ich = personAus(cookieStore.get("pipeline_user")?.value);
  return <AufgabenAnsicht start={werAus(wer, ich)} ich={ich} daten={daten} />;
}
